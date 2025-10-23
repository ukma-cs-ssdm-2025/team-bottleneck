from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from src.api.models import ParkingLot, Spot, OperatorProfile

class TestSpotCreation(APITestCase):
    def setUp(self):
        self.lot = ParkingLot.objects.create(name="Central", city="Kyiv", street="Main")
        self.other_lot = ParkingLot.objects.create(name="West", city="Lviv", street="Green")
        self.operator = User.objects.create_user(username="op1", password="pass")
        OperatorProfile.objects.create(user=self.operator, lot=self.lot)
        self.not_operator = User.objects.create_user(username="u1", password="pass")


    def test_operator_creates_spot_in_own_lot_201(self):
        self.client.login(username="op1", password="pass")
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.lot.id})
        payload = {"number": "A1", "is_ev": True, "is_disabled": False}
        resp = self.client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["number"] == "A1"
        assert resp.data["lot"] == self.lot.id

    def test_operator_cannot_create_duplicate_spot_number_400(self):
        self.client.login(username="op1", password="pass")
        url = reverse("lot-spots-create-spot", kwargs={"lot_pk": self.lot.id})
        payload = {"number": "A1", "is_ev": True, "is_disabled": False}

        resp1 = self.client.post(url, payload, format="json")
        assert resp1.status_code == status.HTTP_201_CREATED

        resp2 = self.client.post(url, payload, format="json")
        assert resp2.status_code == status.HTTP_400_BAD_REQUEST
        assert "number" in resp2.data
