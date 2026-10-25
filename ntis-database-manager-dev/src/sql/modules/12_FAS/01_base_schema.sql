-- ============================================================================
-- Module: 12_FAS (Fire Audit)  |  Script: 01_base_schema.sql
-- Stage 1: configuration spine. Masters only (*Master suffix, same as AMS/CORE).
-- FKs allowed: CORE.UlbMaster, CORE.UserMaster, and FAS itself. Never PTIS.
-- ============================================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ===========================================================================
   FAS.JurisdictionOverlayMaster
   Legal + operational overlay. UlbId row beats StateName row beats national.
   =========================================================================== */
CREATE TABLE [FAS].[JurisdictionOverlayMaster](
    [Id]                      INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UlbId]                   INT NULL,
    [StateCode]               VARCHAR(10) NULL,
    [StateName]               NVARCHAR(100) NULL,
    [ActTitle]                NVARCHAR(300) NULL,
    [RulesTitle]              NVARCHAR(300) NULL,
    [MunicipalActTitle]       NVARCHAR(300) NULL,
    [ByeLawTitle]             NVARCHAR(300) NULL,
    [SectionRefs]             NVARCHAR(400) NULL,
    [IssuingAuthorityLabel]   NVARCHAR(200) NOT NULL,
    [CertificateFormCode]     VARCHAR(40) NULL,
    [AuditReportFormCode]     VARCHAR(40) NULL,
    [HasOwnFireBrigade]       BIT NOT NULL CONSTRAINT [DF_JurisdictionOverlayMaster_HasOwnFireBrigade] DEFAULT (1),
    [ValidityMonths]          INT NOT NULL,
    [ReminderOffsetsCsv]      VARCHAR(40) NULL,
    [EffectiveFrom]           DATE NULL,
    [EffectiveTo]             DATE NULL,
    [IsActive]                BIT NOT NULL CONSTRAINT [DF_JurisdictionOverlayMaster_IsActive] DEFAULT (1),
    [CreatedBy]               INT NULL,
    [CreatedDate]             DATETIME NOT NULL CONSTRAINT [DF_JurisdictionOverlayMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]               INT NULL,
    [UpdatedDate]             DATETIME NULL,
    CONSTRAINT [PK_JurisdictionOverlayMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_JurisdictionOverlayMaster_UlbMaster]
        FOREIGN KEY ([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id]),
    CONSTRAINT [CK_JurisdictionOverlayMaster_ValidityMonths] CHECK ([ValidityMonths] > 0),
    CONSTRAINT [CK_JurisdictionOverlayMaster_Scope]
        CHECK ([UlbId] IS NOT NULL OR [StateName] IS NOT NULL OR [StateCode] IS NULL),
    CONSTRAINT [CK_JurisdictionOverlayMaster_DateRange]
        CHECK ([EffectiveFrom] IS NULL OR [EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_JurisdictionOverlayMaster_Ulb]
    ON [FAS].[JurisdictionOverlayMaster] ([UlbId]) WHERE [UlbId] IS NOT NULL AND [IsActive] = 1;
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_JurisdictionOverlayMaster_State]
    ON [FAS].[JurisdictionOverlayMaster] ([StateName]) WHERE [UlbId] IS NULL AND [StateName] IS NOT NULL AND [IsActive] = 1;
GO
-- One active state-level overlay per StateCode. Filtered so national and ULB
-- rows (StateCode null) and several ULBs in one state can coexist.
-- A plain UNIQUE(StateCode) would allow only one NULL on SQL Server.
CREATE UNIQUE NONCLUSTERED INDEX [UX_JurisdictionOverlayMaster_StateCode]
    ON [FAS].[JurisdictionOverlayMaster] ([StateCode])
    WHERE [UlbId] IS NULL AND [StateCode] IS NOT NULL AND [IsActive] = 1;
GO

/* ===========================================================================
   FAS.OccupancyTypeMaster
   =========================================================================== */
