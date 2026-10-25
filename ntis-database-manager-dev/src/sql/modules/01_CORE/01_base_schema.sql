SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ===========================
   [CORE].[MultilingualResource]
 =========================== */
CREATE TABLE [CORE].[MultilingualResource](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[Resource] [nvarchar](256) NOT NULL,
	[Key] [nvarchar](256) NOT NULL,
	[en_US] [nvarchar](500) NOT NULL,
	[hi_IN] [nvarchar](500) NOT NULL,
	[mr_IN] [nvarchar](500) NOT NULL,
	[IsGenerated] [bit] NOT NULL ,--- Default value will be set from application code while inserting/updating records
	[IsActive]              BIT NOT NULL CONSTRAINT [DF_MultilingualResource_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_MultilingualResource_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,
    CONSTRAINT [PK_MultilingualResource] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT UQ_MultilingualResource_Resource_Key  UNIQUE ([Resource], [Key])
)ON [PRIMARY]
GO


/* ===========================
   [CORE].[DepartmentMaster]
 =========================== */
CREATE TABLE [CORE].[DepartmentMaster](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentCode]        VARCHAR(50) NOT NULL,
    [DepartmentName]        VARCHAR(100) NOT NULL,
    [DepartmentNameLocal]   NVARCHAR(150) NULL,
    [DepartmentIcon]        VARCHAR(50) NULL,
    [DepartmentDescription] NVARCHAR(200) NULL,
    [IsProtected]           BIT NOT NULL CONSTRAINT [DF_DepartmentMaster_IsProtected] DEFAULT (0),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_DepartmentMaster_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_DepartmentMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,

    CONSTRAINT [PK_DepartmentMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_DepartmentMaster_DepartmentCode] UNIQUE ([DepartmentCode]),
    CONSTRAINT [UQ_DepartmentMaster_DepartmentName] UNIQUE ([DepartmentName])
);
GO
/* ===========================
   [CORE].[ModuleMaster]
=========================== */
CREATE TABLE [CORE].[ModuleMaster](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentId]      INT NOT NULL,
    [ModuleCode]        NVARCHAR(50) NOT NULL,
    [ModuleName]        NVARCHAR(50) NOT NULL,
    [ModuleNameLocal]   NVARCHAR(50) NULL,
    [ModuleIcon]        NVARCHAR(50) NULL,
    [ModuleLabel]       NVARCHAR(100) NULL,
    [ModuleDescription] NVARCHAR(100) NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_ModuleMaster_IsActive]    DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ModuleMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,

    CONSTRAINT [PK_ModuleMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ModuleMaster_ModuleCode] UNIQUE ([ModuleCode]),
    CONSTRAINT [UQ_ModuleMaster_ModuleName] UNIQUE ([ModuleName]),
    CONSTRAINT [UQ_ModuleMaster_DepartmentId_Id] UNIQUE ([DepartmentId], [Id])
);
GO

    ALTER TABLE [CORE].[ModuleMaster] WITH CHECK
    ADD CONSTRAINT [FK_ModuleMaster_DepartmentId]
    FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]);
    GO

    ALTER TABLE [CORE].[ModuleMaster] CHECK CONSTRAINT [FK_ModuleMaster_DepartmentId];
    GO

CREATE NONCLUSTERED INDEX [IX_ModuleMaster_DepartmentId]
    ON [CORE].[ModuleMaster] ([DepartmentId]);
GO

/* ===========================
   [CORE].[DepartmentLicenceDetails]
  =========================== */
CREATE TABLE [CORE].[DepartmentLicenceDetails](
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentId]         INT NOT NULL,
    [LicenceStartDate]     DATE NULL,
    [LicenceEndDate]       DATE NULL,
    [LicenceDuration]      VARCHAR(50) NULL,
    [IsActive]             BIT NOT NULL CONSTRAINT [DF_DepartmentLicenceDetails_IsActive] DEFAULT (1),
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_DepartmentLicenceDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,

    CONSTRAINT [PK_DepartmentLicenceDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_DepartmentLicenceDetails_DepartmentMaster]
        FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]),
    CONSTRAINT [CK_DepartmentLicenceDetails_DateRange]
        CHECK ([LicenceStartDate] IS NULL OR [LicenceEndDate] IS NULL OR [LicenceEndDate] >= [LicenceStartDate])
);
GO

CREATE NONCLUSTERED INDEX [IX_DepartmentLicenceDetails_DepartmentId]
ON [CORE].[DepartmentLicenceDetails] ([DepartmentId]);
GO

/* ===========================
   [CORE].[DesignationMaster]
 =========================== */
CREATE TABLE [CORE].[DesignationMaster](
    [Id]                     INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DesignationCode]       VARCHAR(50) NOT NULL,
    [DesignationName]       VARCHAR(100) NOT NULL,
    [DesignationLocal]      NVARCHAR(150) NULL,
    [DesignationDescription] NVARCHAR(250) NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_DesignationMaster_IsActive] DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_DesignationMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,

    CONSTRAINT [PK_DesignationMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_DesignationMaster_DesignationCode] UNIQUE ([DesignationCode]),
    CONSTRAINT [UQ_DesignationMaster_DesignationName] UNIQUE ([DesignationName])
);
GO

/* ===========================
   [CORE].[ScreenGroupMaster]
  =========================== */
CREATE TABLE [CORE].[ScreenGroupMaster](
    [Id]                   INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ScreenGroupCode]      VARCHAR(50) NOT NULL,
    [ScreenGroupName]      VARCHAR(100) NOT NULL,
    [ScreenGroupNameLocal] NVARCHAR(150) NULL,
    [ScreenGroupIcon]      VARCHAR(50) NULL,
    [DisplayOrder]         INT NULL,
    [IsActive]             BIT NOT NULL CONSTRAINT [DF_ScreenGroupMaster_IsActive] DEFAULT (1),
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_ScreenGroupMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,

    CONSTRAINT [PK_ScreenGroupMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ScreenGroupMaster_ScreenGroupCode] UNIQUE ([ScreenGroupCode])
);
GO

/* ===========================
   [CORE].[BankMaster]
=========================== */
CREATE TABLE [CORE].[BankMaster](
    [Id]          INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [BankCode]    NVARCHAR(50) NOT NULL,
    [BankName]    NVARCHAR(200) NOT NULL,
    [BranchName]  NVARCHAR(200) NULL,
    [IFSCCode]    VARCHAR(11) NULL,
    [Address]     NVARCHAR(500) NULL,
    [City]        NVARCHAR(50) NULL,
    [State]       NVARCHAR(50) NULL,
    [Pincode]     NVARCHAR(10) NULL,
    [IsActive]    BIT NOT NULL CONSTRAINT [DF_BankMaster_IsActive] DEFAULT (1),
    [CreatedBy]   INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_BankMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]   INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_BankMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_BankMaster_BankCode] UNIQUE ([BankCode]),
    CONSTRAINT [CK_BankMaster_IFSC_Len] CHECK ([IFSCCode] IS NULL OR LEN([IFSCCode]) = 11)
);
GO

/* ===========================
   [CORE].[OfficeMaster]
 =========================== */
CREATE TABLE [CORE].[OfficeMaster](
    [Id]                   INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [OfficeCode]           NVARCHAR(20) NOT NULL,
    [OfficeName]           NVARCHAR(100) NOT NULL,
    [Type]                 NVARCHAR(20) NULL,
    [Address]              NVARCHAR(250) NULL,
    [City]                 NVARCHAR(50) NULL,
    [Pincode]              NVARCHAR(10) NULL,
    [Phone]                VARCHAR(13) NULL,
    [EmailId]              NVARCHAR(100) NULL,
    [OfficeIncharge]       INT NULL,
    [DesignationMasterId]  INT NULL,
    [EstablishedDate]      DATETIME NULL,
    [IsActive]             BIT NOT NULL CONSTRAINT [DF_OfficeMaster_IsActive] DEFAULT (1),
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_OfficeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,

    CONSTRAINT [PK_OfficeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_OfficeMaster_OfficeCode] UNIQUE ([OfficeCode])
);
GO

CREATE NONCLUSTERED INDEX [IX_OfficeMaster_DesignationMasterId]
ON [CORE].[OfficeMaster] ([DesignationMasterId]);
GO

ALTER TABLE [CORE].[OfficeMaster] WITH CHECK
ADD CONSTRAINT [FK_OfficeMaster_DesignationMaster]
FOREIGN KEY ([DesignationMasterId]) REFERENCES [CORE].[DesignationMaster] ([Id]);
GO
ALTER TABLE [CORE].[OfficeMaster] CHECK CONSTRAINT [FK_OfficeMaster_DesignationMaster];
GO

/* ===========================
   [CORE].[PaymentMode]
=========================== */
CREATE TABLE [CORE].[PaymentMode](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [Code]              VARCHAR(50) NOT NULL,
    [PaymentModeName]   VARCHAR(100) NOT NULL,
    [Type]              VARCHAR(50) NULL,
    [Category]          VARCHAR(50) NULL,
    [Description]       NVARCHAR(200) NULL,
    [ChargeType]        VARCHAR(50) NULL,
    [TransactionCharge] INT NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_PaymentMode_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_PaymentMode_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,

    CONSTRAINT [PK_PaymentMode] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_PaymentMode_Code] UNIQUE ([Code]),
    CONSTRAINT [CK_PaymentMode_TransactionCharge]
        CHECK ([TransactionCharge] IS NULL OR [TransactionCharge] >= 0)
);
GO

/* ===========================
   [CORE].[ServiceCategoryMaster]
=========================== */
CREATE TABLE [CORE].[ServiceCategoryMaster](
    [Id]                 INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ServiceCode]        VARCHAR(50) NOT NULL,
    [ServiceName]        NVARCHAR(200) NOT NULL,
    [DepartmentId]       INT NULL,
    [ServiceType]        VARCHAR(50) NOT NULL,
    [Priority]           VARCHAR(20) NOT NULL,
    [ProcessingTimeDays] INT NOT NULL,
    [Description]        NVARCHAR(500) NULL,
    [IsActive]           BIT NOT NULL CONSTRAINT [DF_ServiceCategoryMaster_IsActive] DEFAULT (1),
    [CreatedBy]          INT NULL,
    [CreatedDate]        DATETIME NOT NULL CONSTRAINT [DF_ServiceCategoryMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]          INT NULL,
    [UpdatedDate]        DATETIME NULL,

    CONSTRAINT [PK_ServiceCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ServiceCategoryMaster_ServiceCode] UNIQUE ([ServiceCode]),
    CONSTRAINT [CK_ServiceCategoryMaster_ProcessingTimeDays] CHECK ([ProcessingTimeDays] >= 0)
);
GO

CREATE NONCLUSTERED INDEX [IX_ServiceCategoryMaster_DepartmentId]
ON [CORE].[ServiceCategoryMaster] ([DepartmentId]);
GO

ALTER TABLE [CORE].[ServiceCategoryMaster] WITH CHECK
ADD CONSTRAINT [FK_ServiceCategoryMaster_DepartmentMaster]
FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]);
GO
ALTER TABLE [CORE].[ServiceCategoryMaster] CHECK CONSTRAINT [FK_ServiceCategoryMaster_DepartmentMaster];
GO

/* ===========================
   [CORE].[UserRoleMaster]
  =========================== */
