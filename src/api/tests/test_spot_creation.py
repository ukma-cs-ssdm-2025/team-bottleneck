from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from src.api.models import ParkingLot, OperatorProfile

TEST_PASSWORD = "pass"
class TestSpotCreation(APITestCase):
    def setUp(self):
        self.lot = ParkingLot.objects.create(name="Central", city="Kyiv", street="Main")
        self.other_lot = ParkingLot.objects.create(name="West", city="Lviv", street="Green")
        self.operator = User.objects.create_user(username="op1", password=TEST_PASSWORD)
        OperatorProfile.objects.create(user=self.operator, lot=self.lot)
        self.not_operator = User.objects.create_user(username="u1", password=TEST_PASSWORD)


    def test_operator_creates_spot_in_own_lot_201(self):
        self.client.login(username="op1", password=TEST_PASSWORD)
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.lot.id})
        payload = {"number": "A1", "is_ev": True, "is_disabled": False}
        resp = self.client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["number"] == "A1"
        assert resp.data["lot"] == self.lot.id

    def test_operator_cannot_create_duplicate_spot_number_400(self):
        self.client.login(username="op1", password=TEST_PASSWORD)
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.lot.id})
        payload = {"number": "A1", "is_ev": True, "is_disabled": False}

        resp1 = self.client.post(url, payload, format="json")
        assert resp1.status_code == status.HTTP_201_CREATED

        resp2 = self.client.post(url, payload, format="json")
        assert resp2.status_code == status.HTTP_400_BAD_REQUEST
        assert "number" in resp2.data

    def test_operator_cannot_create_spot_in_other_lot(self):
        """
        Operator must not be allowed to create a spot in a lot they don't manage.
        Should return 403 Forbidden.
        """
        # Arrange
        self.client.login(username="op1", password=TEST_PASSWORD)
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.other_lot.id})
        payload = {"number": "X1", "is_ev": False, "is_disabled": False}

        # Act
        resp = self.client.post(url, payload, format="json")

        # Assert
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in resp.data
        assert "do not have permission" in resp.data["detail"].lower()

    def test_non_operator_cannot_create_spot(self):
        """
        A normal authenticated user without operator profile
        should not be able to create spots.
        """
        self.client.login(username="u1", password=TEST_PASSWORD)  # not an operator
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.lot.id})
        payload = {"number": "B1", "is_ev": False, "is_disabled": False}

        resp = self.client.post(url, payload, format="json")

        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in resp.data

    def test_operator_cannot_create_spot_with_empty_number(self):
        """
        Operator should not be able to create a spot with an empty number.
        """
        self.client.login(username="op1", password=TEST_PASSWORD)
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.lot.id})
        payload = {"number": "", "is_ev": False, "is_disabled": False}

        resp = self.client.post(url, payload, format="json")

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "number" in resp.data

    def test_operator_cannot_create_spot_with_same_number_different_case(self):
        """
        Spot numbers should be case-insensitive (A1 == a1).
        """
        self.client.login(username="op1", password=TEST_PASSWORD)
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.lot.id})

        # Create first spot
        payload1 = {"number": "A1", "is_ev": False, "is_disabled": False}
        resp1 = self.client.post(url, payload1, format="json")
        assert resp1.status_code == status.HTTP_201_CREATED

        # Try to create same number with different case
        payload2 = {"number": "a1", "is_ev": False, "is_disabled": False}
        resp2 = self.client.post(url, payload2, format="json")

        assert resp2.status_code == status.HTTP_400_BAD_REQUEST
        assert "number" in resp2.data