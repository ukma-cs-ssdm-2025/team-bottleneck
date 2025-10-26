from rest_framework import permissions
from src.api.models import OperatorProfile, Booking

class IsLotOperator(permissions.BasePermission):
    message = 'Ви не є оператором або не маєте прав доступу до бронювань на цьому лоті.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        try:
            profile = user.operator_profile
        except OperatorProfile.DoesNotExist:
            return False

        lot_pk = view.kwargs.get("lot_pk")
        if lot_pk is not None:
            try:
                return profile.lot_id == int(lot_pk)
            except (ValueError, TypeError):
                return False

        return True

    def has_object_permission(self, request, view, obj):

        if isinstance(obj, Booking):
            booking_lot_id = obj.spot.lot_id
        else:
            return False 

        try:
            operator_profile = request.user.operator_profile
            operator_lot_id = operator_profile.lot_id
        except OperatorProfile.DoesNotExist:
            return False 

        return booking_lot_id == operator_lot_id