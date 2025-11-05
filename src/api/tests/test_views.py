import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from src.api.models import ParkingLot, Spot, Booking, OperatorProfile
from django.utils import timezone
import time
from django.conf import settings

TEST_PASSWORD = settings.TEST_USER_PASSWORD

@pytest.mark.django_db
def test_operator_cancels_booking_and_reason_is_detailed():
    operator_user = User.objects.create_user(username="op_test")
    lot = ParkingLot.objects.create(name="LotA", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=operator_user, lot=lot)
    spot = Spot.objects.create(number="A1", lot=lot)
    
    other_user = User.objects.create_user(username="client_user")
    booking = Booking.objects.create(
        user=other_user,
        spot=spot,
        start_at=timezone.now() + timezone.timedelta(hours=1),
        end_at=timezone.now() + timezone.timedelta(hours=2),
        status='confirmed'
    )
    
    client = APIClient()
    client.force_authenticate(user=operator_user) 
    
    cancel_url = f'/api/v1/bookings/{booking.id}/cancel-operator/'
    response = client.post(
        cancel_url, 
        {"reason": "Vehicle must be moved for cleaning."},
        format='json'
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    booking.refresh_from_db()

    expected_reason_part = f"Cancelled by Operator ({operator_user.username})"
    
    assert booking.cancellation_reason.startswith(expected_reason_part)
    assert "cleaning" in booking.cancellation_reason
    assert booking.status == 'cancelled'

@pytest.mark.django_db
def test_operator_can_patch_own_spot():
    client = APIClient()

    operator_user = User.objects.create_user(username="op")
    lot = ParkingLot.objects.create(name="Mall", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=operator_user, lot=lot)
    spot = Spot.objects.create(number="A1", lot=lot, is_ev=False, is_disabled=False)

    client.force_authenticate(user=operator_user)

    url = f"/api/v1/lots/{lot.id}/spots/{spot.id}/operator-update/"
    response = client.patch(url, {"is_ev": True}, format="json")
    spot.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert spot.is_ev is True

@pytest.mark.django_db
def test_parking_lot_list_and_detail():
    lot = ParkingLot.objects.create(name="Sky", city="Kyiv", street="Main")
    Spot.objects.create(number="A1", lot=lot)
    client = APIClient()
    resp_list = client.get("/api/v1/lots/")
    assert resp_list.status_code == 200
    resp_detail = client.get(f"/api/v1/lots/{lot.id}/")
    assert resp_detail.status_code == 200
    assert "Sky" in str(resp_detail.data)

@pytest.mark.django_db
def test_create_and_cancel_booking():
    user = User.objects.create_user("user")
    client = APIClient()
    client.force_authenticate(user)
    lot = ParkingLot.objects.create(name="Test", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="A1", lot=lot)
    start = timezone.now() + timezone.timedelta(hours=1)
    end = start + timezone.timedelta(hours=1)

    resp = client.post("/api/v1/bookings/create/", {"spot": spot.id, "start_at": start, "end_at": end}, format="json")
    assert resp.status_code == 201
    booking_id = resp.data["id"]

    cancel = client.post(f"/api/v1/bookings/{booking_id}/cancel/", {"reason": "no longer needed"}, format="json")
    assert cancel.status_code == 200
    assert cancel.data["status"] == "cancelled"

@pytest.mark.django_db
def test_user_register_and_update_me():
    client = APIClient()
    reg = client.post("/api/v1/users/register/", {"username": "newu", "email": "n@e.com", "password": settings.STRONG_PASSWORD_FOR_TESTS}, format="json")
    assert reg.status_code == 201
    user = User.objects.get(username="newu")
    client.force_authenticate(user)
    patch = client.patch("/api/v1/users/me/", {"first_name": "Valya"}, format="json")
    assert patch.status_code == 200
    assert patch.data["first_name"] == "Valya"

@pytest.mark.django_db
def test_operator_cannot_change_spot_number():
    api_client=APIClient()
    from django.contrib.auth.models import User
    from src.api.models import ParkingLot, Spot, OperatorProfile
    from rest_framework import status

    user = User.objects.create_user(username="operator")
    lot = ParkingLot.objects.create(name="Mall", city="Kyiv", street="Main")
    OperatorProfile.objects.create(user=user, lot=lot)
    spot = Spot.objects.create(number="A1", lot=lot, is_ev=False, is_disabled=False)

    api_client.force_authenticate(user)

    url = f"/api/v1/lots/{lot.id}/spots/{spot.id}/operator-update/"
    response = api_client.patch(url, {"number": "Z9"}, format="json")
    spot.refresh_from_db()

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert spot.number == "A1"

@pytest.mark.django_db
def test_operator_cannot_patch_spot_from_other_lot():
    client = APIClient()

    lot1 = ParkingLot.objects.create(name="Lot 1", city="Kyiv", street="Main")
    lot2 = ParkingLot.objects.create(name="Lot 2", city="Kyiv", street="Side")

    operator = User.objects.create_user(username="op1")
    OperatorProfile.objects.create(user=operator, lot=lot1)

    spot_other_lot = Spot.objects.create(number="B2", lot=lot2, is_ev=False, is_disabled=False)

    client.force_authenticate(operator)
    url = f"/api/v1/lots/{lot2.id}/spots/{spot_other_lot.id}/operator-update/"

    resp = client.patch(url, {"is_ev": True}, format="json")
    spot_other_lot.refresh_from_db()

    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert spot_other_lot.is_ev is False

def test_list_spots_performance(db):
    client = APIClient()
    lot = ParkingLot.objects.create(
        name="Test Lot",
        building="Main Tower",
        city="Kyiv"
    )
    Spot.objects.create(lot=lot, number="A1")
    url = f"/api/v1/lots/{lot.id}/spots/"
    start = time.perf_counter()
    response = client.get(url)
    elapsed = time.perf_counter() - start

    assert response.status_code == 200, response.data
    assert elapsed < 3

@pytest.mark.django_db
def test_delete_nonexistent_spot_returns_404():
    client = APIClient()
    admin = User.objects.create_user(username="admin", is_staff=True)
    client.force_authenticate(admin)
    resp = client.delete("/api/v1/lots/999/spots/999/")
    assert resp.status_code == 404

@pytest.mark.django_db
def test_spot_list_loads_under_half_second():
    lot = ParkingLot.objects.create(name="PerfLot", city="Kyiv", street="Main")
    Spot.objects.bulk_create([Spot(number=f"S{i}", lot=lot) for i in range(1000)])
    client = APIClient()
    start = time.perf_counter()
    resp = client.get(f"/api/v1/lots/{lot.id}/spots/")
    elapsed = time.perf_counter() - start
    assert resp.status_code == 200
    assert elapsed < 0.5

@pytest.mark.django_db
def test_operator_can_update_own_spot():
    client = APIClient()
    user = User.objects.create_user(username="op")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    profile = OperatorProfile.objects.create(user=user, lot=lot)
    spot = Spot.objects.create(number="A1", lot=lot)
    
    client.force_authenticate(user=user)
    
    url = f"/api/v1/lots/{lot.id}/spots/{spot.id}/operator-update/"
    
    response = client.patch(url, {"is_ev": True}, format="json")
    
    assert response.status_code == 200
    
@pytest.mark.django_db
def test_operator_cannot_update_other_lot_spot():
    
    client = APIClient()
    op1 = User.objects.create_user(username="op1")
    lot1 = ParkingLot.objects.create(name="Lot1", city="Kyiv", street="Main")
    lot2 = ParkingLot.objects.create(name="Lot2", city="Lviv", street="Other")
    OperatorProfile.objects.create(user=op1, lot=lot1)
    spot2 = Spot.objects.create(number="B1", lot=lot2)
    
    client.force_authenticate(user=op1)
    
    url = f"/api/v1/lots/{lot2.id}/spots/{spot2.id}/operator-update/"
    response = client.patch(url, {"is_ev": True}, format="json")
    
    assert response.status_code == 403
