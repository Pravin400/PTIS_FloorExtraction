
/* ===========================
    [GRV].[GrievanceDepartmentMaster]
 =========================== */
CREATE TABLE [GRV].[GrievanceDepartmentMaster] (
    [Id]                  INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CoreDepartmentId]    INT NULL,
    [DepartmentName]      VARCHAR(100)  NOT NULL,
    [DepartmentNameLocal] NVARCHAR(150) NULL,
    [IsActive]            BIT NOT NULL CONSTRAINT [DF_GrievanceDepartmentMaster_IsActive]     DEFAULT (1),
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_GrievanceDepartmentMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,

    CONSTRAINT [PK_GrievanceDepartmentMaster]               PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GrievanceDepartmentMaster_DepartmentName] UNIQUE ([DepartmentName]),
    CONSTRAINT [FK_GrievanceDepartmentMaster_CoreDepartmentId] 
        FOREIGN KEY ([CoreDepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]) ON DELETE SET NULL
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_GrievanceDepartmentMaster_CoreDepartmentId]
ON [GRV].[GrievanceDepartmentMaster] ([CoreDepartmentId])
WHERE [CoreDepartmentId] IS NOT NULL;
GO


/* ===========================
   [GRV].[GrievanceTypeMaster]
=========================== */
CREATE TABLE [GRV].[GrievanceTypeMaster] (
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GrievanceDepartmentId] INT NOT NULL,
    [GrievanceType]         NVARCHAR(150) NOT NULL,
    [SlaDays]               INT NULL,
    [SlaHours]              INT NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GrievanceTypeMaster_IsActive]     DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GrievanceTypeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,

    CONSTRAINT [PK_GrievanceTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GrievanceTypeMaster_Department_GrievanceType] UNIQUE ([GrievanceDepartmentId], [GrievanceType]),
    CONSTRAINT [FK_GrievanceTypeMaster_DepartmentId]
        FOREIGN KEY ([GrievanceDepartmentId]) REFERENCES [GRV].[GrievanceDepartmentMaster] ([Id])
) ON [PRIMARY];
GO





/* ===========================
   [GRV].[GrievanceWorkflow]

   PURPOSE:
     Defines a named grievance workflow. Each council configures their own
     workflow. One workflow is seeded as the default (IsDefault = 1) and is
     used automatically when the council has not configured a custom flow.

   KEY DESIGN DECISIONS:
     - IsDefault: only one row should have IsDefault = 1. Enforced at app level.
     - One workflow can be assigned to many GrievanceApplication rows.
     - Workflow definitions are not deleted — only deactivated (IsActive = 0).
=========================== */
CREATE TABLE [GRV].[GrievanceWorkflow] (
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [WorkflowName]          NVARCHAR(200) NOT NULL,
    [WorkflowNameLocal]     NVARCHAR(200) NULL,
    [Description]           NVARCHAR(500) NULL,

    -- 1 = this workflow is used when no custom workflow is configured.
    -- Only one row should be 1 at a time (enforced at app level).
    [IsDefault]             BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflow_IsDefault] DEFAULT (0),

    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflow_IsActive]  DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GrievanceWorkflow_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,

    CONSTRAINT [PK_GrievanceWorkflow]            PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GrievanceWorkflow_WorkflowName] UNIQUE ([WorkflowName])
) ON [PRIMARY];
GO

CREATE UNIQUE INDEX [UQ_GrievanceWorkflow_IsDefault] ON [GRV].[GrievanceWorkflow] ([IsDefault]) WHERE [IsDefault] = 1;
GO


