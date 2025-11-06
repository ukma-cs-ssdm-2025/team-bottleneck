

## 🔎 Resilience Scavenger Hunt

### 1 CRITICAL ISSUE: Unreliable Booking Creation Transaction

| Field | Details |
| :--- | :--- |
| **Problem** | The **POST /api/v1/bookings/create/** method, a core business process, executes a sequence of three blocking DB queries **without execution time control (timeouts)**. The entire logic (validation, conflict check, object creation) is bundled in one uncontrolled transaction. |
| **Code** | **File:** `views.py` <img width="1029" height="927" alt="image" src="https://github.com/user-attachments/assets/c9b9b5ab-001d-4e98-b510-be62d8b25336" />
| **Potential Impact** | <br> 1. **Inconsistent State:** Money might be charged (if `PaymentService` is called before the DB error) but the booking **will not be created**. <br> 2. **DoS (Denial of Service):** A single slow query in this highly critical path can exhaust the entire DB connection pool, rendering the API **unavailable** for all other users. |



| Field | Explanation |
| :--- | :--- |
| **Fault** (Defect Source) | 1. **No Timeout** on `.exists()` and `.create()` queries. 2. **Race Condition:** Availability check (`.exists()`) lacks **pessimistic locking** (`select_for_update`). |
| **Error** (Internal State) | 1. **DB Connection Pool Blocked** (`@transaction.atomic` holds connection). 2. **Data Inconsistency** (double booking) due to Race Condition. |
| **Failure** (System Behavior) | 1. **Monetary Loss / Inconsistent State:** Booking fails, but payment may succeed. 2. **Data Corruption:** Double booking of a spot. 3. **DoS** (Denial of Service) for the system. |
| **Severity** (Criticality) | **High**. |



### Slow Spot Search and Thread Blocking (Performance Degradation)

| Field | Details |
| :--- | :--- |
| **Problem** | The **GET /api/v1/lots/{id}/spots/** method (searching for available spots) executes a highly costly query that likely results in a **Full Table Scan** of the `Booking` table without any timeout mechanism. This endpoint is the first step in the sales funnel. |
| **Code Snippet** | **File:** `views.py`<img width="1376" height="472" alt="image" src="https://github.com/user-attachments/assets/8d315006-4715-446d-90c9-adc9dee1343e" />
| **Why it is dangerous?** | **Fault:** Lack of a proper **composite index** on the critical time fields (`start_at`, `end_at`, `status`) in the `Booking` table, combined with **no query timeout**. <br> **Error:** As the number of bookings grows (e.g., to 100,000+), the query becomes **extremely slow** (30+ seconds). This leads to an **HTTP timeout** and blocks the handler thread. |
| **Potential Impact** | **High Severity**. <br> 1. **Customer Loss:** Users cannot view available spots, causing them to **abandon the site** (Failure to Retain User). <br> 2. **Partial DoS:** The long-running query **blocks DB connections** and ties up web server resources, slowing down the entire system for others. <br> 3. **Reputation Damage:** Poor user experience ("The site is laggy/broken"). |


-----



| Field | Explanation |
| :--- | :--- |
| **Fault** (Defect Source) | Lack of an **effective index** on filtering fields and **no statement timeout** configured for the slow query. |
| **Error** (Internal State) | The query takes too long to execute, consuming extensive DB resources and **blocking the HTTP thread**. |
| **Failure** (System Behavior) | **User abandonment** due to endless waiting screen (Failure to Meet Performance SLA). Resource exhaustion. |
| **Severity** (Criticality) | **High**. (Directly impacts user experience and revenue funnel.) |

