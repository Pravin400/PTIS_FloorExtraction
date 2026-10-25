SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/* ===========================
   [WTIS].[BillingFrequencyMaster]
 =========================== */
CREATE TABLE [WTIS].[BillingFrequencyMaster](
    [Id]                   INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [BillingFrequencyCode] VARCHAR(30) NOT NULL,
    [BillingFrequency]     VARCHAR(100) NOT NULL,
    [PeriodsPerYear]       INT NOT NULL,
    [Description]          NVARCHAR(300) NULL,
    [IsActive]             BIT NOT NULL CONSTRAINT [DF_BillingFrequencyMaster_IsActive] DEFAULT (1),
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_BillingFrequencyMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,
    CONSTRAINT [PK_BillingFrequencyMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_BillingFrequencyMaster_BillingFrequencyCode] UNIQUE ([BillingFrequencyCode] ASC),
    CONSTRAINT [CK_BillingFrequencyMaster_Periods] CHECK ([PeriodsPerYear] > 0)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[BillingPeriod]
 =========================== */
CREATE TABLE [WTIS].[BillingPeriod](
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [BillingPeriodCode]         VARCHAR(30) NOT NULL,
    [FinancialYearId]           INT NOT NULL,
    [BillingFrequencyId]        INT NOT NULL,
    [PeriodFromDate]            DATE NOT NULL,
    [PeriodToDate]              DATE NOT NULL,
    [BillGenerationDate]        DATE NULL,
    [DueDate]                   DATE NULL,
    [GraceDays]                 INT NOT NULL CONSTRAINT [DF_BillingPeriod_GraceDays] DEFAULT (0),
    [CurrentPenaltyStartDate]   DATE NULL,
    [CurrentPenaltyEndDate]     DATE NULL,
    [PendingPenaltyStartDate]   DATE NULL,
    [PendingPenaltyEndDate]     DATE NULL,
    [IsReadingApprovalRequired] BIT NOT NULL CONSTRAINT [DF_BillingPeriod_IsReadingApprovalRequired] DEFAULT (1),
    [SequenceNo]                INT NOT NULL CONSTRAINT [DF_BillingPeriod_SequenceNo] DEFAULT (1),
    [IsActive]                  BIT NOT NULL CONSTRAINT [DF_BillingPeriod_IsActive] DEFAULT (1),
    [CreatedBy]                 INT NULL,
    [CreatedDate]               DATETIME NOT NULL CONSTRAINT [DF_BillingPeriod_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]                 INT NULL,
    [UpdatedDate]               DATETIME NULL,
    CONSTRAINT [PK_BillingPeriod] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_BillingPeriod_BillingPeriodCode] UNIQUE ([BillingPeriodCode] ASC),
    CONSTRAINT [UQ_BillingPeriod_Year_Frequency_Sequence] UNIQUE ([FinancialYearId] ASC, [BillingFrequencyId] ASC, [SequenceNo] ASC),
    CONSTRAINT [CK_BillingPeriod_Dates] CHECK ([PeriodToDate] >= [PeriodFromDate]),
    CONSTRAINT [CK_BillingPeriod_GraceDays] CHECK ([GraceDays] >= 0)
) ON [PRIMARY]
GO

-- FinancialYearId now points at the shared CORE.YearMaster (WTIS.FinancialYearMaster removed).
ALTER TABLE [WTIS].[BillingPeriod] WITH CHECK ADD CONSTRAINT [FK_BillingPeriod_YearMaster] FOREIGN KEY([FinancialYearId])
REFERENCES [CORE].[YearMaster] ([Id])
GO
ALTER TABLE [WTIS].[BillingPeriod] CHECK CONSTRAINT [FK_BillingPeriod_YearMaster]
GO

ALTER TABLE [WTIS].[BillingPeriod] WITH CHECK ADD CONSTRAINT [FK_BillingPeriod_BillingFrequencyMaster] FOREIGN KEY([BillingFrequencyId])
REFERENCES [WTIS].[BillingFrequencyMaster] ([Id])
GO
ALTER TABLE [WTIS].[BillingPeriod] CHECK CONSTRAINT [FK_BillingPeriod_BillingFrequencyMaster]
GO

/* ===========================
   [WTIS].[GeographyTypeMaster]
 =========================== */
CREATE TABLE [WTIS].[GeographyTypeMaster](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GeographyTypeCode] VARCHAR(30) NOT NULL,
    [GeographyType]     NVARCHAR(100) NOT NULL,
    [LevelNo]           INT NOT NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_GeographyTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_GeographyTypeMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    CONSTRAINT [PK_GeographyTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GeographyTypeMaster_Code] UNIQUE ([GeographyTypeCode] ASC),
    CONSTRAINT [UQ_GeographyTypeMaster_LevelNo] UNIQUE ([LevelNo] ASC),
    CONSTRAINT [CK_GeographyType_LevelNo] CHECK ([LevelNo] > 0)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[GeographyUnit]
 =========================== */
CREATE TABLE [WTIS].[GeographyUnit](
    [Id]                     INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [GeographyTypeId]        INT NOT NULL,
    [ParentGeographyUnitId]  INT NULL,
    [GeographyUnitCode]      VARCHAR(50) NOT NULL,
    [GeographyUnitName]      NVARCHAR(200) NOT NULL,
    [SearchSequence]         INT NULL,
    [MarkedForDeletion]      BIT NOT NULL CONSTRAINT [DF_GeographyUnit_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]  DATETIME NULL,
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_GeographyUnit_IsActive] DEFAULT (1),
    [CreatedBy]              INT NULL,
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_GeographyUnit_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]              INT NULL,
    [UpdatedDate]            DATETIME NULL,
    CONSTRAINT [PK_GeographyUnit] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_GeographyUnit_TypeId_UnitCode] UNIQUE ([GeographyTypeId] ASC, [GeographyUnitCode] ASC),
    CONSTRAINT [CK_GeographyUnit_NotOwnParent] CHECK ([ParentGeographyUnitId] <> [Id])
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[GeographyUnit] WITH CHECK ADD CONSTRAINT [FK_GeographyUnit_GeographyType] FOREIGN KEY([GeographyTypeId])
REFERENCES [WTIS].[GeographyTypeMaster] ([Id])
GO
ALTER TABLE [WTIS].[GeographyUnit] CHECK CONSTRAINT [FK_GeographyUnit_GeographyType]
GO

