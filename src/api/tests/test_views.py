import pytest
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from src.api.views import BookingViewSet
from src.api.serializers import OperatorBookingCancelSerializer
from django.contrib.auth.models import User
from src.api.models import ParkingLot, Spot, Booking, OperatorProfile
from django.utils import timezone
from rest_framework.test import APIRequestFactory

@pytest.mark.django_db
def test_operator_cancels_booking_and_reason_is_detailed():
    operator_user = User.objects.create_user(username="op_test", password="pass")
    lot = ParkingLot.objects.create(name="LotA", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=operator_user, lot=lot)
    spot = Spot.objects.create(number="A1", lot=lot)
    booking = Booking.objects.create(
        spot=spot,
        start_at=timezone.now() + timezone.timedelta(hours=1),
        end_at=timezone.now() + timezone.timedelta(hours=2),
        status='confirmed'
    )
    
    factory = APIRequestFactory()
    request = factory.post(
        f"/bookings/{booking.id}/cancel-operator/", 
        {"reason": "Vehicle must be moved for cleaning."},
        format='json'
    )
    request.user = operator_user
    view = BookingViewSet.as_view({'post': 'cancel_by_operator'})
    response = view(request, pk=booking.id).render()
    booking.refresh_from_db()

    expected_reason_part = f"Cancelled by Operator ({operator_user.username})"
    
    assert booking.cancellation_reason.startswith(expected_reason_part)
    assert "cleaning" in booking.cancellation_reason
    assert booking.status == 'cancelled'