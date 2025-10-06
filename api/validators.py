from django.utils import timezone
from rest_framework import serializers

def validate_booking_window(start_at, end_at):
    if start_at >= end_at:
        raise serializers.ValidationError("start_at must be before end_at")
    if start_at < timezone.now():
        raise serializers.ValidationError("start_at must be in the future")
