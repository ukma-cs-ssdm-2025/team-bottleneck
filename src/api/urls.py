from rest_framework_nested import routers
from .views import ParkingLotViewSet, SpotViewSet, BookingViewSet

# Base router
router = routers.SimpleRouter()
router.register(r"lots", ParkingLotViewSet, basename="lot")

# Nested router: /lots/{lot_id}/spots/
lots_router = routers.NestedSimpleRouter(router, r"lots", lookup="lot")
lots_router.register(r"spots", SpotViewSet, basename="lot-spots")

# Bookings remain global
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = router.urls + lots_router.urls
