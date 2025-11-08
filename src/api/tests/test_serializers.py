import pytest
from src.api.serializers import ParkingLotDetailSerializer, UserRegistrationSerializer
from django.contrib.auth.models import User
from django.conf import settings


@pytest.mark.parametrize("field,value,error", [
    ("name", "  a ", "at least 3 characters"),
    ("city", "Ky1v", "only letters"),
    ("street", "St", "at least 3 characters"),
    ("building", "12@", "Invalid building number"),
])
def test_invalid_fields_raise_error(field, value, error):
    data = {"name": "ValidName", "city": "Kyiv", "street": "Main", "building": "10"}
    data[field] = value
    serializer = ParkingLotDetailSerializer(data=data)
    assert not serializer.is_valid()
    assert any(error in str(msg) for msg in serializer.errors.values())


def test_valid_parking_lot_serializer():
    data = {"name": "Ocean", "city": "Kyiv", "street": "Main", "building": "1A"}
    serializer = ParkingLotDetailSerializer(data=data)
    assert serializer.is_valid() is True


@pytest.mark.django_db
def test_user_registration_serializer_creates_user():
    data = {
        "username": "tester",
        "email": "tester@example.com",
        "password": settings.STRONG_PASSWORD_FOR_TESTS,
        "first_name": "Valeria",
        "last_name": "QATest"
    }
    serializer = UserRegistrationSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    user = serializer.save()
    assert isinstance(user, User)
    assert user.check_password("StrongPass123!")
    assert user.email == "tester@example.com"