CREATE TABLE [FAS].[OccupancyTypeMaster](
    [Id]                  INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [OccupancyCode]       VARCHAR(20) NOT NULL,
    [OccupancyName]       NVARCHAR(100) NOT NULL,
    [OccupancyNameLocal]  NVARCHAR(150) NULL,
    [ParentOccupancyId]   INT NULL,
    [Description]         NVARCHAR(500) NULL,
    [RiskBand]            VARCHAR(20) NULL,
    [StateCode]           VARCHAR(10) NULL,
    [DisplayOrder]        INT NOT NULL CONSTRAINT [DF_OccupancyTypeMaster_DisplayOrder] DEFAULT (0),
    [IsActive]            BIT NOT NULL CONSTRAINT [DF_OccupancyTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_OccupancyTypeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,
    CONSTRAINT [PK_OccupancyTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_OccupancyTypeMaster_Code_State] UNIQUE ([OccupancyCode], [StateCode]),
    CONSTRAINT [FK_OccupancyTypeMaster_Parent]
        FOREIGN KEY ([ParentOccupancyId]) REFERENCES [FAS].[OccupancyTypeMaster] ([Id]),
    CONSTRAINT [CK_OccupancyTypeMaster_RiskBand]
        CHECK ([RiskBand] IS NULL OR [RiskBand] IN ('Low', 'Medium', 'High', 'Critical'))
);
GO

/* ===========================================================================
   FAS.RequirementBandMaster
   =========================================================================== */
CREATE TABLE [FAS].[RequirementBandMaster](
    [Id]                 INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [BandCode]           VARCHAR(30) NOT NULL,
    [BandName]           NVARCHAR(100) NOT NULL,
    [MinHeightMeters]    DECIMAL(6,2) NULL,
    [MaxHeightMeters]    DECIMAL(6,2) NULL,
    [MinAreaSqm]         DECIMAL(12,2) NULL,
    [MaxAreaSqm]         DECIMAL(12,2) NULL,
    [MinOccupantLoad]    INT NULL,
    [MaxOccupantLoad]    INT NULL,
    [UlbId]              INT NULL,
    [StateCode]          VARCHAR(10) NULL,
    [DisplayOrder]       INT NOT NULL CONSTRAINT [DF_RequirementBandMaster_DisplayOrder] DEFAULT (0),
    [IsActive]           BIT NOT NULL CONSTRAINT [DF_RequirementBandMaster_IsActive] DEFAULT (1),
    [CreatedBy]          INT NULL,
    [CreatedDate]        DATETIME NOT NULL CONSTRAINT [DF_RequirementBandMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]          INT NULL,
    [UpdatedDate]        DATETIME NULL,
    CONSTRAINT [PK_RequirementBandMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RequirementBandMaster_Code_Scope] UNIQUE ([BandCode], [UlbId], [StateCode]),
    CONSTRAINT [FK_RequirementBandMaster_UlbMaster]
        FOREIGN KEY ([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id]),
    CONSTRAINT [CK_RequirementBandMaster_Height]
        CHECK ([MinHeightMeters] IS NULL OR [MaxHeightMeters] IS NULL OR [MaxHeightMeters] >= [MinHeightMeters]),
    CONSTRAINT [CK_RequirementBandMaster_Area]
        CHECK ([MinAreaSqm] IS NULL OR [MaxAreaSqm] IS NULL OR [MaxAreaSqm] >= [MinAreaSqm]),
    CONSTRAINT [CK_RequirementBandMaster_Occupants]
        CHECK ([MinOccupantLoad] IS NULL OR [MaxOccupantLoad] IS NULL OR [MaxOccupantLoad] >= [MinOccupantLoad])
);
GO

/* ===========================================================================
   FAS.ChecklistItemMaster
   =========================================================================== */
CREATE TABLE [FAS].[ChecklistItemMaster](
    [Id]             INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ItemCode]       VARCHAR(30) NOT NULL,
    [InspectionDomain] VARCHAR(20) NOT NULL CONSTRAINT [DF_ChecklistItemMaster_InspectionDomain] DEFAULT ('FireSystems'),
    [Category]       VARCHAR(40) NOT NULL,
    [Description]    NVARCHAR(400) NOT NULL,
    [UnitOfMeasure]  VARCHAR(30) NULL,
    [DisplayOrder]   INT NOT NULL CONSTRAINT [DF_ChecklistItemMaster_DisplayOrder] DEFAULT (0),
    [IsActive]       BIT NOT NULL CONSTRAINT [DF_ChecklistItemMaster_IsActive] DEFAULT (1),
    [CreatedBy]      INT NULL,
    [CreatedDate]    DATETIME NOT NULL CONSTRAINT [DF_ChecklistItemMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]      INT NULL,
    [UpdatedDate]    DATETIME NULL,
    CONSTRAINT [PK_ChecklistItemMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ChecklistItemMaster_ItemCode] UNIQUE ([ItemCode]),
    CONSTRAINT [CK_ChecklistItemMaster_InspectionDomain]
        CHECK ([InspectionDomain] IN ('FireSystems', 'LifeSafety'))
);
GO

