from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from src.api.models import Booking
from src.api.services import BookingNotificationService

class Command(BaseCommand):
    help = 'Sends push notifications/emails 10 minutes before booking ends'

    def handle(self, *args, **options):
        now = timezone.now()
        target_time_start = now + timedelta(minutes=9)
        target_time_end = now + timedelta(minutes=11)

        bookings_to_remind = Booking.objects.filter(
            status='confirmed',
            reminder_sent=False,
            end_at__gt=target_time_start,
            end_at__lt=target_time_end
        )

        count = bookings_to_remind.count()
        if count > 0:
            self.stdout.write(f"Found {count} bookings ending soon. Sending reminders...")
        
        for booking in bookings_to_remind:
            success = BookingNotificationService.send_ending_soon_notification(booking)
            if success:
                booking.reminder_sent = True
                booking.save(update_fields=['reminder_sent'])
                self.stdout.write(self.style.SUCCESS(f"Reminder sent for Booking #{booking.id}"))
            else:
                self.stdout.write(self.style.ERROR(f"Failed to send for Booking #{booking.id}"))