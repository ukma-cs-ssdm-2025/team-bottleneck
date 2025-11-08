from decimal import Decimal
from typing import Dict, Any
import logging
from django.conf import settings
import stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)

class PaymentService:
    BASE_PRICE_PER_HOUR = Decimal('30.00')
   
    @staticmethod
    def calculate_price(booking) -> Decimal:
        duration_hours = (booking.end_at - booking.start_at).total_seconds() / 3600
        price_per_hour = PaymentService.BASE_PRICE_PER_HOUR
       
        total = price_per_hour * Decimal(str(duration_hours))
   
        return total.quantize(Decimal('0.01'))
   
    @staticmethod
    def initiate_payment(booking) -> Dict[str, Any]:
        amount_uah = PaymentService.calculate_price(booking)
        amount_cents = int(amount_uah * 100)
        currency = settings.STRIPE_CURRENCY
       
        logger.info(
            f"Initiating Stripe PaymentIntent for booking {booking.id}: "
            f"{amount_uah} UAH ({amount_cents} {currency})"
        )

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                description=f'Parking spot booking #{booking.spot.number} at {booking.spot.lot.name}',
                metadata={'booking_id': booking.id, 'user_id': booking.user.id},
            )
           
            return {
                'status': 'requires_payment_method',
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': str(amount_uah),
                'currency': currency.upper(),
                'message': 'Stripe Payment Intent created. Use client_secret on frontend.'
            }
        except Exception as e:
            logger.error(f"Stripe Payment Intent creation failed: {e}")
            return {
                'status': 'error',
                'message': f'Stripe API Error: {str(e)}',
                'amount': str(amount_uah),
                'currency': currency.upper(),
            }
   
    @staticmethod
    def process_refund(booking) -> Dict[str, Any]:
        logger.info(f"Processing refund for booking {booking.id}")
        return {
            'status': 'mock',
            'message': 'Refund will be processed once Stripe integration is fully implemented',
            'booking_id': booking.id,
        }
   
    @staticmethod
    def verify_payment(order_id: str, signature: str, data: str) -> bool:
        logger.info(f"Verifying payment for order {order_id}")
        return True

class BookingNotificationService:    
    @staticmethod
    def send_booking_confirmation(booking):
        logger.info(f"Sending booking confirmation for {booking.id} to {booking.user.email}")

   
    @staticmethod
    def send_cancellation_confirmation(booking):
        if booking.user is None:
            logger.warning(f"Skipping cancellation confirmation for {booking.id}. User field is NULL.")
            return 
            
        logger.info(f"Sending cancellation confirmation for {booking.id} to {booking.user.email}")
   
    @staticmethod
    def send_reminder(booking):
        """Sends a reminder before the booking starts"""
        logger.info(f"Sending reminder for booking {booking.id}")

class CancellationService:
    @staticmethod
    def get_operator_cancellation_reason(operator_username: str, comment: str) -> str:
        return f"Cancelled by Operator ({operator_username}): {comment}"
    
class SpotUpdateService:
    @staticmethod
    def update_spot(spot, validated_data):
        for field, value in validated_data.items():
            setattr(spot, field, value)
        spot.save()
        return spot