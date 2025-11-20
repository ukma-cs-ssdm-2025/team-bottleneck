# Project Progress Report: "Parking System"
Date: 19.11.25


## Implementation Details

### Database
- [x] Connected to PostgreSQL

### Backend
- [x] Basic authentication  
- [x] Database hosted on AWS  
- [x] 18 out of 18 endpoints implemented  
- [x] Operator functionality implemented
- [x] Admin functionality implemented  

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
- [x] Almost all pages for the operator implemented
- [x] Almost all pages for the admin implemented  

### Frontend Structure Overview
```text
frontend/
└── src/                                # Source files of the React app (JavaScript/JSX)
    ├── api/                            # Configuration and methods for REST API interaction
    │   ├── adminAPI.js                 # NEW: API functions for Admin/Operator endpoints
    │   ├── apiClient.js                # Base HTTP client (Axios)
    │   ├── operatorAPI.js              # NEW: API functions for Operator endpoints
    │   └── parkingAPI.js               # Functions for general API calls (Lots, Bookings)
    │
    ├── components/                     # Reusable UI components
    │   ├── admin/                      # NEW: Components specific to Admin/Operator views
    │   │   ├── ParkingLotForm.jsx      # Form for creating/editing parking lots
    │   │   ├── ParkingLotsTable.jsx    # Table view for parking lots
    │   │   └── UserManagementTable.jsx # Component for managing users
    │   ├── layout/
    │   │   └── Header.jsx              # Header / Navigation bar
    │   └── ... other components
    │
    ├── constants/                      # Global constants (e.g., apiConfig.js)
    ├── context/                        # React Context for global state (e.g., AuthContext.js)
    │
    ├── pages/                          # Components mapped to individual routes/pages
    │   ├── AdminDashboardPage.jsx      # NEW: Main Admin view
    │   ├── BookingCreatePage.jsx       # Booking creation page
    │   ├── HomePage.jsx                # Home page
    │   ├── LotDetailsPage.jsx          # Parking lot details page
    │   ├── OperatorPage.jsx            # NEW: Operator-specific dashboard/view
    │   ├── ParkingLotCreatePage.jsx    # NEW: Page for creating a new lot
    │   ├── ParkingLotEditPage.jsx      # NEW: Page for editing a lot
    │   ├── ParkingLotListPage.jsx      # NEW: Page listing all lots 
    │   ├── ProfilePage.jsx             # User profile page
    │   ├── RegisterPage.jsx            # Registration page
    │   ├── SingleLoginPage.jsx         # Login page (updated)
    │   ├── SpotCreatePage.jsx          # NEW: Page for creating a spot
    │   ├── SpotDetailsPage.jsx         # NEW: Spot details view
    │   ├── SpotSelectionPage.jsx       # Spot/time selection page
    │   └── UserManagementPage.jsx      # NEW: Page for user management
    │
    ├── routes/                         # Routing configuration
    │   └── AdminRoute.jsx              # NEW: Route guard/wrapper for Admin pages
    │   └── AppRouter.jsx
    │
    ├── styles/                         # CSS style files (e.g., global.css, theme.js)
    ├── utils/                          # Helper functions (e.g., dateTimeUtils.js)
    ├── App.jsx                         # Root application component
    └── index.js                        # Application entry point
```

### Technologies Used

- Backend: Python, Django REST Framework  
- Database: PostgreSQL  
- Frontend: React, JavaScript, CSS  
- Documentation: OpenAPI 3.0, Swagger UI  
- Code Analysis & Quality: Bandit