ALTER TABLE [WTIS].[GeographyUnit] WITH CHECK ADD CONSTRAINT [FK_GeographyUnit_ParentGeographyUnit] FOREIGN KEY([ParentGeographyUnitId])
REFERENCES [WTIS].[GeographyUnit] ([Id])
GO
ALTER TABLE [WTIS].[GeographyUnit] CHECK CONSTRAINT [FK_GeographyUnit_ParentGeographyUnit]
GO

/* ===========================
   [WTIS].[ConnectionTypeMaster]
 =========================== */
CREATE TABLE [WTIS].[ConnectionTypeMaster](
    [Id]                 INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ConnectionTypeCode] VARCHAR(30) NOT NULL,
    [ConnectionType]     NVARCHAR(100) NOT NULL,
    [Description]        NVARCHAR(300) NULL,
    [IsActive]           BIT NOT NULL CONSTRAINT [DF_ConnectionTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy]          INT NULL,
    [CreatedDate]        DATETIME NOT NULL CONSTRAINT [DF_ConnectionTypeMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]          INT NULL,
    [UpdatedDate]        DATETIME NULL,
    CONSTRAINT [PK_ConnectionTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ConnectionTypeMaster_ConnectionTypeCode] UNIQUE ([ConnectionTypeCode] ASC)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[ConnectionCategoryMaster]
 =========================== */
CREATE TABLE [WTIS].[ConnectionCategoryMaster](
    [Id]                     INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ConnectionCategoryCode] VARCHAR(30) NOT NULL,
    [ConnectionCategory]     NVARCHAR(150) NOT NULL,
    [BillingFrequencyId]     INT NULL,
    [IsMetered]              BIT NOT NULL CONSTRAINT [DF_ConnectionCategoryMaster_IsMetered] DEFAULT (1),
    [BillingMethod]          NVARCHAR(30) NOT NULL CONSTRAINT [DF_ConnectionCategoryMaster_BillingMethod] DEFAULT ('Metered'),
    [Description]            NVARCHAR(300) NULL,
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_ConnectionCategoryMaster_IsActive] DEFAULT (1),
    [CreatedBy]              INT NULL,
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_ConnectionCategoryMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]              INT NULL,
    [UpdatedDate]            DATETIME NULL,
    CONSTRAINT [PK_ConnectionCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ConnectionCategoryMaster_ConnectionCategoryCode] UNIQUE ([ConnectionCategoryCode] ASC),
    CONSTRAINT [CK_ConnectionCategoryMaster_BillingMethod] CHECK ([BillingMethod] IN ('Hybrid', 'Fixed', 'Annual', 'Telescopic', 'Slab', 'Flat', 'Metered'))
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[ConnectionCategoryMaster] WITH CHECK ADD CONSTRAINT [FK_ConnectionCategoryMaster_BillingFrequencyMaster] FOREIGN KEY([BillingFrequencyId])
REFERENCES [WTIS].[BillingFrequencyMaster] ([Id])
GO
ALTER TABLE [WTIS].[ConnectionCategoryMaster] CHECK CONSTRAINT [FK_ConnectionCategoryMaster_BillingFrequencyMaster]
GO

/* ===========================
   [WTIS].[TapSizeMaster]
 =========================== */
CREATE TABLE [WTIS].[TapSizeMaster](
    [Id]               INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TapSizeCode]      VARCHAR(30) NOT NULL,
    [TapSize]          NVARCHAR(100) NOT NULL,
    [NominalSizeValue] DECIMAL(10, 3) NULL,
    [SizeUnit]         VARCHAR(20) NULL,
    [IsActive]         BIT NOT NULL CONSTRAINT [DF_TapSizeMaster_IsActive] DEFAULT (1),
    [CreatedBy]        INT NULL,
    [CreatedDate]      DATETIME NOT NULL CONSTRAINT [DF_TapSizeMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]        INT NULL,
    [UpdatedDate]      DATETIME NULL,
    CONSTRAINT [PK_TapSizeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_TapSizeMaster_TapSizeCode] UNIQUE ([TapSizeCode] ASC),
    CONSTRAINT [CK_TapSizeMaster_SizeUnit] CHECK ([SizeUnit] IS NULL OR [SizeUnit] IN ('inch', 'mm', 'cm')),
    CONSTRAINT [CK_TapSizeMaster_NominalSizeValue] CHECK ([NominalSizeValue] IS NULL OR [NominalSizeValue] > 0)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[ReadingSourceMaster]
 =========================== */
CREATE TABLE [WTIS].[ReadingSourceMaster](
    [Id]                INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ReadingSourceCode] VARCHAR(30) NOT NULL,
    [ReadingSource]     NVARCHAR(100) NOT NULL,
    [IsActive]          BIT NOT NULL CONSTRAINT [DF_ReadingSourceMaster_IsActive] DEFAULT (1),
    [CreatedBy]         INT NULL,
    [CreatedDate]       DATETIME NOT NULL CONSTRAINT [DF_ReadingSourceMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]         INT NULL,
    [UpdatedDate]       DATETIME NULL,
    CONSTRAINT [PK_ReadingSourceMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ReadingSourceMaster_ReadingSourceCode] UNIQUE ([ReadingSourceCode] ASC)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[MeterTestStatusMaster]
 =========================== */
