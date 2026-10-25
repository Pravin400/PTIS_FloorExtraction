SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================================
-- AMS MODULE: CORE / LOOKUP / MASTER-DATA TABLES
-- Generated from live AMS schema (NewAssetDB @ 192.168.1.21) on 2026-07-17.
-- These tables are referenced by the business tables in 02_base_schema.sql.
-- Some FKs on these tables point to [PTIS] tables (Floor/ConstructionType/
-- SubZone/Ward/Zone/Mouja masters live in PTIS on the live DB, not AMS) --
-- those are created by the 02_PTIS module, which runs before 10_AMS.
-- ============================================================================

/****** Object:  Table [AMS].[AssetCategoryMaster] ******/
CREATE TABLE [AMS].[AssetCategoryMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[CategoryCode] [varchar](100) NOT NULL,
	[CategoryName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[ValuationType] [varchar](20) NOT NULL,
	[IsMovable] [bit] NOT NULL,
	[HasFloorDetails] [bit] NOT NULL,
	[HasInventory] [bit] NOT NULL,
	[IsInventoryMandatory] [bit] NOT NULL,
	[HasLegalCompliance] [bit] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetCategoryMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetCategoryMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetCategoryMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AssetCategoryMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssetCategoryMaster_CategoryCode] UNIQUE NONCLUSTERED
(
	[CategoryCode] ASC
),
 CONSTRAINT [UQ_AssetCategoryMaster_CategoryName] UNIQUE NONCLUSTERED
(
	[CategoryName] ASC
)
)
GO

/****** Object:  Table [AMS].[AssetTypeMaster] ******/
CREATE TABLE [AMS].[AssetTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[AssetCategoryId] [int] NOT NULL,
	[TypeCode] [varchar](50) NOT NULL,
	[TypeName] [varchar](200) NOT NULL,
	[TypeNameLocal] [nvarchar](200) NULL,
	[Description] [nvarchar](500) NULL,
	[IsSubUnit] [bit] NOT NULL CONSTRAINT [DF_AssetTypeMaster_IsSubUnit] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetTypeMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetTypeMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[AllowUnitRegistration] [bit] NOT NULL CONSTRAINT [DF_AssetTypeMaster_AllowUnitRegistration] DEFAULT (0),
	[AllowRoomRegistration] [bit] NOT NULL CONSTRAINT [DF_AssetTypeMaster_AllowRoomRegistration] DEFAULT (0),
	[AssetWardNo] [varchar](50) NULL,
	[ColorCode] [varchar](20) NULL,
	[BorderColor] [varchar](20) NULL,
 CONSTRAINT [PK_AssetTypeMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssetTypeMaster_TypeCode] UNIQUE NONCLUSTERED
(
	[TypeCode] ASC
),
 CONSTRAINT [UQ_AssetTypeMaster_TypeName] UNIQUE NONCLUSTERED
(
	[TypeName] ASC
)
)
GO

/****** Object:  Table [AMS].[MoujaMaster] ******/
CREATE TABLE [AMS].[MoujaMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[MoujaNo] [varchar](20) NOT NULL,
	[MoujaName] [nvarchar](100) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_MoujaMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_MoujaMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_MoujaMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_MoujaMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_MoujaMaster_MoujaName] UNIQUE NONCLUSTERED
(
	[MoujaName] ASC
),
 CONSTRAINT [UQ_MoujaMaster_MoujaNo] UNIQUE NONCLUSTERED
(
	[MoujaNo] ASC
)
)
GO

/****** Object:  Table [AMS].[SubZoneDetailsForCV] ******/
CREATE TABLE [AMS].[SubZoneDetailsForCV](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[MoujaId] [int] NOT NULL,
	[SubZoneNo] [nvarchar](20) NOT NULL,
	[SubZoneName] [nvarchar](500) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubZoneDetailsForCV_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_SubZoneDetailsForCV_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_SubZoneDetailsForCV_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_SubZoneDetailsForCV] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_SubZoneDetailsForCV_Mouja_SubZoneNo] UNIQUE NONCLUSTERED
(
	[MoujaId] ASC, [SubZoneNo] ASC
)
)
GO

-- SubZoneName is NOT NULL but most rows carry a blank name, so uniqueness is enforced only
-- for real names (a UNIQUE constraint cannot be filtered, hence a unique index).
CREATE UNIQUE NONCLUSTERED INDEX [UX_SubZoneDetailsForCV_Mouja_SubZoneName]
	ON [AMS].[SubZoneDetailsForCV] ([MoujaId] ASC, [SubZoneName] ASC)
	WHERE [SubZoneName] <> N''
GO

/****** Object:  Table [AMS].[AssessmentYearRangeMaster] ******/
CREATE TABLE [AMS].[AssessmentYearRangeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FromYear] [int] NOT NULL,
	[ToYear] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssessmentYearRangeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssessmentYearRangeMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssessmentYearRangeMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AssessmentYearRangeMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssessmentYearRangeMaster_FromYear_ToYear] UNIQUE NONCLUSTERED
(
	[FromYear] ASC, [ToYear] ASC
)
)
GO

ALTER TABLE [AMS].[AssessmentYearRangeMaster] WITH CHECK ADD CONSTRAINT [CK_AssessmentYearRangeMaster_ValidYear] CHECK ([FromYear]<=[ToYear])
GO
ALTER TABLE [AMS].[AssessmentYearRangeMaster] CHECK CONSTRAINT [CK_AssessmentYearRangeMaster_ValidYear]
GO

/****** Object:  Table [AMS].[TypeOfUseGroupMaster] ******/
CREATE TABLE [AMS].[TypeOfUseGroupMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TypeOfUseGroupCode] [varchar](10) NOT NULL,
	[GroupName] [nvarchar](50) NOT NULL,
	[GroupIcon] [varchar](50) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsFloorWiseRateApplicable] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMaster_IsFloorWiseRateApplicable] DEFAULT (0),
 CONSTRAINT [PK_TypeOfUseGroupMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_TypeOfUseGroupMaster] UNIQUE NONCLUSTERED
(
	[GroupName] ASC
),
 CONSTRAINT [UQ_TypeOfUseGroupMaster_TypeOfUseGroupCode] UNIQUE NONCLUSTERED
(
	[TypeOfUseGroupCode] ASC
)
)
GO

/****** Object:  Table [AMS].[TypeOfUseMaster] ******/
CREATE TABLE [AMS].[TypeOfUseMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetCategoryId] [int] NOT NULL,
	[AssetTypeId] [int] NOT NULL,
	[TypeOfUseCode] [varchar](10) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[Type] [varchar](5) NULL,
	[TypeOfUseGroupId] [int] NULL,
	[SearchSequence] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetTypeOfUseMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetTypeOfUseMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetTypeOfUseMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AMS_TypeOfUseMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AMS_TypeOfUseMaster_AssetType_Code] UNIQUE NONCLUSTERED
(
	[AssetTypeId] ASC, [TypeOfUseCode] ASC
),
 CONSTRAINT [UQ_AMS_TypeOfUseMaster_AssetType_Description] UNIQUE NONCLUSTERED
(
	[AssetTypeId] ASC, [Description] ASC
)
)
GO

/****** Object:  Table [AMS].[SubTypeOfUseMaster] ******/
CREATE TABLE [AMS].[SubTypeOfUseMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[TypeOfUseId] [int] NOT NULL,
	[Description] [nvarchar](200) NOT NULL,
	[SearchSequence] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetSubTypeOfUseMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetSubTypeOfUseMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetSubTypeOfUseMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AMS_SubTypeOfUseMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AMS_SubTypeOfUseMaster_TypeOfUse_Description] UNIQUE NONCLUSTERED
(
	[Description] ASC, [TypeOfUseId] ASC
)
)
GO

/****** Object:  Table [AMS].[UseFactorCVMaster] ******/
CREATE TABLE [AMS].[UseFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TypeOfUseId] [int] NOT NULL,
	[SubTypeOfUseId] [int] NOT NULL,
	[Factor] [decimal](5, 2) NOT NULL,
	[AssessmentYearRangeId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_UseFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_UseFactorCVMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_UseFactorCVMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_UseFactorCVMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_UseFactorCVMaster_Type_SubType] UNIQUE NONCLUSTERED
(
	[TypeOfUseId] ASC, [SubTypeOfUseId] ASC, [AssessmentYearRangeId] ASC
)
)
GO

/****** Object:  Table [AMS].[FloorFactorCVMaster] ******/
CREATE TABLE [AMS].[FloorFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FloorId] [int] NOT NULL,
	[FactorWithLift] [decimal](5, 2) NULL,
	[FactorWithoutLift] [decimal](5, 2) NULL,
	[AssessmentYearRangeId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_FloorFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_FloorFactorCVMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_FloorFactorCVMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_FloorFactorCVMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_FloorFactorCVMaster] UNIQUE NONCLUSTERED
(
	[FloorId] ASC, [AssessmentYearRangeId] ASC
)
)
GO

/****** Object:  Table [AMS].[AgeFactorCVMaster] ******/
CREATE TABLE [AMS].[AgeFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ConstructionTypeId] [int] NOT NULL,
	[AgeFrom] [int] NOT NULL,
	[AgeTo] [int] NOT NULL,
	[Factor] [decimal](5, 2) NOT NULL,
	[AssessmentYearRangeId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AgeFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AgeFactorCVMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AgeFactorCVMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AgeFactorCVMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AgeFactorCVMaster] UNIQUE NONCLUSTERED
(
	[ConstructionTypeId] ASC, [AgeFrom] ASC, [AgeTo] ASC, [AssessmentYearRangeId] ASC
)
)
GO

/****** Object:  Table [AMS].[NatureFactorCVMaster] ******/
CREATE TABLE [AMS].[NatureFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ConstructionTypeId] [int] NOT NULL,
	[Factor] [decimal](5, 2) NOT NULL,
	[AssessmentYearRangeId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_NatureFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_NatureFactorCVMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_NatureFactorCVMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_NatureFactorCVMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_NatureFactorCVMaster] UNIQUE NONCLUSTERED
(
	[ConstructionTypeId] ASC, [AssessmentYearRangeId] ASC
)
)
GO

/****** Object:  Table [AMS].[ApplicationTypeMaster] ******/
CREATE TABLE [AMS].[ApplicationTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ApplicationTypeCode] [varchar](20) NOT NULL,
	[ApplicationTypeName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[DisplayOrder] [int] NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_DisplayOrder] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_ApplicationTypeMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_ApplicationTypeMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_ApplicationTypeMaster_Code] UNIQUE NONCLUSTERED
(
	[ApplicationTypeCode] ASC
),
 CONSTRAINT [UQ_ApplicationTypeMaster_Name] UNIQUE NONCLUSTERED
(
	[ApplicationTypeName] ASC
)
)
GO

/****** Object:  Table [AMS].[GSTMaster] ******/
CREATE TABLE [AMS].[GSTMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TaxCode] [varchar](50) NOT NULL,
	[TaxName] [nvarchar](100) NOT NULL,
	[TaxPercentage] [decimal](5, 2) NOT NULL,
	[EffectiveFromDate] [date] NOT NULL,
	[EffectiveToDate] [date] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GSTMaster_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_GSTMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GSTMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_GSTMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_GSTMaster_TaxCode] UNIQUE NONCLUSTERED
(
	[TaxCode] ASC
),
 CONSTRAINT [UQ_GSTMaster_TaxName] UNIQUE NONCLUSTERED
(
	[TaxName] ASC
)
)
GO

ALTER TABLE [AMS].[GSTMaster] WITH CHECK ADD CONSTRAINT [CK_GSTMaster_TaxPercentage] CHECK ([TaxPercentage]>=(0) AND [TaxPercentage]<=(100))
GO
ALTER TABLE [AMS].[GSTMaster] CHECK CONSTRAINT [CK_GSTMaster_TaxPercentage]
GO

/****** Object:  Table [AMS].[PenaltyRuleMaster] ******/
CREATE TABLE [AMS].[PenaltyRuleMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PenaltyCode] [varchar](50) NOT NULL,
	[PenaltyName] [nvarchar](100) NOT NULL,
	[CalculationType] [varchar](50) NOT NULL,
	[PenaltyValue] [decimal](18, 2) NOT NULL,
	[GracePeriodDays] [int] NOT NULL CONSTRAINT [DF_PenaltyRuleMaster_GracePeriodDays] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PenaltyRuleMaster_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PenaltyRuleMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PenaltyRuleMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_PenaltyRuleMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_PenaltyRuleMaster_PenaltyCode] UNIQUE NONCLUSTERED
(
	[PenaltyCode] ASC
),
 CONSTRAINT [UQ_PenaltyRuleMaster_PenaltyName] UNIQUE NONCLUSTERED
(
	[PenaltyName] ASC
)
)
GO

ALTER TABLE [AMS].[PenaltyRuleMaster] WITH CHECK ADD CONSTRAINT [CK_PenaltyRuleMaster_CalculationType] CHECK ([CalculationType]='Percentage' OR [CalculationType]='FlatAmount' OR [CalculationType]='PerDay')
GO
ALTER TABLE [AMS].[PenaltyRuleMaster] CHECK CONSTRAINT [CK_PenaltyRuleMaster_CalculationType]
GO

ALTER TABLE [AMS].[PenaltyRuleMaster] WITH CHECK ADD CONSTRAINT [CK_PenaltyRuleMaster_GracePeriodDays] CHECK ([GracePeriodDays]>=(0))
GO
ALTER TABLE [AMS].[PenaltyRuleMaster] CHECK CONSTRAINT [CK_PenaltyRuleMaster_GracePeriodDays]
GO

ALTER TABLE [AMS].[PenaltyRuleMaster] WITH CHECK ADD CONSTRAINT [CK_PenaltyRuleMaster_PenaltyValue] CHECK ([PenaltyValue]>=(0))
GO
ALTER TABLE [AMS].[PenaltyRuleMaster] CHECK CONSTRAINT [CK_PenaltyRuleMaster_PenaltyValue]
GO

