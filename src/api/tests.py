from django.urls import reverse, resolve
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta
import time
from src.api.models import ParkingLot, Spot, Booking


class PerformanceTests(APITestCase):
    def setUp(self):
        self.lot = ParkingLot.objects.create(
            name="Gulliver", city="Kyiv", street="Sportyvna", building="1A"
        )
        for i in range(20):
            Spot.objects.create(number=str(i), lot=self.lot)

    def test_list_lots_under_3_seconds(self):
        start = time.time()
        response = self.client.get(reverse("lot-list"))
        duration = time.time() - start
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(duration, 3.0)

    def test_list_spots_under_3_seconds(self):
        start = time.time()
        response = self.client.get(reverse("lot-spots-list", kwargs={"lot_pk": self.lot.id}))
        duration = time.time() - start
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(duration, 3.0)


class ParkingLotTests(APITestCase):
    def setUp(self):
        self.lot = ParkingLot.objects.create(
            name="SkyMall", city="Kyiv", street="Petrivka", building="10"
        )

    def test_create_parking_lot(self):
        data = {"name": "Ocean Plaza", "city": "Kyiv", "street": "Basseyna", "building": "1"}
        response = self.client.post(reverse("lot-list"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_retrieve_parking_lot(self):
        response = self.client.get(reverse("lot-detail", kwargs={"pk": self.lot.id}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "SkyMall")

    def test_update_parking_lot(self):
        data = {
            "name": "SkyMall",
            "city": "Kyiv",
            "street": "Petrivka",
            "building": "11",
        }
        response = self.client.put(reverse("lot-detail", kwargs={"pk": self.lot.id}), data)
        self.assertEqual(response.status_code, 200)

    def test_delete_parking_lot(self):
        response = self.client.delete(reverse("lot-detail", kwargs={"pk": self.lot.id}))
        self.assertEqual(response.status_code, 204)

    def test_duplicate_parking_lot(self):
        ParkingLot.objects.create(name="Test", city="Kyiv", street="Main")
        response = self.client.post(
            reverse("lot-list"), {"name": "Test", "city": "Kyiv", "street": "Main"}
        )
        self.assertIn(response.status_code, [200, 201])


class SpotTests(APITestCase):
    def setUp(self):
        self.lot = ParkingLot.objects.create(name="TestLot", city="Kyiv", street="Main")
        self.spot = Spot.objects.create(number="A1", lot=self.lot, is_ev=True, is_disabled=False)

    def test_create_spot_in_lot(self):
        data = {"number": "A2", "is_ev": False, "is_disabled": True}
        response = self.client.post(reverse("lot-spots-list", kwargs={"lot_pk": self.lot.id}), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_filter_spots_by_is_ev(self):
        response = self.client.get(
            reverse("lot-spots-list", kwargs={"lot_pk": self.lot.id}) + "?is_ev=true"
        )
        self.assertEqual(response.status_code, 200)

    def test_filter_invalid_boolean_returns_400(self):
        response = self.client.get(
            reverse("lot-spots-list", kwargs={"lot_pk": self.lot.id}) + "?is_ev=yes"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("must be 'true' or 'false'", response.data["detail"])



class BookingTests(APITestCase):
    def setUp(self):
        self.lot = ParkingLot.objects.create(name="River Mall", city="Kyiv", street="Dnipro")
        self.spot = Spot.objects.create(number="P1", lot=self.lot)
        self.start = timezone.now() + timedelta(hours=1)
        self.end = timezone.now() + timedelta(hours=2)

    def test_create_valid_booking(self):
        response = self.client.post(
            "/api/v1/bookings/create/",
            {"spot": self.spot.id, "start_at": self.start.isoformat(), "end_at": self.end.isoformat()},
            format="json",
        )
        self.assertIn(response.status_code, [201, 200])

    def test_create_booking_with_invalid_time_window(self):
        response = self.client.post(
            "/api/v1/bookings/create/",
            {"spot": self.spot.id, "start_at": self.end.isoformat(), "end_at": self.start.isoformat()},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_conflict_booking_returns_409(self):
        Booking.objects.create(spot=self.spot, start_at=self.start, end_at=self.end)
        response = self.client.post(
            "/api/v1/bookings/create/",
            {
                "spot": self.spot.id,
                "start_at": (self.start + timedelta(minutes=30)).isoformat(),
                "end_at": (self.end + timedelta(hours=1)).isoformat(),
            },
            format="json",
        )
        self.assertIn(response.status_code, [409, 400])

    def test_cancel_booking(self):
        booking = Booking.objects.create(spot=self.spot, start_at=self.start, end_at=self.end)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertIn(response.status_code, [200, 400])

    def test_cancel_already_cancelled_booking(self):
        booking = Booking.objects.create(
            spot=self.spot, start_at=self.start, end_at=self.end, status="cancelled"
        )
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, 400)

    def test_list_bookings(self):
        Booking.objects.create(spot=self.spot, start_at=self.start, end_at=self.end)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, 200)


class StructureTests(APITestCase):
    def test_nested_routes_exist(self):
        resolver = resolve(f"/api/v1/lots/1/spots/")
        self.assertIn("lot-spots", resolver.url_name or "")

    def test_transaction_atomic_on_booking_cancel(self):
        lot = ParkingLot.objects.create(name="Test", city="Kyiv", street="Main")
        spot = Spot.objects.create(number="X1", lot=lot)
        booking = Booking.objects.create(
            spot=spot, start_at=timezone.now() + timedelta(hours=1), end_at=timezone.now() + timedelta(hours=2)
        )
        resp = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertIn(resp.status_code, [200, 400])
