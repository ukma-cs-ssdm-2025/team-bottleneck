import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from src.api.models import ParkingLot, Spot, Booking, OperatorProfile
from django.utils import timezone

@pytest.mark.django_db
def test_operator_cancels_booking_and_reason_is_detailed():
    operator_user = User.objects.create_user(username="op_test", password="pass")
    lot = ParkingLot.objects.create(name="LotA", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=operator_user, lot=lot)
    spot = Spot.objects.create(number="A1", lot=lot)
    
    other_user = User.objects.create_user(username="client_user", password="pass")
    booking = Booking.objects.create(
        user=other_user,
        spot=spot,
        start_at=timezone.now() + timezone.timedelta(hours=1),
        end_at=timezone.now() + timezone.timedelta(hours=2),
        status='confirmed'
    )
    
    client = APIClient()
    client.force_authenticate(user=operator_user) 
    
    cancel_url = f'/api/v1/bookings/{booking.id}/cancel-operator/'
    response = client.post(
        cancel_url, 
        {"reason": "Vehicle must be moved for cleaning."},
        format='json'
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    booking.refresh_from_db()

    expected_reason_part = f"Cancelled by Operator ({operator_user.username})"
    
    assert booking.cancellation_reason.startswith(expected_reason_part)
    assert "cleaning" in booking.cancellation_reason
    assert booking.status == 'cancelled'