/****** Object:  Table [AMS].[AssetRoomTypeMaster] ******/
CREATE TABLE [AMS].[AssetRoomTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[AssetCategoryId] [int] NULL,
	[AssetTypeId] [int] NOT NULL,
	[RoomTypeCode] [varchar](20) NULL,
	[RoomTypeName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetRoomTypeMaster_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetRoomTypeMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetRoomTypeMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetRoomTypeMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssetRoomTypeMaster_Asset_RoomTypeCode] UNIQUE NONCLUSTERED
(
	[AssetTypeId] ASC, [RoomTypeCode] ASC
),
 CONSTRAINT [UQ_AssetRoomTypeMaster_Asset_RoomTypeName] UNIQUE NONCLUSTERED
(
	[AssetTypeId] ASC, [RoomTypeName] ASC
)
)
GO

/****** Object:  Table [AMS].[AssetPhotoType] ******/
CREATE TABLE [AMS].[AssetPhotoType](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[AssetCategoryId] [int] NULL,
	[AssetTypeId] [int] NULL,
	[PhotoTypeCode] [varchar](50) NOT NULL,
	[PhotoTypeName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsRequired] [bit] NOT NULL CONSTRAINT [DF_AssetPhotoType_IsRequired] DEFAULT (0),
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetPhotoType_IsActive] DEFAULT (1),
	[IsSubUnit] [bit] NOT NULL CONSTRAINT [DF_AssetPhotoType_IsSubUnit] DEFAULT (0),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetPhotoType_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetPhotoType_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetPhotoType] PRIMARY KEY CLUSTERED
(
	[Id] ASC 
),
 CONSTRAINT [UQ_AssetPhotoType_AssetCategoryId_AssetTypeId_PhotoTypeCode] UNIQUE NONCLUSTERED
(
	[AssetCategoryId] ASC, [AssetTypeId] ASC, [PhotoTypeCode] ASC
),
 CONSTRAINT [UQ_AssetPhotoType_AssetCategoryId_AssetTypeId_PhotoTypeName] UNIQUE NONCLUSTERED
(
	[AssetCategoryId] ASC, [AssetTypeId] ASC, [PhotoTypeName] ASC
)
)
GO

/****** Object:  Table [AMS].[AssetRentDocumentType] ******/
CREATE TABLE [AMS].[AssetRentDocumentType](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[DocumentTypeCode] [varchar](50) NOT NULL,
	[DocumentTypeName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsRequired] [bit] NOT NULL CONSTRAINT [DF_AssetRentDocumentType_IsRequired] DEFAULT (0),
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetRentDocumentType_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetRentDocumentType_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetRentDocumentType_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetRentDocumentType] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssetRentDocumentType_Code] UNIQUE NONCLUSTERED
(
	[DocumentTypeCode] ASC
),
 CONSTRAINT [UQ_AssetRentDocumentType_Name] UNIQUE NONCLUSTERED
(
	[DocumentTypeName] ASC
)
)
GO

/****** Object:  Table [AMS].[InventoryDocumentType] ******/
CREATE TABLE [AMS].[InventoryDocumentType](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[DocumentTypeCode] [varchar](50) NOT NULL,
	[DocumentTypeName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsRequired] [bit] NOT NULL CONSTRAINT [DF_InventoryDocumentType_IsRequired] DEFAULT (0),
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_InventoryDocumentType_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_InventoryDocumentType_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_InventoryDocumentType_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_InventoryDocumentType] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_InventoryDocumentType_Code] UNIQUE NONCLUSTERED
(
	[DocumentTypeCode] ASC
),
 CONSTRAINT [UQ_InventoryDocumentType_Name] UNIQUE NONCLUSTERED
(
	[DocumentTypeName] ASC
)
)
GO


/****** Object:  Table [AMS].[InventoryItemCategoryMaster] ******/
CREATE TABLE [AMS].[InventoryItemCategoryMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TypeCode] [varchar](20) NOT NULL,
	[TypeName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[DepreciationRate] [decimal](5, 4) NOT NULL CONSTRAINT [DF_InventoryItemCategoryMaster_DepreciationRate] DEFAULT (0.10),
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_InventoryItemCategoryMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_InventoryItemCategoryMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_InventoryItemCategoryMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[AssetCategoryId] [int] NOT NULL CONSTRAINT [DF_InventoryItemCategoryMaster_AssetCategoryId] DEFAULT (1),
 CONSTRAINT [PK_InventoryItemCategoryMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_InventoryItemCategoryMaster_TypeCode] UNIQUE NONCLUSTERED
(
	[TypeCode] ASC
),
 CONSTRAINT [UQ_InventoryItemCategoryMaster_TypeName] UNIQUE NONCLUSTERED
(
	[TypeName] ASC
)
)
GO


/****** Object:  Table [AMS].[InventoryItemNameMaster] ******/
CREATE TABLE [AMS].[InventoryItemNameMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[InventoryItemCategoryId] [int] NOT NULL,
	[SubTypeCode] [varchar](50) NOT NULL,
	[SubTypeName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_InventoryItemNameMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_InventoryItemNameMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_InventoryItemNameMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_InventoryItemNameMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_InventoryItemNameMaster_CategorySubTypeCode] UNIQUE NONCLUSTERED
(
	[InventoryItemCategoryId] ASC, [SubTypeCode] ASC
),
 CONSTRAINT [UQ_InventoryItemNameMaster_CategorySubTypeName] UNIQUE NONCLUSTERED
(
	[InventoryItemCategoryId] ASC, [SubTypeName] ASC
)
)
GO


/****** Object:  Table [AMS].[InventoryItemModelMaster] ******/
CREATE TABLE [AMS].[InventoryItemModelMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[InventoryItemNameId] [int] NOT NULL,
	[ModelName] [nvarchar](150) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_InventoryItemModelMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_InventoryItemModelMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_InventoryItemModelMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_InventoryItemModelMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_InventoryItemModelMaster_ItemNameModel] UNIQUE NONCLUSTERED
(
	[InventoryItemNameId] ASC, [ModelName] ASC
)
)
GO


/****** Object:  Table [AMS].[AssetConditionMaster] ******/
CREATE TABLE [AMS].[AssetConditionMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ConditionCategory] [nvarchar](20) NOT NULL,
	[CategoryId] [int] NOT NULL,
	[ConditionName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[ConditionFactor] [decimal](5, 4) NOT NULL CONSTRAINT [DF_AssetConditionMaster_ConditionFactor] DEFAULT (1.0),
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetConditionMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetConditionMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetConditionMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AssetConditionMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssetConditionMaster_CategoryCondition] UNIQUE NONCLUSTERED
(
	[ConditionCategory] ASC, [CategoryId] ASC, [ConditionName] ASC
)
)
GO


ALTER TABLE [AMS].[AssetConditionMaster] WITH CHECK ADD CONSTRAINT [CK_AssetConditionMaster_ConditionCategory] CHECK ([ConditionCategory]=N'Inventory' OR [ConditionCategory]=N'Asset')
GO
ALTER TABLE [AMS].[AssetConditionMaster] CHECK CONSTRAINT [CK_AssetConditionMaster_ConditionCategory]
GO

/****** Object:  Table [AMS].[AuthorityMaster] ******/
CREATE TABLE [AMS].[AuthorityMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AuthorityCode] [varchar](20) NOT NULL,
	[AuthorityName] [nvarchar](200) NOT NULL,
	[State] [nvarchar](100) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AuthorityMaster_IsActive] DEFAULT (1),
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AuthorityMaster_CreatedDate] DEFAULT (getdate()),
	[CreatedBy] [int] NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AuthorityMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AuthorityMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AuthorityMaster_AuthorityCode] UNIQUE NONCLUSTERED
(
	[AuthorityCode] ASC
)
)
GO


/****** Object:  Table [AMS].[OrganizationMaster] ******/
CREATE TABLE [AMS].[OrganizationMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AuthorityId] [int] NOT NULL,
	[OrganizationCode] [varchar](20) NOT NULL,
	[OrganizationName] [nvarchar](200) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_OrganizationMaster_IsActive] DEFAULT (1),
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_OrganizationMaster_CreatedDate] DEFAULT (getdate()),
	[CreatedBy] [int] NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_OrganizationMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_OrganizationMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_OrganizationMaster_OrgCode] UNIQUE NONCLUSTERED
(
	[OrganizationCode] ASC
)
)
GO


/****** Object:  Table [AMS].[OwnershipTypeMaster] ******/
CREATE TABLE [AMS].[OwnershipTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OwnershipTypeName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_OwnershipTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_OwnershipTypeMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_OwnershipTypeMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_OwnershipTypeMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_OwnershipTypeMaster_OwnershipTypeName] UNIQUE NONCLUSTERED
(
	[OwnershipTypeName] ASC
)
)
GO


/****** Object:  Table [AMS].[OwningDepartmentMaster] ******/
CREATE TABLE [AMS].[OwningDepartmentMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OwningDepartmentName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_OwningDepartmentMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_OwningDepartmentMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_OwningDepartmentMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_OwningDepartmentMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_OwningDepartmentMaster_OwningDepartmentName] UNIQUE NONCLUSTERED
(
	[OwningDepartmentName] ASC
)
)
GO


/****** Object:  Table [AMS].[DesignationMaster] ******/
CREATE TABLE [AMS].[DesignationMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OwningDepartmentId] [int] NOT NULL,
	[DesignationCode] [varchar](50) NOT NULL,
	[DesignationName] [nvarchar](100) NOT NULL,
	[DesignationLocal] [nvarchar](150) NULL,
	[DesignationDescription] [nvarchar](250) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_DesignationMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_DesignationMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_DesignationMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_DesignationMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_DesignationMaster_DesignationCode] UNIQUE NONCLUSTERED
(
	[DesignationCode] ASC
),
 CONSTRAINT [UQ_DesignationMaster_DesignationName] UNIQUE NONCLUSTERED
(
	[DesignationName] ASC
)
)
GO

/****** Object:  Table [AMS].[AssetDocumentDefinition] ******/
CREATE TABLE [AMS].[AssetDocumentDefinition](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetCategoryId] [int] NULL,
	[AssetTypeId] [int] NULL,
	[DocumentCode] [varchar](50) NOT NULL,
	[DocumentName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsRequired] [bit] NOT NULL CONSTRAINT [DF_AssetDocumentDefinition_IsRequired] DEFAULT (0),
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetDocumentDefinition_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetDocumentDefinition_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetDocumentDefinition_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetDocumentDefinition] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssetDocumentDefinition_Code] UNIQUE NONCLUSTERED
(
	[AssetCategoryId] ASC, [AssetTypeId] ASC, [DocumentCode] ASC
),
 CONSTRAINT [UQ_AssetDocumentDefinition_Name] UNIQUE NONCLUSTERED
(
	[AssetCategoryId] ASC, [AssetTypeId] ASC, [DocumentName] ASC
)
)
GO


/****** Object:  Table [AMS].[AssetFieldDefinition] ******/
CREATE TABLE [AMS].[AssetFieldDefinition](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetCategoryId] [int] NOT NULL,
	[AssetTypeId] [int] NOT NULL,
	[FieldCode] [varchar](50) NOT NULL,
	[FieldName] [nvarchar](100) NOT NULL,
	[FieldLabel] [nvarchar](200) NOT NULL,
	[FieldType] [nvarchar](50) NOT NULL,
	[FieldGroup] [nvarchar](100) NULL,
	[IsRequired] [bit] NOT NULL CONSTRAINT [DF_AssetFieldDefinition_IsRequired] DEFAULT (0),
	[DisplayOrder] [int] NOT NULL CONSTRAINT [DF_AssetFieldDefinition_DisplayOrder] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetFieldDefinition_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetFieldDefinition_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetFieldDefinition_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[OptionsJson] [nvarchar](max) NULL,
 CONSTRAINT [PK_AssetFieldDefinition] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_FieldDef_CategoryTypeField] UNIQUE NONCLUSTERED
(
	[AssetCategoryId] ASC, [AssetTypeId] ASC, [FieldCode] ASC
),
 CONSTRAINT [UQ_FieldDef_CategoryTypeFieldName] UNIQUE NONCLUSTERED
(
	[AssetCategoryId] ASC, [AssetTypeId] ASC, [FieldName] ASC
)
)
GO


ALTER TABLE [AMS].[AssetFieldDefinition] WITH CHECK ADD CONSTRAINT [CK_AssetFieldDefinition_OptionsJson] CHECK ([OptionsJson] IS NULL OR ISJSON([OptionsJson]) = 1)
GO
ALTER TABLE [AMS].[AssetFieldDefinition] CHECK CONSTRAINT [CK_AssetFieldDefinition_OptionsJson]
GO

/****** Object:  Table [AMS].[CVRateMaster] ******/
CREATE TABLE [AMS].[CVRateMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[SubZoneId] [int] NOT NULL,
	[TypeOfUseGroupCVId] [int] NULL,
	[FloorGroupId] [int] NULL,
	[AssessmentYearRangeId] [int] NOT NULL,
	[RateAmount] [decimal](18, 2) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_CVRateMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_CVRateMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_CVRateMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_CVRateMaster_SubZone_TypeOfUseGroupCV_FloorGroup_AssessmentYearRange] UNIQUE NONCLUSTERED
(
	[SubZoneId] ASC, [TypeOfUseGroupCVId] ASC, [FloorGroupId] ASC, [AssessmentYearRangeId] ASC
)
)
GO


-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE [AMS].[AssetTypeMaster] WITH CHECK ADD CONSTRAINT [FK_AssetTypeMaster_AssetCategoryMaster] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetTypeMaster] CHECK CONSTRAINT [FK_AssetTypeMaster_AssetCategoryMaster]
GO

ALTER TABLE [AMS].[SubZoneDetailsForCV] WITH CHECK ADD CONSTRAINT [FK_SubZoneDetailsForCV_MoujaMaster] FOREIGN KEY([MoujaId])
REFERENCES [AMS].[MoujaMaster] ([Id])
GO
ALTER TABLE [AMS].[SubZoneDetailsForCV] CHECK CONSTRAINT [FK_SubZoneDetailsForCV_MoujaMaster]
GO

ALTER TABLE [AMS].[TypeOfUseMaster] WITH CHECK ADD CONSTRAINT [FK_AMS_AssetTypeOfUseMaster_AssetCategoryMaster] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[TypeOfUseMaster] CHECK CONSTRAINT [FK_AMS_AssetTypeOfUseMaster_AssetCategoryMaster]
GO