CREATE TABLE [CORE].[UserRoleMaster](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserRoleName]  NVARCHAR(100) NOT NULL,
    [DepartmentId]  INT NOT NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_UserRoleMaster_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_UserRoleMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,

    CONSTRAINT [PK_UserRoleMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_UserRoleMaster_UserRoleName] UNIQUE ([UserRoleName]),
    CONSTRAINT [FK_UserRoleMaster_DepartmentMaster]
        FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
);
GO

/* ===========================
   [CORE].[YearMaster]
=========================== */
CREATE TABLE [CORE].[YearMaster](
    [Id]          INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [Year]        INT NOT NULL,
    [YearCode]    NVARCHAR(15) NULL,
    [Status]      NVARCHAR(10) NULL,
    [StartDate]   DATETIME NULL,
    [EndDate]     DATETIME NULL,
    [Description] NVARCHAR(500) NULL,
    [IsActive]    BIT NOT NULL CONSTRAINT [DF_YearMaster_IsActive] DEFAULT (0),
    [CreatedBy]   INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_YearMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]   INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_YearMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_YearMaster_Year] UNIQUE ([Year]),
    CONSTRAINT [CK_YearMaster_DateRange]
        CHECK ([StartDate] IS NULL OR [EndDate] IS NULL OR [EndDate] >= [StartDate])
);
GO
CREATE UNIQUE INDEX [UX_YearMaster_OnlyOneActive]
ON [CORE].[YearMaster] ([IsActive])
WHERE [IsActive] = 1;
GO

/* ===========================
   [CORE].[DepartmentYearConfigMaster]
=========================== */
CREATE TABLE [CORE].[DepartmentYearConfigMaster](
    [Id]           INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentId] INT NOT NULL,
    [YearId]       INT NOT NULL,
    [IsActive]     BIT NOT NULL CONSTRAINT DF_DepartmentYearConfigMaster_IsActive DEFAULT(1),
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT DF_DepartmentYearConfigMaster_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,
    CONSTRAINT PK_DepartmentYearConfigMaster PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT UQ_DepartmentYearConfigMaster UNIQUE ([DepartmentId],[YearId]),
    CONSTRAINT FK_DepartmentYearConfigMaster_DepartmentMaster FOREIGN KEY ([DepartmentId])
        REFERENCES [CORE].[DepartmentMaster]([Id]),
    CONSTRAINT FK_DepartmentYearConfig_YearMaster FOREIGN KEY ([YearId])
        REFERENCES [CORE].[YearMaster]([Id])
);
GO

/* ===========================
   [CORE].[EmployeeTypeMaster]
=========================== */
CREATE TABLE [CORE].[EmployeeTypeMaster](
    [Id]    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [EmployeeType]  NVARCHAR(100) NOT NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_EmployeeTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_EmployeeTypeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,
    CONSTRAINT [PK_EmployeeTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_EmployeeTypeMaster_EmployeeType] UNIQUE ([EmployeeType])
);
GO

/* ===========================
   STEP 1: [CORE].[UserMaster]  ← must come FIRST (referenced by FKs below)
=========================== */
CREATE TABLE [CORE].[UserMaster](
    [Id]                  INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserName]            NVARCHAR(100) NOT NULL,
    [FirstName]           NVARCHAR(100) NULL,
	[MiddleName]          NVARCHAR(100) NULL,
	[LastName]            NVARCHAR(100) NULL,
    [UserCode]            NVARCHAR(50) NULL,
    [Address]             NVARCHAR(400) NULL,
    [MobileNo]            varchar(13) NULL,
    [AlternateMobileNo]   varchar(13) NULL,
    [Email]               NVARCHAR(100) NULL,
    [MustChangePassword]  BIT NOT NULL CONSTRAINT [DF_UserMaster_MustChangePassword] DEFAULT (0),
    [Language]            NVARCHAR(50) NULL,
    [IsActive]            BIT NOT NULL  CONSTRAINT [DF_UserMaster_IsActive]           DEFAULT (1),
    [Remark]              NVARCHAR(400) NULL,
    [LockedUntilAt]       DATETIME NULL,
    [FailedLoginCount]    INT NOT NULL  CONSTRAINT [DF_UserMaster_FailedLoginCount]   DEFAULT (0),
    [LastLoginAt]         DATETIME NULL,
    [UserLocked]          BIT NOT NULL  CONSTRAINT [DF_UserMaster_UserLocked]         DEFAULT (0),
    [EmployeeTypeId]      INT NOT NULL,
    [PasswordHash]        NVARCHAR(255) NULL,
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_UserMaster_CreatedDate]    DEFAULT (GETDATE()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,
    [MarkedForDeletion]   BIT NOT NULL  CONSTRAINT [DF_UserMaster_MarkedForDeletion]           DEFAULT (0),
	[MarkedForDeletionDate] DATETIME NULL,
    CONSTRAINT [PK_UserMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_UserMaster_UserName]           UNIQUE ([UserName]),
    CONSTRAINT [FK_UserMaster_EmployeeTypeMaster]
        FOREIGN KEY ([EmployeeTypeId]) REFERENCES [CORE].[EmployeeTypeMaster] ([Id])
);
GO

CREATE NONCLUSTERED INDEX [IX_UserMaster_EmployeeTypeId]
    ON [CORE].[UserMaster] ([EmployeeTypeId]);
GO

/* ===========================
   STEP 2: [CORE].[UserDepartmentAllocation]  ← depends on UserMaster + DepartmentMaster
=========================== */
CREATE TABLE [CORE].[UserDepartmentAllocation](
    [Id]           INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserId]       INT NOT NULL,
    [DepartmentId] INT NOT NULL,
    [IsActive]     BIT NOT NULL CONSTRAINT [DF_UserDepartmentAllocation_IsActive]    DEFAULT (1),
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT [DF_UserDepartmentAllocation_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,

    CONSTRAINT [PK_UserDepartmentAllocation] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_UserDepartmentAllocation_User_Department] UNIQUE ([UserId], [DepartmentId]),
    CONSTRAINT [FK_UserDepartmentAllocation_DepartmentMaster]
        FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
);
GO

-- Add FK after both tables exist
ALTER TABLE [CORE].[UserDepartmentAllocation] WITH CHECK
ADD CONSTRAINT [FK_UserDepartmentAllocation_UserMaster]
FOREIGN KEY ([UserId]) REFERENCES [CORE].[UserMaster] ([Id]);
GO
ALTER TABLE [CORE].[UserDepartmentAllocation] CHECK CONSTRAINT [FK_UserDepartmentAllocation_UserMaster];
GO


CREATE NONCLUSTERED INDEX [IX_UserDepartmentAllocation_DepartmentId]
    ON [CORE].[UserDepartmentAllocation] ([DepartmentId]);
GO

/* ===========================
   STEP 3: [CORE].[UserModuleAllocation]  ← depends on UserMaster + DepartmentMaster + ModuleMaster
=========================== */
CREATE TABLE [CORE].[UserModuleAllocation](
    [Id]           INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserId]       INT NOT NULL,
    [DepartmentId] INT NOT NULL,
    [ModuleId]     INT NOT NULL,
    [IsActive]     BIT NOT NULL CONSTRAINT [DF_UserModuleAllocation_IsActive]    DEFAULT (1),
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT [DF_UserModuleAllocation_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,

    CONSTRAINT [PK_UserModuleAllocation] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_UserModuleAllocation_User_Department_Module] UNIQUE ([UserId], [DepartmentId], [ModuleId]),
    CONSTRAINT [FK_UserModuleAllocation_UserMaster]
        FOREIGN KEY ([UserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [FK_UserModuleAllocation_DepartmentMaster]
        FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
    -- Removed single-column FK to ModuleMaster(Id); composite FK will be added later
);
GO


CREATE NONCLUSTERED INDEX [IX_UserModuleAllocation_DepartmentId]
    ON [CORE].[UserModuleAllocation] ([DepartmentId]);
GO
CREATE NONCLUSTERED INDEX [IX_UserModuleAllocation_ModuleId]
    ON [CORE].[UserModuleAllocation] ([ModuleId]);
GO

/* ===========================
   STEP 4: [CORE].[UserRoleAllocation]  ← depends on UserMaster + DepartmentMaster + UserRoleMaster
=========================== */
CREATE TABLE [CORE].[UserRoleAllocation](
    
    [Id]           INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserId]       INT NOT NULL,
    [DepartmentId] INT NOT NULL,
    [UserRoleId]   INT NOT NULL,
    [IsActive]     BIT NOT NULL CONSTRAINT [DF_UserRoleAllocation_IsActive]    DEFAULT (1),
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT [DF_UserRoleAllocation_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,

    CONSTRAINT [PK_UserRoleAllocation] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_UserRoleAllocation_User_Department_Role] UNIQUE ([UserId], [DepartmentId], [UserRoleId]),
    CONSTRAINT [FK_UserRoleAllocation_UserMaster]
        FOREIGN KEY ([UserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [FK_UserRoleAllocation_DepartmentMaster]
        FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]),
    CONSTRAINT [FK_UserRoleAllocation_UserRoleMaster]
        FOREIGN KEY ([UserRoleId]) REFERENCES [CORE].[UserRoleMaster] ([Id])
);
GO

CREATE NONCLUSTERED INDEX [IX_UserRoleAllocation_DepartmentId]
    ON [CORE].[UserRoleAllocation] ([DepartmentId]);
GO
CREATE NONCLUSTERED INDEX [IX_UserRoleAllocation_UserRoleId]
    ON [CORE].[UserRoleAllocation] ([UserRoleId]);
GO

/* ===========================
   [CORE].[Document]
=========================== */

