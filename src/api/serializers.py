from rest_framework import serializers
from .models import ParkingLot, Spot, Booking
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
import re
from rest_framework.validators import UniqueTogetherValidator


class SpotSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Spot
        fields = ["id", "number", "is_ev", "is_disabled", "lot", "created_by", "created_by_username"]
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
        fields = ['id', 'name', 'city', 'street', 'building']

class ParkingLotDetailSerializer(ParkingLotSerializer):
    spots = SpotSerializer(many=True, read_only=True)
    class Meta:
        model = ParkingLot
        fields = ['id', 'name', 'city', 'street', 'building', 'spots']

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Name must contain at least 3 characters.")
        return value

    def validate_city(self, value):
        if not value.replace('-', '').replace(' ', '').isalpha():
            raise serializers.ValidationError("City name must contain only letters.")
        return value.title()

    def validate_street(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Street name must contain at least 3 characters.")
        return value.title()

    def validate_building(self, value):
        if value and not re.match(r'^[0-9]+[A-Za-z\-]*$', value):
            raise serializers.ValidationError("Invalid building number format.")
        return value

    def validate(self, attrs):
        if not attrs.get('city') or not attrs.get('street'):
            raise serializers.ValidationError("City and street are required fields.")
        return attrs

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "user", "spot", "start_at", "end_at", "status", "created_at", "cancellation_reason", "payment_intent_id"]
        read_only_fields = ["status", "created_at", "user", "cancellation_reason", "payment_intent_id"]

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
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_operator', 'lot_id')
        read_only_fields = ('id', 'username', 'email', 'is_operator', 'lot_id')

    def get_is_operator(self, obj):
        return hasattr(obj, 'operator_profile')

    def get_lot_id(self, obj):
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