ALTER TABLE [AMS].[TypeOfUseMaster] WITH CHECK ADD CONSTRAINT [FK_AMS_AssetTypeOfUseMaster_AssetTypeMaster] FOREIGN KEY([AssetTypeId])
REFERENCES [AMS].[AssetTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[TypeOfUseMaster] CHECK CONSTRAINT [FK_AMS_AssetTypeOfUseMaster_AssetTypeMaster]
GO

ALTER TABLE [AMS].[TypeOfUseMaster] WITH CHECK ADD CONSTRAINT [FK_AssetTypeOfUseMaster_TypeOfUseGroupMaster] FOREIGN KEY([TypeOfUseGroupId])
REFERENCES [AMS].[TypeOfUseGroupMaster] ([Id])
GO
ALTER TABLE [AMS].[TypeOfUseMaster] CHECK CONSTRAINT [FK_AssetTypeOfUseMaster_TypeOfUseGroupMaster]
GO

ALTER TABLE [AMS].[SubTypeOfUseMaster] WITH CHECK ADD CONSTRAINT [FK_AMS_AssetSubTypeOfUseMaster_TypeOfUseMaster] FOREIGN KEY([TypeOfUseId])
REFERENCES [AMS].[TypeOfUseMaster] ([Id])
GO
ALTER TABLE [AMS].[SubTypeOfUseMaster] CHECK CONSTRAINT [FK_AMS_AssetSubTypeOfUseMaster_TypeOfUseMaster]
GO

ALTER TABLE [AMS].[UseFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_UseFactorCVMaster_AssessmentYearRangeCVMaster] FOREIGN KEY([AssessmentYearRangeId])
REFERENCES [AMS].[AssessmentYearRangeMaster] ([Id])
GO
ALTER TABLE [AMS].[UseFactorCVMaster] CHECK CONSTRAINT [FK_UseFactorCVMaster_AssessmentYearRangeCVMaster]
GO

ALTER TABLE [AMS].[UseFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_UseFactorCVMaster_SubTypeOfUseMaster] FOREIGN KEY([SubTypeOfUseId])
REFERENCES [AMS].[SubTypeOfUseMaster] ([Id])
GO
ALTER TABLE [AMS].[UseFactorCVMaster] CHECK CONSTRAINT [FK_UseFactorCVMaster_SubTypeOfUseMaster]
GO

ALTER TABLE [AMS].[UseFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_UseFactorCVMaster_TypeOfUseMaster] FOREIGN KEY([TypeOfUseId])
REFERENCES [AMS].[TypeOfUseMaster] ([Id])
GO
ALTER TABLE [AMS].[UseFactorCVMaster] CHECK CONSTRAINT [FK_UseFactorCVMaster_TypeOfUseMaster]
GO

ALTER TABLE [AMS].[FloorFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_FloorFactorCVMaster_AssessmentYearRangeCVMaster] FOREIGN KEY([AssessmentYearRangeId])
REFERENCES [AMS].[AssessmentYearRangeMaster] ([Id])
GO
ALTER TABLE [AMS].[FloorFactorCVMaster] CHECK CONSTRAINT [FK_FloorFactorCVMaster_AssessmentYearRangeCVMaster]
GO

ALTER TABLE [AMS].[FloorFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_FloorFactorCVMaster_FloorMaster] FOREIGN KEY([FloorId])
REFERENCES [PTIS].[FloorMaster] ([Id])
GO
ALTER TABLE [AMS].[FloorFactorCVMaster] CHECK CONSTRAINT [FK_FloorFactorCVMaster_FloorMaster]
GO

ALTER TABLE [AMS].[AgeFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_AgeFactorCVMaster_AssessmentYearRangeMaster] FOREIGN KEY([AssessmentYearRangeId])
REFERENCES [AMS].[AssessmentYearRangeMaster] ([Id])
GO
ALTER TABLE [AMS].[AgeFactorCVMaster] CHECK CONSTRAINT [FK_AgeFactorCVMaster_AssessmentYearRangeMaster]
GO

ALTER TABLE [AMS].[AgeFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_AgeFactorCVMaster_ConstructionTypeMaster] FOREIGN KEY([ConstructionTypeId])
REFERENCES [PTIS].[ConstructionTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AgeFactorCVMaster] CHECK CONSTRAINT [FK_AgeFactorCVMaster_ConstructionTypeMaster]
GO

ALTER TABLE [AMS].[NatureFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_NatureFactorCVMaster_AssessmentYearRangeMaster] FOREIGN KEY([AssessmentYearRangeId])
REFERENCES [AMS].[AssessmentYearRangeMaster] ([Id])
GO
ALTER TABLE [AMS].[NatureFactorCVMaster] CHECK CONSTRAINT [FK_NatureFactorCVMaster_AssessmentYearRangeMaster]
GO

ALTER TABLE [AMS].[NatureFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_NatureFactorCVMaster_ConstructionTypeMaster] FOREIGN KEY([ConstructionTypeId])
REFERENCES [PTIS].[ConstructionTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[NatureFactorCVMaster] CHECK CONSTRAINT [FK_NatureFactorCVMaster_ConstructionTypeMaster]
GO

ALTER TABLE [AMS].[AssetRoomTypeMaster] WITH CHECK ADD CONSTRAINT [FK_AssetRoomTypeMaster_AssetCategoryMaster] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetRoomTypeMaster] CHECK CONSTRAINT [FK_AssetRoomTypeMaster_AssetCategoryMaster]
GO

ALTER TABLE [AMS].[AssetRoomTypeMaster] WITH CHECK ADD CONSTRAINT [FK_AssetRoomTypeMaster_AssetTypeMaster] FOREIGN KEY([AssetTypeId])
REFERENCES [AMS].[AssetTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetRoomTypeMaster] CHECK CONSTRAINT [FK_AssetRoomTypeMaster_AssetTypeMaster]
GO

ALTER TABLE [AMS].[AssetPhotoType] WITH CHECK ADD CONSTRAINT [FK_AssetPhotoType_AssetCategoryMaster] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetPhotoType] CHECK CONSTRAINT [FK_AssetPhotoType_AssetCategoryMaster]
GO

ALTER TABLE [AMS].[AssetPhotoType] WITH CHECK ADD CONSTRAINT [FK_AssetPhotoType_AssetTypeMaster] FOREIGN KEY([AssetTypeId])
REFERENCES [AMS].[AssetTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetPhotoType] CHECK CONSTRAINT [FK_AssetPhotoType_AssetTypeMaster]
GO

ALTER TABLE [AMS].[InventoryItemCategoryMaster] WITH CHECK ADD CONSTRAINT [FK_InventoryItemCategoryMaster_AssetCategoryMaster] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryItemCategoryMaster] CHECK CONSTRAINT [FK_InventoryItemCategoryMaster_AssetCategoryMaster]
GO

ALTER TABLE [AMS].[InventoryItemNameMaster] WITH CHECK ADD CONSTRAINT [FK_InventoryItemNameMaster_InventoryItemCategoryMaster] FOREIGN KEY([InventoryItemCategoryId])
REFERENCES [AMS].[InventoryItemCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryItemNameMaster] CHECK CONSTRAINT [FK_InventoryItemNameMaster_InventoryItemCategoryMaster]
GO

ALTER TABLE [AMS].[InventoryItemModelMaster] WITH CHECK ADD CONSTRAINT [FK_InventoryItemModelMaster_InventoryItemNameMaster] FOREIGN KEY([InventoryItemNameId])
REFERENCES [AMS].[InventoryItemNameMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryItemModelMaster] CHECK CONSTRAINT [FK_InventoryItemModelMaster_InventoryItemNameMaster]
GO

ALTER TABLE [AMS].[OrganizationMaster] WITH CHECK ADD CONSTRAINT [FK_Organization_Authority] FOREIGN KEY([AuthorityId])
REFERENCES [AMS].[AuthorityMaster] ([Id])
GO
ALTER TABLE [AMS].[OrganizationMaster] CHECK CONSTRAINT [FK_Organization_Authority]
GO

ALTER TABLE [AMS].[DesignationMaster] WITH CHECK ADD CONSTRAINT [FK_DesignationMaster_OwningDepartmentMaster] FOREIGN KEY([OwningDepartmentId])
REFERENCES [AMS].[OwningDepartmentMaster] ([Id])
GO
ALTER TABLE [AMS].[DesignationMaster] CHECK CONSTRAINT [FK_DesignationMaster_OwningDepartmentMaster]
GO

ALTER TABLE [AMS].[AssetDocumentDefinition] WITH CHECK ADD CONSTRAINT [FK_AssetDocumentDefinition_AssetCategoryMaster] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDocumentDefinition] CHECK CONSTRAINT [FK_AssetDocumentDefinition_AssetCategoryMaster]
GO

ALTER TABLE [AMS].[AssetDocumentDefinition] WITH CHECK ADD CONSTRAINT [FK_AssetDocumentDefinition_AssetTypeMaster] FOREIGN KEY([AssetTypeId])
REFERENCES [AMS].[AssetTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDocumentDefinition] CHECK CONSTRAINT [FK_AssetDocumentDefinition_AssetTypeMaster]
GO

ALTER TABLE [AMS].[AssetFieldDefinition] WITH CHECK ADD CONSTRAINT [FK_FieldDef_Category] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetFieldDefinition] CHECK CONSTRAINT [FK_FieldDef_Category]
GO

ALTER TABLE [AMS].[AssetFieldDefinition] WITH CHECK ADD CONSTRAINT [FK_FieldDef_Type] FOREIGN KEY([AssetTypeId])
REFERENCES [AMS].[AssetTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetFieldDefinition] CHECK CONSTRAINT [FK_FieldDef_Type]
GO

ALTER TABLE [AMS].[CVRateMaster] WITH CHECK ADD CONSTRAINT [FK_CVRateMaster_AssessmentYearRangeMasterCV] FOREIGN KEY([AssessmentYearRangeId])
REFERENCES [AMS].[AssessmentYearRangeMaster] ([Id])
GO
ALTER TABLE [AMS].[CVRateMaster] CHECK CONSTRAINT [FK_CVRateMaster_AssessmentYearRangeMasterCV]
GO

ALTER TABLE [AMS].[CVRateMaster] WITH CHECK ADD CONSTRAINT [FK_CVRateMaster_FloorGroupMaster] FOREIGN KEY([FloorGroupId])
REFERENCES [PTIS].[FloorGroupMaster] ([Id])
GO
ALTER TABLE [AMS].[CVRateMaster] CHECK CONSTRAINT [FK_CVRateMaster_FloorGroupMaster]
GO

ALTER TABLE [AMS].[CVRateMaster] WITH CHECK ADD CONSTRAINT [FK_CVRateMaster_SubZoneDetailsForCV] FOREIGN KEY([SubZoneId])
REFERENCES [AMS].[SubZoneDetailsForCV] ([Id])
GO
ALTER TABLE [AMS].[CVRateMaster] CHECK CONSTRAINT [FK_CVRateMaster_SubZoneDetailsForCV]
GO

ALTER TABLE [AMS].[CVRateMaster] WITH CHECK ADD CONSTRAINT [FK_CVRateMaster_TypeOfUseGroupMasterCV] FOREIGN KEY([TypeOfUseGroupCVId])
REFERENCES [AMS].[TypeOfUseGroupMaster] ([Id])
GO
ALTER TABLE [AMS].[CVRateMaster] CHECK CONSTRAINT [FK_CVRateMaster_TypeOfUseGroupMasterCV]
GO

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE NONCLUSTERED INDEX [IX_AssetRoomTypeMaster_AssetTypeId] ON [AMS].[AssetRoomTypeMaster] ([AssetTypeId] ASC)
GO



SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================================
-- AMS MODULE: BUSINESS / TRANSACTIONAL TABLES
-- Generated from live AMS schema (NewAssetDB @ 192.168.1.21) on 2026-07-17.
-- AssetMaster and everything that hangs off it (details, sub-units,
-- inventory, documents, photos, lease/rent billing, CV history).
-- ============================================================================

/****** Object:  Table [AMS].[AssetMaster] ******/
CREATE TABLE [AMS].[AssetMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetNo] [varchar](50) NOT NULL,
	[AssetName] [nvarchar](200) NOT NULL,
	[AssetCategoryId] [int] NOT NULL,
	[AssetTypeId] [int] NOT NULL,
	[ParentAssetId] [int] NULL,
	[HierarchyLevel] [int] NOT NULL CONSTRAINT [DF_AssetMaster_HierarchyLevel] DEFAULT (0),
	[HierarchyPath] [varchar](500) NULL,
	[DepartmentId] [int] NULL,
	[OwnershipType] [nvarchar](50) NULL,
	[OccupancyStatus] [nvarchar](50) NULL,
	[AssetConditionId] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetMaster_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[AssetRegionalName] [nvarchar](200) NULL,
	[EncroachmentStatus] [varchar](25) NULL,
 CONSTRAINT [PK_AssetMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_AssetMaster_AssetNo] UNIQUE NONCLUSTERED
(
	[AssetNo] ASC
)
)
GO



ALTER TABLE [AMS].[AssetMaster] WITH CHECK ADD CONSTRAINT [CK_AssetMaster_HierarchyLevel] CHECK ([HierarchyLevel]>=(0))
GO
ALTER TABLE [AMS].[AssetMaster] CHECK CONSTRAINT [CK_AssetMaster_HierarchyLevel]
GO