CREATE TABLE [WTIS].[MeterTestStatusMaster](
    [Id]                   INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [MeterTestStatusCode]  VARCHAR(30) NOT NULL,
    [MeterTestStatus]      NVARCHAR(100) NOT NULL,
    [IsActive]             BIT NOT NULL CONSTRAINT [DF_MeterTestStatusMaster_IsActive] DEFAULT (1),
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_MeterTestStatusMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,
    CONSTRAINT [PK_MeterTestStatusMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_MeterTestStatusMaster_MeterTestStatusCode] UNIQUE ([MeterTestStatusCode] ASC)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[MeterTypeMaster]
 =========================== */
CREATE TABLE [WTIS].[MeterTypeMaster](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [MeterTypeCode] VARCHAR(30) NOT NULL,
    [MeterType]     NVARCHAR(100) NOT NULL,
    [Description]   NVARCHAR(300) NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_MeterTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_MeterTypeMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,
    CONSTRAINT [PK_MeterTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_MeterTypeMaster_MeterTypeCode] UNIQUE ([MeterTypeCode] ASC)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[MeterStatusMaster]
   Tracks operational lifecycle of a physical meter (independent of
   MeterTestStatusMaster, which tracks lab/field test outcomes).
   Typical flow: Received -> Testing -> Installed -> Stopped / Removed / Damaged.
 =========================== */
CREATE TABLE [WTIS].[MeterStatusMaster](
    [Id]               INT IDENTITY(1,1) NOT NULL,
    [MeterStatusCode]  VARCHAR(30) NOT NULL,
    [MeterStatus]      NVARCHAR(100) NOT NULL,
    [Description]      NVARCHAR(300) NULL,
    [IsActive]         BIT NOT NULL CONSTRAINT [DF_MeterStatusMaster_IsActive] DEFAULT (1),
    [CreatedBy]        INT NULL,
    [CreatedDate]      DATETIME NOT NULL CONSTRAINT [DF_MeterStatusMaster_CreatedDate] DEFAULT (getdate()),
    [UpdatedBy]        INT NULL,
    [UpdatedDate]      DATETIME NULL,
    CONSTRAINT [PK_MeterStatusMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_MeterStatusMaster_Code] UNIQUE ([MeterStatusCode] ASC)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[ConsumerDetails]
   Citizen/consumer profile and authentication (combines the earlier
   CitizenAccount and Consumer concepts).
   ConsumerNo (e.g. CNB000001) is generated from Id after INSERT and
   populated in the same transaction/procedure via SCOPE_IDENTITY();
   kept nullable until then.
   NVARCHAR is used only for fields that may hold Marathi/Hindi text;
   codes, email, mobile and system values use VARCHAR.
   OTP is kept on this table by design; application logic must clear it
   after successful verification.
 =========================== */
CREATE TABLE [WTIS].[ConsumerDetails](
    [Id]                     BIGINT IDENTITY(1,1) NOT NULL,
    [ConsumerNo]             VARCHAR(50) NULL,
    [LegacyConsumerNo]       VARCHAR(60) NULL,
    [ConnectionHolderName]   NVARCHAR(250) NOT NULL,
    [DisplayName]            NVARCHAR(250) NULL,
    [Address]                NVARCHAR(1000) NOT NULL,
    [MobileNo]               VARCHAR(15) NULL,
    [Email]                  VARCHAR(320) NULL,
    [PreferredLanguage]      VARCHAR(10) NULL,
    [PasswordHash]           VARCHAR(500) NULL,
    [PasswordChangedDate]    DATETIME NULL,
    [OTP]                    VARCHAR(10) NULL,
    [IsMobileVerified]       BIT NOT NULL CONSTRAINT [DF_ConsumerDetails_IsMobileVerified] DEFAULT (0),
    [IsEmailVerified]        BIT NOT NULL CONSTRAINT [DF_ConsumerDetails_IsEmailVerified] DEFAULT (0),
    [FailedLoginAttempts]    INT NOT NULL CONSTRAINT [DF_ConsumerDetails_FailedLoginAttempts] DEFAULT (0),
    [LockoutEndDate]         DATETIME NULL,
    [Latitude]               DECIMAL(10, 7) NULL,
    [Longitude]              DECIMAL(10, 7) NULL,
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_ConsumerDetails_IsActive] DEFAULT (1),
    [CreatedBy]              BIGINT NULL,
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_ConsumerDetails_CreatedDate] DEFAULT (getdate()),
    [UpdatedBy]              BIGINT NULL,
    [UpdatedDate]            DATETIME NULL,
    [MarkedForDeletion]      BIT NOT NULL CONSTRAINT [DF_ConsumerDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate]  DATETIME NULL,
    CONSTRAINT [PK_ConsumerDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_ConsumerDetails_Latitude] CHECK ([Latitude] IS NULL OR ([Latitude] >= -90 AND [Latitude] <= 90)),
    CONSTRAINT [CK_ConsumerDetails_Longitude] CHECK ([Longitude] IS NULL OR ([Longitude] >= -180 AND [Longitude] <= 180))
) ON [PRIMARY]
GO

-- ConsumerNo is nullable during initial insert; filtered unique index allows
-- concurrent NULLs while still preventing duplicate generated numbers.
CREATE UNIQUE NONCLUSTERED INDEX [UX_ConsumerDetails_ConsumerNo] ON [WTIS].[ConsumerDetails] ([ConsumerNo])
WHERE [ConsumerNo] IS NOT NULL
GO

-- Login/consumer search. Mobile is intentionally non-unique.
CREATE NONCLUSTERED INDEX [IX_ConsumerDetails_MobileNo] ON [WTIS].[ConsumerDetails] ([MobileNo])
INCLUDE ([ConsumerNo], [ConnectionHolderName], [IsActive], [MarkedForDeletion])
WHERE [MobileNo] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_ConsumerDetails_Email] ON [WTIS].[ConsumerDetails] ([Email])
INCLUDE ([ConsumerNo], [ConnectionHolderName], [IsActive])
WHERE [Email] IS NOT NULL
GO

-- Supports migration/reconciliation from the legacy billing system.
CREATE NONCLUSTERED INDEX [IX_ConsumerDetails_LegacyConsumerNo] ON [WTIS].[ConsumerDetails] ([LegacyConsumerNo])
WHERE [LegacyConsumerNo] IS NOT NULL
GO