/* ===========================
   [GRV].[GrievanceWorkflowState]

   PURPOSE:
     Each step/state within a workflow. This replaces the static
     GrievanceStatusMaster — states are now fully dynamic and
     defined per workflow by the council.

   KEY DESIGN DECISIONS:
     - IsInitial: exactly one state per workflow should be marked IsInitial = 1.
       This is the state assigned when a new GrievanceApplication is created.
       Enforced at DB level via filtered unique index UQ_GrievanceWorkflowState_Workflow_IsInitial.
     - IsFinal: states with IsFinal = 1 are terminal — no further transitions
       are allowed (e.g. Closed, Rejected). Enforced at app level.
     - DisplayOrder: controls how states appear in the citizen timeline UI.
=========================== */
CREATE TABLE [GRV].[GrievanceWorkflowState] (
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    -- Which workflow this state belongs to.
    [WorkflowId]            INT NOT NULL,

    -- Display label for this state (e.g. "Pending", "Under Commissioner Review").
    [StateName]             NVARCHAR(150) NOT NULL,
    [StateNameLocal]        NVARCHAR(150) NULL,

    -- Controls display order in timelines and dropdowns.
    [DisplayOrder]          INT NOT NULL,

    -- 1 = this state is assigned when a new complaint is filed.
    -- Only one state per workflow can be 1 (enforced via filtered unique index).
    [IsInitial]             BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflowState_IsInitial] DEFAULT (0),

    -- 1 = terminal state. No further transitions allowed from here.
    [IsFinal]               BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflowState_IsFinal]   DEFAULT (0),

    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflowState_IsActive]  DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GrievanceWorkflowState_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,

    CONSTRAINT [PK_GrievanceWorkflowState]                   PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GrievanceWorkflowState_Workflow_StateName] UNIQUE ([WorkflowId], [StateName]),
    CONSTRAINT [UQ_GrievanceWorkflowState_Workflow_Id]        UNIQUE ([WorkflowId], [Id]),
    CONSTRAINT [FK_GrievanceWorkflowState_WorkflowId]
        FOREIGN KEY ([WorkflowId]) REFERENCES [GRV].[GrievanceWorkflow] ([Id])
) ON [PRIMARY];
GO

CREATE INDEX [IX_GrievanceWorkflowState_WorkflowId] ON [GRV].[GrievanceWorkflowState] ([WorkflowId]);
CREATE UNIQUE INDEX [UQ_GrievanceWorkflowState_Workflow_IsInitial] ON [GRV].[GrievanceWorkflowState] ([WorkflowId]) WHERE [IsInitial] = 1;
GO


/* ===========================
   [GRV].[GrievanceWorkflowTransition]

   PURPOSE:
     Defines scientific state machine transitions within a workflow.
=========================== */
CREATE TABLE [GRV].[GrievanceWorkflowTransition] (
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [WorkflowId]            INT NOT NULL,
    [FromStateId]           INT NOT NULL,
    [ToStateId]             INT NOT NULL,

    -- Label shown on the action button in UI.
    [TransitionName]        NVARCHAR(150) NOT NULL,

    -- 1 = staff can forward to one or more departments during this transition.
    [CanForwardToDept]      BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflowTransition_CanForwardToDept] DEFAULT (0),

    -- 1 = staff must enter a remark before executing this transition.
    [RemarkRequired]        BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflowTransition_RemarkRequired]   DEFAULT (0),

    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GrievanceWorkflowTransition_IsActive]         DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GrievanceWorkflowTransition_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,

    CONSTRAINT [PK_GrievanceWorkflowTransition] PRIMARY KEY CLUSTERED ([Id] ASC),
    -- Prevent duplicate transitions for the same From→To action name in a workflow.
    CONSTRAINT [UQ_GrievanceWorkflowTransition_FromTo_Name] UNIQUE ([WorkflowId], [FromStateId], [ToStateId], [TransitionName]),
    CONSTRAINT [UQ_GrievanceWorkflowTransition_Id_From_To]  UNIQUE ([Id], [FromStateId], [ToStateId]),

    CONSTRAINT [FK_GrievanceWorkflowTransition_WorkflowId]
        FOREIGN KEY ([WorkflowId])  REFERENCES [GRV].[GrievanceWorkflow]      ([Id]),
    CONSTRAINT [FK_GrievanceWorkflowTransition_FromState]
        FOREIGN KEY ([WorkflowId], [FromStateId]) REFERENCES [GRV].[GrievanceWorkflowState] ([WorkflowId], [Id]),
    CONSTRAINT [FK_GrievanceWorkflowTransition_ToState]
        FOREIGN KEY ([WorkflowId], [ToStateId])   REFERENCES [GRV].[GrievanceWorkflowState] ([WorkflowId], [Id])
) ON [PRIMARY];
GO

CREATE INDEX [IX_GrievanceWorkflowTransition_WorkflowId]  ON [GRV].[GrievanceWorkflowTransition] ([WorkflowId]);
CREATE INDEX [IX_GrievanceWorkflowTransition_FromStateId] ON [GRV].[GrievanceWorkflowTransition] ([FromStateId]);
GO