/* ============================================================================
   [CORE].[Document]
   Generic, module-agnostic document metadata table.
   Module-specific linkage (Property, WaterConnection, etc.) is handled via
   [CORE].[DocumentBinding]. This table holds ONLY file metadata + lifecycle.

   Naming/typing rules followed:
     - VARCHAR  : codes, mime/extensions, checksums, English-only values
     - NVARCHAR : user-entered text (titles, descriptions, file names, tags)
                  AND file paths (StoragePath/ThumbnailPath) which may contain
                  non-ASCII characters depending on OS/filesystem
     - No NVARCHAR(MAX) / VARCHAR(MAX); bounded lengths only
     - RowVersion: kept here because document metadata (title, scan status,
                   version bumps, soft-delete) is realistically edited by
                   concurrent flows.
============================================================================ */
CREATE TABLE [CORE].[Document](

    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
        -- Internal surrogate primary key. Used for FK relationships only.
        -- Example: 1001

    [DocumentGuid] UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT [DF_Document_DocumentGuid] DEFAULT (NEWSEQUENTIALID())
        CONSTRAINT [UQ_Document_DocumentGuid] UNIQUE,
        -- Public identifier exposed via APIs (never expose internal Id).
        -- API will use this id.
        -- Example: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890'

    [DepartmentId] INT NULL,
        -- FK to CORE.DepartmentMaster(Id). Identifies which department this document belongs to.
        -- Required for correct filtering when combined with DepartmentEntityId.
        -- Example: 3   (DepartmentMaster.Id for 'PTIS')

    [DepartmentEntityId] INT NULL,
        -- Department-specific primary business id this document logically belongs to.
        -- The value's meaning depends on the owning department (identified by DepartmentId):
        --   When DepartmentId=PTIS  -> PropertyId
        --   When DepartmentId=WTIS  -> ConsumerId
        --   When DepartmentId=ASSET -> AssetId  (and so on)
        -- Nullable for cases where no department-level entity applies yet.
        -- MUST be filtered together with DepartmentId to prevent ID collision across departments.
        -- Authoritative module/auth linkage still lives in CORE.DocumentBinding;
        -- this column pair is a convenience back-pointer for quick filtering.
        -- Example: DepartmentId=3, DepartmentEntityId=1001  (PTIS PropertyId)

    [FileName] NVARCHAR(500) NOT NULL,
        -- Stored/normalized file name on disk (after sanitization, GUID rename, etc.).
        -- May contain non-ASCII if user kept original characters.
        -- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf'

    [OriginalFileName] NVARCHAR(500) NOT NULL,
        -- File name as uploaded by the user. Shown back in UI as-is.
        -- Example: 'Owner Aadhaar Proof.pdf', 'मालमत्ता_प्रमाणपत्र.pdf'

    [FileExtension] VARCHAR(50) NOT NULL,
        -- Lowercased extension without leading dot. ASCII-only.
        -- Example: 'pdf', 'jpg', 'docx'

    [MimeType] VARCHAR(200) NOT NULL,
        -- IANA media type detected/declared at upload.
        -- Example: 'application/pdf', 'image/jpeg'

    [FileSizeBytes] BIGINT NOT NULL
        CONSTRAINT [CK_Document_FileSizeBytes] CHECK ([FileSizeBytes] >= 0),
        -- Size of stored file in bytes. Used for quota/limits/UI display.
        -- Example: 245678

    [StorageProvider] VARCHAR(50) NOT NULL,
        -- Backend where the binary lives. Only 'FOLDER' for now;
        -- future values like 'AWS_S3', 'AZURE_BLOB' will reuse this column.
        -- Example: 'FOLDER'

    [StoragePath] NVARCHAR(1000) NOT NULL,
        -- Relative path under the configured root for the chosen provider.
        -- this will have relative path of the folder.
        -- Example: 'ptis/property/2026/04/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf'

    [ThumbnailPath] NVARCHAR(1000) NULL,
        -- Relative path to generated thumbnail. NULL until thumbnail generation
        -- is implemented (future scope).
        -- Example: 'ptis/property/2026/04/thumb/a1b2c3d4-...-thumb.jpg'

    [ChecksumSha256] VARCHAR(64) NULL
        CONSTRAINT [CK_Document_ChecksumSha256_Length]
            CHECK ([ChecksumSha256] IS NULL OR LEN([ChecksumSha256]) = 64),
        -- SHA-256 hex digest of the stored file. Used for integrity + dedupe.
        -- Kept as VARCHAR(64) (hex) per readability over BINARY(32).
        -- Example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

    [ScanStatusCode] VARCHAR(50) NULL,
        -- Status of virus/malware scan. Nullable for now (scan is future scope).
        -- Future values: 'PENDING', 'CLEAN', 'INFECTED', 'FAILED'.
        -- Example: NULL  (today)  /  'CLEAN'  (future)

    [ScanCompletedDate] DATETIME NULL,
        -- When the scan finished. NULL until scanning is implemented.
        -- Example: '2026-04-20 18:32:15'

    [ScanDetails] NVARCHAR(4000) NULL,
        -- Free-text scanner output (engine name, signature, error message).
        -- Example: 'ClamAV 1.2.0 - No threats detected'

    [UploadStatusCode] VARCHAR(50) NOT NULL,
        -- Lifecycle of the upload itself.
        -- Values: 'PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'ACTIVE'.
        -- Example: 'COMPLETED'

    [DocumentTitle] NVARCHAR(500) NULL,
        -- Human-friendly title shown in UI. May be set by uploader.
        -- Example: 'Owner Aadhaar - Mr. Sharma'

    [Description] NVARCHAR(2000) NULL,
        -- Optional longer description / remarks.
        -- Example: 'Aadhaar copy collected during 2026 property survey'

    [DocumentType] NVARCHAR(100) NULL,
        -- High-level document type. Free text / enum for now
        -- (confirmed master table is future scope).
        -- Example: 'Certificate', 'Invoice', 'Contract', 'Report'

    [DocumentCategory] NVARCHAR(100) NULL,
        -- Optional finer grouping within a DocumentType.
        -- Example: 'OwnershipProof', 'IdentityProof', 'TaxReceipt'

    [Tags] NVARCHAR(2000) NULL,
        -- Comma-separated user tags for search/filter. NVARCHAR (multilingual).
        -- Example: 'aadhaar,owner,kyc,2026'

    [Language] VARCHAR(10) NULL,
        -- BCP-47 language code of document content.
        -- Example: 'en', 'mr', 'hi-IN'

    [Version] INT NOT NULL
        CONSTRAINT [CK_Document_Version_Positive] CHECK ([Version] > 0),
        -- Version number of this document row. Starts at 1.
        -- Example: 1, 2, 3

    [ParentDocumentId] INT NULL,
        -- Self-FK to original document when this row is a newer version.
        -- NULL for the first/original version.
        -- Example: NULL (v1)  /  1001 (v2 of doc 1001)

    [IsLatestVersion] BIT NOT NULL
        CONSTRAINT [DF_Document_IsLatestVersion] DEFAULT (1),
        -- 1 if this row is the current/latest version in its version chain.
        -- Example: 1

    [IsPublic] BIT NOT NULL
        CONSTRAINT [DF_Document_IsPublic] DEFAULT (0),
        -- Future-use access flag. 1 = anyone can read; 0 = governed by binding/auth.
        -- this may need in future.
        -- Example: 0

    [InheritPermissions] BIT NOT NULL
        CONSTRAINT [DF_Document_InheritPermissions] DEFAULT (1),
        -- Future-use. 1 = inherit permissions from parent entity (via DocumentBinding).
        -- this may need in future.
        -- Example: 1

    [ConfidentialityLevel] VARCHAR(50) NULL,
        -- Future-use classification label.
        -- Values (future): 'Public', 'Internal', 'Confidential', 'Secret'.
        -- Example: NULL today  /  'Internal' later

    [PageCount] INT NULL
        CONSTRAINT [CK_Document_PageCount_NonNegative] CHECK ([PageCount] >= 0),
        -- Number of pages (for PDFs, multi-page TIFFs, etc.).
        -- Example: 4

    [SearchableText] NVARCHAR(4000) NULL,
        -- Extracted text for search indexing (truncated to 4000).
        -- Populated by OCR/extraction pipeline (future scope).
        -- Example: 'Property Tax Receipt FY 2025-26 Owner: ...'

    [ExtractionStatus] VARCHAR(50) NULL,
        -- Status of text-extraction pipeline.
        -- Values: 'PENDING', 'COMPLETED', 'FAILED', 'NOT_APPLICABLE'.
        -- Example: NULL today  /  'COMPLETED' later

    [EncryptionKeyId] VARCHAR(100) NULL,
        -- Identifier of the KMS/HSM key used to encrypt the file at rest.
        -- NULL when IsEncrypted = 0.
        -- Example: 'kms-key-ptis-prod-001'

    [IsEncrypted] BIT NOT NULL
        CONSTRAINT [DF_Document_IsEncrypted] DEFAULT (0),
        -- 1 if the stored file is encrypted at rest.
        -- Example: 0

    [DownloadCount] INT NOT NULL
        CONSTRAINT [DF_Document_DownloadCount] DEFAULT (0)
        CONSTRAINT [CK_Document_DownloadCount_NonNegative] CHECK ([DownloadCount] >= 0),
        -- Running counter of successful downloads.
        -- Example: 7

    [SourceSystem] VARCHAR(100) NULL,
        -- Originating system/channel for this document.
        -- Example: 'PTIS_BACKOFFICE', 'CITIZEN_PORTAL', 'SURVEY_APP'

    [IsActive] BIT NOT NULL
        CONSTRAINT [DF_Document_IsActive] DEFAULT (1),
        -- 1 = active and visible to APIs; 0 = hidden (soft-disabled).
        -- Example: 1

    [MarkedForDeletion] BIT NOT NULL
        CONSTRAINT [DF_Document_MarkedForDeletion] DEFAULT (0),
        -- Soft-delete flag. Picked up by background cleanup job later.
        -- Example: 0

    [MarkedForDeletionDate] DATETIME NULL,
        -- Timestamp when MarkedForDeletion was set to 1.
        -- Example: '2026-05-01 10:15:00'

    [CreatedBy] INT NULL,
        -- UserMaster.Id of creator. Nullable for system-created rows.
        -- Example: 42

    [CreatedDate] DATETIME NOT NULL
        CONSTRAINT [DF_Document_CreatedDate] DEFAULT (GETDATE()),
        -- Row creation timestamp.
        -- Example: '2026-04-20 18:30:00'

    [UpdatedBy] INT NULL,
        -- UserMaster.Id of last updater.
        -- Example: 42

    [UpdatedDate] DATETIME NULL,
        -- Last update timestamp.
        -- Example: '2026-04-22 09:05:00'

    [RowVersion] ROWVERSION NOT NULL,
        -- Optimistic concurrency token (auto-maintained by SQL Server).
        -- Needed: metadata edited by concurrent flows (scan job, user edit, etc.).

    CONSTRAINT [PK_Document] PRIMARY KEY CLUSTERED ([Id] ASC),

    -- Table-level CHECK: DepartmentEntityId requires DepartmentId to be set
    -- (prevents orphan entity IDs without department context)
    CONSTRAINT [CK_Document_DepartmentEntityId_RequiresDepartmentId]
        CHECK ([DepartmentEntityId] IS NULL OR [DepartmentId] IS NOT NULL)
);
GO

/* ---------------------------------------------------------------------------
   Intentionally NOT added in this phase (kept here as decisions audit):
     - PropertyId            : Removed. Module linkage belongs in DocumentBinding
                               (module-agnostic design per Nilesh sir).
                               Replaced by DepartmentId + DepartmentEntityId for generic
                               department-level back-pointer (prevents cross-department ID collision).
     - UploadedBy            : Skipped now to avoid access-control complexity;
                               can be added later.
     - ReplacedByDocumentId  : Skipped; ParentDocumentId + IsLatestVersion cover
                               current versioning needs.
     - ExpiryDate            : Not needed now.
     - RetentionPeriodDays   : Not needed now.
     - LastAccessedDate/By   : View/download tracking deferred to an audit table (future scope).
     - DeletedDate / DeletedBy : Deletion audit deferred to a future "DocumentAccessAudit" (or similar)
                                table; until then MarkedForDeletion + MarkedForDeletionDate
                                cover soft-delete here.
--------------------------------------------------------------------------- */

-- Self-referencing FK for versioning
ALTER TABLE [CORE].[Document] WITH CHECK
ADD CONSTRAINT [FK_Document_ParentDocumentId]
FOREIGN KEY ([ParentDocumentId]) REFERENCES [CORE].[Document] ([Id]);
GO

ALTER TABLE [CORE].[Document] CHECK CONSTRAINT [FK_Document_ParentDocumentId];
GO

-- FK: DepartmentId -> DepartmentMaster
ALTER TABLE [CORE].[Document] WITH CHECK
ADD CONSTRAINT [FK_Document_DepartmentMaster]
FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]);
GO

ALTER TABLE [CORE].[Document] CHECK CONSTRAINT [FK_Document_DepartmentMaster];
GO

-- Indexes
CREATE NONCLUSTERED INDEX [IX_Document_ParentDocumentId]
    ON [CORE].[Document] ([ParentDocumentId]);
GO

CREATE NONCLUSTERED INDEX [IX_Document_DepartmentId]
    ON [CORE].[Document] ([DepartmentId])
    WHERE [DepartmentId] IS NOT NULL;
