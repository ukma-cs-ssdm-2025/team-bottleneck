
# Final Project Report — Smart Parking System

## Team Bottleneck | UKMA SSDM 2025

## Executive Summary

**Smart Parking System** is a fully functional web platform for booking and paying for parking spaces. It was developed by **Team Bottleneck** as part of the *Software Systems Development Methods* course at NaUKMA.

## Technology Stack

* **Backend:** Django 4.2+ (Python) + PostgreSQL on AWS RDS
* **Frontend:** React.js 
* **Testing:** pytest with coverage > 80%
* **Documentation:** Swagger UI + comprehensive Markdown documentation

## System Functionality

The system allows drivers to book parking spots online, view real-time availability, receive email confirmations, and manage their bookings via a user-friendly web interface.
Operators manage a single parking lot.
Administrators have full control via the Admin Panel.

---



## 3. Readiness
### Backend
- [x] Database hosted on AWS  
- [x] All endpoints implemented  
- [x] Operator functionality implemented
- [x] Admin functionality implemented
- [x] Driver functionality implemented


### Frontend 
- [x] All pages for the user role implemented  
- [x] All pages for the operator implemented
- [x] All pages for the admin implemented  

## Requirements
- [x] 7 out of 7 FR implemented or updated 
- [x] 7 out of 7 NFR implemented or updated 




## 4. Implemented Modules and Features

### Backend API (Django REST Framework)

The backend is built with Django and exposes a complete REST API documented via Swagger UI.


### Parking Spots Management Module

**Features:**

* Viewing parking spot availability
* Filtering and searching 
* Spot details 



---

### Booking System

**Core functionality:**

* Creating bookings (spot, date, and time selection)
* Cancelling bookings with an option for refund
* Viewing booking history (active and past)

---

###  User Management

**Authentication & Authorization:**

* User registration
* Login via email/password
* JWT tokens for API authentication
* Role-based access (driver / admin / operator)

---

### Operator Panel

**Operator capabilities:**

* **Lot management:**

  * Add/delete parking spots
  * Edit spot details and status


* **Booking management:**

  * View active/upcoming bookings
  * Create/cancel bookings manually

**Administrator Panel**

* Full operator access
* Create parking lots
* Manage all lots and all users
* Role management
* Backup management

---

### Notifications

**Email notifications:**

* Booking confirmation with details
* Cancellation confirmation


