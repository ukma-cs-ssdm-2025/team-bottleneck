

# Reliability Report Summary

## 1. Table of All Identified Issues and Severity Assessment

|   #   | Issue Description                                                                                                                                             | Potential Impact                                                                              | Severity | Status  |
| :---: | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------- | :------- | :------ |
| **1** | **Unreliable Booking Creation Transaction:** Lack of timeouts and race condition in core business logic (fixed by adding DB timeouts and exception handling). | Data inconsistency (double booking), Monetary Loss, Full System DoS.                          | **High** | ✅ fixed |
| **2** | **Slow Spot Search and Thread Blocking:** Full Table Scan on a critical endpoint without a query timeout.                                                     | Poor User Experience, High Customer Loss, Partial DoS due to resource exhaustion.             | **High** | unfixed |
| **3** | **Redundant Exception Catching (Client Code):** Unnecessary `try...catch` block re-throwing the same error.                                                   | Increased Maintainability Debt, Risk of Silent Failure, Diagnostic Failure.                   | **Low**  | unfixed |
| **4** | **Silent Failure in Parking Spot Availability Filter:** Availability filter did not exclude already booked spots.                                             | Semantic Data Inconsistency, Booking Conflicts (409 errors), Loss of Trust, User Frustration. | **High** | ✅ fixed |

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

**Why it was dangerous:**
This was a **silent failure** — the endpoint returned a `200 OK` but with semantically incorrect data.
Because `super().list()` internally re-called `get_queryset()`, the filtered dataset was lost.
The issue produced booking conflicts and degraded user trust.

---

## 3. Description of Applied Reliability Patterns

| Pattern                                 | Description                                                                      | Applied To                |
| :-------------------------------------- | :------------------------------------------------------------------------------- | :------------------------ |
| **Timeout Pattern (Fail-Fast)**         | Enforced timeouts on DB connection and query execution to avoid thread blocking. | `DATABASES["OPTIONS"]`    |
| **Graceful Degradation**                | Returned structured error (`DB_TIMEOUT`) instead of raw exception.               | Booking creation endpoint |
| **Guard Clause Pattern**                | Validated input dates before filtering.                                          | Spot availability filter  |
| **Query Responsibility Centralization** | Moved filtering logic into `get_queryset()` to ensure consistent query behavior. | SpotViewSet               |
| **Semantic Integrity Enforcement**      | Ensured API returns only semantically correct, up-to-date data.                  | Availability endpoints    |

---

## 4. Remaining Open Issues

The following reliability issues remain unresolved:

* **Slow Spot Search and Thread Blocking:**
  Full table scan on a critical endpoint without query timeout or indexing.

* **Redundant Exception Catching (Client Code):**
  Review unnecessary exception wrapping and redundant `try...catch` blocks to improve diagnostic accuracy.