GO

-- Composite index for department-specific entity filtering (prevents ID collision)
CREATE NONCLUSTERED INDEX [IX_Document_Department_Entity]
    ON [CORE].[Document] ([DepartmentId], [DepartmentEntityId])
    WHERE [DepartmentId] IS NOT NULL AND [DepartmentEntityId] IS NOT NULL;
GO


/* ===========================
 screen master
=========================== */

CREATE TABLE [CORE].[ScreenMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ScreenGroupId] [int] NOT NULL,
	[ModuleId] [int] NOT NULL,
	[ScreenCode] [varchar](200) NOT NULL,
	[ScreenName] [varchar](200) NOT NULL,
	[ScreenNameLocal] [nvarchar](200) NULL,
	[ScreenIcon] [nvarchar](100) NULL,
	[RoutePath] [nvarchar](300) NULL,
	[IsMenu] [bit] NULL,
	[IsAuthenticationRequired] [bit] NULL,
    [IsPropertyLockable] [bit] NULL,
	[DisplayOrder] [int] NULL,
	[IsActive]     BIT NOT NULL CONSTRAINT DF_ScreenMaster_IsActive DEFAULT(1),
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT DF_ScreenMaster_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,
    CONSTRAINT [PK_ScreenMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ScreenMaster_ScreenCode] UNIQUE ([ScreenCode]),
    CONSTRAINT [FK_ScreenMaster_ScreenGroupMaster] FOREIGN KEY ([ScreenGroupId]) REFERENCES [CORE].[ScreenGroupMaster] ([Id]),
    CONSTRAINT [FK_ScreenMaster_ModuleMaster] FOREIGN KEY ([ModuleId]) REFERENCES [CORE].[ModuleMaster] ([Id] ) ,
    CONSTRAINT [CK_ScreenMaster_DisplayOrder_NonNegative] CHECK ([DisplayOrder] >= 0)   

)
GO

/* ===========================
 role wise screen access master
=========================== */


CREATE TABLE [CORE].[RoleWiseScreenAccessMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[UserRoleId] [int] NOT NULL,
	[ScreenId] [int] NOT NULL,
	[CanView] [bit] NOT NULL,
	[CanEdit] [bit] NOT NULL,
	[CanDelete] [bit] NOT NULL,
	[HaveFullAccess] [bit] NOT NULL,
	[HaveNoAccess] [bit] NOT NULL,
	[IsActive]     BIT NOT NULL CONSTRAINT DF_RoleWiseScreenAccessMaster_IsActive DEFAULT(1),
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT DF_RoleWiseScreenAccessMaster_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,
    CONSTRAINT [PK_RoleWiseScreenAccessMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RoleWiseScreenAccessMaster_UserRole_Screen] UNIQUE ([UserRoleId], [ScreenId]),
    CONSTRAINT [FK_RoleWiseScreenAccessMaster_UserRoleMaster] FOREIGN KEY ([UserRoleId]) REFERENCES [CORE].[UserRoleMaster] ([Id]),
    CONSTRAINT [FK_RoleWiseScreenAccessMaster_ScreenMaster] FOREIGN KEY ([ScreenId]) REFERENCES [CORE].[ScreenMaster] ([Id])
)

GO

/* ===========================
 DocumentBinding
 =========================== */

 /* ============================================================================
   [CORE].[DocumentBinding]
   Generic, module-agnostic binding between a document and ANY module's entity.

   Design (per Nilesh sir):
     - One Document can be bound to multiple business records via this table.
     - Reference is generic: DepartmentId + ModuleId + ReferenceTableName +
       (ReferenceTableId XOR ReferenceTableIdGuid) + ReferencePropertyName.
     - Authorization is resolved at the parent entity level via
       AuthDepartmentId + AuthReferenceId.

   FK mapping (as confirmed):
     - DocumentId         -> CORE.Document(Id)
     - DepartmentId       -> CORE.DepartmentMaster(Id)   (top-level department)
     - ModuleId           -> CORE.ModuleMaster(Id)       (module under department)
     - AuthDepartmentId   -> CORE.DepartmentMaster(Id)   (auth at department level)

   RowVersion: Kept. Binding rows are usually insert/delete, but metadata like Notes,
              IsActive / MarkedForDeletion may be updated; RowVersion supports
              optimistic concurrency if multiple operators/processes update the same row.
============================================================================ */
CREATE TABLE [CORE].[DocumentBinding](

    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
        -- Internal surrogate primary key.
        -- Example: 7001

    [DocumentId] INT NOT NULL,
        -- FK to CORE.Document. The file being bound.
        -- Example: 1001

    [DepartmentId] INT NOT NULL,
        -- FK to CORE.DepartmentMaster(Id). Top-level grouping (e.g. PTIS, Water).
        -- Example: 3   (DepartmentMaster.Id for 'PTIS')

    [ModuleId] INT NOT NULL,
        -- FK to CORE.ModuleMaster(Id). Specific module under the department.
        -- Example: 12  (ModuleMaster.Id for 'PropertyCertificate')

    [ReferenceTableName] VARCHAR(100) NOT NULL,
        -- Name of the business table this document is attached to.
        -- ASCII only (DB object name), so VARCHAR.
        -- Example: 'PropertyCertificates', 'WaterConnection', 'PropertyMast'

    [ReferenceTableId] INT NULL,
        -- INT primary key value of the row in [ReferenceTableName].
        -- Used when the target table has an INT PK.
        -- Exactly one of ReferenceTableId / ReferenceTableIdGuid must be set
        -- (enforced by CK_DocumentBinding_ReferenceId_XOR).
        -- Example: 50231  (PropertyCertificates.Id)

    [ReferenceTableIdGuid] UNIQUEIDENTIFIER NULL,
        -- GUID primary key value of the row in [ReferenceTableName].
        -- Used when the target table has a GUID PK.
        -- Example: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890'

    [ReferencePropertyName] VARCHAR(100) NOT NULL,
        -- Name of the column in [ReferenceTableName] that holds the PK value.
        -- Lets generic code build joins/links without hardcoding per module.
        -- Example: 'Id', 'PropertyCertificateId', 'WaterConnectionId'

    [BindingPurpose] VARCHAR(200) NULL,
        -- What this binding represents in business workflow / UI.
        -- Free text for now; can be standardized later.
        -- Example: 'MainCertificate', 'OwnerProof', 'TaxReceipt'

    [IsPrimaryDocument] BIT NOT NULL
        CONSTRAINT [DF_DocumentBinding_IsPrimaryDocument] DEFAULT (0),
        -- 1 if this is the primary/main document for that business record.
        -- Example: 1

    [Notes] NVARCHAR(1000) NULL,
        -- Free-text remarks entered by user about this binding.
        -- NVARCHAR because users may type in local languages.
        -- Example: 'Replaced earlier scan with clearer copy'

    [AccessPermission] VARCHAR(50) NULL,
        -- Future-use access tag for this specific binding.
        -- Values (future): 'READ', 'READ_WRITE', 'OWNER_ONLY'.
        -- Example: NULL today  /  'READ_WRITE' later

    [AuthDepartmentId] INT NULL,
        -- FK to CORE.DepartmentMaster(Id). Department against which authorization
        -- is resolved (parent-entity authorization model).
        -- Example: 3   (DepartmentMaster.Id for 'PTIS')

    [AuthReferenceId] INT NULL,
        -- PK of the row in the auth module that grants access.
        -- Together with AuthDepartmentId, answers "who owns this for permission checks".
        -- Example: 1001  (Property.Id used for property-level auth)

    CONSTRAINT [CK_DocumentBinding_AuthPair_Complete]
        CHECK (
            ([AuthDepartmentId] IS NULL AND [AuthReferenceId] IS NULL) OR
            ([AuthDepartmentId] IS NOT NULL AND [AuthReferenceId] IS NOT NULL)
        ),

    [IsReferenceValid] BIT NOT NULL
        CONSTRAINT [DF_DocumentBinding_IsReferenceValid] DEFAULT (0),
        -- 1 if the referenced row was confirmed to exist at last validation.
        -- A background job / runtime check can set this.
        -- Example: 1

    [IsActive] BIT NOT NULL
        CONSTRAINT [DF_DocumentBinding_IsActive] DEFAULT (1),
        -- 1 = binding is live and visible to APIs.
        -- Example: 1

    [MarkedForDeletion] BIT NOT NULL
        CONSTRAINT [DF_DocumentBinding_MarkedForDeletion] DEFAULT (0),
        -- Soft-delete flag. Picked up by cleanup job later.
        -- Example: 0

    [MarkedForDeletionDate] DATETIME NULL,
        -- Timestamp when MarkedForDeletion was set to 1.
        -- Example: '2026-05-01 10:15:00'

    [CreatedBy] INT NULL,
        -- UserMaster.Id of creator.
        -- Example: 42

    [CreatedDate] DATETIME NOT NULL
        CONSTRAINT [DF_DocumentBinding_CreatedDate] DEFAULT (GETDATE()),
        -- Row creation timestamp.
        -- Example: '2026-04-20 18:31:00'

    [UpdatedBy] INT NULL,
        -- UserMaster.Id of last updater.
        -- Example: 42

    [UpdatedDate] DATETIME NULL,
        -- Last update timestamp.
        -- Example: '2026-04-22 09:06:00'

    [RowVersion] ROWVERSION NOT NULL,
        -- Optimistic concurrency token (auto-maintained by SQL Server).
        -- Needed: binding metadata can be updated by multiple operators/processes.

    CONSTRAINT [PK_DocumentBinding] PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [FK_DocumentBinding_Document]
        FOREIGN KEY ([DocumentId]) REFERENCES [CORE].[Document] ([Id]),

    -- Exactly one of ReferenceTableId / ReferenceTableIdGuid must be populated.
    CONSTRAINT [CK_DocumentBinding_ReferenceId_XOR]
        CHECK (
            ([ReferenceTableId] IS NOT NULL AND [ReferenceTableIdGuid] IS NULL) OR
            ([ReferenceTableId] IS NULL     AND [ReferenceTableIdGuid] IS NOT NULL)
        )
);
GO

/* ---------------------------------------------------------------------------
   Intentionally NOT added in this phase (decisions audit):
     - ModuleCode / SubModuleCode : Replaced by DepartmentId / ModuleId FKs
                                    (normalized, per Nilesh sir's confirmation).
     - DisplayOrder                : Not needed now.
     - ExpiryDate                  : Not needed now.
     - LastValidatedDate           : Not needed now; IsReferenceValid is enough.
     - ValidationError             : Not needed now.
     - RowVersion                  : Kept. Allows optimistic concurrency when
                                    binding metadata (Notes/IsActive/MarkedForDeletion)
                                    is updated by concurrent flows.
--------------------------------------------------------------------------- */

-- FK: DepartmentId -> DepartmentMaster
ALTER TABLE [CORE].[DocumentBinding] WITH CHECK
ADD CONSTRAINT [FK_DocumentBinding_DepartmentMaster]
FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]);
GO

ALTER TABLE [CORE].[DocumentBinding] CHECK CONSTRAINT [FK_DocumentBinding_DepartmentMaster];
GO

