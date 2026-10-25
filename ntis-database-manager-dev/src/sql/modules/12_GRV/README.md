# 12_GRV — Grievance Redressal System (Comprehensive Architecture & Schema Guide)

> **Document Purpose**: Complete technical and functional documentation for the `12_GRV` module in the NTIS Database Manager.  
> **Audience**: Solution Architects, Backend Developers, Database Administrators, and AI Assistant Agents.  
> **Scope**: Exclusive to the `12_GRV` schema and its integration points with `01_CORE` and `02_PTIS`.

---

## 1. Product Vision & Architecture

The **GRV (Grievance Redressal System)** module is architected as a **configurable, multi-tenant enterprise product** rather than a bespoke one-off service. It is designed to be deployed across diverse organizations—primarily **Municipal Corporations (Urban Local Bodies / ULBs)** as well as **private enterprise facilities**.

### 1.1. Core Architectural Pillars

1. **Independent Database Per Municipal Corporation**:
   - Each municipal corporation / council / client operates with its own isolated SQL Server database.
   - **No `TenantId` column is required** in tables because data isolation is enforced at the database layer.
2. **Citizen vs. Staff Identity Separation**:
   - **Citizens** access public portals password-free across all modules using Mobile Number + OTP verification (`[CORE].[CitizenMaster]`, `[CORE].[CitizenOtpLog]`).
   - **Municipal Staff** (Administrators, Municipal Commissioners, Heads of Departments [HoDs], Ward Representatives, Field Inspectors) are managed in `[CORE].[UserMaster]`.
3. **Dynamic Workflow Engine (Option B Architecture)**:
   - Workflows and statuses are **not hardcoded**. Different municipal corporations require different administrative approval chains.
   - Static status tables (`GrievanceStatusMaster`) were explicitly **eliminated in favor of Option B**. Statuses are defined directly as workflow states (`[GRV].[GrievanceWorkflowState]`), giving each council 100% control over state names, localized Marathi/Hindi translations, display order, and valid transition paths.
   - A pre-configured **Default Workflow** (`IsDefault = 1`) is seeded out-of-the-box so the system functions immediately without requiring upfront workflow setup by the council.
4. **Current Status & Assignee Visibility**:
   - At any point in time, a complaint displays both **what stage it is at** (`CurrentStateId`) and **who currently holds it** (`CurrentAssignedToUserId` — Commissioner, HoD, Ward Rep, etc.).
5. **Parallel Multi-Department Forwarding (Sub-Tasking Engine)**:
   - When a complex grievance involves multiple domains (e.g., broken road + water leakage + street light fault), the complaint can be forwarded to multiple departments simultaneously.
   - Each forwarded department gets an independent sub-task row (`[GRV].[GrievanceDeptForwarding]`) with its own status and assigned department officer, while the parent `[GRV].[GrievanceApplication]` retains overall master governance.
6. **Immutable Audit & Activity Log**:
   - Every single transition, assignment, department forwarding, and staff input remark is recorded in an append-only log (`[GRV].[GrievanceActivityLog]`) for citizen timeline transparency and SLA reporting.

---

## 2. End-to-End Grievance Lifecycle Walkthrough

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Portal as Citizen Portal / App
    participant DB as NTIS Database (CORE / PTIS / GRV)
    actor Officer as Staff (Admin / Commissioner / HoD)
    actor DeptStaff as Department Officer (PWD / Water)

    Citizen->>Portal: Enters Mobile No
    Portal->>DB: Logs OTP Challenge ([CORE].[CitizenOtpLog])
    Citizen->>Portal: Enters OTP & Submits Grievance (Dept, Type, Zone, Ward, Location, Description)
    DB->>DB: Creates [CORE].[CitizenMaster] (if new), Inserts [GRV].[GrievanceApplication] (GrievanceNo: GRV-2026-000042)
    DB->>DB: Inserts Initial Row in [GRV].[GrievanceActivityLog] (State: Pending)

    Officer->>DB: Reviews ticket; Assigns to Staff / HoD (State: Assigned)
    DB->>DB: Updates CurrentAssignedToUserId, logs to GrievanceActivityLog

    Officer->>DB: Forwards to multiple depts (Water Supply + PWD) (State: Under Review)
    DB->>DB: Inserts rows into GrievanceDeptForwarding (Status: PENDING)

    DeptStaff->>DB: Resolves department work, adds remark
    DB->>DB: Updates GrievanceDeptForwarding (Status: RESOLVED)

    Officer->>DB: Marks master complaint as Resolved (State: Resolved)
    DB->>DB: Sets ResolvedDate, logs to GrievanceActivityLog

    Citizen->>Portal: Views resolution; Confirms Closed or Reopens
    Portal->>DB: Sets State to Closed (Terminal) or Reopens to Under Review