/* ===========================
   [WTIS].[WaterConnection]
   Physical/legal water connection owned by a consumer (one consumer can
   have many connections).
   ConnectionNo (e.g. WBC000125) is generated from Id after INSERT, same
   pattern as ConsumerDetails.ConsumerNo.
   TariffId is nullable and its FK intentionally deferred: WTIS.TariffMaster
   does not exist yet.
 =========================== */
CREATE TABLE [WTIS].[WaterConnection](
    [Id]                    BIGINT IDENTITY(1,1) NOT NULL,
    [ConsumerId]            BIGINT NOT NULL,
    [ConnectionNo]          VARCHAR(60) NULL,
    [OldConnectionNo]       VARCHAR(60) NULL,
    [GeographyUnitId]       INT NULL,
    [PropertyNo]            VARCHAR(50) NULL,
    [OwnerId]               BIGINT NULL,
    [ConnectionTypeId]      INT NOT NULL,
    [ConnectionCategoryId]  INT NOT NULL,
    [TapSizeId]             INT NULL,
    [TariffId]              BIGINT NULL,
    [NoOfPersons]           INT NOT NULL CONSTRAINT [DF_WaterConnection_NoOfPersons] DEFAULT (1),
    [ConnectionPurpose]     NVARCHAR(100) NULL,
    [ConnectionDate]        DATE NULL,
    [EffectiveFrom]         DATE NOT NULL,
    [EffectiveTo]           DATE NULL,
    [ConnectionStatus]      VARCHAR(30) NOT NULL CONSTRAINT [DF_WaterConnection_Status] DEFAULT ('Active'),
    [IsMeterRequired]       BIT NOT NULL CONSTRAINT [DF_WaterConnection_IsMeterRequired] DEFAULT (1),
    [IsActive]              BIT NOT NULL CONSTRAINT [DF_WaterConnection_IsActive] DEFAULT (1),
    [CreatedBy]             BIGINT NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_WaterConnection_CreatedDate] DEFAULT (getdate()),
    [UpdatedBy]             BIGINT NULL,
    [UpdatedDate]           DATETIME NULL,
    CONSTRAINT [PK_WaterConnection] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_WaterConnection_NoOfPersons] CHECK ([NoOfPersons] > 0),
    CONSTRAINT [CK_WaterConnection_Status] CHECK ([ConnectionStatus] IN ('Draft', 'PendingApproval', 'Active', 'Suspended', 'Closed', 'Transferred', 'Cancelled')),
    CONSTRAINT [CK_WaterConnection_EffectiveDates] CHECK ([EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom])
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[WaterConnection] WITH CHECK ADD CONSTRAINT [FK_WaterConnection_ConsumerDetails] FOREIGN KEY([ConsumerId])
REFERENCES [WTIS].[ConsumerDetails] ([Id])
GO
ALTER TABLE [WTIS].[WaterConnection] CHECK CONSTRAINT [FK_WaterConnection_ConsumerDetails]
GO

ALTER TABLE [WTIS].[WaterConnection] WITH CHECK ADD CONSTRAINT [FK_WaterConnection_ConnectionType] FOREIGN KEY([ConnectionTypeId])
REFERENCES [WTIS].[ConnectionTypeMaster] ([Id])
GO
ALTER TABLE [WTIS].[WaterConnection] CHECK CONSTRAINT [FK_WaterConnection_ConnectionType]
GO

ALTER TABLE [WTIS].[WaterConnection] WITH CHECK ADD CONSTRAINT [FK_WaterConnection_ConnectionCategory] FOREIGN KEY([ConnectionCategoryId])
REFERENCES [WTIS].[ConnectionCategoryMaster] ([Id])
GO
ALTER TABLE [WTIS].[WaterConnection] CHECK CONSTRAINT [FK_WaterConnection_ConnectionCategory]
GO

ALTER TABLE [WTIS].[WaterConnection] WITH CHECK ADD CONSTRAINT [FK_WaterConnection_TapSize] FOREIGN KEY([TapSizeId])
REFERENCES [WTIS].[TapSizeMaster] ([Id])
GO
ALTER TABLE [WTIS].[WaterConnection] CHECK CONSTRAINT [FK_WaterConnection_TapSize]
GO

ALTER TABLE [WTIS].[WaterConnection] WITH CHECK ADD CONSTRAINT [FK_WaterConnection_GeographyUnit] FOREIGN KEY([GeographyUnitId])
REFERENCES [WTIS].[GeographyUnit] ([Id])
GO
ALTER TABLE [WTIS].[WaterConnection] CHECK CONSTRAINT [FK_WaterConnection_GeographyUnit]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_WaterConnection_ConnectionNo] ON [WTIS].[WaterConnection] ([ConnectionNo])
WHERE [ConnectionNo] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_WaterConnection_ConsumerId] ON [WTIS].[WaterConnection] ([ConsumerId], [IsActive])
INCLUDE ([ConnectionNo], [PropertyNo], [ConnectionStatus], [ConnectionTypeId], [ConnectionCategoryId])
GO

CREATE NONCLUSTERED INDEX [IX_WaterConnection_PropertyNo] ON [WTIS].[WaterConnection] ([PropertyNo])
INCLUDE ([ConnectionNo], [ConsumerId], [ConnectionStatus])
WHERE [PropertyNo] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_WaterConnection_OwnerId] ON [WTIS].[WaterConnection] ([OwnerId])
INCLUDE ([ConnectionNo], [ConsumerId], [PropertyNo])
WHERE [OwnerId] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_WaterConnection_GeographyUnitId] ON [WTIS].[WaterConnection] ([GeographyUnitId], [IsActive])
INCLUDE ([ConnectionNo], [ConsumerId], [ConnectionTypeId], [ConnectionCategoryId])
WHERE [GeographyUnitId] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_WaterConnection_OldConnectionNo] ON [WTIS].[WaterConnection] ([OldConnectionNo])
WHERE [OldConnectionNo] IS NOT NULL
GO