-- Composite FK: (DepartmentId, ModuleId) -> ModuleMaster(DepartmentId, Id)
-- Enforces both:
--   1. ModuleId exists in ModuleMaster
--   2. ModuleId belongs to the specified DepartmentId (prevents mismatched bindings)
-- Single-column FK on ModuleId is redundant and removed to avoid maintenance overhead.
ALTER TABLE [CORE].[DocumentBinding] WITH CHECK
ADD CONSTRAINT [FK_DocumentBinding_DepartmentModule]
FOREIGN KEY ([DepartmentId], [ModuleId]) REFERENCES [CORE].[ModuleMaster] ([DepartmentId], [Id]);
GO

ALTER TABLE [CORE].[DocumentBinding] CHECK CONSTRAINT [FK_DocumentBinding_DepartmentModule];
GO

-- FK: AuthDepartmentId -> DepartmentMaster
ALTER TABLE [CORE].[DocumentBinding] WITH CHECK
ADD CONSTRAINT [FK_DocumentBinding_AuthDepartmentMaster]
FOREIGN KEY ([AuthDepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]);
GO

ALTER TABLE [CORE].[DocumentBinding] CHECK CONSTRAINT [FK_DocumentBinding_AuthDepartmentMaster];
GO

-- Indexes
CREATE NONCLUSTERED INDEX [IX_DocumentBinding_DocumentId]
    ON [CORE].[DocumentBinding] ([DocumentId]);
GO

CREATE NONCLUSTERED INDEX [IX_DocumentBinding_DepartmentId]
    ON [CORE].[DocumentBinding] ([DepartmentId]);
GO

CREATE NONCLUSTERED INDEX [IX_DocumentBinding_ModuleId]
    ON [CORE].[DocumentBinding] ([ModuleId]);
GO

CREATE NONCLUSTERED INDEX [IX_DocumentBinding_Reference]
    ON [CORE].[DocumentBinding] ([DepartmentId], [ModuleId], [ReferenceTableName], [ReferenceTableId])
    WHERE [ReferenceTableId] IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX [IX_DocumentBinding_ReferenceGuid]
    ON [CORE].[DocumentBinding] ([DepartmentId], [ModuleId], [ReferenceTableName], [ReferenceTableIdGuid])
    WHERE [ReferenceTableIdGuid] IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX [IX_DocumentBinding_AuthDepartment]
    ON [CORE].[DocumentBinding] ([AuthDepartmentId], [AuthReferenceId])
    WHERE [AuthDepartmentId] IS NOT NULL AND [AuthReferenceId] IS NOT NULL;
GO


 /* ===========================
 CommonRemarkTypeMaster
 =========================== */
CREATE TABLE [CORE].[CommonRemarkTypeMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RemarkTypeName] VARCHAR(100) NOT NULL, -- e.g. Survey, Recovery, Notice, Mobile Remark, etc.
   	[IsActive]     BIT NOT NULL CONSTRAINT DF_CommonRemarkTypeMaster_IsActive DEFAULT(1),
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT DF_CommonRemarkTypeMaster_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,
CONSTRAINT [PK_CommonRemarkTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
CONSTRAINT [UQ_CommonRemarkTypeMaster_RemarkTypeName] UNIQUE ([RemarkTypeName])
);

GO
/* ===========================
 CommunicationTypeMaster
 =========================== */
CREATE TABLE [CORE].[CommunicationTypeMaster](
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TypeName] VARCHAR(100) NOT NULL,
    [DepartmentId] INT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_CommunicationTypeMaster_IsActive] DEFAULT ((1)),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_CommunicationTypeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_CommunicationTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_CommunicationTypeMaster_DepartmentMaster] FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
);
GO

CREATE TABLE [CORE].[UlbType](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL ,
	[UlbTypeName] [varchar](50) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_UlbType_IsActive] DEFAULT ((1)),
 	[CreatedBy] INT NULL,
 	[CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_UlbType_CreatedDate] DEFAULT (GETDATE()),
 	[UpdatedBy] INT NULL,
 	[UpdatedDate] DATETIME NULL,
 CONSTRAINT [PK_UlbType] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
CREATE TABLE [CORE].[UlbMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL ,
	[UlbCode] [nvarchar](50) NOT NULL,
	[UlbName] [nvarchar](200) NOT NULL,
	[UlbNameLocal] [nvarchar](200) NULL,
	[UlbTypeId] [int] NOT NULL,
	[UlbLogo] [nvarchar](100) NULL,
	[EmailId] [nvarchar](100) NULL,
	[MobileNo] [varchar](13) NULL,
	[AlternateMobileNo] [varchar](13) NULL,
	[WebsiteUrl] [nvarchar](2048) NULL,
	[ContactPersonName] [nvarchar](150) NULL,
	[ContactPersonDesignation] [nvarchar](100) NULL,
	[UlbAddress] [nvarchar](500) NULL,
	[State] [varchar](50) NULL,
	[District] [varchar](50) NULL,
	[PinCode] [varchar](10) NULL,
	[ProjectStartDate] [datetime] NULL,
	[FinancialYearStartDate] [datetime] NULL,
	[ExpectedGoLiveDate] [datetime] NULL,
	[PartnerName] [varchar](50) NULL,
	[PMName] [varchar](50) NULL,
	[PMEmailId] [nvarchar](100) NULL,
	[PMMobileNo] [varchar](13) NULL,
	[LicenceType] [varchar](50) NULL,
	[LicenceStartDate] [datetime] NULL,
	[LicenceEndDate] [datetime] NULL,
	[LicenceDuration] [varchar](50) NULL,
	[SupportType] [varchar](50) NULL,
	[LicenceKey] [varchar](300) NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedDate] [datetime]  NOT NULL CONSTRAINT [DF_UlbMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[UpdatedBy] [int] NULL,
 CONSTRAINT [PK_UlbMaster] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
) ON [PRIMARY],
 CONSTRAINT [UQ_UlbMaster_UlbCode] UNIQUE NONCLUSTERED 
(
	[UlbCode] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [CORE].[UlbMaster] ADD  CONSTRAINT [DF_UlbMaster_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [CORE].[UlbMaster]  WITH CHECK ADD  CONSTRAINT [FK_UlbMaster_UlbType] FOREIGN KEY([UlbTypeId])
REFERENCES [CORE].[UlbType] ([Id])
GO
ALTER TABLE [CORE].[UlbMaster] CHECK CONSTRAINT [FK_UlbMaster_UlbType]
GO
CREATE NONCLUSTERED INDEX [IX_UlbMaster_UlbTypeId]
ON [CORE].[UlbMaster] ([UlbTypeId]);
GO
CREATE TABLE [CORE].[RefreshToken](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL ,
    [Token] [nvarchar](400) NOT NULL,
    [UserId] [int] NOT NULL,
    [ExpiresAt] [datetime] NOT NULL,
    [IsRevoked] [bit] NOT NULL CONSTRAINT [DF_RefreshToken_IsRevoked] DEFAULT (0),
    [RevokedAt] [datetime] NULL,
    [IpAddress] [nvarchar](45) NULL,
    [UserAgent] [nvarchar](500) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT DF_RefreshToken_IsActive DEFAULT(1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT DF_RefreshToken_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
 CONSTRAINT [PK_RefreshToken] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_RefreshToken_Token] UNIQUE ([Token])    
);
 
ALTER TABLE [CORE].[RefreshToken]  WITH CHECK ADD  CONSTRAINT [FK_RefreshToken_UserMaster] FOREIGN KEY([UserId])
REFERENCES [CORE].[UserMaster] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [CORE].[RefreshToken] CHECK CONSTRAINT [FK_RefreshToken_UserMaster];
GO
 
CREATE TABLE [CORE].[ConfigCategoryMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL  ,
    [CategoryCode] [varchar](30) NOT NULL,
    [CategoryName] [nvarchar](100) NOT NULL,
    [DisplayOrder] [int] NOT NULL CONSTRAINT DF_ConfigCategoryMaster_DisplayOrder DEFAULT(0),
    [IsActive] BIT NOT NULL CONSTRAINT DF_ConfigCategoryMaster_IsActive DEFAULT(1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT DF_ConfigCategoryMaster_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
 CONSTRAINT [PK_ConfigCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_ConfigCategoryMaster_CategoryCode] UNIQUE ([CategoryCode])
) ON [PRIMARY]
GO
 

CREATE TABLE [CORE].[ConfigKeyMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL ,
    [CategoryId] [int] NOT NULL,
    [ConfigCode] [varchar](60) NOT NULL,
    [ConfigName] [nvarchar](150) NOT NULL,
    [Description] [nvarchar](400) NULL,
    [DataType] [varchar](20) NOT NULL,
    [ControlType] [varchar](30) NOT NULL,
    [DefaultValue] [nvarchar](500) NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT DF_ConfigKeyMaster_IsActive DEFAULT(1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT DF_ConfigKeyMaster_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL, 
 CONSTRAINT [PK_ConfigKeyMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_ConfigKeyMaster_ConfigCode] UNIQUE ([ConfigCode])
) ON [PRIMARY]
GO
 
ALTER TABLE [CORE].[ConfigKeyMaster] WITH CHECK ADD CONSTRAINT [FK_ConfigKeyMaster_ConfigCategoryMaster_CategoryId] FOREIGN KEY([CategoryId])
REFERENCES [CORE].[ConfigCategoryMaster] ([Id])
GO
ALTER TABLE [CORE].[ConfigKeyMaster] CHECK CONSTRAINT [FK_ConfigKeyMaster_ConfigCategoryMaster_CategoryId]
GO
 
CREATE NONCLUSTERED INDEX [IX_ConfigKeyMaster_CategoryId]
ON [CORE].[ConfigKeyMaster] ([CategoryId] ASC)
GO
 
CREATE TABLE [CORE].[ConfigValueMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ConfigKeyId] [int] NOT NULL,
    [DepartmentId] [int] NULL,
    [ModuleId] [int] NULL,
    [Value] [nvarchar](500) NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT DF_ConfigValueMaster_IsActive DEFAULT(1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT DF_ConfigValueMaster_CreatedDate DEFAULT(GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_ConfigValueMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_ConfigValue_ConfigKeyId_Global]
ON [CORE].[ConfigValueMaster] ([ConfigKeyId] ASC)
WHERE [DepartmentId] IS NULL AND [ModuleId] IS NULL
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_ConfigValue_ConfigKeyId_DepartmentId]
ON [CORE].[ConfigValueMaster] ([ConfigKeyId] ASC, [DepartmentId] ASC)
WHERE [DepartmentId] IS NOT NULL AND [ModuleId] IS NULL
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_ConfigValue_ConfigKeyId_ModuleId]
ON [CORE].[ConfigValueMaster] ([ConfigKeyId] ASC, [ModuleId] ASC)
WHERE [DepartmentId] IS NULL AND [ModuleId] IS NOT NULL
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_ConfigValue_ConfigKeyId_DepartmentId_ModuleId]
ON [CORE].[ConfigValueMaster] ([ConfigKeyId] ASC, [DepartmentId] ASC, [ModuleId] ASC)
WHERE [DepartmentId] IS NOT NULL AND [ModuleId] IS NOT NULL
GO
 
ALTER TABLE [CORE].[ConfigValueMaster] WITH CHECK ADD CONSTRAINT [FK_ConfigValueMaster_ConfigKeyMaster_ConfigKeyId]
FOREIGN KEY([ConfigKeyId])
REFERENCES [CORE].[ConfigKeyMaster] ([Id]);
GO

 

 

/* ===========================
   SourceTable
   Stores master metadata for configurable source tables.
   =========================== */
CREATE TABLE [CORE].[SourceTable] ( 
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL, 
    [ModuleId] INT NOT NULL, 
    [TableName] VARCHAR(200) NOT NULL, 
    [TableAliasName] NVARCHAR(200) NULL, 
    [IsActive] BIT NOT NULL CONSTRAINT [DF_SourceTable_IsActive] DEFAULT (1), 
    [CreatedBy] INT NULL, 
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_SourceTable_CreatedDate] DEFAULT (GETDATE()), 
    [UpdatedBy] INT NULL, 
    [UpdatedDate] DATETIME NULL, 
    CONSTRAINT [PK_SourceTable] PRIMARY KEY CLUSTERED ([Id] ASC), 
    CONSTRAINT [UQ_SourceTable_ModuleId_TableName] UNIQUE NONCLUSTERED ([ModuleId] ASC, [TableName] ASC), 
    CONSTRAINT [FK_SourceTable_ModuleId] FOREIGN KEY ([ModuleId]) REFERENCES [CORE].[ModuleMaster] ([Id]) 
);

/* ===========================
   SourceTableDetails
   Stores field-level metadata for configurable source tables.
   =========================== */
CREATE TABLE [CORE].[SourceTableDetails] ( 
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL, 
    [SourceTableId] INT NOT NULL, 
    [FieldName] VARCHAR(200) NOT NULL, 
    [DisplayName] NVARCHAR(200) NULL, 
    [ControlType] VARCHAR(50) NULL, 
    [DataType] VARCHAR(50) NULL, 
    [Placeholder] NVARCHAR(500) NULL, 
    [MaxLength] INT NULL, 
    [ValidationRegex] VARCHAR(500) NULL, 
    [DefaultValue] VARCHAR(500) NULL, 
    [IsRequired] BIT NOT NULL CONSTRAINT [DF_SourceTableDetails_IsRequired] DEFAULT (0), 
    [SequenceNo] INT NOT NULL CONSTRAINT [DF_SourceTableDetails_SequenceNo] DEFAULT (0), 
    [BindApi] VARCHAR(500) NULL, 
    [ApiResponse] VARCHAR(500) NULL, 
    [IsActive] BIT NOT NULL CONSTRAINT [DF_SourceTableDetails_IsActive] DEFAULT (1), 
    [CreatedBy] INT NULL, 
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_SourceTableDetails_CreatedDate] DEFAULT (GETDATE()), 
    [UpdatedBy] INT NULL, 
    [UpdatedDate] DATETIME NULL, 
    CONSTRAINT [PK_SourceTableDetails] PRIMARY KEY CLUSTERED ([Id] ASC), 
    CONSTRAINT [UQ_SourceTableDetails_SourceTableId_FieldName] UNIQUE NONCLUSTERED ([SourceTableId] ASC, [FieldName] ASC), 
    CONSTRAINT [FK_SourceTableDetails_SourceTableId] FOREIGN KEY ([SourceTableId]) REFERENCES [CORE].[SourceTable] ([Id]) 
);

