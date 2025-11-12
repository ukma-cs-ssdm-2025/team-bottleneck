

# Reliability Report Summary

## 1. Table of All Identified Issues and Severity Assessment

|   #   | Issue Description                                                                                                                    | Potential Impact                                                                         | Severity     | Status  |
| :---: | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :----------- | :------ |
| **1** | **Unreliable Booking Creation Transaction:** Lack of timeouts and race condition in core business logic.                             | Data inconsistency, Monetary Loss, Full System DoS.                                      | **High**     | ✅ fixed |
| **2** | **Slow Spot Search and Thread Blocking:** Full Table Scan on a critical endpoint without query timeout.                              | Poor Performance, Customer Loss, Partial DoS.                                            | **High**     | unfixed |
| **3** | **Redundant Exception Catching (Client Code):** Unnecessary `try...catch` block re-throwing the same error.                          | Maintainability issues, Diagnostic Failure.                                              | **Low**      | unfixed |
| **4** | **Silent Failure in Parking Spot Availability Filter:** Already booked spots were not excluded.                                      | Semantic Data Corruption, 409 conflicts, Loss of Trust.                                  | **High**     | ✅ fixed |
| **5** | **Infinite Token Refresh Loop:** Missing guard clause and missing token cleanup caused repeated refresh attempts and redirect loops. | Infinite retry loop, User lockout, Full UI freeze, Authentication subsystem instability. | **High** | ✅ fixed |
| **6** | **Missing Maximum Duration Validation in Booking Window:** No enforcement of booking duration limits.                                | DoS via unrealistic bookings, Resource exhaustion, Business logic violations.            | **Medium**   | ✅ fixed |

---

## 2. Before/After Code Snippets

### Issue 1 — Unreliable Booking Creation Transaction

**Before:**

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("RDS_DB_NAME"),
        "USER": config("RDS_USERNAME"),
        "PASSWORD": config("RDS_PASSWORD"),
        "HOST": config("RDS_HOSTNAME"),
        "PORT": config("RDS_PORT", "5432"),
    }
}
```

**After:**

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("RDS_DB_NAME"),
        "USER": config("RDS_USERNAME"),
        "PASSWORD": config("RDS_PASSWORD"),
        "HOST": config("RDS_HOSTNAME"),
        "PORT": config("RDS_PORT", "5432"),
        "OPTIONS": {
            "connect_timeout": 5,
            "options": "-c statement_timeout=10000"  
        }
    }
}
```

**Added handling in the critical booking endpoint:**

```python
except OperationalError:
    return Response(
        {
            "detail": "The booking service is temporarily unavailable. Please try again later.",
            "error_code": "DB_TIMEOUT"
        },
        status=status.HTTP_503_SERVICE_UNAVAILABLE
    )
```

**Explanation:**
Global database timeouts ensure that transactions fail fast instead of blocking worker threads.
The new `OperationalError` catch block gracefully handles DB unavailability and prevents cascading failures during booking creation.

---

### Issue 4 — Silent Failure in Parking Spot Availability Filter

**Before Fix:**

```python
class SpotViewSet(...):
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        
        # ... filtering by is_ev, is_disabled ...
        
        available_from = request.query_params.get("available_from")
        available_to = request.query_params.get("available_to")
        
        if available_from and available_to:
            start = parse_datetime(available_from)
            end = parse_datetime(available_to)
            
            booked_spots = Booking.objects.filter(
                status="confirmed",
                start_at__lt=end,
                end_at__gt=start
            ).values_list('spot_id', flat=True)
            
            qs = qs.exclude(id__in=booked_spots)
        
        self.queryset = qs
        return super().list(request, *args, **kwargs)  # ignores self.queryset!
```

**After Fix:**

```python
class SpotViewSet(...):
    def get_queryset(self):
        lot_id = self.kwargs.get("lot_pk")
        qs = Spot.objects.select_related("lot").all()
        if lot_id:
            qs = qs.filter(lot_id=lot_id)
        
        available_from = self.request.query_params.get("available_from")
        available_to = self.request.query_params.get("available_to")
        
        if available_from and available_to:
            start = parse_datetime(available_from)
            end = parse_datetime(available_to)
            
            if start and end:  # Guard clause
                booked_spots = Booking.objects.filter(
                    status="confirmed",
                    start_at__lt=end,
                    end_at__gt=start
                ).values_list('spot_id', flat=True)
                
                qs = qs.exclude(id__in=booked_spots)
        
        return qs
```

**Explanation:**
Moving the availability filter into `get_queryset()` ensures that the filtering logic is consistently applied.
The guard clause prevents processing invalid datetime values.

## Issue 5 — Infinite Token Refresh Loop 

### Before (Fault: No Retry Limit, No Cleanup)
```javascript
// Condition checks 401 but does NOT limit retry attempts
if (error.response?.status === 401 && originalRequest.url !== '/token/refresh/') {
    // ...
    // no _retry flag
    // no cleanup
    // infinite loop possible
}
```

