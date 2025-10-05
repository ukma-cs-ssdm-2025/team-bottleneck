from rest_framework import serializers
from .models import ParkingLot, Spot, Booking

class ParkingLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingLot
        fields = ["id", "name", "address", "lat", "lng"]

        def validate_lat(self, v):
            if not (-90 <= v <= 90):
                raise serializers.ValidationError("lat must be between -90 and 90")
            return v

        def validate_lng(self, v):
            if not (-180 <= v <= 180):
                raise serializers.ValidationError("lng must be between -180 and 180")
            return v

class SpotSerializer(serializers.ModelSerializer):
    lot = ParkingLotSerializer(read_only=True)
    lot_id = serializers.PrimaryKeyRelatedField(
        queryset=ParkingLot.objects.all(), source="lot", write_only=True
    )
    class Meta:
        model = Spot
        fields = ["id", "number", "is_ev", "is_disabled", "lot", "lot_id"]

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "user", "spot", "start_at", "end_at", "status", "created_at"]
        read_only_fields = ["status", "created_at", "user"]

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["spot", "start_at", "end_at"]

class BookingCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=200)