/* ===========================
   [WTIS].[MeterDetails]
   Physical meter history for a water connection. A connection may have
   multiple rows over time (replacement history); IsCurrentlyActive marks
   the one meter presently in service.
 =========================== */
CREATE TABLE [WTIS].[MeterDetails](
    [Id]                   BIGINT IDENTITY(1,1) NOT NULL,
    [ConnectionId]         BIGINT NOT NULL,
    [MeterNo]              VARCHAR(60) NOT NULL,
    [OldMeterNo]           VARCHAR(60) NULL,
    [MeterTypeId]          INT NULL,
    [MeterSize]            VARCHAR(50) NULL,
    [MeterCompany]         VARCHAR(150) NULL,
    [MeterCost]            DECIMAL(18, 2) NULL,
    [ReceivingDate]        DATE NULL,
    [TestingDate]          DATE NULL,
    [MeterTestStatusId]    INT NULL,
    [ReadingBeforeTest]    DECIMAL(18, 3) NULL,
    [ReadingAfterTest]     DECIMAL(18, 3) NULL,
    [MaximumReading]       DECIMAL(18, 3) NULL,
    [InstallationReading]  DECIMAL(18, 3) NULL,
    [InstallationDate]     DATE NULL,
    [RemovalDate]          DATE NULL,
    [AverageReadingFlag]   BIT NOT NULL CONSTRAINT [DF_MeterDetails_AverageReadingFlag] DEFAULT (0),
    [AverageValue]         DECIMAL(18, 3) NULL,
    [MeterStatusId]        INT NOT NULL CONSTRAINT [DF_MeterDetails_MeterStatusId] DEFAULT (1),
    [IsCurrentlyActive]    BIT NOT NULL CONSTRAINT [DF_MeterDetails_IsCurrentlyActive] DEFAULT (1),
    [Remark]               NVARCHAR(500) NULL,
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_MeterDetails_CreatedDate] DEFAULT (getdate()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,
    CONSTRAINT [PK_MeterDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_MeterDetails_MeterNo] UNIQUE ([MeterNo] ASC),
    CONSTRAINT [CK_MeterDetails_TestReading] CHECK ([ReadingBeforeTest] IS NULL OR [ReadingAfterTest] IS NULL OR [ReadingAfterTest] >= 0),
    CONSTRAINT [CK_MeterDetails_RemovalDate] CHECK ([RemovalDate] IS NULL OR [InstallationDate] IS NULL OR [RemovalDate] >= [InstallationDate])
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[MeterDetails] WITH CHECK ADD CONSTRAINT [FK_MeterDetails_WaterConnection] FOREIGN KEY([ConnectionId])
REFERENCES [WTIS].[WaterConnection] ([Id])
GO
ALTER TABLE [WTIS].[MeterDetails] CHECK CONSTRAINT [FK_MeterDetails_WaterConnection]
GO

ALTER TABLE [WTIS].[MeterDetails] WITH CHECK ADD CONSTRAINT [FK_MeterDetails_MeterType] FOREIGN KEY([MeterTypeId])
REFERENCES [WTIS].[MeterTypeMaster] ([Id])
GO
ALTER TABLE [WTIS].[MeterDetails] CHECK CONSTRAINT [FK_MeterDetails_MeterType]
GO

ALTER TABLE [WTIS].[MeterDetails] WITH CHECK ADD CONSTRAINT [FK_MeterDetails_MeterTestStatus] FOREIGN KEY([MeterTestStatusId])
REFERENCES [WTIS].[MeterTestStatusMaster] ([Id])
GO
ALTER TABLE [WTIS].[MeterDetails] CHECK CONSTRAINT [FK_MeterDetails_MeterTestStatus]
GO

ALTER TABLE [WTIS].[MeterDetails] WITH CHECK ADD CONSTRAINT [FK_MeterDetails_MeterStatus] FOREIGN KEY([MeterStatusId])
REFERENCES [WTIS].[MeterStatusMaster] ([Id])
GO
ALTER TABLE [WTIS].[MeterDetails] CHECK CONSTRAINT [FK_MeterDetails_MeterStatus]
GO

CREATE NONCLUSTERED INDEX [IX_MeterDetails_ConnectionId] ON [WTIS].[MeterDetails] ([ConnectionId], [IsCurrentlyActive])
GO

-- Only one currently-active meter is allowed per connection.
CREATE UNIQUE NONCLUSTERED INDEX [UX_MeterDetails_ActiveConnection] ON [WTIS].[MeterDetails] ([ConnectionId])
WHERE [IsCurrentlyActive] = 1
GO

CREATE NONCLUSTERED INDEX [IX_MeterDetails_MeterTypeId] ON [WTIS].[MeterDetails] ([MeterTypeId])
GO

CREATE NONCLUSTERED INDEX [IX_MeterDetails_OldMeterNo] ON [WTIS].[MeterDetails] ([OldMeterNo])
WHERE [OldMeterNo] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_MeterDetails_MeterStatusId] ON [WTIS].[MeterDetails] ([MeterStatusId])
GO

CREATE NONCLUSTERED INDEX [IX_MeterDetails_MeterTestStatusId] ON [WTIS].[MeterDetails] ([MeterTestStatusId])
GO

/* ===========================
   [WTIS].[ReadingDetails]
   Meter/consumption readings per billing period. MeterId is nullable to
   allow non-metered or estimated readings.
 =========================== */
