from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import ParkingLot, Spot, Booking
from .serializers import (
    ParkingLotSerializer, SpotSerializer,
    BookingSerializer, BookingCreateSerializer, BookingCancelSerializer
)
from .validators import validate_booking_window
from .swagger import DEFAULT_ERROR_RESPONSES, ErrorSerializer


class ParkingLotViewSet(viewsets.ModelViewSet):
    queryset = ParkingLot.objects.all()
    serializer_class = ParkingLotSerializer

    # GET /api/lots/
    @extend_schema(
        summary="List parking lots",
        description="Returns a paginated list of parking lots with coordinates.",
        responses={
            200: ParkingLotSerializer(many=True),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # POST /api/lots/
    @extend_schema(
        summary="Create a parking lot",
        request=ParkingLotSerializer,
        responses={
            201: ParkingLotSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Validation error"),
            409: OpenApiResponse(ErrorSerializer, description="Duplicate lot (same name and address)"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def create(self, request, *args, **kwargs):
        # приклад простої перевірки конфлікту
        name = request.data.get("name")
        address = request.data.get("address")
        if name and address and ParkingLot.objects.filter(name=name, address=address).exists():
            return Response({"detail": "Parking lot with this name and address already exists."},
                            status=status.HTTP_409_CONFLICT)
        return super().create(request, *args, **kwargs)

    # GET /api/lots/{id}/
    @extend_schema(
        summary="Retrieve a parking lot",
        responses={
            200: ParkingLotSerializer,
            404: OpenApiResponse(ErrorSerializer, description="Lot not found"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # PUT /api/lots/{id}/
    @extend_schema(
        summary="Replace a parking lot",
        request=ParkingLotSerializer,
        responses={
            200: ParkingLotSerializer,
            400: OpenApiResponse(ErrorSerializer),
            404: OpenApiResponse(ErrorSerializer),
            409: OpenApiResponse(ErrorSerializer, description="Duplicate lot"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    # PATCH /api/lots/{id}/
    @extend_schema(
        summary="Partially update a parking lot",
        request=ParkingLotSerializer,
        responses={
            200: ParkingLotSerializer,
            400: OpenApiResponse(ErrorSerializer),
            404: OpenApiResponse(ErrorSerializer),
            409: OpenApiResponse(ErrorSerializer),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    # DELETE /api/lots/{id}/
    @extend_schema(
        summary="Delete a parking lot",
        responses={
            204: OpenApiResponse(description="Deleted"),
            404: OpenApiResponse(ErrorSerializer, description="Lot not found"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class SpotViewSet(viewsets.ModelViewSet):
    queryset = Spot.objects.select_related("lot").all()
    serializer_class = SpotSerializer

    # GET /api/spots/
    @extend_schema(
        summary="List parking spots",
        description="Supports filtering by lot id and flags. Boolean values accept 'true' or 'false' (case-insensitive).",
        parameters=[
            OpenApiParameter(name="lot_id", required=False, type=int, description="Filter by parking lot id"),
            OpenApiParameter(name="is_ev", required=False, type=bool, description="Filter by EV-ready spots"),
            OpenApiParameter(name="is_disabled", required=False, type=bool, description="Filter by accessible/disabled spots"),
        ],
        responses={
            200: SpotSerializer(many=True),
            400: OpenApiResponse(ErrorSerializer, description="Invalid filter value (expected true/false)"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        }
    )
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        lot_id = request.query_params.get("lot_id")
        if lot_id:
            qs = qs.filter(lot_id=lot_id)

        def parse_bool(val, key):
            if val is None:
                return None
            low = val.lower()
            if low not in ("true", "false"):
                raise ValueError(f"{key} must be 'true' or 'false'")
            return low == "true"

        try:
            ev = parse_bool(request.query_params.get("is_ev"), "is_ev")
            dis = parse_bool(request.query_params.get("is_disabled"), "is_disabled")
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if ev is not None:
            qs = qs.filter(is_ev=ev)
        if dis is not None:
            qs = qs.filter(is_disabled=dis)

        self.queryset = qs
        return super().list(request, *args, **kwargs)

    # інші CRUD залишаємо успадкованими, але документуємо
    @extend_schema(
        summary="Create a parking spot",
        request=SpotSerializer,
        responses={
            201: SpotSerializer,
            400: OpenApiResponse(ErrorSerializer),
            409: OpenApiResponse(ErrorSerializer, description="Duplicate spot number within the same lot"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def create(self, request, *args, **kwargs):
        # можливий 409 на unique_together(lot, number) — БД кине 400,
        # але якщо хочеш саме 409, можна перевірити вручну, як у lots.
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Retrieve a parking spot",
        responses={
            200: SpotSerializer,
            404: OpenApiResponse(ErrorSerializer),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Replace a parking spot",
        request=SpotSerializer,
        responses={
            200: SpotSerializer,
            400: OpenApiResponse(ErrorSerializer),
            404: OpenApiResponse(ErrorSerializer),
            409: OpenApiResponse(ErrorSerializer),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update a parking spot",
        request=SpotSerializer,
        responses={
            200: SpotSerializer,
            400: OpenApiResponse(ErrorSerializer),
            404: OpenApiResponse(ErrorSerializer),
            409: OpenApiResponse(ErrorSerializer),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Delete a parking spot",
        responses={
            204: OpenApiResponse(description="Deleted"),
            404: OpenApiResponse(ErrorSerializer),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class BookingViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    queryset = Booking.objects.select_related("spot", "user").all()
    serializer_class = BookingSerializer

    # GET /api/bookings/
    @extend_schema(
        summary="List bookings",
        responses={
            200: BookingSerializer(many=True),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # GET /api/bookings/{id}/
    @extend_schema(
        summary="Retrieve a booking",
        responses={
            200: BookingSerializer,
            404: OpenApiResponse(ErrorSerializer, description="Booking not found"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # POST /api/bookings/create/
    @extend_schema(
        summary="Create a booking",
        request=BookingCreateSerializer,
        responses={
            201: BookingSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Invalid time window"),
            409: OpenApiResponse(ErrorSerializer, description="Overlapping booking"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    @action(detail=False, methods=["post"], url_path="create")
    @transaction.atomic
    def create_booking(self, request):
        ser = BookingCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        spot = ser.validated_data["spot"]
        start_at = ser.validated_data["start_at"]
        end_at = ser.validated_data["end_at"]
        validate_booking_window(start_at, end_at)

        conflict = Booking.objects.filter(
            spot=spot, status="confirmed",
            start_at__lt=end_at, end_at__gt=start_at
        ).exists()
        if conflict:
            return Response({"detail": "Spot already booked in this interval."},
                            status=status.HTTP_409_CONFLICT)

        b = Booking.objects.create(
            user=request.user if request.user.is_authenticated else None,
            spot=spot, start_at=start_at, end_at=end_at, status="confirmed"
        )
        return Response(BookingSerializer(b).data, status=status.HTTP_201_CREATED)

    # POST /api/bookings/{id}/cancel/
    @extend_schema(
        summary="Cancel a booking",
        request=BookingCancelSerializer,
        responses={
            200: BookingSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Booking already cancelled"),
            404: OpenApiResponse(ErrorSerializer, description="Booking not found"),
            **{k: v for k, v in DEFAULT_ERROR_RESPONSES.items() if k in (401, 403)}
        },
    )
    @action(detail=True, methods=["post"], url_path="cancel")
    @transaction.atomic
    def cancel(self, request, pk=None):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.status == "cancelled":
            return Response({"detail": "Booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = "cancelled"
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)
