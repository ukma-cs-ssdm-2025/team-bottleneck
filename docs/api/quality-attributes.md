### API Quality Attributes

### Performance

- **Target**: The list of available parking spots, payment history, or parking map must be displayed within ≤ 3 seconds after a request.  
- **Implementation**:
    - ORM with `select_related()` is used in `SpotViewSet` and `BookingViewSet` to reduce the number of SQL queries.
    - Main endpoints (`/lots/`, `/lots/{id}/spots/`, `/bookings/`) perform simple filtering operations without complex calculations.
    - DRF serializers create optimized responses without redundant nested structures.
    - Built-in pagination reduces the response size, improving list rendering speed.
    - `select_related("lot")` is used to preload related parking lot data for each spot.
- **Measurement**:
    
    Query execution time is checked through tests:
    
    - `test_list_lots_under_3_seconds`
    - `test_list_spots_under_3_seconds`
    
    Both tests confirm that the `/api/v1/lots/` and `/api/v1/lots/{id}/spots/` requests return responses ≤ 3 seconds. If the time limit is exceeded, the test fails.

---

### Usability

- **Target**: The API must have a clear structure and be easy to use for both users and developers.  
- **Implementation:**
    - Automatic documentation through **Swagger UI (drf-spectacular)** — all endpoints have described parameters, examples, and response types.
    - Error messages are user-friendly and understandable, for example:
        
        `"Spot already booked in this interval."`, `"start_at must be before end_at"`.
        
    - Validation in serializers (`ParkingLotSerializer`, `BookingCreateSerializer`) provides clear error messages.
    - REST-based routing (`/lots/`, `/lots/{id}/spots/`, `/bookings/`) simplifies API navigation.
- **Measurement:**
    
    The presence of clear messages is verified through the test:
    
    - `test_create_booking_with_invalid_time_window`
    
    The test creates a booking with an invalid time window and checks that the error message contains "must be before," confirming it is understandable for users.

---

### Maintainability

- **Target**: The API code should be easy to maintain, extend, and modify without breaking existing functionality.  
- **Implementation:**
    - The project follows the **Model–View–Serializer** architecture, ensuring isolation of business logic.
    - Each `ViewSet` class contains its own CRUD operation logic.
    - Business logic methods (such as `create_booking`, `cancel`) are isolated and protected with transactions (`@transaction.atomic`).
    - Swagger documentation is generated automatically, simplifying API extension without manual editing.
    - New filters, parameters, and fields can be added to `serializers` without modifying existing code.
- **Measurements:**
    - `test_transaction_atomic_on_booking_cancel`  
      Ensures that booking cancellation (`/api/v1/bookings/{id}/cancel/`) changes the status to "cancelled" without breaking data integrity.
    - `test_nested_routes_exist`  
      Verifies that nested routes (`/api/v1/lots/{id}/spots/`) are correctly registered in the URL system.

---

### Reliability

- **Target**: The API must ensure data consistency and stability even when users make errors or send concurrent requests.  
- **Implementation:**
    - Transactional handling (`transaction.atomic`) in booking (`create_booking`) and cancellation (`cancel`) prevents partial updates.
    - Booking conflicts are checked before creation (`Spot already booked in this interval`).
    - Proper handling of HTTP status codes (`400`, `404`, `409`) ensures predictable client behavior.
    - Time range validation through `validate_booking_window` prevents invalid bookings.
    - Use of `select_related` minimizes SQL queries and reduces lock risks under load.
- **Measurements:**
    - `test_conflict_booking_returns_409`  
      Verifies that overlapping bookings return a 409 Conflict status.
    - `test_cancel_already_cancelled_booking`  
      Ensures that canceling an already cancelled booking returns 400 Bad Request.
    - `test_create_valid_booking`  
      Confirms that valid data results in a successful booking with "confirmed" status.

---

### Security

- **Target:**  
  User data and booking operations must be protected from unauthorized access or modification, and all API interactions must be secure in terms of authentication, validation, and access control.
- **Implementation:**
    - **Secure DRF architecture:**  
      All operations are handled through Django REST Framework, which enforces authorization and request validation on the server side.
    - **Standard HTTP status codes:**  
      In `swagger.py`, standardized error codes (`401 Unauthorized`, `403 Forbidden`, `404 Not Found`) are defined and used in `@extend_schema` for all critical endpoints (`lots`, `spots`, `bookings`).
    - **Restricted booking access:**  
      Each booking operation (`create_booking`, `cancel`) is wrapped in a transaction (`@transaction.atomic`) to prevent unauthorized or partial modifications.
    - **Booking time validation:**  
      The `validate_booking_window()` function ensures bookings cannot be made in the past or with invalid time ranges.
    - **User data protection:**  
      The `user` field in the `Booking` model is automatically populated via `request.user` if authenticated, or remains `null`, preventing user ID spoofing.
    - **Automatic documentation:**  
      Through **Swagger (drf-spectacular)**, users can only view public endpoint schemas, with no access to internal private resources.
- **Measurements:**
    - `test_create_booking_with_invalid_time_window`  
      Ensures time validation prevents invalid requests.
    - `test_conflict_booking_returns_409`  
      Confirms the system blocks duplicate bookings for the same time interval.
    - `test_cancel_already_cancelled_booking`  
      Ensures duplicate cancellations are blocked, preventing status manipulation.
    - `test_transaction_atomic_on_booking_cancel`  
      Verifies transactional integrity when changing booking states.  

All tests confirm that booking operations are strictly controlled, and the API reliably handles errors and exceptions without data leaks or logical inconsistencies.