ALTER TABLE CORE.UserMaster
        ADD TwoFactorRequired BIT NOT NULL CONSTRAINT DF_UserMaster_TwoFactorRequired DEFAULT (0),TwoFactorEnabled BIT NOT NULL CONSTRAINT DF_UserMaster_TwoFactorEnabled DEFAULT (0),
	TwoFactorSecretEncrypted NVARCHAR(500) NULL,TwoFactorEnabledAt DATETIME NULL,SecurityStamp NVARCHAR(64) NULL,PasswordChangedAt DATETIME NULL,OtpChallengeFailCount INT NULL,OtpChallengeLockedUntilAt DATETIME NULL;

         CREATE TABLE CORE.TwoFactorRecoveryCode
    (
        Id              INT IDENTITY(1,1)  NOT FOR REPLICATION NOT NULL,
        UserId          INT                 NOT NULL,
        CodeHash        NVARCHAR(255)       NOT NULL,
        UsedAt          DATETIME           NULL,
        RevokedAt       DATETIME           NULL,
        CreatedBy       INT                 NULL,
        CreatedDate     DATETIME           NULL,
        UpdatedBy       INT                 NULL,
        UpdatedDate     DATETIME           NULL,
        CONSTRAINT PK_TwoFactorRecoveryCode PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_TwoFactorRecoveryCode_UserMaster FOREIGN KEY (UserId)
            REFERENCES CORE.UserMaster (Id)
    );

    CREATE INDEX IX_TwoFactorRecoveryCode_UserId_UsedAt_RevokedAt
        ON CORE.TwoFactorRecoveryCode (UserId, UsedAt, RevokedAt);

        CREATE TABLE CORE.TwoFactorChallenge
    (
        Id                  UNIQUEIDENTIFIER    NOT NULL,
        ChallengeHash       NVARCHAR(64)        NOT NULL,
        UserId              INT                 NOT NULL,
        Purpose             NVARCHAR(50)        NOT NULL,
        CreatedAt           DATETIME           NOT NULL,
        ExpiresAt           DATETIME           NOT NULL,
        FailedAttemptCount  INT                 NOT NULL CONSTRAINT DF_TwoFactorChallenge_FailedAttemptCount DEFAULT (0),
        ConsumedAt          DATETIME           NULL,
        RevokedAt           DATETIME           NULL,
        IpAddress           NVARCHAR(45)        NULL,
        UserAgent           NVARCHAR(500)       NULL,
        CONSTRAINT PK_TwoFactorChallenge PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_TwoFactorChallenge_UserMaster FOREIGN KEY (UserId)
            REFERENCES CORE.UserMaster (Id)
    );

    CREATE UNIQUE INDEX IX_TwoFactorChallenge_ChallengeHash
        ON CORE.TwoFactorChallenge (ChallengeHash);

    CREATE INDEX IX_TwoFactorChallenge_UserId
        ON CORE.TwoFactorChallenge (UserId);

    -- Supports the periodic cleanup task that purges expired/resolved challenges.
    CREATE INDEX IX_TwoFactorChallenge_ExpiresAt
        ON CORE.TwoFactorChallenge (ExpiresAt);

          CREATE TABLE CORE.SecurityAuditLog
    (   
        Id              INT IDENTITY(1,1)  NOT FOR REPLICATION NOT NULL,
        EventType       NVARCHAR(100)          NOT NULL,
        UserId          INT                    NULL,
        Success         BIT                    NOT NULL,
        CorrelationId   NVARCHAR(100)          NULL,
        IpAddress       NVARCHAR(45)           NULL,
        UserAgent       NVARCHAR(500)          NULL,
        Detail          NVARCHAR(200)          NULL,
        CreatedAt       DATETIME              NOT NULL,
        CONSTRAINT PK_SecurityAuditLog PRIMARY KEY CLUSTERED (Id)
        -- Intentionally no FK to UserMaster: audit rows must remain even if the user is later
        -- hard-deleted by the cleanup task.
    );

    CREATE INDEX IX_SecurityAuditLog_UserId ON CORE.SecurityAuditLog (UserId);
    CREATE INDEX IX_SecurityAuditLog_EventType ON CORE.SecurityAuditLog (EventType);
    CREATE INDEX IX_SecurityAuditLog_CreatedAt ON CORE.SecurityAuditLog (CreatedAt);
GO


/* ============================================================================
   CITIZEN IDENTITY & AUTHENTICATION LAYER
   Shared across all modules (GRV, RTS, PTIS, WTIS, TLTS, etc.)
============================================================================ */

/* ===========================
   [CORE].[CitizenMaster]
   Stores citizen identity for citizen-facing portals & apps across all modules.
   Citizens are identified by their mobile number (unique).
   Authentication is OTP-based — no password stored here.
=========================== */
CREATE TABLE [CORE].[CitizenMaster] (
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [Name]                  NVARCHAR(150) NOT NULL,
    [MobileNo]              VARCHAR(15) NOT NULL,
    [IsVerified]            BIT NOT NULL CONSTRAINT [DF_CitizenMaster_IsVerified]    DEFAULT (0), -- set 1 after first successful OTP
    [FailedOtpCount]        INT NOT NULL CONSTRAINT [DF_CitizenMaster_FailedOtpCount] DEFAULT (0),
    [LockedUntilAt]         DATETIME NULL,                                                        -- OTP brute-force lockout expiry
    [LastLoginAt]           DATETIME NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_CitizenMaster_IsActive]      DEFAULT (1),
    [CreatedBy]             INT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_CitizenMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT NULL,
    [UpdatedDate]           DATETIME NULL,

    CONSTRAINT [PK_CitizenMaster]                PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_CitizenMaster_MobileNo]       UNIQUE ([MobileNo]),
    CONSTRAINT [UQ_CitizenMaster_Id_MobileNo]    UNIQUE ([Id], [MobileNo]),
    CONSTRAINT [CK_CitizenMaster_FailedOtpCount] CHECK ([FailedOtpCount] >= 0)
) ON [PRIMARY];
GO



/* ===========================
   [CORE].[CitizenOtpLog]
   Tracks each OTP challenge issued to a mobile number for citizen login or transaction authorization.
   OTP is never stored in plain text — only the hash.
   One record per OTP request; enforced by IsUsed + ExpiresAt + Purpose match at app level.
=========================== */
CREATE TABLE [CORE].[CitizenOtpLog] (
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [MobileNo]      VARCHAR(15) NOT NULL,                                                               -- indexed; CitizenId may not exist yet for new users
    [CitizenId]     INT NULL,                                                                           -- NULL until citizen is registered (first-time flow)
    [Purpose]       VARCHAR(50) NOT NULL CONSTRAINT [DF_CitizenOtpLog_Purpose] DEFAULT ('LOGIN'),      -- purpose binding e.g. 'LOGIN', 'SUBMIT_GRIEVANCE', 'RTS_APPLICATION'
    [ModuleCode]    VARCHAR(20) NULL,                                                                   -- originating module e.g. 'GRV', 'RTS', 'PTIS', 'WTIS'
    [ReferenceId]   VARCHAR(50) NULL,                                                                   -- optional target entity/transaction reference
    [OtpHash]       VARCHAR(256) NOT NULL,                                                              -- bcrypt/Argon2id hash, or keyed HMAC-SHA-256 with the key stored outside the database; never store a plain or unkeyed OTP hash
    [ExpiresAt]     DATETIME NOT NULL,                                                                  -- typically GETDATE() + 5 minutes
    [IsUsed]        BIT NOT NULL CONSTRAINT [DF_CitizenOtpLog_IsUsed]        DEFAULT (0),              -- set 1 after successful verification
    [AttemptCount]  INT NOT NULL CONSTRAINT [DF_CitizenOtpLog_AttemptCount]  DEFAULT (0),              -- max 3 wrong attempts per OTP
    [IpAddress]     VARCHAR(50) NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_CitizenOtpLog_IsActive]      DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_CitizenOtpLog_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,

    CONSTRAINT [PK_CitizenOtpLog]              PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_CitizenOtpLog_AttemptCount] CHECK ([AttemptCount] >= 0),
    CONSTRAINT [FK_CitizenOtpLog_CitizenId_MobileNo]
        FOREIGN KEY ([CitizenId], [MobileNo]) REFERENCES [CORE].[CitizenMaster] ([Id], [MobileNo])
) ON [PRIMARY];
GO

CREATE INDEX [IX_CitizenOtpLog_MobileNo_Purpose]   ON [CORE].[CitizenOtpLog] ([MobileNo], [Purpose], [IsUsed], [ExpiresAt]);
CREATE INDEX [IX_CitizenOtpLog_CitizenId_MobileNo] ON [CORE].[CitizenOtpLog] ([CitizenId], [MobileNo]);
GO


