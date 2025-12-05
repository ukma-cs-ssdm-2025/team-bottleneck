from decimal import Decimal
from typing import Dict, Any
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging
from django.conf import settings
import stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)

class PaymentService:   
    @staticmethod
    def calculate_price(booking) -> Decimal:
        duration_hours = (booking.end_at - booking.start_at).total_seconds() / 3600
        price_per_hour = booking.spot.lot.base_price_per_hour

        if booking.spot.is_ev:
            price_per_hour *= Decimal('1.30')
            
        if booking.spot.is_disabled:
            price_per_hour *= Decimal('0.80')
       
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
    

 
class BookingNotificationService:
    @staticmethod
    def send_booking_confirmation(booking):
        
        if booking.user is None or not booking.user.email:
            logger.warning(f"Skipping confirmation for {booking.id}. User email is missing.")
            return False

        context = {'booking': booking, 'user': booking.user}
        
        try:
            lot_name = getattr(getattr(booking.spot, 'lot', None), 'name', 'Unknown Lot')
            subject = f" Booking Confirmed: #{booking.id} | {lot_name}"
   
            message_html = render_to_string('emails/booking_confirmation.html', context)
            message_text = render_to_string('emails/booking_confirmation_text.txt', context)
            
        except Exception as e:
            logger.error(f" EMAIL RENDERING FAILURE for booking {booking.id}: {e}")
            
            subject = f" Notification Error for Booking #{booking.id}"
            message_html = None
            message_text = (
                f"Dear {booking.user.username},\n\n"
                f"Your booking was successfully created. However, a critical error occurred "
                f"while formatting the details (rendering).\n\n"
                f"Please check the booking details on the website. Booking ID: {booking.id}\n"
            )

        try:
            if message_html:
                msg = EmailMultiAlternatives(subject, message_text, settings.DEFAULT_FROM_EMAIL, [booking.user.email])

                msg.attach_alternative(message_html, "text/html")
            else:
                msg = EmailMultiAlternatives(subject, message_text, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
                
            msg.send(fail_silently=True) 
            logger.info(f"Successfully sent confirmation email for booking {booking.id}.")
            return True
        except Exception as e:
            logger.error(f" CRITICAL EMAIL SENDING FAILURE for booking {booking.id}: {e}")
            return False

    @staticmethod
    def send_cancellation_confirmation(booking):
        """Sends an email notification when a booking is cancelled."""
        if booking.user is None or not booking.user.email:
            logger.warning(f"Skipping cancellation confirmation for {booking.id}. User email is missing.")
            return False

        context = {'booking': booking, 'user': booking.user}
        
        try:
            lot_name = getattr(getattr(booking.spot, 'lot', None), 'name', 'Unknown Lot')
            subject = f" Booking Cancelled: #{booking.id} | {lot_name}"
            message_html = render_to_string('emails/booking_cancellation.html', context)
            message_text = render_to_string('emails/booking_cancellation_text.txt', context)
            
        except Exception as e:
            logger.error(f" EMAIL CANCELLATION RENDERING FAILURE for booking {booking.id}: {e}")
            
            subject = f" Cancellation Notification Error for Booking #{booking.id}"
            message_html = None
            message_text = (
                f"Dear {booking.user.username},\n\n"
                f"Your booking #{booking.id} has been cancelled. However, a critical error occurred "
                f"while formatting the details.\n\n"
                f"Please check the booking status on the website."
            )

        try:
            from django.core.mail import EmailMultiAlternatives
            
            if message_html:
                msg = EmailMultiAlternatives(subject, message_text, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
                msg.attach_alternative(message_html, "text/html")
            else:
                msg = EmailMultiAlternatives(subject, message_text, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
                
            msg.send(fail_silently=True) 
            logger.info(f"Successfully sent cancellation email for booking {booking.id}.")
            return True
        except Exception as e:
            logger.error(f" CRITICAL EMAIL SENDING FAILURE for booking {booking.id}: {e}")
            return False