from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from src.api.models import ParkingLot, Spot, Booking
from django.contrib.auth.models import User


class TestSpotAvailabilityFilter(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.lot = ParkingLot.objects.create(
            name="Test Lot",
            city="Kyiv",
            street="Test Street",
            building="1"
        )

        self.spot1 = Spot.objects.create(number="P1", lot=self.lot, is_ev=False, is_disabled=False)
        self.spot2 = Spot.objects.create(number="P2", lot=self.lot, is_ev=False, is_disabled=False)
        self.spot3 = Spot.objects.create(number="P3", lot=self.lot, is_ev=True, is_disabled=False)

        self.user = User.objects.create_user(username="testuser", password="testpass")

    def test_booked_spot_excluded_from_results(self):
        start = timezone.now() + timedelta(hours=1)
        end = timezone.now() + timedelta(hours=3)

        Booking.objects.create(
            user=self.user,
            spot=self.spot1,
            start_at=start,
            end_at=end,
            status="confirmed"
        )

        response = self.client.get(
            f'/api/v1/lots/{self.lot.id}/spots/',
            {
                'available_from': start.isoformat(),
                'available_to': end.isoformat()
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)

        spot_ids = [spot['id'] for spot in response.data['results']]
        self.assertNotIn(self.spot1.id, spot_ids)
        self.assertIn(self.spot2.id, spot_ids)
        self.assertIn(self.spot3.id, spot_ids)

    def test_exact_time_match_excludes_spot(self):
        start = timezone.now().replace(hour=14, minute=0, second=0, microsecond=0)
        end = timezone.now().replace(hour=16, minute=0, second=0, microsecond=0)

        Booking.objects.create(
            user=self.user,
            spot=self.spot2,
            start_at=start,
            end_at=end,
            status="confirmed"
        )

        response = self.client.get(
            f'/api/v1/lots/{self.lot.id}/spots/',
            {
                'available_from': start.isoformat(),
                'available_to': end.isoformat()
            }
        )

        spot_ids = [spot['id'] for spot in response.data['results']]
        self.assertNotIn(self.spot2.id, spot_ids)