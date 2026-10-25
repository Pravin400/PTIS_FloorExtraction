# Security, Authentication & Authorization

## 🔐 Dual-Authentication Architecture

The **NTIS Platform** provides two distinct authentication paradigms:

1. **Staff & Municipal Officers**:
   - Username/Password with optional Two-Factor Authentication (2FA / TOTP / MFA).
   - Role-Based Access Control (RBAC) and Screen-level Permissions (`RoleWiseScreenAccessMasterService`).
2. **Citizens**:
   - Passwordless Mobile Number + One-Time Password (OTP) verification (`CitizenAuthService`).
   - Issues JWT token with role `"Citizen"` and restricted access to self-filed grievances.

---

## 🛡️ Security Mechanisms

### 1. JWT Bearer Tokens
Both authentication flows produce industry-standard signed JWT tokens containing:
- `sub` / `nameid`: Unique User/Citizen ID.
- `role`: Role assignment (`"Admin"`, `"DepartmentOfficer"`, `"Citizen"`).
- `user_type`: `"staff"` or `"citizen"`.
- `exp`: Configurable token expiration (e.g. 24 hours).

### 2. ASP.NET Core Rate Limiting
Public endpoints (such as `/api/CitizenAuth/send-otp` and `/api/Auth/login`) use ASP.NET Core rate limiting (`[EnableRateLimiting("login")]`) to prevent brute-force attacks and abuse.

### 3. Citizen Isolation Guarantee
When a request is made to citizen-specific endpoints (e.g. `GET /api/GrievanceApplication/citizen/{citizenId}`), the backend enforces that authenticated citizens can ONLY view their own records by matching the JWT `ClaimTypes.NameIdentifier` claim with the requested `citizenId`.
