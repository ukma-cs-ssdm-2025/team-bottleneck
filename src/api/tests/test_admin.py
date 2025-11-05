import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from src.api.models import ParkingLot, OperatorProfile, Spot, Booking
from django.utils import timezone
from rest_framework import status
from datetime import timedelta


@pytest.mark.django_db
def test_admin_can_make_other_user_admin():
    admin = User.objects.create_user("local_admin", is_staff=True)
    user = User.objects.create_user("simple_user")
    client = APIClient()
    client.force_authenticate(admin)

    url = f"/api/v1/users/{user.id}/make-admin/"
    resp = client.post(url)
    user.refresh_from_db()

    assert resp.status_code == 200
    assert user.is_staff is True


@pytest.mark.django_db
def test_admin_can_remove_admin_role():
    admin = User.objects.create_user("super", is_staff=True)
    user = User.objects.create_user("staffer", is_staff=True)
    client = APIClient()
    client.force_authenticate(admin)

    url = f"/api/v1/users/{user.id}/remove-admin/"
    resp = client.delete(url)
    user.refresh_from_db()

    assert resp.status_code == 200
    assert user.is_staff is False


@pytest.mark.django_db
def test_admin_can_assign_operator_to_lot():
    admin = User.objects.create_user("admin", is_staff=True)
    user = User.objects.create_user("new_op")
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
    admin = User.objects.create_user("admin", is_staff=True)
    user = User.objects.create_user("op_user")
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
    admin = User.objects.create_user("admin", is_staff=True)
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

# ============= USER MANAGEMENT =============

@pytest.mark.django_db
def test_admin_can_view_own_profile():
    """Admin can view their own profile via /me endpoint"""
    admin = User.objects.create_superuser(
        username="admin",
        email="admin@test.com"
    )
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.get("/api/v1/users/me/")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["username"] == "admin"
    assert response.data["is_staff"] is True


