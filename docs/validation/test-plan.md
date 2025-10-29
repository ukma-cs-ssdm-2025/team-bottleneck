## Test Plan Overview

This document outlines the key functional, integration, and acceptance tests for the Smart Parking System.  
Each test case includes the tested component or function, the test level, the test type (positive or negative), and the expected result or acceptance criteria.



| №  | Component/Function                     | Test Level   | Type (Positive/Negative) | Expected Result / Acceptance Criteria | Covers |
|----|----------------------------------------|---------------|---------------------------|----------------------------------------|---------|
| 1  | Adding a parking spot            | Integration   | Positive                 | API returns status 201 (Created). The response returns an object with a correct id, and the new parking spot is visible in the DB. | F.03 |
| 2  | Updating a parking spot          | Integration   | Positive                 | API returns status 200 (OK). The status field in the DB changes to occupied for the specified id. | F.03 |
| 3  | Deleting a non-existent spot     | Integration   | Negative                 | API returns status 404 (Not Found) and a message about the non-existent resource. | F.03 |
| 4  | Authorization: Adding without permissions | Integration | Negative                 | A regular user cannot add or edit a parking spot; the system blocks the action and displays a clear access error. | F.03, NFR-005 |
| 5  | View all parking spots (API Data)      | Unit          | Positive                 | All parking spot data is correctly prepared and in the correct format for sending to the map/interface. | F.01 |
| 6  | Performance: Loading all spots         | System (NFR)  | Positive                 | The list of spots (even 1000) loads very quickly, less than half a second, without making the user wait. | NFR-001 |
| 7  | Error handling: Error message display  | Integration   | Negative                 | If the parser/scraper fails, the administrator instantly receives a notification, and users are shown a clear message about temporary difficulties. | F.04, NFR-005 |
| 8  | View all parking spots (UI/Map)        | Acceptance    | Positive                 | The user sees an accurate table/map of available spots. Clicking on a spot shows its status, price, and the ability to book. | F.01 |
| 9  | Payment: Successful card payment       | Integration   | Positive                 | The payment successfully goes through Stripe. The booking is confirmed, and a record of the successful payment is created for the user. | F.02 |
| 10 | Payment: Faulty/Declined card          | Integration   | Negative                 | Upon unsuccessful payment (e.g., declined card), the system shows the driver a clear explanation and instructions on what to do. | F.02, NFR-005 |
| 11 | History: Displaying transaction history| Integration   | Positive                 | The user sees a complete and accurate list of all their previous payments and bookings, which match the records in the database. | F.07 |
| 12 | Security: Password encryption check    | Unit          | Positive                 | The function verifies that passwords and payment data (that is stored) are securely encrypted before being written to the database. | NFR-002 |
| 13 | Notifications: Booking completion trigger | Unit       | Positive                 | The system logic automatically triggers 5 minutes before the parking ends and prepares a push notification (or email) for the driver. | F.05 |
| 14 | Backups: Backup file creation          | Integration   | Positive                 | A database copy file is automatically created daily and stored in the designated repository without errors. | F.06 |
| 15 | Backups: Retention policy (30 days)    | System        | Positive                 | The system only retains data copies for the last 30 days, and old copies are automatically deleted. | NFR-003 |
| 16 | Usability: Interface Adaptivity        | Acceptance    | Positive                 | The interface (website) looks good and is easy to use on all mobile phones;all functionality is accessible. | NFR-004 |
