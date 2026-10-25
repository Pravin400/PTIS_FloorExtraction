# Citizen Passwordless Authentication & OTP Protocol

The **Citizen Authentication Service** provides secure, passwordless authentication for citizens interacting with the municipal portal via Mobile Number and One-Time Password (OTP).

---

## 🔐 Protocol Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen User
    participant API as CitizenAuthController
    participant Svc as CitizenAuthService
    participant SMS as ISmsService
    participant DB as SQL Database

    Citizen->>API: POST /api/CitizenAuth/send-otp { mobileNo: "9876543210" }
    API->>Svc: SendOtpAsync(request, ipAddress)
    Svc->>DB: Check lockout & request throttling
    Svc->>Svc: Generate 6-digit cryptographic OTP & compute SHA-256 hash
    Svc->>DB: Save OTP log with 5-minute expiry
    Svc->>SMS: Dispatch SMS with OTP code
    SMS-->>Citizen: SMS received with OTP
    Svc-->>API: Response (expiresInSeconds: 300)
    API-->>Citizen: HTTP 200 OK

    Citizen->>API: POST /api/CitizenAuth/verify-otp { mobileNo: "9876543210", otp: "481920" }
    API->>Svc: VerifyOtpAsync(request, ipAddress)
    Svc->>DB: Verify OTP hash & attempt limits
    alt Valid OTP
        Svc->>DB: Auto-register / update CitizenMasterEntity; Reset failed count
        Svc->>Svc: Issue signed JWT Bearer Token (Role: "Citizen")
        Svc-->>API: Return token & citizen metrics
        API-->>Citizen: HTTP 200 OK (Authenticated)
    else Invalid OTP
        Svc->>DB: Increment failed attempts (Lockout for 15m if >= 5)
        Svc-->>API: Throw ValidationException
        API-->>Citizen: HTTP 400 Bad Request
    end
```

---

## 🛡️ Security Policies

| Policy | Value | Description |
|---|---|---|
| **OTP Lifetime** | 5 Minutes (`300s`) | Active lifespan before OTP expiration. |
| **Max Attempts per OTP** | 3 Attempts | Maximum failed verifications allowed for a single OTP challenge. |
| **Brute-Force Lockout** | 5 Attempts | Triggers account lockout after 5 consecutive failed attempts. |
| **Lockout Duration** | 15 Minutes | Cooldown period before citizen can request or verify OTP again. |
| **Request Throttling** | 30 Seconds | Mandatory minimum delay between OTP requests. |
| **Sliding Window Quota** | 5 OTPs / 15 Mins | Maximum OTP requests per mobile number within 15 minutes. |
