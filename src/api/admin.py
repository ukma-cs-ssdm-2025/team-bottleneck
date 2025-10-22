from django.contrib import admin
from .models import ParkingLot, Spot, Booking, OperatorProfile

@admin.register(ParkingLot)
class ParkingLotAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'street', 'building']
    search_fields = ['name', 'city']

@admin.register(Spot)
class SpotAdmin(admin.ModelAdmin):
    list_display = ['number', 'lot', 'is_ev', 'is_disabled']
    list_filter = ['lot', 'is_ev', 'is_disabled']
    search_fields = ['number']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'spot', 'start_at', 'end_at', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['spot__number', 'user__username', 'id']
    readonly_fields = ['created_at']

@admin.register(OperatorProfile)
class OperatorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'lot']
    list_filter = ['lot']
    search_fields = ['user__username', 'lot__name']