CREATE TABLE [WTIS].[ReadingDetails](
    [Id]                   BIGINT IDENTITY(1,1) NOT NULL,
    [ConnectionId]         BIGINT NOT NULL,
    [MeterId]              BIGINT NULL,
    [BillingPeriodId]      INT NOT NULL,
    [PreviousReadingDate]  DATETIME NULL,
    [PreviousReading]      DECIMAL(18, 3) NULL,
    [CurrentReadingDate]   DATETIME NULL,
    [CurrentReading]       DECIMAL(18, 3) NULL,
    [ConsumptionUnit]      DECIMAL(18, 3) NULL,
    [ReadingSourceId]      INT NULL,
    [EnteredByUserId]      INT NULL,
    [Status]               VARCHAR(30) NOT NULL CONSTRAINT [DF_ReadingDetails_Status] DEFAULT ('Draft'),
    [ApprovedByUserId]     INT NULL,
    [ApprovedDate]         DATETIME NULL,
    [ReadingImageUrl]      VARCHAR(1000) NULL,
    [Latitude]             DECIMAL(10, 7) NULL,
    [Longitude]            DECIMAL(10, 7) NULL,
    [IsAverage]            BIT NOT NULL CONSTRAINT [DF_ReadingDetails_IsAverage] DEFAULT (0),
    [AverageValue]         DECIMAL(18, 3) NULL,
    [ValidationCode]       VARCHAR(50) NULL,
    [ExceptionReason]      NVARCHAR(500) NULL,
    [Remark]               NVARCHAR(500) NULL,
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_ReadingDetails_CreatedDate] DEFAULT (getdate()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,
    CONSTRAINT [PK_ReadingDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_ReadingDetails_Status] CHECK ([Status] IN ('Draft', 'PendingApproval', 'Approved', 'Rejected')),
    CONSTRAINT [CK_ReadingDetails_Values] CHECK ([CurrentReading] IS NULL OR [PreviousReading] IS NULL OR [CurrentReading] >= [PreviousReading]),
    CONSTRAINT [CK_ReadingDetails_Consumption] CHECK ([ConsumptionUnit] IS NULL OR [ConsumptionUnit] >= 0),
    CONSTRAINT [CK_ReadingDetails_Latitude] CHECK ([Latitude] IS NULL OR [Latitude] BETWEEN -90 AND 90),
    CONSTRAINT [CK_ReadingDetails_Longitude] CHECK ([Longitude] IS NULL OR [Longitude] BETWEEN -180 AND 180),
    CONSTRAINT [CK_ReadingDetails_Date] CHECK ([CurrentReadingDate] IS NULL OR [PreviousReadingDate] IS NULL OR [CurrentReadingDate] >= [PreviousReadingDate])
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[ReadingDetails] WITH CHECK ADD CONSTRAINT [FK_ReadingDetails_WaterConnection] FOREIGN KEY([ConnectionId])
REFERENCES [WTIS].[WaterConnection] ([Id])
GO
ALTER TABLE [WTIS].[ReadingDetails] CHECK CONSTRAINT [FK_ReadingDetails_WaterConnection]
GO

ALTER TABLE [WTIS].[ReadingDetails] WITH CHECK ADD CONSTRAINT [FK_ReadingDetails_MeterDetails] FOREIGN KEY([MeterId])
REFERENCES [WTIS].[MeterDetails] ([Id])
GO
ALTER TABLE [WTIS].[ReadingDetails] CHECK CONSTRAINT [FK_ReadingDetails_MeterDetails]
GO

ALTER TABLE [WTIS].[ReadingDetails] WITH CHECK ADD CONSTRAINT [FK_ReadingDetails_BillingPeriod] FOREIGN KEY([BillingPeriodId])
REFERENCES [WTIS].[BillingPeriod] ([Id])
GO
ALTER TABLE [WTIS].[ReadingDetails] CHECK CONSTRAINT [FK_ReadingDetails_BillingPeriod]
GO

ALTER TABLE [WTIS].[ReadingDetails] WITH CHECK ADD CONSTRAINT [FK_ReadingDetails_ReadingSource] FOREIGN KEY([ReadingSourceId])
REFERENCES [WTIS].[ReadingSourceMaster] ([Id])
GO
ALTER TABLE [WTIS].[ReadingDetails] CHECK CONSTRAINT [FK_ReadingDetails_ReadingSource]
GO

CREATE NONCLUSTERED INDEX [IX_ReadingDetails_Connection_Date] ON [WTIS].[ReadingDetails] ([ConnectionId], [CurrentReadingDate] DESC)
GO

CREATE NONCLUSTERED INDEX [IX_ReadingDetails_Meter_Date] ON [WTIS].[ReadingDetails] ([MeterId], [CurrentReadingDate] DESC)
WHERE [MeterId] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_ReadingDetails_BillingPeriod] ON [WTIS].[ReadingDetails] ([BillingPeriodId], [ConnectionId])
GO

CREATE NONCLUSTERED INDEX [IX_ReadingDetails_Status] ON [WTIS].[ReadingDetails] ([Status], [BillingPeriodId])
GO

/* ===========================
   [WTIS].[ChargeHeadMaster]
 =========================== */
CREATE TABLE [WTIS].[ChargeHeadMaster](
    [Id]                  INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ChargeHeadCode]      VARCHAR(40) NOT NULL,
    [ChargeHeadName]      VARCHAR(150) NOT NULL,
    [ChargeHeadNameLocal] NVARCHAR(150) NULL,
    [Description]         NVARCHAR(500) NULL,
    [ChargeType]          VARCHAR(30) NOT NULL,
    [IsRefundable]        BIT NOT NULL CONSTRAINT [DF_ChargeHeadMaster_IsRefundable] DEFAULT (0),
    [IsRegularPay]        BIT NOT NULL CONSTRAINT [DF_ChargeHeadMaster_IsRegularPay] DEFAULT (0),
    [SequenceNo]          INT NOT NULL CONSTRAINT [DF_ChargeHeadMaster_SequenceNo] DEFAULT (1),
    [IsActive]            BIT NOT NULL CONSTRAINT [DF_ChargeHeadMaster_IsActive] DEFAULT (1),
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_ChargeHeadMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,
    CONSTRAINT [PK_ChargeHeadMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ChargeHeadMaster_ChargeHeadCode] UNIQUE ([ChargeHeadCode] ASC),
    CONSTRAINT [CK_ChargeHeadMaster_ChargeType] CHECK ([ChargeType] IN ('Penalty', 'Charge', 'Tax', 'Fee', 'Deposit')),
    CONSTRAINT [CK_ChargeHeadMaster_SequenceNo] CHECK ([SequenceNo] > 0)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[TariffMaster]
 =========================== */
