from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParkingLotViewSet, SpotViewSet, BookingViewSet

router = DefaultRouter()
router.register(r"lots", ParkingLotViewSet, basename="lot")
router.register(r"spots", SpotViewSet, basename="spot")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = [ path("", include(router.urls)) ]
