from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from src.api.models import ParkingLot, OperatorProfile
import pytest


@pytest.mark.django_db
class TestSpotCreation:
    """Test suite for spot creation by operators"""
    
    def setup_method(self):
        """Set up test data before each test"""
        # Create parking lots
        self.lot = ParkingLot.objects.create(
            name="Central", 
            city="Kyiv", 
            street="Main"
        )
        self.other_lot = ParkingLot.objects.create(
            name="West", 
            city="Lviv", 
            street="Green"
        )
        
        self.operator = User.objects.create_user(username="op1")
        self.not_operator = User.objects.create_user(username="u1")
        
        # Assign operator to lot
        OperatorProfile.objects.create(user=self.operator, lot=self.lot)
        
        # Create client
        self.client = APIClient()

    def test_operator_creates_spot_in_own_lot_201(self):
        """Operator can successfully create a spot in their assigned lot"""
        # Use force_authenticate instead of login
        self.client.force_authenticate(user=self.operator)
        
        url = f"/api/v1/lots/{self.lot.id}/spots/create/"
        payload = {"number": "A1", "is_ev": True, "is_disabled": False}
        
        resp = self.client.post(url, payload, format="json")
        
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["number"] == "A1"
        assert resp.data["lot"] == self.lot.id

    def test_operator_cannot_create_duplicate_spot_number_400(self):
        """Operator cannot create spots with duplicate numbers in same lot"""
        self.client.force_authenticate(user=self.operator)
        
        url = f"/api/v1/lots/{self.lot.id}/spots/create/"
        payload = {"number": "A1", "is_ev": True, "is_disabled": False}

        # Create first spot
        resp1 = self.client.post(url, payload, format="json")
        assert resp1.status_code == status.HTTP_201_CREATED

        # Try to create duplicate
        resp2 = self.client.post(url, payload, format="json")
        assert resp2.status_code == status.HTTP_400_BAD_REQUEST
        assert "number" in resp2.data

    def test_operator_cannot_create_spot_in_other_lot(self):
        """Operator cannot create spots in lots they don't manage"""
        self.client.force_authenticate(user=self.operator)
        
        url = f"/api/v1/lots/{self.other_lot.id}/spots/create/"
        payload = {"number": "X1", "is_ev": False, "is_disabled": False}

        resp = self.client.post(url, payload, format="json")

        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in resp.data

    def test_non_operator_cannot_create_spot(self):
        """Regular users without operator profile cannot create spots"""
        self.client.force_authenticate(user=self.not_operator)
        
        url = f"/api/v1/lots/{self.lot.id}/spots/create/"
        payload = {"number": "B1", "is_ev": False, "is_disabled": False}

        resp = self.client.post(url, payload, format="json")

        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in resp.data

    def test_operator_cannot_create_spot_with_empty_number(self):
        """Operator cannot create spot with empty spot number"""
        self.client.force_authenticate(user=self.operator)
        
        url = f"/api/v1/lots/{self.lot.id}/spots/create/"
        payload = {"number": "", "is_ev": False, "is_disabled": False}

        resp = self.client.post(url, payload, format="json")

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "number" in resp.data

    def test_operator_cannot_create_spot_with_same_number_different_case(self):
        """Spot numbers are case-insensitive (A1 == a1)"""
        self.client.force_authenticate(user=self.operator)
        
        url = f"/api/v1/lots/{self.lot.id}/spots/create/"

        # Create first spot
        payload1 = {"number": "A1", "is_ev": False, "is_disabled": False}
        resp1 = self.client.post(url, payload1, format="json")
        assert resp1.status_code == status.HTTP_201_CREATED

        # Try to create same number with different case
        payload2 = {"number": "a1", "is_ev": False, "is_disabled": False}
        resp2 = self.client.post(url, payload2, format="json")

        assert resp2.status_code == status.HTTP_400_BAD_REQUEST
        assert "number" in resp2.data