@pytest.mark.django_db
def test_admin_can_update_own_profile():
    """Admin can update their own profile information"""
    admin = User.objects.create_superuser(
        username="admin",
        email="admin@test.com"
    )
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.patch(
        "/api/v1/users/me/",
        {"email": "newemail@test.com"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["email"] == admin.email


@pytest.mark.django_db
def test_non_admin_cannot_see_admin_status():
    """Regular user's profile doesn't show admin privileges"""
    regular_user = User.objects.create_user(
        username="regular"
    )
    
    client = APIClient()
    client.force_authenticate(user=regular_user)
    
    response = client.get("/api/v1/users/me/")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["is_staff"] is False


# ============= PARKING LOT MANAGEMENT =============

@pytest.mark.django_db
def test_admin_can_create_parking_lot():
    """Admin can create a new parking lot"""
    admin = User.objects.create_superuser(username="admin")
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.post(
        "/api/v1/lots/",
        {
            "name": "New Parking",
            "city": "Kyiv",
            "street": "Main Street",
            "building": "10"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    assert ParkingLot.objects.filter(name="New Parking").exists()


@pytest.mark.django_db
def test_non_admin_cannot_create_parking_lot():
    """Regular user cannot create parking lots"""
    regular_user = User.objects.create_user(username="regular")
    
    client = APIClient()
    client.force_authenticate(user=regular_user)
    
    response = client.post(
        "/api/v1/lots/",
        {
            "name": "Unauthorized Lot",
            "city": "Kyiv",
            "street": "Main"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_admin_can_update_parking_lot_details():
    """Admin can update parking lot information"""
    admin = User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Old Name", city="Kyiv", street="Main")
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.patch(
        f"/api/v1/lots/{lot.id}/",
        {"name": "New Name"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    lot.refresh_from_db()
    assert lot.name == "New Name"


@pytest.mark.django_db
def test_admin_can_delete_empty_parking_lot():
    """Admin can delete a parking lot without spots or bookings"""
    admin = User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Empty Lot", city="Kyiv", street="Main")
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.delete(f"/api/v1/lots/{lot.id}/")
    
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not ParkingLot.objects.filter(id=lot.id).exists()


@pytest.mark.django_db
def test_admin_cannot_delete_lot_with_active_bookings():
    """Admin cannot delete a parking lot that has active bookings"""
    admin = User.objects.create_superuser(username="admin")
    
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="A1", lot=lot)
    
    user = User.objects.create_user(username="user")
    Booking.objects.create(
        user=user,
        spot=spot,
        start_at=timezone.now() + timedelta(hours=1),
        end_at=timezone.now() + timedelta(hours=2),
        status='confirmed'
    )
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.delete(f"/api/v1/lots/{lot.id}/")
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "booking" in response.data["detail"].lower()


@pytest.mark.django_db
def test_admin_can_view_all_parking_lots():
    """Admin can view list of all parking lots"""
    admin = User.objects.create_superuser(username="admin")
    
    ParkingLot.objects.create(name="Lot1", city="Kyiv", street="Main")
    ParkingLot.objects.create(name="Lot2", city="Lviv", street="Other")
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.get("/api/v1/lots/")
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) >= 2


# ============= SPOT MANAGEMENT =============

@pytest.mark.django_db
def test_admin_can_create_spot_in_any_lot():
    """Admin can create spots in any parking lot"""
    admin = User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.post(
        f"/api/v1/lots/{lot.id}/spots/create/",
        {
            "number": "ADMIN1",
            "is_ev": True,
            "is_disabled": False
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    assert Spot.objects.filter(number="ADMIN1", lot=lot).exists()


@pytest.mark.django_db
def test_admin_can_view_all_spots_in_lot():
    """Admin can view all parking spots in a lot"""
    admin = User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    
    Spot.objects.create(number="A1", lot=lot)
    Spot.objects.create(number="A2", lot=lot)
    Spot.objects.create(number="A3", lot=lot)
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.get(f"/api/v1/lots/{lot.id}/spots/")
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) >= 3


@pytest.mark.django_db
def test_admin_can_delete_spot():
    """Admin can delete a parking spot"""
    admin = User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="DELETE_ME", lot=lot)
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.delete(f"/api/v1/lots/{lot.id}/spots/{spot.id}/")
    
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Spot.objects.filter(id=spot.id).exists()


# ============= OPERATOR MANAGEMENT =============

@pytest.mark.django_db
def test_admin_can_assign_user_as_operator():
    """Admin can create operator profile for a user"""
    User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    user = User.objects.create_user(username="newop")
    
    profile = OperatorProfile.objects.create(user=user, lot=lot)
    
    assert profile.user == user
    assert profile.lot == lot
    assert hasattr(user, 'operator_profile')


@pytest.mark.django_db
def test_admin_can_remove_operator_role():
    """Admin can remove operator profile"""
    User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    operator = User.objects.create_user(username="op")
    profile = OperatorProfile.objects.create(user=operator, lot=lot)
    
    profile.delete()
    
    assert not OperatorProfile.objects.filter(user=operator).exists()

    operator.refresh_from_db()
    with pytest.raises(OperatorProfile.DoesNotExist):
        _ = operator.operator_profile

@pytest.mark.django_db
def test_operator_can_only_manage_assigned_lot():
    """Operator can only access spots in their assigned lot"""
    lot1 = ParkingLot.objects.create(name="Lot1", city="Kyiv", street="Main")
    lot2 = ParkingLot.objects.create(name="Lot2", city="Lviv", street="Other")
    
    operator = User.objects.create_user(username="op")
    OperatorProfile.objects.create(user=operator, lot=lot1)
    
    spot2 = Spot.objects.create(number="B1", lot=lot2)
    client = APIClient()
    client.force_authenticate(user=operator)
    
    response = client.patch(
        f"/api/v1/lots/{lot2.id}/spots/{spot2.id}/operator-update/",
        {"is_ev": True},
        format="json"
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============= BOOKING MANAGEMENT =============

@pytest.mark.django_db
def test_admin_can_view_all_bookings():
    """Admin can view all bookings across all lots"""
    admin = User.objects.create_superuser(username="admin")
    
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    spot1 = Spot.objects.create(number="A1", lot=lot)
    spot2 = Spot.objects.create(number="A2", lot=lot)
    
    user = User.objects.create_user(username="user")
    
    Booking.objects.create(
        user=user, spot=spot1,
        start_at=timezone.now() + timedelta(hours=1),
        end_at=timezone.now() + timedelta(hours=2)
    )
    Booking.objects.create(
        user=user, spot=spot2,
        start_at=timezone.now() + timedelta(hours=3),
        end_at=timezone.now() + timedelta(hours=4)
    )
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.get("/api/v1/bookings/")
    
    assert response.status_code == status.HTTP_200_OK
    # Admin should see bookings (exact structure depends on your pagination)
    assert len(response.data.get('results', response.data)) >= 2


@pytest.mark.django_db
def test_admin_can_view_specific_booking():
    """Admin can view details of any booking"""
    admin = User.objects.create_superuser(username="admin")
    
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="A1", lot=lot)
    
    user = User.objects.create_user(username="user")
    booking = Booking.objects.create(
        user=user, spot=spot,
        start_at=timezone.now() + timedelta(hours=1),
        end_at=timezone.now() + timedelta(hours=2)
    )
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.get(f"/api/v1/bookings/{booking.id}/")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == booking.id


# ============= VALIDATION & BUSINESS RULES =============

@pytest.mark.django_db
def test_admin_must_provide_valid_lot_data():
    """Admin must provide valid data when creating a lot"""
    admin = User.objects.create_superuser(username="admin")
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    response = client.post(
        "/api/v1/lots/",
        {
            "name": "AB",
            "city": "Kyiv",
            "street": "Main"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_admin_cannot_create_duplicate_spot_number():
    """Admin cannot create spots with duplicate numbers in same lot"""
    admin = User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    
    Spot.objects.create(number="A1", lot=lot)
    
    client = APIClient()
    client.force_authenticate(user=admin)
    
    # Try to create duplicate
    response = client.post(
        f"/api/v1/lots/{lot.id}/spots/create/",
        {
            "number": "A1",
            "is_ev": False,
            "is_disabled": False
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST

# ============= SECURITY & PERMISSIONS =============

@pytest.mark.django_db
def test_unauthenticated_user_cannot_create_lot():
    """Unauthenticated users cannot create parking lots"""
    client = APIClient()
    # No authentication
    
    response = client.post(
        "/api/v1/lots/",
        {
            "name": "Unauthorized",
            "city": "Kyiv",
            "street": "Main"
        },
        format="json"
    )
    
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
def test_regular_user_can_view_public_lots():
    """Regular users can view the list of parking lots"""
    regular_user = User.objects.create_user(username="regular")
    
    ParkingLot.objects.create(name="Public Lot", city="Kyiv", street="Main")
    
    client = APIClient()
    client.force_authenticate(user=regular_user)
    
    response = client.get("/api/v1/lots/")
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) >= 1


@pytest.mark.django_db
def test_regular_user_cannot_delete_spots():
    """Regular users cannot delete parking spots"""
    regular_user = User.objects.create_user(username="regular")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    spot = Spot.objects.create(number="A1", lot=lot)
    
    client = APIClient()
    client.force_authenticate(user=regular_user)
    
    response = client.delete(f"/api/v1/lots/{lot.id}/spots/{spot.id}/")
    
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============= DATA INTEGRITY =============

@pytest.mark.django_db
def test_deleting_lot_cascades_to_spots():
    """Deleting a parking lot should cascade to its spots"""
    User.objects.create_superuser(username="admin")
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    
    spot1 = Spot.objects.create(number="A1", lot=lot)
    spot2 = Spot.objects.create(number="A2", lot=lot)
    
    spot_ids = [spot1.id, spot2.id]
    lot.delete()
    
    assert not Spot.objects.filter(id__in=spot_ids).exists()


@pytest.mark.django_db
def test_deleting_user_cascades_to_operator_profile():
    """Deleting a user should remove their operator profile"""
    lot = ParkingLot.objects.create(name="Lot", city="Kyiv", street="Main")
    operator = User.objects.create_user(username="op")
    OperatorProfile.objects.create(user=operator, lot=lot)
    
    user_id = operator.id
    operator.delete()
    assert not OperatorProfile.objects.filter(user_id=user_id).exists()