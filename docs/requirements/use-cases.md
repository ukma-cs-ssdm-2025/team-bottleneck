# Use Cases

---

### UC-001: Parking Spot Search
- **Primary Actor:** Driver  
- **Goal:** Find an available parking spot  
- **Preconditions:** Driver is logged in;
- **Postconditions:** Available spots are displayed on the interface
- **Main Success Scenario:**  
  1. Driver enters an address or district.  
  2. System displays all spots.  
  3. Free spots are marked green, occupied — red.  
- **Alternate/Exception Flows:**  
  - A1: No available spots → system shows "No available parking spots".  
  - E1: No connection to server → system shows an error message.  

---

### UC-002: Online Payment
- **Primary Actor:** Driver  
- **Goal:** Pay for parking online  
- **Preconditions:** Driver selected a free spot; internet is available  
- **Postconditions:** Payment is confirmed; spot marked as occupied  
- **Main Success Scenario:**  
  1. Driver selects a parking spot.  
  2. System provides payment options (card, Stripe).  
  3. Driver enters payment data and confirms.  
  4. System processes the transaction and sends a receipt.  
- **Alternate/Exception Flows:**  
  - A1: Card declined → system prompts to retry or select another method.  
  - E1: Payment server unavailable → system shows an error message.  

---

### UC-003: Adding New Parking Lots
- **Primary Actor:** Administrator  
- **Goal:** Add a new parking lot to the system  
- **Preconditions:** Administrator is logged in  
- **Postconditions:** New parking lot appears on the map  
- **Main Success Scenario:**  
  1. Administrator navigates to "Add Parking Lot".  
  2. Enters name, address, and parking parameters.  
  3. System saves data to the database.  
  4. Parking lot appears on users’ maps.  
- **Alternate/Exception Flows:**  
  - A1: Incomplete data → system prevents saving and asks to fill all fields.  
  - E1: Database unavailable → system shows an error message.  

---

### UC-004: Error Notifications
- **Primary Actor:** Driver  
- **Goal:** Receive clear error messages  
- **Preconditions:** Driver performs an action (search, payment, etc.)  
- **Postconditions:** User understands how to fix the action  
- **Main Success Scenario:**  
  1. Driver enters incorrect data.  
  2. System validates the input.  
  3. System shows a message with explanation and guidance.  
- **Alternate/Exception Flows:**  
  - A1: Critical error → system suggests contacting support.  

---

### UC-005: Push Reminders
- **Primary Actor:** Driver  
- **Goal:** Receive a reminder before parking time ends  
- **Preconditions:** Driver booked a spot and set a duration  
- **Postconditions:** Driver receives notification 10 minutes before expiration  
- **Main Success Scenario:**  
  1. Driver books a spot.  
  2. System counts down the time.  
  3. 10 minutes before expiration, system sends push/email notification.  
  4. Notification includes a "Extend Parking" button.  
- **Alternate/Exception Flows:**  
  - A1: Notification not delivered (no internet) → system retries sending.  

---

### UC-006: Mobile Access
- **Primary Actor:** Driver  
- **Goal:** Use the service on a mobile device  
- **Preconditions:** Service is opened on a mobile device  
- **Postconditions:** Pages display correctly  
- **Main Success Scenario:**  
  1. Driver opens the website on a smartphone.  
  2. Site adjusts to screen (responsive design).  
  3. Driver can click buttons (minimum 44x44 px).   

---

### UC-007: Data Retention
- **Primary Actor:** Administrator  
- **Goal:** Ensure data is safely stored  
- **Preconditions:** User and booking data saved in the DB  
- **Postconditions:** Data protected via backup  
- **Main Success Scenario:**  
  1. System regularly saves data to the database.  
  2. Daily backups are created in cloud storage.  
  3. Administrator sees confirmation of successful backup.  
- **Alternate/Exception Flows:**  
  - A1: Backup fails → system shows an error to the administrator.  

---

### UC-008: Booking History
- **Primary Actor:** Driver  
- **Goal:** View booking history  
- **Preconditions:** Driver has an account with all bookings  
- **Postconditions:** Driver sees a list of bookings
- **Main Success Scenario:**  
  1. Driver opens the profile.  
  2. Selects the "My Profile" tab.  
  3. System displays bookings with date, time, status. 
- **Alternate/Exception Flows:**  
  - A1: History empty → system shows "No payments yet".  
  - E1: Database unavailable → system shows an error message.  
