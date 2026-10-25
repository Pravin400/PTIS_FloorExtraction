# Citizen Authentication API Reference

Base URL: `/api/CitizenAuth`

---

## 1. Send OTP Challenge (`POST /api/CitizenAuth/send-otp`)
- **Summary**: Sends a 6-digit cryptographic OTP to the citizen mobile number.
- **Auth**: None (`[AllowAnonymous]`).
- **Rate Limit**: Protected by ASP.NET Core RateLimiter (`"login"` policy).

### Request
```json
{
  "mobileNo": "9876543210"
}
```

### Response (200 OK)
```json
{
  "isSuccess": true,
  "message": "OTP has been sent to your registered mobile number.",
  "mobileNo": "9876543210",
  "expiresInSeconds": 300,
  "retryAfterSeconds": 30
}
```

---

## 2. Resend OTP (`POST /api/CitizenAuth/resend-otp`)
- **Summary**: Resends fresh OTP after the 30-second cooldown has elapsed.
- **Auth**: None (`[AllowAnonymous]`).

### Request
```json
{
  "mobileNo": "9876543210"
}
```

---

## 3. Verify OTP (`POST /api/CitizenAuth/verify-otp`)
- **Summary**: Validates OTP and issues a signed JWT token (`Role: "Citizen"`).
- **Auth**: None (`[AllowAnonymous]`).

### Request
```json
{
  "mobileNo": "9876543210",
  "otp": "481920",
  "name": "Prajwal Bhoyar"
}
```

### Response (200 OK)
```json
{
  "isSuccess": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresInMinutes": 1440,
  "citizen": {
    "id": 1042,
    "citizenName": "Prajwal Bhoyar",
    "mobileNo": "9876543210",
    "email": "prajwal@example.com",
    "totalGrievancesFiled": 3,
    "activeGrievances": 1,
    "resolvedGrievances": 2
  }
}
```

---

## 4. Get Current Citizen Profile (`GET /api/CitizenAuth/me`)
- **Summary**: Returns profile and grievance metrics for authenticated citizen.
- **Auth**: `Bearer <token>` (`[Authorize(Roles = "Citizen")]`).

### Response (200 OK)
```json
{
  "id": 1042,
  "citizenName": "Prajwal Bhoyar",
  "mobileNo": "9876543210",
  "email": "prajwal@example.com",
  "address": "Civil Lines, Ward 4",
  "city": "Nagpur",
  "pincode": "440001",
  "totalGrievancesFiled": 3,
  "activeGrievances": 1,
  "resolvedGrievances": 2
}
```

---

## 5. Update Profile (`PUT /api/CitizenAuth/profile`)
- **Summary**: Updates citizen display name.
- **Auth**: `Bearer <token>` (`[Authorize(Roles = "Citizen")]`).

### Request
```json
{
  "name": "Prajwal S. Bhoyar"
}
```
