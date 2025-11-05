import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from src.api.models import ParkingLot, Spot, Booking, OperatorProfile
from src.api.permissions import IsLotOperator
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIClient
from rest_framework import status
factory = APIRequestFactory()
from datetime import timedelta
from unittest.mock import Mock
from django.conf import settings

TEST_PASSWORD = settings.TEST_USER_PASSWORD

@pytest.mark.django_db
def test_permission_allows_own_lot():
    user = User.objects.create_user(username="op")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=user, lot=lot)
    
    request = factory.get("/")
    request.user = user
    view = Mock()
    view.kwargs = {'lot_pk': lot.id}
    
    permission = IsLotOperator()
    assert permission.has_permission(request, view) is True

@pytest.mark.django_db
def test_permission_denies_other_lot():
    user = User.objects.create_user(username="op")
    lot1 = ParkingLot.objects.create(name="Lot1", city="Kyiv", street="Main")
    lot2 = ParkingLot.objects.create(name="Lot2", city="Lviv", street="Other")
    OperatorProfile.objects.create(user=user, lot=lot1)
    
    request = factory.get("/")
    request.user = user
    view = Mock()
    view.kwargs = {'lot_pk': lot2.id}
    
    permission = IsLotOperator()
    assert permission.has_permission(request, view) is False


@pytest.mark.django_db
def test_has_permission_for_non_operator():
    user = User.objects.create_user(username="no_op")
    request = factory.get("/")
    request.user = user
    permission = IsLotOperator()
    assert permission.has_permission(request, view=None) is False


@pytest.mark.django_db
def test_object_permission_same_lot():
    user = User.objects.create_user(username="op")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=user, lot=lot)
    spot = Spot.objects.create(number="A1", lot=lot)
    booking = Booking.objects.create(
        spot=spot,
        start_at=timezone.now(),
        end_at=timezone.now() + timezone.timedelta(hours=1)
    )

    request = factory.get("/")
    request.user = user
    perm = IsLotOperator()
    assert perm.has_object_permission(request, view=None, obj=booking) is True


@pytest.mark.django_db
def test_object_permission_different_lot_denied():
    user = User.objects.create_user(username="op2")
    lot1 = ParkingLot.objects.create(name="Lot1", city="Kyiv", street="Main")
    lot2 = ParkingLot.objects.create(name="Lot2", city="Lviv", street="Street")
    OperatorProfile.objects.create(user=user, lot=lot1)
    spot = Spot.objects.create(number="B1", lot=lot2)
    booking = Booking.objects.create(
        spot=spot,
        start_at=timezone.now(),
        end_at=timezone.now() + timezone.timedelta(hours=1)
    )

    request = factory.get("/")
    request.user = user
    perm = IsLotOperator()
    assert perm.has_object_permission(request, view=None, obj=booking) is False

def test_permission_denied_for_anonymous():
    request = APIRequestFactory().get("/")
    request.user = AnonymousUser()
    perm = IsLotOperator()
    assert not perm.has_permission(request, view=None)

@pytest.mark.django_db
def test_operator_cannot_cancel_already_cancelled_booking():
    operator_user = User.objects.create_user(username="op_cancel_check")
    lot = ParkingLot.objects.create(name="LotB", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=operator_user, lot=lot)
    spot = Spot.objects.create(number="B1", lot=lot)
    
    booking = Booking.objects.create(
        spot=spot,
        start_at=timezone.now() + timezone.timedelta(hours=1),
        end_at=timezone.now() + timezone.timedelta(hours=2),
        status='cancelled', 
        cancellation_reason='Client changed plans.'
    )
    
    client = APIClient()
    client.force_authenticate(user=operator_user)
    
    cancel_url = f'/api/v1/bookings/{booking.id}/cancel-operator/'
    response = client.post(
        cancel_url, 
        {"reason": "Attempting to cancel an already cancelled booking."},
        format='json'
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST 
    assert 'already cancelled' in response.data['detail'].lower()
    
    booking.refresh_from_db()
    assert booking.status == 'cancelled'

@pytest.mark.django_db
def test_operator_cannot_cancel_past_booking():
    operator_user = User.objects.create_user(username="op_past_cancel")
    lot = ParkingLot.objects.create(name="LotC", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=operator_user, lot=lot)
    spot = Spot.objects.create(number="C1", lot=lot)
    
    now = timezone.now()
    booking = Booking.objects.create(
        spot=spot,
        start_at=now - timedelta(hours=6), 
        end_at=now - timedelta(hours=5), 
        status='confirmed', 
    )
    
    client = APIClient()
    client.force_authenticate(user=operator_user)
    
    cancel_url = f'/api/v1/bookings/{booking.id}/cancel-operator/'
    response = client.post(
        cancel_url, 
        {"reason": "Attempting to cancel a completed booking."},
        format='json'
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST 
    assert 'already completed' in response.data['detail'].lower()
    
    booking.refresh_from_db()
    assert booking.status == 'confirmed', "Status should remain 'confirmed' after failed cancellation."