/****** Object:  Table [AMS].[AssetDetails] ******/
CREATE TABLE [AMS].[AssetDetails](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetId] [int] NOT NULL,
	[OrganizationId] [int] NOT NULL,
	[ZoneId] [int] NULL,
	[WardId] [int] NULL,
	[PropertyNo] [varchar](100) NULL,
	[PartitionNo] [varchar](100) NULL,
	[UpicId] [varchar](100) NULL,
	[PlotNo] [varchar](50) NULL,
	[MoujaId] [int] NULL,
	[SubZoneId] [int] NULL,
	[CSN] [varchar](30) NULL,
	[LengthFt] [decimal](18, 2) NULL,
	[LengthMtr] [decimal](18, 2) NULL,
	[WidthFt] [decimal](18, 2) NULL,
	[WidthMtr] [decimal](18, 2) NULL,
	[LandAreaSqFeet] [decimal](18, 4) NULL,
	[LandAreaSqMeter] [decimal](18, 4) NULL,
	[Address] [nvarchar](500) NULL,
	[PinCode] [varchar](10) NULL,
	[Latitude] [decimal](10, 8) NULL,
	[Longitude] [decimal](11, 8) NULL,
	[InchargeName] [nvarchar](200) NULL,
	[InchargeDesignationId] [int] NULL,
	[InchargeContact] [varchar](30) NULL,
	[InchargeEmail] [varchar](150) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetDetails_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetDetails_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[InChargeRegionalName] [nvarchar](150) NULL,
	[RegionalAddress] [nvarchar](500) NULL,
	[UnitNo] [nvarchar](20) NULL,
	[MpmsNo] [varchar](50) NULL,
	[PTaxId] [nvarchar](100) NULL,
	[PlotArea] [decimal](18, 4) NULL,
 CONSTRAINT [PK_AssetDetails] PRIMARY KEY CLUSTERED
(
	[AssetId] ASC
)
)
GO


ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [CK_AssetDetails_Latitude] CHECK ([Latitude] IS NULL OR [Latitude]>=(-90) AND [Latitude]<=(90))
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [CK_AssetDetails_Latitude]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [CK_AssetDetails_Longitude] CHECK ([Longitude] IS NULL OR [Longitude]>=(-180) AND [Longitude]<=(180))
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [CK_AssetDetails_Longitude]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [CK_AssetDetails_PlotArea] CHECK ([PlotArea] IS NULL OR [PlotArea]>=(0))
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [CK_AssetDetails_PlotArea]
GO

/****** Object:  Table [AMS].[SubUnitsDetails] ******/
CREATE TABLE [AMS].[SubUnitsDetails](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetId] [int] NOT NULL,
	[FloorId] [int] NOT NULL,
	[SubFloorId] [int] NULL,
	[ConstructionYear] [varchar](4) NULL,
	[AssessmentYear] [varchar](4) NULL,
	[ConstructionTypeId] [int] NOT NULL,
	[TypeOfUseId] [int] NOT NULL,
	[SubTypeOfUseId] [int] NULL,
	[CarpetAreaSqMeter] [decimal](18, 4) NULL,
	[CarpetAreaSqFeet] [decimal](18, 4) NULL,
	[BuiltupAreaSqMeter] [decimal](18, 4) NULL,
	[BuiltupAreaSqFeet] [decimal](18, 4) NULL,
	[NoOfRooms] [int] NULL,
	[CVAgeFactor] [decimal](18, 4) NULL,
	[CVFloorFactor] [decimal](18, 4) NULL,
	[CVNatureFactor] [decimal](18, 4) NULL,
	[CVUseFactor] [decimal](18, 4) NULL,
	[CVBaseRate] [decimal](18, 2) NULL,
	[BaseValue] [decimal](18, 2) NULL,
	[CapitalValue] [decimal](18, 2) NULL,
	[IsRented] [bit] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubUnitsDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_SubUnitsDetails_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_SubUnitsDetails_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_SubUnitsDetails] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_SubUnitsDetails_AssetFloor] UNIQUE NONCLUSTERED
(
	[AssetId] ASC, [FloorId] ASC, [SubFloorId] ASC
)
)
GO


/****** Object:  Table [AMS].[InventoryBatch] ******/
CREATE TABLE [AMS].[InventoryBatch](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ParentAssetId] [int] NOT NULL,
	[OwningDepartmentId] [int] NOT NULL,
	[InventoryItemCategoryId] [int] NOT NULL,
	[InventoryItemNameId] [int] NOT NULL,
	[InventoryItemModelId] [int] NOT NULL,
	[Specifications] [nvarchar](500) NULL,
	[PurchaseDate] [date] NOT NULL,
	[ConditionId] [int] NOT NULL,
	[Quantity] [int] NOT NULL CONSTRAINT [DF_InventoryBatch_Quantity] DEFAULT (1),
	[UnitValue] [decimal](18, 2) NOT NULL,
	[TotalBatchValue] [decimal](18, 2) NOT NULL,
	[TotalBatchCV] [decimal](18, 2) NULL,
	[InvoiceNumber] [varchar](100) NULL,
	[InvoiceDate] [date] NULL,
	[InvoiceDocumentId] [varchar](500) NULL,
	[PhotoDocumentId] [varchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_InventoryBatch_IsActive] DEFAULT (1),
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_InventoryBatch_CreatedDate] DEFAULT (getdate()),
	[CreatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[UpdatedBy] [int] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_InventoryBatch_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_InventoryBatch] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


/****** Object:  Table [AMS].[InventoryAssetDetail] ******/
CREATE TABLE [AMS].[InventoryAssetDetail](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetId] [int] NOT NULL,
	[BatchId] [int] NOT NULL,
	[UnitNumber] [int] NOT NULL,
	[OwningDepartmentId] [int] NULL,
	[InventoryItemCategoryId] [int] NOT NULL,
	[InventoryItemNameId] [int] NULL,
	[InventoryItemModelId] [int] NULL,
	[ConditionId] [int] NULL,
	[Specifications] [nvarchar](500) NULL,
	[PhotoFileId] [varchar](300) NULL,
	[UnitPurchaseValue] [decimal](18, 2) NOT NULL,
	[UnitCapitalValue] [decimal](18, 2) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_InventoryAssetDetail_IsActive] DEFAULT (1),
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_InventoryAssetDetail_CreatedDate] DEFAULT (getdate()),
	[CreatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[UpdatedBy] [int] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_InventoryAssetDetail_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_InventoryAssetDetail] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_InventoryAssetDetail_AssetId] UNIQUE NONCLUSTERED
(
	[AssetId] ASC
)
)
GO


/****** Object:  Table [AMS].[AssetFieldValue] ******/
CREATE TABLE [AMS].[AssetFieldValue](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetId] [int] NOT NULL,
	[FieldDefinitionId] [int] NOT NULL,
	[FieldName] [nvarchar](100) NOT NULL,
	[FieldValue] [varchar](2000) NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetFieldValue_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetFieldValue_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetFieldValue_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AssetFieldValue] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_FieldValue_AssetField] UNIQUE NONCLUSTERED
(
	[AssetId] ASC, [FieldName] ASC
)
)
GO


/****** Object:  Table [AMS].[AssetDocument] ******/
CREATE TABLE [AMS].[AssetDocument](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetId] [int] NOT NULL,
	[DocumentDefinitionId] [int] NOT NULL,
	[DocumentBindingId] [int] NULL,
	[IsLatest] [bit] NOT NULL CONSTRAINT [DF_AssetDocument_IsLatest] DEFAULT (1),
	[DisplayOrder] [int] NULL,
	[Remarks] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetDocument_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetDocument_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetDocument_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetDocument] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


/****** Object:  Table [AMS].[AssetPhoto] ******/
CREATE TABLE [AMS].[AssetPhoto](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetId] [int] NOT NULL,
	[PhotoTypeId] [int] NOT NULL,
	[DocumentBindingId] [int] NULL,
	[IsLatest] [bit] NOT NULL CONSTRAINT [DF_AssetPhoto_IsLatest] DEFAULT (1),
	[DisplayOrder] [int] NULL,
	[Remarks] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetPhoto_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetPhoto_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetPhoto_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[SubUnitsDetailsId] [int] NULL,
 CONSTRAINT [PK_AssetPhoto] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


/****** Object:  Table [AMS].[AssetRentDocument] ******/
CREATE TABLE [AMS].[AssetRentDocument](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetLeaseRentDetailsId] [int] NOT NULL,
	[DocumentTypeId] [int] NOT NULL,
	[DocumentBindingId] [int] NULL,
	[IsLatest] [bit] NOT NULL CONSTRAINT [DF_AssetRentDocument_IsLatest] DEFAULT (1),
	[DisplayOrder] [int] NULL,
	[Remarks] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetRentDocument_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetRentDocument_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetRentDocument_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_AssetRentDocument] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


/****** Object:  Table [AMS].[InventoryDocument] ******/
CREATE TABLE [AMS].[InventoryDocument](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[InventoryBatchId] [int] NOT NULL,
	[DocumentTypeId] [int] NOT NULL,
	[DocumentBindingId] [int] NULL,
	[IsLatest] [bit] NOT NULL CONSTRAINT [DF_InventoryDocument_IsLatest] DEFAULT (1),
	[DisplayOrder] [int] NULL,
	[Remarks] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_InventoryDocument_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_InventoryDocument_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_InventoryDocument_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_InventoryDocument] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO

/****** Object:  Table [AMS].[AssetCVCalculationHistory] ******/
CREATE TABLE [AMS].[AssetCVCalculationHistory](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[AssetId] [int] NOT NULL,
	[CalculationDate] [datetime] NOT NULL CONSTRAINT [DF_AssetCVCalculationHistory_CalculationDate] DEFAULT (getdate()),
	[FinancialYear] [varchar](9) NOT NULL,
	[SubZoneId] [int] NULL,
	[FloorId] [int] NULL,
	[ConstructionTypeId] [int] NULL,
	[TypeOfUseId] [int] NULL,
	[SubTypeOfUseId] [int] NULL,
	[ConstructionYear] [int] NULL,
	[BuildingAge] [int] NULL,
	[BuiltupAreaSqMeter] [decimal](18, 4) NULL,
	[BaseRate] [decimal](18, 2) NULL,
	[AgeFactor] [decimal](9, 4) NULL,
	[FloorFactor] [decimal](9, 4) NULL,
	[NatureFactor] [decimal](9, 4) NULL,
	[UseFactor] [decimal](9, 4) NULL,
	[CapitalValue] [decimal](18, 2) NOT NULL,
	[CalculatedBy] [int] NULL,
	[Remarks] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetCVCalculationHistory_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetCVCalculationHistory_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_AssetCVCalculationHistory] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


/****** Object:  Table [AMS].[RoomWiseSubmissionDetails] ******/
CREATE TABLE [AMS].[RoomWiseSubmissionDetails](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[AssetId] [int] NULL,
	[SubUnitsDetailsId] [int] NULL,
	[RoomNo] [varchar](100) NULL,
	[RoomType] [nvarchar](100) NULL,
	[Shape] [nvarchar](25) NULL,
	[LengthMtr] [float] NULL,
	[WidthMtr] [float] NULL,
	[Lengthft] [float] NULL,
	[Widthft] [float] NULL,
	[HeightMtr] [float] NULL,
	[Heightft] [float] NULL,
	[AreaSqMtr] [float] NULL,
	[AreaSqFeet] [float] NULL,
	[IsOuter] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_IsOuter] DEFAULT (0),
	[IsMinus] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_IsMinus] DEFAULT (0),
	[TotalAreaSqMtr] [float] NULL,
	[TotalAreaSqFeet] [float] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_MarkedForDeletion] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_RoomWiseSubmissionDetails] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


ALTER TABLE [AMS].[RoomWiseSubmissionDetails] WITH CHECK ADD CONSTRAINT [CK_RoomWiseSubmissionDetails_PositiveArea] CHECK ([AreaSqMtr] IS NULL OR [AreaSqMtr]>(0))
GO
ALTER TABLE [AMS].[RoomWiseSubmissionDetails] CHECK CONSTRAINT [CK_RoomWiseSubmissionDetails_PositiveArea]
GO

ALTER TABLE [AMS].[RoomWiseSubmissionDetails] WITH CHECK ADD CONSTRAINT [CK_RoomWiseSubmissionDetails_PositiveTotalArea] CHECK ([TotalAreaSqMtr] IS NULL OR [TotalAreaSqMtr]>(0))
GO
ALTER TABLE [AMS].[RoomWiseSubmissionDetails] CHECK CONSTRAINT [CK_RoomWiseSubmissionDetails_PositiveTotalArea]
GO

/****** Object:  Table [AMS].[RoomWiseMinusData] ******/
CREATE TABLE [AMS].[RoomWiseMinusData](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RoomWiseSubmissionId] [int] NULL,
	[Shape] [nvarchar](25) NULL,
	[LengthMtr] [float] NULL,
	[Lengthft] [float] NULL,
	[WidthMtr] [float] NULL,
	[Widthft] [float] NULL,
	[HeightMtr] [float] NULL,
	[Heightft] [float] NULL,
	[AreaSqMtr] [float] NULL,
	[AreaSqFeet] [float] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RoomWiseMinusData_MarkedForDeletion] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RoomWiseMinusData_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RoomWiseMinusData_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_RoomWiseMinusData] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO




