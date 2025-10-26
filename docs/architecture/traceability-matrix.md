| FR/NFR                           | Component                      | Architectural Decision           | Verification Method                  |
| -------------------------------- | ------------------------------- | -------------------------------- | ------------------------------------ |
| FR-001: Display parking spots    | Parking Management Service + DB | Data retrieval via REST API      | TC-001 (≤3s list rendering)          |
| FR-002: Online payment           | Payment Service + Gateway       | HTTPS integration with Stripe    | TC-002 (no exposed cards/passwords)  |
| FR-003: Add new parking lots     | Admin Panel + DB                | CRUD via API                     | TC-003 (data saved correctly)        |
| FR-004: Error notifications      | Notification Service            | Localized error messages         | TC-004 (clear hints and messages)    |
| FR-005: Push/email reminders     | Notification Service + Firebase | Push/email integration           | TC-005 (push notification test)      |
| FR-006: Data backup              | DB + Backup Module              | Automated cron-based backup      | TC-007 (log and backup validation)   |
| FR-007: Transaction history      | Web/Mobile UI + API             | REST endpoint `/history`         | TC-008 (≤3s list rendering)          |
| NFR-001: Performance ≤3s         | All services                    | Query optimization, DB normalization | Load testing                    |
| NFR-002: Security (AES-256)      | Auth + Payment                  | Data encryption, HTTPS           | Penetration testing                 |
| NFR-003: Reliability (Backup)    | DB                              | Automatic daily backups          | TC-007 (log and backup validation)   |
| NFR-004: Usability (Mobile)      | Web/Mobile UI                   | Responsive layout                | TC-006 (mobile testing)              |
| NFR-005: Usability (Errors)      | Notification Service            | UX messages with user guidance   | TC-005 (push notification test)      |

---

# Performance  
**Requirement:** "Payment history should load within ≤ 3 seconds."  

**Architectural Decisions:**  
- Optimize SQL queries for transaction tables.  
- Return only required columns (`SELECT fields` instead of `SELECT *`).  
- Apply database normalization.  

---

# Security  
**Requirement:** "User card data must not be stored in plain text; transmission only over HTTPS."  

**Architectural Decisions:**  
- TLS/SSL for all connections.  
- AES-256 encryption for sensitive data at rest.  
- Secure API Gateway usage.  
- Use a PCI DSS-compliant payment provider.  

---

# Reliability  
**Requirement:** "Backup must ensure data recovery within 30 days."  

**Architectural Decisions:**  
- Automatic database backups every 24 hours.  
- Database replication on a separate server.  
- Automated backup integrity verification.
