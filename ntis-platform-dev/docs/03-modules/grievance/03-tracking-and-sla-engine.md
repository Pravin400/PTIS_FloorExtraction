# Grievance Tracking & SLA Escalation Engine

The **Grievance Tracking Engine** powers public complaint status lookups, timeline history progression, and automated Service Level Agreement (SLA) deadline enforcement.

---

## ⏱️ SLA Deadline Engine

1. **Target Date Calculation**:
   - Each `GrievanceTypeMasterEntity` specifies `SlaDays` (e.g., 3 days for water leaks, 7 days for street lighting, 15 days for building encroachment).
   - Upon creation: `TargetResolutionDate = CreatedDate + TimeSpan.FromDays(SlaDays)`.

2. **Background Escalation Worker**:
   - Scheduled worker in `NtisPlatform.Worker` continuously queries grievances where:
     ```sql
     WHERE IsActive = 1 AND ResolvedDate IS NULL AND TargetResolutionDate < GETUTCDATE() AND IsEscalated = 0
     ```
   - Sets `IsEscalated = true` and records an escalation event in `GrievanceActivityLogEntity`.

---

## 📊 Public Tracking & Timeline Structure

When tracking a grievance via `TrackGrievanceAsync(grievanceNo, mobileNo)`:
- Returns dynamic stage checklist (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) with current stage highlight.
- Returns SLA progress percentage (e.g. `65%`).
- Returns full chronological audit timeline with action taker names, state changes, and official remarks.