/****** Object:  Table [AMS].[AssetLeaseRentDetails] ******/
CREATE TABLE [AMS].[AssetLeaseRentDetails](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[AssetId] [int] NOT NULL,
	[SubUnitDetailsId] [int] NULL,
	[ShopNo] [varchar](50) NULL,
	[ShopName] [nvarchar](200) NULL,
	[TenantName] [nvarchar](500) NOT NULL,
	[TenantMobile] [varchar](20) NOT NULL,
	[TenantEmail] [varchar](200) NULL,
	[TenantType] [nvarchar](50) NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_TenantType] DEFAULT ('Individual'),
	[TenantAadhaarNo] [varchar](20) NULL,
	[TenantPanCardNo] [varchar](20) NULL,
	[TenantAddress] [nvarchar](500) NULL,
	[GSTNo] [varchar](50) NULL,
	[TotalAreaSqFt] [decimal](18, 4) NULL,
	[ApplicationTypeId] [int] NULL,
	[LeaseType] [nvarchar](20) NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_LeaseType] DEFAULT ('Rent'),
	[LeaseStartDate] [date] NOT NULL,
	[LeaseEndDate] [date] NULL,
	[Duration] [int] NULL,
	[DepositType] [varchar](50) NULL,
	[SecurityDeposit] [decimal](18, 2) NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_SecurityDeposit] DEFAULT (0),
	[PaymentFrequency] [varchar](20) NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_PaymentFrequency] DEFAULT ('Monthly'),
	[AgreementId] [varchar](25) NULL,
	[IsIncrement] [bit] NULL CONSTRAINT [DF_AssetLeaseRentDetails_IsIncrement] DEFAULT (0),
	[IncrementMethod] [varchar](20) NULL,
	[IncrementFrequency] [varchar](20) NULL,
	[IncrementType] [varchar](20) NULL,
	[IncrementValue] [float] NULL,
	[RentAmount] [decimal](18, 2) NULL,
	[Reason] [nvarchar](500) NULL,
	[WorkflowStatus] [varchar](30) NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_WorkflowStatus] DEFAULT ('Pending'),
	[RejectionReason] [nvarchar](500) NULL,
	[IsRejection] [bit] NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_IsRejection] DEFAULT (0),
	[RejectionBy] [int] NULL,
	[RejectionDate] [datetime] NULL,
	[IsVerified] [bit] NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_IsVerified] DEFAULT (0),
	[VerifiedBy] [int] NULL,
	[VerifiedDate] [datetime] NULL,
	[IsApproved] [bit] NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_IsApproved] DEFAULT (0),
	[ApprovedBy] [int] NULL,
	[ApprovedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_MarkedForDeletion] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletionDate] [datetime] NULL,
	[AdvanceBalance] [decimal](18, 2) NOT NULL CONSTRAINT [DF_AssetLeaseRentDetails_AdvanceBalance] DEFAULT (0),
	[ShopRegionalName] [nvarchar](200) NULL,
	[TenantRegionalName] [nvarchar](200) NULL,
 CONSTRAINT [PK_AssetLeaseRentDetails] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


/****** Object:  Table [AMS].[LeaseRentRegistrationHistory] ******/
CREATE TABLE [AMS].[LeaseRentRegistrationHistory](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[LeaseRentRegistrationId] [int] NOT NULL,
	[AssetId] [int] NOT NULL,
	[Remarks] [nvarchar](500) NULL,
	[Snap_GrievanceNo] [varchar](30) NULL,
	[Snap_ShopNo] [varchar](50) NULL,
	[Snap_Floor] [varchar](50) NULL,
	[Snap_ShopName] [nvarchar](200) NULL,
	[Snap_TenantName] [nvarchar](500) NOT NULL,
	[Snap_TenantMobile] [varchar](20) NOT NULL,
	[Snap_TenantEmail] [varchar](200) NULL,
	[Snap_TenantType] [varchar](50) NOT NULL,
	[Snap_TenantAadhaarNo] [varchar](20) NULL,
	[Snap_TenantPanCardNo] [varchar](20) NULL,
	[Snap_TenantAddress] [nvarchar](500) NULL,
	[Snap_GSTNo] [varchar](50) NULL,
	[Snap_PreviousTenantName] [nvarchar](200) NULL,
	[Snap_PreviousTenantMobile] [varchar](20) NULL,
	[Snap_TotalAreaSqFt] [decimal](18, 4) NULL,
	[Snap_ApplicationType] [varchar](100) NULL,
	[Snap_LeaseType] [varchar](20) NOT NULL,
	[Snap_LeaseRentType] [varchar](50) NULL,
	[Snap_OldLeaseStartDate] [date] NULL,
	[Snap_OldLeaseEndDate] [date] NULL,
	[Snap_LeaseStartDate] [date] NULL,
	[Snap_LeaseEndDate] [date] NULL,
	[Snap_TerminationDate] [date] NULL,
	[Snap_Duration] [int] NULL,
	[Snap_PreviousMonthlyRent] [decimal](18, 2) NULL,
	[Snap_MonthlyRent] [decimal](18, 2) NOT NULL,
	[Snap_RentAmount] [decimal](18, 2) NULL,
	[Snap_SecurityDeposit] [decimal](18, 2) NOT NULL,
	[Snap_DepositType] [varchar](50) NULL,
	[Snap_PaymentFrequency] [varchar](20) NOT NULL,
	[Snap_AgreementId] [varchar](25) NULL,
	[Snap_IncrementFrequency] [varchar](35) NULL,
	[Snap_IncrementType] [varchar](35) NULL,
	[Snap_IncrementValue] [float] NULL,
	[Snap_IncrementMethod] [varchar](35) NULL,
	[Snap_DurationFrom] [datetime] NULL,
	[Snap_DurationTo] [datetime] NULL,
	[Snap_Increment] [float] NULL,
	[Snap_IncrementStatus] [bit] NULL,
	[Snap_RentMonthly] [float] NULL,
	[Snap_CorrectionField] [varchar](100) NULL,
	[Snap_CorrectedValue] [varchar](500) NULL,
	[Snap_Reason] [nvarchar](500) NULL,
	[Snap_WorkflowStatus] [varchar](30) NOT NULL,
	[Snap_RejectionReason] [nvarchar](500) NULL,
	[Snap_IsRejection] [bit] NULL,
	[Snap_IsVerified] [bit] NULL,
	[Snap_IsApproved] [bit] NULL,
	[Snap_RentStatus] [varchar](20) NOT NULL,
	[Snap_PaymentStatus] [varchar](20) NULL,
	[Snap_IsActive] [bit] NOT NULL,
	[PerformedBy] [int] NOT NULL,
	[PerformedDate] [datetime] NOT NULL CONSTRAINT [DF_LeaseRentRegistrationHistory_PerformedDate] DEFAULT (getdate()),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_LeaseRentRegistrationHistory_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_LeaseRentRegistrationHistory_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_LeaseRentRegistrationHistory] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


/****** Object:  Table [AMS].[LeaseRentBillTransactions] ******/
CREATE TABLE [AMS].[LeaseRentBillTransactions](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TransactionNo] [varchar](50) NOT NULL,
	[ReceiptNo] [varchar](50) NULL,
	[AssetId] [int] NOT NULL,
	[LeaseRegistrationId] [int] NOT NULL,
	[FinanceYear] [int] NOT NULL,
	[TotalMonthlyRentAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_TotalMonthlyRentAmount] DEFAULT (0),
	[TotalPenaltyAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_TotalPenaltyAmount] DEFAULT (0),
	[TotalGSTAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_TotalGSTAmount] DEFAULT (0),
	[TotalDemandAmount] AS (([TotalMonthlyRentAmount]+[TotalPenaltyAmount])+[TotalGSTAmount]) PERSISTED,
	[DiscountAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_DiscountAmount] DEFAULT (0),
	[AdjustmentAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_AdjustmentAmount] DEFAULT (0),
	[NetPayableAmount] AS (((([TotalMonthlyRentAmount]+[TotalPenaltyAmount])+[TotalGSTAmount])-[DiscountAmount])+[AdjustmentAmount]) PERSISTED,
	[PaidAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_PaidAmount] DEFAULT (0),
	[PaymentMode] [varchar](30) NOT NULL,
	[PaymentDate] [date] NOT NULL,
	[BankName] [varchar](100) NULL,
	[BranchName] [varchar](100) NULL,
	[ChequeOrTransactionNo] [varchar](100) NULL,
	[ChequeDate] [date] NULL,
	[OnlineTransactionId] [varchar](100) NULL,
	[PaymentGatewayName] [varchar](100) NULL,
	[PaymentStatus] [varchar](20) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_PaymentStatus] DEFAULT ('Success'),
	[CancelledBy] [int] NULL,
	[CancelledDate] [datetime] NULL,
	[CancellationReason] [nvarchar](500) NULL,
	[Remark] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[PayerMobile] [varchar](20) NULL,
	[PayerEmail] [varchar](200) NULL,
	[Uuid] [uniqueidentifier] NOT NULL CONSTRAINT [DF_LeaseRentBillTransactions_Uuid] DEFAULT (newid()),
 CONSTRAINT [PK_LeaseRentBillTransactions] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_LeaseRentBillTransactions_ReceiptNo] UNIQUE NONCLUSTERED
(
	[ReceiptNo] ASC
),
 CONSTRAINT [UQ_LeaseRentBillTransactions_TransactionNo] UNIQUE NONCLUSTERED
(
	[TransactionNo] ASC
),
 CONSTRAINT [UQ_LeaseRentBillTransactions_Uuid] UNIQUE NONCLUSTERED
(
	[Uuid] ASC
)
)
GO


ALTER TABLE [AMS].[LeaseRentBillTransactions] WITH CHECK ADD CONSTRAINT [CK_LeaseRentBillTransactions_Amounts] CHECK ([TotalMonthlyRentAmount]>=(0) AND [TotalPenaltyAmount]>=(0) AND [TotalGSTAmount]>=(0) AND [DiscountAmount]>=(0) AND [PaidAmount]>=(0))
GO
ALTER TABLE [AMS].[LeaseRentBillTransactions] CHECK CONSTRAINT [CK_LeaseRentBillTransactions_Amounts]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactions] WITH CHECK ADD CONSTRAINT [CK_LeaseRentBillTransactions_PaymentMode] CHECK ([PaymentMode]='RTGS' OR [PaymentMode]='NEFT' OR [PaymentMode]='Online' OR [PaymentMode]='UPI' OR [PaymentMode]='DD' OR [PaymentMode]='Cheque' OR [PaymentMode]='Cash')
GO
ALTER TABLE [AMS].[LeaseRentBillTransactions] CHECK CONSTRAINT [CK_LeaseRentBillTransactions_PaymentMode]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactions] WITH CHECK ADD CONSTRAINT [CK_LeaseRentBillTransactions_Status] CHECK ([PaymentStatus]='Cancelled' OR [PaymentStatus]='Failed' OR [PaymentStatus]='Pending' OR [PaymentStatus]='Success')
GO
ALTER TABLE [AMS].[LeaseRentBillTransactions] CHECK CONSTRAINT [CK_LeaseRentBillTransactions_Status]
GO

/****** Object:  Table [AMS].[LeaseRentBillTransactionDetails] ******/
CREATE TABLE [AMS].[LeaseRentBillTransactionDetails](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[LeaseRentBillTransactionId] [int] NOT NULL,
	[MonthWiseDemandId] [int] NOT NULL,
	[AssetId] [int] NOT NULL,
	[LeaseRegistrationId] [int] NOT NULL,
	[FinanceYear] [int] NOT NULL,
	[DemandYear] [int] NOT NULL,
	[QuarterNo] [tinyint] NOT NULL,
	[DemandMonth] [tinyint] NOT NULL,
	[MonthlyRentAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_MonthlyRentAmount] DEFAULT (0),
	[PenaltyAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_PenaltyAmount] DEFAULT (0),
	[GSTAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_GSTAmount] DEFAULT (0),
	[TotalDemandAmount] AS (([MonthlyRentAmount]+[PenaltyAmount])+[GSTAmount]) PERSISTED,
	[PreviousPaidAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_PreviousPaidAmount] DEFAULT (0),
	[CurrentPaidAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_CurrentPaidAmount] DEFAULT (0),
	[BalanceAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_BalanceAmount] DEFAULT (0),
	[PaymentStatus] [varchar](20) NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_PaymentStatus] DEFAULT ('Paid'),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_LeaseRentBillTransactionDetails_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_LeaseRentBillTransactionDetails] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_LeaseRentBillTransactionDetails_MonthDemand] UNIQUE NONCLUSTERED
(
	[LeaseRentBillTransactionId] ASC, [MonthWiseDemandId] ASC
)
)
GO


ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [CK_LeaseRentBillTransactionDetails_Amounts] CHECK ([MonthlyRentAmount]>=(0) AND [PenaltyAmount]>=(0) AND [GSTAmount]>=(0) AND [PreviousPaidAmount]>=(0) AND [CurrentPaidAmount]>=(0) AND [BalanceAmount]>=(0))
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [CK_LeaseRentBillTransactionDetails_Amounts]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [CK_LeaseRentBillTransactionDetails_Month] CHECK ([DemandMonth]>=(1) AND [DemandMonth]<=(12))
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [CK_LeaseRentBillTransactionDetails_Month]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [CK_LeaseRentBillTransactionDetails_Quarter] CHECK ([QuarterNo]>=(1) AND [QuarterNo]<=(4))
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [CK_LeaseRentBillTransactionDetails_Quarter]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [CK_LeaseRentBillTransactionDetails_Status] CHECK ([PaymentStatus]='Cancelled' OR [PaymentStatus]='Paid' OR [PaymentStatus]='Partial')
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [CK_LeaseRentBillTransactionDetails_Status]
GO

/****** Object:  Table [AMS].[MonthWiseDemand] ******/
CREATE TABLE [AMS].[MonthWiseDemand](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[AssetId] [int] NOT NULL,
	[LeaseRegistrationId] [int] NOT NULL,
	[FinanceYear] [int] NOT NULL,
	[DemandYear] [int] NOT NULL,
	[QuarterNo] [tinyint] NOT NULL,
	[DemandMonth] [tinyint] NOT NULL,
	[MonthlyRentAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_MonthWiseDemand_MonthlyRentAmount] DEFAULT (0),
	[PenaltyRuleMasterId] [int] NULL,
	[PenaltyAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_MonthWiseDemand_PenaltyAmount] DEFAULT (0),
	[GSTMasterId] [int] NULL,
	[GSTAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_MonthWiseDemand_GSTAmount] DEFAULT (0),
	[TotalDemandAmount] AS (([MonthlyRentAmount]+[PenaltyAmount])+[GSTAmount]) PERSISTED,
	[PaidAmount] [decimal](18, 2) NOT NULL CONSTRAINT [DF_MonthWiseDemand_PaidAmount] DEFAULT (0),
	[PendingAmount] AS ((([MonthlyRentAmount]+[PenaltyAmount])+[GSTAmount])-[PaidAmount]) PERSISTED,
	[DemandStatus] [varchar](20) NOT NULL CONSTRAINT [DF_MonthWiseDemand_DemandStatus] DEFAULT ('Pending'),
	[LastPaymentDate] [date] NULL,
	[DueDate] [date] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_MonthWiseDemand_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_MonthWiseDemand_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_MonthWiseDemand] PRIMARY KEY CLUSTERED
(
	[Id] ASC
),
 CONSTRAINT [UQ_MonthWiseDemand_UniqueMonth] UNIQUE NONCLUSTERED
