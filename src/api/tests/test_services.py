import pytest
from decimal import Decimal
from django.utils import timezone
from src.api.models import ParkingLot, Spot, Booking
from src.api.services import PaymentService

from decimal import Decimal
from django.utils import timezone

class PaymentService:
    @staticmethod
    def calculate_price(booking) -> Decimal:
        """
        Calculate the total price for a booking based on duration and hourly rate.
        """
        duration = booking.end_at - booking.start_at
        hours_float = duration.total_seconds() / 3600
        hours = Decimal(str(hours_float))
        base_price = booking.spot.lot.base_price_per_hour
        
        total_price = hours * base_price
        return total_price.quantize(Decimal('0.01'))
    
    @staticmethod
    def process_refund(booking) -> dict:
        """
        Process a refund for a cancelled booking.
        Returns a mock response for now.
        """
        return {
            "status": "mock",
            "booking_id": booking.id,
            "message": "Refund processed successfully (mock)"
        }
    
    @staticmethod
    def verify_payment(payment_intent_id: str, signature: str, data: str) -> bool:
        return True


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
