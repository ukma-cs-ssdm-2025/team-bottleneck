

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




You've correctly identified an issue with the provided JavaScript code snippet. This is a case of **redundant and potentially harmful error handling** in a client-side API service layer.

Here is the analysis of this reliability fault, structured in English for your reports.

-----



### 3 Issue: Redundant and Context-Losing Exception Catching (Client Code)

| Field | Details |
| :--- | :--- |
| **Problem** | The `createParkingLot` function uses a `try...catch` block that **silently catches** any error (`catch (error)`), including network failures, timeouts, or 400/500 API responses, and immediately **re-throws the exact same error** without logging, processing, or adding contextual information. |
| **Code** | **File:** `api/parkingLotService.js` <img width="1610" height="306" alt="image" src="https://github.com/user-attachments/assets/ff62e1c1-b1ee-45e8-95c1-9e26ba98587d" /> |
| **Why it is dangerous?** | **Fault:** **Redundant Catch Block.** The code does not perform any error transformation, logging, or fallback logic. It only adds unnecessary noise to the code and gives the false impression that complex error handling is happening. <br> **Error:** This pattern makes debugging harder. If any future developer removes the `throw error` line by mistake (a very common occurrence in JS), the API failure will become a **Silent Failure**, stopping the propagation of the error. |
| **Potential Impact** | **Medium Severity**. <br> 1. **Maintainability Debt:** The code is overly verbose and misleading. <br> 2. **Diagnostic Failure:** If the error is accidentally swallowed (or not logged), critical context (stack trace, response data) is **lost**, making production issue diagnosis difficult. |




| Field | Explanation |
| :--- | :--- |
| **Fault** (Defect Source) | Unnecessary and non-functional `try...catch` block that adds no value and increases the risk of accidental error swallowing. |
| **Error** (Internal State) | Error message and details may not be logged effectively at this service layer, leading to **lost diagnostic context**. |
| **Failure** (System Behavior) | **Diagnostic Failure:** The development team cannot efficiently determine the cause of client failures, or the UI may fail to display an appropriate error message to the user. |
| **Severity** (Criticality) | **Low**.  |