/* ===========================
   [GRV].[GrievanceApplication]

   PURPOSE:
     Core transaction table. One row per grievance filed by a citizen.

   KEY DESIGN DECISIONS:
     - CitizenId -> CORE.CitizenMaster. Never directly to CORE.UserMaster.
       Staff who file via the citizen portal also get a CitizenMaster entry.
     - GrievanceNo: human-readable tracking number, app-generated before insert.
       Format: GRV-YYYY-NNNNNN  e.g. GRV-2026-000001.
     - WorkflowId: the workflow this complaint follows. Assigned at submission
       time (council's custom workflow, or the default if none configured).
     - CurrentStateId: the state this complaint is in RIGHT NOW within its
       workflow. Updated on every transition.
     - CurrentAssignedToUserId: the staff member who currently holds the
       complaint (Admin, Commissioner, HoD, Ward Rep, etc.).
       NULL when unassigned. Updated on every transition.
     - RoadLandmark: location info provided by the citizen at submission.
     - ResolvedDate / ClosedDate: set when CurrentStateId reaches an
       IsFinal state. Used for SLA reporting.
     - MarkedForDeletion / MarkedForDeletionDate: flags record for permanent deletion.
     - IsActive: soft delete flag.
=========================== */
CREATE TABLE [GRV].[GrievanceApplication] (
    [Id]                      INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    -- Human-readable tracking number. App generates before insert.
    [GrievanceNo]             VARCHAR(30)   NOT NULL,

    -- Who filed the grievance. Always a CitizenMaster row.
    [CitizenId]               INT           NOT NULL,

    -- Department and type selected by the citizen at submission.
    [GrievanceDepartmentId]   INT           NOT NULL,
    [GrievanceTypeId]         INT           NOT NULL,

    -- Location info entered by the citizen.
    [RoadLandmark]            NVARCHAR(500) NULL,
    [Latitude]                DECIMAL(10, 7) NULL CONSTRAINT [CK_GrievanceApplication_Latitude]  CHECK ([Latitude] BETWEEN -90.0 AND 90.0),
    [Longitude]               DECIMAL(10, 7) NULL CONSTRAINT [CK_GrievanceApplication_Longitude] CHECK ([Longitude] BETWEEN -180.0 AND 180.0),

    -- Geographic Zone & Ward classification
    [ZoneId]                  INT           NULL,
    [WardId]                  INT           NULL,

    -- Full complaint description entered by the citizen.
    [Description]             NVARCHAR(2000) NOT NULL,

    -- Which workflow this complaint follows (set at submission, never changed).
    [WorkflowId]              INT           NOT NULL,

    -- The current state within the workflow. Updated on each transition.
    [CurrentStateId]          INT           NOT NULL,

    -- The staff member who currently holds the complaint.
    -- NULL = unassigned. Can be Admin, Commissioner, HoD, Ward Rep etc.
    [CurrentAssignedToUserId] INT           NULL,

    -- Timestamps for SLA tracking.
    [SubmittedDate]           DATETIME NOT NULL CONSTRAINT [DF_GrievanceApplication_SubmittedDate] DEFAULT (GETDATE()),
    [SlaDueDate]              DATETIME NULL,
    [ResolvedDate]            DATETIME NULL,  -- set when CurrentStateId.IsFinal = 1 and state is resolution type
    [ClosedDate]              DATETIME NULL,  -- set when complaint is fully closed

    [MarkedForDeletion]       BIT NOT NULL CONSTRAINT [DF_GrievanceApplication_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]   DATETIME NULL,
    [IsActive]                BIT NOT NULL CONSTRAINT [DF_GrievanceApplication_IsActive] DEFAULT (1),
    [CreatedBy]               INT NULL,
    [CreatedDate]             DATETIME NOT NULL CONSTRAINT [DF_GrievanceApplication_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]               INT NULL,
    [UpdatedDate]             DATETIME NULL,

    CONSTRAINT [PK_GrievanceApplication]             PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GrievanceApplication_GrievanceNo] UNIQUE ([GrievanceNo]),
    CONSTRAINT [CK_GrievanceApplication_ZoneWard]    CHECK ([WardId] IS NULL OR [ZoneId] IS NOT NULL),

    CONSTRAINT [FK_GrievanceApplication_CitizenId]
        FOREIGN KEY ([CitizenId])             REFERENCES [CORE].[CitizenMaster]            ([Id]),
    CONSTRAINT [FK_GrievanceApplication_DepartmentId]
        FOREIGN KEY ([GrievanceDepartmentId]) REFERENCES [GRV].[GrievanceDepartmentMaster] ([Id]),
    CONSTRAINT [FK_GrievanceApplication_TypeId]
        FOREIGN KEY ([GrievanceTypeId])       REFERENCES [GRV].[GrievanceTypeMaster]       ([Id]),
    CONSTRAINT [FK_GrievanceApplication_ZoneId]
        FOREIGN KEY ([ZoneId])                REFERENCES [PTIS].[ZoneMaster]               ([Id]),
    CONSTRAINT [FK_GrievanceApplication_Ward_Zone]
        FOREIGN KEY ([WardId], [ZoneId])      REFERENCES [PTIS].[WardMaster]               ([Id], [ZoneId]),
    CONSTRAINT [FK_GrievanceApplication_WorkflowId]
        FOREIGN KEY ([WorkflowId])            REFERENCES [GRV].[GrievanceWorkflow]         ([Id]),
    CONSTRAINT [FK_GrievanceApplication_Workflow_CurrentState]
        FOREIGN KEY ([WorkflowId], [CurrentStateId]) REFERENCES [GRV].[GrievanceWorkflowState] ([WorkflowId], [Id]),
    CONSTRAINT [FK_GrievanceApplication_AssignedTo]
        FOREIGN KEY ([CurrentAssignedToUserId]) REFERENCES [CORE].[UserMaster]             ([Id])
) ON [PRIMARY];
GO

