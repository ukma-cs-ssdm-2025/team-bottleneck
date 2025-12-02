import pytest
from django.utils import timezone
from rest_framework import serializers
from src.api.validators import validate_booking_window
from src.api.serializers import ParkingLotSerializer


def test_valid_booking_window_passes():
    start = timezone.now() + timezone.timedelta(hours=1)
    end = start + timezone.timedelta(hours=1)
    assert validate_booking_window(start, end) is None


def test_start_after_end_raises():
    start = timezone.now() + timezone.timedelta(hours=2)
    end = timezone.now() + timezone.timedelta(hours=1)
    with pytest.raises(serializers.ValidationError, match="must be after start time"):
        validate_booking_window(start, end)


def test_start_in_past_raises():
    start = timezone.now() - timezone.timedelta(hours=1)
    end = timezone.now() + timezone.timedelta(hours=1)
    with pytest.raises(serializers.ValidationError, match="cannot be in the past"):
        validate_booking_window(start, end)

def test_zero_duration_raises_error():
    start = timezone.now() + timezone.timedelta(hours=1)
    end = start
    with pytest.raises(serializers.ValidationError, match="must be after start time"):
        validate_booking_window(start, end)


@pytest.mark.django_db
def test_coordinates_validation_invalid_latitude():
    serializer = ParkingLotSerializer(data={
        'name': 'Test',
        'city': 'Kyiv',
        'street': 'Main',
        'latitude': 95.0,
        'longitude': 30.0
    })
    assert not serializer.is_valid()
    assert 'latitude' in serializer.errors or 'non_field_errors' in serializer.errors


@pytest.mark.django_db
def test_coordinates_validation_invalid_longitude():
    serializer = ParkingLotSerializer(data={
        'name': 'Test',
        'city': 'Kyiv',
        'street': 'Main',
        'latitude': 50.0,
        'longitude': 185.0
    })
    assert not serializer.is_valid()
    assert 'longitude' in serializer.errors or 'non_field_errors' in serializer.errors


@pytest.mark.django_db
def test_coordinates_validation_only_latitude():
    serializer = ParkingLotSerializer(data={
        'name': 'Test',
        'city': 'Kyiv',
        'street': 'Main',
        'latitude': 50.0
    })
    assert not serializer.is_valid()
    assert 'longitude' in serializer.errors or 'non_field_errors' in serializer.errors