from django.db import transaction, connection
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import ProtectedError
from rest_framework import viewsets, mixins, status, permissions
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
    OperatorBookingCancelSerializer, SpotOperatorUpdateSerializer, 
    OperatorAssignSerializer
)
from .validators import validate_booking_window
from .swagger import ErrorSerializer
from .services import PaymentService, BookingNotificationService, CancellationService, SpotUpdateService
from rest_framework.exceptions import ValidationError
from django.db.utils import OperationalError
from django.http import Http404


class ParkingLotViewSet(viewsets.ModelViewSet):
    queryset = ParkingLot.objects.all().prefetch_related("spots").order_by('name')

    def get_serializer_class(self):
        if self.action == 'list':
            return ParkingLotSerializer
        return ParkingLotDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated, permissions.IsAdminUser]
        return super().get_permissions()
    
    @extend_schema(summary="[Admin] Create a new lot")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @extend_schema(summary="[Admin] Update a lot")
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @extend_schema(summary="[Admin] Partially update a lot")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(summary="[Admin] Delete a lot")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    def perform_destroy(self, instance):
        active_bookings = Booking.objects.filter(
            spot__lot=instance,
            status='confirmed',
            end_at__gt=timezone.now()
        ).exists()
        
        if active_bookings:
            raise ValidationError(
                {'detail': 'Cannot delete lot. It has spots with active or future bookings.'},
                code='active_bookings_exist'
            )
        
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                {'detail': 'Cannot delete lot. Its spots have a history of past bookings.'},
                code='past_bookings_exist'
            )

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
        summary="Detailed info about lot",
        description="Returns detailed information about a specific parking lot, including a list of parking spots (/api/v1/lots/{id}/).",
        responses={
            200: ParkingLotDetailSerializer,
            404: OpenApiResponse(ErrorSerializer, description="Lot not found"),
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class SpotViewSet(mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.DestroyModelMixin,
                  viewsets.GenericViewSet):
    serializer_class = SpotSerializer

    def get_queryset(self):
        lot_id = self.kwargs.get("lot_pk")
        qs = Spot.objects.select_related("lot").all()
        if lot_id:
            get_object_or_404(ParkingLot, pk=lot_id)
            qs = qs.filter(lot_id=lot_id)

        available_from = self.request.query_params.get("available_from")
        available_to = self.request.query_params.get("available_to")

        if available_from and available_to:
            start = parse_datetime(available_from)
            end = parse_datetime(available_to)

            if start and end:
                booked_spots = Booking.objects.filter(
                    status="confirmed",
                    start_at__lt=end,
                    end_at__gt=start
                ).values_list('spot_id', flat=True)

                qs = qs.exclude(id__in=booked_spots)

        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated, (permissions.IsAdminUser | IsLotOperator)]
        return super().get_permissions()

    @extend_schema(
        summary="List of parking spots in a lot",
        description="List of all parking spots in a specific parking lot. "
                    "You can filter by type (EV, for disabled) and availability.",
        parameters=[
            OpenApiParameter(
                name="is_ev", required=False, type=bool,
                description="Filter: spots with EV charging (true/false)"
            ),
            OpenApiParameter(
                name="is_disabled", required=False, type=bool,
                description="Filter: spots for people with disabilities (true/false)"
            ),
            OpenApiParameter(
                name="available_from", required=False, type=str,
                description="ISO datetime - show only available spots from this time"
            ),
            OpenApiParameter(
                name="available_to", required=False, type=str,
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
        try:
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL statement_timeout = '20000'")
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
    
            return super().list(request, *args, **kwargs)
        except OperationalError:
            return Response(
                {
                    "detail": "The search query is taking too long to process. Please try narrowing your search criteria.",
                    "error_code": "QUERY_TIMEOUT"
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
            
    @extend_schema(
        summary="Get parking spot details",
        description="Returns detailed information for a single parking spot.",
        responses={
            200: SpotSerializer,
            404: OpenApiResponse(ErrorSerializer, description="Spot not found or Lot not found"),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="[Operator] Create a new spot",
        description="Allows an operator to create a new parking spot within their assigned lot.",
        request=SpotSerializer,
        responses={
            201: SpotSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Validation Error (e.g., duplicate number)"),
            403: OpenApiResponse(ErrorSerializer, description="Forbidden - Not an operator for this lot"),
        }
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="create")
    @transaction.atomic
    def create_spot(self, request, lot_pk=None):
        lot = get_object_or_404(ParkingLot, pk=lot_pk)

        if not request.user.is_staff:
            operator_profile = getattr(request.user, "operator_profile", None)
            if not operator_profile or operator_profile.lot_id != int(lot_pk):
                return Response(
                    {"detail": "You cannot create spots in another lot."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        number = request.data.get("number")
        if Spot.objects.filter(lot=lot, number__iexact=number).exists():
            raise ValidationError({"number": "This spot number already exists in this lot."})

        serializer = SpotSerializer(data=request.data, context={"lot": lot})
        serializer.is_valid(raise_exception=True)
        serializer.save(lot=lot, created_by=request.user)
        
        response_data = serializer.data
        response_data["lot_name"] = lot.name
        return Response(response_data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="[Operator] Update spot properties",
        description="Allows an operator to update limited fields of a spot (e.g., 'is_ev', 'is_disabled').",
        request=SpotOperatorUpdateSerializer,
        responses={
            200: SpotOperatorUpdateSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Validation Error (e.g., trying to change number)"),
            403: OpenApiResponse(ErrorSerializer, description="Forbidden - Not an operator for this lot"),
        }
    )
    @action(detail=True, methods=["patch"], url_path="operator-update",
            permission_classes=[IsAuthenticated, IsLotOperator])
    @transaction.atomic
    def operator_update(self, request, lot_pk=None, pk=None):
        spot = self.get_object()
        serializer = SpotOperatorUpdateSerializer(spot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        SpotUpdateService.update_spot(spot, serializer.validated_data)
        return Response(serializer.data)

    @extend_schema(
        summary="[Operator] Delete a parking spot",
        description="Deletes a parking spot. Fails if the spot has any active (confirmed and future) bookings or protected past bookings.",
        responses={
            204: OpenApiResponse(description="Spot deleted successfully"),
            400: OpenApiResponse(ErrorSerializer, description="Cannot delete spot with active/past bookings"),
            403: OpenApiResponse(ErrorSerializer, description="Forbidden - Not an operator for this lot"),
            404: OpenApiResponse(ErrorSerializer, description="Spot not found"),
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        active_bookings = Booking.objects.filter(
            spot=instance,
            status='confirmed',
            end_at__gt=timezone.now()
        )

        if active_bookings.exists():
            raise ValidationError(
                {'detail': 'Cannot delete spot. There are active or future bookings associated with it.'},
                code='active_bookings_exist'
            )

        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                {'detail': 'Cannot delete spot. It has a history of past bookings and is protected from deletion.'},
                code='past_bookings_exist'
            )


class BookingViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Booking.objects.all().select_related("spot__lot", "user").order_by("-created_at")

        if not self.request.user.is_authenticated:
            return Booking.objects.none()

        if self.request.user.is_staff or self.action in ['my_lot_bookings', 'cancel_by_operator']:
            return qs
        
        return qs.filter(user=self.request.user)
    
    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    @extend_schema(
        summary="[Client] List my bookings",
        description="Returns a list of all bookings for the *current authenticated user*.",
        parameters=[
            OpenApiParameter(
                name="status", required=False, type=str, enum=["confirmed", "cancelled"],
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
        summary="[Client] Get booking details",
        description="Returns detailed information about a specific booking belonging to the *current user*.",
        responses={
            200: BookingSerializer,
            404: OpenApiResponse(ErrorSerializer, description="Booking not found or belongs to another user"),
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="[Client] Create a new booking",
        description="Creates a new parking spot booking. A mock payment process is initiated upon creation.",
        request=BookingCreateSerializer,
        responses={
            201: BookingSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Invalid time range or data"),
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
            409: OpenApiResponse(ErrorSerializer, description="The spot is already booked for this period"),
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
        try:
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL statement_timeout = '5000'") 
        
            try:
                locked_spot = Spot.objects.select_for_update(
                    nowait=False, 
                    skip_locked=False
                ).get(pk=spot.id)
            except Spot.DoesNotExist:
                return Response(
                    {"detail": "Parking spot not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            conflict = Booking.objects.filter(
                spot=locked_spot,
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
                spot=locked_spot,
                start_at=start_at,
                end_at=end_at,
                status="confirmed"
            )
            

            payment_data = PaymentService.initiate_payment(booking)
            BookingNotificationService.send_booking_confirmation(booking)
        
            response_data = BookingSerializer(booking).data
            response_data["payment"] = payment_data
            return Response(response_data, status=status.HTTP_201_CREATED)
        except OperationalError:
            return Response(
                {
                    "detail": "The booking service is temporarily unavailable. Please try again in a moment.",
                    "error_code": "DB_TIMEOUT"
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception:
            return Response(
                {"detail": "An unexpected error occurred. Please contact support."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="[Client] Cancel my booking",
        description="Cancels an existing booking *belonging to the current user*. A mock refund is triggered.",
        request=BookingCancelSerializer,
        responses={
            200: BookingSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Booking already cancelled"),
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
            404: OpenApiResponse(ErrorSerializer, description="Booking not found or belongs to another user"),
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
        BookingNotificationService.send_cancellation_confirmation(booking)
        return Response(BookingSerializer(booking).data)

    @extend_schema(
        summary="[Operator] List bookings for my lot",
        description="Returns a list of all bookings for the parking lot *assigned to the authenticated operator*.",
        responses={
            200: BookingSerializer(many=True),
            403: OpenApiResponse(ErrorSerializer, description="Forbidden - You are not an operator or not assigned to a lot"),
        }
    )
    @action(detail=False, methods=['get'], url_path='my-lot-bookings',
            permission_classes=[IsAuthenticated, (permissions.IsAdminUser | IsLotOperator)])
    def my_lot_bookings(self, request):

        queryset = self.get_queryset()
        if request.user.is_staff:
            queryset = queryset.filter(spot__lot_id__isnull=False)
        else:
            try:
                operator_profile = request.user.operator_profile
                operator_lot_id = operator_profile.lot_id
            except OperatorProfile.DoesNotExist:
                return Response({'detail': 'Користувач не є оператором (профіль не знайдено).'},
                                status=status.HTTP_403_FORBIDDEN)
            
            if operator_lot_id is None:
                return Response({'detail': 'За вами не закріплено жодного паркувального лоту.'},
                                status=status.HTTP_403_FORBIDDEN)

            queryset = queryset.filter(spot__lot_id=operator_lot_id)

        queryset = queryset.order_by('start_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BookingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = BookingSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="[Operator] Cancel a booking in my lot",
        description="Allows an operator to cancel *any* booking within their assigned lot. Requires a reason.",
        request=OperatorBookingCancelSerializer,
        responses={
            200: BookingSerializer,
            400: OpenApiResponse(ErrorSerializer, description="Booking already cancelled or completed"),
            403: OpenApiResponse(ErrorSerializer, description="Forbidden - You do not have permission for this booking's lot"),
            404: OpenApiResponse(ErrorSerializer, description="Booking not found"),
        }
    )
    @action(detail=True, methods=['post'], url_path='cancel-operator',
            permission_classes=[IsAuthenticated, (permissions.IsAdminUser | IsLotOperator)])
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
        cancellation_error = booking.check_cancellable_error() 
        
        if cancellation_error:
            return Response(
                {'detail': cancellation_error}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
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


class UserViewSet(mixins.RetrieveModelMixin,
                  mixins.ListModelMixin,
                  viewsets.GenericViewSet):
    http_method_names = ['get', 'post', 'patch', 'head', 'options', 'delete']
    queryset = User.objects.all().order_by('id')
    serializer_class = UserRegistrationSerializer

    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsAuthenticated(), permissions.IsAdminUser()]

    def get_serializer_class(self):
        if self.action == 'register':
            return UserRegistrationSerializer
        if self.action == 'me':
            if self.request.method == 'PATCH':
                return UserProfileUpdateSerializer
            return UserSerializer
        if self.action == 'make_operator':
            return OperatorAssignSerializer 
        return UserSerializer

    @extend_schema(
        summary="Register a new user",
        description="Creates a new user account. After registration, the user can log in.",
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(UserSerializer, description="User successfully created"),
            400: OpenApiResponse(ErrorSerializer, description="Validation error (e.g., username exists, weak password)"),
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
        summary="Get/Update current user profile",
        description="GET: Returns current user details (and checks if they are an operator). "
                    "PATCH: Updates profile data (first_name, last_name).",
        request=UserProfileUpdateSerializer,
        responses={
            200: UserSerializer,
            401: OpenApiResponse(ErrorSerializer, description="Authentication required"),
        }
    )

    def _get_user_with_profile(self, user_pk):
        """
        Helper method to safely retrieve user with operator_profile.
        Returns user object or raises Http404.
        """
        try:
            return User.objects.select_related('operator_profile').get(pk=user_pk)
        except User.DoesNotExist:
            raise Http404("User not found")
    
    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            user = self._get_user_with_profile(request.user.pk)
            return Response(self.get_serializer(user).data)
        
        elif request.method == 'PATCH':
            user = request.user
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            user.refresh_from_db()
            user_data = self._get_user_with_profile(user.pk)
            return Response(UserSerializer(user_data).data)
        
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    @extend_schema(
        summary="[Admin] Get any user details",
        description="Returns details for a specific user by ID.",
        responses={ 200: UserSerializer, 404: ErrorSerializer, 403: ErrorSerializer }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="[Admin] Make a user an Admin",
        description="Grants staff privileges to a user (user.is_staff = True).",
        responses={ 200: UserSerializer, 404: ErrorSerializer, 403: ErrorSerializer }
    )
    @action(detail=True, methods=['post'], url_path='make-admin')
    @transaction.atomic
    def make_admin(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser: 
            return Response({'detail': 'Cannot modify superuser status.'}, status=status.HTTP_403_FORBIDDEN)
        
        user.is_staff = True
        user.save(update_fields=['is_staff'])
        
        profile = getattr(user, 'operator_profile', None) 
        if profile:
            profile.delete()
            
        user.refresh_from_db()
        user_data = self._get_user_with_profile(user.pk) 
        return Response(UserSerializer(user_data).data, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary="[Admin] Remove Admin role",
        description="Revokes staff privileges from a user (user.is_staff = False).",
        responses={ 200: UserSerializer, 404: ErrorSerializer, 403: ErrorSerializer }
    )
    @action(detail=True, methods=['delete'], url_path='remove-admin')
    @transaction.atomic
    def remove_admin(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser:
            return Response({'detail': 'Cannot modify superuser status.'}, status=status.HTTP_403_FORBIDDEN)
        
        user.is_staff = False
        user.save(update_fields=['is_staff'])
        user_data = self._get_user_with_profile(user.pk) 
        return Response(UserSerializer(user_data).data, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary="[Admin] Assign a user as Lot Operator",
        description="Assigns a user to manage a specific lot. Replaces existing assignment.",
        request=OperatorAssignSerializer,
        responses={ 201: UserSerializer, 400: ErrorSerializer, 404: ErrorSerializer }
    )
    @action(detail=True, methods=['post'], url_path='make-operator')
    @transaction.atomic
    def make_operator(self, request, pk=None):
    
        user = self.get_object()
        if user.is_staff or user.is_superuser:
            return Response({'detail': 'Admins or Superusers cannot be assigned as operators.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lot = get_object_or_404(ParkingLot, pk=serializer.validated_data['lot_id'])

        _, _ = OperatorProfile.objects.update_or_create(
            user=user,
            defaults={'lot': lot}
        )
        
        user_data = self._get_user_with_profile(user.pk)
        return Response(UserSerializer(user_data).data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        summary="[Admin] Remove Operator role",
        description="Removes the operator profile from a user, revoking their operator access.",
        responses={ 204: OpenApiResponse(description="Role removed"), 404: ErrorSerializer }
    )
    @action(detail=True, methods=['delete'], url_path='remove-operator')
    @transaction.atomic
    def remove_operator(self, request, pk=None):
        user = self.get_object()
        profile = getattr(user, 'operator_profile', None)
        
        if profile:
            profile.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'detail': 'User is not an operator.'}, status=status.HTTP_404_NOT_FOUND)