(
	[AssetId] ASC, [LeaseRegistrationId] ASC, [FinanceYear] ASC, [DemandYear] ASC, [DemandMonth] ASC
)
)
GO


ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [CK_MonthWiseDemand_Amounts] CHECK ([MonthlyRentAmount]>=(0) AND [PenaltyAmount]>=(0) AND [GSTAmount]>=(0) AND [PaidAmount]>=(0))
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [CK_MonthWiseDemand_Amounts]
GO

ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [CK_MonthWiseDemand_Month] CHECK ([DemandMonth]>=(1) AND [DemandMonth]<=(12))
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [CK_MonthWiseDemand_Month]
GO

ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [CK_MonthWiseDemand_Quarter] CHECK ([QuarterNo]>=(1) AND [QuarterNo]<=(4))
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [CK_MonthWiseDemand_Quarter]
GO

ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [CK_MonthWiseDemand_Status] CHECK ([DemandStatus]='Cancelled' OR [DemandStatus]='Paid' OR [DemandStatus]='Partial' OR [DemandStatus]='Pending')
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [CK_MonthWiseDemand_Status]
GO

/****** Object:  Table [AMS].[CSNDetails] ******/
CREATE TABLE [AMS].[CSNDetails](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[CVRateMasterId] [int] NOT NULL,
	[CSN] [varchar](50) NOT NULL,
	[MoujaId] [int] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL CONSTRAINT [DF_CSNDetails_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_CSNDetails_IsActive] DEFAULT (1),
 CONSTRAINT [PK_CSNDetails] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)
)
GO


-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE [AMS].[AssetMaster] WITH CHECK ADD CONSTRAINT [FK_Asset_Category] FOREIGN KEY([AssetCategoryId])
REFERENCES [AMS].[AssetCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetMaster] CHECK CONSTRAINT [FK_Asset_Category]
GO

ALTER TABLE [AMS].[AssetMaster] WITH CHECK ADD CONSTRAINT [FK_Asset_Condition] FOREIGN KEY([AssetConditionId])
REFERENCES [AMS].[AssetConditionMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetMaster] CHECK CONSTRAINT [FK_Asset_Condition]
GO

ALTER TABLE [AMS].[AssetMaster] WITH CHECK ADD CONSTRAINT [FK_Asset_Parent] FOREIGN KEY([ParentAssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetMaster] CHECK CONSTRAINT [FK_Asset_Parent]
GO

ALTER TABLE [AMS].[AssetMaster] WITH CHECK ADD CONSTRAINT [FK_Asset_Type] FOREIGN KEY([AssetTypeId])
REFERENCES [AMS].[AssetTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetMaster] CHECK CONSTRAINT [FK_Asset_Type]
GO

ALTER TABLE [AMS].[AssetMaster] WITH CHECK ADD CONSTRAINT [FK_AssetMaster_Department] FOREIGN KEY([DepartmentId])
REFERENCES [AMS].[OwningDepartmentMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetMaster] CHECK CONSTRAINT [FK_AssetMaster_Department]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [FK_AssetDetails_AssetMaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [FK_AssetDetails_AssetMaster]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [FK_AssetDetails_InchargeDesignation] FOREIGN KEY([InchargeDesignationId])
REFERENCES [AMS].[DesignationMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [FK_AssetDetails_InchargeDesignation]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [FK_AssetDetails_Mouja] FOREIGN KEY([MoujaId])
REFERENCES [AMS].[MoujaMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [FK_AssetDetails_Mouja]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [FK_AssetDetails_Organization] FOREIGN KEY([OrganizationId])
REFERENCES [AMS].[OrganizationMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [FK_AssetDetails_Organization]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [FK_AssetDetails_SubZone] FOREIGN KEY([SubZoneId])
REFERENCES [AMS].[SubZoneDetailsForCV] ([Id])
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [FK_AssetDetails_SubZone]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [FK_AssetDetails_Ward] FOREIGN KEY([WardId])
REFERENCES [PTIS].[WardMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [FK_AssetDetails_Ward]
GO

ALTER TABLE [AMS].[AssetDetails] WITH CHECK ADD CONSTRAINT [FK_AssetDetails_Zone] FOREIGN KEY([ZoneId])
REFERENCES [PTIS].[ZoneMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDetails] CHECK CONSTRAINT [FK_AssetDetails_Zone]
GO

ALTER TABLE [AMS].[SubUnitsDetails] WITH CHECK ADD CONSTRAINT [FK_SubUnitsDetails_Asset] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[SubUnitsDetails] CHECK CONSTRAINT [FK_SubUnitsDetails_Asset]
GO

ALTER TABLE [AMS].[SubUnitsDetails] WITH CHECK ADD CONSTRAINT [FK_SubUnitsDetails_ConstructionType] FOREIGN KEY([ConstructionTypeId])
REFERENCES [PTIS].[ConstructionTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[SubUnitsDetails] CHECK CONSTRAINT [FK_SubUnitsDetails_ConstructionType]
GO

ALTER TABLE [AMS].[SubUnitsDetails] WITH CHECK ADD CONSTRAINT [FK_SubUnitsDetails_Floor] FOREIGN KEY([FloorId])
REFERENCES [PTIS].[FloorMaster] ([Id])
GO
ALTER TABLE [AMS].[SubUnitsDetails] CHECK CONSTRAINT [FK_SubUnitsDetails_Floor]
GO

ALTER TABLE [AMS].[SubUnitsDetails] WITH CHECK ADD CONSTRAINT [FK_SubUnitsDetails_SubFloor] FOREIGN KEY([SubFloorId])
REFERENCES [PTIS].[SubFloorMaster] ([Id])
GO
ALTER TABLE [AMS].[SubUnitsDetails] CHECK CONSTRAINT [FK_SubUnitsDetails_SubFloor]
GO

ALTER TABLE [AMS].[SubUnitsDetails] WITH CHECK ADD CONSTRAINT [FK_SubUnitsDetails_SubTypeOfUse] FOREIGN KEY([SubTypeOfUseId])
REFERENCES [AMS].[SubTypeOfUseMaster] ([Id])
GO
ALTER TABLE [AMS].[SubUnitsDetails] CHECK CONSTRAINT [FK_SubUnitsDetails_SubTypeOfUse]
GO

ALTER TABLE [AMS].[SubUnitsDetails] WITH CHECK ADD CONSTRAINT [FK_SubUnitsDetails_TypeOfUse] FOREIGN KEY([TypeOfUseId])
REFERENCES [AMS].[TypeOfUseMaster] ([Id])
GO
ALTER TABLE [AMS].[SubUnitsDetails] CHECK CONSTRAINT [FK_SubUnitsDetails_TypeOfUse]
GO

ALTER TABLE [AMS].[InventoryBatch] WITH CHECK ADD CONSTRAINT [FK_InventoryBatch_InventoryItemCategory] FOREIGN KEY([InventoryItemCategoryId])
REFERENCES [AMS].[InventoryItemCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryBatch] CHECK CONSTRAINT [FK_InventoryBatch_InventoryItemCategory]
GO

ALTER TABLE [AMS].[InventoryBatch] WITH CHECK ADD CONSTRAINT [FK_InventoryBatch_InventoryItemCondition] FOREIGN KEY([ConditionId])
REFERENCES [AMS].[AssetConditionMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryBatch] CHECK CONSTRAINT [FK_InventoryBatch_InventoryItemCondition]
GO

ALTER TABLE [AMS].[InventoryBatch] WITH CHECK ADD CONSTRAINT [FK_InventoryBatch_InventoryItemModel] FOREIGN KEY([InventoryItemModelId])
REFERENCES [AMS].[InventoryItemModelMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryBatch] CHECK CONSTRAINT [FK_InventoryBatch_InventoryItemModel]
GO

ALTER TABLE [AMS].[InventoryBatch] WITH CHECK ADD CONSTRAINT [FK_InventoryBatch_InventoryItemName] FOREIGN KEY([InventoryItemNameId])
REFERENCES [AMS].[InventoryItemNameMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryBatch] CHECK CONSTRAINT [FK_InventoryBatch_InventoryItemName]
GO

ALTER TABLE [AMS].[InventoryBatch] WITH CHECK ADD CONSTRAINT [FK_InventoryBatch_OwningDepartment] FOREIGN KEY([OwningDepartmentId])
REFERENCES [AMS].[OwningDepartmentMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryBatch] CHECK CONSTRAINT [FK_InventoryBatch_OwningDepartment]
GO

ALTER TABLE [AMS].[InventoryBatch] WITH CHECK ADD CONSTRAINT [FK_InventoryBatch_ParentAsset] FOREIGN KEY([ParentAssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryBatch] CHECK CONSTRAINT [FK_InventoryBatch_ParentAsset]
GO

ALTER TABLE [AMS].[InventoryAssetDetail] WITH CHECK ADD CONSTRAINT [FK_InventoryAssetDetail_Asset] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [AMS].[InventoryAssetDetail] CHECK CONSTRAINT [FK_InventoryAssetDetail_Asset]
GO

ALTER TABLE [AMS].[InventoryAssetDetail] WITH CHECK ADD CONSTRAINT [FK_InventoryAssetDetail_Batch] FOREIGN KEY([BatchId])
REFERENCES [AMS].[InventoryBatch] ([Id])
GO
ALTER TABLE [AMS].[InventoryAssetDetail] CHECK CONSTRAINT [FK_InventoryAssetDetail_Batch]
GO

ALTER TABLE [AMS].[InventoryAssetDetail] WITH CHECK ADD CONSTRAINT [FK_InventoryAssetDetail_InventoryItemCategory] FOREIGN KEY([InventoryItemCategoryId])
REFERENCES [AMS].[InventoryItemCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryAssetDetail] CHECK CONSTRAINT [FK_InventoryAssetDetail_InventoryItemCategory]
GO

ALTER TABLE [AMS].[InventoryAssetDetail] WITH CHECK ADD CONSTRAINT [FK_InventoryAssetDetail_InventoryItemCondition] FOREIGN KEY([ConditionId])
REFERENCES [AMS].[AssetConditionMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryAssetDetail] CHECK CONSTRAINT [FK_InventoryAssetDetail_InventoryItemCondition]
GO

ALTER TABLE [AMS].[InventoryAssetDetail] WITH CHECK ADD CONSTRAINT [FK_InventoryAssetDetail_InventoryItemModel] FOREIGN KEY([InventoryItemModelId])
REFERENCES [AMS].[InventoryItemModelMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryAssetDetail] CHECK CONSTRAINT [FK_InventoryAssetDetail_InventoryItemModel]
GO

ALTER TABLE [AMS].[InventoryAssetDetail] WITH CHECK ADD CONSTRAINT [FK_InventoryAssetDetail_InventoryItemName] FOREIGN KEY([InventoryItemNameId])
REFERENCES [AMS].[InventoryItemNameMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryAssetDetail] CHECK CONSTRAINT [FK_InventoryAssetDetail_InventoryItemName]
GO

ALTER TABLE [AMS].[InventoryAssetDetail] WITH CHECK ADD CONSTRAINT [FK_InventoryAssetDetail_OwningDepartment] FOREIGN KEY([OwningDepartmentId])
REFERENCES [AMS].[OwningDepartmentMaster] ([Id])
GO
ALTER TABLE [AMS].[InventoryAssetDetail] CHECK CONSTRAINT [FK_InventoryAssetDetail_OwningDepartment]
GO

ALTER TABLE [AMS].[AssetFieldValue] WITH CHECK ADD CONSTRAINT [FK_FieldValue_Asset] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetFieldValue] CHECK CONSTRAINT [FK_FieldValue_Asset]
GO

ALTER TABLE [AMS].[AssetFieldValue] WITH CHECK ADD CONSTRAINT [FK_FieldValue_FieldDef] FOREIGN KEY([FieldDefinitionId])
REFERENCES [AMS].[AssetFieldDefinition] ([Id])
GO
ALTER TABLE [AMS].[AssetFieldValue] CHECK CONSTRAINT [FK_FieldValue_FieldDef]
GO

ALTER TABLE [AMS].[AssetDocument] WITH CHECK ADD CONSTRAINT [FK_AssetDocument_AssetMaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetDocument] CHECK CONSTRAINT [FK_AssetDocument_AssetMaster]
GO

ALTER TABLE [AMS].[AssetDocument] WITH CHECK ADD CONSTRAINT [FK_AssetDocument_DocumentBinding] FOREIGN KEY([DocumentBindingId])
REFERENCES [CORE].[DocumentBinding] ([Id])
GO
ALTER TABLE [AMS].[AssetDocument] CHECK CONSTRAINT [FK_AssetDocument_DocumentBinding]
GO

ALTER TABLE [AMS].[AssetDocument] WITH CHECK ADD CONSTRAINT [FK_AssetDocument_DocumentDefinition] FOREIGN KEY([DocumentDefinitionId])
REFERENCES [AMS].[AssetDocumentDefinition] ([Id])
GO
ALTER TABLE [AMS].[AssetDocument] CHECK CONSTRAINT [FK_AssetDocument_DocumentDefinition]
GO

ALTER TABLE [AMS].[AssetPhoto] WITH CHECK ADD CONSTRAINT [FK_AssetPhoto_AssetMaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetPhoto] CHECK CONSTRAINT [FK_AssetPhoto_AssetMaster]
GO

ALTER TABLE [AMS].[AssetPhoto] WITH CHECK ADD CONSTRAINT [FK_AssetPhoto_DocumentBinding] FOREIGN KEY([DocumentBindingId])
REFERENCES [CORE].[DocumentBinding] ([Id])
GO
ALTER TABLE [AMS].[AssetPhoto] CHECK CONSTRAINT [FK_AssetPhoto_DocumentBinding]
GO

ALTER TABLE [AMS].[AssetPhoto] WITH CHECK ADD CONSTRAINT [FK_AssetPhoto_PhotoType] FOREIGN KEY([PhotoTypeId])
REFERENCES [AMS].[AssetPhotoType] ([Id])
GO
ALTER TABLE [AMS].[AssetPhoto] CHECK CONSTRAINT [FK_AssetPhoto_PhotoType]
GO

ALTER TABLE [AMS].[AssetRentDocument] WITH CHECK ADD CONSTRAINT [FK_AssetRentDocument_AssetLeaseRentDetails] FOREIGN KEY([AssetLeaseRentDetailsId])
REFERENCES [AMS].[AssetLeaseRentDetails] ([Id])
GO
ALTER TABLE [AMS].[AssetRentDocument] CHECK CONSTRAINT [FK_AssetRentDocument_AssetLeaseRentDetails]
GO

ALTER TABLE [AMS].[AssetRentDocument] WITH CHECK ADD CONSTRAINT [FK_AssetRentDocument_AssetRentDocumentType] FOREIGN KEY([DocumentTypeId])
REFERENCES [AMS].[AssetRentDocumentType] ([Id])
GO
ALTER TABLE [AMS].[AssetRentDocument] CHECK CONSTRAINT [FK_AssetRentDocument_AssetRentDocumentType]
GO

ALTER TABLE [AMS].[AssetRentDocument] WITH CHECK ADD CONSTRAINT [FK_AssetRentDocument_DocumentBinding] FOREIGN KEY([DocumentBindingId])
REFERENCES [CORE].[DocumentBinding] ([Id])
GO
ALTER TABLE [AMS].[AssetRentDocument] CHECK CONSTRAINT [FK_AssetRentDocument_DocumentBinding]
GO

ALTER TABLE [AMS].[InventoryDocument] WITH CHECK ADD CONSTRAINT [FK_InventoryDocument_DocumentBinding] FOREIGN KEY([DocumentBindingId])
REFERENCES [CORE].[DocumentBinding] ([Id])
GO
ALTER TABLE [AMS].[InventoryDocument] CHECK CONSTRAINT [FK_InventoryDocument_DocumentBinding]
GO

ALTER TABLE [AMS].[InventoryDocument] WITH CHECK ADD CONSTRAINT [FK_InventoryDocument_InventoryBatch] FOREIGN KEY([InventoryBatchId])
REFERENCES [AMS].[InventoryBatch] ([Id])
GO
ALTER TABLE [AMS].[InventoryDocument] CHECK CONSTRAINT [FK_InventoryDocument_InventoryBatch]
GO

ALTER TABLE [AMS].[InventoryDocument] WITH CHECK ADD CONSTRAINT [FK_InventoryDocument_InventoryDocumentType] FOREIGN KEY([DocumentTypeId])
REFERENCES [AMS].[InventoryDocumentType] ([Id])
GO
ALTER TABLE [AMS].[InventoryDocument] CHECK CONSTRAINT [FK_InventoryDocument_InventoryDocumentType]
GO

ALTER TABLE [AMS].[AssetCVCalculationHistory] WITH CHECK ADD CONSTRAINT [FK_CVHistory_Asset] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetCVCalculationHistory] CHECK CONSTRAINT [FK_CVHistory_Asset]
GO

ALTER TABLE [AMS].[AssetCVCalculationHistory] WITH CHECK ADD CONSTRAINT [FK_CVHistory_ConstructionType] FOREIGN KEY([ConstructionTypeId])
REFERENCES [PTIS].[ConstructionTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetCVCalculationHistory] CHECK CONSTRAINT [FK_CVHistory_ConstructionType]
GO

ALTER TABLE [AMS].[AssetCVCalculationHistory] WITH CHECK ADD CONSTRAINT [FK_CVHistory_Floor] FOREIGN KEY([FloorId])
REFERENCES [PTIS].[FloorMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetCVCalculationHistory] CHECK CONSTRAINT [FK_CVHistory_Floor]
GO

ALTER TABLE [AMS].[AssetCVCalculationHistory] WITH CHECK ADD CONSTRAINT [FK_CVHistory_SubTypeOfUse] FOREIGN KEY([SubTypeOfUseId])
REFERENCES [AMS].[SubTypeOfUseMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetCVCalculationHistory] CHECK CONSTRAINT [FK_CVHistory_SubTypeOfUse]
GO

ALTER TABLE [AMS].[AssetCVCalculationHistory] WITH CHECK ADD CONSTRAINT [FK_CVHistory_SubZone] FOREIGN KEY([SubZoneId])
REFERENCES [AMS].[SubZoneDetailsForCV] ([Id])
GO
ALTER TABLE [AMS].[AssetCVCalculationHistory] CHECK CONSTRAINT [FK_CVHistory_SubZone]
GO

ALTER TABLE [AMS].[AssetCVCalculationHistory] WITH CHECK ADD CONSTRAINT [FK_CVHistory_TypeOfUse] FOREIGN KEY([TypeOfUseId])
REFERENCES [AMS].[TypeOfUseMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetCVCalculationHistory] CHECK CONSTRAINT [FK_CVHistory_TypeOfUse]
GO

ALTER TABLE [AMS].[RoomWiseSubmissionDetails] WITH CHECK ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_AssetMaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[RoomWiseSubmissionDetails] CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_AssetMaster]
GO

ALTER TABLE [AMS].[RoomWiseSubmissionDetails] WITH CHECK ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_SubUnitsDetails] FOREIGN KEY([SubUnitsDetailsId])
REFERENCES [AMS].[SubUnitsDetails] ([Id])
GO
ALTER TABLE [AMS].[RoomWiseSubmissionDetails] CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_SubUnitsDetails]
GO

ALTER TABLE [AMS].[RoomWiseMinusData] WITH CHECK ADD CONSTRAINT [FK_RoomWiseMinusData_RoomWiseSubmissionDetails] FOREIGN KEY([RoomWiseSubmissionId])
REFERENCES [AMS].[RoomWiseSubmissionDetails] ([Id])
GO
ALTER TABLE [AMS].[RoomWiseMinusData] CHECK CONSTRAINT [FK_RoomWiseMinusData_RoomWiseSubmissionDetails]
GO

ALTER TABLE [AMS].[AssetLeaseRentDetails] WITH CHECK ADD CONSTRAINT [FK_AssetLeaseRentDetails_ApplicationType] FOREIGN KEY([ApplicationTypeId])
REFERENCES [AMS].[ApplicationTypeMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetLeaseRentDetails] CHECK CONSTRAINT [FK_AssetLeaseRentDetails_ApplicationType]
GO

ALTER TABLE [AMS].[AssetLeaseRentDetails] WITH CHECK ADD CONSTRAINT [FK_AssetLeaseRentDetails_Asset] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[AssetLeaseRentDetails] CHECK CONSTRAINT [FK_AssetLeaseRentDetails_Asset]
GO

ALTER TABLE [AMS].[AssetLeaseRentDetails] WITH CHECK ADD CONSTRAINT [FK_AssetLeaseRentDetails_SubUnitDetails] FOREIGN KEY([SubUnitDetailsId])
REFERENCES [AMS].[SubUnitsDetails] ([Id])
GO
ALTER TABLE [AMS].[AssetLeaseRentDetails] CHECK CONSTRAINT [FK_AssetLeaseRentDetails_SubUnitDetails]
GO

ALTER TABLE [AMS].[LeaseRentRegistrationHistory] WITH CHECK ADD CONSTRAINT [FK_LeaseRentRegistrationHistory_Asset] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentRegistrationHistory] CHECK CONSTRAINT [FK_LeaseRentRegistrationHistory_Asset]
GO

ALTER TABLE [AMS].[LeaseRentRegistrationHistory] WITH CHECK ADD CONSTRAINT [FK_LeaseRentRegistrationHistory_AssetLeaseRentDetails] FOREIGN KEY([LeaseRentRegistrationId])
REFERENCES [AMS].[AssetLeaseRentDetails] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentRegistrationHistory] CHECK CONSTRAINT [FK_LeaseRentRegistrationHistory_AssetLeaseRentDetails]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactions] WITH CHECK ADD CONSTRAINT [FK_LeaseRentBillTransactions_Assetmaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentBillTransactions] CHECK CONSTRAINT [FK_LeaseRentBillTransactions_Assetmaster]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactions] WITH CHECK ADD CONSTRAINT [FK_LeaseRentBillTransactions_LeaseRegistration] FOREIGN KEY([LeaseRegistrationId])
REFERENCES [AMS].[AssetLeaseRentDetails] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentBillTransactions] CHECK CONSTRAINT [FK_LeaseRentBillTransactions_LeaseRegistration]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [FK_LeaseRentBillTransactionDetails_Assetmaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [FK_LeaseRentBillTransactionDetails_Assetmaster]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [FK_LeaseRentBillTransactionDetails_LeaseRegistration] FOREIGN KEY([LeaseRegistrationId])
REFERENCES [AMS].[AssetLeaseRentDetails] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [FK_LeaseRentBillTransactionDetails_LeaseRegistration]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [FK_LeaseRentBillTransactionDetails_MonthWiseDemand] FOREIGN KEY([MonthWiseDemandId])
REFERENCES [AMS].[MonthWiseDemand] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [FK_LeaseRentBillTransactionDetails_MonthWiseDemand]
GO

ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] WITH CHECK ADD CONSTRAINT [FK_LeaseRentBillTransactionDetails_Transaction] FOREIGN KEY([LeaseRentBillTransactionId])
REFERENCES [AMS].[LeaseRentBillTransactions] ([Id])
GO
ALTER TABLE [AMS].[LeaseRentBillTransactionDetails] CHECK CONSTRAINT [FK_LeaseRentBillTransactionDetails_Transaction]
GO

ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [FK_MonthWiseDemand_Assetmaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [FK_MonthWiseDemand_Assetmaster]
GO

ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [FK_MonthWiseDemand_GSTMaster] FOREIGN KEY([GSTMasterId])
REFERENCES [AMS].[GSTMaster] ([Id])
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [FK_MonthWiseDemand_GSTMaster]
GO

ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [FK_MonthWiseDemand_LeaseRegistration] FOREIGN KEY([LeaseRegistrationId])
REFERENCES [AMS].[AssetLeaseRentDetails] ([Id])
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [FK_MonthWiseDemand_LeaseRegistration]
GO

ALTER TABLE [AMS].[MonthWiseDemand] WITH CHECK ADD CONSTRAINT [FK_MonthWiseDemand_PenaltyRuleMaster] FOREIGN KEY([PenaltyRuleMasterId])
REFERENCES [AMS].[PenaltyRuleMaster] ([Id])
GO
ALTER TABLE [AMS].[MonthWiseDemand] CHECK CONSTRAINT [FK_MonthWiseDemand_PenaltyRuleMaster]
GO

ALTER TABLE [AMS].[CSNDetails] WITH CHECK ADD CONSTRAINT [FK_csndetails_MoujaMaster] FOREIGN KEY([MoujaId])
REFERENCES [AMS].[MoujaMaster] ([Id])
GO
ALTER TABLE [AMS].[CSNDetails] CHECK CONSTRAINT [FK_csndetails_MoujaMaster]
GO

ALTER TABLE [AMS].[CSNDetails] WITH CHECK ADD CONSTRAINT [FK_CSNDetails_RateCVMaster] FOREIGN KEY([CVRateMasterId])
REFERENCES [AMS].[CVRateMaster] ([Id])
GO
ALTER TABLE [AMS].[CSNDetails] CHECK CONSTRAINT [FK_CSNDetails_RateCVMaster]
GO

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE NONCLUSTERED INDEX [IX_AssetMaster_ParentAssetId] ON [AMS].[AssetMaster] ([ParentAssetId] ASC)
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_AssetDetails_MpmsNo] ON [AMS].[AssetDetails] ([MpmsNo] ASC) WHERE [MpmsNo] IS NOT NULL
GO

