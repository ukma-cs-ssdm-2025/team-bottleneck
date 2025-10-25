# Project Progress Report: "Parking System"
Date: 25.10.25

## Current Overview
During Lab 6, our team implemented user-role pages on the frontend and operator endpoints on the backend.  
We also created and documented [debugging-log.md](debugging-log.md) and [testing-strategy.md](testing-strategy.md).

## Implementation Details

### Database
- [x] Connected to PostgreSQL

### Backend
- [x] Basic authentication  
- [x] Database hosted on AWS  
- [x] 14 out of 18 endpoints implemented  
- [x] Operator functionality implemented  

### Backend Structure Overview
```text
src/
└── api/                          # Main Django application
    ├── __pycache__/
    ├── migrations/               # Database migration files
    ├── tests/                    # Unit and integration tests
    │   ├── __pycache__/
    │   ├── __init__.py
    │   ├── test_models.py        # Model tests
    │   ├── test_permissions.py   # Permission tests
    │   ├── test_serializers.py   # Serializer tests
    │   ├── test_services.py      # Service layer tests
    │   ├── test_spot_creation.py # Spot creation logic tests
    │   ├── test_validators.py    # Validator tests
    │   └── test_views.py         # API endpoint tests
    │
    ├── __init__.py
    ├── admin.py                  # Django Admin configuration
    ├── apps.py                   # Application configuration
    ├── models.py                 # Data models (ParkingLot, Spot, Booking, etc.)
    ├── permissions.py            # DRF permission classes (e.g., IsLotOperator)
    ├── serializers.py            # DRF serializers
    ├── services.py               # Business logic (e.g., PaymentService)
    ├── swagger.py                # OpenAPI/Swagger configuration
    ├── urls.py                   # URL routing (including nested routers)
    ├── validators.py             # Custom validation functions
    └── views.py                  # ViewSets and API logic (e.g., SpotViewSet)
```
### Frontend
- [x] Basic structure created  
- [x] All pages for the user role implemented  


### Frontend Structure Overview
```text
frontend/  
│  
├── src/                            # Source files of the React app
│   ├── api/                        # Configuration and methods for REST API interaction
│   │   ├── apiClient.js            # Base HTTP client (Axios)
│   │   └── parkingAPI.js           # Functions for API calls (Lots, Bookings)
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── layout/                 # Layout components (header, footer)
│   │   │   └── Header.jsx          # Header / Navigation bar
│   │   └── ... other components
│   │
│   ├── constants/                  # Global constants
│   ├── context/                    # React Context for global state
│   ├── pages/                      # Components mapped to individual routes/pages
│   │   ├── BookingCreatePage.jsx   # Booking creation page
│   │   ├── HomePage.jsx            # Home page
│   │   ├── LoginPage.jsx           # Login page
│   │   ├── LotDetailsPage.jsx      # Parking lot details page
│   │   ├── ProfilePage.jsx         # User profile page
│   │   ├── RegisterPage.jsx        # Registration page
│   │   └── SpotSelectionPage.jsx   # Spot/time selection page
│   │
│   ├── routes/                     # Routing configuration (AppRouter.jsx)
│   ├── styles/                     # CSS style files
│   ├── utils/                      # Helper functions (validation, formatting)
│   ├── App.jsx                     # Root application component
│   └── index.js                    # Application entry point
│
└── package.json                    # Dependency configuration
```

### Technologies Used

- Backend: Python, Django REST Framework  
- Database: PostgreSQL  
- Frontend: React, JavaScript, CSS  
- Documentation: OpenAPI 3.0, Swagger UI  
- Code Analysis & Quality: Bandit