```

---

## 3. Detailed Table-by-Table Catalog

The `12_GRV` module contains **11 module-specific tables** and links to the **universal citizen authentication layer in `01_CORE`** and **geographic hierarchy in `02_PTIS`**:

```
[12_GRV Schema]
 ├── Configuration & Taxonomy Layer
 │    ├── [GRV].[GrievanceDepartmentMaster]
 │    ├── [GRV].[GrievanceTypeMaster]
 │    └── [GRV].[GrievancePhotoType]
 ├── Dynamic Workflow Engine Layer
 │    ├── [GRV].[GrievanceWorkflow]
 │    ├── [GRV].[GrievanceWorkflowState]
 │    └── [GRV].[GrievanceWorkflowTransition]
 ├── Transaction, Audit & Execution Layer
 │    ├── [GRV].[GrievanceApplication]
 │    ├── [GRV].[GrievanceActivityLog]
 │    ├── [GRV].[GrievanceDeptForwarding]
 │    └── [GRV].[GrievancePhoto]
 └── Governance & Escalation Layer
      └── [GRV].[GrievanceEscalation]

[Referenced External Layers]
 ├── [CORE].[CitizenMaster] (Universal citizen authentication across all modules)
 ├── [CORE].[CitizenOtpLog] (Universal citizen OTP challenges)
 ├── [CORE].[UserMaster] (Municipal staff & officers)
 ├── [CORE].[DocumentBinding] (Unified document/attachment bindings)
 ├── [PTIS].[ZoneMaster] (Geographic Zone classification)
 └── [PTIS].[WardMaster] (Geographic Ward classification)
