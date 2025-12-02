from django.utils import timezone
from rest_framework import serializers
from datetime import timedelta
from rest_framework.exceptions import ValidationError

MIN_BOOKING_DURATION = timedelta(minutes=30)
MAX_BOOKING_DURATION = timedelta(days=30)
MAX_ADVANCE_BOOKING = timedelta(days=90)
    
def validate_booking_window(start_at, end_at):
    """
    Validates that booking time window is logical and within acceptable limits.
    """
    now = timezone.now()
    
    if start_at < now:
        raise ValidationError(
            {"start_at": "Booking start time cannot be in the past."},
            code="past_start_time"
        )
    
    if end_at <= start_at:
        raise ValidationError(
            {"end_at": "Booking end time must be after start time."},
            code="invalid_time_range"
        )
    
    if (end_at - start_at) < MIN_BOOKING_DURATION:
        raise ValidationError(
            {"end_at": f"Booking duration must be at least {MIN_BOOKING_DURATION.total_seconds() / 60:.0f} minutes."},
            code="duration_too_short"
        )
    
    if (end_at - start_at) > MAX_BOOKING_DURATION:
        raise ValidationError(
            {"end_at": f"Booking duration cannot exceed {MAX_BOOKING_DURATION.days} days."},
            code="duration_too_long"
        )
    
    if (start_at - now) > MAX_ADVANCE_BOOKING:
        raise ValidationError(
            {"start_at": f"Bookings can only be made up to {MAX_ADVANCE_BOOKING.days} days in advance."},
            code="too_far_in_future"
        )
    
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