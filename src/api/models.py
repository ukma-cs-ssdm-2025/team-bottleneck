from django.conf import settings
from django.db import models
from django.utils import timezone

class ParkingLot(models.Model):
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    street = models.CharField(max_length=150)
    building = models.CharField(max_length=20, blank=True)
    base_price_per_hour = models.DecimalField(max_digits=8, decimal_places=2, default=30.00)
    description = models.CharField(max_length=1000, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.city}, {self.street} {self.building or ''})"

class Spot(models.Model):
    number = models.CharField(max_length=10)
    lot = models.ForeignKey(ParkingLot, related_name="spots", on_delete=models.CASCADE)
    is_ev = models.BooleanField(default=False)
    is_disabled = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_spots"
    )

    class Meta:
        unique_together = ("lot", "number")
        ordering = ['number']

    def __str__(self):
        return f"{self.lot.name} #{self.number}"

class Booking(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    spot = models.ForeignKey(Spot, on_delete=models.PROTECT, related_name="bookings")
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(max_length=16, default="confirmed")
    created_at = models.DateTimeField(auto_now_add=True)
    cancellation_reason = models.CharField(max_length=255, blank=True, default="")
    payment_intent_id = models.CharField(max_length=100, blank=True)
    def check_cancellable_error(self) -> str | None:
        if self.status == 'cancelled':
            return 'Booking is already cancelled.'
        
        if self.end_at <= timezone.now():
            return 'Booking time has already completed and cannot be cancelled.'
            
        return None

    class Meta:
        indexes = [
            models.Index(fields=["spot", "start_at", "end_at", "status"])
        ]

class OperatorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='operator_profile')
    lot = models.ForeignKey(ParkingLot, on_delete=models.SET_NULL, null=True, related_name='operators')
    
    def __str__(self):
        return f"Operator {self.user.username} for {self.lot.name if self.lot else 'N/A'}"
    
class BackupLog(models.Model):
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILURE', 'Failure'),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    message = models.TextField(help_text="Шлях до файлу або текст помилки")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.status} at {self.created_at}"
