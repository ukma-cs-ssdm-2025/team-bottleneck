# Parking System Architecture

## 1. Overview
Our system is built using a **multi-layered architecture** with REST API.  
It consists of a frontend (React UI), backend (Python/Django), and a database (PostgreSQL).  
The system also integrates with external services such as a payment provider and Email/SMS gateways.

## 2. Architectural Style
A **three-tier architecture** was chosen because it offers:
- simplicity in implementation and maintenance for a small team,  
- clear separation of concerns (UI, business logic, data),  
- easy integration with external APIs.

## 3. Main Components
- **React UI** – user interface (search, booking, payments).  
- **REST API** – communication layer between UI and backend.  
- **Python App (Django)** – business logic of the system:  
  - Authentication Service (login/registration),  
  - Parking Management Service (search, booking),  
  - Payment Service (payment processing),  
  - Notification Service (reminders, messages).  
- **DAO + PostgreSQL** – data storage (users, bookings, transactions).  
- **External Systems:** payment gateway, Email/SMS providers.

## 4. Component Diagram
![Component Diagram](./uml/component_diagram.md)  
The diagram shows the main system components and how they interact with each other and with external services.

## 5. Key Architectural Decisions
- **PostgreSQL** was selected as the main database due to strong integration with Django ORM and ACID compliance.  
- A **monolithic three-tier architecture** was chosen instead of microservices for easier maintenance by a small team.  
- **React** was chosen for the frontend because it is widely adopted, community-supported, and easily integrates with REST APIs (see details in [ADR](./decisions/)).

## 6. Technology Stack
- **Frontend:** React  
- **Backend:** Python, Django  
- **Database:** PostgreSQL  
- **Other:** Docker (deployment), GitHub Actions (CI/CD)

## 7. Component Interaction
- **Frontend** sends HTTP requests to the **Backend** via REST API.  
- **Backend** reads/writes data in **PostgreSQL**.  
- **Payment Service** communicates with the payment provider through REST API.  
- **Notification Service** sends messages using Email/SMS providers.  
- Authentication is implemented using **JWT tokens**.

## 8. Flexibility and Future Evolution
The architecture is designed so that the **Frontend acts as an independent REST API client**.  
This allows easy future extension — the web interface (React) can be replaced or complemented by a mobile app (React Native, Flutter, iOS/Android) without changing the business logic or database layer.
