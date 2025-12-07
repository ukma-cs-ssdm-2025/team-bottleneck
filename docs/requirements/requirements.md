# Requirements Overview

## Purpose & Scope
A parking management system that allows drivers to quickly find available spots, pay online, and receive notifications, while enabling administrators to maintain up-to-date data and manage backups.

## Glossary
- **Driver** — a user of the service for finding and paying for parking.  
- **Administrator** — a user with privileges to manage data (parking lots, backups).  
- **Parking Spot** — a location where a vehicle can be parked.

## Functional Requirements (FR)
- **FR-001:** The system must display a list of available parking lots on a map after a search.  
- **FR-002:** The system must support card payments (Stripe).  
- **FR-003:** The system must allow adding/editing parking lot information.  
- **FR-004:** The system must display error messages.  
- **FR-005:** The system must send emails with a booking details when it is created or cancelled.  
- **FR-006:** The system must automatically create database backups.  
- **FR-007:** The system must store and display the user's bookings history.

## Non-Functional Requirements (NFR)
- **NFR-001 (Performance):** The list of available parking spots, payment history, or parking map must load within ≤ 3 seconds after a request.  
- **NFR-002 (Security):** Passwords and payment data must be stored encrypted (AES-256).  
- **NFR-003 (Reliability):** Backups are automatically created every 24 hours and retained for at least 30 days.  
- **NFR-004 (Usability):** The website must be responsive for mobile devices (screens ≥ 5’’), without horizontal scrolling, and provide full functionality.  
- **NFR-005 (Usability):** Error messages must be understandable to non-technical users and provide instructions to resolve the issue.