**Catch block — also incorrect:**

```javascript
} catch (_error) {
    isRefreshing = false;
    processQueue(_error, null); 
    // Tokens NOT reliably cleared
    return Promise.reject(_error);
}
```

---

### After (Resilient: Guard Clause + Cleanup + Redirect)

```javascript
// Guard Clause: allow only one retry attempt
if (error.response?.status === 401 && originalRequest.url !== '/token/refresh/') {

    if (originalRequest._retry) {
        throw error; // Prevent infinite refresh cycle
    }

    originalRequest._retry = true; // First retry attempt
    isRefreshing = true;

    // ... refresh logic ...
}
```

**Fixed catch block:**

```javascript
} catch (_error) {
    isRefreshing = false;
    processQueue(_error, null);

    // Clear broken tokens
    globalThis.localStorage.removeItem('accessToken');
    globalThis.localStorage.removeItem('refreshToken');

    // Redirect user to login
    if (typeof globalThis.window !== 'undefined') {
        globalThis.window.location.href = '/login';
    }

    throw _error;
}
```

**Explanation:**
The `_retry` flag prevents infinite token refresh loops. Token cleanup and forced redirect ensure proper recovery from authentication failures.

---

## Issue 6 — Missing Maximum Duration Validation in Booking Window

### Before
```python
def validate_booking_window(start_at, end_at):
    if start_at >= end_at:
        raise serializers.ValidationError("start_at must be before end_at")
    if start_at < timezone.now():
        raise serializers.ValidationError("start_at must be in the future")
```

### After
```python
MIN_BOOKING_DURATION = timedelta(minutes=30)
MAX_BOOKING_DURATION = timedelta(days=30)
MAX_ADVANCE_BOOKING = timedelta(days=90)
    
def validate_booking_window(start_at, end_at):
    """
    Validates that booking time window is logical and within acceptable limits.
    """
    now = timezone.now()
    
    if start_at < now:
        raise ValidationError(
            {"start_at": "Booking start time cannot be in the past."},
            code="past_start_time"
        )
    
    if end_at <= start_at:
        raise ValidationError(
            {"end_at": "Booking end time must be after start time."},
            code="invalid_time_range"
        )
    
    if (end_at - start_at) < MIN_BOOKING_DURATION:
        raise ValidationError(
            {"end_at": f"Booking duration must be at least {MIN_BOOKING_DURATION.total_seconds() / 60:.0f} minutes."},
            code="duration_too_short"
        )
    
    if (end_at - start_at) > MAX_BOOKING_DURATION:
        raise ValidationError(
            {"end_at": f"Booking duration cannot exceed {MAX_BOOKING_DURATION.days} days."},
            code="duration_too_long"
        )
    
    if (start_at - now) > MAX_ADVANCE_BOOKING:
        raise ValidationError(
            {"start_at": f"Bookings can only be made up to {MAX_ADVANCE_BOOKING.days} days in advance."},
            code="too_far_in_future"
        )
```

**Explanation:**
The original validator only checked basic constraints (start before end, not in past). The enhanced version enforces business rules:
- **Minimum duration (30 minutes):** Prevents spam/test bookings
- **Maximum duration (30 days):** Prevents indefinite spot locking and DoS attacks via unrealistic bookings (e.g., 10-year reservations)
- **Maximum advance booking (90 days):** Prevents indefinite future locking; aligns with typical parking business models

Each validation uses **guard clauses** with structured error messages and machine-readable error codes, enabling proper client-side error handling.

---

## 3. Description of Applied Reliability Patterns

| Pattern                                 | Description                                                                      | Applied To                |
| :-------------------------------------- | :------------------------------------------------------------------------------- | :------------------------ |
| **Timeout Pattern (Fail-Fast)**         | Enforced timeouts on DB connection and query execution to avoid thread blocking. | `DATABASES["OPTIONS"]`    |
| **Graceful Degradation**                | Returned structured error (`DB_TIMEOUT`) instead of raw exception.               | Booking creation endpoint |
| **Query Responsibility Centralization** | Moved filtering logic into `get_queryset()` to ensure consistent query behavior. | SpotViewSet               |
| **Semantic Integrity Enforcement**      | Ensured API returns only semantically correct, up-to-date data.                  | Availability endpoints    |
| **Boundary Validation**                 | Enforced both minimum and maximum limits on booking duration and advance period. | `validate_booking_window()` |
| **Structured Error Responses**          | Used machine-readable error codes and field-specific error messages.             | Booking validation        |




## 4. Remaining Open Issues

The following reliability issues remain unresolved:

* **Slow Spot Search and Thread Blocking:**
  Full table scan on a critical endpoint without query timeout or indexing.

* **Redundant Exception Catching (Client Code):**
  Review unnecessary exception wrapping and redundant `try...catch` blocks to improve diagnostic accuracy.