CREATE NONCLUSTERED INDEX [IX_AssetDocument_AssetId] ON [AMS].[AssetDocument] ([AssetId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetDocument_DocumentBindingId] ON [AMS].[AssetDocument] ([DocumentBindingId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetDocument_DocumentDefinitionId] ON [AMS].[AssetDocument] ([DocumentDefinitionId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetPhoto_AssetId] ON [AMS].[AssetPhoto] ([AssetId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetPhoto_DocumentBindingId] ON [AMS].[AssetPhoto] ([DocumentBindingId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetPhoto_PhotoTypeId] ON [AMS].[AssetPhoto] ([PhotoTypeId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetRentDocument_AssetLeaseRentDetailsId] ON [AMS].[AssetRentDocument] ([AssetLeaseRentDetailsId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetRentDocument_DocumentBindingId] ON [AMS].[AssetRentDocument] ([DocumentBindingId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetRentDocument_DocumentTypeId] ON [AMS].[AssetRentDocument] ([DocumentTypeId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_InventoryDocument_DocumentBindingId] ON [AMS].[InventoryDocument] ([DocumentBindingId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_InventoryDocument_DocumentTypeId] ON [AMS].[InventoryDocument] ([DocumentTypeId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_InventoryDocument_InventoryBatchId] ON [AMS].[InventoryDocument] ([InventoryBatchId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetLeaseRentDetails_AssetId] ON [AMS].[AssetLeaseRentDetails] ([AssetId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_AssetLeaseRentDetails_SubUnitDetailsId] ON [AMS].[AssetLeaseRentDetails] ([SubUnitDetailsId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_LeaseRentRegistrationHistory_LeaseRentRegistrationId] ON [AMS].[LeaseRentRegistrationHistory] ([LeaseRentRegistrationId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_LeaseRentBillTransactions_AssetId] ON [AMS].[LeaseRentBillTransactions] ([AssetId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_LeaseRentBillTransactions_LeaseRegistrationId] ON [AMS].[LeaseRentBillTransactions] ([LeaseRegistrationId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_LeaseRentBillTransactionDetails_AssetId] ON [AMS].[LeaseRentBillTransactionDetails] ([AssetId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_LeaseRentBillTransactionDetails_LeaseRegistrationId] ON [AMS].[LeaseRentBillTransactionDetails] ([LeaseRegistrationId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_LeaseRentBillTransactionDetails_MonthWiseDemandId] ON [AMS].[LeaseRentBillTransactionDetails] ([MonthWiseDemandId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_LeaseRentBillTransactionDetails_TransactionId] ON [AMS].[LeaseRentBillTransactionDetails] ([LeaseRentBillTransactionId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MonthWiseDemand_AssetId] ON [AMS].[MonthWiseDemand] ([AssetId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MonthWiseDemand_GSTMasterId] ON [AMS].[MonthWiseDemand] ([GSTMasterId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MonthWiseDemand_LeaseRegistrationId] ON [AMS].[MonthWiseDemand] ([LeaseRegistrationId] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MonthWiseDemand_PenaltyRuleMasterId] ON [AMS].[MonthWiseDemand] ([PenaltyRuleMasterId] ASC)
GO

-- ============================================================================
-- NEW TABLES (ADDED FOR LATEST DB COMPATIBILITY)
-- ============================================================================


/****** Object:  Table [AMS].[GisAssetGeometry] ******/
CREATE TABLE [AMS].[GisAssetGeometry](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[AssetMasterId] [int] NOT NULL,
	[BuildingId] [nvarchar](100) NULL,
	[PolygonGeometry] [geometry] NOT NULL,
	[TotalAreaSqMeter] [decimal](18, 4) NULL,
	[GoogleMapLink] [nvarchar](500) NULL,
	[Link360] [nvarchar](500) NULL,
	[CentroidX] [decimal](18, 7) NULL,
	[CentroidY] [decimal](18, 7) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_GisAssetGeometry_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisAssetGeometry_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisAssetGeometry_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[TotalAreaSqFeet] [decimal](18, 4) NULL,
 CONSTRAINT [PK_GisAssetGeometry] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)
)
GO


ALTER TABLE [AMS].[GisAssetGeometry] WITH CHECK ADD CONSTRAINT [FK_GisAssetGeometry_AssetMaster] FOREIGN KEY([AssetMasterId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO

ALTER TABLE [AMS].[GisAssetGeometry] CHECK CONSTRAINT [FK_GisAssetGeometry_AssetMaster]
GO

ALTER TABLE [AMS].[GisAssetGeometry] WITH CHECK ADD CONSTRAINT [CK_GisAssetGeometry_CentroidX] CHECK (([CentroidX] IS NULL OR [CentroidX]>=(-180.0) AND [CentroidX]<=(180.0)))
GO

ALTER TABLE [AMS].[GisAssetGeometry] CHECK CONSTRAINT [CK_GisAssetGeometry_CentroidX]
GO

ALTER TABLE [AMS].[GisAssetGeometry] WITH CHECK ADD CONSTRAINT [CK_GisAssetGeometry_CentroidY] CHECK (([CentroidY] IS NULL OR [CentroidY]>=(-90.0) AND [CentroidY]<=(90.0)))
GO

ALTER TABLE [AMS].[GisAssetGeometry] CHECK CONSTRAINT [CK_GisAssetGeometry_CentroidY]
GO

ALTER TABLE [AMS].[GisAssetGeometry] WITH CHECK ADD CONSTRAINT [CK_GisAssetGeometry_TotalAreaSqMeter] CHECK (([TotalAreaSqMeter] IS NULL OR [TotalAreaSqMeter]>=(0)))
GO

ALTER TABLE [AMS].[GisAssetGeometry] CHECK CONSTRAINT [CK_GisAssetGeometry_TotalAreaSqMeter]
GO

ALTER TABLE [AMS].[GisAssetGeometry] WITH CHECK ADD CONSTRAINT [CK_GisAssetGeometry_TotalAreaSqFeet] CHECK (([TotalAreaSqFeet] IS NULL OR [TotalAreaSqFeet]>=(0)))
GO

ALTER TABLE [AMS].[GisAssetGeometry] CHECK CONSTRAINT [CK_GisAssetGeometry_TotalAreaSqFeet]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisAssetGeometry_AssetMasterId]
	ON [AMS].[GisAssetGeometry] ([AssetMasterId])
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0
GO

CREATE SPATIAL INDEX [SIX_GisAssetGeometry_PolygonGeometry]
	ON [AMS].[GisAssetGeometry] ([PolygonGeometry])
	USING GEOMETRY_AUTO_GRID
	WITH (
		BOUNDING_BOX = (xmin = -180, ymin = -90, xmax = 180, ymax = 90)
	)
GO

/****** Object:  Table [AMS].[RazorpayPaymentOrders] ******/
CREATE TABLE [AMS].[RazorpayPaymentOrders](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RazorpayOrderId] [varchar](50) NOT NULL,
	[LeaseRegistrationId] [int] NOT NULL,
	[AssetId] [int] NOT NULL,
	[ShopNo] [varchar](50) NULL,
	[TenantMobile] [varchar](20) NOT NULL,
	[Amount] [decimal](18, 2) NOT NULL,
	[Currency] [varchar](10) NOT NULL CONSTRAINT [DF_RazorpayPaymentOrders_Currency] DEFAULT ('INR'),
	[Receipt] [varchar](50) NULL,
	[PaymentType] [varchar](20) NOT NULL CONSTRAINT [DF_RazorpayPaymentOrders_PaymentType] DEFAULT ('Full'),
	[CustomAmount] [decimal](18, 2) NULL,
	[MonthWiseDemandIds] [varchar](500) NULL,
	[Status] [varchar](20) NOT NULL CONSTRAINT [DF_RazorpayPaymentOrders_Status] DEFAULT ('Created'),
	[RazorpayPaymentId] [varchar](50) NULL,
	[VerifiedAmount] [decimal](18, 2) NULL,
	[LeaseRentBillTransactionId] [int] NULL,
	[FailureReason] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RazorpayPaymentOrders_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RazorpayPaymentOrders_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[WebhookUpdateDetails] [nvarchar](max) NULL,
	[FailureResponse] [nvarchar](max) NULL,
 CONSTRAINT [PK_RazorpayPaymentOrders] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
),
 CONSTRAINT [UQ_RazorpayPaymentOrders_RazorpayOrderId] UNIQUE NONCLUSTERED
(
	[RazorpayOrderId] ASC
)
)
GO


ALTER TABLE [AMS].[RazorpayPaymentOrders] WITH CHECK ADD CONSTRAINT [FK_RazorpayPaymentOrders_AssetMaster] FOREIGN KEY([AssetId])
REFERENCES [AMS].[AssetMaster] ([Id])
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] CHECK CONSTRAINT [FK_RazorpayPaymentOrders_AssetMaster]
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] WITH CHECK ADD CONSTRAINT [FK_RazorpayPaymentOrders_LeaseRegistration] FOREIGN KEY([LeaseRegistrationId])
REFERENCES [AMS].[AssetLeaseRentDetails] ([Id])
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] CHECK CONSTRAINT [FK_RazorpayPaymentOrders_LeaseRegistration]
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] WITH CHECK ADD CONSTRAINT [FK_RazorpayPaymentOrders_LeaseRentBillTransaction] FOREIGN KEY([LeaseRentBillTransactionId])
REFERENCES [AMS].[LeaseRentBillTransactions] ([Id])
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] CHECK CONSTRAINT [FK_RazorpayPaymentOrders_LeaseRentBillTransaction]
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] WITH CHECK ADD CONSTRAINT [CK_RazorpayPaymentOrders_Amount] CHECK (([Amount]>=(0) AND ([CustomAmount] IS NULL OR [CustomAmount]>=(0)) AND ([VerifiedAmount] IS NULL OR [VerifiedAmount]>=(0))))
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] CHECK CONSTRAINT [CK_RazorpayPaymentOrders_Amount]
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] WITH CHECK ADD CONSTRAINT [CK_RazorpayPaymentOrders_PaymentType] CHECK (([PaymentType]='Full' OR [PaymentType]='Partial' OR [PaymentType]='Monthwise'))
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] CHECK CONSTRAINT [CK_RazorpayPaymentOrders_PaymentType]
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] WITH CHECK ADD CONSTRAINT [CK_RazorpayPaymentOrders_Status] CHECK (([Status]='Created' OR [Status]='Captured' OR [Status]='Failed'))
GO

ALTER TABLE [AMS].[RazorpayPaymentOrders] CHECK CONSTRAINT [CK_RazorpayPaymentOrders_Status]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RazorpayPaymentOrders_RazorpayPaymentId]
	ON [AMS].[RazorpayPaymentOrders] ([RazorpayPaymentId] ASC)
	WHERE [RazorpayPaymentId] IS NOT NULL
GO

/****** Object:  Table [AMS].[UserOwningDepartmentAllocation] ******/
CREATE TABLE [AMS].[UserOwningDepartmentAllocation](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[UserId] [int] NOT NULL,
	[OwningDepartmentId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_UserOwningDepartmentAllocation_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_UserOwningDepartmentAllocation_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_UserOwningDepartmentAllocation_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_UserOwningDepartmentAllocation] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)
)
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_UserOwningDepartmentAllocation_UserDepartment]
	ON [AMS].[UserOwningDepartmentAllocation] ([UserId], [OwningDepartmentId])
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


ALTER TABLE [AMS].[UserOwningDepartmentAllocation] WITH CHECK ADD CONSTRAINT [FK_UserOwningDepartmentAllocation_OwningDepartmentMaster] FOREIGN KEY([OwningDepartmentId])
REFERENCES [AMS].[OwningDepartmentMaster] ([Id])
GO

ALTER TABLE [AMS].[UserOwningDepartmentAllocation] CHECK CONSTRAINT [FK_UserOwningDepartmentAllocation_OwningDepartmentMaster]
GO

ALTER TABLE [AMS].[UserOwningDepartmentAllocation] WITH CHECK ADD CONSTRAINT [FK_UserOwningDepartmentAllocation_UserMaster] FOREIGN KEY([UserId])
REFERENCES [CORE].[UserMaster] ([Id])
GO

ALTER TABLE [AMS].[UserOwningDepartmentAllocation] CHECK CONSTRAINT [FK_UserOwningDepartmentAllocation_UserMaster]
GO

/****** Object:  Table [AMS].[UserZoneAllocation] ******/
CREATE TABLE [AMS].[UserZoneAllocation](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[UserId] [int] NOT NULL,
	[ZoneId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_UserZoneAllocation_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_UserZoneAllocation_CreatedDate] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_UserZoneAllocation_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
 CONSTRAINT [PK_UserZoneAllocation] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)
)
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_UserZoneAllocation_UserZone]
	ON [AMS].[UserZoneAllocation] ([UserId], [ZoneId])
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


ALTER TABLE [AMS].[UserZoneAllocation] WITH CHECK ADD CONSTRAINT [FK_UserZoneAllocation_ZoneMaster] FOREIGN KEY([ZoneId])
REFERENCES [PTIS].[ZoneMaster] ([Id])
GO

ALTER TABLE [AMS].[UserZoneAllocation] CHECK CONSTRAINT [FK_UserZoneAllocation_ZoneMaster]
GO

ALTER TABLE [AMS].[UserZoneAllocation] WITH CHECK ADD CONSTRAINT [FK_UserZoneAllocation_UserMaster] FOREIGN KEY([UserId])
REFERENCES [CORE].[UserMaster] ([Id])
GO

ALTER TABLE [AMS].[UserZoneAllocation] CHECK CONSTRAINT [FK_UserZoneAllocation_UserMaster]
GO


/****** Object:  Table [AMS].[GrievanceCategoryMaster]    Script Date: 24-09-2026 18:14:16 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [AMS].[GrievanceCategoryMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[GrievanceTypeCode] [varchar](50) NOT NULL,
	[GrievanceTypeName] [nvarchar](200) NOT NULL,
	[GrievanceTypeNameLocal] [nvarchar](200) NULL,
	[Description] [nvarchar](500) NULL,
	[TargetTableName] [varchar](200) NULL,
	[RequiresFieldCorrection] [bit] NOT NULL,
	[SLADays] [int] NULL,
	[CodeFormat] [varchar](100) NOT NULL,
	[DisplaySequence] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[MarkedForDeletion] [bit] NOT NULL,
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_GrievanceCategoryMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_GrievanceCategoryMaster_GrievanceTypeCode] UNIQUE NONCLUSTERED
(
	[GrievanceTypeCode] ASC
),
 CONSTRAINT [UQ_GrievanceCategoryMaster_GrievanceTypeName] UNIQUE NONCLUSTERED
(
	[GrievanceTypeName] ASC
)
) ON [PRIMARY]
GO
/****** Object:  Table [AMS].[GrievanceRemarkMaster]    Script Date: 24-09-2026 18:14:16 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [AMS].[GrievanceRemarkMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[GrievanceCategoryId] [int] NOT NULL,
	[Remark] [nvarchar](150) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL,
	[MarkedForDeletion] [bit] NOT NULL,
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_GrievanceRemarkMaster] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_GrievanceRemarkMaster_GrievanceCategoryId_Remark] UNIQUE NONCLUSTERED
(
	[GrievanceCategoryId] ASC, [Remark] ASC
)
) ON [PRIMARY]
GO
ALTER TABLE [AMS].[GrievanceCategoryMaster] ADD  CONSTRAINT [DF_GrievanceCategoryMaster_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [AMS].[GrievanceCategoryMaster] ADD  CONSTRAINT [DF_GrievanceCategoryMaster_MarkedForDeletion]  DEFAULT ((0)) FOR [MarkedForDeletion]
GO
ALTER TABLE [AMS].[GrievanceCategoryMaster] ADD  CONSTRAINT [DF_GrievanceCategoryMaster_CreatedDate]  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [AMS].[GrievanceRemarkMaster] ADD  CONSTRAINT [DF_GrievanceRemarkMaster_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [AMS].[GrievanceRemarkMaster] ADD  CONSTRAINT [DF_GrievanceRemarkMaster_MarkedForDeletion]  DEFAULT ((0)) FOR [MarkedForDeletion]
GO
ALTER TABLE [AMS].[GrievanceRemarkMaster] ADD  CONSTRAINT [DF_GrievanceRemarkMaster_CreatedDate]  DEFAULT (getdate()) FOR [CreatedDate]
GO
ALTER TABLE [AMS].[GrievanceRemarkMaster]  WITH CHECK ADD  CONSTRAINT [FK_GrievanceRemarkMaster_GrievanceCategoryMaster] FOREIGN KEY([GrievanceCategoryId])
REFERENCES [AMS].[GrievanceCategoryMaster] ([Id])
GO
ALTER TABLE [AMS].[GrievanceRemarkMaster] CHECK CONSTRAINT [FK_GrievanceRemarkMaster_GrievanceCategoryMaster]
GO