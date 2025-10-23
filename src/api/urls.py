from rest_framework_nested import routers
from .views import ParkingLotViewSet, SpotViewSet, BookingViewSet, UserViewSet

router = routers.SimpleRouter()
router.register(r"lots", ParkingLotViewSet, basename="lot")

lots_router = routers.NestedSimpleRouter(router, r"lots", lookup="lot")
lots_router.register(r"spots", SpotViewSet, basename="lot-spots")

router.register(r"bookings", BookingViewSet, basename="booking")

router.register(r'users', UserViewSet, basename='user') 

urlpatterns = router.urls + lots_router.urls
