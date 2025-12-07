# User Stories

### US-001: Parking Spot Search
**User Story:**  
As a **driver**, I want to see all available parking spots so I can quickly find a place.

**Acceptance Criteria:**  
- [ ] After choosing the address and prefered time period, the system shows available spots.  
- [ ] If no spots are available → system shows “No available parking spots”.

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  

---

### US-002: Online Payment
**User Story:**  
As a **driver**, I want to pay for parking online so I don’t waste time at a cash desk.

**Acceptance Criteria:**  
- [ ] After selecting a spot, online payment options are available (card/Stripe).  
- [ ] Upon confirmation, I receive a payment receipt.  
- [ ] If payment fails → system shows “Payment failed, please try another method”.

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  

---

### US-003: Adding New Parking Lots
**User Story:**  
As an **administrator**, I want to add new parking lots so the system stays up-to-date.

**Acceptance Criteria:**  
- [ ] “Add New Parking Lot” button available in admin panel.  
- [ ] New parking lot appears on the map after confirmation.  
- [ ] If server is unavailable → system queues the request and completes addition after recovery.

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  

---

### US-004: Error Notifications
**User Story:**  
As a **driver**, I want to receive clear error messages so I can quickly fix actions.

**Acceptance Criteria:**  
- [ ] Incorrect input triggers a message with explanation.  
- [ ] Message includes guidance on how to fix the error.

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  

---

### US-005: Push Reminders
**User Story:**  
As a **driver**, I want to receive push notifications before parking time ends to avoid fines.

**Acceptance Criteria:**  
- [ ] System sends push/email notification 10 minutes before booking ends.  
- [ ] Notification contains an “Extend Parking” button.  
- [ ] If push is disabled → system sends email as fallback.

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  

---

### US-006: Mobile Access
**User Story:**  
As a **driver**, I want to use the service on my phone to have access anywhere.

**Acceptance Criteria:**  
- [ ] Site displays correctly on mobile devices (no horizontal scrolling).  
- [ ] Main buttons are clickable on touch screens (min. 44x44 px).

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  

---

### US-007: Data Retention
**User Story:**  
As an **administrator**, I want to ensure data is safely stored to avoid information loss.

**Acceptance Criteria:**  
- [ ] All data is regularly saved in the database.  
- [ ] Automatic daily backup to cloud storage.  
- [ ] If backup fails → system notifies the admin and retries after recovery.

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  

---

### US-008: Booking History
**User Story:**  
As a **driver**, I want to view my booking history to track my expenses.

**Acceptance Criteria:**  
- [ ] Profile includes “My Profile” tab.  
- [ ] Each payment shows date, time, and status.  
- [ ] If history is empty → system shows “You have no bookings yet”.

**INVEST Check:** ✅ Independent, ✅ Negotiable, ✅ Valuable, ✅ Estimable, ✅ Small, ✅ Testable  
