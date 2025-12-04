from rest_framework import serializers
from .models import ParkingLot, Spot, Booking, BackupLog
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
import re
from src.api.validators import validate_coordinates

class SpotSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    lot_name = serializers.CharField(source="lot.name", read_only=True)

    class Meta:
        model = Spot
        fields = ["id", "number", "is_ev", "is_disabled", "lot", "lot_name", "created_by", "created_by_username"]
        read_only_fields = ["lot", "created_by"]

    def get_created_by(self, obj):
        return obj.created_by.username if hasattr(obj, "created_by") and obj.created_by else None

    def validate(self, attrs):
        """Ensure unique spot number within the same lot (case-insensitive)."""
        lot = self.instance.lot if self.instance else self.context.get("lot")
        number = attrs.get("number") or (self.instance.number if self.instance else None)

        if lot and number:
            qs = Spot.objects.filter(lot=lot, number__iexact=number)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                existing_numbers = Spot.objects.filter(lot=lot).values_list("number", flat=True)
                raise serializers.ValidationError(
                    {
                        "number": f"This spot number already exists in lot '{lot.name}' (case-insensitive check).",
                        "existing_numbers": list(existing_numbers),
                    }
                )
        return attrs

class ParkingLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingLot
        fields = ['id', 'name', 'city', 'street', 'building', 'latitude', 'longitude']
    
    def validate(self, attrs):
        """Validate coordinates"""
        print(f"DEBUG: validate() called with attrs: {attrs}")  # DEBUG
        latitude = attrs.get('latitude')
        longitude = attrs.get('longitude')
        print(f"DEBUG: latitude={latitude}, longitude={longitude}")  # DEBUG
        
        # Check if both coordinates are provided together
        if latitude is not None and longitude is None:
            raise serializers.ValidationError({
                'longitude': 'If latitude is provided, longitude is required.'
            })
        
        if longitude is not None and latitude is None:
            raise serializers.ValidationError({
                'latitude': 'If longitude is provided, latitude is required.'
            })
        
        # Validate coordinate ranges
        if latitude is not None and longitude is not None:
            print(f"DEBUG: About to call validate_coordinates")  # DEBUG
            validate_coordinates(latitude, longitude)
        
        return attrs
    
class ParkingLotDetailSerializer(ParkingLotSerializer):
    spots = SpotSerializer(many=True, read_only=True)
    class Meta:
        model = ParkingLot
        fields = ['id', 'name', 'city', 'street', 'building', 'spots',
                  'latitude', 'longitude', 'description', 'base_price_per_hour']

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Name must contain at least 3 characters.")
        return value

    def validate_city(self, value):
        cleaned_value = value.replace('-', '').replace(' ', '')
        if not cleaned_value.isalpha():
             raise serializers.ValidationError("City name must contain only letters, spaces, or hyphens.")
        return value.title()

    def validate_street(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Street name must contain at least 3 characters.")
        return value.title()

    def validate_building(self, value):
        if value and not re.match(r'^\d+[A-Za-z\-]*$', value):
            raise serializers.ValidationError("Invalid building number format.")
        return value
    
    def validate_coordinates(latitude, longitude):
        """
        Validates geographical coordinates.
        """
        lat = float(latitude) if latitude is not None else None
        lon = float(longitude) if longitude is not None else None
        
        if lat is not None:
            if not -90 <= lat <= 90:
                raise serializers.ValidationError({
                    'latitude': 'Latitude must be between -90 and 90 degrees'
                })
        
        if lon is not None:
            if not -180 <= lon <= 180:
                raise serializers.ValidationError({
                    'longitude': 'Longitude must be between -180 and 180 degrees'
                })

class BookingSerializer(serializers.ModelSerializer):
    spot_number = serializers.CharField(source='spot.number', read_only=True)
    lot_name = serializers.CharField(source='spot.lot.name', read_only=True)
    lot_address = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model = Booking
        fields = ["id", "user", "user_email", "spot", "spot_number", "lot_name", "lot_address", "start_at", "end_at", 
            "status", "created_at", "cancellation_reason", "payment_intent_id"]
        read_only_fields = ["status", "created_at", "user", "cancellation_reason", "payment_intent_id"]

    def get_lot_address(self, obj):
        if obj.spot and obj.spot.lot:
            return f"{obj.spot.lot.city}, {obj.spot.lot.street} {obj.spot.lot.building}"
        return "Unknown"

class OperatorBookingCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255, required=True,
                                   help_text="Причина скасування бронювання оператором.")

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["spot", "start_at", "end_at"]

class BookingCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=200)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    is_operator = serializers.SerializerMethodField()
    lot_id = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField()
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_operator', 'lot_id', 'is_staff')
        read_only_fields = ('id', 'username', 'email', 'is_operator', 'lot_id', 'is_staff')

    def get_is_operator(self, obj) -> bool:
        return hasattr(obj, 'operator_profile')

    def get_lot_id(self, obj) -> int | None:
        if hasattr(obj, 'operator_profile'):
            return obj.operator_profile.lot_id
        return None

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

class SpotOperatorUpdateSerializer(serializers.ModelSerializer):
    """Serializer for operators — restricts updates to allowed fields."""
    class Meta:
        model = Spot
        fields = ["is_ev", "is_disabled"]

    def validate(self, attrs):
        if "number" in self.initial_data:
            raise serializers.ValidationError({"number": "Operators cannot change the spot number."})
        return super().validate(attrs)

class OperatorAssignSerializer(serializers.Serializer):
    lot_id = serializers.IntegerField(required=True)

    def validate_lot_id(self, value):
        if not ParkingLot.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Parking lot with this ID does not exist.")
        return value

class BackupLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupLog
        fields = ['id', 'status', 'message', 'created_at']
    