/* ===========================================================================
   FAS.RequirementMatrixMaster
   =========================================================================== */
CREATE TABLE [FAS].[RequirementMatrixMaster](
    [Id]                  INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [OccupancyTypeId]     INT NOT NULL,
    [RequirementBandId]   INT NOT NULL,
    [UlbId]               INT NULL,
    [StateCode]           VARCHAR(10) NULL,
    [EffectiveFrom]       DATE NULL,
    [EffectiveTo]         DATE NULL,
    [ApplicabilityCode]   VARCHAR(20) NOT NULL CONSTRAINT [DF_RequirementMatrixMaster_Applicability] DEFAULT ('APPLICABLE'),
    [ApplicabilityNote]   NVARCHAR(400) NULL,
    [Remarks]             NVARCHAR(400) NULL,
    [IsActive]            BIT NOT NULL CONSTRAINT [DF_RequirementMatrixMaster_IsActive] DEFAULT (1),
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_RequirementMatrixMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,
    CONSTRAINT [PK_RequirementMatrixMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RequirementMatrixMaster_OccupancyType]
        FOREIGN KEY ([OccupancyTypeId]) REFERENCES [FAS].[OccupancyTypeMaster] ([Id]),
    CONSTRAINT [FK_RequirementMatrixMaster_RequirementBand]
        FOREIGN KEY ([RequirementBandId]) REFERENCES [FAS].[RequirementBandMaster] ([Id]),
    CONSTRAINT [FK_RequirementMatrixMaster_UlbMaster]
        FOREIGN KEY ([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id]),
    CONSTRAINT [CK_RequirementMatrixMaster_DateRange]
        CHECK ([EffectiveFrom] IS NULL OR [EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom]),
    CONSTRAINT [CK_RequirementMatrixMaster_Applicability]
        CHECK ([ApplicabilityCode] IN ('APPLICABLE', 'NOT_APPLICABLE'))
);
GO

CREATE NONCLUSTERED INDEX [IX_RequirementMatrixMaster_Lookup]
    ON [FAS].[RequirementMatrixMaster] ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode]);
GO

/* One active row per occupancy + band + scope (UlbId + StateCode, nulls equal).
   Dated versions may follow each other. Overlapping effective windows may not.
   A null EffectiveFrom/EffectiveTo is an open-ended window. */
CREATE TRIGGER [FAS].[TR_RequirementMatrixMaster_NoOverlap]
ON [FAS].[RequirementMatrixMaster]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        INNER JOIN [FAS].[RequirementMatrixMaster] AS m
            ON  m.[OccupancyTypeId] = i.[OccupancyTypeId]
            AND m.[RequirementBandId] = i.[RequirementBandId]
            AND (
                    m.[UlbId] = i.[UlbId]
                    OR (m.[UlbId] IS NULL AND i.[UlbId] IS NULL)
                )
            AND (
                    m.[StateCode] = i.[StateCode]
                    OR (m.[StateCode] IS NULL AND i.[StateCode] IS NULL)
                )
            AND m.[Id] <> i.[Id]
            AND m.[IsActive] = 1
            AND i.[IsActive] = 1
            AND (
                    i.[EffectiveFrom] IS NULL
                    OR m.[EffectiveTo] IS NULL
                    OR i.[EffectiveFrom] <= m.[EffectiveTo]
                )
            AND (
                    m.[EffectiveFrom] IS NULL
                    OR i.[EffectiveTo] IS NULL
                    OR m.[EffectiveFrom] <= i.[EffectiveTo]
                )
    )
    BEGIN
        THROW 51200, 'Only one active RequirementMatrixMaster row may cover the same occupancy, band, and scope for an overlapping effective period.', 1;
    END
