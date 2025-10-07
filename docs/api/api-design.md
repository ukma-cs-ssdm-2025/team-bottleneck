# Smart Parking API Design Documentation

## Architecture Overview
- **Base URL**: http://127.0.0.1:8000/api/v1
- **API Style:** RESTful
- **Authentication:** JWT Bearer tokens (planned)
- **Response Format:** JSON
- **Versioning Strategy:** URL path versioning (`/v1`, `/v2`)

---

## Resource Model

### Parking Lots Resource
- **Endpoint:** `/lots`
- **Description:** Management of parking lots
- **Attributes:**
  - `id` (integer): Unique identifier
  - `name` (string): Parking lot name
  - `address` (string): Parking lot address
  - `lat` (float): Latitude coordinate
  - `lng` (float): Longitude coordinate
- **Relationships:**
  - Has many spots

### Spots Resource
- **Endpoint:** `/spots`
- **Description:** Management of parking spots within parking lots
- **Attributes:**
  - `id` (integer): Unique identifier
  - `number` (string): Spot number within the lot
  - `is_ev` (boolean): EV charging ready
  - `is_disabled` (boolean): Accessible for disabled people
  - `lot_id` (integer): Reference to Parking Lot
- **Relationships:**
  - Belongs to a parking lot
  - Has many bookings

### Bookings Resource
- **Endpoint:** `/bookings`
- **Description:** User bookings of parking spots
- **Attributes:**
  - `id` (integer): Unique identifier
  - `user` (string): User ID who made the booking
  - `spot` (integer): Spot ID
  - `start_at` (datetime): Start of booking
  - `end_at` (datetime): End of booking
  - `status` (enum): `confirmed` | `cancelled`
- **Relationships:**
  - Belongs to a spot
  - Belongs to a user

---

## Design Decisions

### Why Code-First?
- Documentation stays synchronized with implementation
- Type safety through language features
- Faster development iterations
- No manual YAML maintenance

### Filtering Strategy
- Users can filter by lot_id, is_ev, or is_disabled
- Query parameters make filtering flexible and easy to use

### Transaction Management
- Creating or cancelling bookings is consistent and reliable
- Prevents partial updates and data corruption

### Booking Workflow Validation
- Prevents overlapping bookings
- Ensures start and end times are valid
- Maintains integrity of parking spot availability

### Error Handling
- Consistent error response structure
- Machine-readable error codes
- Human-friendly messages
- Validation errors include field details
- Returns 400 for invalid input or filters
- Returns 404 when requested resources are not found
- Returns 409 for conflicts such as duplicate lots or overlapping bookings