```

---

### 3.1. Configuration & Taxonomy Layer

#### `[GRV].[GrievanceDepartmentMaster]`
- **Purpose**: Master table for all municipal departments (e.g., Public Works, Water Supply, Sewerage & Drainage, Solid Waste, Street Lighting, Health, Town Planning).
- **Why Created**: Provides standardized departmental routing and reporting across all council operations.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique identifier for the department.
  - `CoreDepartmentId` (INT, FK $\rightarrow$ `[CORE].[DepartmentMaster]`, NULL): Optional linkage to enterprise department master. Enforces 1:1 when linked via unique filtered index `UQ_GrievanceDepartmentMaster_CoreDepartmentId` (`WHERE [CoreDepartmentId] IS NOT NULL`).
  - `DepartmentName` (VARCHAR(100), UNIQUE, NOT NULL): Official English name.
  - `DepartmentNameLocal` (NVARCHAR(150), NULL): Regional language label (Marathi / Hindi).
  - `IsActive` (BIT, DEFAULT 1): Active/inactive status flag.
- **Seeded Data**: 65 standard municipal departments pre-populated in `02_seed_data.sql`, with enterprise linkages pre-mapped to CORE departments.

#### `[GRV].[GrievanceTypeMaster]`
- **Purpose**: Sub-categorizes specific complaint issues under each department.
- **Why Created**: Allows citizens to pinpoint their grievance without needing to know internal municipal division codes, with standard SLA targets per complaint category.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique grievance type identifier.
  - `GrievanceDepartmentId` (INT, FK $\rightarrow$ `[GRV].[GrievanceDepartmentMaster]`): Parent department.
  - `GrievanceType` (NVARCHAR(150), NOT NULL): Description of the issue (e.g., *Potholes*, *Contaminated Water*, *Street Light Damage*). Enforced unique per department via `UQ_GrievanceTypeMaster_Department_GrievanceType`.
  - `SlaDays` (INT, NULL): Standard Service Level Agreement resolution timeframe in days.
  - `SlaHours` (INT, NULL): Granular Service Level Agreement resolution timeframe in hours (for sub-day / hourly tracking).
- **Seeded Data**: Comprehensive catalog of common municipal complaint types pre-populated per department with realistic municipal SLA days and hours.

#### `[GRV].[GrievancePhotoType]`
- **Purpose**: Defines standardized photo categories and scopes for grievance visual evidence (e.g., *Front View*, *Damage Detail*, *Resolution Evidence*).
- **Why Created**: Enforces structured visual evidence collection during grievance submission and site inspections.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique photo type identifier.
  - `PhotoTypeCode` (VARCHAR(50), UNIQUE, NOT NULL): Stable machine code (e.g., `FRONT`, `DAMAGE`, `RESOLVED_PROOF`).
  - `PhotoTypeName` (NVARCHAR(200), NOT NULL): Human-readable UI label.
  - `Description` (NVARCHAR(500), NULL): Guidance / tooltip text for citizen or inspector.
  - `DisplayOrder` (INT, NULL): Sort order for UI dropdowns.
  - `PhotoScope` (VARCHAR(30), NULL): Scope classification.
  - `IsActive` (BIT, DEFAULT 1): Active status flag.

---

### 3.2. Universal Citizen Identity & Security Layer (`01_CORE`)

#### `[CORE].[CitizenMaster]`
- **Purpose**: Stores unified citizen user accounts across all citizen portals (Grievances, RTS citizen applications, property tax self-service, water tax requests, etc.).
- **Why Created**:
  - **Decouples citizens from municipal employees**: Citizens never exist in `[CORE].[UserMaster]`.
  - **Shared Identity Across Modules**: A single citizen login works seamlessly across GRV, RTS, PTIS, WTIS, etc.
  - **Passwordless Authentication**: Citizens log in strictly via Mobile Number + OTP.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique citizen ID.
  - `MobileNo` (VARCHAR(15), UNIQUE, NOT NULL): Primary login and communication identifier.
  - `Name` (NVARCHAR(150), NOT NULL): Citizen's full name.
  - `IsVerified` (BIT, DEFAULT 0): Set to `1` upon the citizen's first successful OTP verification.
  - `FailedOtpCount` (INT, DEFAULT 0): Tracks consecutive bad attempts.
  - `LockedUntilAt` (DATETIME, NULL): Enforces brute-force rate limiting if failed attempts exceed safety limits.

#### `[CORE].[CitizenOtpLog]`
- **Purpose**: Logs and validates every OTP issued to a mobile number for citizen login or transaction authentication across all modules.
- **Why Created**: Secures the OTP lifecycle and prevents replay attacks or credential stuffing across the entire municipal suite.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): OTP log ID.
  - `MobileNo` (VARCHAR(15), NOT NULL): Mobile number targeted.
  - `CitizenId` (INT, FK $\rightarrow$ `[CORE].[CitizenMaster]`, NULL): Linked citizen (NULL during first-time registration before profile creation).
  - `Purpose` (VARCHAR(50), NOT NULL, DEFAULT `'LOGIN'`): Authentication context (e.g. `'LOGIN'`, `'SUBMIT_GRIEVANCE'`, `'RTS_APPLICATION'`).
  - `ModuleCode` (VARCHAR(20), NULL): Originating module (e.g. `'GRV'`, `'RTS'`, `'PTIS'`).
  - `ReferenceId` (VARCHAR(50), NULL): Optional entity/transaction reference context.
  - `OtpHash` (VARCHAR(256), NOT NULL): Cryptographic hash (bcrypt / Argon2id / keyed HMAC-SHA-256) of the OTP code — **never stored in plain text or as plain unkeyed hash**.
  - `ExpiresAt` (DATETIME, NOT NULL): Expiry threshold (typically issuance time + 5 minutes).
  - `IsUsed` (BIT, DEFAULT 0): Flagged to `1` as soon as verified; prevents OTP reuse.
  - `AttemptCount` (INT, DEFAULT 0): Number of attempts made against this specific OTP (max 3 allowed).
  - `IpAddress` (VARCHAR(50), NULL): Originating IP address for security audits.
  - `IsActive` (BIT, DEFAULT 1): Active status flag.
  - `CreatedBy` (INT, NULL): Creator user identifier.
  - `CreatedDate` (DATETIME, DEFAULT GETDATE()): Creation timestamp.
  - `UpdatedBy` (INT, NULL): Updater user identifier.
  - `UpdatedDate` (DATETIME, NULL): Update timestamp.

---

### 3.3. Dynamic Workflow Engine Layer (Option B)

#### `[GRV].[GrievanceWorkflow]`
- **Purpose**: Header table defining a named grievance workflow for a council.
- **Why Created**:
  - Councils can define custom workflows (e.g., *Standard Ward Flow*, *VIP / Escalated Flow*, *Private Sector Flow*).
  - Enables product flexibility: different clients can have different workflows without altering database schema or application code.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique workflow ID.
  - `WorkflowName` (NVARCHAR(200), UNIQUE, NOT NULL): Workflow title.
  - `IsDefault` (BIT, DEFAULT 0): Flags the fallback default workflow used when no custom workflow is selected. Enforced as a singleton across the table via filtered unique index `UQ_GrievanceWorkflow_IsDefault` (`WHERE [IsDefault] = 1`).

#### `[GRV].[GrievanceWorkflowState]`
- **Purpose**: Defines the individual states / steps belonging to a workflow.
- **Why Created**:
  - **Replaces static status enums / tables**.
  - Allows councils to define custom states (e.g., *Site Inspection Done*, *Sanction Pending*, *Executive Engineer Review*).
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique state identifier.
  - `WorkflowId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflow]`): Owning workflow.
  - `StateName` (NVARCHAR(150), NOT NULL): State title in English (e.g., *Pending*, *Under Review*, *Resolved*).
  - `StateNameLocal` (NVARCHAR(150), NULL): State title in regional language.
  - `DisplayOrder` (INT, NOT NULL): Sequence order for rendering citizen timelines and UI trackers.
  - `IsInitial` (BIT, DEFAULT 0): Exactly one state per workflow has `IsInitial = 1` (the state assigned upon complaint creation). Enforced per workflow via filtered unique index `UQ_GrievanceWorkflowState_Workflow_IsInitial` (`WHERE [IsInitial] = 1`).
  - `IsFinal` (BIT, DEFAULT 0): Terminal states (e.g., *Closed*, *Rejected*) where no further forward transitions can occur.

#### `[GRV].[GrievanceWorkflowTransition]`
- **Purpose**: Defines the allowable transition paths between states in a workflow.
- **Why Created**:
  - Directs UI behavior: determines which action buttons appear when a staff member views a ticket.
  - Enforces business rules (e.g., whether a remark is mandatory or if department forwarding is allowed during this transition).
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique transition ID.
  - `WorkflowId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflow]`): Owning workflow.
  - `FromStateId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflowState]`): Source state.
  - `ToStateId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflowState]`): Destination state.
  - `TransitionName` (NVARCHAR(150), NOT NULL): Action button label (e.g., *Assign to Staff*, *Start Review*, *Forward to Department*, *Mark Resolved*).
  - `CanForwardToDept` (BIT, DEFAULT 0): If `1`, the UI opens a modal allowing staff to select one or more departments to forward to.
  - `RemarkRequired` (BIT, DEFAULT 0): If `1`, staff cannot submit the transition without entering explanatory text.

---

### 3.4. Transaction, Audit & Execution Layer

#### `[GRV].[GrievanceApplication]`
- **Purpose**: The central entity representing a filed grievance ticket.
- **Why Created**: Captures citizen submission data, geographic classification (Zone & Ward), current stage, holding staff member, and resolution timestamps.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Primary key.
  - `GrievanceNo` (VARCHAR(30), UNIQUE, NOT NULL): Human-readable public tracking number generated at submission (e.g., `GRV-2026-000042`).
  - `CitizenId` (INT, FK $\rightarrow$ `[CORE].[CitizenMaster]`): Citizen who filed the grievance.
  - `GrievanceDepartmentId` (INT, FK $\rightarrow$ `[GRV].[GrievanceDepartmentMaster]`): Primary department chosen by citizen.
  - `GrievanceTypeId` (INT, FK $\rightarrow$ `[GRV].[GrievanceTypeMaster]`): Issue type chosen by citizen.
  - `RoadLandmark` (NVARCHAR(500), NULL): Road name, landmark, or specific locality entered by citizen.
  - `Latitude` (DECIMAL(10, 7), NULL): GPS latitude coordinates of the grievance location.
  - `Longitude` (DECIMAL(10, 7), NULL): GPS longitude coordinates of the grievance location.
  - `ZoneId` (INT, FK $\rightarrow$ `[PTIS].[ZoneMaster]`, NULL): Geographic municipal zone.
  - `WardId` (INT, FK $\rightarrow$ `[PTIS].[WardMaster]` `([WardId], [ZoneId])`, NULL): Geographic municipal ward (enforced to strictly match the selected `ZoneId`).
  - `Description` (NVARCHAR(2000), NULL): Comprehensive description of the grievance.
  - `WorkflowId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflow]`): Workflow assigned to this ticket.
  - `CurrentStateId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflowState]`): The exact stage the grievance is in right now.
  - `CurrentAssignedToUserId` (INT, FK $\rightarrow$ `[CORE].[UserMaster]`, NULL): The internal staff member currently responsible for the ticket (Admin, Commissioner, HoD, Ward Rep, or Field Worker). `NULL` when unassigned.
  - `SubmittedDate` (DATETIME, NOT NULL): Timestamp of initial creation.
  - `SlaDueDate` (DATETIME, NULL): Calculated resolution deadline based on GrievanceTypeMaster SLA. Indexed via filtered nonclustered index `IX_GrievanceApplication_SlaDueDate` (`WHERE [MarkedForDeletion] = 0`) for rapid dashboard query performance and SLA breach alerting.
  - `ResolvedDate` (DATETIME, NULL): Timestamp when ticket reaches resolution state.
  - `ClosedDate` (DATETIME, NULL): Timestamp when ticket reaches final closure.
  - `MarkedForDeletion` (BIT, DEFAULT 0): Permanent deletion flag.
  - `MarkedForDeletionDate` (DATETIME, NULL): Date and time when permanently deleted.
  - `IsActive` (BIT, DEFAULT 1): Soft delete / active state flag.

#### `[GRV].[GrievanceActivityLog]`
- **Purpose**: Comprehensive, append-only chronological history of every action taken on a grievance.
- **Why Created**:
  - Provides the data feed for citizen-facing timeline widgets.
  - Enables administrative SLA audits and turnaround time analytics.
- **Key Columns**:
  - `Id` (BIGINT, PK, IDENTITY): Unique audit log sequence ID.
  - `GrievanceApplicationId` (INT, FK $\rightarrow$ `[GRV].[GrievanceApplication]`): Associated ticket.
  - `FromStateId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflowState]`, NULL): Previous state (`NULL` for initial submission).
  - `ToStateId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflowState]`): New state.
  - `TransitionId` (INT, FK $\rightarrow$ `[GRV].[GrievanceWorkflowTransition]`, NULL): Transition used (`NULL` for initial submission).
  - `ActionByUserId` (INT, FK $\rightarrow$ `[CORE].[UserMaster]`, NULL): Staff member who triggered the action (`NULL` for citizen submission).
  - `AssignedToUserId` (INT, FK $\rightarrow$ `[CORE].[UserMaster]`, NULL): Who the ticket was handed to during this step.
  - `Remark` (NVARCHAR(2000), NULL): Staff comments or citizen notes entered at this step.
  - `ActionAt` (DATETIME, DEFAULT GETDATE()): Exact execution timestamp.

#### `[GRV].[GrievanceDeptForwarding]`
- **Purpose**: Manages multi-department parallel assignments (sub-tasks) under a single master grievance.
- **Why Created**:
  - Real-world civic grievances frequently span multiple departments (e.g., Road Repair + Water Leakage + Electrical Pole Damage).
  - Instead of duplicating the entire grievance, sub-tasks are created per department.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique forwarding sub-task ID.
  - `GrievanceApplicationId` (INT, FK $\rightarrow$ `[GRV].[GrievanceApplication]`): Master complaint reference.
  - `ActivityLogId` (BIGINT, FK $\rightarrow$ `[GRV].[GrievanceActivityLog]`): The specific activity log event that spawned this forwarding.
  - `ForwardedToDeptId` (INT, FK $\rightarrow$ `[GRV].[GrievanceDepartmentMaster]`): Department receiving the sub-task.
  - `AssignedToUserId` (INT, FK $\rightarrow$ `[CORE].[UserMaster]`, NULL): Department staff member assigned to work on this sub-task.
  - `ForwardingStatus` (VARCHAR(20), CHECK IN (`'PENDING'`, `'IN_PROGRESS'`, `'RESOLVED'`)): Department-level task progress.
  - `Remark` (NVARCHAR(2000), NULL): Resolution note entered by the department officer when their portion of work is completed.
  - `ForwardedAt` (DATETIME, NOT NULL): Forwarding timestamp.
  - `ResolvedAt` (DATETIME, NULL): Completion timestamp for this department's sub-task.
  - `MarkedForDeletion` (BIT, DEFAULT 0): Permanent deletion flag.
  - `MarkedForDeletionDate` (DATETIME, NULL): Date and time when permanently deleted.
  - `IsActive` (BIT, DEFAULT 1): Soft delete / active state flag.

#### `[GRV].[GrievancePhoto]`
- **Purpose**: Attaches uploaded site photos and resolution proof images to a grievance application.
- **Why Created**: Links visual documentation with the central file/attachment system (`[CORE].[DocumentBinding]`).
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique record identifier.
  - `GrievanceApplicationId` (INT, FK $\rightarrow$ `[GRV].[GrievanceApplication]`): Associated master grievance.
  - `PhotoTypeId` (INT, FK $\rightarrow$ `[GRV].[GrievancePhotoType]`): Photo classification.
  - `DocumentBindingId` (INT, FK $\rightarrow$ `[CORE].[DocumentBinding]`, NULL): Reference to the physical binary/cloud document in the CORE document store.
  - `IsLatest` (BIT, DEFAULT 1): Flags the current active photo versus superseded historical revisions.
  - `Remarks` (NVARCHAR(500), NULL): Citizen or field inspector notes for the photo.
  - `IsActive` (BIT, DEFAULT 1): Soft delete / active state flag.

---

### 3.5. Governance & Escalation Layer

#### `[GRV].[GrievanceEscalation]`
- **Purpose**: Provides an independent governance and escalation channel for elected representatives (Ward Corporators) and administrative observers (Zonal Officers / Assistant Commissioners) to highlight or expedite citizen complaints without disturbing the core complaint workflow state machine.
- **Why Created**:
  - Enables corporators and zonal commissioners to register formal inquiries or priority escalations against a complaint.
  - Retains a snapshot of the target department and assigned officer at the time of escalation.
  - Tracks formal staff responses back to the elected representative.
- **Key Columns**:
  - `Id` (INT, PK, IDENTITY): Unique escalation record identifier.
  - `GrievanceApplicationId` (INT, FK $\rightarrow$ `[GRV].[GrievanceApplication]`, ON DELETE CASCADE): Master ticket being escalated.
  - `ZoneId` (INT, FK $\rightarrow$ `[PTIS].[ZoneMaster]`, NULL): Zonal jurisdiction of the escalation.
  - `WardId` (INT, FK $\rightarrow$ `[PTIS].[WardMaster]` `([WardId], [ZoneId])`, NULL): Ward jurisdiction of the escalation (enforced to strictly match `ZoneId`).
  - `EscalatedByUserId` (INT, FK $\rightarrow$ `[CORE].[UserMaster]`): Observer/Corporator user ID who initiated the poke.
  - `Reason` (NVARCHAR(1000), NOT NULL): Detailed justification for escalation.
  - `Priority` (NVARCHAR(20), CHECK IN (`'NORMAL'`, `'HIGH'`, `'URGENT'`)): Urgency level.
  - `EscalationStatus` (NVARCHAR(30), CHECK IN (`'PENDING'`, `'ACKNOWLEDGED'`, `'RESOLVED'`, `'REJECTED'`, `'CLOSED'`)): Escalation resolution status.
  - `TargetDepartmentId` (INT, FK $\rightarrow$ `[GRV].[GrievanceDepartmentMaster]`, NULL): Target department snapshot.
  - `TargetAssignedToUserId` (INT, FK $\rightarrow$ `[CORE].[UserMaster]`, NULL): Staff member holding ticket snapshot.
  - `StaffResponse` (NVARCHAR(2000), NULL): Formal response text from staff back to the representative.
  - `RespondedByUserId` (INT, FK $\rightarrow$ `[CORE].[UserMaster]`, NULL): Staff member who provided the response.
  - `RespondedAt` (DATETIME, NULL): Response timestamp.

---

## 4. Multi-Department Forwarding Mechanics (In-Depth)

### Concrete Example
A citizen reports: **"Main road cave-in with burst water pipe and broken streetlight on MG Road"**.

1. **Master Ticket Created**:
   - `[GRV].[GrievanceApplication]`:
     - `GrievanceNo`: `GRV-2026-000099`
     - `GrievanceDepartmentId`: Public Works Department (1)
     - `CurrentStateId`: `Pending` (1)
     - `CurrentAssignedToUserId`: `NULL`

2. **Commissioner / Triage Officer Reviews & Forwards**:
   - Triage officer transitions ticket to `Under Review` and selects 3 departments via the `Forward to Department` action (`CanForwardToDept = 1`).
   - 3 rows are inserted into `[GRV].[GrievanceDeptForwarding]`:

| Id | GrievanceApplicationId | ForwardedToDeptId | AssignedToUserId | ForwardingStatus | Remark |
|:---|:---|:---|:---|:---|:---|
| 101 | 42 (`GRV-2026-000099`) | 1 (Public Works) | User 14 (Road Engineer) | `IN_PROGRESS` | "Inspecting road cave-in" |
| 102 | 42 (`GRV-2026-000099`) | 2 (Water Supply) | User 22 (Water Inspector) | `PENDING` | `NULL` |
| 103 | 42 (`GRV-2026-000099`) | 4 (Street Lighting) | User 35 (Electrical JE) | `RESOLVED` | "Pole rewired and tested" |

3. **Sub-Task Lifecycle vs. Master Lifecycle**:
   - Each department works on its assigned sub-task and updates its own `ForwardingStatus` to `RESOLVED` with remarks.
   - The master complaint `[GRV].[GrievanceApplication]` remains in `Under Review` until the lead officer / Commissioner verifies that all departmental tasks are complete and transitions the master complaint to `Resolved`.

---

## 5. Seed Data Reference (Default Workflow & Taxonomy)

The file `src/sql/modules/12_GRV/02_seed_data.sql` pre-populates:
1. **65 Standard Municipal Departments** in `[GRV].[GrievanceDepartmentMaster]` (with English and Marathi local names, and cross-module linkages to `[CORE].[DepartmentMaster]`).
2. **Standard Complaint Types** in `[GRV].[GrievanceTypeMaster]` mapped to their respective departments with pre-configured SLA turnaround times (`SlaDays` and `SlaHours`).
3. **The Default Workflow**:
   - `[GRV].[GrievanceWorkflow]`: `"Standard Municipal Grievance Flow"` (`IsDefault = 1`).
   - `[GRV].[GrievanceWorkflowState]`:
     - `1: Pending` (`IsInitial = 1`)
     - `2: Assigned`
     - `3: Under Review`
     - `4: Resolved`
     - `5: Closed` (`IsFinal = 1`)
     - `6: Rejected` (`IsFinal = 1`)
   - `[GRV].[GrievanceWorkflowTransition]`:
     - `Pending → Assigned` (*"Assign to Staff"*)
     - `Assigned → Under Review` (*"Start Review"*)
     - `Assigned → Pending` (*"Return / Unassign"*)
     - `Under Review → Resolved` (*"Mark Resolved"*)
     - `Under Review → Assigned` (*"Reassign"*)
     - `Under Review → Under Review` (*"Forward to Department"*, `CanForwardToDept = 1`)
     - `Resolved → Closed` (*"Confirm Closed"*)
     - `Resolved → Under Review` (*"Reopen"*)
     - `Pending / Assigned / Under Review → Rejected` (*"Reject"*)

---

## 6. Crucial Rules for Developers & AI Agents

When reading, updating, or querying `12_GRV`, you must follow these architectural rules:

1. **Do Not Reintroduce Static Status Tables**:
   - Never add a `GrievanceStatusMaster` or hardcoded status columns. Statuses are exclusively managed via `[GRV].[GrievanceWorkflowState]`.
2. **Foreign Key Integrity for Users vs. Citizens**:
   - `CitizenId` columns MUST ALWAYS reference `[CORE].[CitizenMaster]([Id])`.
   - `ActionByUserId`, `AssignedToUserId`, `CreatedBy`, and `UpdatedBy` MUST ALWAYS reference `[CORE].[UserMaster]([Id])`.
3. **Immutability of Activity Logs**:
   - `[GRV].[GrievanceActivityLog]` is an append-only audit trail. Never issue `UPDATE` or `DELETE` statements against this table.
4. **Multi-Department Coordination**:
   - Department-level forwarding actions must insert into `[GRV].[GrievanceDeptForwarding]` and link to the relevant `ActivityLogId`.
   - The overall ticket status remains on `[GRV].[GrievanceApplication]`.
5. **Schema File Placement**:
   - All DDL `CREATE TABLE`, `INDEX`, and `CONSTRAINT` scripts reside in [01_base_schema.sql](01_base_schema.sql).
   - All DML `INSERT` seed statements reside in [02_seed_data.sql](02_seed_data.sql).