END
GO

/* ===========================================================================
   FAS.RequirementMatrixItemMaster
   =========================================================================== */
CREATE TABLE [FAS].[RequirementMatrixItemMaster](
    [Id]                     INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RequirementMatrixId]    INT NOT NULL,
    [ChecklistItemId]        INT NOT NULL,
    [MinQuantity]            DECIMAL(10,2) NULL,
    [IsMandatory]            BIT NOT NULL CONSTRAINT [DF_RequirementMatrixItemMaster_IsMandatory] DEFAULT (1),
    [Remarks]                NVARCHAR(300) NULL,
    [DisplayOrder]           INT NOT NULL CONSTRAINT [DF_RequirementMatrixItemMaster_DisplayOrder] DEFAULT (0),
    [IsActive]               BIT NOT NULL CONSTRAINT [DF_RequirementMatrixItemMaster_IsActive] DEFAULT (1),
    [CreatedBy]              INT NULL,
    [CreatedDate]            DATETIME NOT NULL CONSTRAINT [DF_RequirementMatrixItemMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]              INT NULL,
    [UpdatedDate]            DATETIME NULL,
    CONSTRAINT [PK_RequirementMatrixItemMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RequirementMatrixItemMaster_Matrix_Item] UNIQUE ([RequirementMatrixId], [ChecklistItemId]),
    CONSTRAINT [FK_RequirementMatrixItemMaster_Matrix]
        FOREIGN KEY ([RequirementMatrixId]) REFERENCES [FAS].[RequirementMatrixMaster] ([Id]),
    CONSTRAINT [FK_RequirementMatrixItemMaster_ChecklistItem]
        FOREIGN KEY ([ChecklistItemId]) REFERENCES [FAS].[ChecklistItemMaster] ([Id])
);
GO

/* ===========================================================================
   FAS.ApplicationTypeMaster
   =========================================================================== */
CREATE TABLE [FAS].[ApplicationTypeMaster](
    [Id]                        INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ApplicationTypeCode]       VARCHAR(30) NOT NULL,
    [ApplicationTypeName]       NVARCHAR(100) NOT NULL,
    [Description]               NVARCHAR(400) NULL,
    [IsEnabled]                 BIT NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_IsEnabled] DEFAULT (0),
    [RequiresInspection]        BIT NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_RequiresInspection] DEFAULT (1),
    [RequiresLicensedAgency]    BIT NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_RequiresLicensedAgency] DEFAULT (0),
    [DisplayOrder]              INT NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_DisplayOrder] DEFAULT (0),
    [IsActive]                  BIT NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy]                 INT NULL,
    [CreatedDate]               DATETIME NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]                 INT NULL,
    [UpdatedDate]               DATETIME NULL,
    CONSTRAINT [PK_ApplicationTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_ApplicationTypeMaster_Code] UNIQUE ([ApplicationTypeCode])
);
GO

/* ===========================================================================
   FAS.StatusMaster
   =========================================================================== */
CREATE TABLE [FAS].[StatusMaster](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [StatusCode]    VARCHAR(40) NOT NULL,
    [StatusName]    NVARCHAR(80) NOT NULL,
    [IsTerminal]    BIT NOT NULL CONSTRAINT [DF_StatusMaster_IsTerminal] DEFAULT (0),
    [DisplayOrder]  INT NOT NULL CONSTRAINT [DF_StatusMaster_DisplayOrder] DEFAULT (0),
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_StatusMaster_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_StatusMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,
    CONSTRAINT [PK_StatusMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_StatusMaster_StatusCode] UNIQUE ([StatusCode])
);
GO

/* ===========================================================================
   FAS.DocumentTypeMaster
   =========================================================================== */