CREATE INDEX [IX_GrievanceApplication_CitizenId]    ON [GRV].[GrievanceApplication] ([CitizenId]);           -- citizen's grievance list
CREATE INDEX [IX_GrievanceApplication_DepartmentId] ON [GRV].[GrievanceApplication] ([GrievanceDepartmentId]); -- triage by dept
CREATE INDEX [IX_GrievanceApplication_ZoneId]       ON [GRV].[GrievanceApplication] ([ZoneId]);             -- zonal filtering
CREATE INDEX [IX_GrievanceApplication_WardId]       ON [GRV].[GrievanceApplication] ([WardId]);             -- ward filtering
CREATE INDEX [IX_GrievanceApplication_CurrentState] ON [GRV].[GrievanceApplication] ([CurrentStateId]);       -- dashboard filter
CREATE INDEX [IX_GrievanceApplication_AssignedTo]   ON [GRV].[GrievanceApplication] ([CurrentAssignedToUserId]); -- staff work queue
CREATE NONCLUSTERED INDEX [IX_GrievanceApplication_SlaDueDate]
ON [GRV].[GrievanceApplication] ([SlaDueDate])
WHERE [MarkedForDeletion] = 0;
GO


/* ===========================
   [GRV].[GrievanceActivityLog]

   PURPOSE:
     Append-only audit log. One row is inserted for every action taken
     on a grievance (status transition, assignment, remark, forwarding).
     Provides the full timeline for citizens and SLA analysis for admin.

   KEY DESIGN DECISIONS:
     - Rows are NEVER updated or deleted. Immutable trail.
     - FromStateId NULL for the very first entry (initial submission).
     - TransitionId: which transition was used. NULL for system-generated
       entries (e.g. auto-created first row at submission).
     - AssignedToUserId: who the complaint was assigned to AT THIS STEP.
       Allows full reconstruction of the assignment history.
     - ActionByUserId: who performed this action (staff). NULL for citizen
       submission (first row).
=========================== */
CREATE TABLE [GRV].[GrievanceActivityLog] (
    [Id]                     BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    [GrievanceApplicationId] INT          NOT NULL,

    -- State before this action. NULL for the initial submission entry.
    [FromStateId]            INT          NULL,

    -- State after this action.
    [ToStateId]              INT          NOT NULL,

    -- Which transition was used. NULL for system-generated first entry.
    [TransitionId]           INT          NULL,

    -- Staff member who performed this action. NULL for citizen submission.
    [ActionByUserId]         INT          NULL,

    -- Who the complaint was assigned to at this step (for timeline display).
    [AssignedToUserId]       INT          NULL,

    -- Staff remark / input at this stage.
    [Remark]                 NVARCHAR(2000) NULL,

    -- Exact timestamp for SLA calculations.
    [ActionAt]               DATETIME NOT NULL CONSTRAINT [DF_GrievanceActivityLog_ActionAt] DEFAULT (GETDATE()),

    CONSTRAINT [CK_GrievanceActivityLog_TransitionFromState]
        CHECK (([TransitionId] IS NULL AND [FromStateId] IS NULL) OR
               ([TransitionId] IS NOT NULL AND [FromStateId] IS NOT NULL)),

    CONSTRAINT [PK_GrievanceActivityLog] PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [FK_GrievanceActivityLog_GrievanceId]
        FOREIGN KEY ([GrievanceApplicationId]) REFERENCES [GRV].[GrievanceApplication]        ([Id]),
    CONSTRAINT [FK_GrievanceActivityLog_FromStateId]
        FOREIGN KEY ([FromStateId])            REFERENCES [GRV].[GrievanceWorkflowState]       ([Id]),
    CONSTRAINT [FK_GrievanceActivityLog_ToStateId]
        FOREIGN KEY ([ToStateId])              REFERENCES [GRV].[GrievanceWorkflowState]       ([Id]),
    CONSTRAINT [FK_GrievanceActivityLog_Transition_States]
        FOREIGN KEY ([TransitionId], [FromStateId], [ToStateId]) REFERENCES [GRV].[GrievanceWorkflowTransition] ([Id], [FromStateId], [ToStateId]),
    CONSTRAINT [FK_GrievanceActivityLog_ActionBy]
        FOREIGN KEY ([ActionByUserId])         REFERENCES [CORE].[UserMaster]                  ([Id]),
    CONSTRAINT [FK_GrievanceActivityLog_AssignedTo]
        FOREIGN KEY ([AssignedToUserId])       REFERENCES [CORE].[UserMaster]                  ([Id])
) ON [PRIMARY];
GO

