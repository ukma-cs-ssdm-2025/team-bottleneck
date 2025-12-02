from pathlib import Path

from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY')

DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="127.0.0.1,13.61.159.130", cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    "rest_framework",
    "drf_spectacular",
    "rest_framework_simplejwt",
    "corsheaders",
    
    'src.api',
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware", 
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'src.parking.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'src.parking.wsgi.application'

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        'rest_framework.permissions.IsAuthenticated',
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Smart Parking API",
    "DESCRIPTION": "Search lots/spots, book & cancel.",
    "VERSION": "0.1.0",
}

from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
}

CORS_ALLOW_ALL_ORIGINS = True 

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"}
}

try:
    if config("RDS_DB_NAME", default=None):
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": config("RDS_DB_NAME"),
                "USER": config("RDS_USERNAME"),
                "PASSWORD": config("RDS_PASSWORD"),
                "HOST": config("RDS_HOSTNAME"),
                "PORT": config("RDS_PORT", "5432"),
                "OPTIONS": {
                    "connect_timeout": 10,
                    "options": "-c statement_timeout=30000"
                },
                "CONN_MAX_AGE": 60,
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
except NameError:
    pass 

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", default="sk-test...")
STRIPE_PUBLIC_KEY = config("STRIPE_PUBLIC_KEY", default="pk-test...")
STRIPE_CURRENCY = config("STRIPE_CURRENCY", default="usd")
TEST_USER_PASSWORD = config('TEST_USER_PASSWORD', default='your_pass')
STRONG_PASSWORD_FOR_TESTS = config('STRONG_PASSWORD_FOR_TESTS', default='your_strong_pass')





EMAIL_BACKEND = config( 

    'EMAIL_BACKEND',  

    default='django.core.mail.backends.smtp.EmailBackend' 

) 


EMAIL_HOST = config('EMAIL_HOST', default='')  

EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int) 

EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='') 

EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='') 



EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool) 



 


DEFAULT_FROM_EMAIL = EMAIL_HOST_USER 

SERVER_EMAIL = EMAIL_HOST_USER 