CREATE TABLE [FAS].[DocumentTypeMaster](
    [Id]                  INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DocumentCode]        VARCHAR(30) NOT NULL,
    [DocumentName]        NVARCHAR(200) NOT NULL,
    [ApplicationTypeId]   INT NULL,
    [OccupancyTypeId]     INT NULL,
    [UlbId]               INT NULL,
    [IsMandatory]         BIT NOT NULL CONSTRAINT [DF_DocumentTypeMaster_IsMandatory] DEFAULT (1),
    [AcceptedFormats]     VARCHAR(80) NULL,
    [DisplayOrder]        INT NOT NULL CONSTRAINT [DF_DocumentTypeMaster_DisplayOrder] DEFAULT (0),
    [IsActive]            BIT NOT NULL CONSTRAINT [DF_DocumentTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_DocumentTypeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,
    CONSTRAINT [PK_DocumentTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_DocumentTypeMaster_Scope] UNIQUE ([DocumentCode], [ApplicationTypeId], [OccupancyTypeId], [UlbId]),
    CONSTRAINT [FK_DocumentTypeMaster_ApplicationType]
        FOREIGN KEY ([ApplicationTypeId]) REFERENCES [FAS].[ApplicationTypeMaster] ([Id]),
    CONSTRAINT [FK_DocumentTypeMaster_OccupancyType]
        FOREIGN KEY ([OccupancyTypeId]) REFERENCES [FAS].[OccupancyTypeMaster] ([Id]),
    CONSTRAINT [FK_DocumentTypeMaster_UlbMaster]
        FOREIGN KEY ([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id])
);
GO

/* ===========================================================================
   FAS.FireStationMaster
   Ward is TEXT. PtisWardId is a hint with NO foreign key.
   =========================================================================== */
CREATE TABLE [FAS].[FireStationMaster](
    [Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UlbId]         INT NOT NULL,
    [StationCode]   VARCHAR(30) NOT NULL,
    [StationName]   NVARCHAR(150) NOT NULL,
    [Address]       NVARCHAR(400) NULL,
    [WardCode]      NVARCHAR(30) NULL,
    [WardName]      NVARCHAR(120) NULL,
    [PtisWardId]    INT NULL,
    [Latitude]      DECIMAL(9,6) NULL,
    [Longitude]     DECIMAL(9,6) NULL,
    [IsActive]      BIT NOT NULL CONSTRAINT [DF_FireStationMaster_IsActive] DEFAULT (1),
    [CreatedBy]     INT NULL,
    [CreatedDate]   DATETIME NOT NULL CONSTRAINT [DF_FireStationMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]     INT NULL,
    [UpdatedDate]   DATETIME NULL,
    CONSTRAINT [PK_FireStationMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_FireStationMaster_Ulb_Code] UNIQUE ([UlbId], [StationCode]),
    CONSTRAINT [FK_FireStationMaster_UlbMaster]
        FOREIGN KEY ([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id]),
    CONSTRAINT [CK_FireStationMaster_Latitude]  CHECK ([Latitude]  IS NULL OR [Latitude]  BETWEEN -90.0  AND 90.0),
    CONSTRAINT [CK_FireStationMaster_Longitude] CHECK ([Longitude] IS NULL OR [Longitude] BETWEEN -180.0 AND 180.0)
);
GO

CREATE NONCLUSTERED INDEX [IX_FireStationMaster_UlbId]
    ON [FAS].[FireStationMaster] ([UlbId]);
GO

/* ===========================================================================
   FAS.FeeHeadMaster
   Authorized charge names. Interest and grace are data, not a national rate.
   =========================================================================== */