CREATE INDEX [IX_GrievanceActivityLog_GrievanceId] ON [GRV].[GrievanceActivityLog] ([GrievanceApplicationId]); -- full timeline per grievance
CREATE INDEX [IX_GrievanceActivityLog_ActionBy]    ON [GRV].[GrievanceActivityLog] ([ActionByUserId]);         -- actions per staff member
GO


/* ===========================
   [GRV].[GrievanceDeptForwarding]

   PURPOSE:
     Tracks forwarding of a complaint to one or more departments simultaneously.
     One row per department per forwarding action.
     The parent GrievanceApplication row remains the single master complaint.

   KEY DESIGN DECISIONS:
     - ActivityLogId: links to the GrievanceActivityLog entry that created
       this forwarding (the transition where CanForwardToDept = 1).
     - ForwardingStatus: tracks each department's progress independently.
       PENDING -> IN_PROGRESS -> RESOLVED. The overall complaint status
       is controlled separately by the staff on GrievanceApplication.
     - AssignedToUserId: the staff member within the forwarded dept who
       is handling their part. NULL until the dept assigns someone.
     - Remark: the department's resolution note when they mark their
       part as RESOLVED.
     - MarkedForDeletion / MarkedForDeletionDate: flags record for permanent deletion.
     - IsActive: soft delete flag.
=========================== */
CREATE TABLE [GRV].[GrievanceDeptForwarding] (
    [Id]                     INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    [GrievanceApplicationId] INT          NOT NULL,

    -- The activity log entry that triggered this forwarding.
    [ActivityLogId]          BIGINT       NOT NULL,

    -- The department this complaint was forwarded to.
    [ForwardedToDeptId]      INT          NOT NULL,

    -- Staff within the forwarded dept. NULL until dept assigns someone.
    [AssignedToUserId]       INT          NULL,

    -- Independent status for this department's task.
    [ForwardingStatus]       VARCHAR(20)  NOT NULL CONSTRAINT [DF_GrievanceDeptForwarding_ForwardingStatus] DEFAULT ('PENDING'),

    -- Resolution note entered by the department when marking their part resolved.
    [Remark]                 NVARCHAR(2000) NULL,

    [ForwardedAt]            DATETIME NOT NULL CONSTRAINT [DF_GrievanceDeptForwarding_ForwardedAt] DEFAULT (GETDATE()),
    [ResolvedAt]             DATETIME NULL,  -- set when ForwardingStatus -> RESOLVED
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_GrievanceDeptForwarding_IsActive] DEFAULT (1),

    [MarkedForDeletion]      BIT NOT NULL CONSTRAINT [DF_GrievanceDeptForwarding_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]  DATETIME NULL,
    [CreatedBy]              INT NULL,
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_GrievanceDeptForwarding_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]              INT NULL,
    [UpdatedDate]            DATETIME NULL,

    CONSTRAINT [PK_GrievanceDeptForwarding] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GrievanceDeptForwarding_ActivityLog_Department]
        UNIQUE ([ActivityLogId], [ForwardedToDeptId]),
    CONSTRAINT [CK_GrievanceDeptForwarding_Status]
        CHECK ([ForwardingStatus] IN ('PENDING','IN_PROGRESS','RESOLVED')),

    CONSTRAINT [FK_GrievanceDeptForwarding_GrievanceId]
        FOREIGN KEY ([GrievanceApplicationId]) REFERENCES [GRV].[GrievanceApplication]  ([Id]),
    CONSTRAINT [FK_GrievanceDeptForwarding_ActivityLogId]
        FOREIGN KEY ([ActivityLogId])          REFERENCES [GRV].[GrievanceActivityLog]   ([Id]),
    CONSTRAINT [FK_GrievanceDeptForwarding_DeptId]
        FOREIGN KEY ([ForwardedToDeptId])      REFERENCES [GRV].[GrievanceDepartmentMaster] ([Id]),
    CONSTRAINT [FK_GrievanceDeptForwarding_AssignedTo]
        FOREIGN KEY ([AssignedToUserId])       REFERENCES [CORE].[UserMaster]            ([Id])
) ON [PRIMARY];
GO

