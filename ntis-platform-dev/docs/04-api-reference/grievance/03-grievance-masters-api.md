# Grievance Masters & Configuration API Reference

---

## 1. Citizen Master (`/api/CitizenMaster`)
- `GET /api/CitizenMaster` — Paged list of registered citizens.
- `GET /api/CitizenMaster/{id}` — Get citizen profile by ID.
- `GET /api/CitizenMaster/by-mobile/{mobileNo}` — Lookup citizen by registered phone.
- `POST /api/CitizenMaster` — Register new citizen.
- `PUT /api/CitizenMaster/{id}` — Update citizen profile.
- `DELETE /api/CitizenMaster/{id}` — Soft-delete citizen.

---

## 2. Department Master (`/api/GrievanceDepartment`)
- `GET /api/GrievanceDepartment` — Paged list of municipal departments.
- `GET /api/GrievanceDepartment/{id}` — Get department by ID.
- `POST /api/GrievanceDepartment` — Create new department.
- `PUT /api/GrievanceDepartment/{id}` — Update department details.
- `DELETE /api/GrievanceDepartment/{id}` — Soft-delete department.

---

## 3. Grievance Type Master (`/api/GrievanceType`)
- `GET /api/GrievanceType` — List complaint classifications and department linkage.
- `GET /api/GrievanceType/{id}` — Get type details.
- `POST /api/GrievanceType` — Create new complaint category.
- `PUT /api/GrievanceType/{id}` — Update grievance type details.
- `DELETE /api/GrievanceType/{id}` — Soft-delete type.

---

## 4. Grievance Workflow (`/api/GrievanceWorkflow`)
- `GET /api/GrievanceWorkflow` — Paged list of workflow pipelines.
- `GET /api/GrievanceWorkflow/{id}` — Get workflow by ID.
- `POST /api/GrievanceWorkflow` — Create new custom workflow definition.
- `PUT /api/GrievanceWorkflow/{id}` — Update workflow properties or default flag.
- `DELETE /api/GrievanceWorkflow/{id}` — Soft-delete / deactivate workflow.

---

## 5. Grievance Workflow State (`/api/GrievanceWorkflowState`)
- `GET /api/GrievanceWorkflowState` — List workflow states with filtering by `workflowId`.
- `GET /api/GrievanceWorkflowState/{id}` — Get workflow state by ID.
- `POST /api/GrievanceWorkflowState` — Define state (initial, final, display order).
- `PUT /api/GrievanceWorkflowState/{id}` — Update state name, local name, or flags.
- `DELETE /api/GrievanceWorkflowState/{id}` — Soft-delete / deactivate state.

---

## 6. Grievance Workflow Transition (`/api/GrievanceWorkflowTransition`)
- `GET /api/GrievanceWorkflowTransition` — List state machine transition rules.
- `GET /api/GrievanceWorkflowTransition/{id}` — Get transition by ID.
- `POST /api/GrievanceWorkflowTransition` — Create transition rule (FromState ➔ ToState).
- `PUT /api/GrievanceWorkflowTransition/{id}` — Update transition rule / remarks required.
- `DELETE /api/GrievanceWorkflowTransition/{id}` — Soft-delete / deactivate transition.

---

## 7. Grievance Department Forwarding (`/api/GrievanceDeptForwarding`)
- `GET /api/GrievanceDeptForwarding` — Paged list of all forwardings with filtering.
- `GET /api/GrievanceDeptForwarding/{id}` — Get forwarding details by ID.
- `GET /api/GrievanceDeptForwarding/grievance/{grievanceId}` — Get all forwardings for a ticket.
- `GET /api/GrievanceDeptForwarding/department/{departmentId}` — Paged Department task inbox with sorting & filtering (`GrievanceDeptForwardingQueryParameters`).
- `POST /api/GrievanceDeptForwarding` — Create parallel forwarding record.
- `PUT /api/GrievanceDeptForwarding/{id}` — Update forwarding status, remark, or officer.
- `DELETE /api/GrievanceDeptForwarding/{id}` — Soft-delete forwarding.

---

## 8. Grievance Activity Log (`/api/GrievanceActivityLog`)
- `GET /api/GrievanceActivityLog` — Paged & filtered queries across the entire audit log.
- `GET /api/GrievanceActivityLog/{id}` — Get single audit log record by `long Id`.
- `GET /api/GrievanceActivityLog/grievance/{grievanceId}` — Get chronological action trail for a ticket.