CREATE TABLE [WTIS].[TariffMaster](
    [Id]                   BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [YearId]               INT NOT NULL,
    [ConnectionTypeId]     INT NOT NULL,
    [ConnectionCategoryId] INT NOT NULL,
    [TapSizeId]            INT NOT NULL,
    [TariffCode]           VARCHAR(60) NOT NULL,
    [TariffName]           NVARCHAR(200) NOT NULL,
    [EffectiveFrom]        DATE NOT NULL,
    [EffectiveTo]          DATE NULL,
    [Description]          NVARCHAR(500) NULL,
    [IsActive]             BIT NOT NULL CONSTRAINT [DF_TariffMaster_IsActive] DEFAULT (1),
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_TariffMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,
    CONSTRAINT [PK_TariffMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_TariffMaster_TariffCode] UNIQUE ([TariffCode] ASC),
    CONSTRAINT [UQ_TariffMaster_Configuration] UNIQUE ([YearId],[ConnectionTypeId],[ConnectionCategoryId],[TapSizeId],[EffectiveFrom]),
    CONSTRAINT [CK_TariffMaster_EffectiveDate] CHECK ([EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom])
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[TariffMaster] WITH CHECK ADD CONSTRAINT [FK_TariffMaster_Year] FOREIGN KEY([YearId])
REFERENCES [CORE].[YearMaster] ([Id])
GO
ALTER TABLE [WTIS].[TariffMaster] CHECK CONSTRAINT [FK_TariffMaster_Year]
GO

ALTER TABLE [WTIS].[TariffMaster] WITH CHECK ADD CONSTRAINT [FK_TariffMaster_ConnectionType] FOREIGN KEY([ConnectionTypeId])
REFERENCES [WTIS].[ConnectionTypeMaster] ([Id])
GO
ALTER TABLE [WTIS].[TariffMaster] CHECK CONSTRAINT [FK_TariffMaster_ConnectionType]
GO

ALTER TABLE [WTIS].[TariffMaster] WITH CHECK ADD CONSTRAINT [FK_TariffMaster_ConnectionCategory] FOREIGN KEY([ConnectionCategoryId])
REFERENCES [WTIS].[ConnectionCategoryMaster] ([Id])
GO
ALTER TABLE [WTIS].[TariffMaster] CHECK CONSTRAINT [FK_TariffMaster_ConnectionCategory]
GO

ALTER TABLE [WTIS].[TariffMaster] WITH CHECK ADD CONSTRAINT [FK_TariffMaster_TapSize] FOREIGN KEY([TapSizeId])
REFERENCES [WTIS].[TapSizeMaster] ([Id])
GO
ALTER TABLE [WTIS].[TariffMaster] CHECK CONSTRAINT [FK_TariffMaster_TapSize]
GO

CREATE NONCLUSTERED INDEX [IX_TariffMaster_EffectiveDates] ON [WTIS].[TariffMaster] ([EffectiveFrom], [EffectiveTo])
GO

/* ===========================
   [WTIS].[TariffChargeDetail]
 =========================== */
CREATE TABLE [WTIS].[TariffChargeDetail](
    [Id]              BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TariffId]        BIGINT NOT NULL,
    [ChargeHeadId]    INT NOT NULL,
    [GeographyUnitId] INT NULL,
    [Amount]          DECIMAL(19, 4) NOT NULL,
    [IsDynamic]       BIT NOT NULL CONSTRAINT [DF_TariffChargeDetail_IsDynamic] DEFAULT (0),
    [IsMandatory]     BIT NOT NULL CONSTRAINT [DF_TariffChargeDetail_IsMandatory] DEFAULT (1),
    [SequenceNo]      INT NOT NULL CONSTRAINT [DF_TariffChargeDetail_SequenceNo] DEFAULT (1),
    [IsActive]        BIT NOT NULL CONSTRAINT [DF_TariffChargeDetail_IsActive] DEFAULT (1),
    [CreatedBy]       INT NULL,
    [CreatedDate]     DATETIME NOT NULL CONSTRAINT [DF_TariffChargeDetail_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]       INT NULL,
    [UpdatedDate]     DATETIME NULL,
    CONSTRAINT [PK_TariffChargeDetail] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_TariffChargeDetail_Tariff_ChargeHead_Geography] UNIQUE ([TariffId], [ChargeHeadId], [GeographyUnitId]),
    CONSTRAINT [CK_TariffChargeDetail_Amount] CHECK ([Amount] >= 0),
    CONSTRAINT [CK_TariffChargeDetail_SequenceNo] CHECK ([SequenceNo] > 0)
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[TariffChargeDetail] WITH CHECK ADD CONSTRAINT [FK_TariffChargeDetail_Tariff] FOREIGN KEY([TariffId])
REFERENCES [WTIS].[TariffMaster] ([Id])
GO
ALTER TABLE [WTIS].[TariffChargeDetail] CHECK CONSTRAINT [FK_TariffChargeDetail_Tariff]
GO

ALTER TABLE [WTIS].[TariffChargeDetail] WITH CHECK ADD CONSTRAINT [FK_TariffChargeDetail_ChargeHead] FOREIGN KEY([ChargeHeadId])
REFERENCES [WTIS].[ChargeHeadMaster] ([Id])
GO
ALTER TABLE [WTIS].[TariffChargeDetail] CHECK CONSTRAINT [FK_TariffChargeDetail_ChargeHead]
GO

ALTER TABLE [WTIS].[TariffChargeDetail] WITH CHECK ADD CONSTRAINT [FK_TariffChargeDetail_Geography] FOREIGN KEY([GeographyUnitId])
REFERENCES [WTIS].[GeographyUnit] ([Id])
GO
ALTER TABLE [WTIS].[TariffChargeDetail] CHECK CONSTRAINT [FK_TariffChargeDetail_Geography]
GO

