"""
Business logic services
"""
from decimal import Decimal
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Service for handling payments via LiqPay.
    Currently a mock implementation to be replaced with real integration later.
    """
    
    # Constants for price calculation
    BASE_PRICE_PER_HOUR = Decimal('30.00')  # 30 UAH per hour
    
    @staticmethod
    def calculate_price(booking) -> Decimal:
        duration_hours = (booking.end_at - booking.start_at).total_seconds() / 3600
        price_per_hour = PaymentService.BASE_PRICE_PER_HOUR
        
        total = price_per_hour * Decimal(str(duration_hours))
        return total.quantize(Decimal('0.01'))
    
    @staticmethod
    def initiate_payment(booking) -> Dict[str, Any]:
        amount = PaymentService.calculate_price(booking)
        
        logger.info(
            f"Initiating payment for booking {booking.id}: "
            f"{amount} UAH"
        )

        # TODO: Real LiqPay integration
        # from liqpay import LiqPay
        # liqpay = LiqPay(settings.LIQPAY_PUBLIC_KEY, settings.LIQPAY_PRIVATE_KEY)
        # 
        # params = {
        #     'action': 'pay',
        #     'amount': str(amount),
        #     'currency': 'UAH',
        #     'description': f'Parking spot booking #{booking.spot.number}',
        #     'order_id': f'booking_{booking.id}',
        #     'version': '3',
        #     'result_url': f'{settings.FRONTEND_URL}/bookings/{booking.id}',
        #     'server_url': f'{settings.BACKEND_URL}/api/v1/webhooks/liqpay/',
        # }
        # 
        # signature = liqpay.cnb_signature(params)
        # data = liqpay.cnb_data(params)
        # 
        # return {
        #     'status': 'initiated',
        #     'payment_url': 'https://www.liqpay.ua/api/3/checkout',
        #     'data': data,
        #     'signature': signature,
        #     'amount': str(amount),
        #     'currency': 'UAH'
        # }
        
        return {
            'status': 'mock',
            'message': 'LiqPay payment gateway will be integrated later',
            'amount': str(amount),
            'currency': 'UAH',
            'payment_url': None,
            'booking_id': booking.id,
        }
    
    @staticmethod
    def process_refund(booking) -> Dict[str, Any]:
        logger.info(f"Processing refund for booking {booking.id}")
        

        
        return {
            'status': 'mock',
            'message': 'Refund will be processed once LiqPay integration is implemented',
            'booking_id': booking.id,
        }
    
    @staticmethod
    def verify_payment(order_id: str, signature: str, data: str) -> bool:
        logger.info(f"Verifying payment for order {order_id}")
        
        # TODO: Implement real LiqPay signature verification
        # from liqpay import LiqPay
        # liqpay = LiqPay(settings.LIQPAY_PUBLIC_KEY, settings.LIQPAY_PRIVATE_KEY)
        # return liqpay.cnb_signature(data) == signature
        
        return True 


class BookingNotificationService:    
    @staticmethod
    def send_booking_confirmation(booking):
        """Sends a booking confirmation email"""
        logger.info(f"Sending booking confirmation for {booking.id} to {booking.user.email}")
        # TODO: Integrate with email service
        pass
    
    @staticmethod
    def send_cancellation_confirmation(booking):
        """Sends a booking cancellation confirmation email"""
        logger.info(f"Sending cancellation confirmation for {booking.id} to {booking.user.email}")
        # TODO: Integrate with email service
        pass
    
    @staticmethod
    def send_reminder(booking):
        """Sends a reminder before the booking starts"""
        logger.info(f"Sending reminder for booking {booking.id}")
        # TODO: Integrate with email or push notification service
        pass
