# Grievance Application & Workflow API Reference

Base URL: `/api/GrievanceApplication`

---

## 1. Get All Grievances (`GET /api/GrievanceApplication`)
- **Query Parameters**: `pageNumber`, `pageSize`, `sortBy`, `sortDirection`, `searchTerm`, `departmentId`, `statusId`.

---

## 2. Get By ID (`GET /api/GrievanceApplication/{id}`)
- **Summary**: Returns complete grievance details and current workflow state.

---

## 3. Public Tracking (`GET /api/GrievanceApplication/track/{grievanceNo}`)
- **Summary**: Real-time status lookup with step-by-step progress and SLA percentage.
- **Auth**: None (Public).

---

## 4. Get Citizen Grievances (`GET /api/GrievanceApplication/citizen/{citizenId}`)
- **Summary**: Returns all grievances filed by a citizen (enforces caller data isolation).

---

## 5. Submit Grievance (`POST /api/GrievanceApplication`)
- **Request Body**:
```json
{
  "citizenId": 1042,
  "grievanceDepartmentId": 2,
  "grievanceTypeId": 5,
  "subject": "Garbage not collected",
  "description": "Garbage has accumulated at the corner of street 4.",
  "locationAddress": "Plot 12, Civil Lines",
  "wardNo": "4",
  "zoneNo": "East Zone",
  "priority": "HIGH"
}
```

---

## 6. Assign Officer (`POST /api/GrievanceApplication/{id}/assign`)
- **Request Body**:
```json
{
  "assignedToUserId": 88,
  "remark": "Assigned to Junior Health Inspector."
}
```

---

## 7. Forward Department (`POST /api/GrievanceApplication/{id}/forward`)
- **Request Body**:
```json
{
  "forwardedToDeptId": 4,
  "assignedToUserId": 102,
  "updatePrimaryDepartment": true,
  "remark": "Requires road maintenance department inspection."
}
```

---

## 8. Transition State (`POST /api/GrievanceApplication/{id}/transition`)
- **Request Body**:
```json
{
  "toStateId": 4,
  "assignedToUserId": 88,
  "remark": "Issue resolved on site."
}
```

---

## 9. Action Timeline & History (`GET /api/GrievanceApplication/{id}/history`)
- **Summary**: Returns immutable audit trail of all actions, state transitions, and officer notes.
