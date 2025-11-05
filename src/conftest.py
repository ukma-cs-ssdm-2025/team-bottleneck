import pytest
from django.contrib.auth.models import User

# SonarQube/SonarCloud suppression for test password
TEST_PASSWORD = "test_secure_password_2024"  # noqa: S105


@pytest.fixture
def test_password():
    """Provides test password - not for production use"""
    return TEST_PASSWORD


@pytest.fixture
def create_user(db, test_password):
    """Factory for creating test users"""
    def make_user(username, **kwargs):
        return User.objects.create_user(
            username=username,
            password=kwargs.get('password', test_password),
            **kwargs
        )
    return make_user