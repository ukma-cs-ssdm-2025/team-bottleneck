from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import (
    extend_schema, OpenApiParameter, OpenApiResponse, OpenApiExample
)
from django.utils.dateparse import parse_datetime
from .permissions import IsLotOperator
from .models import ParkingLot, Spot, Booking, OperatorProfile
from .serializers import (
    ParkingLotSerializer, ParkingLotDetailSerializer, SpotSerializer, 
    BookingSerializer, BookingCreateSerializer, BookingCancelSerializer,
    UserRegistrationSerializer, UserSerializer, UserProfileUpdateSerializer,
    OperatorBookingCancelSerializer
)
from .validators import validate_booking_window
from .swagger import ErrorSerializer
from .services import PaymentService, BookingNotificationService, CancellationService

class ParkingLotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ParkingLot.objects.all().prefetch_related("spots").order_by('name') 
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ParkingLotDetailSerializer
        return ParkingLotSerializer 

    @extend_schema(
        summary="List of all lots",
        description="Return list of all available lots with base info (/api/v1/lots/).",
        responses={
            200: ParkingLotSerializer(many=True),
        },
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Detailed info about lot (free spots/services)",
        description="Returns detailed information about a specific parking lot, including a list of parking spots (/api/v1/lots/{id}/).",
        responses={
            200: ParkingLotDetailSerializer,
            404: OpenApiResponse(ErrorSerializer, description="Lot not found"),
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class SpotViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SpotSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        lot_id = self.kwargs.get("lot_pk")
        qs = Spot.objects.select_related("lot").all()
        if lot_id:
            get_object_or_404(ParkingLot, pk=lot_id)
            qs = qs.filter(lot_id=lot_id)
        return qs

    @extend_schema(
        summary="List of parking spots in a parking lot",
        description="List of all parking spots in a specific parking lot. "
                    "You can filter by type (EV, for disabled) and availability.",
        parameters=[
            OpenApiParameter(
                name="is_ev",
                required=False,
                type=bool,
                description="Filter: spots with EV charging (true/false)"
            ),
            OpenApiParameter(
                name="is_disabled",
                required=False,
                type=bool,
                description="Filter: spots for people with disabilities (true/false)"
            ),
            OpenApiParameter(
                name="available_from",
                required=False,
                type=str,
                description="ISO datetime - show only available spots from this time"
            ),
            OpenApiParameter(
                name="available_to",
                required=False,
                type=str,
                description="ISO datetime - show only available spots until this time"
            ),
        ],
        responses={
            200: SpotSerializer(many=True),
            400: OpenApiResponse(ErrorSerializer, description="Invalid filter parameters"),
            404: OpenApiResponse(ErrorSerializer, description="Parking lot not found"),
        }
    )
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        def parse_bool(val, key):
            if val is None:
                return None
            low = val.lower()
            if low not in ("true", "false"):
                raise ValueError(f"The parameter '{key}' must be 'true' or 'false'")
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

        available_from = request.query_params.get("available_from")
        available_to = request.query_params.get("available_to")

        if available_from and available_to:
            start = parse_datetime(available_from)
            end = parse_datetime(available_to)

            if not start or not end:
                return Response(
                    {"detail": "Invalid date format. Use ISO 8601 format."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Exclude spots that are booked during this period
            booked_spots = Booking.objects.filter(
                status="confirmed",
                start_at__lt=end,
                end_at__gt=start
            ).values_list('spot_id', flat=True)

            qs = qs.exclude(id__in=booked_spots)

        self.queryset = qs
        return super().list(request, *args, **kwargs)
    @action(
        detail=True,
        methods=["patch"],
        url_path="operator-update",
        permission_classes=[IsAuthenticated, IsLotOperator],
    )
    def operator_update(self, request, lot_pk=None, pk=None):
        spot = get_object_or_404(Spot, pk=pk, lot_id=lot_pk)
        serializer = SpotSerializer(spot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class BookingViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    """
    - GET /api/v1/bookings/
    - GET /api/v1/bookings/{id}/
    - POST /api/v1/bookings/create/
    - POST /api/v1/bookings/{id}/cancel/
    - GET /api/v1/bookings/my-lot-bookings/
    - POST /api/v1/bookings/{id}/cancel-operator/
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Booking.objects.all().select_related("spot__lot", "user").order_by("-created_at")

        if not self.request.user.is_authenticated:
            return Booking.objects.none()

        if self.action in ['my_lot_bookings', 'cancel_by_operator']:
            return qs
        return qs.filter(user=self.request.user)

    @extend_schema(
        summary="My bookings",
        description="Returns a list of all bookings for the current user (/api/v1/bookings/).",
        parameters=[
            OpenApiParameter(
                name="status",
                required=False,
                type=str,
                enum=["confirmed", "cancelled"],
                description="Filter by booking status"
            ),
        ],
        responses={
            200: BookingSerializer(many=True),
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
        },
    )
    def list(self, request, *args, **kwargs):
        status_filter = request.query_params.get("status")
        qs = self.get_queryset()

        if status_filter in ["confirmed", "cancelled"]:
            qs = qs.filter(status=status_filter)
        elif status_filter:
            return Response(
                {"detail": "Invalid status. Allowed: confirmed, cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )

        self.queryset = qs
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Booking details",
        description="Returns detailed information about a specific user booking (/api/v1/bookings/{id}/).",
        responses={
            200: BookingSerializer,
            404: OpenApiResponse(ErrorSerializer, description="Booking not found or belongs to another user"),
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Create a booking",
        description="Creates a new parking spot booking. After successful creation, a mock Stripe payment process is initiated. (/api/v1/bookings/create/)",
        request=BookingCreateSerializer,
        responses={
            201: BookingSerializer,
            400: OpenApiResponse(
                ErrorSerializer,
                description="Invalid time range or data"
            ),
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
            409: OpenApiResponse(
                ErrorSerializer,
                description="The spot is already booked for the selected period"
            ),
        },
        examples=[
            OpenApiExample(
                "Valid request",
                value={
                    "spot": 10,
                    "start_at": "2025-10-15T10:00:00Z",
                    "end_at": "2025-10-15T12:00:00Z"
                },
            ),
        ]
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
            spot=spot,
            status="confirmed",
            start_at__lt=end_at,
            end_at__gt=start_at
        ).exists()

        if conflict:
            return Response(
                {"detail": "This spot is already booked for the specified period."},
                status=status.HTTP_409_CONFLICT
            )

        booking = Booking.objects.create(
            user=request.user,
            spot=spot,
            start_at=start_at,
            end_at=end_at,
            status="confirmed"
        )

        payment_data = PaymentService.initiate_payment(booking)

        response_data = BookingSerializer(booking).data
        response_data["payment"] = payment_data

        return Response(response_data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Cancel a booking",
        description="Cancels an existing user booking. A mock refund process is triggered. (/api/v1/bookings/{id}/cancel/)",
        request=BookingCancelSerializer,
        responses={
            200: BookingSerializer,
            400: OpenApiResponse(
                ErrorSerializer,
                description="Booking already cancelled"
            ),
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
            404: OpenApiResponse(
                ErrorSerializer,
                description="Booking not found or belongs to another user"
            ),
        },
        examples=[
            OpenApiExample(
                "Valid request",
                value={"reason": "Changed plans"}
            ),
        ]
    )
    @action(detail=True, methods=["post"], url_path="cancel")
    @transaction.atomic
    def cancel(self, request, pk=None):
        booking = get_object_or_404(
            Booking,
            pk=pk,
            user=request.user
        )

        if booking.status == "cancelled":
            return Response(
                {"detail": "This booking has already been cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cancel_serializer = BookingCancelSerializer(data=request.data)
        cancel_serializer.is_valid(raise_exception=True)
        reason = cancel_serializer.validated_data.get("reason", "")

        booking.status = "cancelled"
        booking.cancellation_reason = reason
        booking.save(update_fields=["status", "cancellation_reason"])
        PaymentService.process_refund(booking)
        return Response(BookingSerializer(booking).data)
    
    @action(detail=False, methods=['get'], url_path='my-lot-bookings',
            permission_classes=[IsAuthenticated, IsLotOperator])
    def my_lot_bookings(self, request):
        try:
            operator_profile = request.user.operator_profile
            operator_lot_id = operator_profile.lot_id
        except OperatorProfile.DoesNotExist:
            return Response({'detail': 'Користувач не є оператором (профіль не знайдено).'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        if operator_lot_id is None:
            return Response({'detail': 'За вами не закріплено жодного паркувального лоту.'}, 
                            status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset().filter(
            spot__lot_id=operator_lot_id
        ).order_by('start_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BookingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = BookingSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_object(self):
        queryset = self.get_queryset()
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['post'], url_path='cancel-operator', 
            permission_classes=[IsAuthenticated, IsLotOperator])
    @transaction.atomic
    def cancel_by_operator(self, request, pk=None):
        try:
            booking = self.get_object() 
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)
                
        if booking.status == 'cancelled':
            return Response({'detail': 'Booking is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = OperatorBookingCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']
        
        refund_result = PaymentService.process_refund(booking)
        
        booking.status = 'cancelled'
        operator_reason = CancellationService.get_operator_cancellation_reason(
            operator_username=request.user.username,
            comment=reason
        )
        booking.cancellation_reason = operator_reason
        booking.save(update_fields=['status', 'cancellation_reason'])
        
        BookingNotificationService.send_cancellation_confirmation(booking)

        return Response({
            'detail': 'Booking successfully cancelled by operator.',
            'booking_id': booking.id,
            'reason': operator_reason,
            'refund_status': refund_result.get('status', 'N/A'),
        }, status=status.HTTP_200_OK)

class UserViewSet(viewsets.GenericViewSet):
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'register':
            return UserRegistrationSerializer
        if self.action == 'me':
            if self.request.method == 'PATCH':
                return UserProfileUpdateSerializer
            return UserSerializer
        return super().get_serializer_class()


    @extend_schema(
        summary="Registration of a new user",
        description="Creates a new user account with hashing the password. After registration, the user can use Basic Auth to log in.",
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(
                UserSerializer, 
                description="User successfully created"
            ),
            400: OpenApiResponse(
                ErrorSerializer,
                description="Validation error (e.g., username already exists, weak password)"
            ),
        }
    )
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response_serializer = UserSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    
    @extend_schema(
        summary="Get/Update current user profile info",
        description="GET: Returns current authenticated user details (Login check). PATCH: Updates profile data (first_name, last_name).",
        request=UserProfileUpdateSerializer,
        responses={
            200: UserSerializer,
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
        }
    )
    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            return Response(self.get_serializer(request.user).data)
        
        elif request.method == 'PATCH':
            user = request.user
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