CREATE TABLE [FAS].[FeeHeadMaster](
    [Id]                  INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [HeadCode]            VARCHAR(20) NOT NULL,
    [HeadName]            NVARCHAR(100) NOT NULL,
    [Obligation]          VARCHAR(20) NOT NULL,
    [IsStatutory]         BIT NOT NULL CONSTRAINT [DF_FeeHeadMaster_IsStatutory] DEFAULT (0),
    [IsAuthorized]        BIT NOT NULL CONSTRAINT [DF_FeeHeadMaster_IsAuthorized] DEFAULT (1),
    [InterestRatePercent] DECIMAL(7,3) NULL,
    [GracePeriodDays]     INT NULL,
    [LegalCitation]       NVARCHAR(400) NULL,
    [DisplayOrder]        INT NOT NULL CONSTRAINT [DF_FeeHeadMaster_DisplayOrder] DEFAULT (0),
    [IsActive]            BIT NOT NULL CONSTRAINT [DF_FeeHeadMaster_IsActive] DEFAULT (1),
    [CreatedBy]           INT NULL,
    [CreatedDate]         DATETIME NOT NULL CONSTRAINT [DF_FeeHeadMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]           INT NULL,
    [UpdatedDate]         DATETIME NULL,
    CONSTRAINT [PK_FeeHeadMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_FeeHeadMaster_HeadCode] UNIQUE ([HeadCode]),
    CONSTRAINT [CK_FeeHeadMaster_Obligation] CHECK ([Obligation] IN ('Application', 'Annual')),
    CONSTRAINT [CK_FeeHeadMaster_Interest] CHECK ([InterestRatePercent] IS NULL OR [InterestRatePercent] >= 0),
    CONSTRAINT [CK_FeeHeadMaster_Grace] CHECK ([GracePeriodDays] IS NULL OR [GracePeriodDays] >= 0)
);
GO

/* ===========================================================================
   FAS.FeeRuleMaster
   Applicability, exemption and formula. ULB row beats national.
   No FK into a valuation / ASR schema.
   =========================================================================== */
CREATE TABLE [FAS].[FeeRuleMaster](
    [Id]                   INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [FeeHeadId]            INT NOT NULL,
    [ApplicationTypeId]    INT NULL,
    [OccupancyTypeId]      INT NULL,
    [RequirementBandId]    INT NULL,
    [UlbId]                INT NULL,
    [StateCode]            VARCHAR(10) NULL,
    [FormulaKind]          VARCHAR(20) NOT NULL,
    [RateValue]            DECIMAL(18,4) NULL,
    [ExemptionPercent]     DECIMAL(5,2) NOT NULL CONSTRAINT [DF_FeeRuleMaster_Exemption] DEFAULT (0),
    [UsesValuationAdapter] BIT NOT NULL CONSTRAINT [DF_FeeRuleMaster_UsesValuation] DEFAULT (0),
    [LegalCitation]        NVARCHAR(400) NULL,
    [EffectiveFrom]        DATE NULL,
    [EffectiveTo]          DATE NULL,
    [IsActive]             BIT NOT NULL CONSTRAINT [DF_FeeRuleMaster_IsActive] DEFAULT (1),
    [CreatedBy]            INT NULL,
    [CreatedDate]          DATETIME NOT NULL CONSTRAINT [DF_FeeRuleMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]            INT NULL,
    [UpdatedDate]          DATETIME NULL,
    CONSTRAINT [PK_FeeRuleMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_FeeRuleMaster_FeeHead]
        FOREIGN KEY ([FeeHeadId]) REFERENCES [FAS].[FeeHeadMaster] ([Id]),
    CONSTRAINT [FK_FeeRuleMaster_ApplicationType]
        FOREIGN KEY ([ApplicationTypeId]) REFERENCES [FAS].[ApplicationTypeMaster] ([Id]),
    CONSTRAINT [FK_FeeRuleMaster_OccupancyType]
        FOREIGN KEY ([OccupancyTypeId]) REFERENCES [FAS].[OccupancyTypeMaster] ([Id]),
    CONSTRAINT [FK_FeeRuleMaster_RequirementBand]
        FOREIGN KEY ([RequirementBandId]) REFERENCES [FAS].[RequirementBandMaster] ([Id]),
    CONSTRAINT [FK_FeeRuleMaster_UlbMaster]
        FOREIGN KEY ([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id]),
    CONSTRAINT [CK_FeeRuleMaster_Formula]
        CHECK ([FormulaKind] IN ('None', 'Flat', 'PerSqm', 'Slab', 'Percentage')),
    CONSTRAINT [CK_FeeRuleMaster_Exemption]
        CHECK ([ExemptionPercent] >= 0 AND [ExemptionPercent] <= 100),
    CONSTRAINT [CK_FeeRuleMaster_DateRange]
        CHECK ([EffectiveFrom] IS NULL OR [EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom])
);
GO

CREATE NONCLUSTERED INDEX [IX_FeeRuleMaster_Head_Ulb]
    ON [FAS].[FeeRuleMaster] ([FeeHeadId], [UlbId]);
GO

