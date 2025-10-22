import pytest
from decimal import Decimal
from django.utils import timezone
from src.api.models import ParkingLot, Spot, Booking
from src.api.services import PaymentService


@pytest.mark.django_db
def test_calculate_price_correct():
    lot = ParkingLot.objects.create(name="LotA", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="S1", lot=lot)
    booking = Booking(spot=spot,
                      start_at=timezone.now(),
                      end_at=timezone.now() + timezone.timedelta(hours=3))
    result = PaymentService.calculate_price(booking)
    assert result == Decimal("90.00")  # 30 * 3


@pytest.mark.django_db
def test_process_refund_returns_mock():
    lot = ParkingLot.objects.create(name="LotA", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="S1", lot=lot)
    booking = Booking.objects.create(
        spot=spot,
        start_at=timezone.now(),
        end_at=timezone.now() + timezone.timedelta(hours=2),
    )
    refund = PaymentService.process_refund(booking)
    assert refund["status"] == "mock"
    assert "booking_id" in refund


def test_verify_payment_always_returns_true():
    assert PaymentService.verify_payment("123", "sig", "data") is True
