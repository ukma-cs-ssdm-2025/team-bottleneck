import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from src.api.models import ParkingLot, Spot, Booking, OperatorProfile
from src.api.permissions import IsLotOperator
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser

factory = APIRequestFactory()


@pytest.mark.django_db
def test_has_permission_for_operator():
    user = User.objects.create_user(username="op", password="pass")
    lot = ParkingLot.objects.create(name="Central", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=user, lot=lot)

    request = factory.get("/")
    request.user = user
    permission = IsLotOperator()
    assert permission.has_permission(request, view=None) is True


@pytest.mark.django_db
def test_has_permission_for_non_operator():
    user = User.objects.create_user(username="no_op", password="pass")
    request = factory.get("/")
    request.user = user
    permission = IsLotOperator()
    assert permission.has_permission(request, view=None) is False


@pytest.mark.django_db
def test_object_permission_same_lot():
    user = User.objects.create_user(username="op", password="pass")
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
    user = User.objects.create_user(username="op2", password="pass")
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