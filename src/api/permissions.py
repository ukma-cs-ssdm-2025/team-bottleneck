from rest_framework import permissions
from src.api.models import OperatorProfile, Booking

class IsLotOperator(permissions.BasePermission):
    message = "You are not an operator or you lack access to this lot."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return hasattr(user, "operator_profile")

    def has_object_permission(self, request, view, obj):
        try:
            operator_lot_id = request.user.operator_profile.lot_id
        except OperatorProfile.DoesNotExist:
            return False

        if isinstance(obj, Booking):
            return obj.spot.lot_id == operator_lot_id

        lot_id = getattr(obj, "lot_id", None)
        if lot_id is not None:
            return lot_id == operator_lot_id

        return False