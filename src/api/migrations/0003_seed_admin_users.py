from django.db import migrations
from django.contrib.auth.hashers import make_password

ADMIN_USERS_DATA = [
    {
        "username": "main_admin",
        "password": "adminchik", 
        "email": "admin1@example.com",
    },
    {
        "username": "second_admin",
        "password": "adminchik2", 
        "email": "admin2@example.com",
    },
]

def create_admin_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')

    for admin_data in ADMIN_USERS_DATA:
        username = admin_data["username"]
        
        if not User.objects.filter(username=username).exists():
            User.objects.create(
                username=username,
                email=admin_data["email"],
                password=make_password(admin_data["password"]),
                is_staff=True,
                is_superuser=False  
            )
        else:
            print(f"Користувач {username} вже існує, пропущено.")


def remove_admin_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    admin_usernames = [data["username"] for data in ADMIN_USERS_DATA]
    
    User.objects.filter(
        username__in=admin_usernames,
        is_staff=True
    ).delete()


class Migration(migrations.Migration):

    dependencies = [('api', '0002_spot_created_by'), ]

    operations = [
        migrations.RunPython(create_admin_users, remove_admin_users),
    ]