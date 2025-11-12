

##  Resilience Scavenger Hunt

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
| **Code Snippet** | **File:** `views.py` <img width="1046" height="450" alt="image" src="https://github.com/user-attachments/assets/6038bbad-2bcf-4387-aca1-eeadd4c28513" /> |
| **Why it is dangerous?** | **Fault:** Lack of a proper **composite index** on the critical time fields (`start_at`, `end_at`, `status`) in the `Booking` table, combined with **no query timeout**. <br> **Error:** As the number of bookings grows (e.g., to 100,000+), the query becomes **extremely slow** (30+ seconds). This leads to an **HTTP timeout** and blocks the handler thread. |
| **Potential Impact** | **High Severity**. <br> 1. **Customer Loss:** Users cannot view available spots, causing them to **abandon the site** (Failure to Retain User). <br> 2. **Partial DoS:** The long-running query **blocks DB connections** and ties up web server resources, slowing down the entire system for others. <br> 3. **Reputation Damage:** Poor user experience ("The site is laggy/broken"). |


-----



| Field | Explanation |
| :--- | :--- |
| **Fault** (Defect Source) | Lack of an **effective index** on filtering fields and **no statement timeout** configured for the slow query. |
| **Error** (Internal State) | The query takes too long to execute, consuming extensive DB resources and **blocking the HTTP thread**. |
| **Failure** (System Behavior) | **User abandonment** due to endless waiting screen (Failure to Meet Performance SLA). Resource exhaustion. |
| **Severity** (Criticality) | **High**. (Directly impacts user experience and revenue funnel.) |




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




## **4. Silent Failure in Parking Spot Availability Filter (Incorrect Availability Results)**

| Field                    | Details                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**              | The availability filter did **not exclude booked spots**. Users saw occupied parking spots as available. DRF ignored `self.queryset` in `list()`, silently bypassing the applied filtering. |
| **Code (Before Fix)**    | <img width="1310" height="830" alt="image" src="https://github.com/user-attachments/assets/ae0bf58f-19d4-476a-946e-01bcbcc1ef89" />  |
| **Code (After Fix)**     |               <img width="1238" height="852" alt="image" src="https://github.com/user-attachments/assets/00990642-a3dd-411c-bd0a-c3cebd914def" />   |
| **Why it is dangerous?** | This is a **silent failure**: API returned 200 OK but the **data was semantically wrong**. No errors, no logs, difficult to detect. |
| **Potential Impact** | 1. **SLO Violation:** Users face a high number of 409 Conflict errors.<br>2. **Poor User Experience:** Users select “available” spots that are occupied.<br>3. **Cascading Failures:** Multiple users try to book the same spot.<br>4. **Loss of Trust:** System appears unreliable and inconsistent. |
### Fault → Error → Failure

| Field                         | Explanation                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Fault (Defect Source)**     | Filtering placed in `list()` instead of `get_queryset()`. `super().list()` bypasses `self.queryset`.     |
| **Error (Internal State)**    | `get_queryset()` returns full results including booked spots; `self.queryset` ignored.                   |
| **Failure (System Behavior)** | Incorrect availability data → 409 conflicts. Classified as a **value failure** (Laprie/Rushby taxonomy). |
| **Severity**                  | High — affects core booking logic and is difficult to diagnose due to being silent.                      |



### 5 Infinite Token Refresh Loop (Authentication Reliability Failure)

| Field                    | Details                                                                                                                                                                                                                                                                                                        |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**              | The token refresh interceptor lacked a **retry guard clause** and did not clear invalid tokens, causing the application to enter an **infinite refresh loop** whenever the refresh token became invalid. This could freeze the entire UI.                                                                      |
| **Code Before**                 | `apiClient.js` — <img width="1680" height="684" alt="image" src="https://github.com/user-attachments/assets/241b4538-f3b9-493b-8f7c-2b757ee674d6" /> |
| **Code After**                 | `apiClient.js` — <img width="1045" height="1005" alt="image" src="https://github.com/user-attachments/assets/f29652fa-603d-401b-a193-a9138f7a280e" /> |    
| **Why it is dangerous?** | **Fault:** No `_retry` flag, no token cleanup, and incorrect error queue handling. <br> **Error:** The interceptor repeatedly attempted the refresh request with no stopping condition. <br> **Failure:** The UI became unresponsive, users were locked out, and the authentication subsystem became unstable. |
| **Potential Impact**     | 1. **Full UI Freeze** due to infinite retry attempts. <br> 2. **Authentication Subsystem Instability** affecting all authenticated requests. <br> 3. **User Lockout:** The system could not recover without manual localStorage cleanup.                                                                       |



| Field                         | Explanation                                                                                                                                             |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fault** (Defect Source)     | Missing retry guard, missing token cleanup, incorrect error propagation in the interceptor.                                                             |
| **Error** (Internal State)    | The refresh logic recursively retriggered itself via the same interceptor, causing an infinite loop.                                                    |
| **Failure** (System Behavior) | Endless refresh attempts → UI freeze → redirect loops and complete authentication failure.                                                              |
| **Fix Summary**               | Added `_retry` guard clause, added token cleanup in the catch block, enforced redirect to `/login`, and ensured the refresh sequence terminates safely. |





