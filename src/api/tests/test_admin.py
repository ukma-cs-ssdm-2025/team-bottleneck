import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from src.api.models import ParkingLot, OperatorProfile

TEST_PASSWORD = "pass"

@pytest.mark.django_db
def test_admin_can_make_other_user_admin():
    admin = User.objects.create_user("local_admin", password=TEST_PASSWORD, is_staff=True)
    user = User.objects.create_user("simple_user", password=TEST_PASSWORD)
    client = APIClient()
    client.force_authenticate(admin)

    url = f"/api/v1/users/{user.id}/make-admin/"
    resp = client.post(url)
    user.refresh_from_db()

    assert resp.status_code == 200
    assert user.is_staff is True


@pytest.mark.django_db
def test_admin_can_remove_admin_role():
    admin = User.objects.create_user("super", password=TEST_PASSWORD, is_staff=True)
    user = User.objects.create_user("staffer", password=TEST_PASSWORD, is_staff=True)
    client = APIClient()
    client.force_authenticate(admin)

    url = f"/api/v1/users/{user.id}/remove-admin/"
    resp = client.delete(url)
    user.refresh_from_db()

    assert resp.status_code == 200
    assert user.is_staff is False


@pytest.mark.django_db
def test_admin_can_assign_operator_to_lot():
    admin = User.objects.create_user("admin", password=TEST_PASSWORD, is_staff=True)
    user = User.objects.create_user("new_op", password=TEST_PASSWORD)
    lot = ParkingLot.objects.create(name="Central", city="Kyiv", street="Main")
    client = APIClient()
    client.force_authenticate(admin)

    url = f"/api/v1/users/{user.id}/make-operator/"
    resp = client.post(url, {"lot_id": lot.id}, format="json")

    user.refresh_from_db()
    assert resp.status_code in (200, 201)
    assert hasattr(user, "operator_profile")
    assert user.operator_profile.lot == lot


@pytest.mark.django_db
def test_admin_can_remove_operator():
    admin = User.objects.create_user("admin", password=TEST_PASSWORD, is_staff=True)
    user = User.objects.create_user("op_user", password=TEST_PASSWORD)
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=user, lot=lot)

    client = APIClient()
    client.force_authenticate(admin)

    url = f"/api/v1/users/{user.id}/remove-operator/"
    resp = client.delete(url)
    assert resp.status_code == 204
    user.refresh_from_db()
    assert not hasattr(user, "operator_profile")


@pytest.mark.django_db
def test_admin_can_create_and_delete_parking_lot():
    admin = User.objects.create_user("admin", password=TEST_PASSWORD, is_staff=True)
    client = APIClient()
    client.force_authenticate(admin)

    create_resp = client.post("/api/v1/lots/", {
        "name": "MallLot",
        "city": "Kyiv",
        "street": "Main",
        "building": "12A"
    }, format="json")
    assert create_resp.status_code == 201
    lot_id = create_resp.data["id"]

    delete_resp = client.delete(f"/api/v1/lots/{lot_id}/")
    assert delete_resp.status_code in (204, 200)
