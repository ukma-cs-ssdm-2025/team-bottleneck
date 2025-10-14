from rest_framework import serializers
from .models import ParkingLot, Spot, Booking
import re

class SpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spot
        fields = ["id", "number", "is_ev", "is_disabled", "lot"]
        read_only_fields = ["lot"]
        
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
        # !!! ДОДАНО: cancellation_reason
        fields = ["id", "user", "spot", "start_at", "end_at", "status", "created_at", "cancellation_reason"]
        read_only_fields = ["status", "created_at", "user", "cancellation_reason"]

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["spot", "start_at", "end_at"]

class BookingCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=200)