CREATE INDEX [IX_GrievanceDeptForwarding_GrievanceId] ON [GRV].[GrievanceDeptForwarding] ([GrievanceApplicationId]); -- all forwardings per complaint
CREATE INDEX [IX_GrievanceDeptForwarding_DeptId]      ON [GRV].[GrievanceDeptForwarding] ([ForwardedToDeptId]);      -- dept inbox
CREATE INDEX [IX_GrievanceDeptForwarding_AssignedTo]  ON [GRV].[GrievanceDeptForwarding] ([AssignedToUserId]);       -- staff work queue
GO


/* ===========================
   [GRV].[GrievanceEscalation]

   PURPOSE:
     Provides an independent governance and escalation channel for elected 
     representatives (Ward Corporators) and administrative observers (Zonal Officers / 
     Assistant Commissioners) to poke/escalate citizen complaints without disturbing 
     the core complaint workflow.

   KEY DESIGN DECISIONS:
     - GrievanceApplicationId: Links to target complaint (ON DELETE CASCADE).
     - ZoneId / WardId: Captured for zonal/ward level filtering and access control.
     - EscalatedByUserId -> [CORE].[UserMaster]: The observer who initiated the escalation.
     - Priority: NORMAL, HIGH, URGENT (governed by CK constraint).
     - EscalationStatus: PENDING, ACKNOWLEDGED, RESOLVED, REJECTED, CLOSED.
     - TargetDepartmentId / TargetAssignedToUserId: Snapshot of department & staff holding the complaint at the time of poke.
     - StaffResponse / RespondedByUserId / RespondedAt: Formal response back to representative.
     - Soft delete & permanent deletion support via BaseEntity standard columns (IsActive, MarkedForDeletion).
=========================== */
CREATE TABLE [GRV].[GrievanceEscalation] (
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    -- Target Grievance & Geographic Hierarchy
    [GrievanceApplicationId]    INT            NOT NULL,
    [ZoneId]                    INT            NULL,
    [WardId]                    INT            NULL,

    -- Observer / Representative Information
    [EscalatedByUserId]         INT            NOT NULL,
    [Reason]                    NVARCHAR(1000) NOT NULL,
    [Priority]                  NVARCHAR(20)   NOT NULL CONSTRAINT [DF_GrievanceEscalation_Priority] DEFAULT ('NORMAL'),

    -- Status Lifecycle: PENDING, ACKNOWLEDGED, RESOLVED, REJECTED, CLOSED
    [EscalationStatus]          NVARCHAR(30)   NOT NULL CONSTRAINT [DF_GrievanceEscalation_EscalationStatus] DEFAULT ('PENDING'),

    -- Snapshot of Target Department & Staff when Escalated
    [TargetDepartmentId]        INT            NULL,
    [TargetAssignedToUserId]    INT            NULL,

    -- Official Staff Response back to the Observer
    [StaffResponse]             NVARCHAR(2000) NULL,
    [RespondedByUserId]         INT            NULL,
    [RespondedAt]               DATETIME       NULL,

    -- Audit & Soft Delete Columns (BaseEntity)
    [MarkedForDeletion]         BIT            NOT NULL CONSTRAINT [DF_GrievanceEscalation_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME       NULL,
    [IsActive]                  BIT            NOT NULL CONSTRAINT [DF_GrievanceEscalation_IsActive] DEFAULT (1),
    [CreatedBy]                 INT            NULL,
    [CreatedDate]               DATETIME       NOT NULL CONSTRAINT [DF_GrievanceEscalation_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]                 INT            NULL,
    [UpdatedDate]               DATETIME       NULL,

    -- Primary Key
    CONSTRAINT [PK_GrievanceEscalation] PRIMARY KEY CLUSTERED ([Id] ASC),

    -- Check Constraints
    CONSTRAINT [CK_GrievanceEscalation_Priority] 
        CHECK ([Priority] IN ('NORMAL', 'HIGH', 'URGENT')),
    CONSTRAINT [CK_GrievanceEscalation_Status] 
        CHECK ([EscalationStatus] IN ('PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED', 'CLOSED')),
    CONSTRAINT [CK_GrievanceEscalation_ZoneWard]
        CHECK ([WardId] IS NULL OR [ZoneId] IS NOT NULL),

    -- Foreign Keys
    CONSTRAINT [FK_GrievanceEscalation_GrievanceApplication] 
        FOREIGN KEY ([GrievanceApplicationId]) 
        REFERENCES [GRV].[GrievanceApplication] ([Id]) 
        ON DELETE CASCADE,

    CONSTRAINT [FK_GrievanceEscalation_ZoneMaster] 
        FOREIGN KEY ([ZoneId]) 
        REFERENCES [PTIS].[ZoneMaster] ([Id]),

    CONSTRAINT [FK_GrievanceEscalation_Ward_Zone] 
        FOREIGN KEY ([WardId], [ZoneId]) 
        REFERENCES [PTIS].[WardMaster] ([Id], [ZoneId]),

    CONSTRAINT [FK_GrievanceEscalation_EscalatedByUser] 
        FOREIGN KEY ([EscalatedByUserId]) 
        REFERENCES [CORE].[UserMaster] ([Id]),

    CONSTRAINT [FK_GrievanceEscalation_TargetDept] 
        FOREIGN KEY ([TargetDepartmentId]) 
        REFERENCES [GRV].[GrievanceDepartmentMaster] ([Id]),

    CONSTRAINT [FK_GrievanceEscalation_TargetStaff] 
        FOREIGN KEY ([TargetAssignedToUserId]) 
        REFERENCES [CORE].[UserMaster] ([Id]),

    CONSTRAINT [FK_GrievanceEscalation_RespondedByUser] 
        FOREIGN KEY ([RespondedByUserId]) 
        REFERENCES [CORE].[UserMaster] ([Id])
) ON [PRIMARY];
GO

-- Performance Indexes for Filtering & Dashboard Queries
CREATE INDEX [IX_GrievanceEscalation_GrievanceId] 
    ON [GRV].[GrievanceEscalation] ([GrievanceApplicationId]);

CREATE INDEX [IX_GrievanceEscalation_ZoneId_Status] 
    ON [GRV].[GrievanceEscalation] ([ZoneId], [EscalationStatus]);

CREATE INDEX [IX_GrievanceEscalation_WardId_Status] 
    ON [GRV].[GrievanceEscalation] ([WardId], [EscalationStatus]);

CREATE INDEX [IX_GrievanceEscalation_EscalatedBy] 
    ON [GRV].[GrievanceEscalation] ([EscalatedByUserId]);

CREATE INDEX [IX_GrievanceEscalation_TargetStaff] 
    ON [GRV].[GrievanceEscalation] ([TargetAssignedToUserId], [EscalationStatus]);
GO


/* ===========================
   [GRV].[GrievancePhotoType]
=========================== */
CREATE TABLE [GRV].[GrievancePhotoType](
	[Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,   -- Surrogate PK | e.g. 1
	[PhotoTypeCode] VARCHAR(50)        NOT NULL,                      -- Machine code, stable | e.g. 'FRONT'
	[PhotoTypeName] NVARCHAR(200)      NOT NULL,                      -- UI label | e.g. 'Front View'
	[Description]   NVARCHAR(500)      NULL,                          -- Tooltip / help text | e.g. 'Front facade of the property'
	[DisplayOrder]  INT                NULL,                          -- UI dropdown sort | e.g. 1
	[PhotoScope]    VARCHAR(30)        NOT NULL
		CONSTRAINT [CK_GrievancePhotoType_PhotoScope] CHECK ([PhotoScope] IN ('CITIZEN', 'STAFF', 'BOTH')),
	[IsActive]      BIT                NOT NULL                       -- Soft hide flag | e.g. 1
		CONSTRAINT [DF_GrievancePhotoType_IsActive] DEFAULT (1),
	[CreatedBy]     INT                NULL,                          -- Audit user | e.g. 42
	[CreatedDate]   DATETIME           NOT NULL                       -- Insert ts | e.g. 2026-05-28
		CONSTRAINT [DF_GrievancePhotoType_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy]     INT                NULL,                          -- Audit user | e.g. NULL
	[UpdatedDate]   DATETIME           NULL,                          -- Update ts | e.g. NULL
	CONSTRAINT [PK_GrievancePhotoType]  PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_GrievancePhotoType_Code] UNIQUE ([PhotoTypeCode])
);
GO

CREATE NONCLUSTERED INDEX [IX_GrievancePhotoType_IsActive]
	ON [GRV].[GrievancePhotoType]([IsActive]) WHERE [IsActive] = 1;
GO

/* ===========================
   [GRV].[GrievancePhoto]
=========================== */
CREATE TABLE [GRV].[GrievancePhoto] (
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,  -- Surrogate PK | e.g. 1001
    [GrievanceApplicationId] INT              NOT NULL,                       -- FK -> GRV.GrievanceApplication.Id | e.g. 50001
    [PhotoTypeId]            INT              NOT NULL,                       -- FK -> GRV.GrievancePhotoType.Id | e.g. 1
    [DocumentBindingId]      INT              NULL,                           -- FK -> CORE.DocumentBinding.Id | e.g. 7701
    [IsLatest]               BIT              NOT NULL                        -- 1=current, 0=superseded
        CONSTRAINT [DF_GrievancePhoto_IsLatest] DEFAULT (1),
    [Remarks]                NVARCHAR(500)    NULL,                           -- Staff/citizen note for the photo
    [IsActive]               BIT              NOT NULL                        -- Active status flag | 1 = active, 0 = inactive
        CONSTRAINT [DF_GrievancePhoto_IsActive] DEFAULT (1),
    [MarkedForDeletion]      BIT              NOT NULL                        -- Two-phase delete flag | e.g. 0
        CONSTRAINT [DF_GrievancePhoto_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]  DATETIME         NULL,                           -- Flagged-for-delete ts
    [CreatedBy]              INT              NULL,                           -- Audit user | e.g. 42
    [CreatedDate]            DATETIME         NOT NULL                        -- Insert ts | e.g. 2026-05-28
        CONSTRAINT [DF_GrievancePhoto_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]              INT              NULL,                           -- Audit user | e.g. NULL
    [UpdatedDate]            DATETIME         NULL,                           -- Update ts | e.g. NULL

    CONSTRAINT [PK_GrievancePhoto] PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [FK_GrievancePhoto_GrievanceApplication]
        FOREIGN KEY ([GrievanceApplicationId]) REFERENCES [GRV].[GrievanceApplication] ([Id]),

    CONSTRAINT [FK_GrievancePhoto_PhotoType]
        FOREIGN KEY ([PhotoTypeId]) REFERENCES [GRV].[GrievancePhotoType] ([Id]),

    CONSTRAINT [FK_GrievancePhoto_DocumentBinding]
        FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding] ([Id])
);
GO

CREATE NONCLUSTERED INDEX [IX_GrievancePhoto_GrievanceApplicationId]
    ON [GRV].[GrievancePhoto]([GrievanceApplicationId]);
GO