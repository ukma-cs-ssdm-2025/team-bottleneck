import pytest
from django.utils import timezone
from rest_framework import serializers
from src.api.validators import validate_booking_window


def test_valid_booking_window_passes():
    start = timezone.now() + timezone.timedelta(hours=1)
    end = start + timezone.timedelta(hours=1)
    assert validate_booking_window(start, end) is None


def test_start_after_end_raises():
    start = timezone.now() + timezone.timedelta(hours=2)
    end = timezone.now() + timezone.timedelta(hours=1)
    with pytest.raises(serializers.ValidationError, match="must be before"):
        validate_booking_window(start, end)


def test_start_in_past_raises():
    start = timezone.now() - timezone.timedelta(hours=1)
    end = timezone.now() + timezone.timedelta(hours=1)
    with pytest.raises(serializers.ValidationError, match="must be in the future"):
        validate_booking_window(start, end)

def test_zero_duration_raises_error():
    start = timezone.now() + timezone.timedelta(hours=1)
    end = start 
    with pytest.raises(serializers.ValidationError, match="must be before"):
        validate_booking_window(start, end)