CREATE NONCLUSTERED INDEX [IX_TariffChargeDetail_ChargeHeadId] ON [WTIS].[TariffChargeDetail] ([ChargeHeadId])
GO

CREATE NONCLUSTERED INDEX [IX_TariffChargeDetail_GeographyUnitId] ON [WTIS].[TariffChargeDetail] ([GeographyUnitId])
WHERE [GeographyUnitId] IS NOT NULL
GO

/* ===========================
   [WTIS].[TariffFormulaMaster]
   Controlled billing calculation strategies referenced by TariffSlabDetail.FormulaCode
 =========================== */
CREATE TABLE [WTIS].[TariffFormulaMaster](
    [Id]          INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [FormulaCode] VARCHAR(50) NOT NULL,
    [FormulaName] VARCHAR(150) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [IsActive]    BIT NOT NULL CONSTRAINT [DF_TariffFormulaMaster_IsActive] DEFAULT (1),
    [CreatedBy]   INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_TariffFormulaMaster_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]   INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_TariffFormulaMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_TariffFormulaMaster_FormulaCode] UNIQUE ([FormulaCode] ASC),
    CONSTRAINT [UQ_TariffFormulaMaster_FormulaName] UNIQUE ([FormulaName] ASC)
) ON [PRIMARY]
GO

/* ===========================
   [WTIS].[TariffSlabDetail]
 =========================== */
CREATE TABLE [WTIS].[TariffSlabDetail](
    [Id]                  BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TariffId]            BIGINT NOT NULL,
    [GeographyUnitId]     INT NULL,
    [FromUnit]            DECIMAL(19, 4) NOT NULL,   -- slab start (inclusive); a flat/default tariff is FromUnit = 0, ToUnit = NULL
    [ToUnit]              DECIMAL(19, 4) NULL,       -- slab end (exclusive); NULL = open-ended top slab
    [UnitRate]            DECIMAL(19, 4) NULL,
    [FixedCharge]         DECIMAL(19, 4) NOT NULL CONSTRAINT [DF_TariffSlabDetail_FixedCharge] DEFAULT (0),
    [MinimumCharge]       DECIMAL(19, 4) NOT NULL CONSTRAINT [DF_TariffSlabDetail_MinimumCharge] DEFAULT (0),
    [MaximumCharge]       DECIMAL(19, 4) NULL,
    [PerConnectionAmount] DECIMAL(19, 4) NULL,
    [FormulaCode]         VARCHAR(50) NULL,
    [SortOrder]           INT NOT NULL CONSTRAINT [DF_TariffSlabDetail_SortOrder] DEFAULT (1),
    [IsActive]            BIT NOT NULL CONSTRAINT [DF_TariffSlabDetail_IsActive] DEFAULT (1),
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_TariffSlabDetail_CreatedDate] DEFAULT (sysutcdatetime()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,
    CONSTRAINT [PK_TariffSlabDetail] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_TariffSlabDetail_FixedCharge] CHECK ([FixedCharge] >= 0),
    CONSTRAINT [CK_TariffSlabDetail_MinimumCharge] CHECK ([MinimumCharge] >= 0),
    CONSTRAINT [CK_TariffSlabDetail_SortOrder] CHECK ([SortOrder] > 0),
    CONSTRAINT [CK_TariffSlabDetail_FromUnit] CHECK ([FromUnit] >= 0),
    CONSTRAINT [CK_TariffSlabDetail_ToUnit] CHECK ([ToUnit] IS NULL OR [ToUnit] >= 0),
    CONSTRAINT [CK_TariffSlabDetail_UnitRate] CHECK ([UnitRate] IS NULL OR [UnitRate] >= 0),
    CONSTRAINT [CK_TariffSlabDetail_PerConnectionAmount] CHECK ([PerConnectionAmount] IS NULL OR [PerConnectionAmount] >= 0),
    CONSTRAINT [CK_TariffSlabDetail_MaximumCharge] CHECK ([MaximumCharge] IS NULL OR [MaximumCharge] >= [MinimumCharge]),
    CONSTRAINT [CK_TariffSlabDetail_UnitRange] CHECK ([ToUnit] IS NULL OR [ToUnit] >= [FromUnit])
) ON [PRIMARY]
GO

ALTER TABLE [WTIS].[TariffSlabDetail] WITH CHECK ADD CONSTRAINT [FK_TariffSlabDetail_Tariff] FOREIGN KEY([TariffId])
REFERENCES [WTIS].[TariffMaster] ([Id])
GO
ALTER TABLE [WTIS].[TariffSlabDetail] CHECK CONSTRAINT [FK_TariffSlabDetail_Tariff]
GO

ALTER TABLE [WTIS].[TariffSlabDetail] WITH CHECK ADD CONSTRAINT [FK_TariffSlabDetail_Geography] FOREIGN KEY([GeographyUnitId])
REFERENCES [WTIS].[GeographyUnit] ([Id])
GO
ALTER TABLE [WTIS].[TariffSlabDetail] CHECK CONSTRAINT [FK_TariffSlabDetail_Geography]
GO

ALTER TABLE [WTIS].[TariffSlabDetail] WITH CHECK ADD CONSTRAINT [FK_TariffSlabDetail_FormulaCode] FOREIGN KEY([FormulaCode])
REFERENCES [WTIS].[TariffFormulaMaster] ([FormulaCode])
GO
ALTER TABLE [WTIS].[TariffSlabDetail] CHECK CONSTRAINT [FK_TariffSlabDetail_FormulaCode]
GO

CREATE NONCLUSTERED INDEX [IX_TariffSlabDetail_TariffId] ON [WTIS].[TariffSlabDetail] ([TariffId], [SortOrder])
GO

CREATE NONCLUSTERED INDEX [IX_TariffSlabDetail_GeographyUnitId] ON [WTIS].[TariffSlabDetail] ([GeographyUnitId])
WHERE [GeographyUnitId] IS NOT NULL
GO

