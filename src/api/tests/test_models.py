import pytest
from django.db import IntegrityError
from django.utils import timezone
from django.contrib.auth import get_user_model
from src.api.models import ParkingLot, Spot, Booking, OperatorProfile
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User

TEST_PASSWORD = "pass"

class BookingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="test")
        self.client.force_authenticate(user=self.user)
        self.lot = ParkingLot.objects.create(name="River Mall", city="Kyiv", street="Dnipro")
        self.spot = Spot.objects.create(number="P1", lot=self.lot)
        self.start = timezone.now() + timedelta(hours=1)
        self.end = timezone.now() + timedelta(hours=2)


# ────────────────────────────────────────────────
# ParkingLot model
# ────────────────────────────────────────────────

@pytest.mark.django_db
def test_create_parking_lot_success():
    lot = ParkingLot.objects.create(
        name="SkyMall",
        city="Kyiv",
        street="Petrivka",
        building="10A"
    )
    assert lot.id is not None
    assert str(lot) == "SkyMall (Kyiv, Petrivka 10A)"
    assert "Kyiv" in str(lot)


@pytest.mark.django_db
def test_parking_lot_str_without_building():
    lot = ParkingLot.objects.create(
        name="Center Lot",
        city="Lviv",
        street="Main Street"
    )
    result = str(lot)
    assert "Center Lot" in result
    assert "Main Street" in result
    assert "None" not in result


# ────────────────────────────────────────────────
# Spot model
# ────────────────────────────────────────────────

@pytest.mark.django_db
def test_spot_creation_and_str():
    lot = ParkingLot.objects.create(name="Lot A", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="A1", lot=lot, is_ev=True, is_disabled=False)
    assert spot.lot == lot
    assert "#A1" in str(spot)
    assert "Lot A" in str(spot)


@pytest.mark.django_db
def test_spot_unique_together_same_lot():
    lot = ParkingLot.objects.create(name="Lot B", city="Kyiv", street="Main")
    Spot.objects.create(number="X1", lot=lot)
    with pytest.raises(IntegrityError):
        Spot.objects.create(number="X1", lot=lot)  # дубль у межах того ж лоту


@pytest.mark.django_db
def test_spot_number_can_repeat_in_different_lots():
    lot1 = ParkingLot.objects.create(name="Lot1", city="Kyiv", street="Main")
    lot2 = ParkingLot.objects.create(name="Lot2", city="Lviv", street="Market")
    Spot.objects.create(number="S1", lot=lot1)
    spot2 = Spot.objects.create(number="S1", lot=lot2)
    assert spot2.lot != lot1
    assert spot2.number == "S1"


# ────────────────────────────────────────────────
# Booking model
# ────────────────────────────────────────────────

@pytest.mark.django_db
def test_booking_creation_defaults():
    lot = ParkingLot.objects.create(name="LotX", city="Dnipro", street="River")
    spot = Spot.objects.create(number="A5", lot=lot)
    booking = Booking.objects.create(
        spot=spot,
        start_at=timezone.now(),
        end_at=timezone.now() + timezone.timedelta(hours=2)
    )

    assert booking.status == "confirmed"
    assert booking.cancellation_reason == ""
    assert booking.payment_intent_id is None
    assert booking.user is None


@pytest.mark.django_db
def test_booking_with_user_relationship():
    user = User.objects.create_user(username="testuser")
    lot = ParkingLot.objects.create(name="LotY", city="Kyiv", street="Street")
    spot = Spot.objects.create(number="Y1", lot=lot)
    booking = Booking.objects.create(
        user=user,
        spot=spot,
        start_at=timezone.now(),
        end_at=timezone.now() + timezone.timedelta(hours=1)
    )

    assert booking.user.username == "testuser"
    assert booking.spot == spot
    assert booking.status == "confirmed"


@pytest.mark.django_db
def test_booking_has_index_fields():
    """Перевіряємо, що індекс існує для (spot, start_at, end_at, status)."""
    fields = [tuple(i.fields) for i in Booking._meta.indexes]
    assert ("spot", "start_at", "end_at", "status") in fields


# ────────────────────────────────────────────────
# OperatorProfile model
# ────────────────────────────────────────────────

@pytest.mark.django_db
def test_operator_profile_str_and_relation():
    user = User.objects.create_user(username="operator1")
    lot = ParkingLot.objects.create(name="Central", city="Kyiv", street="Main")
    profile = OperatorProfile.objects.create(user=user, lot=lot)

    assert profile.user == user
    assert profile.lot == lot
    assert "operator1" in str(profile)
    assert "Central" in str(profile)


@pytest.mark.django_db
def test_operator_profile_without_lot():
    user = User.objects.create_user(username="solo")
    profile = OperatorProfile.objects.create(user=user, lot=None)

    assert "N/A" in str(profile)
    assert "solo" in str(profile)

@pytest.mark.django_db
def test_operator_profile_user_must_be_unique_fails():
    user = User.objects.create_user(username="operator_gulliver")
    lot = ParkingLot.objects.create(name="Central", city="Kyiv", street="Main")
    
    OperatorProfile.objects.create(user=user, lot=lot)
    with pytest.raises(IntegrityError):
        OperatorProfile.objects.create(user=user, lot=None)