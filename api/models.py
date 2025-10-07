from django.conf import settings
from django.db import models

class ParkingLot(models.Model):
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    street = models.CharField(max_length=150)
    building = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.city}, {self.street} {self.building or ''})"

class Spot(models.Model):
    lot = models.ForeignKey(ParkingLot, on_delete=models.CASCADE, related_name="spots")
    number = models.CharField(max_length=20)
    is_ev = models.BooleanField(default=False)
    is_disabled = models.BooleanField(default=False)

    class Meta:
        unique_together = ("lot", "number")

    def __str__(self):
        return f"{self.lot.name} #{self.number}"

class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    spot = models.ForeignKey(Spot, on_delete=models.PROTECT, related_name="bookings")
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(max_length=16, default="confirmed")  # confirmed|cancelled
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["spot", "start_at", "end_at", "status"])
        ]