/****** Object:Table [CORE].[AliasMaster] ******/
CREATE TABLE [CORE].[AliasMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[KeyName] [varchar](200) NOT NULL,
	[LabelName] [nvarchar](200) NOT NULL,
	[EnglishName] [nvarchar](200) NULL,
	[RegionalName] [nvarchar](200) NULL,
	[HindiName] [nvarchar](200) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AliasMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AliasMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_AliasMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_AliasMaster_KeyName] UNIQUE NONCLUSTERED ([KeyName] ASC)
) ON [PRIMARY]
GO

-- ============================================================================
-- CORE Module - CDC / Audit Framework Tables
-- ============================================================================

/* ===========================
   [CORE].[CdcTableConfig]
=========================== */
CREATE TABLE [CORE].[CdcTableConfig](
    [Id]                     INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentCode]         VARCHAR(20) NOT NULL,
    [CaptureInstance]        VARCHAR(200) NOT NULL,
    [SourceSchema]           VARCHAR(128) NOT NULL,
    [SourceTable]            VARCHAR(128) NOT NULL,
    [ProcessingType]         VARCHAR(20) NOT NULL,      -- ENTITY / MASTER / AUDIT
    [CalculationType]        VARCHAR(20) NULL,
    [EntityType]             VARCHAR(50) NULL,
    [TriggersRecalculation]  BIT NOT NULL CONSTRAINT [DF_CdcTableConfig_TriggersRecalculation] DEFAULT (0),
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_CdcTableConfig_IsActive] DEFAULT (1),
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_CdcTableConfig_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedDate]            DATETIME NULL,
    CONSTRAINT [PK_CdcTableConfig] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_CdcTableConfig_CaptureInstance] UNIQUE ([CaptureInstance]),
    CONSTRAINT [CK_CdcTableConfig_ProcessingType] CHECK ([ProcessingType] IN ('ENTITY','MASTER','AUDIT'))
) ON [PRIMARY]
GO

/* ===========================
   [CORE].[CdcEntityResolverConfig]
=========================== */
CREATE TABLE [CORE].[CdcEntityResolverConfig](
    [Id]                      INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentCode]          VARCHAR(20) NOT NULL,
    [SourceSchema]            VARCHAR(128) NOT NULL,
    [SourceTable]             VARCHAR(128) NOT NULL,
    [ResolverType]            VARCHAR(20) NOT NULL,         -- DIRECT / PARENT / CUSTOM
    [EntityType]              VARCHAR(50) NOT NULL,
    [SourceEntityColumn]      VARCHAR(128) NULL,
    [SourceEntityDataType]    VARCHAR(30) NULL,             -- INT / BIGINT / UNIQUEIDENTIFIER etc.; production defaults usually INT
    [ParentSchema]            VARCHAR(128) NULL,
    [ParentTable]             VARCHAR(128) NULL,
    [ParentJoinColumn]        VARCHAR(128) NULL,
    [ParentEntityColumn]      VARCHAR(128) NULL,
    [CustomResolverProcedure] NVARCHAR(256) NULL,
    [IsActive]                BIT NOT NULL CONSTRAINT [DF_CdcEntityResolverConfig_IsActive] DEFAULT (1),
    [CreatedDate]             DATETIME NOT NULL CONSTRAINT [DF_CdcEntityResolverConfig_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedDate]             DATETIME NULL,
    CONSTRAINT [PK_CdcEntityResolverConfig] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_CdcEntityResolverConfig_Source] UNIQUE ([DepartmentCode], [SourceSchema], [SourceTable]),
    CONSTRAINT [CK_CdcEntityResolverConfig_ResolverType] CHECK ([ResolverType] IN ('DIRECT','PARENT','CUSTOM'))
) ON [PRIMARY]
GO

/* ===========================
   [CORE].[CdcProcessingCheckpoint]
=========================== */
CREATE TABLE [CORE].[CdcProcessingCheckpoint](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CaptureInstance]   VARCHAR(200) NOT NULL,
    [SourceSchema]      VARCHAR(128) NOT NULL,
    [SourceTable]       VARCHAR(128) NOT NULL,
    [LastProcessedLsn]  BINARY(10) NULL,
    [LastProcessedAt]   DATETIME2(3) NULL,
    [LastError]         NVARCHAR(MAX) NULL,
    [LastErrorAt]       DATETIME2(3) NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_CdcProcessingCheckpoint_IsActive] DEFAULT (1),
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_CdcProcessingCheckpoint_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedDate]       DATETIME NULL,
    CONSTRAINT [PK_CdcProcessingCheckpoint] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_CdcProcessingCheckpoint_CaptureInstance] UNIQUE ([CaptureInstance])
) ON [PRIMARY]
GO

/* ===========================
   [CORE].[CdcProcessingLog]
=========================== */
CREATE TABLE [CORE].[CdcProcessingLog](
    [Id]              BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentCode]  VARCHAR(20) NULL,
    [CaptureInstance] VARCHAR(200) NOT NULL,
    [FromLsn]         BINARY(10) NULL,
    [ToLsn]           BINARY(10) NULL,
    [RecordsRead]     INT NOT NULL CONSTRAINT [DF_CdcProcessingLog_RecordsRead] DEFAULT (0),
    [EventsCreated]   INT NOT NULL CONSTRAINT [DF_CdcProcessingLog_EventsCreated] DEFAULT (0),
    [Status]          VARCHAR(20) NOT NULL,
    [StartedAt]       DATETIME2(3) NOT NULL CONSTRAINT [DF_CdcProcessingLog_StartedAt] DEFAULT (SYSDATETIME()),
    [CompletedAt]     DATETIME2(3) NULL,
    [ErrorDetail]     NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_CdcProcessingLog] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_CdcProcessingLog_Status] CHECK ([Status] IN ('IN_PROGRESS','COMPLETED','FAILED'))
) ON [PRIMARY]
GO

/* ===========================
   [CORE].[EntityDataChangeEvent]
=========================== */
CREATE TABLE [CORE].[EntityDataChangeEvent](
    [Id]                      BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentCode]          VARCHAR(20) NOT NULL,
    [EntityType]              VARCHAR(50) NULL,
    [EntityId]                INT NULL,
    [EntityResolutionStatus]  VARCHAR(20) NULL,
    [EntityResolutionDetail]  NVARCHAR(500) NULL,
    [SourceSchema]            VARCHAR(128) NOT NULL,
    [SourceTable]             VARCHAR(128) NOT NULL,
    [SourceRecordId]          INT NULL,
    [ChangeType]              VARCHAR(20) NOT NULL,
    [FieldChanges]            NVARCHAR(MAX) NULL,
    [ChangeSource]            VARCHAR(20) NOT NULL CONSTRAINT [DF_EntityDataChangeEvent_ChangeSource] DEFAULT ('UNKNOWN'),
    [AttributionStatus]       VARCHAR(20) NOT NULL CONSTRAINT [DF_EntityDataChangeEvent_AttributionStatus] DEFAULT ('NOT_FOUND'),
    [CreatedByUserId]         INT NULL,
    [UpdatedByUserId]         INT NULL,
    [ChangedByUserId]         INT NULL,
    [ChangedBySqlLogin]       NVARCHAR(256) NULL,
    [DatabaseUser]            NVARCHAR(256) NULL,
    [ApplicationName]         NVARCHAR(256) NULL,
    [ClientIp]                VARCHAR(64) NULL,
    [SqlStatement]            NVARCHAR(MAX) NULL,
    [AuditEventTime]          DATETIME2(3) NULL,
    [ChangedAt]               DATETIME2(3) NULL,
    [CdcStartLsn]             BINARY(10) NULL,
    [CdcSeqVal]               BINARY(10) NULL,
    [CdcOperation]            TINYINT NULL,
    [DetectionSource]         VARCHAR(20) NOT NULL CONSTRAINT [DF_EntityDataChangeEvent_DetectionSource] DEFAULT ('CDC'),
    [ProcessedAt]             DATETIME2(3) NOT NULL CONSTRAINT [DF_EntityDataChangeEvent_ProcessedAt] DEFAULT (SYSDATETIME()),
    CONSTRAINT [PK_EntityDataChangeEvent] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_EntityDataChangeEvent_ChangeType] CHECK ([ChangeType] IN ('INSERT','UPDATE','DELETE')),
    CONSTRAINT [CK_EntityDataChangeEvent_ChangeSource] CHECK ([ChangeSource] IN ('UI_API','DIRECT_SQL','UNKNOWN')),
    CONSTRAINT [CK_EntityDataChangeEvent_AttributionStatus] CHECK ([AttributionStatus] IN ('CONFIRMED','MATCHED','AMBIGUOUS','NOT_FOUND'))
) ON [PRIMARY]
GO

CREATE UNIQUE INDEX [UX_EntityDataChangeEvent_Cdc]
ON [CORE].[EntityDataChangeEvent]([SourceSchema],[SourceTable],[SourceRecordId],[CdcStartLsn],[CdcSeqVal],[ChangeType])
WHERE [CdcStartLsn] IS NOT NULL;
GO

CREATE INDEX [IX_EntityDataChangeEvent_Entity]
ON [CORE].[EntityDataChangeEvent]([DepartmentCode],[EntityType],[EntityId],[ChangedAt] DESC)
INCLUDE([SourceSchema],[SourceTable],[SourceRecordId],[ChangeType],[ChangeSource],[ChangedByUserId],[ChangedBySqlLogin]);
GO

/* ===========================
   [CORE].[MasterDataChangeBatch]
=========================== */
CREATE TABLE [CORE].[MasterDataChangeBatch](
    [Id]                BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DepartmentCode]    VARCHAR(20) NOT NULL,
    [SourceSchema]      VARCHAR(128) NOT NULL,
    [SourceTable]       VARCHAR(128) NOT NULL,
    [CalculationType]   VARCHAR(20) NULL,
    [Status]            VARCHAR(20) NOT NULL CONSTRAINT [DF_MasterDataChangeBatch_Status] DEFAULT ('PENDING'),
    [RemarkSummary]     NVARCHAR(1000) NULL,
    [TotalRecords]      INT NOT NULL CONSTRAINT [DF_MasterDataChangeBatch_TotalRecords] DEFAULT (0),
    [ProcessedRecords]  INT NOT NULL CONSTRAINT [DF_MasterDataChangeBatch_ProcessedRecords] DEFAULT (0),
    [CreatedBy]         INT NULL,
    [CreatedAt]         DATETIME2(3) NOT NULL CONSTRAINT [DF_MasterDataChangeBatch_CreatedAt] DEFAULT (SYSDATETIME()),
    [StartedAt]         DATETIME2(3) NULL,
    [CompletedAt]       DATETIME2(3) NULL,
    [ErrorDetail]       NVARCHAR(MAX) NULL,
    [CdcStartLsn]       BINARY(10) NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_MasterDataChangeBatch_IsActive] DEFAULT (1),
    CONSTRAINT [PK_MasterDataChangeBatch] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_MasterDataChangeBatch_Status] CHECK ([Status] IN ('PENDING','IN_PROGRESS','COMPLETED','FAILED','CANCELLED'))
) ON [PRIMARY]
GO

