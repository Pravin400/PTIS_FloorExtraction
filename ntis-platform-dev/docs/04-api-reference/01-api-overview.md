# API Overview & Conventions

## 🌐 Base URL & Environments

- **Local Development**: `https://localhost:7001/api` or `http://localhost:5000/api`
- **Interactive Swagger UI**: `https://localhost:7001/swagger`

---

## 📋 Standard HTTP Response Codes

| Status Code | Meaning | Usage |
|---|---|---|
| `200 OK` | Success | Successful GET, PUT, or custom action. |
| `201 Created` | Created | Successful POST creation with entity payload. |
| `400 Bad Request` | Validation Error | Missing fields, validation exception, or invalid input. |
| `401 Unauthorized`| Authentication Failure | Missing or invalid JWT token. |
| `403 Forbidden` | Authorization Failure | Insufficient role or accessing another citizen's record. |
| `404 Not Found` | Resource Not Found | ID or tracking number does not exist. |
| `500 Server Error`| Internal Failure | Unhandled backend exception. |

---

## 🔍 Pagination, Sorting & Filtering

Standard `GET` list endpoints accept query parameters:
- `pageNumber` (int, default: 1)
- `pageSize` (int, default: 10)
- `sortBy` (string, e.g. `"CreatedDate"`)
- `sortDirection` (string, `"asc"` or `"desc"`)
- `searchTerm` (string)