/* ===========================
   [CORE].[MasterDataChangeEvent]
=========================== */
CREATE TABLE [CORE].[MasterDataChangeEvent](
    [Id]                 BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [BatchId]            BIGINT NOT NULL,
    [DepartmentCode]     VARCHAR(20) NOT NULL,
    [SourceSchema]       VARCHAR(128) NOT NULL,
    [SourceTable]        VARCHAR(128) NOT NULL,
    [SourceRecordId]     INT NULL,
    [ChangeType]         VARCHAR(20) NOT NULL,
    [FieldChanges]       NVARCHAR(MAX) NULL,
    [ChangeSource]       VARCHAR(20) NOT NULL CONSTRAINT [DF_MasterDataChangeEvent_ChangeSource] DEFAULT ('UNKNOWN'),
    [AttributionStatus]  VARCHAR(20) NOT NULL CONSTRAINT [DF_MasterDataChangeEvent_AttributionStatus] DEFAULT ('NOT_FOUND'),
    [CreatedByUserId]    INT NULL,
    [UpdatedByUserId]    INT NULL,
    [ChangedByUserId]    INT NULL,
    [ChangedBySqlLogin]  NVARCHAR(256) NULL,
    [DatabaseUser]       NVARCHAR(256) NULL,
    [ApplicationName]    NVARCHAR(256) NULL,
    [ClientIp]           VARCHAR(64) NULL,
    [SqlStatement]       NVARCHAR(MAX) NULL,
    [AuditEventTime]     DATETIME2(3) NULL,
    [ChangedAt]          DATETIME2(3) NULL,
    [CdcStartLsn]        BINARY(10) NULL,
    [CdcSeqVal]          BINARY(10) NULL,
    [CdcOperation]       TINYINT NULL,
    [DetectionSource]    VARCHAR(20) NOT NULL CONSTRAINT [DF_MasterDataChangeEvent_DetectionSource] DEFAULT ('CDC'),
    [ProcessedAt]        DATETIME2(3) NOT NULL CONSTRAINT [DF_MasterDataChangeEvent_ProcessedAt] DEFAULT (SYSDATETIME()),
    CONSTRAINT [PK_MasterDataChangeEvent] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_MasterDataChangeEvent_Batch] FOREIGN KEY ([BatchId]) REFERENCES [CORE].[MasterDataChangeBatch]([Id]),
    CONSTRAINT [CK_MasterDataChangeEvent_ChangeType] CHECK ([ChangeType] IN ('INSERT','UPDATE','DELETE')),
    CONSTRAINT [CK_MasterDataChangeEvent_ChangeSource] CHECK ([ChangeSource] IN ('UI_API','DIRECT_SQL','UNKNOWN')),
    CONSTRAINT [CK_MasterDataChangeEvent_AttributionStatus] CHECK ([AttributionStatus] IN ('CONFIRMED','MATCHED','AMBIGUOUS','NOT_FOUND'))
) ON [PRIMARY]
GO

CREATE UNIQUE INDEX [UX_MasterDataChangeEvent_Cdc]
ON [CORE].[MasterDataChangeEvent]([SourceSchema],[SourceTable],[SourceRecordId],[CdcStartLsn],[CdcSeqVal],[ChangeType])
WHERE [CdcStartLsn] IS NOT NULL;
GO



CREATE TABLE [CORE].[CollectionChannelMaster]
(
    Id INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    CollectionChannelCode VARCHAR(30) NOT NULL,
    CollectionChannelName NVARCHAR(100) NOT NULL,
    IsOfflineCapable BIT NOT NULL DEFAULT (0),
    IsGatewayBased BIT NOT NULL DEFAULT (0),
    DisplayOrder INT NOT NULL DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_CollectionChannelMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_CollectionChannelMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
    CONSTRAINT PK_CollectionChannelMaster PRIMARY KEY([Id]),
	CONSTRAINT UQ_CollectionChannelMaster_Code UNIQUE([CollectionChannelCode])
);
GO



CREATE TABLE [CORE].[PaymentModeMaster]
(
    Id INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    PaymentModeCode VARCHAR(30) NOT NULL,
    PaymentModeName NVARCHAR(100) NOT NULL,
    RequiresReferenceNo BIT NOT NULL DEFAULT (0),
	RequiresReferenceDate BIT NOT NULL   CONSTRAINT [DF_PaymentModeMaster_RequiresReferenceDate] DEFAULT(0),
    IsElectronic BIT NOT NULL DEFAULT (0),
	DisplayOrder INT NOT NULL DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PaymentModeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PaymentModeMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT PK_PaymentModeMaster PRIMARY KEY(Id),
    CONSTRAINT UQ_PaymentModeMaster_Code UNIQUE(PaymentModeCode)
);
GO
/* ===========================
   [CORE].[GrievanceCategoryMaster]
   Complaint categories (priority / SLA defaults) for citizen grievances filed via the Karmitra
   AI chatbot guided flow and other channels.
=========================== */
CREATE TABLE [CORE].[GrievanceCategoryMaster](
    [Id]                [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CategoryCode]      [varchar](50) NOT NULL,
    [CategoryName]      [nvarchar](200) NOT NULL,
    [DepartmentId]      [int] NULL,
    [Priority]          [varchar](20) NOT NULL,
    [ResolutionSla]     [nvarchar](100) NULL,
    [EscalationLevel]   [nvarchar](100) NULL,
    [Description]       [nvarchar](500) NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_GrievanceCategoryMaster_IsActive] DEFAULT (1),
    [CreatedBy]         [int] NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_GrievanceCategoryMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]         [int] NULL,
    [UpdatedDate]       DATETIME NULL,

    CONSTRAINT [PK_GrievanceCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GrievanceCategoryMaster_CategoryCode] UNIQUE ([CategoryCode])
) ON [PRIMARY]
GO

ALTER TABLE [CORE].[GrievanceCategoryMaster] WITH CHECK ADD CONSTRAINT [FK_GrievanceCategoryMaster_DepartmentMaster_DepartmentId]
FOREIGN KEY([DepartmentId])
REFERENCES [CORE].[DepartmentMaster] ([Id]);
GO

/* ===========================
   [CORE].[Grievance]
   A citizen complaint/grievance record. DepartmentId/Priority default from GrievanceCategoryMaster
   at creation but can change afterwards (reassignment/escalation). SourceChannel distinguishes
   complaints filed via the Karmitra guided-flow chatbot from the web portal/walk-in/phone.
   CitizenId references [CORE].[CitizenMaster].
=========================== */
CREATE TABLE [CORE].[Grievance](
    [Id]                    [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GrievanceCategoryId]   [int] NOT NULL,
    [CitizenId]             [int] NULL,
    [ComplainantName]       [nvarchar](150) NOT NULL,
    [ComplainantMobile]     [varchar](15) NOT NULL,
    [Subject]               [nvarchar](200) NOT NULL,
    [Description]           [nvarchar](4000) NOT NULL,
    [Address]               [nvarchar](500) NULL,
    [DepartmentId]          [int] NULL,
    [Priority]              [varchar](20) NULL,
    [Status]                [varchar](20) NOT NULL CONSTRAINT [DF_Grievance_Status] DEFAULT ('NEW'),
    [SourceChannel]         [varchar](30) NOT NULL CONSTRAINT [DF_Grievance_SourceChannel] DEFAULT ('WEB_PORTAL'),
    [AssignedToUserId]      [int] NULL,
    [ReportedDate]          DATETIME NOT NULL CONSTRAINT [DF_Grievance_ReportedDate] DEFAULT (GETDATE()),
    [ResolvedDate]          DATETIME NULL,
    [ResolutionNotes]       [nvarchar](4000) NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_Grievance_IsActive] DEFAULT (1),
    [CreatedBy]             [int] NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_Grievance_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             [int] NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_Grievance_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,
    CONSTRAINT [PK_Grievance] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Grievance_GrievanceCategoryMaster] FOREIGN KEY ([GrievanceCategoryId]) REFERENCES [CORE].[GrievanceCategoryMaster] ([Id]),
    CONSTRAINT [FK_Grievance_DepartmentMaster] FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id]),
    CONSTRAINT [FK_Grievance_UserMaster] FOREIGN KEY ([AssignedToUserId]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [CK_Grievance_Status] CHECK ([Status] IN ('NEW','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','ESCALATED')),
    CONSTRAINT [CK_Grievance_SourceChannel] CHECK ([SourceChannel] IN ('KARMITRA_GUIDED_FLOW','WEB_PORTAL','WALK_IN','PHONE')),
    CONSTRAINT [FK_Grievance_Citizen] FOREIGN KEY ([CitizenId]) REFERENCES [CORE].[CitizenMaster] ([Id])
) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_Grievance_Status] ON [CORE].[Grievance] ([Status] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_Grievance_CitizenId] ON [CORE].[Grievance] ([CitizenId] ASC) WHERE [CitizenId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_Grievance_AssignedToUserId] ON [CORE].[Grievance] ([AssignedToUserId] ASC) WHERE [AssignedToUserId] IS NOT NULL;
GO

/* ===========================
   [CORE].[GrievanceAttachment]
   Evidence files attached to a grievance (AV-scanned before being stored).
=========================== */
CREATE TABLE [CORE].[GrievanceAttachment](
    [Id]                    [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GrievanceId]           [int] NOT NULL,
    [OriginalFileName]      [nvarchar](500) NOT NULL,
    [FileExtension]         [varchar](20) NOT NULL,
    [MimeType]              [varchar](200) NOT NULL,
    [FileSizeBytes]         [bigint] NOT NULL,
    [DocumentBindingId]     [int] NOT NULL,   -- FK -> CORE.DocumentBinding.Id; storage provider/path live in CORE.Document
    [ChecksumSha256]        [varchar](64) NULL,
    [ScanStatusCode]        [varchar](20) NULL,
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_GrievanceAttachment_IsActive] DEFAULT (1),
    [CreatedBy]             [int] NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_GrievanceAttachment_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             [int] NULL,
    [UpdatedDate]           DATETIME NULL,
    [MarkedForDeletion]         BIT NOT NULL CONSTRAINT [DF_GrievanceAttachment_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]     DATETIME NULL,

    CONSTRAINT [PK_GrievanceAttachment] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_GrievanceAttachment_Grievance] FOREIGN KEY ([GrievanceId]) REFERENCES [CORE].[Grievance] ([Id]),
    CONSTRAINT [FK_GrievanceAttachment_DocumentBinding] FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding] ([Id])
) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_GrievanceAttachment_GrievanceId] ON [CORE].[GrievanceAttachment] ([GrievanceId] ASC);
GO
CREATE NONCLUSTERED INDEX [IX_GrievanceAttachment_DocumentBindingId] ON [CORE].[GrievanceAttachment] ([DocumentBindingId] ASC);
GO

/* ===========================
   [CORE].[BHKMaster]
 =========================== */
CREATE TABLE [CORE].[BHKMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[BHKCode] [nvarchar](20) NOT NULL,
	[BHKName] [nvarchar](50) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[DisplayOrder] [int] NULL,
	-- Standard number of rooms for this BHK type = bedrooms + hall + kitchen (1R = 1, 1RK = 2, 1BHK = 3, 2BHK = 4 ...);
	-- half bedrooms count as 0.5 (1.5BHK = 3.5). NULL when the type has no standard count (Other).
	[RoomCount] [decimal](3,1) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_BHKMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_BHKMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_BHKMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

-- Same BHK code cannot be inserted twice
CREATE UNIQUE NONCLUSTERED INDEX [UX_BHKMaster_BHKCode]
ON [CORE].[BHKMaster] ([BHKCode] ASC)
GO
