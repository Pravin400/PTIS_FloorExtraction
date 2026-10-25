SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

/****** Object:  Table [PTIS].[ZoneMaster] ******/
CREATE TABLE [PTIS].[ZoneMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ZoneNo] [nvarchar](10) NOT NULL,
	[Description] [nvarchar](100) NOT NULL,
	[DescriptionEnglish] [varchar](100) NULL,
	[SequenceNo] int null,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ZoneMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime]  NOT NULL CONSTRAINT DF_ZoneMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_ZoneMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_ZoneMaster_ZoneNo] UNIQUE ([ZoneNo]),
	CONSTRAINT [UQ_ZoneMaster_Description] UNIQUE ([Description] ASC)
) ON [PRIMARY]

GO


/****** Object:  Table [PTIS].[WardMaster] ******/
CREATE TABLE [PTIS].[WardMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[WardNo] [nvarchar](10) NOT NULL,
	[Description] [nvarchar] (100) NOT NULL,
	[ZoneId] Int NOT NULL,
	[SequenceNo] int null,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_WardMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime]  NOT NULL CONSTRAINT DF_WardMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_WardMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_WardMaster_WardNo] UNIQUE ([WardNo] ASC),
	CONSTRAINT [UQ_WardMaster_Description] UNIQUE ([Description] ASC),
	CONSTRAINT [UQ_WardMaster_Id_ZoneId] UNIQUE ([Id], [ZoneId])
) ON [PRIMARY]

GO

ALTER TABLE [PTIS].[WardMaster]  WITH CHECK ADD  CONSTRAINT [FK_WardMaster_ZoneMaster]
FOREIGN KEY([ZoneId]) REFERENCES [PTIS].[ZoneMaster] ([Id])
GO
ALTER TABLE [PTIS].[WardMaster] CHECK CONSTRAINT [FK_WardMaster_ZoneMaster]
GO	


/****** Object:  Table [PTIS].[OwnerTypeMaster]******/

CREATE TABLE [PTIS].[OwnerTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OwnerType] [nvarchar](30) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_OwnerTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_OwnerTypeMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_OwnerTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_OwnerTypeMaster_OwnerType] UNIQUE ([OwnerType])
) ON [PRIMARY]
GO


-- /****** Object:  Table [PTIS].[PartTypeMaster]******/

-- CREATE TABLE [PTIS].[PartTypeMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PartType] [nvarchar](20) NOT NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PartTypeMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PartTypeMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_PartTypeMaster_1] PRIMARY KEY CLUSTERED ([Id] ASC),
--  CONSTRAINT [UQ_PartTypeMaster_PartType] UNIQUE ([PartType])
-- ) ON [PRIMARY]
-- GO


/****** Object:  Table [PTIS].[PropertyTypeCategoryMaster]******/

CREATE TABLE [PTIS].[PropertyTypeCategoryMaster](
	[Id] int IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyTypeCategory] [nvarchar](100) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTypeCategoryMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyTypeCategoryMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_PropertyTypeCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_PropertyTypeCategoryMaster_PropertyTypeCategory] UNIQUE ([PropertyTypeCategory] ASC)
) ON [PRIMARY]
GO



/****** Object:  Table [PTIS].[PropertyTypeMaster]******/

CREATE TABLE [PTIS].[PropertyTypeMaster](
	[Id] int IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyDescription] [nvarchar](100) NOT NULL,
	[PropertyDescriptionEnglish] [varchar](100) NULL,
	[Type] [varchar](5) NOT NULL,
	[SearchSequence] [int] NULL,
	[PropertyTypeCategoryId] [int] NULL,
	[PartType] [nvarchar](20)  NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyTypeMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_PropertyTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_PropertyTypeMaster_PropertyDescription] UNIQUE ([PropertyDescription] ASC)
)

GO
ALTER TABLE [PTIS].[PropertyTypeMaster] WITH CHECK ADD CONSTRAINT [FK_PropertyTypeMaster_PropertyTypeCategoryMaster]
FOREIGN KEY ([PropertyTypeCategoryId]) REFERENCES [PTIS].[PropertyTypeCategoryMaster]([Id]);
GO
ALTER TABLE [PTIS].[PropertyTypeMaster] CHECK CONSTRAINT [FK_PropertyTypeMaster_PropertyTypeCategoryMaster];
GO




/****** Object:  Table [PTIS].[PropertyCategoryMaster]******/

CREATE TABLE [PTIS].[PropertyCategoryMaster](
	[Id] int IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyCategoryName] [nvarchar](50) NOT NULL,
	[IsProtected] [bit] NOT NULL CONSTRAINT [DF_PropertyCategoryMaster_IsProtected] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyCategoryMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyCategoryMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_PropertyCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_PropertyCategoryMaster_PropertyCategoryName] UNIQUE ([PropertyCategoryName] ASC)
)

GO

-- /****** Object:  Table [PTIS].[SubCategory]******/
-- SET ANSI_NULLS ON
-- GO
-- SET QUOTED_IDENTIFIER ON
-- GO
-- CREATE TABLE [PTIS].[SubCategory](
-- 	[SubCategory] [nvarchar] (30) NOT NULL,
-- 	[SubCategoryType] [nvarchar](50) NOT NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubCategory_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SubCategory_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_SubCategory] PRIMARY KEY CLUSTERED ([SubCategory] ASC)

-- ) 

CREATE TABLE [PTIS].[WingMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[WingNo] [nvarchar](10) NOT NULL,
	[SequenceNo] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_WingMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_WingMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_WingMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
)

/****** Object:  Table [PTIS].[SocietyDetailsMast] ******/
CREATE TABLE [PTIS].[SocietyDetailsMast](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NULL,
	-- [WingId] [int] NULL,
	-- [WingName] [nvarchar](30) NULL,
	[SocietyName] [nvarchar](500) NULL,
	[SocietyAddress] [nvarchar](200) NULL,
	[SecretaryName] [nvarchar](200) NULL,
	[ManagerName] [nvarchar](200) NULL,
	[LandOwnerName] [nvarchar](200) NULL,
	[BuilderName] [nvarchar](200) NULL,
	[SocietyNameEnglish] [nvarchar](500) NULL,
	[SocietyAddressEnglish] [nvarchar](200) NULL,
	[SecretaryNameEnglish] [nvarchar](200) NULL,
	[ManagerNameEnglish] [nvarchar](200) NULL,
	[LandOwnerNameEnglish] [nvarchar](200) NULL,
	[BuilderNameEnglish] [nvarchar](200) NULL,
	[ManagerMobileNo] [varchar](13) NULL,
	[ManagerMobileNoRemarkId] [int] NULL,
	[SecretaryMobileNo] [varchar](13) NULL,
	[SecretaryMobileNoRemarkId] [int] NULL,
	[BuilderMobileNo] [varchar](13) NULL,
	[BuilderMobileNoRemarkId] [int] NULL,
	[SocietyEmailId] [nvarchar](100) NULL,
	[SecretaryEmailId] [nvarchar](100) NULL,
	[ManagerEmailId] [nvarchar](100) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_SocietyDetailsMaster_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL ,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SocietyDetailsMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SocietyDetailsMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_SocietyDetailsMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_SocietyDetailsMast_PropertyId] UNIQUE ([PropertyId] ASC)
) ON [PRIMARY]
GO



ALTER TABLE [PTIS].[SocietyDetailsMast]  WITH CHECK ADD  CONSTRAINT [FK_SocietyDetailsMast_ManagerMobileNoRemarkMaster] FOREIGN KEY([ManagerMobileNoRemarkId])	
REFERENCES [CORE].[CommonRemarkTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[SocietyDetailsMast] CHECK CONSTRAINT [FK_SocietyDetailsMast_ManagerMobileNoRemarkMaster]
GO

ALTER TABLE [PTIS].[SocietyDetailsMast]  WITH CHECK ADD  CONSTRAINT [FK_SocietyDetailsMast_SecretaryMobileNoRemarkMaster] FOREIGN KEY([SecretaryMobileNoRemarkId])
REFERENCES [CORE].[CommonRemarkTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[SocietyDetailsMast] CHECK CONSTRAINT [FK_SocietyDetailsMast_SecretaryMobileNoRemarkMaster]
GO


ALTER TABLE [PTIS].[SocietyDetailsMast]  WITH CHECK ADD  CONSTRAINT [FK_SocietyDetailsMast_BuilderMobileNoRemarkMaster] FOREIGN KEY([BuilderMobileNoRemarkId])	
REFERENCES [CORE].[CommonRemarkTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[SocietyDetailsMast] CHECK CONSTRAINT [FK_SocietyDetailsMast_BuilderMobileNoRemarkMaster]
GO





/****** Object:  Table [PTIS].[SocietyWingMast] ******/
CREATE TABLE [PTIS].[WingDetailsMast](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[SocietyDetailsMastId] [int] NOT NULL, 
	[WingMasterId] [int] NOT NULL,
	[WingName] [nvarchar](30) NULL,
	--[SocietyName] [nvarchar](500) NULL,
	--[SocietyAddress] [nvarchar](200) NULL,
	[SecretaryName] [nvarchar](200) NULL,
	[ManagerName] [nvarchar](200) NULL,
	--[LandOwnerName] [nvarchar](200) NULL,
	--[BuilderName] [nvarchar](200) NULL,
	--[SocietyNameEnglish] [nvarchar](500) NULL,
	--[SocietyAddressEnglish] [nvarchar](200) NULL,
	[SecretaryNameEnglish] [nvarchar](200) NULL,
	[ManagerNameEnglish] [nvarchar](200) NULL,
	--[LandOwnerNameEnglish] [nvarchar](200) NULL,
	--[BuilderNameEnglish] [nvarchar](200) NULL,
	[ManagerMobileNo] [varchar](13) NULL,
	[ManagerMobileNoRemarkId] [int] NULL,

	[SecretaryMobileNo] [varchar](13) NULL,
	[SecretaryMobileNoRemarkId] [int] NULL,
	[SecretaryEmailId] [nvarchar](100) NULL,
	--[BuilderMobileNo] [varchar](13) NULL,
	--[BuilderMobileNoRemarkId] [int] NULL,
	--[SocietyEmailId] [nvarchar](100) NULL,
	
	[ManagerEmailId] [nvarchar](100) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_WingDetailsMast_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL ,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_WingDetailsMast_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_WingDetailsMast_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_WingDetailsMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO



ALTER TABLE [PTIS].[WingDetailsMast] WITH CHECK ADD CONSTRAINT [FK_WingDetailsMast_SocietyDetailsMastId] FOREIGN KEY([SocietyDetailsMastId])
REFERENCES [PTIS].[SocietyDetailsMast] ([Id]) 
GO
ALTER TABLE [PTIS].[WingDetailsMast] CHECK CONSTRAINT [FK_WingDetailsMast_SocietyDetailsMastId] 
GO

ALTER TABLE [PTIS].[WingDetailsMast] WITH CHECK ADD CONSTRAINT [FK_WingDetailsMast_WingMaster] FOREIGN KEY([WingMasterId])
REFERENCES [PTIS].[WingMaster] ([Id]) 
GO
ALTER TABLE [PTIS].[WingDetailsMast] CHECK CONSTRAINT [FK_WingDetailsMast_WingMaster] 
GO


ALTER TABLE [PTIS].[WingDetailsMast]  WITH CHECK ADD  CONSTRAINT [FK_WingDetailsMast_ManagerMobileNoRemarkMaster] FOREIGN KEY([ManagerMobileNoRemarkId])	
REFERENCES [CORE].[CommonRemarkTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[WingDetailsMast] CHECK CONSTRAINT [FK_WingDetailsMast_ManagerMobileNoRemarkMaster]
GO

ALTER TABLE [PTIS].[WingDetailsMast]  WITH CHECK ADD  CONSTRAINT [FK_WingDetailsMast_SecretaryMobileNoRemarkMaster] FOREIGN KEY([SecretaryMobileNoRemarkId])
REFERENCES [CORE].[CommonRemarkTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[WingDetailsMast] CHECK CONSTRAINT [FK_WingDetailsMast_SecretaryMobileNoRemarkMaster]
GO




/****** Object:  Table [PTIS].[TaxZoneMaster]******/

CREATE TABLE [PTIS].[TaxZoneMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TaxZoneNo] [nvarchar](10) NOT NULL,
	[TaxZoneType] [nvarchar](50) NULL,
	[Remark] [nvarchar](50) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxZoneMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_TaxZoneMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_TaxZoneMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_TaxZoneMaster_TaxZoneNo] UNIQUE ([TaxZoneNo] ASC),
 CONSTRAINT [UQ_TaxZoneMaster_TaxZoneType] UNIQUE ([TaxZoneType] ASC)
) ON [PRIMARY]
GO


/****** Object:  Table [PTIS].[AssessmentYearRangeMasterCV]******/

CREATE TABLE [PTIS].[AssessmentYearRangeMasterCV](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FromYear] [int] NOT NULL,
	[ToYear] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssessmentYearRangeMasterCV_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_AssessmentYearRangeMasterCV_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_AssessmentYearRangeMasterCV] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_AssessmentYearRangeMasterCV_FromYear_ToYear] UNIQUE ([FromYear], [ToYear]),
	CONSTRAINT [CK_AssessmentYearRangeMasterCV_ValidYear] CHECK (FromYear <= ToYear)
)

GO



/****** Object:  Table [PTIS].[MoujaMaster]******/
CREATE TABLE [PTIS].[MoujaMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[MoujaNo] [nvarchar](20) NOT NULL,
	[MoujaName] [nvarchar](100) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_MoujaMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_MoujaMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_MoujaMaster] PRIMARY KEY CLUSTERED 	([Id] ASC)	,
	CONSTRAINT [UQ_MoujaMaster_MoujaNo] UNIQUE ([MoujaNo] ASC),
	CONSTRAINT [UQ_MoujaMaster_MoujaName] UNIQUE ([MoujaName] ASC)
)

/****** Object:  Table [PTIS].[FloorGroupMaster]    Script Date: 5/7/2026 1:08:27 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [PTIS].[FloorGroupMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FloorGroup] [varchar](30) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_FloorGroupMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_FloorGroupMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	 CONSTRAINT [PK_FloorGroupMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	 CONSTRAINT [UQ_FloorGroupMaster_FloorGroup] UNIQUE ([FloorGroup] ASC)

)
/* ============================================================
   1. PTIS.FLatGenerationGroupMaster
   ============================================================ */
CREATE TABLE [PTIS].[FLatGenerationGroupMaster]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [FLatGenerationGroup] VARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_FLatGenerationGroupMaster_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_FLatGenerationGroupMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_FLatGenerationGroupMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_FLatGenerationGroupMaster_Name] UNIQUE ([FLatGenerationGroup])
);
GO

/* ============================================================
   2. PTIS.FloorMaster
   ============================================================ */
CREATE TABLE [PTIS].[FloorMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [FloorCode] [nvarchar](5) NOT NULL,
    [Description] [nvarchar](100) NOT NULL,
    [DescriptionEnglish] [varchar](100) NULL,
    [SequenceNo] [int] NULL,
    [MaxFloorNo] [int] NULL,
    [FloorGroupId] [int] NULL,
    [FLatGenerationGroupId] [int] NOT NULL,   -- UPPER / GENERAL / OPENPLOT / PODIUM / MEZZANINE / LOWER / BASEMENT
    [FLatGenerationSeq] [int] NOT NULL,       -- position inside the flat generation group
    [IsProtected] [bit] NOT NULL CONSTRAINT [DF_FloorMaster_IsProtected] DEFAULT (0),
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_FloorMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_FloorMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_FloorMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_FloorMaster_Code] UNIQUE ([FloorCode]),
    CONSTRAINT [UQ_FloorMaster_Description] UNIQUE ([Description]),
    CONSTRAINT [FK_FloorMaster_FloorGroupMaster] FOREIGN KEY ([FloorGroupId])
        REFERENCES [PTIS].[FloorGroupMaster]([Id]),
    CONSTRAINT [FK_FloorMaster_FLatGenerationGroupMaster] FOREIGN KEY ([FLatGenerationGroupId])
        REFERENCES [PTIS].[FLatGenerationGroupMaster]([Id])
);
GO

CREATE UNIQUE INDEX [UX_FloorMaster_FLatGroupSeq]
    ON [PTIS].[FloorMaster] ([FLatGenerationGroupId], [FLatGenerationSeq]);
GO

/****** Object:  Table [PTIS].[SubFloorMaster]******/

CREATE TABLE [PTIS].[SubFloorMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[SubFloorCode] [nvarchar](10) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[DescriptionEnglish] [varchar](100) NULL,
	[SubFloorPercentage] DECIMAL(9,4) NULL,
	[IsProtected] BIT NOT NULL CONSTRAINT [DF_SubFloorMaster_IsProtected] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubFloorMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SubFloorMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
  CONSTRAINT [PK_SubFloorMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
  CONSTRAINT [UQ_SubFloorMaster_SubFloorCode] UNIQUE ([SubFloorCode]),
  CONSTRAINT [UQ_SubFloorMaster_Description] UNIQUE ([Description])
)
GO



/****** Object:  Table [PTIS].[PropertyMastOld]******/

CREATE TABLE [PTIS].[PropertyMastOld](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OldWardId] [INT] NULL,
	[OldPropertyNo] [nvarchar](10) NULL,
	[OldPartitionNo] [nvarchar](10) NULL,
	[OldEgovNo] [nvarchar](10) NULL,
	[OldPropertyTypeId] [int] NULL,
	[OldWingDetailId] [INT] NULL,
	[OldALV] DECIMAL(19,4) NULL,
	[OldRV] DECIMAL(19,4) NULL,
	[OldGeneralTax] DECIMAL(19,4) NULL,
	[OldTotalTax] DECIMAL(19,4) NULL,
	[OldZoneNo] [nvarchar](20) NULL,
	[OldPlotNo] [nvarchar](20) NULL,
	[OldCSN] [nvarchar](30) NULL,
	[OldPlotArea] DECIMAL(18,4) NULL,
	[OldConstructionYear] [int] NULL,
	[OldAssessmentYear] [int] NULL,
	[OldFloor] [nvarchar](10) NULL,
	[OldConstructionTypeOfUseId] [nvarchar](7) NULL,
	[OldUseType] [nvarchar](100) NULL,
	[OldConstructionArea] DECIMAL(18,4) NULL,
	[OldOwnerName] [nvarchar](1000) NULL,
	[OldOccupierName] [nvarchar](1000) NULL,
	[OldAddress] [nvarchar](500) NULL,
	[OldOwnerNameEnglish] [nvarchar](1000) NULL,
	[OldOccupierNameEnglish] [nvarchar](1000) NULL,
	[OldAddressEnglish] [nvarchar](500) NULL,
	[NoOfOldToilets] [int] NULL,
	[OldTotalRooms] [int] NULL,
	[OldSocietyName] [nvarchar](300) NULL,
	[OldEmailId] [nvarchar](100) NULL,
	[OldParkingAreaSqFt] DECIMAL(18,4) NULL,
	[OldParkingAreaSqMtr] DECIMAL(18,4) NULL,
	[OldAssessmentDate] [datetime] NULL,
	[OldFlatOrShopNumber] [nvarchar](50) NULL,
	[OldWing] [nvarchar](20) NULL,
	[OldMobileNo] [varchar](13) NULL,
	-- [MappedNewPropertyId] INT NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyMastOld_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyMastOld_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyMastOld_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_PropertyMastOld] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY] 
GO


/****** Object:  Table [PTIS].[PropertyAssessmentStatusMaster]******/

CREATE TABLE [PTIS].[PropertyAssessmentStatusMaster] (
   [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
   [StatusName] [nvarchar](30)  NOT NULL,
   [IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyAssessmentStatusMaster_IsActive] DEFAULT (1),
   [CreatedBy] [int] NULL,
   [CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyAssessmentStatusMaster_CreatedDate DEFAULT (GETDATE()),
   [UpdatedBy] [int] NULL,
   [UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_PropertyAssessmentStatusMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_PropertyAssessmentStatusMaster_StatusName] UNIQUE ([StatusName] ASC)
);


/****** Object:  Table [PTIS].[PropertyMast]******/
CREATE TABLE [PTIS].[PropertyMast](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TaxZoneId] int NOT NULL,
	[WardId] int NOT NULL,
	[PropertyNo] [nvarchar](10) NULL,
	[PartitionNo] [nvarchar](10) NULL,
	[PropertySeqNo] [int] NOT NULL,
	[PropertyTypeId] [int] NULL,
	[UPICId] [nvarchar](30) NULL,
	[OpenPlot] [bit] NULL,
	[MoujaId] [int] NULL,
	[CSN] [nvarchar](30) NULL,
	[SubZoneNo] [nvarchar](20) NULL,
	[PlotNo] [nvarchar](20) NULL,
	[CategoryId] [int] NULL,
	[Type] [int] NULL,
	[OccupierTypeId] [int] NULL,
	[OwnerTitle] [nvarchar](20) NULL,
	[OwnerName] [nvarchar](1000) NULL,
	[OccupierTitle] [nvarchar](20) NULL,
	[OccupierName] [nvarchar](1000) NULL,
	[FlatOrShopNo] [nvarchar](100) NULL,
	[FlatOrShopName] [nvarchar](200) NULL,
	[Address] [nvarchar](500) NULL,
	[PinCode] [varchar](6) NULL,
	[Location] [nvarchar](200) NULL,
	[MobileNo] [varchar](13) NULL,
	[MobileNoRemarkId] [int] NULL,
	[AlternateMobileNo] [varchar](13) NULL,
	[OccupierMobileNo] [varchar](13) NULL,
	[OccupierMobileNoRemarkId] [int] NULL,
	[EmailId] [nvarchar](100) NULL,
	[WingDetailId] [int] NULL,
	[OwnerTitleEnglish] [nvarchar](20) NULL,
	[OwnerNameEnglish] [nvarchar](1000) NULL,
	[OccupierTitleEnglish] [nvarchar](20) NULL,
	[OccupierNameEnglish] [nvarchar](1000) NULL,
	[FlatOrShopNoEnglish] [nvarchar](100) NULL,
	[FlatOrShopNameEnglish] [nvarchar](200) NULL,
	[AddressEnglish] [nvarchar](500) NULL,
	[LocationEnglish] [nvarchar](200) NULL,
	[PropertyAssessmentStatusId] [int] NULL,
	-- [PropertyMastOldId] [int] NULL,
	[PropertyFloorId] [int] NULL,
	[IsVirtualProperty] [bit] NOT NULL CONSTRAINT [DF_PropertyMast_IsVirtualProperty] DEFAULT (0),
	[OldWardId] [int] NULL,
 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyMast_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyMast_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyMast_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	
    CONSTRAINT [PK_PropertyMast] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_PropertyTypeMaster]
FOREIGN KEY([PropertyTypeId]) REFERENCES [PTIS].[PropertyTypeMaster]([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_PropertyTypeMaster];
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_TaxZoneMaster_TaxZoneId]
FOREIGN KEY([TaxZoneId]) REFERENCES [PTIS].[TaxZoneMaster]([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_TaxZoneMaster_TaxZoneId];
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_PropertyCategoryMaster] FOREIGN KEY([CategoryId]) 
REFERENCES [PTIS].[PropertyCategoryMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_PropertyCategoryMaster];
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_WardMaster] FOREIGN KEY([WardId]) 
REFERENCES [PTIS].[WardMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_WardMaster];
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_WingDetailsMast] FOREIGN KEY([WingDetailId])
 REFERENCES [PTIS].[WingDetailsMast] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_WingDetailsMast];
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_MoujaMaster] FOREIGN KEY([MoujaId])
 REFERENCES [PTIS].[MoujaMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_MoujaMaster];
GO

-- ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_PropertyMastOld] FOREIGN KEY([PropertyMastOldId])
--  REFERENCES [PTIS].[PropertyMastOld] ([Id]);
-- GO

-- ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_PropertyMastOld];
-- GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_OwnerTypeMaster]
FOREIGN KEY([OccupierTypeId]) REFERENCES [PTIS].[OwnerTypeMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_OwnerTypeMaster];
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_FloorMaster] FOREIGN KEY([PropertyFloorId])
 REFERENCES [PTIS].[FloorMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_FloorMaster];
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK ADD CONSTRAINT [FK_PropertyMast_PropertyAssessmentStatusMaster] FOREIGN KEY([PropertyAssessmentStatusId])
 REFERENCES [PTIS].[PropertyAssessmentStatusMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_PropertyAssessmentStatusMaster];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertyMast_ActiveProperty] ON PTIS.PropertyMast(WardId,PropertyNo,PartitionNo) WHERE [MarkedForDeletion] = 0;
GO

SET ANSI_PADDING ON
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertyMast_UPICID_NotNull] ON PTIS.PropertyMast ([UPICId] ASC) WHERE [UPICId] IS NOT NULL AND [MarkedForDeletion] = 0
WITH( PAD_INDEX = OFF,STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF,IGNORE_DUP_KEY = OFF,DROP_EXISTING = OFF,ONLINE = OFF,ALLOW_ROW_LOCKS = ON,ALLOW_PAGE_LOCKS = ON,OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [Ind_Category]
ON [PTIS].[PropertyMast]
(
    [WardId] ASC,
    [PropertyNo] ASC,
    [PartitionNo] ASC
)
INCLUDE ([CategoryId]);
GO

-- /****** Add this constraint here because [PTIS].[PropertyMast] must be created before it, to avoid an execution error. ******/
-- ALTER TABLE [PTIS].[PropertyMastOld] WITH CHECK ADD CONSTRAINT [FK_PropertyMastOld_PropertyMast]
-- FOREIGN KEY([MappedNewPropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]);
-- GO


/****** Object:  Table [PTIS].[ConstructionTypeMaster]******/

CREATE TABLE [PTIS].[ConstructionTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ConstructionCode] [varchar](7) NOT NULL,
	[Description] [nvarchar](100) NOT NULL,
	[DescriptionEnglish] [varchar](100) NULL,
	[SearchSequence] [int] NULL,
	[IsProtected] [bit] NOT NULL CONSTRAINT [DF_ConstructionTypeMaster_IsProtected] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ConstructionTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_ConstructionTypeMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_ConstructionTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_ConstructionTypeMaster_ConstructionCode] UNIQUE ([ConstructionCode]),
 CONSTRAINT [UQ_ConstructionTypeMaster_Description] UNIQUE ([Description])
  );
GO



/****** Object:  Table [PTIS].[TypeOfUseGroupMaster]******/

CREATE TABLE [PTIS].[TypeOfUseGroupMaster](
	[Id]  [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TypeOfUseGroupCode]  [varchar](10) NOT NULL,
	[GroupName] [nvarchar](50) NOT NULL,
    [GroupIcon] [nvarchar](50) NOT NULL,
	[IsOpenPlotGroup] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMaster_IsOpenPlotGroup] DEFAULT (0),
	[IsProtected] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMaster_IsProtected] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime]  NOT NULL CONSTRAINT DF_TypeOfUseGroupMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_TypeOfUseGroupMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_TypeOfUseGroupMaster_TypeOfUseGroupCode] UNIQUE ([TypeOfUseGroupCode]),
    CONSTRAINT [UQ_TypeOfUseGroupMaster] UNIQUE ([GroupName])
  )

GO

/****** Object:  Table [PTIS].[TypeOfUseGroupMasterCV]******/

CREATE TABLE [PTIS].[TypeOfUseGroupMasterCV](
	[Id]  [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TypeOfUseGroupCVCode]  [varchar](10) NOT NULL,
	[GroupName] [nvarchar](50) NOT NULL,
    [GroupIcon] [nvarchar](50) NOT NULL,
    [IsFloorWiseRateApplicable] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMasterCV_IsFloorWiseRateApplicable] DEFAULT (0),
	[IsProtected] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMasterCV_IsProtected] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseGroupMasterCV_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime]  NOT NULL CONSTRAINT DF_TypeOfUseGroupMasterCV_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_TypeOfUseGroupMasterCV] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_TypeOfUseGroupMasterCV_TypeOfUseGroupCVCode] UNIQUE ([TypeOfUseGroupCVCode]),
    CONSTRAINT [UQ_TypeOfUseGroupMasterCV_GroupName] UNIQUE ([GroupName])
  )

GO

/****** Object:  Table [PTIS].[TypeOfUseCategoryMaster]******/
CREATE TABLE [PTIS].[TypeOfUseCategoryMaster]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TypeOfUseCategoryCode] VARCHAR(50) NOT NULL,
    [TypeOfUseCategoryName] NVARCHAR(500) NULL,
	[IsProtected] BIT NOT NULL CONSTRAINT [DF_TypeOfUseCategoryMaster_IsProtected] DEFAULT ((0)),
    [IsActive] BIT NOT NULL CONSTRAINT [DF_TypeOfUseCategoryMaster_IsActive] DEFAULT ((1)),
    [CreatedBy] INT NULL,
	[CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_TypeOfUseCategoryMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL CONSTRAINT [DF_TypeOfUseCategoryMaster_UpdatedDate] DEFAULT (NULL),
    CONSTRAINT [PK_TypeOfUseCategoryMaster] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UK_TypeOfUseCategoryMaster_TypeOfUseCategoryCode] UNIQUE ([TypeOfUseCategoryCode])
);
GO

/****** Object:  Table [PTIS].[TypeOfUseMaster]******/

CREATE TABLE [PTIS].[TypeOfUseMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TypeOfUseCode] [varchar](10) NOT NULL,
	[Description] [nvarchar](100) NULL,	
	[DescriptionEnglish] [varchar](100) NULL,
	[Type] [varchar](5) NULL,
	[TypeOfUseGroupId] int NOT NULL,
	[TypeOfUseGroupCVId] int NOT NULL,
	[SearchSequence] [int] NULL,
	[TypeOfUseCategoryId] INT NULL CONSTRAINT FK_TypeOfUseMaster_TypeOfUseCategoryMaster  FOREIGN KEY REFERENCES [PTIS].[TypeOfUseCategoryMaster]([Id]),
	[IsProtected] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseMaster_IsProtected] DEFAULT (0),
	-- Per-TypeOfUse switches read by RateableValueService (platform #990): a use can be exempt from State Education / State Employment tax.
	[StateEduTaxApplicable] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseMaster_StateEduTaxApplicable] DEFAULT (1),
	[StateEmpTaxApplicable] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseMaster_StateEmpTaxApplicable] DEFAULT (1),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TypeOfUseMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_TypeOfUseMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_TypeOfUseMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_TypeOfUseMaster_TypeOfUseCode] UNIQUE ([TypeOfUseCode]),
 CONSTRAINT [UQ_TypeOfUseMaster_Description] UNIQUE ([Description])
)
GO
alter table [PTIS].[TypeOfUseMaster]  WITH CHECK ADD  CONSTRAINT [FK_TypeOfUseMaster_TypeOfUseGroupMaster] FOREIGN KEY([TypeOfUseGroupId])	
REFERENCES [PTIS].[TypeOfUseGroupMaster] ([Id])
GO
ALTER TABLE [PTIS].[TypeOfUseMaster] CHECK CONSTRAINT [FK_TypeOfUseMaster_TypeOfUseGroupMaster]
GO

alter table [PTIS].[TypeOfUseMaster]  WITH CHECK ADD  CONSTRAINT [FK_TypeOfUseMaster_TypeOfUseGroupMasterCV] FOREIGN KEY([TypeOfUseGroupCVId])	
REFERENCES [PTIS].[TypeOfUseGroupMasterCV] ([Id])
GO
ALTER TABLE [PTIS].[TypeOfUseMaster] CHECK CONSTRAINT [FK_TypeOfUseMaster_TypeOfUseGroupMasterCV]
GO

/****** Object:  Table [PTIS].[SubTypeOfUseMaster]******/

CREATE TABLE [PTIS].[SubTypeOfUseMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[Description] [nvarchar](80) NULL,
	[DescriptionEnglish] [varchar](100) NULL,
	[TypeOfUseId] [int] NOT NULL,
	[SearchSequence] [int] NULL,
	[TypeOfUseCategoryId] [int] NULL CONSTRAINT [FK_SubTypeOfUseMaster_TypeOfUseCategoryMaster] FOREIGN KEY REFERENCES [PTIS].[TypeOfUseCategoryMaster]([Id]),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubTypeOfUseMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SubTypeOfUseMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
CONSTRAINT [PK_SubTypeOfUseMaster]  PRIMARY KEY CLUSTERED ([Id] ASC),
CONSTRAINT [FK_SubTypeOfUseMaster_TypeOfUseMaster]  FOREIGN KEY ([TypeOfUseId]) REFERENCES [PTIS].[TypeOfUseMaster]([Id]),
CONSTRAINT [UQ_SubTypeOfUseMaster_Type_Desc]  UNIQUE ([Description])
)

GO

/****** Object:  Table [PTIS].[RateSectionMaster]******/

CREATE TABLE [PTIS].[RateSectionMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RateSectionNo] [nvarchar](20) NOT NULL,
	[Description] [nvarchar](80) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RateSectionMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RateSectionMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RateSectionMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RateSectionMaster_RateSectionCode] UNIQUE ([RateSectionNo]),
	CONSTRAINT [UQ_RateSectionMaster_Description] UNIQUE ([Description])
)
GO






-- /****** Object:  Table [PTIS].[YearMaster]******/

-- CREATE TABLE [PTIS].[YearMaster](
-- 	[Year] int NOT NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_YearMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_YearMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_YearMaster] PRIMARY KEY CLUSTERED ([Year] ASC)
-- )

-- GO

/****** Object:  Table [PTIS].[PropertyDetails]******/

CREATE TABLE [PTIS].[PropertyDetails](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[IsTaxable] [bit] NULL,
	[PropertyId] [int] NOT NULL,
	[FloorId] [int] NOT NULL,
	[SubFloorId] [int]  NULL,
	[ConstructionYear] [varchar](4) NULL,
	[AssessmentYear] [nvarchar](4) NULL,
	[ConstructionTypeId] [int] NOT  NULL,
	[TypeOfUseId] [int] NOT  NULL,
	[SubTypeOfUseId] [int] NULL,
	[CarpetAreaSqMeter] DECIMAL(18,4) NULL,
	[CarpetAreaSqFeet] DECIMAL(18,4) NULL,
	[BuiltupAreaSqMeter] DECIMAL(18,4) NULL,
	[BuiltupAreaSqFeet] DECIMAL(18,4) NULL,
	[NoOfRooms] [int] NULL,
	[IsRenter] [bit] NULL,
	[IsOpenPlot] [bit] NULL,
	[ChangeDetectionYear] int null,
	-- [TaxLiability] [nvarchar](20) NULL,
	-- [RentMonthly] [float] NULL,
	-- [RentYearly] [float] NULL,
	-- [NonCalculateRentMonthly] [float] NULL,
	-- [RenterNameEnglish] [nvarchar](500) NULL,
	-- [RenterName] [nvarchar](500) NULL,
	-- [AgreementDate] [datetime] NULL,
	-- [AgreementFromDate] [datetime] NULL,
	-- [AgreementToDate] [datetime] NULL,
	-- [IsOccupancyApply] [bit] NULL,
	-- [OccupancyDate] [datetime] NULL,
	-- [OccupancyNumber] [nvarchar](30) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL ,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyDetails_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_PropertyDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [CK_PropertyDetails_Areas_NonNegative]
 CHECK (
     ([CarpetAreaSqMeter] IS NULL OR [CarpetAreaSqMeter] >= 0)
     AND ([CarpetAreaSqFeet] IS NULL OR [CarpetAreaSqFeet] >= 0)
     AND ([BuiltupAreaSqMeter] IS NULL OR [BuiltupAreaSqMeter] >= 0)
     AND ([BuiltupAreaSqFeet] IS NULL OR [BuiltupAreaSqFeet] >= 0)
 ),
 CONSTRAINT [CK_PropertyDetails_NoOfRooms_NonNegative]
 CHECK ([NoOfRooms] IS NULL OR [NoOfRooms] >= 0)
)
GO
ALTER TABLE [PTIS].[PropertyDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyDetails_PropertyMast] 
FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]);
GO
ALTER TABLE [PTIS].[PropertyDetails] CHECK CONSTRAINT [FK_PropertyDetails_PropertyMast];
GO

ALTER TABLE [PTIS].[PropertyDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyDetails_SubFloorMaster] 
FOREIGN KEY([SubFloorId]) REFERENCES [PTIS].[SubFloorMaster]([Id]);
GO
ALTER TABLE [PTIS].[PropertyDetails] CHECK CONSTRAINT [FK_PropertyDetails_SubFloorMaster];
GO

ALTER TABLE [PTIS].[PropertyDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyDetails_ConstructionTypeMaster] 
FOREIGN KEY([ConstructionTypeId]) REFERENCES [PTIS].[ConstructionTypeMaster]([Id]);
GO
ALTER TABLE [PTIS].[PropertyDetails] CHECK CONSTRAINT [FK_PropertyDetails_ConstructionTypeMaster];
GO

ALTER TABLE [PTIS].[PropertyDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyDetails_FloorMaster] 
FOREIGN KEY([FloorId]) REFERENCES [PTIS].[FloorMaster]([Id]);
GO
ALTER TABLE [PTIS].[PropertyDetails] CHECK CONSTRAINT [FK_PropertyDetails_FloorMaster];
GO

ALTER TABLE [PTIS].[PropertyDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyDetails_TypeOfUseMaster] 
FOREIGN KEY([TypeOfUseId]) REFERENCES [PTIS].[TypeOfUseMaster]([Id]);
GO
ALTER TABLE [PTIS].[PropertyDetails] CHECK CONSTRAINT [FK_PropertyDetails_TypeOfUseMaster];
GO

ALTER TABLE [PTIS].[PropertyDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyDetails_SubTypeOfUseMaster]
FOREIGN KEY([SubTypeOfUseId]) REFERENCES [PTIS].[SubTypeOfUseMaster]([Id]);
GO
ALTER TABLE [PTIS].[PropertyDetails] CHECK CONSTRAINT [FK_PropertyDetails_SubTypeOfUseMaster];
GO



-- /****** Object:  Table [PTIS].[PropertyOccupancyDetails]******/
-- CREATE TABLE [PTIS].[PropertyOccupancyDetails](
--     [Id] INT IDENTITY(1,1) NOT NULL,
--     [PropertyDetailId] INT NOT NULL,
--     [OccupancyDate] DATETIME NULL,
--     [OccupancyNumber] NVARCHAR(30) NULL,
--     [IssuedBy] NVARCHAR(100) NULL,
--     [Remarks] NVARCHAR(250) NULL,
--     [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyOccupancyDetails_MarkedForDeletion] DEFAULT (0),
--     [MarkedForDeletionDate] [datetime] NULL ,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyOccupancyDetails_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyDetailsReassessment_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_PropertyDetailsReassessment] PRIMARY KEY CLUSTERED ([Id] ASC)
-- )
-- GO
-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] WITH CHECK
-- ADD CONSTRAINT [FK_PropertyDetailsReassessment_PropertyMast] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]);
-- GO
-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] CHECK CONSTRAINT [FK_PropertyDetailsReassessment_PropertyMast];
-- GO

-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] WITH CHECK
-- ADD CONSTRAINT [FK_PropertyDetailsReassessment_SubFloorMaster] FOREIGN KEY([SubFloorId]) REFERENCES [PTIS].[SubFloorMaster]([Id]);
-- GO
-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] CHECK CONSTRAINT [FK_PropertyDetailsReassessment_SubFloorMaster];
-- GO

-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] WITH CHECK
-- ADD CONSTRAINT [FK_PropertyDetailsReassessment_ConstructionTypeMaster] FOREIGN KEY([ConstructionTypeId]) REFERENCES [PTIS].[ConstructionTypeMaster]([Id]);
-- GO
-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] CHECK CONSTRAINT [FK_PropertyDetailsReassessment_ConstructionTypeMaster];
-- GO

-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] WITH CHECK
-- ADD CONSTRAINT [FK_PropertyDetailsReassessment_FloorMaster] FOREIGN KEY([FloorId]) REFERENCES [PTIS].[FloorMaster]([Id]);
-- GO
-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] CHECK CONSTRAINT [FK_PropertyDetailsReassessment_FloorMaster];
-- GO

-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] WITH CHECK
-- ADD CONSTRAINT [FK_PropertyDetailsReassessment_TypeOfUseMaster] FOREIGN KEY([TypeOfUseId]) REFERENCES [PTIS].[TypeOfUseMaster]([Id]);
-- GO
-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] CHECK CONSTRAINT [FK_PropertyDetailsReassessment_TypeOfUseMaster];
-- GO

-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] WITH CHECK
-- ADD CONSTRAINT [FK_PropertyDetailsReassessment_SubTypeOfUseMaster] FOREIGN KEY([SubTypeOfUseId]) REFERENCES [PTIS].[SubTypeOfUseMaster]([Id]);
-- GO
-- ALTER TABLE [PTIS].[PropertyDetailsReassessment] CHECK CONSTRAINT [FK_PropertyDetailsReassessment_SubTypeOfUseMaster];
-- GO


/* =========================================================
   CORE MASTER TABLES
   ========================================================= */
-- CREATE TABLE [PTIS].[TaxCategoryMaster]
-- (
--     Id INT IDENTITY(1,1) NOT NULL,
--     CategoryCode NVARCHAR(50) NOT NULL,
--     CategoryName NVARCHAR(100) NOT NULL,
--     IsActive BIT NOT NULL CONSTRAINT DF_TaxCategoryMaster_IsActive DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxCategoryMaster_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,
--     CONSTRAINT PK_TaxCategoryMaster PRIMARY KEY (id),
--     CONSTRAINT UQ_TaxCategoryMaster_CategoryCode UNIQUE (CategoryCode)
-- );
-- GO

-- CREATE TABLE PTIS.TaxStatusMaster
-- (
--     Id INT IDENTITY(1,1) NOT NULL,
--     StatusCode NVARCHAR(30) NOT NULL,
--     StatusName NVARCHAR(50) NOT NULL,
--     IsActive BIT NOT NULL CONSTRAINT DF_TaxStatusMaster_IsActive DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxStatusMaster_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,
--     CONSTRAINT PK_TaxStatusMaster PRIMARY KEY (id),
--     CONSTRAINT UQ_TaxStatusMaster_StatusCode UNIQUE (StatusCode)
-- );
-- GO

-- CREATE TABLE PTIS.TaxMaster
-- (
--     Id INT IDENTITY(1,1) NOT NULL,
--     TaxName NVARCHAR(200) NOT NULL,
--     TaxCode NVARCHAR(100) NOT NULL,
--     TaxCategoryId INT NULL,
--     TaxStatusId INT NULL,
--     CalculationMode NVARCHAR(30) NOT NULL DEFAULT 'VALUE_BASED',      -- VALUE_BASED / CONDITION_BASED / MASTER_BASED / HYBRID
--     DefaultBaseType NVARCHAR(20) NOT NULL DEFAULT 'RV',      -- RV / ALV / NONE
--     ValueSourceType NVARCHAR(20) NOT NULL DEFAULT 'RV',      -- RV / ALV / NONE
--     IsRuleBased BIT NOT NULL CONSTRAINT DF_TaxMaster_IsRuleBased DEFAULT (0),
--     IsMasterBased BIT NOT NULL CONSTRAINT DF_TaxMaster_IsMasterBased DEFAULT (0),
--     [DisplayOrder] INT NOT NULL CONSTRAINT DF_TaxMaster_DisplayOrder DEFAULT (1),
-- 	[AssessmentStatus] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_AssessmentStatus] DEFAULT (1),
-- 	[OldTaxStatus] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_OldTaxStatus] DEFAULT (1),
--     IsActive BIT NOT NULL CONSTRAINT DF_TaxMaster_IsActive DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxMaster_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,
--     CONSTRAINT PK_TaxMaster PRIMARY KEY (Id),
--     CONSTRAINT UQ_TaxMaster_TaxCode UNIQUE (TaxCode),
--     CONSTRAINT FK_TaxMaster_TaxCategoryMaster FOREIGN KEY (TaxCategoryId) REFERENCES PTIS.TaxCategoryMaster(Id),
--     CONSTRAINT FK_TaxMaster_TaxStatusMaster FOREIGN KEY (TaxStatusId) REFERENCES PTIS.TaxStatusMaster(Id),
--     CONSTRAINT CK_TaxMaster_CalculationMode CHECK (CalculationMode IN ('VALUE_BASED','CONDITION_BASED','MASTER_BASED','HYBRID')),
--     CONSTRAINT CK_TaxMaster_DefaultBaseType CHECK (DefaultBaseType IN ('RV','ALV','NONE')),
--     CONSTRAINT CK_TaxMaster_ValueSourceType CHECK (ValueSourceType IN ('RV','ALV','NONE'))
-- );
-- GO



-- CREATE TABLE PTIS.TaxCategoryMaster (
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [CategoryCode] NVARCHAR(50) NOT NULL,
--     [CategoryName] NVARCHAR(100) NOT NULL,
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxCategoryMaster_IsActive] DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxCategoryMaster_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,
--     CONSTRAINT [PK_TaxCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
-- 	CONSTRAINT [UQ_TaxCategoryMaster_CategoryCode] UNIQUE ([CategoryCode])
-- );

-- CREATE TABLE PTIS.TaxMaster (
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [TaxCode] NVARCHAR(20) NOT NULL,
--     [TaxName] NVARCHAR(200) NOT NULL,
--     [TaxNameAlias] NVARCHAR(200) NULL,
--     [TaxCategoryId] INT  NULL,
-- 	[CalculationMode] NVARCHAR(20) NOT NULL  CHECK ([CalculationMode] IN ('VALUE_BASED', 'DYNAMIC', 'MASTER_BASED')) DEFAULT 'VALUE_BASED',
--     [DefaultBaseType] NVARCHAR(20) NULL CHECK ([DefaultBaseType] IN ('RV', 'ALV', 'NONE')) default 'RV',
--     [DisplayOrder] INT NOT NULL CONSTRAINT [DF_TaxMaster_DisplayOrder] DEFAULT (0),
--     [TaxOnUnit] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_TaxOnUnit] DEFAULT (0),
-- 	[AssessmentStatus] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_AssessmentStatus] DEFAULT (1),
	-- [OldTaxStatus] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_OldTaxStatus] DEFAULT (1),
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_IsActive] DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxMaster_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,

--     CONSTRAINT [PK_TaxMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
-- 	CONSTRAINT [UQ_TaxMaster_TaxCode] UNIQUE ([TaxCode]),
-- 	CONSTRAINT [UQ_TaxMaster_TaxName] UNIQUE ([TaxName]),
--     CONSTRAINT [FK_TaxMaster_Category] FOREIGN KEY ([TaxCategoryId])
--     REFERENCES PTIS.TaxCategoryMaster([Id])
-- );
/****** Object:  Table [PTIS].[ActiveTaxesMaster]******/
CREATE TABLE PTIS.TaxCategoryMaster (
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CategoryCode] NVARCHAR(50) NOT NULL,
    [CategoryName] NVARCHAR(100) NOT NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxCategoryMaster_IsActive] DEFAULT (1),
    [IsProtected] [bit] NOT NULL CONSTRAINT [DF_TaxCategoryMaster_IsProtected] DEFAULT (0),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxCategoryMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_TaxCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_TaxCategoryMaster_CategoryCode] UNIQUE ([CategoryCode])
);

GO

CREATE TABLE [PTIS].[TaxCalculationModeMaster] (
    [Id]                  INT            IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ModeCode]            VARCHAR(20)   NOT NULL,
    [ModeName]            VARCHAR(100)  NOT NULL,
    [DisplayOrder]        INT            NOT NULL CONSTRAINT [DF_TaxCalculationModeMaster_DisplayOrder]        DEFAULT (0),
    [UsesValueConfig]     BIT            NOT NULL CONSTRAINT [DF_TaxCalculationModeMaster_UsesValueConfig]     DEFAULT (0),
    [UsesConditionConfig] BIT            NOT NULL CONSTRAINT [DF_TaxCalculationModeMaster_UsesConditionConfig] DEFAULT (0),
    [UsesMasterConfig]    BIT            NOT NULL CONSTRAINT [DF_TaxCalculationModeMaster_UsesMasterConfig]    DEFAULT (0),
    [UsesHybridConfig]    BIT            NOT NULL CONSTRAINT [DF_TaxCalculationModeMaster_UsesHybridConfig]    DEFAULT (0),
    [IsActive]            BIT            NOT NULL CONSTRAINT [DF_TaxCalculationModeMaster_IsActive]            DEFAULT (1),
    [CreatedBy]           INT            NULL,
    [CreatedDate]         DATETIME       NULL CONSTRAINT [DF_TaxCalculationModeMaster_CreatedDate]             DEFAULT (GETDATE()),
    [UpdatedBy]           INT            NULL,
    [UpdatedDate]         DATETIME       NULL,
    CONSTRAINT [PK_TaxCalculationModeMaster] PRIMARY KEY CLUSTERED ([Id])
);
CREATE UNIQUE INDEX [UQ_TaxCalculationModeMaster_ModeCode]
    ON [PTIS].[TaxCalculationModeMaster] ([ModeCode]);
GO

CREATE TABLE [PTIS].[DynamicTaxRuleMaster] (
    [Id]                INT            IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [DisplayName]       NVARCHAR(200)  NOT NULL,
    [RuleType]          VARCHAR(20)   NOT NULL,
    [AttachedReference] VARCHAR(200)  NULL,
    [SortOrder]         INT            NOT NULL CONSTRAINT [DF_DynamicTaxRuleMaster_SortOrder] DEFAULT (0),
    [Description]       NVARCHAR(MAX)  NULL,
    [IsActive]          BIT            NOT NULL CONSTRAINT [DF_DynamicTaxRuleMaster_IsActive]  DEFAULT (1),
    [CreatedBy]         INT            NULL,
    [CreatedDate]       DATETIME       NULL CONSTRAINT [DF_DynamicTaxRuleMaster_CreatedDate]   DEFAULT (GETDATE()),
    [UpdatedBy]         INT            NULL,
    [UpdatedDate]       DATETIME       NULL,
    CONSTRAINT [PK_DynamicTaxRuleMaster] PRIMARY KEY CLUSTERED ([Id])
);
CREATE UNIQUE INDEX [UQ_DynamicTaxRuleMaster_DisplayName]
    ON [PTIS].[DynamicTaxRuleMaster] ([DisplayName]);
GO

CREATE TABLE PTIS.TaxMaster (
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TaxCode] NVARCHAR(20) NOT NULL,
    [TaxName] NVARCHAR(200) NOT NULL,
    [TaxNameAlias] NVARCHAR(200) NULL,
    [TaxCategoryId] INT NOT NULL,
    [DisplayOrder] INT NOT NULL CONSTRAINT [DF_TaxMaster_DisplayOrder] DEFAULT (0),
    [TaxOnUnit] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_TaxOnUnit] DEFAULT (0),
	[AssessmentStatus] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_AssessmentStatus] DEFAULT (1),
	[OldTaxStatus] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_OldTaxStatus] DEFAULT (1),
	[CalculationModeId] [int] NOT NULL,
	[RuleDefinitionId] INT NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_IsActive] DEFAULT (1),
    [IsProtected] [bit] NOT NULL CONSTRAINT [DF_TaxMaster_IsProtected] DEFAULT (0),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,

    CONSTRAINT [PK_TaxMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_TaxMaster_TaxCode] UNIQUE ([TaxCode]),
	CONSTRAINT [UQ_TaxMaster_TaxName] UNIQUE ([TaxName]),
    CONSTRAINT [FK_TaxMaster_Category] FOREIGN KEY ([TaxCategoryId])
    REFERENCES PTIS.TaxCategoryMaster([Id]),
	CONSTRAINT [FK_TaxMaster_TaxCalculationModeMaster] FOREIGN KEY ([CalculationModeId])
	REFERENCES [PTIS].[TaxCalculationModeMaster] ([Id]),
	CONSTRAINT [FK_TaxMaster_DynamicTaxRuleMaster] FOREIGN KEY ([RuleDefinitionId]) 
	REFERENCES [PTIS].[DynamicTaxRuleMaster] ([Id])
);
GO

CREATE TABLE [PTIS].[TaxMasterMapping] (
    [Id]                    INT            IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TaxId]                 INT            NOT NULL,
    [MasterKey]             VARCHAR(50)   NOT NULL,
    [DisplayValue]          NVARCHAR(200)  NULL,
    [AssessmentYearRangeId] INT            NOT NULL,
    [ResultMode]            VARCHAR(10)   NOT NULL CONSTRAINT [DF_TaxMasterMapping_ResultMode]  DEFAULT ('FIXED'),
    [ResultBase]            VARCHAR(10)   NOT NULL CONSTRAINT [DF_TaxMasterMapping_ResultBase]  DEFAULT ('NONE'),
    [ResultValue]           DECIMAL(18,2)  NULL     CONSTRAINT [DF_TaxMasterMapping_ResultValue] DEFAULT (0),
    [IsActive]              BIT            NOT NULL CONSTRAINT [DF_TaxMasterMapping_IsActive]    DEFAULT (1),
    [CreatedBy]             INT            NULL,
    [CreatedDate]           DATETIME       NULL CONSTRAINT [DF_TaxMasterMapping_CreatedDate]     DEFAULT (GETDATE()),
    [UpdatedBy]             INT            NULL,
    [UpdatedDate]           DATETIME       NULL,
    CONSTRAINT [PK_TaxMasterMapping] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_TaxMasterMapping_TaxMaster]
        FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [UQ_TaxMasterMapping_Tax_Year_Key]
    ON [PTIS].[TaxMasterMapping] ([TaxId], [AssessmentYearRangeId], [MasterKey]);
GO

CREATE TABLE [PTIS].[TaxConditionRule] (
    [Id]                    INT            IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TaxId]                 INT            NOT NULL,
    [SortOrder]             INT            NOT NULL CONSTRAINT [DF_TaxConditionRule_SortOrder]   DEFAULT (0),
    [ConditionsJson]        NVARCHAR(MAX)  NOT NULL,
    [AssessmentYearRangeId] INT            NULL,
    [ResultMode]            VARCHAR(10)   NOT NULL CONSTRAINT [DF_TaxConditionRule_ResultMode]  DEFAULT ('FIXED'),
    [ResultBase]            VARCHAR(10)   NOT NULL CONSTRAINT [DF_TaxConditionRule_ResultBase]  DEFAULT ('NONE'),
    [ResultValue]           DECIMAL(18,2)  NULL     CONSTRAINT [DF_TaxConditionRule_ResultValue] DEFAULT (0),
    [ReferenceTaxId]        INT            NULL,
    [UnitFieldId]           VARCHAR(100)  NULL,
    [StopFurtherProcessing] BIT            NOT NULL CONSTRAINT [DF_TaxConditionRule_StopFurtherProcessing] DEFAULT (0),
    [IsBuildingBased]       BIT            NOT NULL CONSTRAINT [DF_TaxConditionRule_IsBuildingBased]       DEFAULT (0),
    [IsActive]              BIT            NOT NULL CONSTRAINT [DF_TaxConditionRule_IsActive]              DEFAULT (1),
    [CreatedBy]             INT            NULL,
    [CreatedDate]           DATETIME       NULL CONSTRAINT [DF_TaxConditionRule_CreatedDate]               DEFAULT (GETDATE()),
    [UpdatedBy]             INT            NULL,
    [UpdatedDate]           DATETIME       NULL,
	[AssessmentBasis]       NVARCHAR(30)   NULL,
    CONSTRAINT [PK_TaxConditionRule] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_TaxConditionRule_TaxMaster]
        FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TaxConditionRule_TaxMaster_ReferenceTaxId]
        FOREIGN KEY ([ReferenceTaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]) ON DELETE NO ACTION
);
CREATE INDEX [IX_TaxConditionRule_Tax_SortOrder]
    ON [PTIS].[TaxConditionRule] ([TaxId], [SortOrder]);
CREATE INDEX [IX_TaxConditionRule_ReferenceTaxId]
        ON [PTIS].[TaxConditionRule] ([ReferenceTaxId]);
GO

CREATE TABLE [PTIS].[TaxHybridConfig] (
    [Id]                 INT           IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TaxId]              INT           NOT NULL,
    [EvaluationPriority] VARCHAR(30)  NOT NULL CONSTRAINT [DF_TaxHybridConfig_EvaluationPriority] DEFAULT ('MASTER_THEN_CONDITION'),
    [FallbackStrategy]   VARCHAR(20)  NOT NULL CONSTRAINT [DF_TaxHybridConfig_FallbackStrategy]   DEFAULT ('DEFAULT_ZERO'),
    [ResultBase]         VARCHAR(10)  NOT NULL CONSTRAINT [DF_TaxHybridConfig_ResultBase]         DEFAULT ('NONE'),
    [IsActive]           BIT           NOT NULL CONSTRAINT [DF_TaxHybridConfig_IsActive]           DEFAULT (1),
    [CreatedBy]          INT           NULL,
    [CreatedDate]        DATETIME      NULL CONSTRAINT [DF_TaxHybridConfig_CreatedDate]            DEFAULT (GETDATE()),
    [UpdatedBy]          INT           NULL,
    [UpdatedDate]        DATETIME      NULL,
    CONSTRAINT [PK_TaxHybridConfig] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_TaxHybridConfig_TaxMaster] FOREIGN KEY ([TaxId]) 
	REFERENCES [PTIS].[TaxMaster] ([Id]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [UQ_TaxHybridConfig_TaxId]
    ON [PTIS].[TaxHybridConfig] ([TaxId]);
GO

/****** Object:  Table [PTIS].[AgeFactorCVMaster]******/

CREATE TABLE [PTIS].[AgeFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ConstructionTypeId] int NOT NULL,
	[AgeFrom] [int] NOT NULL,
	[AgeTo] [int] NOT NULL,
	[Factor] [decimal](5, 2) NOT NULL,
	[YearRangeCVId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AgeFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_AgeFactorCVMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
CONSTRAINT [PK_AgeFactorCVMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
CONSTRAINT [UQ_AgeFactorCVMaster] UNIQUE ([ConstructionTypeId], [AgeFrom], [AgeTo], [YearRangeCVId])
	)
GO

ALTER TABLE [PTIS].[AgeFactorCVMaster]  WITH CHECK ADD  CONSTRAINT [FK_AgeFactorCVMaster_ConstructionTypeMaster] FOREIGN KEY([ConstructionTypeId])
REFERENCES [PTIS].[ConstructionTypeMaster] ([Id])
GO

ALTER TABLE [PTIS].[AgeFactorCVMaster] CHECK CONSTRAINT [FK_AgeFactorCVMaster_ConstructionTypeMaster]
GO

ALTER TABLE [PTIS].[AgeFactorCVMaster]  WITH CHECK ADD  CONSTRAINT [FK_AgeFactorCVMaster_AssessmentYearRangeMasterCV] FOREIGN KEY([YearRangeCVId])
REFERENCES [PTIS].[AssessmentYearRangeMasterCV] ([Id])
GO
ALTER TABLE [PTIS].[AgeFactorCVMaster] CHECK CONSTRAINT [FK_AgeFactorCVMaster_AssessmentYearRangeMasterCV]
GO




/* ============================================================================
   Table: PTIS.PolicyCodeMaster
   Purpose:
   Master table for all policy codes used in property tax processing.

   PolicyType:
   NORMAL      : NETTAX, AS_PER_OLD, MIN_RV, RETENTION
   DATE_BASED  : OC_PARTIAL, OC, CC_PARTIAL, CC, ELECTRIC_PARTIAL, ELECTRIC_BILL
   STAGE_BASED : SECTION_129_OLD_1, SECTION_129_OLD_2, SECTION_129_20,
                 SECTION_129_40, SECTION_129_60, SECTION_129_80, SECTION_129_100
   DECISION    : HEARING, APPEAL_COMMITTEE, REMISSION

   Each _PARTIAL / staged policy chains to its next policy via
   NextPolicyCodeId (e.g. OC_PARTIAL -> OC, SECTION_129_20 -> SECTION_129_40).

   OC / CC / Electric Bill calculation rules are configured via the
   Retrospective Rule Engine (PTIS.RetrospectiveRuleMaster and related
   tables), not on this table.
============================================================================ */

CREATE TABLE [PTIS].[PolicyCodeMaster]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    [PolicyCode] VARCHAR(30) NOT NULL,
    [PolicyName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(300) NULL,

    /*
        NORMAL:
            NETTAX
            AS_PER_OLD
            MIN_RV
            RETENTION

        DATE_BASED:
            OC_PARTIAL
            OC
            CC_PARTIAL
            CC
            ELECTRIC_PARTIAL
            ELECTRIC_BILL

        STAGE_BASED:
            SECTION_129 stages

        DECISION:
            HEARING
            APPEAL_COMMITTEE
            REMISSION
    */
    [PolicyType] VARCHAR(20) NOT NULL,

    /*
        Identifies the next policy stage.

        Examples:
            OC_PARTIAL -> OC
            SECTION_129_20 -> SECTION_129_40
    */
    [NextPolicyCodeId] INT NULL,

    /*
        1 = No further policy stage is required.
        0 = Next policy stage is pending.
    */
    [IsFinalStage] BIT NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_IsFinalStage]
        DEFAULT (0),

    /*
        1 = No other policy can be applied together
            with this policy.
    */
    [IsExclusive] BIT NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_IsExclusive]
        DEFAULT (0),

    /*
        1 = Policy requires next-year or stage processing.
    */
    [RequiresStageTracking] BIT NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_RequiresStageTracking]
        DEFAULT (0),

    [DisplayOrder] INT NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_DisplayOrder]
        DEFAULT (0),

	[IsProtected] BIT NOT NULL
		CONSTRAINT [DF_PolicyCodeMaster_IsProtected]
		DEFAULT (0),

    /*
        1 = This policy represents retrospective demand (OC/CC/Electric Bill and their
            PARTIAL_ variants). Read by the Retrospective Tax engine to distinguish retro
            demand from current-year (NETTAX) and migrated-arrears (OLD_ARREARS) demand in
            PTIS.TransMast, without repeating the classification on every TransMast row.
    */
    [IsRetroDemand] BIT NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_IsRetroDemand]
        DEFAULT (0),

    [IsActive] BIT NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_IsActive]
        DEFAULT (1),

    [CreatedBy] INT NULL,

    [CreatedDate] DATETIME NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_CreatedDate]
        DEFAULT (GETDATE()),

    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_PolicyCodeMaster]
        PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [UQ_PolicyCodeMaster_PolicyCode]
        UNIQUE ([PolicyCode]),

    CONSTRAINT [CK_PolicyCodeMaster_PolicyType]
        CHECK
        (
            [PolicyType] IN
            (
                'NORMAL',
                'DATE_BASED',
                'STAGE_BASED',
                'DECISION'
            )
        ),

    CONSTRAINT [FK_PolicyCodeMaster_NextPolicyCodeId]
        FOREIGN KEY ([NextPolicyCodeId])
        REFERENCES [PTIS].[PolicyCodeMaster] ([Id])
);
GO




/****** Object:  Table [PTIS].[PolicyTaxDetails] ******/
-- DBA final design. PolicyCode (varchar + CHECK) is replaced by
-- PolicyCodeId (FK to PTIS.PolicyCodeMaster, added below once that
-- table exists further down this script -- see the deferred
-- ALTER TABLE next to PTIS.PolicyCodeMaster). PolicyRVorCVvalue is
-- renamed to CalculationValue; PolicyDate is dropped.


CREATE TABLE [PTIS].[PolicyTaxDetails]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] INT NOT NULL,
    [PolicyCodeId] INT NOT NULL,
    [CalculationValue] DECIMAL(19,4) NULL,
    [TaxId] INT NOT NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
	[IsCurrent] BIT NOT NULL CONSTRAINT [DF_PolicyTaxDetails_IsCurrent] DEFAULT (1),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_PolicyTaxDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME  NULL  ,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_PolicyTaxDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_PolicyTaxDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
 
    CONSTRAINT [PK_PolicyTaxDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PolicyTaxDetails_PropertyMast_PropertyId] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
    CONSTRAINT [FK_PolicyTaxDetails_TaxMaster_TaxId] FOREIGN KEY([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]),
	CONSTRAINT [FK_PolicyTaxDetails_PolicyCodeMaster_PolicyCodeId] FOREIGN KEY ([PolicyCodeId]) REFERENCES [PTIS].[PolicyCodeMaster] ([Id])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PolicyTaxDetails_Property_PolicyCode_Tax_Current]
ON [PTIS].[PolicyTaxDetails] ([PropertyId], [PolicyCodeId],[TaxId]  ) 
WHERE [IsCurrent] = 1  AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO
CREATE INDEX [IX_PolicyTaxDetails_PropertyId] ON [PTIS].[PolicyTaxDetails]([PropertyId]);

CREATE NONCLUSTERED INDEX
    [IX_PolicyTaxDetails_Property_Current] ON [PTIS].[PolicyTaxDetails] (  [PropertyId],  [IsCurrent])
INCLUDE( [TaxId], [TaxAmount], [PolicyCodeId], [CalculationValue]);
GO

CREATE INDEX [IX_PolicyTaxDetails_TaxId] ON [PTIS].[PolicyTaxDetails]([TaxId]);
GO     


----------- Policy tax details for Cv--------------
CREATE TABLE [PTIS].[PolicyTaxDetailsCV]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] INT NOT NULL,
    [PolicyCodeId] INT NOT NULL,
    [CalculationValue] DECIMAL(19,4) NULL,
    [TaxId] INT NOT NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
	[IsCurrent] BIT NOT NULL CONSTRAINT [DF_PolicyTaxDetailsCV_IsCurrent] DEFAULT (1),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_PolicyTaxDetailsCV_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME  NULL  ,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_PolicyTaxDetailsCV_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_PolicyTaxDetailsCV_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
 
    CONSTRAINT [PK_PolicyTaxDetailsCV] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PolicyTaxDetailsCV_PropertyMast_PropertyId] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
    CONSTRAINT [FK_PolicyTaxDetailsCV_TaxMaster_TaxId] FOREIGN KEY([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]),
    CONSTRAINT [FK_PolicyTaxDetailsCV_PolicyCodeMaster_PolicyCodeId] FOREIGN KEY ([PolicyCodeId]) REFERENCES [PTIS].[PolicyCodeMaster] ([Id])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PolicyTaxDetailsCV_Property_PolicyCode_Tax_Current]
ON [PTIS].[PolicyTaxDetailsCV] ([PropertyId], [PolicyCodeId],[TaxId]  ) 
WHERE [IsCurrent] = 1  AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO
CREATE INDEX [IX_PolicyTaxDetailsCV_PropertyId] ON [PTIS].[PolicyTaxDetailsCV]([PropertyId]);

CREATE NONCLUSTERED INDEX
    [IX_PolicyTaxDetailsCV_Property_Current] ON [PTIS].[PolicyTaxDetailsCV] (  [PropertyId],  [IsCurrent])
INCLUDE( [TaxId], [TaxAmount], [PolicyCodeId], [CalculationValue]);
GO

CREATE INDEX [IX_PolicyTaxDetailsCV_TaxId] ON [PTIS].[PolicyTaxDetailsCV]([TaxId]);
GO     




/****** Object:  Table [PTIS].[ApplyTaxesMaster]******/

CREATE TABLE [PTIS].[ApplyTaxesMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] [int] NOT NULL,
    [TaxId] [int] NOT NULL,
    -- [IsTaxForPlot] [bit] NOT NULL CONSTRAINT [DF_ApplyTaxesMaster_IsTaxForPlot] DEFAULT ((0)),
    -- [IsPolicyApplicable] [bit] NOT NULL CONSTRAINT [DF_ApplyTaxesMaster_IsPolicyApplicable] DEFAULT ((0)),	
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_ApplyTaxesMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL ,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_ApplyTaxesMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_ApplyTaxesMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,

    CONSTRAINT [PK_ApplyTaxesMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_ApplyTaxesMaster_PropertyMast_PropertyId] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
    CONSTRAINT [FK_ApplyTaxesMaster_TaxMaster_TaxId] FOREIGN KEY([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]),
	CONSTRAINT [UQ_ApplyTaxesMaster_PropertyId_TaxId] UNIQUE ([PropertyId], [TaxId])
);
GO


-- /****** Object:  Table [PTIS].[AssessmentMaster] ******/
-- CREATE TABLE [PTIS].[AssessmentMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[FromYear] [int] NULL,
-- 	[ToYear] [int] NULL,
-- 	[MaxYear] [int] NULL,
-- 	[MinRV] [money] NULL,
-- 	[NPAddress] [nvarchar](250) NULL,
-- 	[ThirdPartyName] [nvarchar](150) NULL,
-- 	[ThirdPartyAddress] [nvarchar](250) NULL,
-- 	[ThirdPartyContact] [nvarchar](12) NULL,
-- 	[ThirdPartyWebSite] [nvarchar](100) NULL,
-- 	[ThirdPartyEmail] [nvarchar](100) NULL,
-- 	[NPRemark] [nvarchar](250) NULL,
-- 	[ThirdPartyRemark] [nvarchar](250) NULL,
-- 	[SrNo] [smallint] NULL,
-- 	[NPIcon] [varbinary](max) NULL,
-- 	[ThirdPartyIcon] [varbinary](max) NULL,
-- 	[NPImage] [varbinary](max) NULL,
-- 	[ThirdPartyImage] [varbinary](max) NULL,
-- 	[NPcon] [varchar](50) NULL,
-- 	[NPContactNo] [nvarchar](15) NULL,
-- 	[NPEmail] [nvarchar](100) NULL,
-- 	[NPWebsite] [nvarchar](100) NULL,
-- 	[ThirdPartyCopyRight] [nvarchar](250) NULL,
-- 	[CouncilId] [int] NULL,
-- 	[NPTitle] [nvarchar](250) NULL,
-- 	[NPAddressInLocal] [nvarchar](300) NULL,
-- 	[PartyNameInLocal] [nvarchar](250) NULL,
-- 	[PartyAddressInLocal] [nvarchar](300) NULL,
-- 	[NPPrefix] [nvarchar](10) NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_AssessmentMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_AssessmentMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_AssessmentMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY] 
-- GO


-- /****** Object:  Table [PTIS].[BillBookMaster]******/

-- CREATE TABLE [PTIS].[BillBookMaster](
-- 	[Id] [int]  IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[EmpName] [nvarchar](50) NOT NULL,
-- 	[BillBookNo] [nvarchar](50) NULL,
-- 	[ReceiptNoFrom] [int] NULL,
-- 	[ReceiptNoTo] [int] NULL,
-- 	[Date] [datetime] NULL,
-- 	[Remark] [nvarchar](20) NULL,
-- 	[BookDescription] [nvarchar](50) NULL,
-- 	[Year] [int] NULL,
-- 	[EmpId] [int] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_BillBookMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_BillBookMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_BillBookMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO
-- ALTER TABLE PTIS.BillBookMaster ADD CONSTRAINT UQ_BillBookMaster_EmpName_Year UNIQUE (EmpName, Year);
-- GO



/****** Object:  Table [PTIS].[AssessmentYearRangeMaster] ******/
CREATE TABLE [PTIS].[AssessmentYearRangeMasterRV](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FromYear] [int] NOT NULL,
	[ToYear] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RVAssessmentYearRangeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RVAssessmentYearRangeMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_AssessmentYearRangeMasterRV] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_AssessmentYearRangeMasterRV_FromYear_ToYear] UNIQUE ([FromYear], [ToYear]),
	-- A range is identified by the year it starts in: the rate seeds join on FromYear alone (their rows say 2016-2025 while the
	-- current range is 2016-2026), which is only safe because no two ranges can start in the same year. Two ranges that did
	-- would overlap, and a rate row would then match both of them.
	CONSTRAINT [UQ_AssessmentYearRangeMasterRV_FromYear] UNIQUE ([FromYear]),
	CONSTRAINT [CK_AssessmentYearRangeMasterRV_ValidYear] CHECK (FromYear <= ToYear)
)

GO



/****** Object:  Table [PTIS].[TaxPercentageMasterCV]******/

CREATE TABLE PTIS.TaxPercentageMasterCV (
		[Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
		[TaxId] INT NOT NULL,
		[TypeOfUseId] INT NOT NULL,
		[YearRangeCVId] INT NOT NULL,
		[TaxPercentage] DECIMAL(10,4) NOT NULL,
		[IsActive] BIT NOT NULL CONSTRAINT DF_TaxPercentageMasterCV_IsActive DEFAULT (1),
		[CreatedBy] INT NULL,
		[CreatedDate] DATETIME NOT NULL CONSTRAINT DF_TaxPercentageMasterCV_CreatedDate DEFAULT (GETDATE()),
		[UpdatedBy] INT NULL,
		[UpdatedDate] DATETIME NULL,
		CONSTRAINT PK_TaxPercentageMasterCV PRIMARY KEY CLUSTERED ([Id] ASC),
		CONSTRAINT FK_TaxPercentageMasterCV_TaxMaster FOREIGN KEY (TaxId) REFERENCES PTIS.TaxMaster(Id),
		CONSTRAINT FK_TaxPercentageMasterCV_TypeOfUseId FOREIGN KEY (TypeOfUseId) REFERENCES PTIS.TypeOfUseMaster(Id),
		CONSTRAINT FK_TaxPercentageMasterCV_AssessmentYearRangeCVId FOREIGN KEY (YearRangeCVId) REFERENCES PTIS.AssessmentYearRangeMasterCV(Id),
		CONSTRAINT UQ_TaxPercentageMasterCV_TypeOfUseId_YearRangeCVId UNIQUE (TypeOfUseId, YearRangeCVId, TaxId)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[TaxPercentageMasterRV]******/
CREATE TABLE PTIS.TaxPercentageMasterRV (
		[Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
		[TaxId] INT NOT NULL,
		[TypeOfUseId] INT NOT NULL,
		[YearRangeRVId] INT NOT NULL,
		[TaxPercentage] DECIMAL(10,4) NOT NULL,
		[BaseType] VARCHAR(10) NOT NULL CONSTRAINT [DF_TaxPercentageMasterRV_BaseType] DEFAULT ('RV'),
		[IsActive] BIT NOT NULL CONSTRAINT DF_TaxPercentageMasterRV_IsActive DEFAULT (1),
		[CreatedBy] INT NULL,
		[CreatedDate] DATETIME NOT NULL CONSTRAINT DF_TaxPercentageMasterRV_CreatedDate DEFAULT (GETDATE()),
		[UpdatedBy] INT NULL,
		[UpdatedDate] DATETIME NULL,
		CONSTRAINT PK_TaxPercentageMasterRV PRIMARY KEY CLUSTERED ([Id] ASC),
		CONSTRAINT FK_TaxPercentageMasterRV_TaxMaster FOREIGN KEY (TaxId) REFERENCES PTIS.TaxMaster(Id),
		CONSTRAINT FK_TaxPercentageMasterRV_TypeOfUseId FOREIGN KEY (TypeOfUseId) REFERENCES PTIS.TypeOfUseMaster(Id),
		CONSTRAINT FK_TaxPercentageMasterRV_AssessmentYearRangeRVId FOREIGN KEY (YearRangeRVId) REFERENCES PTIS.AssessmentYearRangeMasterRV(Id),
		CONSTRAINT UQ_TaxPercentageMasterRV_TaxId_TypeOfUseId_YearRangeRVId UNIQUE (TaxId, TypeOfUseId, YearRangeRVId)
) ON [PRIMARY]
GO
-- /****** Object:  Table [PTIS].[ConditionMaster]******/
-- SET ANSI_NULLS ON
-- GO

-- SET QUOTED_IDENTIFIER ON
-- GO

-- CREATE TABLE [PTIS].[ConditionMaster](
-- 	[ConditionID] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[FloorId] [nvarchar](500) NULL,
-- 	[ConstructionTypeId] [nvarchar](100) NULL,
-- 	[PropType] [nvarchar](50) NULL,
-- 	[TypeOfUseId] [nvarchar](600) NULL,
-- 	[RatePercent] [int] NOT NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ConditionMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_ConditionMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_ConditionMaster] PRIMARY KEY CLUSTERED ([ConditionID] ASC)
-- ) ON [PRIMARY] 
-- GO

-- /****** Object:  Table [PTIS].[ConditionMasterRates]******/
-- SET ANSI_NULLS ON
-- GO

-- SET QUOTED_IDENTIFIER ON
-- GO

-- CREATE TABLE [PTIS].[ConditionMasterRates](
-- 	[RateID] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[FloorId] [nvarchar](10) NULL,
-- 	[ConstructionTypeId] [nvarchar](7) NULL,
-- 	[PropType] [nvarchar](10) NULL,
-- 	[TypeOfUseId] [varchar](10) NULL,
-- 	[RatePercent] [int] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ConditionMasterRates_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_ConditionMasterRates_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_ConditionMasterRates] PRIMARY KEY CLUSTERED ([RateID] ASC)
-- ) ON [PRIMARY]
-- GO


/****** Object:  Table [PTIS].[DepreciationMaster]******/

CREATE TABLE [PTIS].[DepreciationMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ConstructionTypeId] [int] NOT NULL,
	-- [YearRangeRVId] [int] NOT NULL,
	[MinYear] [int] NULL,
	[MaxYear] [int] NULL,
	[Rate] DECIMAL(12,6) NULL,
	-- [Year] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_DepreciationMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_DepreciationMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,

 CONSTRAINT [PK_DepreciationMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_DepreciationMaster] UNIQUE ([ConstructionTypeId], [MinYear], [MaxYear])
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[DepreciationMaster] WITH CHECK ADD CONSTRAINT [FK_DepreciationMaster_ConstructionTypeMaster]
FOREIGN KEY([ConstructionTypeId]) REFERENCES [PTIS].[ConstructionTypeMaster]([Id]);
GO

ALTER TABLE [PTIS].[DepreciationMaster] CHECK CONSTRAINT [FK_DepreciationMaster_ConstructionTypeMaster];
GO


/****** Object:  Table [PTIS].[EducationTaxMaster]******/

CREATE TABLE [PTIS].[EducationTaxMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[Type] [varchar](5) NULL,
	[Year] [int] NULL,
	[MinAmount] DECIMAL(19,4) NULL,
	[MaxAmount] DECIMAL(19,4) NULL,
	[Rate] DECIMAL(19,6) NULL,
	[OnRVOrALV] [varchar](5) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_EducationTaxMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_EducationTaxMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_EducationTaxMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[EmploymentTaxMaster]******/

CREATE TABLE [PTIS].[EmploymentTaxMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[Type] [varchar](5) NULL,
	[Year] [int] NULL,
	[MinAmount] DECIMAL(19,4) NULL,
	[MaxAmount] DECIMAL(19,4) NULL,
	[Rate] DECIMAL(19,6) NULL,
	[OnRVOrALV] [varchar](5) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_EmploymentTaxMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_EmploymentTaxMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_EmploymentTaxMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO


-- /****** Object:  Table [PTIS].[FlagMaster]******/

-- CREATE TABLE [PTIS].[FlagMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PropertyId] [int] NOT NULL,
-- 	[LatestTaxCalculated] [bit] NOT NULL,
-- 	[NewSecurityDeposit] [bit] NOT NULL,
-- 	[NakkalDownloadAvailable] [bit] NOT NULL,
-- 	[RenterNameVisible] [bit] NOT NULL,
-- 	[NoticeDownloaded] [bit] NOT NULL,
-- 	[NewPropertyRegistered] [bit] NOT NULL,
-- 	[PropertyChangedForTax] [bit] NOT NULL,
-- 	[ReportGenerated] [bit] NOT NULL,
-- 	[TreeSavardhanApplied] [bit] NOT NULL,
-- 	[VermiCompostApplied] [bit] NOT NULL,
-- 	[FamilyPlanning] [bit] NOT NULL,
-- 	[FemaleOwner] [bit] NOT NULL,
-- 	[Solar] [bit] NOT NULL,
-- 	[Boar] [bit] NOT NULL,
-- 	[RainwaterHarvesting] [bit] NOT NULL,
-- 	[WaterConnectionStatus] [bit] NOT NULL,
-- 	[HandPump] [bit] NOT NULL,
-- 	[Well] [bit] NOT NULL,
-- 	[Lift] [bit] NOT NULL,
-- 	[ToiletDrainage] [bit] NOT NULL,
-- 	[Act129Applied] [bit] NOT NULL,
-- 	[ToiletSepticTank] [bit] NOT NULL,
-- 	[BhuyariGatar] [bit] NOT NULL,
-- 	[DieselGeneratorSet] [bit] NOT NULL,
-- 	[FireFightingSystem] [bit] NOT NULL,
-- 	[RegistrationForMTDC] [bit] NOT NULL,
-- 	[SolarElectric] [bit] NOT NULL,
-- 	[SolarWaterHeater] [bit] NOT NULL,
-- 	[STP] [bit] NOT NULL,
-- 	[GreenProperty] [bit] NOT NULL,
-- 	[ElectricityChargingStation] [bit] NOT NULL,
-- 	[FireMachine] [bit] NOT NULL,
-- 	[DieselGenerator] [bit] NOT NULL,
-- 	[MTDCRegistered] [bit] NOT NULL,
-- 	[MaintenancePercent] [money] NOT NULL,
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_FlagMaster_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL ,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_FlagMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_FlagMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_FlagMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO



/****** Object:  Table [PTIS].[FloorFactorCVMaster]******/

CREATE TABLE [PTIS].[FloorFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FloorId] [int] NOT NULL,
	[FactorWithLift] [decimal](5, 2) NULL,
	[FactorWithoutLift] [decimal](5, 2) NULL,
	[YearRangeCVId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_FloorFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_FloorFactorCVMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_FloorFactorCVMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_FloorFactorCVMaster] UNIQUE ([FloorId], [YearRangeCVId])
) ON [PRIMARY]
GO
ALTER TABLE [PTIS].[FloorFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_FloorFactorCVMaster_FloorMaster]
FOREIGN KEY([FloorId]) REFERENCES [PTIS].[FloorMaster]([Id]);
GO

ALTER TABLE [PTIS].[FloorFactorCVMaster] CHECK CONSTRAINT [FK_FloorFactorCVMaster_FloorMaster];
GO

ALTER TABLE [PTIS].[FloorFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_FloorFactorCVMaster_AssessmentYearRangeCVMaster]
FOREIGN KEY([YearRangeCVId]) REFERENCES [PTIS].[AssessmentYearRangeMasterCV]([Id]);
GO	
ALTER TABLE [PTIS].[FloorFactorCVMaster] CHECK CONSTRAINT [FK_FloorFactorCVMaster_AssessmentYearRangeCVMaster];
GO


CREATE TABLE [PTIS].[RoomTypeMaster](
   	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RoomTypeName] NVARCHAR(100) NOT NULL,
    [RoomTypeCode] NVARCHAR(20) NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_RoomTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RoomTypeMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RoomTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	constraint UQ_RoomTypeMaster_RoomTypeName UNIQUE (RoomTypeName)
);



/****** Object:  Table [PTIS].[RoomWiseSubmissionDetails]******/

 

CREATE TABLE [PTIS].[RoomWiseSubmissionDetails]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] [int] NULL,
    [PropertyDetailsId] [int] NULL,
    [LengthMtr] DECIMAL(18,4) NULL,
    [WidthMtr] DECIMAL(18,4) NULL,
    [AreaSqMtr] DECIMAL(18,4) NULL,
    [HeightMtr] DECIMAL(18,4) NULL,
    [Base1Mtr] DECIMAL(18,4) NULL,
    [Base2Mtr] DECIMAL(18,4) NULL,
    [NoOfRooms] [int] NULL,
    [TotalAreaSqMtr] DECIMAL(18,4) NULL,
    [Shape] [nvarchar](25) NULL,
    [RoomNo] [nvarchar](100) NULL,
    [OuterYesNo] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_OuterYesNo] DEFAULT (0),
    [RoomTypeId] [int] NULL,
    [SubmissionType] [nvarchar](100) NULL,
    [MinusYesNo] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_MinusYesNo] DEFAULT (0),
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RoomWiseSubmissionDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_RoomWiseSubmissionDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY];
GO

ALTER TABLE [PTIS].[RoomWiseSubmissionDetails] WITH CHECK
ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_PropertyDetails]
FOREIGN KEY ([PropertyDetailsId])
REFERENCES [PTIS].[PropertyDetails] ([Id]);
GO

ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]
CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_PropertyDetails];
GO

ALTER TABLE [PTIS].[RoomWiseSubmissionDetails] WITH CHECK
ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_PropertyMast]
FOREIGN KEY ([PropertyId])
REFERENCES [PTIS].[PropertyMast] ([Id]);
GO

ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]
CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_PropertyMast];
GO

ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]  WITH CHECK 
ADD  CONSTRAINT [FK_RoomWiseSubmissionDetails_RoomTypeMaster_RoomTypeId] 
FOREIGN KEY([RoomTypeId])
REFERENCES [PTIS].[RoomTypeMaster] ([Id]);
GO
ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]
CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_RoomTypeMaster_RoomTypeId]
GO

-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails] WITH NOCHECK
-- ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_ConstructionTypeMaster]
-- FOREIGN KEY([ConstructionTypeId])
-- REFERENCES [PTIS].[ConstructionTypeMaster] ([Id]);
-- GO
-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]
-- CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_ConstructionTypeMaster];
-- GO

-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails] WITH NOCHECK
-- ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_FloorMaster]
-- FOREIGN KEY([FloorId])
-- REFERENCES [PTIS].[FloorMaster] ([Id]);
-- GO
-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]
-- WITH CHECK CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_FloorMaster];
-- GO

-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails] WITH NOCHECK
-- ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_TypeOfUseMaster]
-- FOREIGN KEY([TypeOfUseId])
-- REFERENCES [PTIS].[TypeOfUseMaster] ([Id]);
-- GO
-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]
-- WITH CHECK CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_TypeOfUseMaster];
-- GO

-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails] WITH NOCHECK
-- ADD CONSTRAINT [FK_RoomWiseSubmissionDetails_SubFloorMaster]
-- FOREIGN KEY([SubFloorId])
-- REFERENCES [PTIS].[SubFloorMaster] ([Id]);
-- GO
-- ALTER TABLE [PTIS].[RoomWiseSubmissionDetails]
-- CHECK CONSTRAINT [FK_RoomWiseSubmissionDetails_SubFloorMaster];
-- GO
/****** Object:  Table [PTIS].[FloorSubmissionRoomNoDetail]******/
/****** Object:  Table [PTIS].[RoomNoCountMaster] ******/
 CREATE TABLE [PTIS].[RoomNoCountMaster](
 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
 	[RoomNo] [nvarchar](100) NOT NULL,
 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RoomNoCountMaster_IsActive] DEFAULT (1),
 	[CreatedBy] [int] NULL,
 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RoomNoCountMaster_CreatedDate DEFAULT (GETDATE()),
 	[UpdatedBy] [int] NULL,
 	[UpdatedDate] [datetime] NULL,
  CONSTRAINT [PK_RoomNoCountMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
  CONSTRAINT UQ_RoomNoCountMaster_RoomNo UNIQUE (RoomNo)
 ) ON [PRIMARY]
 GO


/****** Object:  Table [PTIS].[NatureFactorCVMaster]******/

CREATE TABLE [PTIS].[NatureFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ConstructionTypeId] [int] NOT NULL,
	[Factor] [decimal](5, 2) NOT NULL,
	[YearRangeCVId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_NatureFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_NatureFactorCVMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_NatureFactorCVMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_NatureFactorCVMaster] UNIQUE ([ConstructionTypeId], [YearRangeCVId])
) ON [PRIMARY]
GO
ALTER TABLE [PTIS].[NatureFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_NatureFactorCVMaster_ConstructionTypeMaster]
FOREIGN KEY([ConstructionTypeId]) REFERENCES [PTIS].[ConstructionTypeMaster]([Id]);
GO
ALTER TABLE [PTIS].[NatureFactorCVMaster] CHECK CONSTRAINT [FK_NatureFactorCVMaster_ConstructionTypeMaster];
GO

ALTER TABLE [PTIS].[NatureFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_NatureFactorCVMaster_AssessmentYearRangeMasterCV] FOREIGN KEY([YearRangeCVId]) 
REFERENCES [PTIS].[AssessmentYearRangeMasterCV]([Id]);
GO
ALTER TABLE [PTIS].[NatureFactorCVMaster] CHECK CONSTRAINT [FK_NatureFactorCVMaster_AssessmentYearRangeMasterCV];
GO

/****** Object:  Table [PTIS].[RateSectionDetails]******/

CREATE TABLE [PTIS].[RateSectionDetails](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RateSectionId] [int] NOT NULL,
	[WardId] int NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RateSectionDetails_IsActive] DEFAULT (1),
	[CreatedBy] int NULL,
    [CreatedDate] datetime NOT NULL CONSTRAINT DF_RateSectionDetails_CreatedDate DEFAULT (GETDATE()),
    [UpdatedBy] int NULL,
    [UpdatedDate] datetime NULL,
    CONSTRAINT [PK_RateSectionDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

alter table [PTIS].[RateSectionDetails] with check add constraint [FK_RateSectionDetails_RateSectionMaster]	
foreign key([RateSectionId]) references [PTIS].[RateSectionMaster] ([Id]);
GO
alter table [PTIS].[RateSectionDetails] check constraint [FK_RateSectionDetails_RateSectionMaster];

ALTER TABLE [PTIS].[RateSectionDetails] WITH CHECK ADD CONSTRAINT [FK_RateSectionDetails_WardMaster]
FOREIGN KEY([WardId]) REFERENCES [PTIS].[WardMaster] ([Id]);
GO
ALTER TABLE [PTIS].[RateSectionDetails] CHECK CONSTRAINT [FK_RateSectionDetails_WardMaster];
GO	



ALTER TABLE [PTIS].[RateSectionDetails] ADD CONSTRAINT [UQ_RateSectionDetails_RateSection_Ward]
UNIQUE ([RateSectionId], [WardId]);
GO

-- /****** Object:  Table [PTIS].[ParkingTypeMaster]******/

-- CREATE TABLE [PTIS].[ParkingTypeMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[TypeOfUseId] [int] NOT NULL,
-- 	[Description] [nvarchar](80) NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ParkingTypeMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_ParkingTypeMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_ParkingTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO

-- ALTER TABLE [PTIS].[ParkingTypeMaster] WITH CHECK ADD CONSTRAINT [FK_ParkingTypeMaster_TypeOfUseMaster]
-- FOREIGN KEY([TypeOfUseId]) REFERENCES [PTIS].[TypeOfUseMaster]([Id]);
-- GO

-- ALTER TABLE [PTIS].[ParkingTypeMaster] CHECK CONSTRAINT [FK_ParkingTypeMaster_TypeOfUseMaster];
-- GO

-- /****** Object:  Table [PTIS].[PlotDetails]******/

-- CREATE TABLE [PTIS].[PlotDetails](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PropertyId] [int] NULL,
-- 	[PlotArea] [float] NULL,
-- 	[PlotTaxableAreaSqFt] [float] NULL,
-- 	[OpenPlotType] [nvarchar](10) NULL,
-- 	[OpenPlotRenterName] [nvarchar](1000) NULL,
-- 	[OpenPlotLength] [float] NULL,
-- 	[OpenPlotWidth] [float] NULL,
-- 	[PlotTaxableAreaSqMtr] [float] NULL,
-- 	[PlotAreaSqMtr] [float] NULL,
-- 	[OpenPlotSubmissionType] [varchar](30) NULL,
-- 	[PlotAreaMtrLength] [float] NULL,
-- 	[PlotAreaMtrWidth] [float] NULL,
-- 	[PlotAreaFtLength] [float] NULL,
-- 	[PlotAreaFtWidth] [float] NULL,
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PlotDetails_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime]  NULL ,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PlotDetails_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PlotDetails_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedDate] [datetime] NULL,
-- 	[UpdatedBy] [int] NULL,
--  CONSTRAINT [PK_PlotDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY] 
-- GO

-- ALTER TABLE [PTIS].[PlotDetails]  WITH CHECK ADD  CONSTRAINT [FK_PlotDetails_PropertyMast] FOREIGN KEY([PropertyId])
-- REFERENCES [PTIS].[PropertyMast] ([Id])
-- GO

-- ALTER TABLE [PTIS].[PlotDetails] CHECK CONSTRAINT [FK_PlotDetails_PropertyMast]
-- GO



-- CREATE TABLE [PTIS].[PlotTypeMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PlotTypeName] [nvarchar](100) NOT NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PlotTypeMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PlotTypeMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_PlotTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO



-- /****** Object:  Table [PTIS].[PropertyAssessmentDetails]******/

-- CREATE TABLE [PTIS].[PropertyAssessmentDetails](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PropertyId] [int] NOT NULL,
-- 	[QcDone] [bit] NULL,
-- 	[QcDoneByUser] [int] NULL,
-- 	[QcDoneDate] [datetime] NULL,
-- 	[AddTaxesDone] [bit] NULL,
-- 	[AddTaxeDoneByUser] [nvarchar](200) NULL,
-- 	[AddTaxeDoneDate] [datetime] NULL,
-- 	[QcRevert] [bit] NULL,
-- 	[QcRevertBy] [int] NULL,
-- 	[QcRevertDate] [datetime] NULL,
-- 	[QcRevertRemark] [nvarchar](500) NULL,
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyAssessmentDetails_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime]  NULL ,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyAssessmentDetails_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyAssessmentDetails_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_PropertyAssessmentDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY] 
-- GO

-- ALTER TABLE [PTIS].[PropertyAssessmentDetails]  WITH CHECK ADD  CONSTRAINT [FK_PropertyAssessmentDetails_PropertyMast] FOREIGN KEY([PropertyId])
-- REFERENCES [PTIS].[PropertyMast] ([Id])
-- GO

-- ALTER TABLE [PTIS].[PropertyAssessmentDetails] CHECK CONSTRAINT [FK_PropertyAssessmentDetails_PropertyMast]
-- GO
-- ALTER TABLE [PTIS].[PropertyAssessmentDetails] ADD CONSTRAINT UQ_PropertyAssessmentDetails_PropertyId UNIQUE (PropertyId);
-- GO


/****** Object:  Table [PTIS].[PropertyDescriptionAndTypeOfUseValidation] ******/
CREATE TABLE [PTIS].[PropertyDescriptionAndTypeOfUseValidation](
	[Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyTypeId] [int] NOT NULL,
	[TypeOfUseId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyDescriptionAndTypeOfUseValidation_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyDescriptionAndTypeOfUseValidation_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_PropertyDescriptionAndTypeOfUseValidation] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_PropertyDescriptionAndTypeOfUseValidation_PropertyType]
        FOREIGN KEY ([PropertyTypeId]) 
        REFERENCES [PTIS].[PropertyTypeMaster]([Id]),
	CONSTRAINT [FK_PropertyDescriptionAndTypeOfUseValidation_TypeOfUse]
		FOREIGN KEY ([TypeOfUseId]) 
		REFERENCES [PTIS].[TypeOfUseMaster]([Id]),
	CONSTRAINT [UQ_PropertyDescriptionAndTypeOfUseValidation] UNIQUE ([PropertyTypeId], [TypeOfUseId])
	
) ON [PRIMARY];
GO

/****** Object:  Table [PTIS].[PropertyDetailsOld]******/

CREATE TABLE [PTIS].[PropertyDetailsOld](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyMastOldId] [int] NOT NULL,
	[OldFloorId] [int] NOT  NULL,
	[OldSubFloorId] [int]  NULL,
	[OldConstructionYear] [varchar](4) NULL,
	[OldAssessmentYear] [nvarchar](4) NULL,
	[OldConstructionTypeId] [int] NOT  NULL,
	[OldTypeOfUseId] [int] NOT  NULL,
	[OldSubTypeOfUseId] [int] NULL,
	[OldCarpetAreaSqMeter] DECIMAL(18,4) NULL,
	[OldCarpetAreaSqFeet] DECIMAL(18,4) NULL,
	[OldBuiltupAreaSqMeter] DECIMAL(18,4) NULL,
	[OldBuiltupAreaSqFeet] DECIMAL(18,4) NULL,
	[OldOCDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyDetailsOld_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime]  NULL ,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyDetailsOld_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyDetailsOld_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_OldPropertyDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[PropertyDetailsOld]  WITH CHECK ADD  CONSTRAINT [FK_PropertyDetailsOld_PropertyMastOld] FOREIGN KEY([PropertyMastOldId])
REFERENCES [PTIS].[PropertyMastOld] ([Id])
GO
ALTER TABLE [PTIS].[PropertyDetailsOld] CHECK CONSTRAINT [FK_PropertyDetailsOld_PropertyMastOld]
GO

-- /****** Object:  Table [PTIS].[PropertyImagesMast]******/

-- CREATE TABLE [PTIS].[PropertyImagesMast](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PropertyId] [int] NOT NULL,
-- 	[PlanPhoto] [varbinary](max) NULL,
-- 	[PropertyPhotoA] [varbinary](max) NULL,
-- 	[PropertyPhotoB] [varbinary](max) NULL,
-- 	[PropertyPhotoC] [varbinary](max) NULL,
-- 	[PropertyPhotoD] [varbinary](max) NULL,
-- 	[PropertyObjQR] [varbinary](max) NULL,
-- 	[QuickSearchQR] [varbinary](max) NULL,
-- 	[PropertyPhotoQR] [varbinary](max) NULL,
-- 	[PropertyPhotoSLR] [varbinary](max) NULL,
-- 	[PropertyPhotoRW] [varbinary](max) NULL,
-- 	[PropertyPhotoGS] [varbinary](max) NULL,
-- 	[PropertyPhotoGD] [varbinary](max) NULL,
-- 	[PropertyPhotoAGR] [varbinary](max) NULL,
-- 	[PropertyPhotoSign] [varbinary](max) NULL,
-- 	[PropertyPhotoSRF1] [varbinary](max) NULL,
-- 	[PropertyPhotoSRF2] [varbinary](max) NULL,
-- 	[PropertyPhotoSRF3] [varbinary](max) NULL,
-- 	[PropertyPhotoECST] [varbinary](max) NULL,
-- 	[PropertyPhotoSTP] [varbinary](max) NULL,
-- 	[IsPlanPhoto] [bit] NULL,
-- 	[IsPropertyPhotoA] [bit] NULL,
-- 	[IsPropertyPhotoB] [bit] NULL,
-- 	[IsPropertyPhotoC] [bit] NULL,
-- 	[IsPropertyPhotoD] [bit] NULL,
-- 	[IsPropertyObjQR] [bit] NULL,
-- 	[IsQuickSearchQR] [bit] NULL,
-- 	[IsPropertyPhotoQR] [bit] NULL,
-- 	[IsPropertyPhotoSLR] [bit] NULL,
-- 	[IsPropertyPhotoRW] [bit] NULL,
-- 	[IsPropertyPhotoGS] [bit] NULL,
-- 	[IsPropertyPhotoGD] [bit] NULL,
-- 	[IsPropertyPhotoAGR] [bit] NULL,
-- 	[IsPropertyPhotoSign] [bit] NULL,
-- 	[IsPropertyPhotoSRF1] [bit] NULL,
-- 	[IsPropertyPhotoSRF2] [bit] NULL,
-- 	[IsPropertyPhotoSRF3] [bit] NULL,
-- 	[IsPropertyPhotoECST] [bit] NULL,
-- 	[IsPropertyPhotoSTP] [bit] NULL,
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyImagesMast_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL ,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyImagesMast_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyImagesMast_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_PropertyImagesMast] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY] 
-- GO
-- ALTER TABLE [PTIS].[PropertyImagesMast]  WITH CHECK ADD  CONSTRAINT [FK_PropertyImagesMast_PropertyMast] FOREIGN KEY([PropertyId])
-- REFERENCES [PTIS].[PropertyMast] ([Id])
-- GO

-- ALTER TABLE [PTIS].[PropertyImagesMast] CHECK CONSTRAINT [FK_PropertyImagesMast_PropertyMast]
-- GO



-- /****** Object:  Table [PTIS].[UsageCategoryMaster]******/

-- CREATE TABLE [PTIS].[UsageCategoryMaster](
-- 	[Id] [int] NOT NULL,
-- 	[Description] [nvarchar](80) NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_UsageCategoryMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_UsageCategoryMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_UsageCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
--  CONSTRAINT UQ_UsageCategoryMaster_Description UNIQUE (Description)
-- ) ON [PRIMARY]
-- GO

/****** Object:  Table [PTIS].[PropertyMastDetails]******/

CREATE TABLE [PTIS].[PropertyMastDetails](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NULL,
	[OwnerTypeId] int NULL,
	[AssessmentRemark] [nvarchar](400) NULL,
	[SurveyRemark] [nvarchar](400) NULL,
	[OwnerSignRemarkId] INT NULL,
	[FlatSystemRemark] [nvarchar](400) NULL,
	[CombPropRemark] [nvarchar](400) NULL,
	[AdharCardNo] [varchar](12) NULL,
	-- [ManagerMobileNo] [varchar](13) NULL,
	[RenterMobileNo] [varchar](13) NULL,
	-- [SecretaryMobileNo] [varchar](13) NULL,
	-- [AssessmentNo] [nvarchar](10) NULL,
	[PrarupYadiPublishDate] [datetime] NULL,
	[AntimYadiPublishDate] [datetime] NULL,
	[PropertyRegDate] [datetime] NULL,
	[ApplyTaxesFrom] [smallint] NULL,
	[PartOCDate] [datetime] NULL,
	[BHKId] [int] NULL,
	[BlockNo] [nvarchar](20) NULL,
	-- [UsageCategoryId] [int] NULL,
	[AlternetivEmailId] [varchar](100) NULL,
	[TotalBuiltupAreaSqFeet] DECIMAL(18,4) NULL,
	[TotalBuiltupAreaSqMeter] DECIMAL(18,4) NULL,
	[Latitude] [varchar](20) NULL,
	[Longitude] [varchar](20) NULL,
	[NoOfResidentialToilets] [int] NULL,
	[NoOfCommercialToilets] [int] NULL,
	[UnitGenerationType] [varchar](4) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyMastDetails_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL ,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyMastDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyMastDetails_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_PropertyMastDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY] 
GO

ALTER TABLE [PTIS].[PropertyMastDetails]  WITH CHECK ADD  CONSTRAINT [FK_PropertyMastDetails_PropertyMast_PropertyId] FOREIGN KEY([PropertyId])
REFERENCES [PTIS].[PropertyMast] ([Id])
GO

ALTER TABLE [PTIS].[PropertyMastDetails] CHECK CONSTRAINT [FK_PropertyMastDetails_PropertyMast_PropertyId]
GO

alter table [PTIS].[PropertyMastDetails]  WITH CHECK ADD  CONSTRAINT [FK_PropertyMastDetails_OwnerTypeMaster] FOREIGN KEY([OwnerTypeId])
REFERENCES [PTIS].[OwnerTypeMaster] ([Id])	
GO
ALTER TABLE [PTIS].[PropertyMastDetails] CHECK CONSTRAINT [FK_PropertyMastDetails_OwnerTypeMaster]
GO

ALTER TABLE [PTIS].[PropertyMastDetails]  WITH CHECK ADD  CONSTRAINT [FK_PropertyMastDetails_BHKMaster] FOREIGN KEY([BHKId])
REFERENCES [CORE].[BHKMaster] ([Id])
GO

ALTER TABLE [PTIS].[PropertyMastDetails] CHECK CONSTRAINT [FK_PropertyMastDetails_BHKMaster]


-- GO
-- alter table [PTIS].[PropertyMastDetails]  WITH CHECK ADD  CONSTRAINT [FK_PropertyMastDetails_UsageCategoryMaster] FOREIGN KEY([UsageCategoryId])
-- REFERENCES [PTIS].[UsageCategoryMaster] ([Id])
-- GO
-- ALTER TABLE [PTIS].[PropertyMastDetails] CHECK CONSTRAINT [FK_PropertyMastDetails_UsageCategoryMaster]	
-- GO

CREATE TABLE [PTIS].[SocialAttributeMaster](
   	[Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PhotoTypeId] INT NULL,
    [SocialAttributeCode] NVARCHAR(100) NOT NULL UNIQUE,
    [SocialAttributeName] NVARCHAR(200) NOT NULL,
    [DataType] NVARCHAR(30) NOT NULL  CONSTRAINT CK_SocialAttributeMaster_DataType  CHECK ([DataType] IN ('BIT', 'INT', 'DECIMAL', 'TEXT', 'DATE')),
		 -- BIT, INT, DECIMAL, TEXT, DATE
    [Unit] NVARCHAR(50) NULL,
    [DisplayOrder] INT NULL,
	[ParentAttributeId] INT NULL,
    [IsRequiredWhenParentTrue] BIT NOT NULL DEFAULT 0,
    [IsDiscountApplicable] BIT NOT NULL DEFAULT 0,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_SocialAttributeMaster_IsActive] DEFAULT (1),
	[IsPhotoRequired] BIT NOT NULL CONSTRAINT [DF_SocialAttributeMaster_IsPhotoRequired] DEFAULT (0),
    [IsDocumentRequired] BIT NOT NULL CONSTRAINT [DF_SocialAttributeMaster_IsDocumentRequired] DEFAULT (0),
	[AttributeCategory] VARCHAR(30) NULL,
	[IsCommonAreaAttribute] BIT NOT NULL CONSTRAINT [DF_SocialAttributeMaster_IsCommonAreaAttribute] DEFAULT (0), -- 1 = captured on main building/wing (lift, club house, etc.); hidden on apartment unit
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_SocialAttributeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_SocialAttributeMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
);



CREATE TABLE [PTIS].[PropertySocialDetails](
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[EntityType]            CHAR(1)           NOT NULL,                      -- S = Society, W = Wing, P = Property | e.g. 'P'
    [SocietyDetailId]       INT               NULL,                          -- FK → PTIS.SocietyDetailsMast.Id, set when EntityType = 'S'
    [WingDetailId]          INT               NULL,                          -- FK → PTIS.WingDetailsMast.Id, set when EntityType = 'W'
    [PropertyId] INT  NULL,
    [SocialAttributeId] INT NOT NULL,
    [BitValue] BIT NULL,
    [IntValue] INT NULL,
    [DecimalValue] DECIMAL(18,2) NULL,
	[TextValue] NVARCHAR(500) NULL,
	[DateValue] DATE NULL,
	[DocumentBindingId] INT  NULL,                 -- FK → CORE.DocumentBinding.Id (binding contains DocumentId) | e.g. 6601
	[Remark] NVARCHAR(500) NULL,
   
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertySocialDetails_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
   	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertySocialDetails_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertySocialDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT PK_PropertySocialDetails   PRIMARY KEY ([Id]),
	CONSTRAINT FK_PropertySocialDetails_SocietyDetailsMast FOREIGN KEY ([SocietyDetailId]) REFERENCES [PTIS].[SocietyDetailsMast]([Id]),
	CONSTRAINT FK_PropertySocialDetails_WingDetailsMast FOREIGN KEY ([WingDetailId]) REFERENCES [PTIS].[WingDetailsMast]([Id]),
	
    CONSTRAINT FK_PropertySocialDetails_Property FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]),
	CONSTRAINT FK_PropertySocialDetails_SocialAttribute FOREIGN KEY ([SocialAttributeId]) REFERENCES [PTIS].[SocialAttributeMaster]([Id]),
	CONSTRAINT FK_PropertySocialDetails_DocumentBinding FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]),

	CONSTRAINT [CK_PropertySocialDetails_EntityScope]
CHECK
(
    (
        [EntityType] = 'S'
        AND [SocietyDetailId] IS NOT NULL
        AND [WingDetailId] IS NULL
        AND [PropertyId] IS NULL
    )
    OR
    (
        [EntityType] = 'W'
        AND [SocietyDetailId] IS NULL
        AND [WingDetailId] IS NOT NULL
        AND [PropertyId] IS NULL
    )
    OR
    (
        [EntityType] = 'P'
        AND [SocietyDetailId] IS NULL
        AND [WingDetailId] IS NULL
        AND [PropertyId] IS NOT NULL
    )
)
);
GO

CREATE NONCLUSTERED INDEX [IX_PropertySocialDetails_DocumentBindingId]
	ON [PTIS].[PropertySocialDetails]([DocumentBindingId])
	WHERE [DocumentBindingId] IS NOT NULL;
GO


CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PropertySocialDetails_Society_SocialAttribute]
ON [PTIS].[PropertySocialDetails]
(
    [SocietyDetailId],
    [SocialAttributeId]
)
WHERE
    [EntityType] = 'S'
    AND [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO

CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PropertySocialDetails_Wing_SocialAttribute]
ON [PTIS].[PropertySocialDetails]
(
    [WingDetailId],
    [SocialAttributeId]
)
WHERE
    [EntityType] = 'W'
    AND [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO

CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PropertySocialDetails_Property_SocialAttribute]
ON [PTIS].[PropertySocialDetails]
(
    [PropertyId],
    [SocialAttributeId]
)
WHERE
    [EntityType] = 'P'
    AND [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO



CREATE TABLE [PTIS].[SocialDiscountMaster](
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [SocialAttributeId] INT NOT NULL,
    [YearId] INT NOT NULL,
    [DiscountType] NVARCHAR(20) NOT NULL, -- PERCENT / AMOUNT
    [DiscountPercentage] DECIMAL(5,2) NULL,
    [DiscountAmount] DECIMAL(18,2) NULL,
    [MaxDiscountAmount] DECIMAL(18,2) NULL,
   	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SocialDiscountMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_SocialDiscountMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT PK_SocialDiscountMaster PRIMARY KEY ([Id]),
	CONSTRAINT FK_SocialDiscountMaster_YearMaster FOREIGN KEY ([YearId]) REFERENCES [CORE].[YearMaster]([Id]),
    CONSTRAINT FK_SocialDiscountMaster_SocialAttribute FOREIGN KEY ([SocialAttributeId]) 
	REFERENCES [PTIS].[SocialAttributeMaster]([Id]),
    CONSTRAINT UQ_SocialDiscountMaster UNIQUE ([SocialAttributeId], [YearId]),
	CONSTRAINT [CK_SocialDiscountMaster_DiscountType]
    CHECK ([DiscountType] IN ('PERCENT', 'AMOUNT')),
    CONSTRAINT [CK_SocialDiscountMaster_DiscountValue]
        CHECK (
            (
                [DiscountType] = 'PERCENT'
                AND [DiscountPercentage] IS NOT NULL
                AND [DiscountAmount] IS NULL
            )
            OR
            (
                [DiscountType] = 'AMOUNT'
                AND [DiscountAmount] IS NOT NULL
                AND [DiscountPercentage] IS NULL
            )
        )
);

ALTER TABLE [PTIS].[SocialDiscountMaster] ADD CONSTRAINT [CK_SocialDiscountMaster_DiscountValueRange]
CHECK (
	([DiscountType] = 'PERCENT' AND ([DiscountPercentage] >= 0 AND [DiscountPercentage] <= 100))
	OR
	([DiscountType] = 'AMOUNT' AND [DiscountAmount] >= 0)
);

ALTER TABLE [PTIS].[SocialDiscountMaster] ADD CONSTRAINT [CK_SocialDiscountMaster_MaxDiscountAmount_NonNegative]
CHECK ( 				
[MaxDiscountAmount] IS NULL OR [MaxDiscountAmount] >= 0
);

ALTER TABLE [PTIS].[SocialDiscountMaster] ADD CONSTRAINT [CK_SocialDiscountMaster_MaxDiscountAmountPercentage]
CHECK (
	([DiscountType] = 'PERCENT' AND [MaxDiscountAmount] IS NULL)
	OR
	([DiscountType] = 'AMOUNT' AND ([MaxDiscountAmount] IS NULL OR [MaxDiscountAmount] >= 0))
);

-- -- /****** Object:  Table [PTIS].[DiscountMaster]******/

-- CREATE TABLE [PTIS].[DiscountMaster] (
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [DiscountCode] NVARCHAR(20) NOT NULL,
--     [DiscountName] NVARCHAR(200) NOT NULL,
--     [DiscountAlias] NVARCHAR(200) NULL,
--     [DisplayOrder] INT NOT NULL CONSTRAINT [DF_DiscountMaster_DisplayOrder] DEFAULT (0),
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_DiscountMaster_IsActive] DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_DiscountMaster_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,
--     CONSTRAINT [PK_DiscountMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
-- 	CONSTRAINT [UQ_DiscountMaster_TaxCode] UNIQUE ([DiscountCode]),
-- 	CONSTRAINT [UQ_DiscountMaster_TaxName] UNIQUE ([DiscountName])
-- );

/* ============================================================================
   Table: PTIS.PropertyCertificateTypeMaster
   Purpose:
   Master table for certificate types.

   Examples:
   CC, OC, EleBillDt, Possession Certificate, Index 2

   Why needed:
   All active certificate types should display/upload/save/view.
   IsTaxable decides whether certificate should participate in tax calculation.
============================================================================ */

CREATE TABLE [PTIS].[PropertyCertificateTypeMaster]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    [CertificateTypeCode] VARCHAR(50) NOT NULL,
        -- Stable certificate code.
        -- Example: 'CC', 'OC', 'EleBillDt'

    [CertificateTypeName] NVARCHAR(100) NOT NULL,
        -- Display name in UI.

    [Description] NVARCHAR(500) NULL,

    [DisplayOrder] INT NOT NULL
        CONSTRAINT [DF_PropertyCertificateTypeMaster_DisplayOrder] DEFAULT (0),

    [IsTaxable] BIT NOT NULL
        CONSTRAINT [DF_PropertyCertificateTypeMaster_IsTaxable] DEFAULT (0),
        -- 1 = tax calculation should trigger for this certificate type.

    [IsProtected] BIT NOT NULL
        CONSTRAINT [DF_PropertyCertificateTypeMaster_IsProtected] DEFAULT (1),
        -- 1 = system/protected certificate type.

    [IsRequired] BIT NOT NULL
        CONSTRAINT [DF_PropertyCertificateTypeMaster_IsRequired] DEFAULT (1),
        -- 1 = document is mandatory if date is entered.

    [IsActive] BIT NOT NULL
        CONSTRAINT [DF_PropertyCertificateTypeMaster_IsActive] DEFAULT (1),

    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL
        CONSTRAINT [DF_PropertyCertificateTypeMaster_CreatedDate] DEFAULT (GETDATE()),

    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_PropertyCertificateTypeMaster]
        PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [UQ_PropertyCertificateTypeMaster_Code]
        UNIQUE ([CertificateTypeCode]),

    CONSTRAINT [UQ_PropertyCertificateTypeMaster_Name]
        UNIQUE ([CertificateTypeName])
);
GO


/* ============================================================================
   Table: PTIS.PropertyCertificates
   Purpose:
   Stores actual certificate metadata against property or floor.

   Why needed:
   Certificate records can be property-wise or floor-wise.
   Actual document file is linked through CORE.DocumentBinding.
============================================================================ */

CREATE TABLE [PTIS].[PropertyCertificates]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,

    [EntityType] CHAR(1) NOT NULL,
        -- S = Society, W = Wing, P = Property.
        -- Identifies which of SocietyDetailId / WingDetailId / PropertyId is populated.

    [SocietyDetailId] INT NULL,
        -- FK to PTIS.SocietyDetailsMast. Set when EntityType = 'S'.

    [WingDetailId] INT NULL,
        -- FK to PTIS.WingDetailsMast. Set when EntityType = 'W'.

    [PropertyId] INT NULL,
        -- FK to PTIS.PropertyMast. Set when EntityType = 'P'.

    [PropertyDetailsId] INT NULL,
        -- FK to PTIS.PropertyDetails.
        -- NULL = property-wise certificate.
        -- NOT NULL = floor-wise certificate.
        -- Whether property-wise or floor-wise tax applies at all is
        -- decided by the Retrospective Rule Engine (PTIS.RetrospectiveRuleMaster
        -- and related tables), not per certificate record.

    [CertificateTypeId] INT NOT NULL,
        -- FK to certificate type.

    [CertificateNo] NVARCHAR(100) NULL,

    [CertificateIssueDate] DATE NULL,

    [DocumentBindingId] INT NULL,
        -- FK to CORE.DocumentBinding.

    [TaxApplied] BIT NOT NULL
        CONSTRAINT [DF_PropertyCertificates_TaxApplied] DEFAULT (0),

    [TaxAppliedDate] DATETIME NULL,

    [MarkedForDeletion] BIT NOT NULL
        CONSTRAINT [DF_PropertyCertificates_MarkedForDeletion] DEFAULT (0),

    [MarkedForDeletionDate] DATETIME NULL,

    [IsActive] BIT NOT NULL
        CONSTRAINT [DF_PropertyCertificates_IsActive] DEFAULT (1),

    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL
        CONSTRAINT [DF_PropertyCertificates_CreatedDate] DEFAULT (GETDATE()),

    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    [RowVersion] ROWVERSION NOT NULL,

    CONSTRAINT [PK_PropertyCertificates]
        PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [FK_PropertyCertificates_SocietyDetailsMast]
        FOREIGN KEY ([SocietyDetailId])
        REFERENCES [PTIS].[SocietyDetailsMast] ([Id]),

    CONSTRAINT [FK_PropertyCertificates_WingDetailsMast]
        FOREIGN KEY ([WingDetailId])
        REFERENCES [PTIS].[WingDetailsMast] ([Id]),

    CONSTRAINT [FK_PropertyCertificates_PropertyMast]
        FOREIGN KEY ([PropertyId])
        REFERENCES [PTIS].[PropertyMast] ([Id]),

    CONSTRAINT [FK_PropertyCertificates_PropertyDetails]
        FOREIGN KEY ([PropertyDetailsId])
        REFERENCES [PTIS].[PropertyDetails] ([Id]),

    CONSTRAINT [FK_PropertyCertificates_PropertyCertificateTypeMaster]
        FOREIGN KEY ([CertificateTypeId])
        REFERENCES [PTIS].[PropertyCertificateTypeMaster] ([Id]),

    CONSTRAINT [FK_PropertyCertificates_DocumentBinding]
        FOREIGN KEY ([DocumentBindingId])
        REFERENCES [CORE].[DocumentBinding] ([Id]),

    CONSTRAINT [CK_PropertyCertificates_EntityType]
        CHECK ([EntityType] IN ('S', 'W', 'P')),

    CONSTRAINT [CK_PropertyCertificates_TaxAppliedDate]
        CHECK ([TaxApplied] = 0 OR [TaxAppliedDate] IS NOT NULL),

    -- EntityType marks the certificate apply level (society/wing/property/floor);
    -- PropertyDetailsId NULL vs NOT NULL on a 'P' row distinguishes property-wise
    -- from floor-wise, no separate EntityType value is needed for that.
    CONSTRAINT [CK_PropertyCertificates_EntityScope]
        CHECK (
            ([EntityType] = 'S' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NULL AND [PropertyId] IS NULL AND [PropertyDetailsId] IS NULL) OR
            ([EntityType] = 'W' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NOT NULL AND [PropertyId] IS NULL AND [PropertyDetailsId] IS NULL) OR
            ([EntityType] = 'P' AND [PropertyId] IS NOT NULL)
        )
);
GO

-- Indexes to support FK checks and common lookups (SQL Server does not
-- auto-create indexes on FK columns, so parent updates/deletes and
-- lookups by property would otherwise fall back to full scans).
CREATE NONCLUSTERED INDEX [IX_PropertyCertificates_SocietyDetailId]
    ON [PTIS].[PropertyCertificates] ([SocietyDetailId])
    WHERE [SocietyDetailId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_PropertyCertificates_WingDetailId]
    ON [PTIS].[PropertyCertificates] ([WingDetailId])
    WHERE [WingDetailId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_PropertyCertificates_PropertyId]
    ON [PTIS].[PropertyCertificates] ([PropertyId])
    WHERE [PropertyId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_PropertyCertificates_CertificateTypeId]
    ON [PTIS].[PropertyCertificates] ([CertificateTypeId]);
GO
CREATE NONCLUSTERED INDEX [IX_PropertyCertificates_DocumentBindingId]
    ON [PTIS].[PropertyCertificates] ([DocumentBindingId])
    WHERE [DocumentBindingId] IS NOT NULL;
GO
CREATE NONCLUSTERED INDEX [IX_PropertyCertificates_PropertyDetailsId]
    ON [PTIS].[PropertyCertificates] ([PropertyDetailsId])
    WHERE [PropertyDetailsId] IS NOT NULL;
GO


-- /****** Object:  Table [PTIS].[PropertySocialDetails]******/

-- CREATE TABLE [PTIS].[PropertySocialDetails](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PropertyId] [int] NOT NULL,
-- 	[RoadWidth] [float] NULL,
-- 	[WaterConnStatus] [int] NULL,
-- 	[WaterConnectionYear] [int] NULL,
-- 	[WaterMeter] [bit] NULL,
-- 	[HandPump] [bit] NULL,
-- 	[Well] [bit] NULL,
-- 	[NoOfWell] [int] NULL,
-- 	[Boar] [bit] NULL,
-- 	[NoOfBoar] [int] NULL,
-- 	[Drain] [bit] NULL,
-- 	[SepticTank] [bit] NULL,
-- 	[STP] [bit] NULL,
-- 	[GarbageSegrigation] [bit] NULL,
-- 	[GarbageDisposal] [bit] NULL,
-- 	[ElectricConnection] [bit] NULL,
-- 	[EBill] [bit] NULL,
-- 	[ElectricityChargingStation] [bit] NULL,
-- 	[Solar] [bit] NULL,
-- 	[NoOfSolar] [int] NULL,
-- 	[SolarElectric] [bit] NULL,
-- 	[SolarElectricKW] [int] NULL,
-- 	[SolarCapacityKW] [int] NULL,
-- 	[SolarWaterHeater] [bit] NULL,
-- 	[SolarWaterLtr] [int] NULL,
-- 	[SolarWaterLiterCapacity] [int] NULL,
-- 	[DiselGenKW] [int] NULL,
-- 	[DiselGeneratorKW] [int] NULL,
-- 	[GeneratorPowerKW] [int] NULL,
-- 	[DieselGenSet] [bit] NULL,
-- 	[DieselGeneratorSet] [bit] NULL,
-- 	[DiselGenerator] [bit] NULL,
-- 	[FireFightingSystem] [bit] NULL,
-- 	[FireMachine] [bit] NULL,
-- 	[Lift] [bit] NULL,
-- 	[NoOfLift] [int] NULL,
-- 	[Stairs] [bit] NULL,
-- 	[NoOfTrees] [int] NULL,
-- 	[Rainwaterharvesting] [int] NULL,
-- 	[GreenProperty] [bit] NULL,
-- 	[GreenPropertyStar] [int] NULL,
-- 	[MTDCreg] [bit] NULL,
-- 	[RegistrationForMTDC] [bit] NULL,
-- 	[Familyplanning] [bit] NULL,
-- 	[WomenOwner] [bit] NULL,
-- 	[BuildingPermitNo] [nvarchar](50) NULL,
-- 	[BuildingPermitDate] [date] NULL,
-- 	[CommencementNo] [nvarchar](50) NULL,
-- 	[CommencementDate] [date] NULL,
-- 	[BuildCompletionCertNo] [nvarchar](50) NULL,
-- 	[BuildCompletionDate] [date] NULL,
-- 	[OccupancyCertNo] [nvarchar](50) NULL,
-- 	[OccupancyCertDate] [date] NULL,
-- 	[PossessionCertNo] [nvarchar](50) NULL,
-- 	[PossessionCertDate] [date] NULL,
-- 	[Index2No] [nvarchar](50) NULL,
-- 	[Index2Date] [date] NULL,
-- 	[ElectricBillNo] [nvarchar](50) NULL,
-- 	[ElectricBillDate] [date] NULL,
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertySocialDetails_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertySocialDetails_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertySocialDetails_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_PropertySocialDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO

-- ALTER TABLE [PTIS].[PropertySocialDetails]  WITH CHECK ADD  CONSTRAINT [FK_PropertySocialDetails_PropertyMast] FOREIGN KEY([PropertyId])
-- REFERENCES [PTIS].[PropertyMast] ([Id])
-- GO

-- ALTER TABLE [PTIS].[PropertySocialDetails] CHECK CONSTRAINT [FK_PropertySocialDetails_PropertyMast]
-- GO

/****** Object:  Table [PTIS].[PropertySocialDetailsSequenceMaster]******/




/****** Object:  Table [PTIS].[PropertyTaxCalculationRVResults]******/

-- CREATE TABLE [PTIS].[PropertyTaxCalculationRVResults](
--     [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] [int] NOT NULL,
--     [PropertyDetailsId] [int] NOT NULL,
--     [MonthlyRate] [float] NULL,
--     [YearlyRate] [float] NULL,
--     [YearlyRent] [float] NULL,
--     [Depreciation] [money] NULL,
--     [AnnualRentalValue] [float] NULL,
--     [Maintenance] [money] NULL,
--     [RateableValue] [money] NULL,
--     [TaxId] [int] NOT NULL,
--     [TaxPercentage] [money] NULL,
--     [TaxAmount] [money] NULL,
--     [REducationTax] [money] NULL,
--     [CEducationTax] [money] NULL,
--     [REducationTaxPercentage] [money] NULL,
--     [CEducationTaxPercentage] [money] NULL,
--     [REmploymentTax] [money] NULL,
--     [CEmploymentTax] [money] NULL,
--     [REmploymentTaxPercentage] [money] NULL,
--     [CEmploymentTaxPercentage] [money] NULL,
--     [TotalAreaSqMtr] [float] NULL,
--     [RAreaSqMtr] [float] NULL,
--     [CAreaSqlMtr] [float] NULL,
--     [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationRVResults_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL,
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationRVResults_IsActive] DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationRVResults_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,
--     CONSTRAINT [PK_PropertyTaxCalculationRVResults] PRIMARY KEY CLUSTERED ([Id] ASC),
--     CONSTRAINT [FK_PropertyTaxCalculationRVResults_PropertyMast] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
--     CONSTRAINT [FK_PropertyTaxCalculationRVResults_PropertyDetails] FOREIGN KEY ([PropertyDetailsId]) REFERENCES [PTIS].[PropertyDetails] ([Id]),
--     CONSTRAINT [FK_PropertyTaxCalculationRVResults_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id])
-- );
-- GO




CREATE TABLE [PTIS].[RVCalculationResults](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] [int] NOT NULL,
    [PropertyDetailsId] [int] NOT NULL,
    [MonthlyRate] DECIMAL(19,6) NULL,
    [YearlyRate] DECIMAL(19,6) NULL,
    [YearlyRent] DECIMAL(19,4) NULL,
	[AppliedOn] [varchar](20) NULL,
    [Depreciation] DECIMAL(19,4) NULL,
	[DepreciationPer] [decimal](18, 2) NULL,
	[AnnualRentalValue] DECIMAL(19,4) NULL,
    [Maintenance] DECIMAL(19,4) NULL,
    [RateableValue] DECIMAL(19,6) NULL,
    [REducationTax] DECIMAL(19,4) NULL,
    [CEducationTax] DECIMAL(19,4) NULL,
    -- [REducationTaxPercentage] [money] NULL,
    -- [CEducationTaxPercentage] [money] NULL,
    -- [REmploymentTax] [money] NULL,
    [CEmploymentTax] DECIMAL(19,4) NULL,
    -- [REmploymentTaxPercentage] [money] NULL,
    -- [CEmploymentTaxPercentage] [money] NULL,
    [TotalAreaSqMtr] DECIMAL(18,4) NULL,
    [RAreaSqMtr] DECIMAL(18,4) NULL,
    [CAreaSqlMtr] DECIMAL(18,4) NULL,
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RVCalculationResults_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_RVCalculationResults_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RVCalculationResults_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_RVCalculationResults] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RVCalculationResults_PropertyMast] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
    CONSTRAINT [FK_RVCalculationResults_PropertyDetails] FOREIGN KEY ([PropertyDetailsId]) REFERENCES [PTIS].[PropertyDetails] ([Id])
);
GO


CREATE TABLE [PTIS].[RVCalculationTaxDetails]
(
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RVCalculationResultsId] [int] NOT NULL,
	[TaxId] [int] NOT NULL,
    [TaxPercentage] DECIMAL(9,4) NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RVCalculationTaxDetails_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_RVCalculationTaxDetails_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RVCalculationTaxDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
	CONSTRAINT [FK_RVCalculationTaxDetails_TaxMaster] FOREIGN KEY([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]),
    CONSTRAINT [FK_RVCalculationTaxDetails_RVCalculationResults] FOREIGN KEY([RVCalculationResultsId]) REFERENCES [PTIS].[RVCalculationResults] ([Id]),
    CONSTRAINT [PK_RVCalculationTaxDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY];
GO


/****** Object:  Table [PTIS].[UseFactorCVMaster]******/

CREATE TABLE [PTIS].[UseFactorCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TypeOfUseId] [int] NOT NULL,
	[SubTypeOfUseId] [int] NOT NULL,
	[Factor] [decimal](5, 2) NOT NULL,
	[YearRangeCVId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_UseFactorCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_UseFactorCVMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_UseFactorCVMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT UQ_UseFactorCVMaster_Type_SubType UNIQUE (TypeOfUseId, SubTypeOfUseId,YearRangeCVId)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[UseFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_UseFactorCVMaster_TypeOfUseMaster]
FOREIGN KEY([TypeOfUseId]) REFERENCES [PTIS].[TypeOfUseMaster]([Id]);
GO

ALTER TABLE [PTIS].[UseFactorCVMaster] CHECK CONSTRAINT [FK_UseFactorCVMaster_TypeOfUseMaster];
GO

ALTER TABLE [PTIS].[UseFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_UseFactorCVMaster_SubTypeOfUseMaster]
FOREIGN KEY([SubTypeOfUseId]) REFERENCES [PTIS].[SubTypeOfUseMaster]([Id]);
GO

ALTER TABLE [PTIS].[UseFactorCVMaster] CHECK CONSTRAINT [FK_UseFactorCVMaster_SubTypeOfUseMaster];
GO

ALTER TABLE [PTIS].[UseFactorCVMaster] WITH CHECK ADD CONSTRAINT [FK_UseFactorCVMaster_AssessmentYearRangeCVMaster] FOREIGN KEY([YearRangeCVId])
REFERENCES [PTIS].[AssessmentYearRangeMasterCV] ([Id])
GO
ALTER TABLE [PTIS].[UseFactorCVMaster] CHECK CONSTRAINT [FK_UseFactorCVMaster_AssessmentYearRangeCVMaster]
GO


/****** Object:  Table [PTIS].[RateCVMaster]******/

CREATE TABLE [PTIS].[RateCVMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[SubZoneId] [int] NOT NULL,
	[TypeOfUseGroupCVId] [int] NULL,
	[FloorGroupId] [int] NULL,
	[AssessmentYearRangeId] [int] NOT NULL,
	[RateAmount] [decimal](18, 2) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RateCVMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RateCVMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_RateCVMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT UQ_RateCVMaster_SubZone_TypeOfUseGroupCV_FloorGroup_AssessmentYearRange UNIQUE (SubZoneId, TypeOfUseGroupCVId, FloorGroupId, AssessmentYearRangeId),
 CONSTRAINT FK_RateCVMaster_TypeOfUseGroupMasterCV FOREIGN KEY (TypeOfUseGroupCVId) REFERENCES [PTIS].[TypeOfUseGroupMasterCV]([Id]),
 CONSTRAINT FK_RateCVMaster_FloorGroupMaster FOREIGN KEY (FloorGroupId) REFERENCES [PTIS].[FloorGroupMaster]([Id]),
 CONSTRAINT FK_RateCVMaster_AssessmentYearRangeMasterCV FOREIGN KEY (AssessmentYearRangeId) REFERENCES [PTIS].[AssessmentYearRangeMasterCV]([Id])
) ON [PRIMARY]
GO


/****** Object:  Table [PTIS].[PropertyTaxCalculationCVResults]******/
CREATE TABLE [PTIS].[PropertyTaxCalculationCVResults](
	[Id] [bigint] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyDetailsId] [int] NOT NULL,
	[PropertyId] [int] NOT NULL,
	[RateCVMasterId] [int] NOT NULL,
	[TaxId] [int] NOT NULL,
	[BaseValue] DECIMAL(19,4) NULL,
	[FloorFactorCVId] [int] NULL,
	[AgeFactorCVId] [int] NULL,
	[NatureFactorCVId] [int] NULL,
	[UseFactorCVId] [int] NULL,
	[CapitalValue] DECIMAL(19,4) NULL,
	[TaxPercentage] DECIMAL(9,4) NULL,
	[TaxAmount] DECIMAL(19,4) NULL,
	[CVInputHash] [nvarchar](100) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationCVResults_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationCVResults_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationCVResults_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	CONSTRAINT [PK_PropertyTaxCalculationCVResults] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [FK_PropertyTaxCalculationCVResults_PropertyMast] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
	CONSTRAINT [FK_PropertyTaxCalculationCVResults_PropertyDetails] FOREIGN KEY ([PropertyDetailsId]) REFERENCES [PTIS].[PropertyDetails] ([Id]),
	CONSTRAINT [FK_PropertyTaxCalculationCVResults_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id]),	
	CONSTRAINT [Fk_PropertyTaxCalculationCVResults_FloorFactorMaster] FOREIGN KEY ([FloorFactorCVId]) REFERENCES [PTIS].[FloorFactorCVMaster] ([Id]),
	CONSTRAINT [Fk_PropertyTaxCalculationCVResults_AgeFactorMaster] FOREIGN KEY ([AgeFactorCVId]) REFERENCES [PTIS].[AgeFactorCVMaster] ([Id]),
	CONSTRAINT [Fk_PropertyTaxCalculationCVResults_NatureFactorMaster] FOREIGN KEY ([NatureFactorCVId]) REFERENCES [PTIS].[NatureFactorCVMaster] ([Id]),
	CONSTRAINT [Fk_PropertyTaxCalculationCVResults_UseFactorMaster] FOREIGN KEY ([UseFactorCVId]) REFERENCES [PTIS].[UseFactorCVMaster] ([Id])	
	) ON [PRIMARY]
GO
-- Add FK constraint for PropertyTaxCalculationCVResults.RateCVMasterId
ALTER TABLE [PTIS].[PropertyTaxCalculationCVResults] WITH CHECK ADD CONSTRAINT [FK_PropertyTaxCalculationCVResults_RateCVMaster] 
FOREIGN KEY([RateCVMasterId]) REFERENCES [PTIS].[RateCVMaster] ([Id]);
GO
ALTER TABLE [PTIS].[PropertyTaxCalculationCVResults] CHECK CONSTRAINT [FK_PropertyTaxCalculationCVResults_RateCVMaster];
GO


CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertyTaxCalculationCVResults_PropertyDetails_TaxId]
ON [PTIS].[PropertyTaxCalculationCVResults]([PropertyDetailsId], [TaxId])
WHERE [IsActive] = 1 
GO



/****** Object:  Table [PTIS].[PropertyTaxCalculationSection129Results] ******/
CREATE TABLE [PTIS].[PropertyTaxCalculationSection129Results](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyDetailsId] [int] NOT NULL,
    [PropertyId] [int] NOT NULL,
    [RateableValue] DECIMAL(19,6) NULL,
    [CapitalValue] DECIMAL(19,4) NULL,
    [TaxId] [int] NOT NULL,
    [TaxPercentage] DECIMAL(9,4) NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
    [EducationTax] DECIMAL(19,4) NULL,
    [EducationTaxPercentage] DECIMAL(9,4) NULL,
    [EmploymentTax] DECIMAL(19,4) NULL,
    [EmploymentTaxPercentage] DECIMAL(9,4) NULL,
    [TotalAreaSqMtr] DECIMAL(18,4) NULL,
    [RAreaSqMtr] DECIMAL(18,4) NULL,
    [CAreaSqlMtr] DECIMAL(18,4) NULL,
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationSection129Results_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationSection129Results_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyTaxCalculationSection129Results_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,

    CONSTRAINT [PK_PropertyTaxCalculationSection129Results] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PropertyTaxCalculationSection129Results_PropertyMast] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
    CONSTRAINT [FK_PropertyTaxCalculationSection129Results_PropertyDetails] FOREIGN KEY ([PropertyDetailsId]) REFERENCES [PTIS].[PropertyDetails] ([Id]),
    CONSTRAINT [FK_PropertyTaxCalculationSection129Results_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id])
);
GO	


-- /****** Object:  Table [PTIS].[PropertyTaxSlabWiseMaster]******/
-- SET ANSI_NULLS ON
-- GO

-- SET QUOTED_IDENTIFIER ON
-- GO

-- CREATE TABLE [PTIS].[PropertyTaxSlabWiseMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[Type] [varchar](5) NULL,
-- 	[Year] [int] NULL,
-- 	[MinRV] [money] NULL,
-- 	[MaxRV] [money] NULL,
-- 	[Rate] [money] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxSlabWiseMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyTaxSlabWiseMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_PropertyTaxSlabWiseMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO

-- GO



-- /****** Object:  Table [PTIS].[RateChartDetails]******/
-- SET ANSI_NULLS ON
-- GO

-- SET QUOTED_IDENTIFIER ON
-- GO

-- CREATE TABLE [PTIS].[RateChartDetails](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[Year] [int] NULL,
-- 	[TaxZoneId] [nvarchar](10) NULL,
-- 	[ConstructionTypeId] [int] NULL,
-- 	[Rate] [money] NULL,
-- 	[MinYear] [int] NULL,
-- 	[MaxYear] [int] NULL,
-- 	[RateSectionNo] [nvarchar](20) NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RateChartDetails_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RateChartDetails_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_RateChartDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO

-- ALTER TABLE [PTIS].[RateChartDetails] WITH CHECK ADD CONSTRAINT [FK_RateChartDetails_ConstructionTypeMaster]
-- FOREIGN KEY([ConstructionTypeId]) REFERENCES [PTIS].[ConstructionTypeMaster]([Id]);
-- GO

-- ALTER TABLE [PTIS].[RateChartDetails] CHECK CONSTRAINT [FK_RateChartDetails_ConstructionTypeMaster];
-- GO

-- alter table [PTIS].[RateChartDetails] WITH CHECK ADD CONSTRAINT [FK_RateChartDetails_TaxZoneMaster]
-- FOREIGN KEY([TaxZoneNo]) REFERENCES [PTIS].[TaxZoneMaster]([TaxZoneNo]);
-- GO
-- ALTER TABLE [PTIS].[RateChartDetails] CHECK CONSTRAINT [FK_RateChartDetails_TaxZoneMaster];
-- GO
-- /****** Object:  Table [PTIS].[RateChartMaster]******/
-- SET ANSI_NULLS ON
-- GO

-- SET QUOTED_IDENTIFIER ON
-- GO

-- CREATE TABLE [PTIS].[RateChartMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[Year] [int] NOT NULL,
-- 	[CommercialMultiplier] [float] NULL,
-- 	[IndustrialMultiplier] [float] NULL,
-- 	[CommercialMultiplier2] [float] NULL,
-- 	[CommMultiplierAppliedToZone] [nvarchar](100) NULL,
-- 	[CommMultiplier1AppliedToZone] [nvarchar](100) NULL,
-- 	[MinYear] [int] NULL,
-- 	[MaxYear] [int] NULL,
-- -- 	[RateSectionId] [int] NOT NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RateChartMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RateChartMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
	
--  CONSTRAINT [PK_RateChartMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
-- ) ON [PRIMARY]
-- GO

-- alter table [PTIS].[RateChartMaster] WITH CHECK ADD CONSTRAINT [FK_RateChartMaster_RateSectionMaster]
-- FOREIGN KEY([RateSectionId]) REFERENCES [PTIS].[RateSectionMaster]([Id]);	
-- GO
-- ALTER TABLE [PTIS].[RateChartMaster] CHECK CONSTRAINT [FK_RateChartMaster_RateSectionMaster];

/****** Object:  Table [PTIS].[RateMaster]******/

CREATE TABLE [PTIS].[RateMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--	[Year] [int] NOT NULL,
	[TaxZoneId] [int] NOT NULL,
	[FloorId] [int] NOT NULL,
	[ConstructionTypeId] [int] NOT NULL,
	[TypeOfUseGroupId] [int] NOT NULL,
	[YearRangeRVId] [int] NOT NULL,
	-- [MinYear] [int] NULL,
	-- [MaxYear] [int] NULL,
	[RateSquareMeter] DECIMAL(19,6) NULL,
	[RateSquareFeet] DECIMAL(19,6) NULL,
	[RateSectionId] [int] NOT NULL,
	[RateRemark] [nvarchar](20) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RateMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RateMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	
 CONSTRAINT [PK_RateMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]

GO


ALTER TABLE PTIS.RateMaster WITH CHECK ADD CONSTRAINT FK_RateMaster_TaxZoneMaster
FOREIGN KEY (TaxZoneId) REFERENCES PTIS.TaxZoneMaster(Id);
ALTER TABLE PTIS.RateMaster CHECK CONSTRAINT FK_RateMaster_TaxZoneMaster;
GO

ALTER TABLE [PTIS].[RateMaster] ADD CONSTRAINT [FK_RateMaster_FloorId] 
FOREIGN KEY (FloorId) REFERENCES [PTIS].[FloorMaster](Id);
GO
ALTER TABLE [PTIS].[RateMaster] CHECK CONSTRAINT [FK_RateMaster_FloorId];
GO


ALTER TABLE [PTIS].[RateMaster] ADD CONSTRAINT [FK_RateMaster_ConstructionTypeId]
FOREIGN KEY (ConstructionTypeId) REFERENCES [PTIS].[ConstructionTypeMaster](Id);
GO	
ALTER TABLE [PTIS].[RateMaster] CHECK CONSTRAINT [FK_RateMaster_ConstructionTypeId];
GO

ALTER TABLE [PTIS].[RateMaster] ADD CONSTRAINT [FK_RateMaster_TypeOfUseGroupId]
FOREIGN KEY (TypeOfUseGroupId) REFERENCES [PTIS].[TypeOfUseGroupMaster](Id);
GO
ALTER TABLE [PTIS].[RateMaster] CHECK CONSTRAINT [FK_RateMaster_TypeOfUseGroupId];
GO

ALTER TABLE PTIS.RateMaster WITH CHECK ADD CONSTRAINT [FK_RateMaster_RateSectionMaster]
FOREIGN KEY (RateSectionId) REFERENCES PTIS.RateSectionMaster(Id);
GO
ALTER TABLE PTIS.RateMaster CHECK CONSTRAINT [FK_RateMaster_RateSectionMaster];
GO

ALTER TABLE PTIS.RateMaster WITH CHECK ADD CONSTRAINT FK_RateMaster_AssessmentYearRangeMasterRV
FOREIGN KEY (YearRangeRVId) REFERENCES PTIS.AssessmentYearRangeMasterRV(Id);
GO
ALTER TABLE PTIS.RateMaster CHECK CONSTRAINT FK_RateMaster_AssessmentYearRangeMasterRV;
GO	


ALTER TABLE PTIS.RateMaster ADD CONSTRAINT UQ_RateMaster_TaxZone_Construction_UseGroup_Year_Section
UNIQUE (TaxZoneId,ConstructionTypeId, TypeOfUseGroupId, YearRangeRVId, RateSectionId);
GO







/****** Object:  Table [PTIS].[SubZoneDetailsForCV]******/
CREATE TABLE [PTIS].[SubZoneDetailsForCV](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[MoujaId] [int] NOT NULL,
	[SubZoneNo] [nvarchar](20) NOT NULL,---- (MoujaId + SubZoneNo) 
	[SubZoneName] [nvarchar](1000) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubZoneDetailsForCV_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SubZoneDetailsForCV_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
CONSTRAINT [PK_SubZoneDetailsForCV] PRIMARY KEY CLUSTERED  ([Id] ASC),
constraint UQ_SubZoneDetailsForCV_Mouja_SubZoneNo UNIQUE (MoujaId, SubZoneNo),
CONSTRAINT FK_SubZoneDetailsForCV_MoujaMaster FOREIGN KEY (MoujaId) REFERENCES PTIS.MoujaMaster(Id)	
)
GO

-- Add FK constraint for RateCVMaster.SubZoneId (deferred because SubZoneDetailsForCV is defined after RateCVMaster)
ALTER TABLE [PTIS].[RateCVMaster] WITH CHECK ADD CONSTRAINT [FK_RateCVMaster_SubZoneDetailsForCV] 
FOREIGN KEY([SubZoneId]) REFERENCES [PTIS].[SubZoneDetailsForCV] ([Id]);
GO
ALTER TABLE [PTIS].[RateCVMaster] CHECK CONSTRAINT [FK_RateCVMaster_SubZoneDetailsForCV];
GO

/****** Object:  Table [PTIS].[CSNDetails]   ******/
 
CREATE TABLE [PTIS].[CSNDetails](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[RateCVMasterId] [int] NOT NULL,
	[CSN] [nvarchar](50) NOT NULL,
	[MoujaId] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_CSNDetails_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime]  NOT NULL CONSTRAINT DF_CSNDetails_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_CSNDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO
ALTER TABLE [PTIS].[CSNDetails]  WITH CHECK ADD  CONSTRAINT [FK_csndetails_MoujaMaster] FOREIGN KEY([MoujaId])
	REFERENCES [PTIS].[MoujaMaster] ([Id])
ALTER TABLE [PTIS].[CSNDetails] CHECK CONSTRAINT [FK_csndetails_MoujaMaster]
ALTER TABLE [PTIS].[CSNDetails]  WITH CHECK ADD  CONSTRAINT [FK_CSNDetails_RateCVMaster] FOREIGN KEY([RateCVMasterId])
	REFERENCES [PTIS].[RateCVMaster] ([Id])
ALTER TABLE [PTIS].[CSNDetails] CHECK CONSTRAINT [FK_CSNDetails_RateCVMaster]





/****** Object:  Table [PTIS].[RetentionFactorMaster] ******/
CREATE TABLE [PTIS].[RetentionFactorMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FactorValue] DECIMAL(12,6) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetentionFactMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RetentionFactMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_RetentionFactMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
  CONSTRAINT UQ_RetentionFactorMaster_FactorValue UNIQUE (FactorValue)
) ON [PRIMARY]
GO


/****** Object:  Table [PTIS].[RetentionPolicyFactorWiseMaster] ******/
CREATE TABLE [PTIS].[RetentionPolicyFactorWiseMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FromFactor] DECIMAL(12,6) NULL,
	[ToFactor] DECIMAL(12,6) NULL,
	[FactorValue] DECIMAL(12,6) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetentionPolicyFactWiseMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RetentionPolicyFactWiseMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_RetentionPolicyFactWiseMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT UQ_RetentionPolicyFactorWiseMaster_FactorRange UNIQUE (FromFactor, ToFactor),
 CONSTRAINT CK_RetentionPolicyFactorWiseMaster_Range  CHECK (ToFactor >= FromFactor)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[RetentionPolicyYearWiseMaster]******/

CREATE TABLE [PTIS].[RetentionPolicyYearWiseMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FromYear] [int] NULL,
	[ToYear] [int] NULL,
	[FactorValue] DECIMAL(12,6) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetentionPolicyYearWiseMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RetentionPolicyYearWiseMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_RetentionPolicyYearWiseMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT UQ_RetentionPolicyYearWiseMaster_YearRange UNIQUE (FromYear, ToYear),
 CONSTRAINT CK_RetentionPolicyYearWiseMaster_Range  CHECK (ToYear >= FromYear)
) ON [PRIMARY]
GO

-- /****** Object:  Table [PTIS].[SocietyPartitionNo]******/

-- CREATE TABLE [PTIS].[SocietyPartitionNo](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[PartitionNo] [nvarchar](10) NOT NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SocietyPartitionNo_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SocietyPartitionNo_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_SocietyPartitionNo] PRIMARY KEY CLUSTERED ([Id] ASC),
--  CONSTRAINT [UQ_SocietyPartitionNo_PartitionNo] UNIQUE ([PartitionNo])
-- ) ON [PRIMARY]
-- GO

/****** Object:  Table [PTIS].[SubmissionRemarkMaster]******/

CREATE TABLE [PTIS].[SubmissionRemarkMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[SubmissionRemark] [nvarchar](200) NULL,
	[RemarkType] [nvarchar](200) NULL,
	[IsAreaRemark] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubmissionRemarkMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SubmissionRemarkMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_SubmissionRemarkMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [UQ_SubmissionRemarkMaster_SubmissionRemark] UNIQUE ([SubmissionRemark])
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[SubmissionSameAsUserHistory]******/

CREATE TABLE [PTIS].[SubmissionSameAsUserHistory](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[CopyOn] [int] NULL,
	[SameAs] [int] NULL,
	[Remark] [nvarchar](400) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_SubmissionSameAsUserHistory_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_SubmissionSameAsUserHistory_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_SubmissionSameAsUserHistory_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	
PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO



-- /****** Object:  Table [PTIS].[TaxNameMaster]******/

-- CREATE TABLE [PTIS].[TaxNameMaster](
-- 	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
-- 	[TaxName] [nvarchar](100) NULL,
-- 	[AliseName] [nvarchar](100) NULL,
-- 	[Interest] [nvarchar](50) NULL,
-- 	[ExcelAliasName] [nvarchar](100) NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxNameMaster_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_TaxNameMaster_CreatedDate DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,
--  CONSTRAINT [PK_TaxNameMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
--  CONSTRAINT [UQ_TaxNameMaster_TaxName] UNIQUE ([TaxName])
-- ) ON [PRIMARY]
-- GO





-- /****** Object:  Table [PTIS].[TaxPendingDetails]******/

-- CREATE TABLE PTIS.TaxPendingDetails (
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [PendingYearId] INT NOT NULL,
--     [TaxId] INT NOT NULL,
--     [PendingAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_TaxPendingDetails_PendingAmount] DEFAULT (0),
--     [PendingFixed] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetails_PendingFixed] DEFAULT (0),
--     [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetails_MarkedForDeletion] DEFAULT (0),
--     [MarkedForDeletionDate] [datetime] NULL,
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetails_IsActive] DEFAULT (1),
--     [CreatedBy] [int] NULL,
--     [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxPendingDetails_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] [int] NULL,
--     [UpdatedDate] [datetime] NULL,

--     CONSTRAINT [PK_TaxPendingDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
--     CONSTRAINT [FK_TaxPendingDetails_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TaxPendingDetails_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TaxPendingDetails_YearMaster]  FOREIGN KEY ([PendingYearId]) REFERENCES CORE.YearMaster([Id])
-- );

-- /****** Object:  Table [PTIS].[TaxPendingDetailsArchive]******/

-- CREATE TABLE  [PTIS].[TaxPendingDetailsArchive](
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [PendingYearId] INT NOT NULL,
--     [TaxId] INT NOT NULL,
--     [PendingAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_TaxPendingDetailsArchive_ArrearsAmount] DEFAULT (0),
--     [PendingFixed] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsArchive_PendingFixed] DEFAULT (0),
--     [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsArchive_MarkedForDeletion] DEFAULT (0),
--     [MarkedForDeletionDate] [datetime] NULL,
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsArchive_IsActive] DEFAULT (1),
--     [CreatedBy] INT NULL,
--     [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_TaxPendingDetailsArchive_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] INT NULL,
--     [UpdatedDate] DATETIME NULL,

--     CONSTRAINT [PK_TaxPendingDetailsArchive] PRIMARY KEY CLUSTERED ([Id] ASC),
--     CONSTRAINT [FK_TaxPendingDetailsArchive_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsArchive_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsArchive_YearMaster]  FOREIGN KEY ([PendingYearId]) REFERENCES CORE.YearMaster([Id])
-- );


-- /****** Object:  Table [PTIS].[TaxPendingDetailsCV]******/

-- CREATE TABLE  [PTIS].[TaxPendingDetailsCV](
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [PendingYearId] INT NOT NULL,
--     [TaxId] INT NOT NULL,
--     [PendingAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_TaxPendingDetailsCV_ArrearsAmount] DEFAULT (0),
--    	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsCV_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsCV_IsActive] DEFAULT (1),
-- 	[CreatedBy] [int] NULL,
-- 	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxPendingDetailsCV_CreatedDate] DEFAULT (GETDATE()),
-- 	[UpdatedBy] [int] NULL,
-- 	[UpdatedDate] [datetime] NULL,

--     CONSTRAINT [PK_TaxPendingDetailsCV] PRIMARY KEY CLUSTERED ([Id] ASC),
--     CONSTRAINT [FK_TaxPendingDetailsCV_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsCV_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsCV_YearMaster]  FOREIGN KEY ([PendingYearId]) REFERENCES CORE.YearMaster([Id])
-- );

-- /****** Object:  Table [PTIS].[TaxPendingDetailsLookup]******/
-- CREATE TABLE  [PTIS].[TaxPendingDetailsLookup](
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [PendingYearId] INT NOT NULL,
--     [TaxId] INT NOT NULL,
--     [PendingAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_TaxPendingDetailsLookup_ArrearsAmount] DEFAULT (0),
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsLookup_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsLookup_IsActive] DEFAULT (1),
--     [CreatedBy] INT NULL,
--     [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_TaxPendingDetailsLookup_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] INT NULL,
--     [UpdatedDate] DATETIME NULL,

--     CONSTRAINT [PK_TaxPendingDetailsLookup] PRIMARY KEY CLUSTERED ([Id] ASC),
--     CONSTRAINT [FK_TaxPendingDetailsLookup_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsLookup_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsLookup_YearMaster]  FOREIGN KEY ([PendingYearId]) REFERENCES CORE.YearMaster([Id])
-- );

-- /****** Object:  Table [PTIS].[TaxPendingDetailsRetro]******/

-- CREATE TABLE  [PTIS].[TaxPendingDetailsRetro](
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [PendingYearId] INT NOT NULL,
--     [TaxId] INT NOT NULL,
--     [PendingAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_TaxPendingDetailsRetro_ArrearsAmount] DEFAULT (0),
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsRetro_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsRetro_IsActive] DEFAULT (1),
--     [CreatedBy] INT NULL,
--     [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_TaxPendingDetailsRetro_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] INT NULL,
--     [UpdatedDate] DATETIME NULL,

--     CONSTRAINT [PK_TaxPendingDetailsRetro] PRIMARY KEY CLUSTERED ([Id] ASC),
--     CONSTRAINT [FK_TaxPendingDetailsRetro_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsRetro_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsRetro_YearMaster]  FOREIGN KEY ([PendingYearId]) REFERENCES CORE.YearMaster([Id])
-- );

-- /****** Object:  Table [PTIS].[TaxPendingDetailsRV]******/

-- CREATE TABLE  [PTIS].[TaxPendingDetailsRV](
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [PendingYearId] INT NOT NULL,
--     [TaxId] INT NOT NULL,
--     [PendingAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_TaxPendingDetailsRV_ArrearsAmount] DEFAULT (0),
-- 	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsRV_MarkedForDeletion] DEFAULT (0),
-- 	[MarkedForDeletionDate] [datetime] NULL,
-- 	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxPendingDetailsRV_IsActive] DEFAULT (1),
--     [CreatedBy] INT NULL,
--     [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_TaxPendingDetailsRV_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] INT NULL,
--     [UpdatedDate] DATETIME NULL,

--     CONSTRAINT [PK_TaxPendingDetailsRV] PRIMARY KEY CLUSTERED ([Id] ASC),
--     CONSTRAINT [FK_TaxPendingDetailsRV_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsRV_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TaxPendingDetailsRV_YearMaster]  FOREIGN KEY ([PendingYearId]) REFERENCES CORE.YearMaster([Id])
-- );

/****** Object:  Table [PTIS].[TransMast]******/

CREATE TABLE PTIS.TransMast (
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] INT NOT NULL,
    [FinanceYearId] INT NOT NULL,
    [CalculationType] CHAR(2) NOT NULL,                -- RV or CV
	[CalculationAnnualValue] DECIMAL(18,2) NULL CONSTRAINT [DF_Transmast_CalculationALV] DEFAULT(0) ,
    [CalculationValue] DECIMAL(18,2) NOT NULL,
    [TaxId] INT NOT NULL,                     -- FK to TaxMaster
    [TaxAmount] DECIMAL(18,2) NOT NULL   CONSTRAINT [DF_TransMast_TaxAmount] DEFAULT (0),
	[PolicyCodeId] INT NOT NULL  CONSTRAINT [DF_TransMast_PolicyCodeId] DEFAULT (1), 
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TransMast_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TransMast_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL  CONSTRAINT [DF_TransMast_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_TransMast]  PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_TransMast_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
	CONSTRAINT [FK_TransMast_PropertyMast] FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
	CONSTRAINT [FK_TransMast_YearMaster] FOREIGN KEY ([FinanceYearId]) REFERENCES CORE.YearMaster([Id]),
	CONSTRAINT [FK_TransMast_PolicyCodeMaster] FOREIGN KEY ([PolicyCodeId]) REFERENCES [PTIS].[PolicyCodeMaster]([Id])
	);

ALTER TABLE [PTIS].[TransMast]
ADD CONSTRAINT [UQ_TransMast_Id_Context]
UNIQUE
(
    [Id],
    [PropertyId],
    [FinanceYearId],
    [CalculationType],
    [PolicyCodeId],
    [TaxId]
);
GO
CREATE UNIQUE NONCLUSTERED INDEX
    [UQ_TransMast_Property_Year_CalculationType_Policy_Tax]
ON [PTIS].[TransMast]
(
    [PropertyId],
    [FinanceYearId],
    [CalculationType],
    [PolicyCodeId],
    [TaxId]
)
WHERE
    [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX
    [IX_TransMast_PropertyYear]
ON [PTIS].[TransMast]
(
    [PropertyId],
    [FinanceYearId]
)
INCLUDE
(
    [CalculationType],
    [CalculationValue],
    [CalculationAnnualValue],
    [PolicyCodeId],
    [TaxId],
    [TaxAmount]
)
WHERE
    [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX
    [IX_TransMast_PolicyCodeId]
ON [PTIS].[TransMast]
(
    [PolicyCodeId]
)
INCLUDE
(
    [PropertyId],
    [FinanceYearId],
    [CalculationType],
    [TaxId],
    [TaxAmount]
)
WHERE
    [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX
    [IX_TransMast_TaxId]
ON [PTIS].[TransMast]
(
    [TaxId]
)
INCLUDE
(
    [PropertyId],
    [FinanceYearId],
    [CalculationType],
    [PolicyCodeId],
    [TaxAmount]
)
WHERE
    [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO


/****** Object:  Table [PTIS].[TransMastOld]******/

CREATE TABLE PTIS.TransMastOld (
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyMastOldId] INT NOT NULL,
    [FinanceYearId] INT NOT NULL,
    [CalculationType] CHAR(2) NOT NULL,                -- RV or CV
	[CalculationAnnualValue] DECIMAL(18,2) NULL CONSTRAINT [DF_TransmastOld_CalculationALV] DEFAULT(0) ,
    [CalculationValue] DECIMAL(18,2) NOT NULL,
    [TaxId] INT NOT NULL,                     -- FK to TaxMaster
    [TaxAmount] DECIMAL(18,2) NOT NULL   CONSTRAINT [DF_TransMastOld_TaxAmount] DEFAULT (0),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TransMastOld_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TransMastOld_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL  CONSTRAINT [DF_TransMastOld_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_TransMastOld]  PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_TransMastOld_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
	CONSTRAINT [FK_TransMastOld_PropertyMastOld] FOREIGN KEY ([PropertyMastOldId]) REFERENCES PTIS.PropertyMastold([Id]),
	CONSTRAINT [FK_TransMastOld_YearMaster] FOREIGN KEY ([FinanceYearId]) REFERENCES CORE.YearMaster([Id])
	);


CREATE UNIQUE NONCLUSTERED INDEX
    [UQ_TransMastOld_Property_Year_CalculationType_Tax]
ON [PTIS].[TransMastOld]
(
    [PropertyMastOldId],
    [FinanceYearId],
    [CalculationType],
    [TaxId]
)
WHERE [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_TransMastOld_PropertyYear]
ON [PTIS].[TransMastOld]
(
    [PropertyMastOldId],
    [FinanceYearId]
)
INCLUDE
(
    [CalculationType],
    [CalculationValue],
    [TaxId],
    [TaxAmount]
)
WHERE [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_TransMastOld_TaxId]
ON [PTIS].[TransMastOld]
(
    [TaxId]
)
INCLUDE
(
    [PropertyMastOldId],
    [FinanceYearId],
    [CalculationType],
    [TaxAmount]
)
WHERE [MarkedForDeletion] = 0;
GO

-- /****** Object:  Table [PTIS].[TransMastArchive]******/
-- CREATE TABLE PTIS.TransMastArchive (
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [FinanceYearId] INT NOT NULL,
--     [RVorCV] CHAR(2) NOT NULL,
--     [RVorCVValue] DECIMAL(18,2) NOT NULL,
--     [TaxId] INT NOT NULL,
--     [TaxAmount] DECIMAL(18,2) NOT NULL,
--     [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TransMastArchive_MarkedForDeletion] DEFAULT (0),
--     [MarkedForDeletionDate] [datetime] NULL,
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_TransMastArchive_IsActive] DEFAULT (1),
--     [CreatedBy] INT NULL,
--     [CreatedDate] DATETIME  NOT NULL  CONSTRAINT [DF_TransMastArchive_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] INT NULL,
--     [UpdatedDate] DATETIME NULL,

--     CONSTRAINT [PK_TransMastArchive]  PRIMARY KEY CLUSTERED ([Id]),
--     CONSTRAINT [FK_TransMastArchive_TaxMaster]  FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TransMastArchive_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TransMastArchive_YearMaster]  FOREIGN KEY ([FinanceYearId]) REFERENCES CORE.YearMaster([Id])    
-- ); 

-- ALTER TABLE PTIS.TransMastArchive ADD CONSTRAINT [UQ_TransMastArchive_Property_Year_Tax] UNIQUE (PropertyId, FinanceYearId, TaxId);
-- CREATE NONCLUSTERED INDEX IX_TransMastArchive_PropertyYear ON PTIS.TransMastArchive(PropertyId, FinanceYearId)  INCLUDE (TaxId, TaxAmount);
-- CREATE NONCLUSTERED INDEX IX_TransMastArchive_TaxId ON PTIS.TransMastArchive(TaxId);


-- /****** Object:  Table [PTIS].[TransMastCV]******/

-- CREATE TABLE PTIS.TransMastCV (
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [FinanceYearId] INT NOT NULL,
--     [CapitalValue] [money] NULL,
--     [TaxId] INT NOT NULL,
--     [TaxAmount] DECIMAL(18,2) NOT NULL,
--     [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TransMastCV_MarkedForDeletion] DEFAULT (0),
--     [MarkedForDeletionDate] [datetime] NULL,
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_TransMastCV_IsActive] DEFAULT (1),
--     [CreatedBy] INT NULL,
--     [CreatedDate] DATETIME  NOT NULL  CONSTRAINT [DF_TransMastCV_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] INT NULL,
--     [UpdatedDate] DATETIME NULL,

--     CONSTRAINT [PK_TransMastCV]  PRIMARY KEY CLUSTERED ([Id]),
--     CONSTRAINT [FK_TransMastCV_TaxMaster]  FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TransMastCV_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TransMastCV_YearMaster]  FOREIGN KEY ([FinanceYearId]) REFERENCES CORE.YearMaster([Id])    
-- ); 


-- ALTER TABLE PTIS.TransMastCV ADD CONSTRAINT [UQ_TransMastCV_Property_Year_Tax] UNIQUE (PropertyId, FinanceYearId, TaxId);
-- CREATE NONCLUSTERED INDEX IX_TransMastCV_PropertyYear ON PTIS.TransMastCV(PropertyId, FinanceYearId)  INCLUDE (TaxId, TaxAmount);
-- CREATE NONCLUSTERED INDEX IX_TransMastCV_TaxId ON PTIS.TransMastCV(TaxId);


-- /****** Object:  Table [PTIS].[TransMastLookup]******/
-- CREATE TABLE PTIS.TransMastLookup (
--     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
--     [PropertyId] INT NOT NULL,
--     [FinanceYearId] INT NOT NULL,
--     [RVorCV] CHAR(2) NOT NULL,
--     [RVorCVValue] DECIMAL(18,2) NOT NULL,
--     [TaxId] INT NOT NULL,
--     [TaxAmount] DECIMAL(18,2) CONSTRAINT [DF_TransMastLookup_TaxAmount] DEFAULT (0),
--     [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TransMastLookup_MarkedForDeletion] DEFAULT (0),
--     [MarkedForDeletionDate] [datetime] NULL,
--     [IsActive] [bit] NOT NULL CONSTRAINT [DF_TransMastLookup_IsActive] DEFAULT (1),
--     [CreatedBy] INT NULL,
--     [CreatedDate] DATETIME  NOT NULL  CONSTRAINT [DF_TransMastLookup_CreatedDate] DEFAULT (GETDATE()),
--     [UpdatedBy] INT NULL,
--     [UpdatedDate] DATETIME NULL,

--     CONSTRAINT [PK_TransMastLookup]  PRIMARY KEY CLUSTERED ([Id]),
--     CONSTRAINT [FK_TransMastLookup_TaxMaster]  FOREIGN KEY ([TaxId]) REFERENCES PTIS.TaxMaster([Id]),
--     CONSTRAINT [FK_TransMastLookup_PropertyMast]  FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
--     CONSTRAINT [FK_TransMastLookup_YearMaster]  FOREIGN KEY ([FinanceYearId]) REFERENCES CORE.YearMaster([Id])    
-- ); 


-- ALTER TABLE PTIS.TransMastLookup ADD CONSTRAINT [UQ_TransMastLookup_Property_Year_Tax] UNIQUE (PropertyId, FinanceYearId, TaxId);
-- CREATE NONCLUSTERED INDEX IX_TransMastLookup_PropertyYear ON PTIS.TransMastLookup(PropertyId, FinanceYearId)  INCLUDE (TaxId, TaxAmount);
-- CREATE NONCLUSTERED INDEX IX_TransMastLookup_TaxId ON PTIS.TransMastLookup(TaxId);




/****** Object:  Table [PTIS].[RoomWiseMinusData] ******/ 
CREATE TABLE [PTIS].[RoomWiseMinusData](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RoomWiseSubmissionId] [int] NULL,
	[LengthMtr] DECIMAL(18,4) NULL,
	[WidthMtr] DECIMAL(18,4) NULL,
	[AreaSqMtr] DECIMAL(18,4) NULL,
	[HeightMtr] DECIMAL(18,4) NULL,
	[Base1Mtr] DECIMAL(18,4) NULL,
	[Base2Mtr] DECIMAL(18,4) NULL,
	[Shape] [nvarchar](25) NULL,
	[IsOffset] [bit] NOT NULL CONSTRAINT [DF_RoomWiseMinusData_IsOffset] DEFAULT (0),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RoomWiseMinusData_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RoomWiseMinusData_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RoomWiseMinusData_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
CONSTRAINT [PK_RoomWiseMinusData] PRIMARY KEY CLUSTERED ( [Id] ASC )
) ON [PRIMARY]
GO	

ALTER TABLE [PTIS].[RoomWiseMinusData]  WITH CHECK ADD  CONSTRAINT [FK_RoomWiseMinusData_RoomWiseSubmissionDetails] FOREIGN KEY([RoomWiseSubmissionId])
REFERENCES [PTIS].[RoomWiseSubmissionDetails] ([Id])
GO

ALTER TABLE [PTIS].[RoomWiseMinusData] CHECK CONSTRAINT [FK_RoomWiseMinusData_RoomWiseSubmissionDetails]
GO


/****** Object:  Table [PTIS].[RenterDetails] ******/
CREATE TABLE [PTIS].[RenterDetails] (
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyDetailsId] [INT] NOT NULL,
    [AgreementId] [Nvarchar](25) NULL, 
    [IncrementFrequency] [NVARCHAR](35) NULL,
    [IncrementType] [NVARCHAR](35) NULL,
    [IncrementValue] DECIMAL(19,4) NULL,
    [IncrementMethod] [NVARCHAR](35) NULL,
    [DurationFrom] [DATETIME] NULL,
    [DurationTo] [DATETIME] NULL,
    [RentAmount] DECIMAL(19,4) NULL,
    [Increment] DECIMAL(19,4) NULL, 
    [IncrementStatus] [bit] NULL,
    [RentMonthly] DECIMAL(19,4) null,
    [CustomFromDate] [datetime] NULL,
    [CustomToDate] [datetime] NULL,
    [CustomIncrementType] [nvarchar](100) NULL,
    [CustomIncrementValue] DECIMAL(19,4) NULL,
    [CustomMethod] [nvarchar](100) NULL,
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RenterDetails_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_RenterDetails_IsActive] DEFAULT (1),
    [CreatedBy] [INT] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RenterDetails_CreatedDate DEFAULT (GETDATE()),
    [UpdatedBy] [INT] NULL,
    [UpdatedDate] [DATETIME] NULL,
	CONSTRAINT Pk_RenterDetails PRIMARY KEY CLUSTERED ([Id] ASC	),
    CONSTRAINT [CK_RenterDetails_DurationDates]
        CHECK ([DurationFrom] IS NULL OR [DurationTo] IS NULL OR [DurationTo] >= [DurationFrom]),
    CONSTRAINT [CK_RenterDetails_CustomDates]
        CHECK ([CustomFromDate] IS NULL OR [CustomToDate] IS NULL OR [CustomToDate] >= [CustomFromDate])
    );

GO

ALTER TABLE PTIS.RenterDetails  WITH CHECK ADD  CONSTRAINT [FK_RenterDetails_PropertyDetails] FOREIGN KEY([PropertyDetailsId])
REFERENCES [PTIS].[PropertyDetails] ([Id])
GO	
ALTER TABLE PTIS.RenterDetails CHECK CONSTRAINT [FK_RenterDetails_PropertyDetails]
GO	



/****** Object:  Table [PTIS].[RenterMast] ******/
CREATE TABLE  [PTIS].[RenterMast] (
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyDetailsId] [INT] NOT NULL,
	[RentMonthly] DECIMAL(19,4) NULL,
    [FinalYearlyRent] DECIMAL(19,4) NULL,
    [FinancialYear] [nvarchar](4) NULL,
    [DurationFrom] [DATETIME] NULL,
    [DurationTo] [DATETIME] NULL,
	[TaxLiability] [nvarchar](20) NULL,
	[NonCalculateRentMonthly] DECIMAL(19,4) NULL,
	[RenterNameEnglish] [nvarchar](500) NULL,
	[RenterName] [nvarchar](500) NULL,
	[AgreementDate] [datetime] NULL,
	[AgreementFromDate] [datetime] NULL,
	[AgreementToDate] [datetime] NULL,
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RenterMast_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_RenterMast_IsActive] DEFAULT (1),
    [CreatedBy] [INT] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RenterMast_CreatedDate DEFAULT (GETDATE()),
    [UpdatedBy] [INT] NULL,
    [UpdatedDate] [DATETIME] NULL,
    [DocumentBindingId] [int] NULL,
	CONSTRAINT Pk_RenterMast PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_RenterMast_DurationDates]
        CHECK ([DurationFrom] IS NULL OR [DurationTo] IS NULL OR [DurationTo] >= [DurationFrom]),
    CONSTRAINT [CK_RenterMast_AgreementDates]
        CHECK ([AgreementFromDate] IS NULL OR [AgreementToDate] IS NULL OR [AgreementToDate] >= [AgreementFromDate])
) ON [PRIMARY]

GO
ALTER TABLE PTIS.RenterMast  WITH CHECK ADD  CONSTRAINT [FK_RenterMast_PropertyDetails] FOREIGN KEY([PropertyDetailsId])
REFERENCES [PTIS].[PropertyDetails] ([Id])
GO
ALTER TABLE PTIS.RenterMast CHECK CONSTRAINT [FK_RenterMast_PropertyDetails]
GO
ALTER TABLE PTIS.RenterMast WITH CHECK ADD CONSTRAINT [FK_RenterMast_DocumentBinding] FOREIGN KEY([DocumentBindingId])
REFERENCES [CORE].[DocumentBinding] ([Id])
GO
ALTER TABLE PTIS.RenterMast CHECK CONSTRAINT [FK_RenterMast_DocumentBinding]
GO
CREATE NONCLUSTERED INDEX [IX_RenterMast_DocumentBindingId]
	ON [PTIS].[RenterMast]([DocumentBindingId])
	WHERE [DocumentBindingId] IS NOT NULL
GO



----------- Master For Global Survey App ----Start----------
GO


GO
/****** Object:  Table [PTIS].[GenderMaster] ******/
CREATE TABLE [PTIS].[GenderMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[GenderName] NVARCHAR(50) NOT NULL,
	[IsActive] BIT NOT NULl CONSTRAINT DF_GenderMaster_IsActive DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_GenderMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT UQ_GenderMaster_GenderName UNIQUE ([GenderName]),
 	CONSTRAINT [PK_GenderMaster] PRIMARY KEY CLUSTERED ( [Id] ASC )
) ON [PRIMARY]
GO


/****** Object:  Table [PTIS].[DocumentMaster] ******/
CREATE TABLE [PTIS].[DocumentMaster](
	[Id] [int] IDENTITY(1,1) not FOR REPLICATION NOT NULL,
	[DocumentName] [nvarchar](100) NOT null, 
	[DocPrefix] [varchar](50) not null, 
	[IsActive] BIT NOT NULl CONSTRAINT DF_documentmaster_IsActive DEFAULT (1),
	[CreatedBy] [int] null,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_documentmaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] null,
	[UpdatedDate] [datetime] null,
PRIMARY KEY CLUSTERED ([Id] ASC),
CONSTRAINT UQ_DocumentMaster_DocumentName UNIQUE (DocumentName)
) ON [primary]
GO



/****** Object:  Table [PTIS].[PropertyVisitMeasurementMaster] ******/
CREATE TABLE [PTIS].[PropertyVisitMeasurementMaster](
	[Id] int NOT NULL IDENTITY(1,1) NOT FOR REPLICATION,
	[PropertyVisitAndMeasurement] [nvarchar](200) NULL,
	[BillAcceptStatus] [varchar](20) NULL,
	[Remark] [varchar](100) NULL,
	[Flag] [varchar](20) NULL,
	[IsActive] BIT NOT NULl CONSTRAINT DF_PropertyVisitMeasurementMaster_IsActive DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyVisitMeasurement_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	PRIMARY KEY CLUSTERED ([Id] ASC ),
	CONSTRAINT UQ_PropertyVisitMeasurementMaster_PropertyVisitAndMeasurement  UNIQUE (PropertyVisitAndMeasurement)
) ON [PRIMARY]
GO

GO
/****** Object:  Table [PTIS].[MobileScreenValidationMaster] ******/
CREATE TABLE [PTIS].[MobileScreenValidationMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TabScreenName] [varchar](500) NULL,
	[Flag] [nvarchar](30) NULL,
	[Alias] [nvarchar](200) NULL,
	[DefaultSequenceNo] [int] NULL,
	[DefaultNumberingAccess] [bit] NULL,
	[DefaultSurveyAccess] [bit] NULL,
	[IsActive] BIT NOT NULl CONSTRAINT DF_MobileScreenValidationMaster_IsActive DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_MobileScreenValidationMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_TabScreenMaster] PRIMARY KEY CLUSTERED  (	[Id] ASC ),
 CONSTRAINT UQ_MobileScreenValidationMaster_TabScreenName_Flag UNIQUE (TabScreenName, Flag)
) ON [PRIMARY]
 

GO
/****** Object:  Table [PTIS].[BlockMaster] ******/
CREATE TABLE [PTIS].[BlockMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[WardId] int NULL,
	[BlockNo] [nvarchar](20) NULL,
	[IsActive] BIT NOT NULl CONSTRAINT DF_BlockMaster_IsActive DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_BlockMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_BlockMaster] PRIMARY KEY CLUSTERED  ([Id] ASC),
 CONSTRAINT UQ_BlockMaster_Ward_BlockNo  UNIQUE (WardId, BlockNo),
 CONSTRAINT [FK_BlockMaster_WardMaster] FOREIGN KEY ([WardId]) REFERENCES [PTIS].[WardMaster]([Id])
) ON [PRIMARY]
GO
----------- Master For Global Survey App ----End----------



CREATE TABLE [PTIS].[PolicyConfiguration]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PolicyCode] NVARCHAR(50) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL,
    [DisplayName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [DataType] NVARCHAR(20) NOT NULL CONSTRAINT [DF_PolicyConfiguration_DataType] DEFAULT (N'bit'),
	[PolicyValue] NVARCHAR(4000) NULL,
    [DefaultValue] NVARCHAR(4000) NULL, 
	[Unit] VARCHAR(30) NULL,  
	[EffectiveFrom] DATETIME NULL,
    [EffectiveTo] DATETIME NULL,
    [AllowedValues] NVARCHAR(500) NULL,
	[IsProtected] BIT NOT NULL CONSTRAINT [DF_PolicyConfiguration_IsProtected] DEFAULT (0),
	[IsActive] BIT NOT NULL CONSTRAINT [DF_PolicyConfiguration_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL, 
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_PolicyConfiguration_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,  
    CONSTRAINT [PK_PolicyConfiguration] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT UQ_PolicyConfiguration_PolicyCode  UNIQUE ([PolicyCode]),
	CONSTRAINT [CK_PolicyConfiguration_DataType]
    CHECK ([DataType] IN ('BIT','INT','DECIMAL','VARCHAR','DATE','TIME','URL'))
);

CREATE TABLE [PTIS].[PolicyConfigurationHistory]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PolicyConfigurationId] INT NOT NULL,
    [PolicyCode] VARCHAR(150) NOT NULL,
    [OldPolicyValue] NVARCHAR(1000) NULL,
    [NewPolicyValue] NVARCHAR(1000) NULL,
    [OldIsActive] BIT NULL,
    [NewIsActive] BIT NULL,
    [ChangeReason] NVARCHAR(1000) NULL,
    [Remark] NVARCHAR(1000) NULL,
    [ChangedBy] INT NULL,
    [ChangedDate] DATETIME NOT NULL CONSTRAINT [DF_PolicyConfigurationHistory_ChangedDate] DEFAULT(GETDATE()),
    CONSTRAINT [PK_PolicyConfigurationHistory]
        PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PolicyConfigurationHistory_PolicyConfiguration]
        FOREIGN KEY ([PolicyConfigurationId])
        REFERENCES [PTIS].[PolicyConfiguration]([Id])
);

/* ===========================
 PropertyMapMaster
===========================*/
CREATE TABLE [PTIS].[PropertyMapMaster](
     [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
     [ModuleId] INT NULL,
     [ParentPropertyMapId] INT NULL,
     [VersionNo] INT NOT NULL CONSTRAINT [DF_PropertyMapMaster_VersionNo] DEFAULT ((1)),
     [MappingCategory] VARCHAR(30) NOT NULL,
     [ChangeReason] NVARCHAR(500) NULL,
     [Remark] NVARCHAR(500) NULL,
     [IsActive] BIT NOT NULL CONSTRAINT [DF_PropertyMapMaster_IsActive] DEFAULT ((1)),
     [CreatedBy] INT NULL,
     [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_PropertyMapMaster_CreatedDate] DEFAULT (GETDATE()),
     [UpdatedBy] INT NULL,
     [UpdatedDate] DATETIME NULL,
     CONSTRAINT [PK_PropertyMapMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
     CONSTRAINT [CK_PropertyMapMaster_MappingCategory] CHECK ([MappingCategory] IN ('ONE_TO_ONE', 'SPLIT', 'MERGE','MAP')),
     CONSTRAINT [FK_PropertyMapMaster_ParentPropertyMapId] FOREIGN KEY ([ParentPropertyMapId]) REFERENCES [PTIS].[PropertyMapMaster] ([Id]),
	 CONSTRAINT [FK_PropertyMapMaster_ModuleMaster] FOREIGN KEY ([ModuleId]) REFERENCES [CORE].[ModuleMaster] ([Id])
);
GO

ALTER TABLE [PTIS].[PropertyMapMaster] ADD CONSTRAINT [UQ_PropertyMapMaster_ModuleId_ParentPropertyMapId_MappingCategory] UNIQUE ([ModuleId],[ParentPropertyMapId],[MappingCategory])
GO

/* ===========================
 PropertyMapDetail
===========================*/
CREATE TABLE [PTIS].[PropertyMapDetail]
(
[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
[PropertyMapId] INT NOT NULL,
[PropertyIdNew] INT NULL,
[PropertyIdOld] INT NULL,
[PropertyNoOld] NVARCHAR(50) NULL,
[PropertyNoNew] NVARCHAR(50) NULL,
[TaxSharePercent] DECIMAL(9,4) NULL CONSTRAINT CK_PropertyMapDetail_TaxSharePercent CHECK (TaxSharePercent IS NULL OR TaxSharePercent BETWEEN 0 AND 100),
[AreaSharePercent] DECIMAL(9,4) NULL,
[Status] VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'  CONSTRAINT [CK_PropertyMapDetail_Status]   CHECK ([Status] IN ('ACTIVE', 'MODIFIED', 'CANCELLED','DRAFT')),
[IsCurrent] BIT NOT NULL DEFAULT 1,
[ChangeReason] NVARCHAR(300) NULL,
[Remark] NVARCHAR(500) NULL,
[Latitude] DECIMAL(12,8) NULL,
[Longitude] DECIMAL(12,8) NULL,
[Location] NVARCHAR(500) NULL,
[IsActive] BIT NOT NULL CONSTRAINT [DF_PropertyMapDetail_IsActive] DEFAULT (1),
[CreatedBy] INT NULL, 
[CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_PropertyMapDetail_CreatedDate] DEFAULT (GETDATE()),
[UpdatedBy] INT NULL,
[UpdatedDate] DATETIME NULL, 
CONSTRAINT [PK_PropertyMapDetail] PRIMARY KEY CLUSTERED ([Id] ASC),
CONSTRAINT [FK_PropertyMapDetail_PropertyMapMaster] FOREIGN KEY ([PropertyMapId]) REFERENCES [PTIS].[PropertyMapMaster]([Id]),
CONSTRAINT UQ_PropertyMapDetail_PropertyMapId_PropertyId_Status UNIQUE (PropertyMapId, PropertyIdNew, PropertyIdOld,Status),
CONSTRAINT [CK_PropertyMapDetail_PropertyNoOld_PropertyNoNew]
CHECK
(
	[IsActive] = 0
	OR
	(
		[PropertyIdOld] IS NOT NULL
		AND [PropertyNoOld] IS NOT NULL
		AND [PropertyIdNew] IS NOT NULL
		AND [PropertyNoNew] IS NOT NULL
	)
)
);
GO


-- ============================================================
-- BulkUpdateActivity (used to audit all actions on bulk update screens)
-- ============================================================
CREATE TABLE [PTIS].[BulkUpdateActivity](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ActivityType] [varchar](100) NULL,
	[ActivityStatus] [varchar](50) NULL,
	[CreatedDateTime] [datetime] NOT NULL CONSTRAINT [DF_BulkUpdateActivity_DateAndTime]  DEFAULT (getdate()),
	[RecordCount] [int] NULL,
	[ClientIpAddress] [nvarchar](100) NULL,
	[Remarks] [nvarchar](1000) NULL,
	[GroupName] [nvarchar](200) NULL,
	[ExecutedBy] [nvarchar](200) NULL,
	[StartDateTime] [datetime] NULL,
	[EndDateTime] [datetime] NULL,
	[DurationInSeconds] [int] NULL,
	[ActivityRemark] [nvarchar](1000) NULL,
	CONSTRAINT [PK_BulkUpdateActivity] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

-- ============================================================
-- BulkUpdateMaster ( Holds one row per supported bulk-update operation type.)
-- ============================================================
CREATE TABLE [PTIS].[BulkUpdateMaster] ( 
	[Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL, 
	[UpdateCode] VARCHAR(100) NOT NULL, 
	[GroupName] NVARCHAR(200) NOT NULL, 
	[ReferenceTableName] VARCHAR(200) NULL, 
	[IsActive] BIT NOT NULL CONSTRAINT [DF_BulkUpdateMaster_IsActive] DEFAULT (1), 
	[CreatedBy] INT NULL, 
	[CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_BulkUpdateMaster_CreatedDate] DEFAULT (GETDATE()), 
	[UpdatedBy] INT NULL, 
	[UpdatedDate] DATETIME NULL, 
	CONSTRAINT [PK_BulkUpdateMaster] PRIMARY KEY CLUSTERED ([Id] ASC), 
	CONSTRAINT [UQ_BulkUpdateMaster_UpdateCode] UNIQUE NONCLUSTERED ([UpdateCode] ASC) 
);
GO

/* ===========================
   BulkUpdateFieldConfig
   =========================== */
CREATE TABLE [PTIS].[BulkUpdateFieldConfig] ( 
	[Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL, 
	[BulkUpdateMasterId] INT NOT NULL, 
	[FieldName] VARCHAR(200) NOT NULL, 
	[DisplayName] VARCHAR(200) NULL, 
	[ControlType] VARCHAR(50) NULL, 
	[DataType] VARCHAR(50) NULL, 
	[Placeholder] NVARCHAR(500) NULL, 
	[IsRequired] BIT NOT NULL CONSTRAINT [DF_BulkUpdateFieldConfig_IsRequired] DEFAULT (0), 
	[MaxLength] INT NULL, 
	[ValidationRegex] VARCHAR(500) NULL, 
	[DefaultValue] VARCHAR(500) NULL, 
	[SequenceNo] INT NOT NULL CONSTRAINT [DF_BulkUpdateFieldConfig_SequenceNo] DEFAULT (0), 
	[BindApi] VARCHAR(500) NULL, 
	[ApiResponse] VARCHAR(500) NULL, 
	[IsActive] BIT NOT NULL CONSTRAINT [DF_BulkUpdateFieldConfig_IsActive] DEFAULT (1), 
	[CreatedBy] INT NULL, 
	[CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_BulkUpdateFieldConfig_CreatedDate] DEFAULT (GETDATE()), 
	[UpdatedBy] INT NULL, 
	[UpdatedDate] DATETIME NULL, 
	CONSTRAINT [PK_BulkUpdateFieldConfig] PRIMARY KEY CLUSTERED ([Id] ASC), 
	CONSTRAINT [FK_BulkUpdateFieldConfig_BulkUpdateMaster] FOREIGN KEY ([BulkUpdateMasterId]) REFERENCES [PTIS].[BulkUpdateMaster] ([Id]) 
);
GO

CREATE NONCLUSTERED INDEX [IX_BulkUpdateFieldConfig_BulkUpdateMasterId] ON [PTIS].[BulkUpdateFieldConfig] ([BulkUpdateMasterId]);
GO

-- ============================================================
-- BulkUpdateHistory (Immutable audit log; one row per property per bulk update.)
-- ============================================================
CREATE TABLE [PTIS].[BulkUpdateHistory](
	[Id]					INT				IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ActivityID]			INT				NOT NULL,
	[PropertyId]			INT				NOT NULL,
	[BulkUpdateMasterId]	INT				NOT NULL,
	[OldValue]				NVARCHAR(4000)  NULL,
	[NewValue]				NVARCHAR(4000)  NULL,
	[UpdatedColumns]		VARCHAR(500)    NULL,
	[IsActive]				BIT				NOT NULL CONSTRAINT [DF_BulkUpdateHistory_IsActive] DEFAULT (1),
	[CreatedBy]				INT				NULL,
	[CreatedDate]			DATETIME		NOT NULL CONSTRAINT [DF_BulkUpdateHistory_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy]				INT				NULL,
	[UpdatedDate]			DATETIME		NULL,
	CONSTRAINT [PK_BulkUpdateHistory] PRIMARY KEY CLUSTERED([Id] ASC),
	CONSTRAINT [FK_BulkUpdateHistory_BulkUpdateMaster]  FOREIGN KEY ([BulkUpdateMasterId]) REFERENCES [PTIS].[BulkUpdateMaster]([Id]),
	CONSTRAINT [FK_BulkUpdateHistory_PropertyMast]    FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]),
	CONSTRAINT [FK_BulkUpdateHistory_BulkUpdateActivity] FOREIGN KEY ([ActivityID]) REFERENCES [PTIS].[BulkUpdateActivity]([Id])
 );
 GO

CREATE NONCLUSTERED INDEX [IX_BulkUpdateHistory_BulkUpdateMasterId]
ON [PTIS].[BulkUpdateHistory] ([BulkUpdateMasterId] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_BulkUpdateHistory_PropertyId]
ON [PTIS].[BulkUpdateHistory] ([PropertyId] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_BulkUpdateHistory_ActivityID]
ON [PTIS].[BulkUpdateHistory] ([ActivityID] ASC);
GO

-- ============================================================
-- PropertyScreenLock ( One row per (PropertyId, LockableScreenId), where
-- LockableScreenId references [CORE].[ScreenMaster]. IsLocked
-- flips on toggle so the same row carries the most-recent lock/unlock audit
-- trail; the row is never deleted. )
-- ============================================================
CREATE TABLE [PTIS].[PropertyScreenLock](
    [Id]                    INT      IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId]            INT      NOT NULL,
    [LockableScreenId]      INT      NOT NULL,
    [IsLocked]              BIT      NOT NULL CONSTRAINT [DF_PropertyScreenLock_IsLocked]            DEFAULT (0),
    [LockedBy]              INT      NULL,
    [LockedDate]            DATETIME NULL,
    [UnlockedBy]            INT      NULL,
    [UnlockedDate]          DATETIME NULL,
    [MarkedForDeletion]     BIT      NOT NULL CONSTRAINT [DF_PropertyScreenLock_MarkedForDeletion]   DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive]              BIT      NOT NULL CONSTRAINT [DF_PropertyScreenLock_IsActive]            DEFAULT (1),
    [CreatedBy]             INT      NULL,
    [CreatedDate]           DATETIME NOT NULL CONSTRAINT [DF_PropertyScreenLock_CreatedDate]         DEFAULT (GETDATE()),
    [UpdatedBy]             INT      NULL,
    [UpdatedDate]           DATETIME NULL,
    CONSTRAINT [PK_PropertyScreenLock]                 PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_PropertyScreenLock_Property_Screen] UNIQUE ([PropertyId], [LockableScreenId])
);
GO

-- Supporting index for the LockableScreenId FK. The PropertyId FK is already
-- supported by the leading column of UQ_PropertyScreenLock_Property_Screen.
CREATE NONCLUSTERED INDEX [IX_PropertyScreenLock_LockableScreenId]
    ON [PTIS].[PropertyScreenLock] ([LockableScreenId] ASC);
GO

ALTER TABLE [PTIS].[PropertyScreenLock] WITH CHECK
    ADD CONSTRAINT [FK_PropertyScreenLock_PropertyMast]
    FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]);
GO
ALTER TABLE [PTIS].[PropertyScreenLock]
    CHECK CONSTRAINT [FK_PropertyScreenLock_PropertyMast];
GO

ALTER TABLE [PTIS].[PropertyScreenLock] WITH CHECK
    ADD CONSTRAINT [FK_PropertyScreenLock_ScreenMaster]
    FOREIGN KEY ([LockableScreenId]) REFERENCES [CORE].[ScreenMaster]([Id]);
GO
ALTER TABLE [PTIS].[PropertyScreenLock]
    CHECK CONSTRAINT [FK_PropertyScreenLock_ScreenMaster];

ALTER TABLE [PTIS].[PropertyScreenLock] WITH CHECK
 ADD CONSTRAINT [CK_PropertyScreenLock_Audit]
 CHECK (
     ([IsLocked] = 1 AND [LockedBy] IS NOT NULL AND [LockedDate] IS NOT NULL)
  OR ([IsLocked] = 0 AND [UnlockedBy] IS NOT NULL AND [UnlockedDate] IS NOT NULL)
 );
GO


-------------- water connection----------------

CREATE TABLE [PTIS].[WaterConnectionTypeMaster]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
   	[ConnectionTypeCode] nvarchar(20) NOT NULL,
    [ConnectionTypeName] nvarchar(100) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_WaterConnectionTypeMaster_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_WaterConnectionTypeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT PK_WaterConnectionTypeMaster PRIMARY KEY ([Id]),
    CONSTRAINT UQ_WaterConnectionTypeMaster_Code UNIQUE ([ConnectionTypeCode])
);


CREATE TABLE [PTIS].[WaterConnectionSizeMaster]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ConnectionSize] [decimal](5,2) NOT NULL,
    [ConnectionSizeUnit] [nvarchar](10) NOT NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_WaterConnectionSizeMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_WaterConnectionSizeMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,

    CONSTRAINT PK_WaterConnectionSizeMaster PRIMARY KEY ([Id]),
    CONSTRAINT UQ_WaterConnectionSizeMaster_SizeUnit UNIQUE ([ConnectionSize], [ConnectionSizeUnit])
);

CREATE TABLE [PTIS].[WaterConnectionStatusMaster]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [StatusName] nvarchar(50) NOT NULL,  --Running,Stopped,Disconnected
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_WaterConnectionStatusMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_WaterConnectionStatusMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,

    CONSTRAINT PK_WaterConnectionStatusMaster PRIMARY KEY ([Id]),
    CONSTRAINT UQ_WaterConnectionStatusMaster_Condition UNIQUE ([StatusName])
);

CREATE TABLE [PTIS].[WaterRateMaster]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [WaterConnectionTypeId] int NOT NULL,
    [WaterConnectionSizeId] int NOT NULL,
    [FinanceYearId] int NOT NULL,
    [YearlyRate] [decimal](18,2) NULL,
    [MonthlyRate] [decimal](18,2) NULL,
    [QuarterlyRate] [decimal](18,2) NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_WaterRateMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_WaterRateMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT PK_WaterRateMaster PRIMARY KEY ([Id]),
    CONSTRAINT FK_WaterRateMaster_WaterConnectionType  FOREIGN KEY ([WaterConnectionTypeId]) REFERENCES PTIS.WaterConnectionTypeMaster([Id]),
    CONSTRAINT FK_WaterRateMaster_WaterConnectionSize      FOREIGN KEY ([WaterConnectionSizeId]) REFERENCES PTIS.WaterConnectionSizeMaster([Id]),
    CONSTRAINT CK_WaterRateMaster_YearlyRate  CHECK ([YearlyRate] >= 0),
	CONSTRAINT FK_WaterRateMaster_YearMaster FOREIGN KEY (FinanceYearId) REFERENCES CORE.YearMaster([Id])
);
CREATE UNIQUE INDEX UX_WaterRateMaster_ActiveRate
ON PTIS.WaterRateMaster
(
    [WaterConnectionTypeId],
    [WaterConnectionSizeId],
    [FinanceYearId]
)
WHERE [IsActive] = 1;



CREATE TABLE [PTIS].[WaterConnectionMaster]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] int NOT NULL,
    [WaterConnectionTypeId] int NOT NULL,
    [WaterConnectionSizeId] int NOT NULL,
    [WaterConnectionStatusId] int NULL,
    [ConnectionNo] nvarchar(50) NOT NULL,
    [MeterNo] nvarchar(50) NULL,
    [ConnectionStartDate] date NOT NULL,
    [ConnectionStopDate] date NULL,
    [IsActive] bit NOT NULL        CONSTRAINT DF_WaterConnectionMaster_IsActive DEFAULT (1),
    [CreatedBy] int NULL,
    [CreatedDate] datetime NOT NULL        CONSTRAINT DF_WaterConnectionMaster_CreatedDate DEFAULT (GETDATE()),
    [UpdatedBy] int NULL,
    [UpdatedDate] datetime NULL,
    CONSTRAINT PK_WaterConnectionMaster PRIMARY KEY ([Id]),
	CONSTRAINT FK_WaterConnectionMaster_PropertyMast FOREIGN KEY ([PropertyId]) REFERENCES PTIS.PropertyMast([Id]),
    CONSTRAINT FK_WaterConnectionMaster_WaterConnectionType     FOREIGN KEY ([WaterConnectionTypeId])
        REFERENCES PTIS.WaterConnectionTypeMaster([Id]),
    CONSTRAINT FK_WaterConnectionMaster_WaterConnectionSize     FOREIGN KEY ([WaterConnectionSizeId])
        REFERENCES PTIS.WaterConnectionSizeMaster([Id]),
    CONSTRAINT FK_WaterConnectionMaster_WaterConnectionStatus     FOREIGN KEY ([WaterConnectionStatusId])
        REFERENCES PTIS.WaterConnectionStatusMaster([Id]),
    CONSTRAINT CK_WaterConnectionMaster_Date
        CHECK (
            ConnectionStopDate IS NULL
            OR ConnectionStopDate >= ConnectionStartDate
        )
);

CREATE UNIQUE INDEX UX_WaterConnectionMaster_ConnectionNo
ON PTIS.WaterConnectionMaster(ConnectionNo)
WHERE IsActive = 1;




CREATE TABLE [PTIS].[WaterConnectionDetails]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [WaterConnectionId] int NOT NULL,
    [FinanceYearId] int NOT NULL,
    [BillDate] date NOT NULL,
    [FromDate] date NOT NULL,
    [ToDate] date NOT NULL,
    [ChargeMonths] int NOT NULL,
    [YearlyRate] decimal(18,2) NOT NULL,
    [WaterBill] decimal(18,2) NOT NULL,
    [IsActive] bit NOT NULL        CONSTRAINT DF_WaterConnectionDetails_IsActive DEFAULT (1),
    [CreatedBy] int NULL,
    [CreatedDate] datetime NOT NULL        CONSTRAINT DF_WaterConnectionDetails_CreatedDate DEFAULT (GETDATE()),
    [UpdatedBy] int NULL,
    [UpdatedDate] datetime NULL,
	CONSTRAINT PK_WaterConnectionDetails      PRIMARY KEY ([Id]),
	CONSTRAINT FK_WaterConnectionDetails_Connection  FOREIGN KEY ([WaterConnectionId]) 
        REFERENCES PTIS.WaterConnectionMaster([Id]),

	CONSTRAINT CK_WaterConnectionDetails_ChargeMonths   CHECK ([ChargeMonths] BETWEEN 1 AND 12),
	CONSTRAINT CK_WaterConnectionDetails_Date    CHECK ([ToDate] >= [FromDate]),
	CONSTRAINT CK_WaterConnectionDetails_WaterBill    CHECK ([WaterBill] >= 0),
	CONSTRAINT FK_WaterConnectionDetails_YearMaster FOREIGN KEY (FinanceYearId) REFERENCES CORE.YearMaster([Id])

);
CREATE UNIQUE INDEX UX_WaterConnectionDetails_Connection_Year
ON PTIS.WaterConnectionDetails
(
    WaterConnectionId,
    FinanceYearId
);

/****** Object:  Table [PTIS].[CombinePropertyHistory] ******/
  
CREATE TABLE [PTIS].[CombinePropertyHistory] (
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [SourcePropertyId] INT NOT NULL,
    [CombinedPropertyId] INT NOT NULL,
    [CombineReason] NVARCHAR(500) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_CombinePropertyHistory_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_CombinePropertyHistory_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_CombinePropertyHistory]  PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_CombinePropertyHistory_SourceProperty] FOREIGN KEY ([SourcePropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]),
    CONSTRAINT [FK_CombinePropertyHistory_CombinedProperty] FOREIGN KEY ([CombinedPropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]),
    CONSTRAINT [CK_CombinePropertyHistory_DifferentProperties] CHECK ([SourcePropertyId] <> [CombinedPropertyId])
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_CombinePropertyHistory_SourcePropertyId]
ON [PTIS].[CombinePropertyHistory] ([SourcePropertyId] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_CombinePropertyHistory_CombinedPropertyId]
ON [PTIS].[CombinePropertyHistory] ([CombinedPropertyId] ASC);
GO

/****** Object:  Table [PTIS].[PropertyPhotoType] ******/

CREATE TABLE [PTIS].[PropertyPhotoType](
	[Id]            INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,   -- Surrogate PK | e.g. 1
	[PhotoTypeCode] VARCHAR(50)        NOT NULL,                      -- Machine code, stable | e.g. 'FRONT'
	[PhotoTypeName] NVARCHAR(200)      NOT NULL,                      -- UI label | e.g. 'Front View'
	[Description]   NVARCHAR(500)      NULL,                          -- Tooltip / help text | e.g. 'Front facade of the property'
	[DisplayOrder]  INT                NULL,                          -- UI dropdown sort | e.g. 1
	[PhotoScope] VARCHAR(30) NULL,
	[IsActive]      BIT                NOT NULL                       -- Soft hide flag | e.g. 1
		CONSTRAINT [DF_PropertyPhotoType_IsActive] DEFAULT (1),
	[CreatedBy]     INT                NULL,                          -- Audit user | e.g. 42
	[CreatedDate]   DATETIME           NOT NULL                       -- Insert ts | e.g. 2026-05-28
		CONSTRAINT [DF_PropertyPhotoType_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy]     INT                NULL,                          -- Audit user | e.g. NULL
	[UpdatedDate]   DATETIME           NULL,                          -- Update ts | e.g. NULL
	CONSTRAINT [PK_PropertyPhotoType]  PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_PropertyPhotoType_Code] UNIQUE ([PhotoTypeCode])
);
GO

CREATE NONCLUSTERED INDEX [IX_PropertyPhotoType_IsActive]
	ON [PTIS].[PropertyPhotoType]([IsActive]) WHERE [IsActive] = 1;
GO

/****** Object:  Table [PTIS].[PropertyPhoto] ******/

CREATE TABLE [PTIS].[PropertyPhoto](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,  -- Surrogate PK | e.g. 5001
    [EntityType]            CHAR(1)           NOT NULL,                      -- S = Society, W = Wing, P = Property | e.g. 'P'
    [SocietyDetailId]       INT               NULL,                          -- FK → PTIS.SocietyDetailsMast.Id, set when EntityType = 'S'
    [WingDetailId]          INT               NULL,                          -- FK → PTIS.WingDetailsMast.Id, set when EntityType = 'W'
    [PropertyId]            INT               NULL,                          -- FK → PTIS.PropertyMast.Id, set when EntityType = 'P' | e.g. 101
    [Type]                  NVARCHAR(50)      NULL,                          -- Mirrors PTIS.PropertyMast.Type; set only on the shared PROPERTY_PLAN row for a non-Amenity apartment unit (PropertyId NULL there) so every unit of that Type in the society resolves the same plan | e.g. '2BHK'
    [PhotoTypeId]           INT               NOT NULL,                      -- FK → PropertyPhotoType.Id | e.g. 1 (FRONT)
    [DocumentBindingId]     INT               NULL,                          -- FK → CORE.DocumentBinding.Id | e.g. 7701
    [IsLatest]              BIT               NOT NULL                       -- 1=current, 0=superseded | e.g. 1
        CONSTRAINT [DF_PropertyPhoto_IsLatest] DEFAULT (1),
    [DisplayOrder]          INT               NULL,                          -- Gallery sort within (PropertyId, PhotoTypeId) | e.g. 2
    [Remarks]               NVARCHAR(500)     NULL,                          -- Surveyor notes | e.g. 'Captured at noon'
    [MarkedForDeletion]     BIT               NOT NULL                       -- Two-phase delete flag | e.g. 0
        CONSTRAINT [DF_PropertyPhoto_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME          NULL,                          -- Flagged-for-delete ts | e.g. NULL
    [IsActive]              BIT               NOT NULL                       -- Soft delete | e.g. 1
        CONSTRAINT [DF_PropertyPhoto_IsActive] DEFAULT (1),
    [CreatedBy]             INT               NULL,                          -- Audit user | e.g. 42
    [CreatedDate]           DATETIME          NOT NULL                       -- Insert ts | e.g. 2026-05-28
        CONSTRAINT [DF_PropertyPhoto_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT               NULL,                          -- Audit user | e.g. NULL
    [UpdatedDate]           DATETIME          NULL,                          -- Update ts | e.g. NULL
    CONSTRAINT [PK_PropertyPhoto] PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [CK_PropertyPhoto_EntityType]
        CHECK ([EntityType] IN ('S', 'W', 'P')),

    -- EntityType marks the photo/certificate apply level; SocietyDetailId/WingDetailId
    -- may still be populated on 'W'/'P' rows to carry the parent hierarchy for
    -- filtering/reporting (e.g. an apartment flat photo keeps SocietyDetailId + WingDetailId
    -- alongside its required PropertyId).
    CONSTRAINT [CK_PropertyPhoto_EntityScope]
        CHECK (
            ([EntityType] = 'S' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NULL AND [PropertyId] IS NULL) OR
            ([EntityType] = 'W' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NOT NULL AND [PropertyId] IS NULL) OR
            ([EntityType] = 'P' AND [PropertyId] IS NOT NULL)
        )
);
GO

ALTER TABLE [PTIS].[PropertyPhoto] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhoto_SocietyDetailsMast] FOREIGN KEY ([SocietyDetailId])  REFERENCES [PTIS].[SocietyDetailsMast]([Id]);
ALTER TABLE [PTIS].[PropertyPhoto] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhoto_WingDetailsMast]    FOREIGN KEY ([WingDetailId])     REFERENCES [PTIS].[WingDetailsMast]([Id]);
ALTER TABLE [PTIS].[PropertyPhoto] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhoto_PropertyMast]    FOREIGN KEY ([PropertyId])        REFERENCES [PTIS].[PropertyMast]([Id]);
ALTER TABLE [PTIS].[PropertyPhoto] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhoto_PhotoType]       FOREIGN KEY ([PhotoTypeId])       REFERENCES [PTIS].[PropertyPhotoType]([Id]);
ALTER TABLE [PTIS].[PropertyPhoto] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhoto_DocumentBinding] FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]);
GO

-- Non-unique: multiple photos of the same type are allowed per entity (e.g. several
-- society board photos), ordered/superseded via DisplayOrder / IsLatest.
CREATE NONCLUSTERED INDEX [IX_PropertyPhoto_Entity_Type]
	ON [PTIS].[PropertyPhoto]([EntityType], [SocietyDetailId], [WingDetailId], [PropertyId], [PhotoTypeId], [IsLatest])
	INCLUDE ([DocumentBindingId], [DisplayOrder], [Remarks])
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

-- Shared plan lookup: one PROPERTY_PLAN row per (SocietyDetailId, PhotoTypeId, Type) is
-- resolved by every apartment unit of that Type in that society.
CREATE NONCLUSTERED INDEX [IX_PropertyPhoto_Society_Type_Plan]
	ON [PTIS].[PropertyPhoto]([SocietyDetailId], [PhotoTypeId], [Type])
	WHERE [IsLatest] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0 AND [SocietyDetailId] IS NOT NULL;
GO

ALTER TABLE [PTIS].[SocialAttributeMaster] WITH CHECK ADD CONSTRAINT [FK_SocialAttributeMaster_PhotoType]
FOREIGN KEY([PhotoTypeId]) REFERENCES [PTIS].[PropertyPhotoType]([Id]);
GO



/****** Object:  Table [PTIS].[PropertyTaxJob] ******/

CREATE TABLE [PTIS].[PropertyTaxJob]
(
    [Id] [bigint] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [JobCode] [varchar](30) NOT NULL,
    [Operation] [varchar](30) NOT NULL,
    [FinanceYearId] [int] NOT NULL,
    [ScopeType] [varchar](20) NOT NULL,
    [ScopeParamsJson] [nvarchar](max) NULL,
    [ScopeDescription] [nvarchar](500) NULL,
    [StartedByUserId] [int] NOT NULL,
    [StartedByUserName] [nvarchar](200) NULL,
    [UserRole] [nvarchar](100) NULL,
    [StartTime] [datetime] NOT NULL,
    [CompleteTime] [datetime] NULL,
    [DurationMs] [bigint] NULL,
    [RecordsSelected] [int] NOT NULL CONSTRAINT [DF_PropertyTaxJob_RecordsSelected] DEFAULT (0),
    [RecordsProcessed] [int] NOT NULL CONSTRAINT [DF_PropertyTaxJob_RecordsProcessed] DEFAULT (0),
    [SuccessCount] [int] NOT NULL CONSTRAINT [DF_PropertyTaxJob_SuccessCount] DEFAULT (0),
    [SkippedCount] [int] NOT NULL CONSTRAINT [DF_PropertyTaxJob_SkippedCount] DEFAULT (0),
    [FailedCount] [int] NOT NULL CONSTRAINT [DF_PropertyTaxJob_FailedCount] DEFAULT (0),
    [Status] [varchar](20) NOT NULL,
    [ErrorMessage] [nvarchar](2000) NULL,
    [Remarks] [nvarchar](1000) NULL,
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxJob_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxJob_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyTaxJob_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,

    CONSTRAINT [PK_PropertyTaxJob] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PropertyTaxJob_YearMaster] FOREIGN KEY ([FinanceYearId]) REFERENCES [CORE].[YearMaster]([Id]),
    CONSTRAINT [CK_PropertyTaxJob_Operation] CHECK
    (
        [Operation] IN ('AddTax', 'QuarterlyAdd')
    ),
    CONSTRAINT [CK_PropertyTaxJob_Status] CHECK
    (
        [Status] IN ('Scheduled', 'Pending', 'InProgress', 'Completed', 'Failed')
    )
) ON [PRIMARY] 
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertyTaxJob_JobCode_Active]
ON [PTIS].[PropertyTaxJob]([JobCode] ASC)
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO



/****** Object:  Table [PTIS].[PropertyTaxJobDetail] ******/

CREATE TABLE [PTIS].[PropertyTaxJobDetail]
(
    [Id] [bigint] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [JobId] [bigint] NOT NULL,
    [PropertyId] [int] NOT NULL,
    [PropertyNo] [nvarchar](10) NULL,
    [TaxHead] [nvarchar](500) NULL,
    [Amount] DECIMAL(19,4) NULL,
    [ExecutionStartTime] [datetime] NULL,
    [ExecutionEndTime] [datetime] NULL,
    [Status] [varchar](20) NOT NULL,
    [SkipReason] [varchar](50) NULL,
    [Message] [nvarchar](2000) NULL,
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxJobDetail_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxJobDetail_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyTaxJobDetail_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,

    CONSTRAINT [PK_PropertyTaxJobDetail] PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [FK_PropertyTaxJobDetail_PropertyMast] FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),

    CONSTRAINT [FK_PropertyTaxJobDetail_PropertyTaxJob] FOREIGN KEY ([JobId]) REFERENCES [PTIS].[PropertyTaxJob] ([Id]),

    CONSTRAINT [CK_PropertyTaxJobDetail_SkipReason]
    CHECK
    (
        [SkipReason] IS NULL
        OR [SkipReason] IN
        (
            'ApprovalRequired','PermissionRestricted','InvalidScope','PendingVerification','PropertyLocked','AlreadyProcessed'
        )
    ),

    CONSTRAINT [CK_PropertyTaxJobDetail_Status]
    CHECK
    (
        [Status] IN
        (
		 'Pending','Processing','Added','Failed','Completed','Paused','Skipped'
        )
    )
) ON [PRIMARY]
GO


/****** Object:  Table [PTIS].[RuleEffectTypeMaster] ******/
CREATE TABLE [PTIS].[RuleEffectTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[EffectType] [varchar](100) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RuleEffectTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RuleEffectTypeMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RuleEffectTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RuleEffectTypeMaster_EffectType] UNIQUE NONCLUSTERED ([EffectType] ASC)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[EffectTypeConfiguration] ******/
CREATE TABLE [PTIS].[EffectTypeConfiguration](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[EffectTypeId] [int] NOT NULL,
	[DataType] [nvarchar](50) NOT NULL,
	[InputType] [nvarchar](50) NOT NULL,
	[HasApiSource] [bit] NOT NULL CONSTRAINT [DF_EffectTypeConfiguration_HasApiSource] DEFAULT (0),
	[ApiEndpoint] [nvarchar](500) NULL,
	[ApiMethod] [nvarchar](10) NULL,
	[ApiParameters] [nvarchar](max) NULL,
	[HasStaticValues] [bit] NOT NULL CONSTRAINT [DF_EffectTypeConfiguration_HasStaticValues] DEFAULT (0),
	[StaticValuesJson] [nvarchar](max) NULL,
	[IsRequired] [bit] NOT NULL CONSTRAINT [DF_EffectTypeConfiguration_IsRequired] DEFAULT (0),
	[DefaultValue] [nvarchar](255) NULL,
	[ValidationRegex] [nvarchar](500) NULL,
	[MinValue] [decimal](18, 4) NULL,
	[MaxValue] [decimal](18, 4) NULL,
	[MinLength] [int] NULL,
	[MaxLength] [int] NULL,
	[ExpressionTemplate] [nvarchar](500) NULL,
	[StaticApiEndpoint] [nvarchar](500) NULL,
	[StaticApiInputType] [nvarchar](500) NULL,
	[StaticApiMethod] [nvarchar](500) NULL,
	[StaticApiParamter] [nvarchar](500) NULL,
	[StaticApiResponseMapping] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_EffectTypeConfiguration_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_EffectTypeConfiguration_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	
	CONSTRAINT [PK_EffectTypeConfiguration] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_EffectTypeConfiguration_EffectTypeId] UNIQUE NONCLUSTERED ([EffectTypeId] ASC),
	CONSTRAINT [FK_EffectTypeConfiguration_RuleEffectTypeMaster] FOREIGN KEY([EffectTypeId]) REFERENCES [PTIS].[RuleEffectTypeMaster] ([Id])
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[RulesFieldMaster] ******/
CREATE TABLE [PTIS].[RulesFieldMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FieldName] [varchar](100) NOT NULL,
	[FieldType] [nvarchar](50) NOT NULL,
	[DatabaseColumnName] [nvarchar](100) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RulesFieldMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RulesFieldMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RulesFieldMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RulesFieldMaster_FieldName] UNIQUE NONCLUSTERED ([FieldName] ASC)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[FieldConfiguration] ******/
CREATE TABLE [PTIS].[FieldConfiguration](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RulesFieldId] [int] NOT NULL,
	[DataType] [nvarchar](50) NOT NULL,
	[InputType] [nvarchar](50) NOT NULL,
	[HasApiSource] [bit] NOT NULL CONSTRAINT [DF_FieldConfiguration_HasApiSource] DEFAULT (0),
	[ApiEndpoint] [nvarchar](500) NULL,
	[ApiMethod] [nvarchar](10) NULL,
	[ApiParameters] [nvarchar](max) NULL,
	[HasStaticValues] [bit] NOT NULL CONSTRAINT [DF_FieldConfiguration_HasStaticValues] DEFAULT (0),
	[StaticValuesJson] [nvarchar](max) NULL,
	[IsRequired] [bit] NOT NULL CONSTRAINT [DF_FieldConfiguration_IsRequired] DEFAULT (0),
	[DefaultValue] [nvarchar](255) NULL,
	[ValidationRegex] [nvarchar](500) NULL,
	[MinValue] [decimal](18, 4) NULL,
	[MaxValue] [decimal](18, 4) NULL,
	[MinLength] [int] NULL,
	[MaxLength] [int] NULL,
	[ApiResponseMapping] [nvarchar](max) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_FieldConfiguration_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_FieldConfiguration_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_FieldConfiguration] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_FieldConfiguration_FieldId] UNIQUE NONCLUSTERED ([RulesFieldId] ASC),
	CONSTRAINT [FK_FieldConfiguration_RulesFieldMaster] FOREIGN KEY([RulesFieldId]) REFERENCES [PTIS].[RulesFieldMaster] ([Id])
) ON [PRIMARY] 
GO

/****** Object:  Table [PTIS].[PropertyRuleApplicationLog] ******/
CREATE TABLE [PTIS].[PropertyRuleApplicationLog](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[PropertyId] [int] NOT NULL,
	[PropertyDetailsId] [int] NOT NULL,
	[FinanceYear] [int] NOT NULL,
	[RuleCategory] [nvarchar](50) NOT NULL,
	[RuleCode] [nvarchar](100) NOT NULL,
	[RuleName] [nvarchar](500) NOT NULL,
	[EffectType] [nvarchar](100) NOT NULL,
	[EffectValue] [decimal](18, 4) NOT NULL,
	[BaseValue] [decimal](18, 4) NOT NULL,
	[ComputedValue] [decimal](18, 4) NOT NULL,
	[CumulativeValue] [decimal](18, 4) NOT NULL,
	[ApplyOrder] [int] NOT NULL,
	[StopProcessing] [bit] NOT NULL,
	[AppliedAt] [datetime] NOT NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_PropertyRuleApplicationLog_CreatedDate DEFAULT (GETDATE()),
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[UpdatedBy] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyRuleApplicationLog_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyRuleApplicationLog_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[ApplyRate] [decimal](18, 4) NOT NULL CONSTRAINT [DF_PropertyRuleApplicationLog_ApplyRate] DEFAULT (0),
	[RuleScopeId] [int] NULL,
	[RuleScopeName] [nvarchar](200) NULL,
	[Name] [nvarchar](200) NULL,
	CONSTRAINT [PK_PropertyRuleApplicationLog] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[RuleCategoryMaster] ******/
CREATE TABLE [PTIS].[RuleCategoryMaster](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[CategoryCode] [nvarchar](50) NOT NULL,
	[CategoryName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[SortOrder] [int] NOT NULL CONSTRAINT [DF_RuleCategoryMaster_SortOrder] DEFAULT (0),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RuleCategoryMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RuleCategoryMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RuleCategoryMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RuleCategoryMaster_CategoryCode] UNIQUE NONCLUSTERED ([CategoryCode] ASC)
) ON [PRIMARY]
GO



/****** Object:  Table [PTIS].[PropertyRuleEvaluationMaster] ******/
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [PTIS].[PropertyRuleEvaluationMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ParameterCode] [varchar](100) NOT NULL,
	[ParameterName] [varchar](200) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyRuleEvaluationMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyRuleEvaluationMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_PropertyRuleEvaluationMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[RuleEngineMaster] ******/
CREATE TABLE [PTIS].[RuleEngineMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleCode] [nvarchar](50) NOT NULL,
	[RuleName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](1000) NULL,
	[RuleCategory] [nvarchar](100) NULL,
	[RuleJson] [nvarchar](max) NOT NULL,
	[Priority] [int] NOT NULL,
	[IsEnabled] [bit] NOT NULL CONSTRAINT [DF_RuleEngineMaster_IsEnabled] DEFAULT (1),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RuleEngineMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RuleEngineMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[ConditionsJson] [nvarchar](max) NULL,
	[EffectJson] [nvarchar](max) NULL,
	[TargetFiltersJson] [nvarchar](max) NULL,
	[StopProcessing] [bit] NOT NULL CONSTRAINT [DF_RuleEngineMaster_StopProcessing] DEFAULT (0),
	[RuleScopeId] [int] NULL,
	[PropertyRuleEvaluationMasterId] [int] NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RuleEngineMaster_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	CONSTRAINT [PK_RuleEngineMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY] 
GO

/****** Object:  Table [PTIS].[RuleOperatorMaster] ******/
CREATE TABLE [PTIS].[RuleOperatorMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[Operator] [varchar](100) NOT NULL,
	[OperatorDescription] [varchar](100) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RuleOperatorMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RuleOperatorMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RuleOperatorMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RuleOperatorMaster_Operator] UNIQUE NONCLUSTERED ([Operator] ASC)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[RuleScopeFieldMapping] ******/
CREATE TABLE [PTIS].[RuleScopeFieldMapping](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleScopeId] [int] NOT NULL,
	[RulesFieldId] [int] NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RuleScopeFieldMapping_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RuleScopeFieldMapping_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RuleScopeFieldMapping] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UK_RuleScopeFieldMapping] UNIQUE NONCLUSTERED ([RuleScopeId] ASC, [RulesFieldId] ASC)
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[RuleScopeMaster] ******/
CREATE TABLE [PTIS].[RuleScopeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleScope] [varchar](100) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RuleScopeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_RuleScopeMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RuleScopeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RuleScopeMaster_RuleScope] UNIQUE NONCLUSTERED ([RuleScope] ASC)
) ON [PRIMARY]
GO



/****** Object:  Table [PTIS].[RuleVersionHistory] ******/
CREATE TABLE [PTIS].[RuleVersionHistory](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[RuleId] [int] NOT NULL,
	[RuleCode] [nvarchar](50) NOT NULL,
	[Version] [int] NOT NULL,
	[RuleName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](1000) NULL,
	[RuleJson] [nvarchar](max) NOT NULL,
	[Priority] [int] NOT NULL,
	[IsEnabled] [bit] NOT NULL,
	[ChangeType] [nvarchar](50) NOT NULL,
	[ChangeReason] [nvarchar](500) NULL,
	[ChangedBy] [int] NOT NULL,
	[ChangedDate] [datetime] NOT NULL CONSTRAINT DF_RuleVersionHistory_ChangedDate DEFAULT (GETDATE()),
	[ChangeSummary] [nvarchar](max) NULL,
	CONSTRAINT [PK_RuleVersionHistory] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RuleVersionHistory] WITH CHECK ADD CONSTRAINT [FK_RuleVersionHistory_RuleEngineMaster] FOREIGN KEY([RuleId]) REFERENCES [PTIS].[RuleEngineMaster] ([Id])
GO
ALTER TABLE [PTIS].[RuleVersionHistory] CHECK CONSTRAINT [FK_RuleVersionHistory_RuleEngineMaster]
GO

ALTER TABLE [PTIS].[PropertyRuleApplicationLog] WITH CHECK ADD CONSTRAINT [FK_PropertyRuleApplicationLog_PropertyDetails] FOREIGN KEY([PropertyDetailsId]) REFERENCES [PTIS].[PropertyDetails] ([Id])
GO
ALTER TABLE [PTIS].[PropertyRuleApplicationLog] CHECK CONSTRAINT [FK_PropertyRuleApplicationLog_PropertyDetails]
GO

ALTER TABLE [PTIS].[PropertyRuleApplicationLog] WITH CHECK ADD CONSTRAINT [FK_PropertyRuleApplicationLog_PropertyMast] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id])
GO
ALTER TABLE [PTIS].[PropertyRuleApplicationLog] CHECK CONSTRAINT [FK_PropertyRuleApplicationLog_PropertyMast]
GO

ALTER TABLE [PTIS].[RuleEngineMaster] WITH CHECK ADD CONSTRAINT [FK_RuleEngineMaster_RuleScopeMaster] FOREIGN KEY([RuleScopeId]) REFERENCES [PTIS].[RuleScopeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RuleEngineMaster] CHECK CONSTRAINT [FK_RuleEngineMaster_RuleScopeMaster]
GO

ALTER TABLE [PTIS].[RuleEngineMaster] WITH CHECK 
ADD CONSTRAINT [FK_RuleEngineMaster_PropertyRuleEvaluationMaster_PropertyRuleEvaluationMasterId] 
FOREIGN KEY([PropertyRuleEvaluationMasterId])
REFERENCES [PTIS].[PropertyRuleEvaluationMaster] ([Id]);

ALTER TABLE [PTIS].[RuleEngineMaster] CHECK CONSTRAINT [FK_RuleEngineMaster_PropertyRuleEvaluationMaster_PropertyRuleEvaluationMasterId];
GO

ALTER TABLE [PTIS].[RuleScopeFieldMapping] WITH CHECK ADD CONSTRAINT [FK_RuleScopeFieldMapping_RuleScopeMaster] FOREIGN KEY([RuleScopeId]) REFERENCES [PTIS].[RuleScopeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RuleScopeFieldMapping] CHECK CONSTRAINT [FK_RuleScopeFieldMapping_RuleScopeMaster]
GO

ALTER TABLE [PTIS].[RuleScopeFieldMapping] WITH CHECK ADD CONSTRAINT [FK_RuleScopeFieldMapping_RulesFieldMaster] FOREIGN KEY([RulesFieldId]) REFERENCES [PTIS].[RulesFieldMaster] ([Id])
GO
ALTER TABLE [PTIS].[RuleScopeFieldMapping] CHECK CONSTRAINT [FK_RuleScopeFieldMapping_RulesFieldMaster]
GO







-- PTIS.PolicyCodeMaster is defined earlier in this script (before PTIS.PolicyTaxDetails,
-- which references it via inline FK).
--
-- PTIS.CertificateTaxGuideline retired (replaced by PTIS.RetrospectiveRuleMaster and the
-- Retrospective Rule Engine); table removed for fresh installs, dropped via a guarded migration
-- in 02_core_schema.sql for already-deployed databases.

GO
CREATE TABLE [PTIS].[PropertyWorkflowStageMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[StageName] [varchar](100) NOT NULL,
	[Description] [varchar](500) NULL,
	[DisplayOrder] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyWorkflowStageMaster_IsActive] DEFAULT ((1)),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyWorkflowStageMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_PropertyWorkflowStageMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO


CREATE TABLE [PTIS].[PropertyWorkflowDetails](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NOT NULL,
	[WorkflowStageId] [int] NOT NULL,
	[ModuleId] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyWorkflowDetails_IsActive] DEFAULT ((1)),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyWorkflowDetails_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[CurrentStatus] [bit] NULL,
 CONSTRAINT [PK_PropertyWorkflowDetails] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[PropertyWorkflowDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyWorkflowDetails_PropertyWorkflowStageMaster] FOREIGN KEY([WorkflowStageId]) REFERENCES [PTIS].[PropertyWorkflowStageMaster] ([Id])
GO
ALTER TABLE [PTIS].[PropertyWorkflowDetails] WITH CHECK ADD CONSTRAINT [FK_PropertyWorkflowDetails_PropertyMast] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id])
GO


 
CREATE TABLE [PTIS].[TaxZoningRange](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[WardId] [int] NOT NULL,
	[TaxZoneId] [int] NOT NULL,
	[FromPropertyNo] [nvarchar](10) NULL,
	[ToPropertyNo] [nvarchar](10) NULL,
	[AssignEntireWard] [bit] NOT NULL CONSTRAINT [DF_TaxZoningRange_AssignEntireWard] DEFAULT (0),
	[ZoneDescription] [nvarchar](500) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_TaxZoningRange_IsActive] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_TaxZoningRange_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_TaxZoningRange_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_TaxZoningRange] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO
 
ALTER TABLE [PTIS].[TaxZoningRange]  WITH CHECK ADD  CONSTRAINT [FK_TaxZoningRange_TaxZoneMaster] FOREIGN KEY([TaxZoneId])
REFERENCES [PTIS].[TaxZoneMaster] ([Id])
GO
 
ALTER TABLE [PTIS].[TaxZoningRange] CHECK CONSTRAINT [FK_TaxZoningRange_TaxZoneMaster]
GO
 
ALTER TABLE [PTIS].[TaxZoningRange]  WITH CHECK ADD  CONSTRAINT [FK_TaxZoningRange_WardMaster] FOREIGN KEY([WardId])
REFERENCES [PTIS].[WardMaster] ([Id])
GO
 
ALTER TABLE [PTIS].[TaxZoningRange] CHECK CONSTRAINT [FK_TaxZoningRange_WardMaster]
GO

/****** Object:  Table [PTIS].[ULBDocumentType] ******/
CREATE TABLE [PTIS].[ULBDocumentType]
(
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[DocumentTypeCode] [varchar](100) NOT NULL,
	[DocumentTypeName] [varchar](200) NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ULBDocumentType_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_ULBDocumentType_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_ULBDocumentType] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_ULBDocumentType_DocumentTypeCode] UNIQUE ([DocumentTypeCode])
) ON [PRIMARY]
GO

/****** Object:  Table [PTIS].[ULBDocument] ******/
CREATE TABLE [PTIS].[ULBDocument]
(
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ULBDocumentTypeId] [int] NOT NULL,
	[DocumentBindingId] [int] NULL,
	[DocumentTitle] [nvarchar](250) NULL,
	[Remark] [nvarchar](500) NULL,
	[IsLatest] [bit] NOT NULL CONSTRAINT [DF_ULBDocument_IsLatest] DEFAULT (1),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_ULBDocument_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_ULBDocument_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_ULBDocument_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_ULBDocument] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[ULBDocument] WITH CHECK ADD CONSTRAINT [FK_ULBDocument_ULBDocumentType] FOREIGN KEY([ULBDocumentTypeId]) REFERENCES [PTIS].[ULBDocumentType] ([Id])
GO
ALTER TABLE [PTIS].[ULBDocument] CHECK CONSTRAINT [FK_ULBDocument_ULBDocumentType]
GO

ALTER TABLE [PTIS].[ULBDocument] WITH CHECK ADD CONSTRAINT [FK_ULBDocument_DocumentBinding] FOREIGN KEY([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding] ([Id])
GO
ALTER TABLE [PTIS].[ULBDocument] CHECK CONSTRAINT [FK_ULBDocument_DocumentBinding]
GO

-- Indexes to support FK checks and common lookups (SQL Server does not
-- auto-create indexes on FK columns, so parent updates/deletes and
-- lookups by document type would otherwise fall back to full scans).
CREATE NONCLUSTERED INDEX [IX_ULBDocument_ULBDocumentTypeId]
    ON [PTIS].[ULBDocument] ([ULBDocumentTypeId]);
GO
CREATE NONCLUSTERED INDEX [IX_ULBDocument_IsLatest]
    ON [PTIS].[ULBDocument] ([IsLatest])
    WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


/* =====================================================================================
   Retrospective Tax Rule Engine
   12 tables: EvidenceTypeMaster, RetrospectiveRuleMaster, RetrospectiveTaxPolicy,
   RetrospectiveRuleEvidenceCondition, RetrospectiveRuleDateCondition,
   RetrospectiveRuleAction, RetrospectivePenaltyRule, RetrospectiveRuleSummary,
   RetrospectiveTaxCalculation, RetrospectiveCalculationEvidence,
   RetrospectiveTaxCalculationDetail, RetrospectiveRuleAuditLog.
   ===================================================================================== */

/****** Object:  Table [PTIS].[EvidenceTypeMaster] ******/
CREATE TABLE [PTIS].[EvidenceTypeMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[EvidenceCode] [varchar](50) NOT NULL,
	[EvidenceName] [nvarchar](100) NOT NULL,
	[IsCertificate] [bit] NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_EvidenceTypeMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_EvidenceTypeMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_EvidenceTypeMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_EvidenceTypeMaster_EvidenceCode] UNIQUE ([EvidenceCode])
) ON [PRIMARY]
GO


/****** Object:  Table [PTIS].[RetrospectiveRuleMaster] ******/
CREATE TABLE [PTIS].[RetrospectiveRuleMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleCode] [varchar](50) NOT NULL,
	[RuleName] [nvarchar](200) NOT NULL,
	[RuleDescription] [nvarchar](1000) NULL,
	[PriorityNo] [int] NOT NULL,
	[MatchType] [varchar](30) NOT NULL CONSTRAINT [DF_RetrospectiveRuleMaster_MatchType] DEFAULT ('CONDITION_BASED')
		CONSTRAINT [CK_RetrospectiveRuleMaster_MatchType] CHECK ([MatchType] IN ('CONDITION_BASED', 'EXACT_EVIDENCE_MATCH', 'PRIORITY_BASED')),
	[IsFallbackRule] [bit] NOT NULL,
	[RuleStatus] [varchar](30) NOT NULL CONSTRAINT [DF_RetrospectiveRuleMaster_RuleStatus] DEFAULT ('Draft')
		CONSTRAINT [CK_RetrospectiveRuleMaster_RuleStatus] CHECK ([RuleStatus] IN ('Draft', 'Active', 'Review', 'NeedsClarification')),
	[AuthorizationStatus] [varchar](30) NULL
		CONSTRAINT [CK_RetrospectiveRuleMaster_AuthorizationStatus] CHECK ([AuthorizationStatus] IN ('AUTHORIZED', 'UNAUTHORIZED', 'UNDETERMINED')),
	[LegalCapEnabled] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleMaster_LegalCapEnabled] DEFAULT (1),
	[LegalCapYears] [int] NOT NULL CONSTRAINT [DF_RetrospectiveRuleMaster_LegalCapYears] DEFAULT (6),
	[NoticeDays] [int] NOT NULL CONSTRAINT [DF_RetrospectiveRuleMaster_NoticeDays] DEFAULT (15),
	[VersionNo] [varchar](20) NULL,
	[ResolutionRef] [varchar](200) NULL,
	[EffectiveFrom] [datetime] NULL,
	[EffectiveTo] [datetime] NULL,
	[Remarks] [nvarchar](1000) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveRuleMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveRuleMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RetrospectiveRuleMaster_RuleCode] UNIQUE ([RuleCode])
) ON [PRIMARY]
GO


/****** Object:  Table [PTIS].[RetrospectiveTaxPolicy] ******/
CREATE TABLE [PTIS].[RetrospectiveTaxPolicy](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TaxPolicyCode] [varchar](50) NOT NULL,
	[TaxPolicyName] [nvarchar](200) NOT NULL,
	[RateMode] [varchar](50) NOT NULL
		CONSTRAINT [CK_RetrospectiveTaxPolicy_RateMode] CHECK ([RateMode] IN ('HISTORIC_YEAR_WISE', 'CURRENT_YEAR_FOR_ALL_YEARS')),
	[PercentageMode] [varchar](50) NOT NULL
		CONSTRAINT [CK_RetrospectiveTaxPolicy_PercentageMode] CHECK ([PercentageMode] IN ('HISTORIC_YEAR_WISE', 'CURRENT_YEAR_FOR_ALL_YEARS', 'FIXED_PERCENTAGE')),
	[FixedPercentage] [decimal](10,2) NULL,
	[FinancialYearStartMonth] [tinyint] NOT NULL CONSTRAINT [DF_RetrospectiveTaxPolicy_FinancialYearStartMonth] DEFAULT (4),
	[FinancialYearStartDay] [tinyint] NOT NULL CONSTRAINT [DF_RetrospectiveTaxPolicy_FinancialYearStartDay] DEFAULT (1),
	[EffectiveFrom] [datetime] NULL,
	[EffectiveTo] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveTaxPolicy_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveTaxPolicy_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveTaxPolicy] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_RetrospectiveTaxPolicy_TaxPolicyCode] UNIQUE ([TaxPolicyCode])
) ON [PRIMARY]
GO

/* This feature defines 6 filtered unique indexes in total, breaking down as:
     - 1 "one active row overall" index here on RetrospectiveTaxPolicy.
     - 4 "one active row per rule" indexes, one each on RetrospectiveRuleDateCondition,
       RetrospectiveRuleAction, RetrospectivePenaltyRule and RetrospectiveRuleSummary.
     - 1 "one active row per rule + evidence type" index on
       RetrospectiveRuleEvidenceCondition (a rule can have many active evidence
       conditions, one per EvidenceTypeMaster row, so it isn't a plain per-rule index). */
CREATE UNIQUE NONCLUSTERED INDEX [UX_RetrospectiveTaxPolicy_OneActive]
	ON [PTIS].[RetrospectiveTaxPolicy] ([IsActive])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [PTIS].[RetrospectiveRuleEvidenceCondition] ******/
CREATE TABLE [PTIS].[RetrospectiveRuleEvidenceCondition](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleId] [int] NOT NULL,
	[EvidenceTypeId] [int] NOT NULL,
	[EvidenceState] [varchar](20) NOT NULL
		CONSTRAINT [CK_RetrospectiveRuleEvidenceCondition_EvidenceState] CHECK ([EvidenceState] IN ('AVAILABLE', 'UNAVAILABLE')),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleEvidenceCondition_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveRuleEvidenceCondition_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveRuleEvidenceCondition] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveRuleEvidenceCondition] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleEvidenceCondition_RetrospectiveRuleMaster]
	FOREIGN KEY([RuleId]) REFERENCES [PTIS].[RetrospectiveRuleMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleEvidenceCondition] CHECK CONSTRAINT [FK_RetrospectiveRuleEvidenceCondition_RetrospectiveRuleMaster]
GO
ALTER TABLE [PTIS].[RetrospectiveRuleEvidenceCondition] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleEvidenceCondition_EvidenceTypeMaster]
	FOREIGN KEY([EvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleEvidenceCondition] CHECK CONSTRAINT [FK_RetrospectiveRuleEvidenceCondition_EvidenceTypeMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RetrospectiveRuleEvidenceCondition_Rule_EvidenceType]
	ON [PTIS].[RetrospectiveRuleEvidenceCondition] ([RuleId], [EvidenceTypeId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [PTIS].[RetrospectiveRuleDateCondition] ******/
CREATE TABLE [PTIS].[RetrospectiveRuleDateCondition](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleId] [int] NOT NULL,
	[ComparatorCode] [varchar](50) NOT NULL
		CONSTRAINT [CK_RetrospectiveRuleDateCondition_ComparatorCode] CHECK ([ComparatorCode] IN (
			'NONE', 'ELECTRICITY_BEFORE_CC', 'ELECTRICITY_AFTER_CC', 'ELECTRICITY_BEFORE_CUTOFF',
			'ELECTRICITY_AFTER_CUTOFF', 'OC_OLDER_THAN_ALLOWED_PERIOD', 'OC_WITHIN_ALLOWED_PERIOD',
			'EVIDENCE_GAP_WITHIN_PERIOD')),
	[LeftEvidenceTypeId] [int] NULL,
	[RightEvidenceTypeId] [int] NULL,
	[CompareOperator] [varchar](30) NULL
		CONSTRAINT [CK_RetrospectiveRuleDateCondition_CompareOperator] CHECK ([CompareOperator] IN (
			'BEFORE', 'AFTER', 'ON_OR_BEFORE', 'ON_OR_AFTER', 'BETWEEN', 'OLDER_THAN_YEARS', 'WITHIN_YEARS')),
	[CompareDate] [datetime] NULL,
	[CompareDateTo] [datetime] NULL,
	[CompareYears] [int] NULL,
	[CompareGapUnit] [varchar](10) NULL
		CONSTRAINT [CK_RetrospectiveRuleDateCondition_CompareGapUnit] CHECK ([CompareGapUnit] IN ('DAYS', 'MONTHS', 'YEARS')),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleDateCondition_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveRuleDateCondition_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveRuleDateCondition] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveRuleDateCondition] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleDateCondition_RetrospectiveRuleMaster]
	FOREIGN KEY([RuleId]) REFERENCES [PTIS].[RetrospectiveRuleMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleDateCondition] CHECK CONSTRAINT [FK_RetrospectiveRuleDateCondition_RetrospectiveRuleMaster]
GO
ALTER TABLE [PTIS].[RetrospectiveRuleDateCondition] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleDateCondition_EvidenceTypeMaster_Left]
	FOREIGN KEY([LeftEvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleDateCondition] CHECK CONSTRAINT [FK_RetrospectiveRuleDateCondition_EvidenceTypeMaster_Left]
GO
ALTER TABLE [PTIS].[RetrospectiveRuleDateCondition] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleDateCondition_EvidenceTypeMaster_Right]
	FOREIGN KEY([RightEvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleDateCondition] CHECK CONSTRAINT [FK_RetrospectiveRuleDateCondition_EvidenceTypeMaster_Right]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RetrospectiveRuleDateCondition_Rule]
	ON [PTIS].[RetrospectiveRuleDateCondition] ([RuleId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [PTIS].[RetrospectiveRuleAction] ******/
CREATE TABLE [PTIS].[RetrospectiveRuleAction](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleId] [int] NOT NULL,
	[TaxStartMode] [varchar](50) NOT NULL
		CONSTRAINT [CK_RetrospectiveRuleAction_TaxStartMode] CHECK ([TaxStartMode] IN (
			'EVIDENCE_DATE', 'FY_START', 'NEXT_FINANCIAL_YEAR', 'MONTHS_AFTER', 'FIXED_CUTOFF',
			'MAX_LOOK_BACK_DATE', 'CONSTRUCTION_YEAR', 'CONSTRUCTION_OR_CAP')),
	[StartEvidenceTypeId] [int] NULL,
	[OffsetMonths] [int] NULL,
	[RetrospectiveLimitType] [varchar](50) NOT NULL
		CONSTRAINT [CK_RetrospectiveRuleAction_RetrospectiveLimitType] CHECK ([RetrospectiveLimitType] IN ('MAXIMUM_YEARS', 'FIXED_CUTOFF_DATE', 'NONE')),
	[MaximumYears] [int] NULL,
	[CutoffDate] [datetime] NULL,
	[TaxCalculationMode] [varchar](30) NOT NULL CONSTRAINT [DF_RetrospectiveRuleAction_TaxCalculationMode] DEFAULT ('SINGLE')
		CONSTRAINT [CK_RetrospectiveRuleAction_TaxCalculationMode] CHECK ([TaxCalculationMode] IN ('SINGLE', 'SPLIT', 'CC_THEN_OC_MERGE')),
	[TaxMultiplier] [decimal](10,2) NOT NULL CONSTRAINT [DF_RetrospectiveRuleAction_TaxMultiplier] DEFAULT (1.00),
	[SplitStartEvidenceTypeId] [int] NULL,
	[SplitEndEvidenceTypeId] [int] NULL,
	[SplitMultiplier] [decimal](10,2) NULL,
	[AfterSplitMultiplier] [decimal](10,2) NULL,
	[RateMode] [varchar](20) NOT NULL CONSTRAINT [DF_RetrospectiveRuleAction_RateMode] DEFAULT ('YEAR_WISE')
		CONSTRAINT [CK_RetrospectiveRuleAction_RateMode] CHECK ([RateMode] IN ('YEAR_WISE', 'CURRENT_YEAR')),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleAction_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveRuleAction_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveRuleAction] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveRuleAction] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleAction_RetrospectiveRuleMaster]
	FOREIGN KEY([RuleId]) REFERENCES [PTIS].[RetrospectiveRuleMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAction] CHECK CONSTRAINT [FK_RetrospectiveRuleAction_RetrospectiveRuleMaster]
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAction] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleAction_EvidenceTypeMaster_Start]
	FOREIGN KEY([StartEvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAction] CHECK CONSTRAINT [FK_RetrospectiveRuleAction_EvidenceTypeMaster_Start]
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAction] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleAction_EvidenceTypeMaster_SplitStart]
	FOREIGN KEY([SplitStartEvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAction] CHECK CONSTRAINT [FK_RetrospectiveRuleAction_EvidenceTypeMaster_SplitStart]
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAction] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleAction_EvidenceTypeMaster_SplitEnd]
	FOREIGN KEY([SplitEndEvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAction] CHECK CONSTRAINT [FK_RetrospectiveRuleAction_EvidenceTypeMaster_SplitEnd]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RetrospectiveRuleAction_Rule]
	ON [PTIS].[RetrospectiveRuleAction] ([RuleId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [PTIS].[RetrospectivePenaltyRule] ******/
CREATE TABLE [PTIS].[RetrospectivePenaltyRule](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleId] [int] NOT NULL,
	[IsPenaltyApplicable] [bit] NOT NULL,
	[PenaltyMode] [varchar](50) NOT NULL CONSTRAINT [DF_RetrospectivePenaltyRule_PenaltyMode] DEFAULT ('NONE')
		CONSTRAINT [CK_RetrospectivePenaltyRule_PenaltyMode] CHECK ([PenaltyMode] IN ('NONE', 'ACT_PENALTY', 'DATE_VALIDATION')),
	[PenaltyPercent] [decimal](10,2) NULL,
	[PenaltyDateSourceType] [varchar](30) NULL
		CONSTRAINT [CK_RetrospectivePenaltyRule_PenaltyDateSourceType] CHECK ([PenaltyDateSourceType] IN ('EVIDENCE_DATE', 'ASSESSMENT_DATE', 'FIXED_DATE')),
	[PenaltyDateEvidenceTypeId] [int] NULL,
	[PenaltyDateCondition] [varchar](30) NULL
		CONSTRAINT [CK_RetrospectivePenaltyRule_PenaltyDateCondition] CHECK ([PenaltyDateCondition] IN ('ON_OR_AFTER', 'AFTER', 'ON_OR_BEFORE', 'BEFORE', 'BETWEEN')),
	[CompareDate] [datetime] NULL,
	[CompareDateTo] [datetime] NULL,
	[ElseAction] [varchar](50) NULL
		CONSTRAINT [CK_RetrospectivePenaltyRule_ElseAction] CHECK ([ElseAction] IN ('NONE', 'MANUAL_REVIEW')),
	[RequiresManualReview] [bit] NOT NULL,
	[Remarks] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectivePenaltyRule_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectivePenaltyRule_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectivePenaltyRule] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectivePenaltyRule] WITH CHECK ADD CONSTRAINT [FK_RetrospectivePenaltyRule_RetrospectiveRuleMaster]
	FOREIGN KEY([RuleId]) REFERENCES [PTIS].[RetrospectiveRuleMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectivePenaltyRule] CHECK CONSTRAINT [FK_RetrospectivePenaltyRule_RetrospectiveRuleMaster]
GO
ALTER TABLE [PTIS].[RetrospectivePenaltyRule] WITH CHECK ADD CONSTRAINT [FK_RetrospectivePenaltyRule_EvidenceTypeMaster]
	FOREIGN KEY([PenaltyDateEvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectivePenaltyRule] CHECK CONSTRAINT [FK_RetrospectivePenaltyRule_EvidenceTypeMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RetrospectivePenaltyRule_Rule]
	ON [PTIS].[RetrospectivePenaltyRule] ([RuleId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [PTIS].[RetrospectiveRuleSummary] ******/
CREATE TABLE [PTIS].[RetrospectiveRuleSummary](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleId] [int] NOT NULL,
	[WhenSummary] [nvarchar](1000) NULL,
	[TaxSummary] [nvarchar](1000) NULL,
	[PenaltySummary] [nvarchar](1000) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleSummary_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveRuleSummary_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveRuleSummary] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveRuleSummary] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleSummary_RetrospectiveRuleMaster]
	FOREIGN KEY([RuleId]) REFERENCES [PTIS].[RetrospectiveRuleMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleSummary] CHECK CONSTRAINT [FK_RetrospectiveRuleSummary_RetrospectiveRuleMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RetrospectiveRuleSummary_Rule]
	ON [PTIS].[RetrospectiveRuleSummary] ([RuleId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [PTIS].[RetrospectiveTaxCalculation] ******/
CREATE TABLE [PTIS].[RetrospectiveTaxCalculation](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NOT NULL,
	[CalculationMode] [varchar](20) NOT NULL
		CONSTRAINT [CK_RetrospectiveTaxCalculation_CalculationMode] CHECK ([CalculationMode] IN ('PROPERTY', 'FLOOR')),
	[FloorId] [int] NULL,
	[AppliedRuleId] [int] NULL,
	[AppliedTaxPolicyId] [int] NULL,
	[AssessmentDate] [datetime] NOT NULL,
	[PolicyStartDate] [datetime] NULL,
	[LegalBoundaryDate] [datetime] NULL,
	[RuleBoundaryDate] [datetime] NULL,
	[ChargeableStartDate] [datetime] NULL,
	[ChargeableEndDate] [datetime] NULL,
	[BaseTaxAmount] [decimal](18,2) NOT NULL,
	[RetrospectiveTaxAmount] [decimal](18,2) NOT NULL,
	[PenaltyAmount] [decimal](18,2) NOT NULL,
	[TotalAmount] [decimal](18,2) NOT NULL,
	[AuthorizationStatus] [varchar](30) NULL
		CONSTRAINT [CK_RetrospectiveTaxCalculation_AuthorizationStatus] CHECK ([AuthorizationStatus] IN ('AUTHORIZED', 'UNAUTHORIZED', 'UNDETERMINED')),
	[CalculationStatus] [varchar](30) NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculation_CalculationStatus] DEFAULT ('Calculated')
		CONSTRAINT [CK_RetrospectiveTaxCalculation_CalculationStatus] CHECK ([CalculationStatus] IN ('Calculated', 'ManualReview', 'Failed')),
	[Remarks] [nvarchar](1000) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculation_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculation_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculation_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveTaxCalculation] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveTaxCalculation_PropertyMast]
	FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] CHECK CONSTRAINT [FK_RetrospectiveTaxCalculation_PropertyMast]
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveTaxCalculation_FloorMaster]
	FOREIGN KEY([FloorId]) REFERENCES [PTIS].[FloorMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] CHECK CONSTRAINT [FK_RetrospectiveTaxCalculation_FloorMaster]
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveTaxCalculation_RetrospectiveRuleMaster]
	FOREIGN KEY([AppliedRuleId]) REFERENCES [PTIS].[RetrospectiveRuleMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] CHECK CONSTRAINT [FK_RetrospectiveTaxCalculation_RetrospectiveRuleMaster]
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveTaxCalculation_RetrospectiveTaxPolicy]
	FOREIGN KEY([AppliedTaxPolicyId]) REFERENCES [PTIS].[RetrospectiveTaxPolicy] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculation] CHECK CONSTRAINT [FK_RetrospectiveTaxCalculation_RetrospectiveTaxPolicy]
GO

CREATE NONCLUSTERED INDEX [IX_RetrospectiveTaxCalculation_Property_CreatedDate]
	ON [PTIS].[RetrospectiveTaxCalculation] ([PropertyId], [CreatedDate]);
GO
CREATE NONCLUSTERED INDEX [IX_RetrospectiveTaxCalculation_AppliedRuleId]
	ON [PTIS].[RetrospectiveTaxCalculation] ([AppliedRuleId]);
GO
CREATE NONCLUSTERED INDEX [IX_RetrospectiveTaxCalculation_AppliedTaxPolicyId]
	ON [PTIS].[RetrospectiveTaxCalculation] ([AppliedTaxPolicyId]);
GO


/****** Object:  Table [PTIS].[RetrospectiveCalculationEvidence] ******/
CREATE TABLE [PTIS].[RetrospectiveCalculationEvidence](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[CalculationId] [int] NOT NULL,
	[EvidenceTypeId] [int] NOT NULL,
	[EvidenceDate] [datetime] NULL,
	[IsAvailable] [bit] NOT NULL,
	[SourceReference] [varchar](200) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveCalculationEvidence_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveCalculationEvidence_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveCalculationEvidence_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveCalculationEvidence] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveCalculationEvidence] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveCalculationEvidence_RetrospectiveTaxCalculation]
	FOREIGN KEY([CalculationId]) REFERENCES [PTIS].[RetrospectiveTaxCalculation] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveCalculationEvidence] CHECK CONSTRAINT [FK_RetrospectiveCalculationEvidence_RetrospectiveTaxCalculation]
GO
ALTER TABLE [PTIS].[RetrospectiveCalculationEvidence] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveCalculationEvidence_EvidenceTypeMaster]
	FOREIGN KEY([EvidenceTypeId]) REFERENCES [PTIS].[EvidenceTypeMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveCalculationEvidence] CHECK CONSTRAINT [FK_RetrospectiveCalculationEvidence_EvidenceTypeMaster]
GO

CREATE NONCLUSTERED INDEX [IX_RetrospectiveCalculationEvidence_CalculationId]
	ON [PTIS].[RetrospectiveCalculationEvidence] ([CalculationId]);
GO


/****** Object:  Table [PTIS].[RetrospectiveTaxCalculationDetail] ******/
CREATE TABLE [PTIS].[RetrospectiveTaxCalculationDetail](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[CalculationId] [int] NOT NULL,
	[PropertyId] [int] NOT NULL,
	[FloorId] [int] NOT NULL,
	[FinancialYear] [varchar](20) NOT NULL,
	[FromDate] [datetime] NOT NULL,
	[ToDate] [datetime] NOT NULL,
	[RateMode] [varchar](50) NULL,
	[PercentageMode] [varchar](50) NULL,
	[BaseTaxAmount] [decimal](18,2) NOT NULL,
	[TaxMultiplier] [decimal](10,2) NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculationDetail_TaxMultiplier] DEFAULT (1.00),
	[RetrospectiveTaxAmount] [decimal](18,2) NOT NULL,
	[PenaltyPercent] [decimal](10,2) NULL,
	[PenaltyAmount] [decimal](18,2) NOT NULL,
	[TotalAmount] [decimal](18,2) NOT NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculationDetail_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculationDetail_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveTaxCalculationDetail_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveTaxCalculationDetail] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveTaxCalculationDetail] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveTaxCalculationDetail_PropertyMast]
	FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculationDetail] CHECK CONSTRAINT [FK_RetrospectiveTaxCalculationDetail_PropertyMast]
GO
-- No FK from FloorId to PTIS.FloorMaster on purpose: the Retrospective Tax engine
-- writes its property-level rows (CalculationMode = 'PROPERTY') with FloorId = 0 as
-- the "no floor" marker, and 0 is not a FloorMaster row -- an FK here rejects every
-- such row and the whole calculation (incl. the PolicyTaxDetails/TransMast sync)
-- rolls back.
ALTER TABLE [PTIS].[RetrospectiveTaxCalculationDetail] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveTaxCalculationDetail_RetrospectiveTaxCalculation]
	FOREIGN KEY([CalculationId]) REFERENCES [PTIS].[RetrospectiveTaxCalculation] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveTaxCalculationDetail] CHECK CONSTRAINT [FK_RetrospectiveTaxCalculationDetail_RetrospectiveTaxCalculation]
GO

CREATE NONCLUSTERED INDEX [IX_RetrospectiveTaxCalculationDetail_Calculation_Property_Floor]
	ON [PTIS].[RetrospectiveTaxCalculationDetail] ([CalculationId], [PropertyId], [FloorId]);
GO


/****** Object:  Table [PTIS].[RetrospectiveRuleAuditLog] ******/
CREATE TABLE [PTIS].[RetrospectiveRuleAuditLog](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[RuleId] [int] NULL,
	[ActionType] [varchar](50) NOT NULL
		CONSTRAINT [CK_RetrospectiveRuleAuditLog_ActionType] CHECK ([ActionType] IN (
			'CREATE', 'UPDATE', 'SAVE_DRAFT', 'PUBLISH', 'DEACTIVATE', 'TEST', 'EXPORT')),
	[OldValue] [nvarchar](max) NULL,
	[NewValue] [nvarchar](max) NULL,
	[Remarks] [nvarchar](1000) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleAuditLog_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RetrospectiveRuleAuditLog_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RetrospectiveRuleAuditLog_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RetrospectiveRuleAuditLog] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[RetrospectiveRuleAuditLog] WITH CHECK ADD CONSTRAINT [FK_RetrospectiveRuleAuditLog_RetrospectiveRuleMaster]
	FOREIGN KEY([RuleId]) REFERENCES [PTIS].[RetrospectiveRuleMaster] ([Id])
GO
ALTER TABLE [PTIS].[RetrospectiveRuleAuditLog] CHECK CONSTRAINT [FK_RetrospectiveRuleAuditLog_RetrospectiveRuleMaster]
GO

CREATE NONCLUSTERED INDEX [IX_RetrospectiveRuleAuditLog_Rule_CreatedDate]
	ON [PTIS].[RetrospectiveRuleAuditLog] ([RuleId], [CreatedDate]);
GO

/****** Object:  Table [PTIS].[GisPropertyGeometry] ******/
CREATE TABLE [PTIS].[GisPropertyGeometry](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NOT NULL,
	[BuildingId] [nvarchar](100) NULL,
	[PolygonGeometry] [geometry] NOT NULL,
	[TotalAreaSqMeter] [decimal](18,4) NULL,
	[GoogleMapLink] [nvarchar](500) NULL,
	[Link360] [nvarchar](500) NULL,
	[CentroidX] [decimal](18,7) NULL,
	[CentroidY] [decimal](18,7) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_GisPropertyGeometry_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisPropertyGeometry_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisPropertyGeometry_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisPropertyGeometry] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [CK_GisPropertyGeometry_CentroidX] CHECK ([CentroidX] IS NULL OR [CentroidX] BETWEEN -180.0 AND 180.0),
	CONSTRAINT [CK_GisPropertyGeometry_CentroidY] CHECK ([CentroidY] IS NULL OR [CentroidY] BETWEEN -90.0 AND 90.0),
	CONSTRAINT [CK_GisPropertyGeometry_TotalAreaSqMeter] CHECK ([TotalAreaSqMeter] IS NULL OR [TotalAreaSqMeter] >= 0)
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[GisPropertyGeometry] WITH CHECK ADD CONSTRAINT [FK_GisPropertyGeometry_PropertyMast]
	FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id])
GO
ALTER TABLE [PTIS].[GisPropertyGeometry] CHECK CONSTRAINT [FK_GisPropertyGeometry_PropertyMast]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisPropertyGeometry_PropertyId]
	ON [PTIS].[GisPropertyGeometry] ([PropertyId])
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_GisPropertyGeometry_BuildingId]
	ON [PTIS].[GisPropertyGeometry] ([BuildingId])
	WHERE [BuildingId] IS NOT NULL;
GO

CREATE SPATIAL INDEX [SIX_GisPropertyGeometry_PolygonGeometry]
	ON [PTIS].[GisPropertyGeometry] ([PolygonGeometry])
	USING GEOMETRY_AUTO_GRID
	WITH (
		BOUNDING_BOX = (xmin = -180, ymin = -90, xmax = 180, ymax = 90)
	);
GO

---------- for RV hash comparison ------------
CREATE TABLE [PTIS].[RVCalculationSignature](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NOT NULL,
	[SignatureHash] [varchar](64) NOT NULL,
	[CalculatedAt] [datetime] NOT NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_RVCalculationSignature_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_RVCalculationSignature_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_RVCalculationSignature] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RVCalculationSignature_PropertyMast_PropertyId] FOREIGN KEY([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id])
);
GO

/****** Object:  Table [PTIS].[OldZoneMaster] ******/
CREATE TABLE [PTIS].[OldZoneMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [OldZoneNo] [nvarchar](20) NOT NULL,
    [Description] [nvarchar](100) NOT NULL,
    [SequenceNo] int null,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_OldZoneMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime]  NOT NULL CONSTRAINT DF_OldZoneMaster_CreatedDate DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_OldZoneMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_OldZoneMaster_OldZoneNo] UNIQUE ([OldZoneNo]),
    CONSTRAINT [UQ_OldZoneMaster_Description] UNIQUE ([Description] ASC)
) ON [PRIMARY]
 
GO
 
 
 
/****** Object:  Table [PTIS].[OldWardMaster] ******/
CREATE TABLE [PTIS].[OldWardMaster](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OldZoneId] Int NOT NULL,
    [OldWardNo] [nvarchar](20) NOT NULL,
    [Description] [nvarchar] (100) NOT NULL,
    [SequenceNo] int null,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_OldWardMaster_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime]  NOT NULL CONSTRAINT DF_OldWardMaster_CreatedDate DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_OldWardMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_OldWardMaster_OldWardNo] UNIQUE ([OldWardNo] ASC),
    CONSTRAINT [UQ_OldWardMaster_Description] UNIQUE ([Description] ASC),
    CONSTRAINT [FK_OldWardMaster_OldZoneMaster] FOREIGN KEY ([OldZoneId]) REFERENCES [PTIS].[OldZoneMaster]([Id])
) ON [PRIMARY]
 
GO

ALTER TABLE [PTIS].[PropertyMast] WITH CHECK
ADD CONSTRAINT [FK_PropertyMast_OldWardMaster]
FOREIGN KEY ([OldWardId]) REFERENCES [PTIS].[OldWardMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMast]
CHECK CONSTRAINT [FK_PropertyMast_OldWardMaster];
GO

/****** Object: Table [PTIS].[OldWardWiseRates] ******/

CREATE TABLE [PTIS].[OldWardWiseRates](
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [OldWardId] [int] NULL,
    [CollectionWard] [nvarchar](100) NULL,
    [ConstructionId] [int] NULL,
    [Residential] [decimal](18,2) NULL,
    [Commercial] [decimal](18,2) NULL,
    CONSTRAINT [PK_OldWardWiseRates] PRIMARY KEY CLUSTERED
    (
        [Id] ASC
    ) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [PTIS].[OldWardWiseRates] WITH CHECK
ADD CONSTRAINT [FK_OldWardWiseRates_ConstructionTypeMaster]
FOREIGN KEY ([ConstructionId])
REFERENCES [PTIS].[ConstructionTypeMaster] ([Id])
GO

ALTER TABLE [PTIS].[OldWardWiseRates]
CHECK CONSTRAINT [FK_OldWardWiseRates_ConstructionTypeMaster]
GO

ALTER TABLE [PTIS].[OldWardWiseRates] WITH CHECK
ADD CONSTRAINT [FK_OldWardWiseRates_OldWardMaster]
FOREIGN KEY ([OldWardId])
REFERENCES [PTIS].[OldWardMaster] ([Id])
GO

ALTER TABLE [PTIS].[OldWardWiseRates]
CHECK CONSTRAINT [FK_OldWardWiseRates_OldWardMaster]
GO



CREATE TABLE [PTIS].[PropertyTaxRecalcFlag](
	[Id] [bigint] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NOT NULL,
	[FinanceYearId] [int] NOT NULL,
	[BatchId] [bigint] NOT NULL,
	[CalculationType] [varchar](10) NOT NULL,
	[Remark] [nvarchar](1000) NULL,
	[FlaggedAt] [datetime]   NOT NULL CONSTRAINT DF_PropertyTaxRecalcFlag_FlaggedAt DEFAULT (GETDATE()),
	[ResolvedAt] [datetime]   NULL,
	[ResolvedBy] [int] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyTaxRecalcFlag_IsActive] DEFAULT (1),
CONSTRAINT [PK_PropertyTaxRecalcFlag] PRIMARY KEY CLUSTERED ([Id] ASC),
CONSTRAINT [FK_PropertyTaxRecalcFlag_PropertyMast] FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
CONSTRAINT [FK_PropertyTaxRecalcFlag_MasterDataChangeBatch] FOREIGN KEY([BatchId])  REFERENCES [CORE].[MasterDataChangeBatch] ([Id]),
CONSTRAINT [FK_PropertyTaxRecalcFlag_FinanceYear] FOREIGN KEY([FinanceYearId]) REFERENCES [CORE].[YearMaster] ([Id]),
CONSTRAINT [FK_PropertyTaxRecalcFlag_ResolvedBy] FOREIGN KEY([ResolvedBy]) REFERENCES [CORE].[UserMaster] ([Id])
)

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertyTaxRecalcFlag_Unresolved] ON [PTIS].[PropertyTaxRecalcFlag]
(
	[PropertyId] ASC,
	[FinanceYearId] ASC,
	[CalculationType] ASC
)
WHERE ([ResolvedAt] IS NULL)  AND [IsActive] = 1 ;
GO

/****** Object:  Table [PTIS].[PropertySocialDocument] *********/
CREATE TABLE [PTIS].[PropertySocialDocument]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertySocialDetailsId] INT NOT NULL,
    [DocumentBindingId] INT NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_PropertySocialDocument_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_PropertySocialDocument_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_PropertySocialDocument_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_PropertySocialDocument] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UQ_PropertySocialDocument_PropertySocialDetails_DocumentBinding] UNIQUE ([PropertySocialDetailsId], [DocumentBindingId]),
    CONSTRAINT [FK_PropertySocialDocument_PropertySocialDetails] FOREIGN KEY ([PropertySocialDetailsId]) REFERENCES [PTIS].[PropertySocialDetails]([Id]),
    CONSTRAINT [FK_PropertySocialDocument_DocumentBinding] FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id])
) ON [PRIMARY];

/****** Object:  Table [PTIS].[PropertySection129Schedule] ******/
-- Year-wise Section 129A demand schedule. One row per property per finance
-- year: the resolved stage (PolicyCodeId, chained via PolicyCodeMaster.NextPolicyCodeId),
-- the old-GP-tax vs staged-tax comparison, and the final applied amount that
-- also gets mirrored into PTIS.TransMast for that (PropertyId, FinanceYearId, TaxId).
CREATE TABLE [PTIS].[PropertySection129Schedule](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NOT NULL,
	[PropertyDetailsId] [int] NOT NULL,
	[FinanceYearId] [int] NOT NULL,
	[PolicyCodeId] [int] NOT NULL,
	[TaxId] [int] NOT NULL,
	[TaxPercentage] [decimal](5,2) NOT NULL CONSTRAINT [DF_PropertySection129Schedule_TaxPercentage] DEFAULT (0),
	[OldTaxAmount] [decimal](18,2) NOT NULL CONSTRAINT [DF_PropertySection129Schedule_OldTaxAmount] DEFAULT (0),
	[FullBasisTaxAmount] [decimal](18,2) NOT NULL CONSTRAINT [DF_PropertySection129Schedule_FullBasisTaxAmount] DEFAULT (0),
	[StageTaxAmount] [decimal](18,2) NOT NULL CONSTRAINT [DF_PropertySection129Schedule_StageTaxAmount] DEFAULT (0),
	[TaxAmount] [decimal](18,2) NOT NULL CONSTRAINT [DF_PropertySection129Schedule_TaxAmount] DEFAULT (0),
	[IsCurrent] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Schedule_IsCurrent] DEFAULT (0),
	[IsPropertyChangeDisqualified] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Schedule_IsPropertyChangeDisqualified] DEFAULT (0),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Schedule_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Schedule_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertySection129Schedule_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_PropertySection129Schedule] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [FK_PropertySection129Schedule_PropertyMast] FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
	CONSTRAINT [FK_PropertySection129Schedule_PropertyDetails] FOREIGN KEY ([PropertyDetailsId]) REFERENCES [PTIS].[PropertyDetails] ([Id]),
	CONSTRAINT [FK_PropertySection129Schedule_YearMaster] FOREIGN KEY ([FinanceYearId]) REFERENCES [CORE].[YearMaster] ([Id]),
	CONSTRAINT [FK_PropertySection129Schedule_PolicyCodeMaster] FOREIGN KEY ([PolicyCodeId]) REFERENCES [PTIS].[PolicyCodeMaster] ([Id]),
	CONSTRAINT [FK_PropertySection129Schedule_TaxMaster] FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster] ([Id])
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertySection129Schedule_Property_Year]
	ON [PTIS].[PropertySection129Schedule] ([PropertyId] ASC, [FinanceYearId] ASC)
	WHERE ([IsActive] = 1 AND [MarkedForDeletion] = 0);
GO

/****** Object:  Table [PTIS].[PropertySection129Application] ******/
-- One row per property: the one-time "Apply Section 129A" marker
-- that PTIS.RateableValueService checks before running the staged-schedule
-- logic above. Also carries the one property-change fact that cannot be
-- auto-detected from PropertyMastOld/PropertyMapDetail (Other Structural /
-- Assessment Change) plus an optional start-year override.
CREATE TABLE [PTIS].[PropertySection129Application](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[PropertyId] [int] NOT NULL,
	[IsApplied] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Application_IsApplied] DEFAULT (0),
	[AppliedDate] [datetime] NULL,
	[AppliedBy] [int] NULL,
	[StartFinanceYearIdOverride] [int] NULL,
	[UseOcDateBasis] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Application_UseOcDateBasis] DEFAULT (0),
	[AreaChanged] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Application_AreaChanged] DEFAULT (0),
	[UseChanged] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Application_UseChanged] DEFAULT (0),
	[OtherStructuralChange] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Application_OtherStructuralChange] DEFAULT (0),
	[OtherStructuralChangeEffectiveDate] [datetime] NULL,
	[ChangeDetailsRemark] [nvarchar](500) NULL,
	[Remark] [nvarchar](1000) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Application_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertySection129Application_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertySection129Application_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_PropertySection129Application] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [FK_PropertySection129Application_PropertyMast] FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
	CONSTRAINT [FK_PropertySection129Application_YearMaster] FOREIGN KEY ([StartFinanceYearIdOverride]) REFERENCES [CORE].[YearMaster] ([Id]),
	CONSTRAINT [FK_PropertySection129Application_UserMaster] FOREIGN KEY ([AppliedBy]) REFERENCES [CORE].[UserMaster] ([Id])
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertySection129Application_PropertyId]
	ON [PTIS].[PropertySection129Application] ([PropertyId] ASC)
	WHERE ([IsActive] = 1 AND [MarkedForDeletion] = 0);
GO

/****** Object:  Table [PTIS].[PropertyMediaJob] ******/

CREATE TABLE [PTIS].[PropertyMediaJob](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[JobCode] [varchar](30) NOT NULL,
	[Operation] [varchar](30) NOT NULL,
	[PhotoTypeId] [int] NOT NULL,
	[SourceBatchKey] [nvarchar](200) NULL,
	[StartTime] [datetime] NULL,
	[CompleteTime] [datetime] NULL,
	[RecordsSelected] [int] NOT NULL CONSTRAINT [DF_PropertyMediaJob_RecordsSelected] DEFAULT (0),
	[RecordsProcessed] [int] NOT NULL CONSTRAINT [DF_PropertyMediaJob_RecordsProcessed] DEFAULT (0),
	[MatchedCount] [int] NOT NULL CONSTRAINT [DF_PropertyMediaJob_MatchedCount] DEFAULT (0),
	[SkippedCount] [int] NOT NULL CONSTRAINT [DF_PropertyMediaJob_SkippedCount] DEFAULT (0),
	[FailedCount] [int] NOT NULL CONSTRAINT [DF_PropertyMediaJob_FailedCount] DEFAULT (0),
	[NoMatchCount] [int] NOT NULL CONSTRAINT [DF_PropertyMediaJob_NoMatchCount] DEFAULT (0),
	[Status] [varchar](20) NOT NULL,
	[ErrorMessage] [nvarchar](2000) NULL,
	[Remarks] [nvarchar](1000) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyMediaJob_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyMediaJob_IsActive] DEFAULT (1),
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyMediaJob_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[UpdatedBy] [int] NULL,
	CONSTRAINT [PK_PropertyMediaJob] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [FK_PropertyMediaJob_PropertyPhotoType] FOREIGN KEY ([PhotoTypeId]) REFERENCES [PTIS].[PropertyPhotoType] ([Id]),
	CONSTRAINT [CK_PropertyMediaJob_Operation] CHECK ([Operation] IN ('BulkImportLocalFolder', 'BulkImportBrowsedFiles')),
	CONSTRAINT [CK_PropertyMediaJob_Status] CHECK ([Status] IN ('Pending', 'Running', 'Completed', 'Failed', 'Cancelled')),
	CONSTRAINT [CK_PropertyMediaJob_Time] CHECK ([CompleteTime] IS NULL OR [StartTime] IS NULL OR [CompleteTime] >= [StartTime])
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertyMediaJob_JobCode]
	ON [PTIS].[PropertyMediaJob]([JobCode] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_PropertyMediaJob_PhotoTypeId]
	ON [PTIS].[PropertyMediaJob]([PhotoTypeId] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_PropertyMediaJob_Status_Queue]
	ON [PTIS].[PropertyMediaJob]([Status] ASC, [CreatedDate] ASC, [Id] ASC)
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO



/****** Object:  Table [PTIS].[PropertyMediaJobDetail] ******/

CREATE TABLE [PTIS].[PropertyMediaJobDetail](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[JobId] [int] NOT NULL,
	[FileName] [nvarchar](260) NOT NULL,
	[WardNo] [nvarchar](20) NULL,
	[PropertyNo] [nvarchar](20) NULL,
	[PartitionNo] [nvarchar](20) NULL,
	[Suffix] [nvarchar](10) NULL,
	[PropertyId] [int] NULL,
	[PropertyPhotoId] [int] NULL,
	[ExecutionStartTime] [datetime] NULL,
	[ExecutionEndTime] [datetime] NULL,
	[Status] [varchar](20) NOT NULL,
	[SkipReason] [varchar](50) NULL,
	[Message] [nvarchar](2000) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertyMediaJobDetail_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertyMediaJobDetail_IsActive] DEFAULT (1),
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertyMediaJobDetail_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [int] NULL,
	[UpdatedBy] [int] NULL,
	CONSTRAINT [PK_PropertyMediaJobDetail] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [FK_PropertyMediaJobDetail_PropertyMediaJob] FOREIGN KEY ([JobId]) REFERENCES [PTIS].[PropertyMediaJob] ([Id]),
	CONSTRAINT [FK_PropertyMediaJobDetail_PropertyMast] FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast] ([Id]),
	CONSTRAINT [FK_PropertyMediaJobDetail_PropertyPhoto] FOREIGN KEY ([PropertyPhotoId]) REFERENCES [PTIS].[PropertyPhoto] ([Id]),
	CONSTRAINT [CK_PropertyMediaJobDetail_Status] CHECK ([Status] IN ('Pending', 'Matched', 'NoMatch', 'Invalid', 'Failed')),
	CONSTRAINT [CK_PropertyMediaJobDetail_ExecutionTime] CHECK ([ExecutionEndTime] IS NULL OR [ExecutionStartTime] IS NULL OR [ExecutionEndTime] >= [ExecutionStartTime])
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_PropertyMediaJobDetail_Job_File_Active]
	ON [PTIS].[PropertyMediaJobDetail]([JobId] ASC, [FileName] ASC)
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_PropertyMediaJobDetail_Job_Status]
	ON [PTIS].[PropertyMediaJobDetail]([JobId] ASC, [Status] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_PropertyMediaJobDetail_PropertyId]
	ON [PTIS].[PropertyMediaJobDetail]([PropertyId] ASC)
	WHERE [PropertyId] IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX [IX_PropertyMediaJobDetail_PropertyPhotoId]
	ON [PTIS].[PropertyMediaJobDetail]([PropertyPhotoId] ASC)
	WHERE [PropertyPhotoId] IS NOT NULL;
GO
GO

CREATE TABLE [PTIS].[WardSection129Master](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[WardId] [int] NOT NULL,
	[Section129AInclusionDate] [date] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_WardSection129Master_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_WardSection129Master_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_WardSection129Master] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [UQ_WardSection129Master_WardId] UNIQUE ([WardId] ASC),
	CONSTRAINT [FK_WardSection129Master_WardMaster] FOREIGN KEY ([WardId]) REFERENCES [PTIS].[WardMaster] ([Id])
) ON [PRIMARY]
GO



CREATE TABLE [PTIS].[SocietyDetailsMastOld]
(
    [Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [OldPropertyId] [int] NOT NULL,
    [OldSocietyName] [nvarchar](500) NULL,
    [OldSocietyAddress] [nvarchar](200) NULL,
    [OldSecretaryName] [nvarchar](200) NULL,
    [OldManagerName] [nvarchar](200) NULL,
    [OldLandOwnerName] [nvarchar](200) NULL,
    [OldBuilderName] [nvarchar](200) NULL,
    [OldSocietyNameEnglish] [varchar](500) NULL,
    [OldSocietyAddressEnglish] [varchar](200) NULL,
    [OldSecretaryNameEnglish] [varchar](200) NULL,
    [OldManagerNameEnglish] [varchar](200) NULL,
    [OldLandOwnerNameEnglish] [varchar](200) NULL,
    [OldBuilderNameEnglish] [varchar](200) NULL,
    [OldManagerMobileNo] [varchar](13) NULL,
    [OldSecretaryMobileNo] [varchar](13) NULL,
    [OldBuilderMobileNo] [varchar](13) NULL,
    [OldSocietyEmailId] [varchar](50) NULL,
    [OldSecretaryEmailId] [varchar](50) NULL,
    [OldManagerEmailId] [varchar](50) NULL,
    [MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_SocietyDetailsMasterOld_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_SocietyDetailsMasterOld_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_SocietyDetailsMasterOld_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT [PK_SocietyDetailsMasterOld] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_SocietyDetailsMastOld_OldPropertyId] UNIQUE ([OldPropertyId] ASC)
) ON [PRIMARY];
GO

ALTER TABLE [PTIS].[SocietyDetailsMastOld] WITH CHECK ADD CONSTRAINT [FK_SocietyDetailsMastOld_OldPropertyId] FOREIGN KEY([OldPropertyId])
REFERENCES [PTIS].[PropertyMastOld] ([Id]) 
GO


/****** Object:  Table [PTIS].[SocietyWingMastOld] ******/
CREATE TABLE [PTIS].[WingDetailsMastOld](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OldSocietyDetailsMastId] [int] NULL, 
	[OldWingMasterId] [int] NOT NULL,
	[OldWingName] [nvarchar](30) NULL,
	[OldSecretaryName] [nvarchar](200) NULL,
	[OldManagerName] [nvarchar](200) NULL,
	[OldSecretaryNameEnglish] [varchar](200) NULL,
	[OldManagerNameEnglish] [varchar](200) NULL,
	[OldManagerMobileNo] [varchar](13) NULL,
	[OldSecretaryMobileNo] [varchar](13) NULL,
	[OldSecretaryEmailId] [varchar](50) NULL,
	[OldManagerEmailId] [varchar](50) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_WingDetailsMastOld_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] [datetime] NULL ,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_WingDetailsMastOld_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_WingDetailsMastOld_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_WingDetailsMasterOld] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO


ALTER TABLE [PTIS].[WingDetailsMastOld] WITH CHECK ADD CONSTRAINT [FK_WingDetailsMastOld_OldSocietyDetailsMastId] FOREIGN KEY([OldSocietyDetailsMastId])
REFERENCES [PTIS].[SocietyDetailsMastOld] ([Id]) 
GO

ALTER TABLE [PTIS].[WingDetailsMastOld] WITH CHECK ADD CONSTRAINT [FK_WingDetailsMastOld_OldWingMasterId] FOREIGN KEY([OldWingMasterId])
REFERENCES [PTIS].[WingMaster] ([Id]) 
GO

ALTER TABLE [PTIS].[PropertyMastOld] WITH CHECK ADD CONSTRAINT [FK_PropertyMastOld_OldWardMaster] FOREIGN KEY([OldWardId]) 
REFERENCES [PTIS].[OldWardMaster] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMastOld] WITH CHECK ADD CONSTRAINT [FK_PropertyMastOld_WingDetailsMastOld] FOREIGN KEY([OldWingDetailId])
REFERENCES [PTIS].[WingDetailsMastOld] ([Id]);
GO

CREATE TABLE [PTIS].[PropertyPhotoOld](
    [Id]                    INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,  -- Surrogate PK | e.g. 5001
    [OldEntityType]            CHAR(1)           NOT NULL,                      -- S = Society, W = Wing, P = Property | e.g. 'P'
    [OldSocietyDetailId]       INT               NULL,                          -- FK → PTIS.SocietyDetailsMastOld.Id, set when OldEntityType = 'S'
    [OldWingDetailId]          INT               NULL,                          -- FK → PTIS.WingDetailsMastOld.Id, set when OldEntityType = 'W'
    [OldPropertyId]            INT               NULL,                          -- FK → PTIS.PropertyMastOld.Id, set when OldEntityType = 'P' | e.g. 101
    [OldType]                  NVARCHAR(50)      NULL,                          -- Mirrors PTIS.PropertyMastOld.Type; set only on the shared PROPERTY_PLAN row for a non-Amenity apartment unit (OldPropertyId NULL there) so every unit of that Type in the society resolves the same plan | e.g. '2BHK'
    [PhotoTypeId]           INT               NOT NULL,                      -- FK → PropertyPhotoType.Id | e.g. 1 (FRONT)
    [DocumentBindingId]     INT               NULL,                          -- FK → CORE.DocumentBinding.Id | e.g. 7701
    [IsLatest]              BIT               NOT NULL                       -- 1=current, 0=superseded | e.g. 1
        CONSTRAINT [DF_PropertyPhotoOld_IsLatest] DEFAULT (1),
    [DisplayOrder]          INT               NULL,                          -- Gallery sort within (OldPropertyId, PhotoTypeId) | e.g. 2
    [OldRemarks]               NVARCHAR(500)     NULL,                          -- Surveyor notes | e.g. 'Captured at noon'
    [MarkedForDeletion]     BIT               NOT NULL                       -- Two-phase delete flag | e.g. 0
        CONSTRAINT [DF_PropertyPhotoOld_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME          NULL,                          -- Flagged-for-delete ts | e.g. NULL
    [IsActive]              BIT               NOT NULL                       -- Soft delete | e.g. 1
        CONSTRAINT [DF_PropertyPhotoOld_IsActive] DEFAULT (1),
    [CreatedBy]             INT               NULL,                          -- Audit user | e.g. 42
    [CreatedDate]           DATETIME          NOT NULL                       -- Insert ts | e.g. 2026-05-28
        CONSTRAINT [DF_PropertyPhotoOld_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]             INT               NULL,                          -- Audit user | e.g. NULL
    [UpdatedDate]           DATETIME          NULL,                          -- Update ts | e.g. NULL
    CONSTRAINT [PK_PropertyPhotoOld] PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [CK_PropertyPhotoOld_OldEntityType]
        CHECK ([OldEntityType] IN ('S', 'W', 'P')),

    -- OldEntityType marks the photo/certificate apply level; OldSocietyDetailId/OldWingDetailId
    -- may still be populated on 'W'/'P' rows to carry the parent hierarchy for
    -- filtering/reporting (e.g. an apartment flat photo keeps OldSocietyDetailId + OldWingDetailId
    -- alongside its required OldPropertyId).
    CONSTRAINT [CK_PropertyPhotoOld_EntityScope]
        CHECK (
            ([OldEntityType] = 'S' AND [OldSocietyDetailId] IS NOT NULL AND [OldWingDetailId] IS NULL AND [OldPropertyId] IS NULL) OR
            ([OldEntityType] = 'W' AND [OldSocietyDetailId] IS NOT NULL AND [OldWingDetailId] IS NOT NULL AND [OldPropertyId] IS NULL) OR
            ([OldEntityType] = 'P' AND [OldPropertyId] IS NOT NULL)
        )
);
GO

ALTER TABLE [PTIS].[PropertyPhotoOld] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhotoOld_SocietyDetailsMastOld] FOREIGN KEY ([OldSocietyDetailId])  REFERENCES [PTIS].[SocietyDetailsMastOld]([Id]);

ALTER TABLE [PTIS].[PropertyPhotoOld] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhotoOld_WingDetailsMastOld]    FOREIGN KEY ([OldWingDetailId])     REFERENCES [PTIS].[WingDetailsMastOld]([Id]);

ALTER TABLE [PTIS].[PropertyPhotoOld] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhotoOld_PropertyMastOld]    FOREIGN KEY ([OldPropertyId])        REFERENCES [PTIS].[PropertyMastOld]([Id]);

ALTER TABLE [PTIS].[PropertyPhotoOld] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhotoOld_PhotoType]       FOREIGN KEY ([PhotoTypeId])       REFERENCES [PTIS].[PropertyPhotoType]([Id]);

ALTER TABLE [PTIS].[PropertyPhotoOld] WITH CHECK
ADD CONSTRAINT [FK_PropertyPhotoOld_DocumentBinding] FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]);
GO

-- Non-unique: multiple photos of the same type are allowed per entity (e.g. several
-- society board photos), ordered/superseded via DisplayOrder / IsLatest.
CREATE NONCLUSTERED INDEX [IX_PropertyPhotoOld_Entity_Type]
	ON [PTIS].[PropertyPhotoOld]([OldEntityType], [OldSocietyDetailId], [OldWingDetailId], [OldPropertyId], [PhotoTypeId], [IsLatest])
	INCLUDE ([DocumentBindingId], [DisplayOrder], [OldRemarks])
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

-- Shared plan lookup: one PROPERTY_PLAN row per (OldSocietyDetailId, PhotoTypeId, OldEntityType) is
-- resolved by every apartment unit of that Type in that society.
CREATE UNIQUE NONCLUSTERED INDEX [IX_PropertyPhotoOld_Society_Type_Plan]
	ON [PTIS].[PropertyPhotoOld]([OldSocietyDetailId], [PhotoTypeId], [OldEntityType])
	WHERE [IsLatest] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0 AND [OldSocietyDetailId] IS NOT NULL;
GO



CREATE TABLE [PTIS].[PropertySocialDetailsOld](
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[OldEntityType]            CHAR(1)           NOT NULL,                      -- S = Society, W = Wing, P = Property | e.g. 'P'
    [OldSocietyDetailId]       INT               NULL,                          -- FK → PTIS.SocietyDetailsMastOld.Id, set when OldEntityType = 'S'
    [OldWingDetailId]          INT               NULL,                          -- FK → PTIS.WingDetailsMastOld.Id, set when OldEntityType = 'W'
    [OldPropertyId] INT  NULL,
    [SocialAttributeId] INT NOT NULL,
    [DocumentBindingId] INT  NULL,                 -- FK → CORE.DocumentBinding.Id (binding contains DocumentId) | e.g. 6601
    [OldBitValue] BIT NULL,
    [OldIntValue] INT NULL,
    [OldDecimalValue] DECIMAL(18,2) NULL,
	[OldTextValue] NVARCHAR(500) NULL,
	[OldDateValue] DATE NULL,
	[OldRemark] NVARCHAR(500) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_PropertySocialDetailsOld_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
   	[IsActive] [bit] NOT NULL CONSTRAINT [DF_PropertySocialDetailsOld_IsActive] DEFAULT (1),
    [CreatedBy] [int] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_PropertySocialDetailsOld_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [int] NULL,
    [UpdatedDate] [datetime] NULL,
    CONSTRAINT PK_PropertySocialDetailsOld   PRIMARY KEY ([Id]),
	CONSTRAINT FK_PropertySocialDetailsOld_SocietyDetailsMastOld FOREIGN KEY ([OldSocietyDetailId]) REFERENCES [PTIS].[SocietyDetailsMastOld]([Id]),
	CONSTRAINT FK_PropertySocialDetailsOld_WingDetailsMastOld FOREIGN KEY ([OldWingDetailId]) REFERENCES [PTIS].[WingDetailsMastOld]([Id]),
	
    CONSTRAINT FK_PropertySocialDetailsOld_Property FOREIGN KEY ([OldPropertyId]) REFERENCES [PTIS].[PropertyMastOld]([Id]),
	CONSTRAINT FK_PropertySocialDetailsOld_SocialAttribute FOREIGN KEY ([SocialAttributeId]) REFERENCES [PTIS].[SocialAttributeMaster]([Id]),
	CONSTRAINT FK_PropertySocialDetailsOld_DocumentBinding FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]),

	CONSTRAINT [CK_PropertySocialDetailsOld_EntityScope]
	CHECK
	(
		(
			[OldEntityType] = 'S'
			AND [OldSocietyDetailId] IS NOT NULL
			AND [OldWingDetailId] IS NULL
			AND [OldPropertyId] IS NULL
		)
		OR
		(
			[OldEntityType] = 'W'
			AND [OldSocietyDetailId] IS NULL
			AND [OldWingDetailId] IS NOT NULL
			AND [OldPropertyId] IS NULL
		)
		OR
		(
			[OldEntityType] = 'P'
			AND [OldSocietyDetailId] IS NULL
			AND [OldWingDetailId] IS NULL
			AND [OldPropertyId] IS NOT NULL
		)
	)
);
GO

CREATE NONCLUSTERED INDEX [IX_PropertySocialDetailsOld_DocumentBindingId]
	ON [PTIS].[PropertySocialDetailsOld]([DocumentBindingId])
	WHERE [DocumentBindingId] IS NOT NULL;
GO


CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PropertySocialDetailsOld_Society_SocialAttribute]
ON [PTIS].[PropertySocialDetailsOld]
(
    [OldSocietyDetailId],
    [SocialAttributeId]
)
WHERE
    [OldEntityType] = 'S'
    AND [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO

CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PropertySocialDetailsOld_Wing_SocialAttribute]
ON [PTIS].[PropertySocialDetailsOld]
(
    [OldWingDetailId],
    [SocialAttributeId]
)
WHERE
    [OldEntityType] = 'W'
    AND [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO

CREATE UNIQUE NONCLUSTERED INDEX
    [UX_PropertySocialDetailsOld_Property_SocialAttribute]
ON [PTIS].[PropertySocialDetailsOld]
(
    [OldPropertyId],
    [SocialAttributeId]
)
WHERE
    [OldEntityType] = 'P'
    AND [IsActive] = 1
    AND [MarkedForDeletion] = 0;
GO








/* ============================================================================
   PTIS REVISION / ASSESSMENT HISTORY TABLES
   Purpose:
     - Preserve report-ready snapshots for every revision.
     - Support HISTORY_ONLY and PERIOD_WISE revisions.
     - Keep current PropertyMast / PropertyDetails as live state.
     ============================================================================ */
/****** Object:  Table [PTIS].[RevisionMast] ******/
CREATE TABLE [PTIS].[RevisionMast]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] INT NOT NULL,
    [FinanceYearId] INT NOT NULL,
    [RevisionNo] INT NOT NULL,
    [PreviousRevisionMastId] BIGINT NULL,
    [CalculationType] VARCHAR(10) NOT NULL,
    [CalculationScope] VARCHAR(20) NOT NULL,
    [RevisionType] VARCHAR(30) NOT NULL,
    [EffectiveDate] DATE NULL,
    [RevisionReason] NVARCHAR(1000) NULL,
    [PolicyCodeId] INT NULL,
    [SourceType] VARCHAR(30) NULL,
    [SourceReferenceId] BIGINT NULL,
    [RevisionStatus] VARCHAR(20) NOT NULL     CONSTRAINT [DF_RevisionMast_RevisionStatus] DEFAULT ('DRAFT'),
    [IsCurrent] BIT NOT NULL CONSTRAINT [DF_RevisionMast_IsCurrent] DEFAULT (1),
    [ApprovedBy] INT NULL,
    [ApprovedDate] DATETIME NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionMast_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionMast_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionMast_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    [RowVersion] ROWVERSION NOT NULL,

    CONSTRAINT [PK_RevisionMast] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionMast_Id_PropertyId] UNIQUE ([Id],[PropertyId]),
    CONSTRAINT [UQ_RevisionMast_Id_Property_Year]
        UNIQUE ([Id],[PropertyId],[FinanceYearId]),
    CONSTRAINT [FK_RevisionMast_PropertyMast]
        FOREIGN KEY ([PropertyId]) REFERENCES [PTIS].[PropertyMast]([Id]),
    CONSTRAINT [FK_RevisionMast_YearMaster]
        FOREIGN KEY ([FinanceYearId]) REFERENCES [CORE].[YearMaster]([Id]),
    CONSTRAINT [FK_RevisionMast_PolicyCodeMaster]
        FOREIGN KEY ([PolicyCodeId]) REFERENCES [PTIS].[PolicyCodeMaster]([Id]),
    CONSTRAINT [FK_RevisionMast_PreviousRevision]
        FOREIGN KEY ([PreviousRevisionMastId],[PropertyId],[FinanceYearId])
        REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId],[FinanceYearId]),
    CONSTRAINT [CK_RevisionMast_RevisionNo]
        CHECK ([RevisionNo] > 0),
    CONSTRAINT [CK_RevisionMast_CalculationType]
        CHECK ([CalculationType] IN ('RV','CV','BOTH')),
    CONSTRAINT [CK_RevisionMast_CalculationScope]
        CHECK ([CalculationScope] IN ('HISTORY_ONLY','PERIOD_WISE')),
    CONSTRAINT [CK_RevisionMast_Status]
        CHECK ([RevisionStatus] IN ('DRAFT','CALCULATED','APPROVED','POSTED','CANCELLED')),
    CONSTRAINT [CK_RevisionMast_Approval]
        CHECK ([RevisionStatus] NOT IN ('APPROVED','POSTED')
               OR ([ApprovedBy] IS NOT NULL AND [ApprovedDate] IS NOT NULL)),
    CONSTRAINT [CK_RevisionMast_PeriodWiseEffectiveDate]
        CHECK ([CalculationScope] <> 'PERIOD_WISE' OR [EffectiveDate] IS NOT NULL)
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionMast_Property_Year_RevisionNo]
ON [PTIS].[RevisionMast]([PropertyId],[FinanceYearId],[RevisionNo])
WHERE [MarkedForDeletion] = 0;
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionMast_Current]
ON [PTIS].[RevisionMast]([PropertyId],[FinanceYearId])
WHERE [IsCurrent] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_RevisionMast_PropertyYear]
ON [PTIS].[RevisionMast]([PropertyId],[FinanceYearId])
INCLUDE ([RevisionNo],[CalculationType],[CalculationScope],[RevisionType],
         [EffectiveDate],[RevisionStatus],[IsCurrent]);
GO


/****** Object:  Table [PTIS].[RevisionPeriod] ******/
CREATE TABLE [PTIS].[RevisionPeriod]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [PeriodNo] INT NOT NULL,
    [EffectiveFrom] DATE NOT NULL,
    [EffectiveTo] DATE NOT NULL,
    [PeriodDays] AS (DATEDIFF(DAY,[EffectiveFrom],[EffectiveTo]) + 1) PERSISTED,
    [Remarks] NVARCHAR(500) NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPeriod_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPeriod_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPeriod_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    [RowVersion] ROWVERSION NOT NULL,

    CONSTRAINT [PK_RevisionPeriod] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionPeriod_RevisionMast] FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [CK_RevisionPeriod_PeriodNo] CHECK ([PeriodNo] > 0),
    CONSTRAINT [CK_RevisionPeriod_Dates] CHECK ([EffectiveFrom] <= [EffectiveTo]),
    CONSTRAINT [UQ_RevisionPeriod_Id_RevisionMastId] UNIQUE ([Id],[RevisionMastId])
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionPeriod_Revision_PeriodNo]
ON [PTIS].[RevisionPeriod]([RevisionMastId],[PeriodNo])
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPeriod_Revision_Dates]
ON [PTIS].[RevisionPeriod]([RevisionMastId],[EffectiveFrom],[EffectiveTo])
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


/****** Object:  Table [PTIS].[RevisionPropertyMast] ******/
CREATE TABLE [PTIS].[RevisionPropertyMast]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [SourcePropertyId] INT NOT NULL,

    [TaxZoneId] INT NOT NULL,
    [WardId] INT NOT NULL,
    [PropertyNo] NVARCHAR(10) NULL,
    [PartitionNo] NVARCHAR(10) NULL,
    [PropertySeqNo] INT NOT NULL,
    [PropertyTypeId] INT NULL,
    [UPICId] NVARCHAR(30) NULL,
    [OpenPlot] BIT NULL,
    [MoujaId] INT NULL,
    [CSN] NVARCHAR(30) NULL,
    [SubZoneNo] NVARCHAR(20) NULL,
    [PlotNo] NVARCHAR(20) NULL,
    [CategoryId] INT NULL,
    [Type] INT NULL,
    [OccupierTypeId] INT NULL,
    [OwnerTitle] NVARCHAR(20) NULL,
    [OwnerName] NVARCHAR(1000) NULL,
    [OccupierTitle] NVARCHAR(20) NULL,
    [OccupierName] NVARCHAR(1000) NULL,
    [FlatOrShopNo] NVARCHAR(100) NULL,
    [FlatOrShopName] NVARCHAR(200) NULL,
    [Address] NVARCHAR(500) NULL,
    [PinCode] VARCHAR(6) NULL,
    [Location] NVARCHAR(200) NULL,
    [MobileNo] VARCHAR(13) NULL,
    [MobileNoRemarkId] INT NULL,
    [AlternateMobileNo] VARCHAR(13) NULL,
    [OccupierMobileNo] VARCHAR(13) NULL,
    [OccupierMobileNoRemarkId] INT NULL,
    [EmailId] NVARCHAR(100) NULL,
    [WingDetailId] INT NULL,
    [OwnerTitleEnglish] NVARCHAR(20) NULL,
    [OwnerNameEnglish] NVARCHAR(1000) NULL,
    [OccupierTitleEnglish] NVARCHAR(20) NULL,
    [OccupierNameEnglish] NVARCHAR(1000) NULL,
    [FlatOrShopNoEnglish] NVARCHAR(100) NULL,
    [FlatOrShopNameEnglish] NVARCHAR(200) NULL,
    [AddressEnglish] NVARCHAR(500) NULL,
    [LocationEnglish] NVARCHAR(200) NULL,
    [PropertyAssessmentStatusId] INT NULL,
    [PropertyFloorId] INT NULL,
	[IsVirtualProperty] [bit] NOT NULL CONSTRAINT [DF_RevisionPropertyMast_IsVirtualProperty] DEFAULT (0),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyMast_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyMast_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPropertyMast_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPropertyMast] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionPropertyMast_Id_Revision] UNIQUE ([Id],[RevisionMastId]),
    CONSTRAINT [UQ_RevisionPropertyMast_Id_Revision_Period] UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionPropertyMast_RevisionMast]
        FOREIGN KEY ([RevisionMastId],[SourcePropertyId])
        REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionPropertyMast_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyMast_TaxZoneMaster]
        FOREIGN KEY ([TaxZoneId]) REFERENCES [PTIS].[TaxZoneMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyMast_WardMaster]
        FOREIGN KEY ([WardId]) REFERENCES [PTIS].[WardMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyMast_PropertyTypeMaster]
        FOREIGN KEY ([PropertyTypeId]) REFERENCES [PTIS].[PropertyTypeMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyMast_MoujaMaster]
        FOREIGN KEY ([MoujaId]) REFERENCES [PTIS].[MoujaMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyMast_PropertyCategoryMaster]
        FOREIGN KEY ([CategoryId]) REFERENCES [PTIS].[PropertyCategoryMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyMast_WingDetailsMast]
        FOREIGN KEY ([WingDetailId]) REFERENCES [PTIS].[WingDetailsMast]([Id]),
    CONSTRAINT [FK_RevisionPropertyMast_PropertyAssessmentStatusMaster]
        FOREIGN KEY ([PropertyAssessmentStatusId]) REFERENCES [PTIS].[PropertyAssessmentStatusMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyMast_FloorMaster]
        FOREIGN KEY ([PropertyFloorId]) REFERENCES [PTIS].[FloorMaster]([Id]),
	
    CONSTRAINT [FK_RevisionPropertyMast_OccupierTypeMaster]
        FOREIGN KEY ([OccupierTypeId]) REFERENCES [PTIS].[OwnerTypeMaster]([Id])
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionPropertyMast_History]
ON [PTIS].[RevisionPropertyMast]([RevisionMastId])
WHERE [RevisionPeriodId] IS NULL AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionPropertyMast_Period]
ON [PTIS].[RevisionPropertyMast]([RevisionMastId],[RevisionPeriodId])
WHERE [RevisionPeriodId] IS NOT NULL AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


/****** Object:  Table [PTIS].[RevisionPropertyMastDetails] ******/
CREATE TABLE [PTIS].[RevisionPropertyMastDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyMastId] BIGINT NOT NULL,
    [SourcePropertyMastDetailsId] INT NULL,

    [OwnerTypeId] INT NULL,
    [AssessmentRemark] NVARCHAR(400) NULL,
    [SurveyRemark] NVARCHAR(400) NULL,
    [OwnerSignRemarkId] INT NULL,
    [FlatSystemRemark] NVARCHAR(400) NULL,
    [CombPropRemark] NVARCHAR(400) NULL,
    [AdharCardNo] VARCHAR(12) NULL,
    [RenterMobileNo] VARCHAR(13) NULL,
    [PrarupYadiPublishDate] DATETIME NULL,
    [AntimYadiPublishDate] DATETIME NULL,
    [PropertyRegDate] DATETIME NULL,
    [ApplyTaxesFrom] SMALLINT NULL,
    [PartOCDate] DATETIME NULL,
    [BHK] NVARCHAR(50) NULL,
    [BlockNo] NVARCHAR(20) NULL,
    [AlternetivEmailId] VARCHAR(100) NULL,
    [TotalBuiltupAreaSqFeet] DECIMAL(18,4) NULL,
    [TotalBuiltupAreaSqMeter] DECIMAL(18,4) NULL,
    [Latitude] VARCHAR(20) NULL,
    [Longitude] VARCHAR(20) NULL,
    [NoOfResidentialToilets] INT NULL,
    [NoOfCommercialToilets] INT NULL,
    [UnitGenerationType] VARCHAR(4) NULL,

    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyMastDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyMastDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPropertyMastDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPropertyMastDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionPropertyMastDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionPropertyMastDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyMastDetails_RevisionPropertyMast]
        FOREIGN KEY ([RevisionPropertyMastId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyMast]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionPropertyMastDetails_RevisionPropertyMast_Revision]
        FOREIGN KEY ([RevisionPropertyMastId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyMast]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyMastDetails_OwnerTypeMaster]
        FOREIGN KEY ([OwnerTypeId]) REFERENCES [PTIS].[OwnerTypeMaster]([Id])
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionPropertyMastDetails_PropertyMast]
ON [PTIS].[RevisionPropertyMastDetails]([RevisionPropertyMastId])
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO




/****** Object:  Table [PTIS].[RevisionPropertyDetails] ******/
CREATE TABLE [PTIS].[RevisionPropertyDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyMastId] BIGINT NOT NULL,
    [SourcePropertyDetailsId] INT NULL,
    [DetailSequenceNo] INT NOT NULL CONSTRAINT [DF_RevisionPropertyDetails_DetailSequenceNo] DEFAULT (1),
    [IsTaxable] BIT NULL,
    [FloorId] INT NOT NULL,
    [SubFloorId] INT NULL,
    [ConstructionYear] VARCHAR(4) NULL,
    [AssessmentYear] NVARCHAR(4) NULL,
    [ConstructionTypeId] INT NOT NULL,
    [TypeOfUseId] INT NOT NULL,
    [SubTypeOfUseId] INT NULL,
    [CarpetAreaSqMeter] DECIMAL(18,4) NULL,
    [CarpetAreaSqFeet] DECIMAL(18,4) NULL,
    [BuiltupAreaSqMeter] DECIMAL(18,4) NULL,
    [BuiltupAreaSqFeet] DECIMAL(18,4) NULL,
    [NoOfRooms] INT NULL,
    [IsRenter] BIT NULL,
    [IsOpenPlot] BIT NULL,
    [ChangeDetectionYear] INT NULL,

    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPropertyDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPropertyDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionPropertyDetails_Id_Revision] UNIQUE ([Id],[RevisionMastId]),
    CONSTRAINT [UQ_RevisionPropertyDetails_Id_Revision_Period] UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionPropertyDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionPropertyDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyDetails_RevisionPropertyMast]
        FOREIGN KEY ([RevisionPropertyMastId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyMast]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionPropertyDetails_RevisionPropertyMast_Revision]
        FOREIGN KEY ([RevisionPropertyMastId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyMast]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyDetails_FloorMaster]
        FOREIGN KEY ([FloorId]) REFERENCES [PTIS].[FloorMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyDetails_SubFloorMaster]
        FOREIGN KEY ([SubFloorId]) REFERENCES [PTIS].[SubFloorMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyDetails_ConstructionTypeMaster]
        FOREIGN KEY ([ConstructionTypeId]) REFERENCES [PTIS].[ConstructionTypeMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyDetails_TypeOfUseMaster]
        FOREIGN KEY ([TypeOfUseId]) REFERENCES [PTIS].[TypeOfUseMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyDetails_SubTypeOfUseMaster]
        FOREIGN KEY ([SubTypeOfUseId]) REFERENCES [PTIS].[SubTypeOfUseMaster]([Id]),
    CONSTRAINT [CK_RevisionPropertyDetails_Areas_NonNegative]
        CHECK (
            ([CarpetAreaSqMeter] IS NULL OR [CarpetAreaSqMeter] >= 0)
            AND ([CarpetAreaSqFeet] IS NULL OR [CarpetAreaSqFeet] >= 0)
            AND ([BuiltupAreaSqMeter] IS NULL OR [BuiltupAreaSqMeter] >= 0)
            AND ([BuiltupAreaSqFeet] IS NULL OR [BuiltupAreaSqFeet] >= 0)
        ),
    CONSTRAINT [CK_RevisionPropertyDetails_NoOfRooms_NonNegative]
        CHECK ([NoOfRooms] IS NULL OR [NoOfRooms] >= 0),
    CONSTRAINT [CK_RevisionPropertyDetails_DetailSequenceNo]
        CHECK ([DetailSequenceNo] > 0)
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionPropertyDetails_Sequence]
ON [PTIS].[RevisionPropertyDetails]([RevisionPropertyMastId],[DetailSequenceNo])
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPropertyDetails_Source]
ON [PTIS].[RevisionPropertyDetails]([SourcePropertyDetailsId])
WHERE [SourcePropertyDetailsId] IS NOT NULL;
GO


/****** Object:  Table [PTIS].[RevisionRenterMast] ******/
CREATE TABLE [PTIS].[RevisionRenterMast]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyDetailsId] BIGINT NOT NULL,
    [SourceRenterMastId] INT NULL,
    [RentMonthly] DECIMAL(19,4) NULL,
    [FinalYearlyRent] DECIMAL(19,4) NULL,
    [FinancialYear] NVARCHAR(4) NULL,
    [DurationFrom] DATETIME NULL,
    [DurationTo] DATETIME NULL,
    [TaxLiability] NVARCHAR(20) NULL,
    [NonCalculateRentMonthly] DECIMAL(19,4) NULL,
    [RenterNameEnglish] NVARCHAR(500) NULL,
    [RenterName] NVARCHAR(500) NULL,
    [AgreementDate] DATETIME NULL,
    [AgreementFromDate] DATETIME NULL,
    [AgreementToDate] DATETIME NULL,
    [DocumentBindingId] INT NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionRenterMast_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionRenterMast_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
	[CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionRenterMast_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionRenterMast] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionRenterMast_Id_Revision] UNIQUE ([Id],[RevisionMastId]),
    CONSTRAINT [UQ_RevisionRenterMast_Id_Revision_Period] UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [UQ_RevisionRenterMast_Id_Revision_PropertyDetails] UNIQUE ([Id],[RevisionMastId],[RevisionPropertyDetailsId]),
    CONSTRAINT [UQ_RevisionRenterMast_Id_Revision_Period_PropertyDetails] UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId],[RevisionPropertyDetailsId]),
    CONSTRAINT [FK_RevisionRenterMast_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionRenterMast_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRenterMast_RevisionPropertyDetails]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRenterMast_RevisionPropertyDetails_Revision]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRenterMast_DocumentBinding]
        FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]),
    CONSTRAINT [CK_RevisionRenterMast_DurationDates]
        CHECK ([DurationFrom] IS NULL OR [DurationTo] IS NULL OR [DurationTo] >= [DurationFrom]),
    CONSTRAINT [CK_RevisionRenterMast_AgreementDates]
        CHECK ([AgreementFromDate] IS NULL OR [AgreementToDate] IS NULL OR [AgreementToDate] >= [AgreementFromDate])
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionRenterMast_PropertyDetails]
ON [PTIS].[RevisionRenterMast]([RevisionPropertyDetailsId])
INCLUDE ([RentMonthly],[FinalYearlyRent],[RenterName],[RenterNameEnglish],
         [AgreementFromDate],[AgreementToDate]);
GO

CREATE NONCLUSTERED INDEX [IX_RevisionRenterMast_DocumentBindingId]
ON [PTIS].[RevisionRenterMast]([DocumentBindingId])
WHERE [DocumentBindingId] IS NOT NULL;
GO


/****** Object:  Table [PTIS].[RevisionRenterDetails] ******/
CREATE TABLE [PTIS].[RevisionRenterDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyDetailsId] BIGINT NOT NULL,
    [RevisionRenterMastId] BIGINT NULL,
    [SourceRenterDetailsId] INT NULL,
    [AgreementId] NVARCHAR(25) NULL,
    [IncrementFrequency] NVARCHAR(35) NULL,
    [IncrementType] NVARCHAR(35) NULL,
    [IncrementValue] DECIMAL(19,4) NULL,
    [IncrementMethod] NVARCHAR(35) NULL,
    [DurationFrom] DATETIME NULL,
    [DurationTo] DATETIME NULL,
    [RentAmount] DECIMAL(19,4) NULL,
    [Increment] DECIMAL(19,4) NULL,
    [IncrementStatus] BIT NULL,
    [RentMonthly] DECIMAL(19,4) NULL,
    [CustomFromDate] DATETIME NULL,
    [CustomToDate] DATETIME NULL,
    [CustomIncrementType] NVARCHAR(100) NULL,
    [CustomIncrementValue] DECIMAL(19,4) NULL,
    [CustomMethod] NVARCHAR(100) NULL,

    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionRenterDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionRenterDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionRenterDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionRenterDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionRenterDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionRenterDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRenterDetails_RevisionPropertyDetails]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRenterDetails_RevisionPropertyDetails_Revision]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId]),
CONSTRAINT [FK_RevisionRenterDetails_RenterMast_PropertyDetails]
    FOREIGN KEY
    (
        [RevisionRenterMastId],
        [RevisionMastId],
        [RevisionPropertyDetailsId]
    )
    REFERENCES [PTIS].[RevisionRenterMast]
    (
        [Id],
        [RevisionMastId],
        [RevisionPropertyDetailsId]
    ),

CONSTRAINT [FK_RevisionRenterDetails_RenterMast_Period_PropertyDetails]
    FOREIGN KEY
    (
        [RevisionRenterMastId],
        [RevisionMastId],
        [RevisionPeriodId],
        [RevisionPropertyDetailsId]
    )
    REFERENCES [PTIS].[RevisionRenterMast]
    (
        [Id],
        [RevisionMastId],
        [RevisionPeriodId],
        [RevisionPropertyDetailsId]
    ),
    CONSTRAINT [CK_RevisionRenterDetails_DurationDates]
        CHECK ([DurationFrom] IS NULL OR [DurationTo] IS NULL OR [DurationTo] >= [DurationFrom]),
    CONSTRAINT [CK_RevisionRenterDetails_CustomDates]
        CHECK ([CustomFromDate] IS NULL OR [CustomToDate] IS NULL OR [CustomToDate] >= [CustomFromDate])
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionRenterDetails_PropertyDetails]
ON [PTIS].[RevisionRenterDetails]([RevisionPropertyDetailsId]);
GO


/****** Object:  Table [PTIS].[RevisionRoomWiseSubmissionDetails] ******/
CREATE TABLE [PTIS].[RevisionRoomWiseSubmissionDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyMastId] BIGINT NOT NULL,
    [RevisionPropertyDetailsId] BIGINT NULL,
    [SourceRoomWiseSubmissionDetailsId] INT NULL,
    [LengthMtr] DECIMAL(18,4) NULL,
    [WidthMtr] DECIMAL(18,4) NULL,
    [AreaSqMtr] DECIMAL(18,4) NULL,
    [HeightMtr] DECIMAL(18,4) NULL,
    [Base1Mtr] DECIMAL(18,4) NULL,
    [Base2Mtr] DECIMAL(18,4) NULL,
    [NoOfRooms] INT NULL,
    [TotalAreaSqMtr] DECIMAL(18,4) NULL,
    [Shape] NVARCHAR(25) NULL,
    [RoomNo] NVARCHAR(100) NULL,
    [OuterYesNo] BIT NOT NULL CONSTRAINT [DF_RevisionRoomWiseSubmissionDetails_OuterYesNo] DEFAULT (0),
    [RoomTypeId] INT NULL,
    [SubmissionType] NVARCHAR(100) NULL,
    [MinusYesNo] BIT NOT NULL CONSTRAINT [DF_RevisionRoomWiseSubmissionDetails_MinusYesNo] DEFAULT (0),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionRoomWiseSubmissionDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionRoomWiseSubmissionDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionRoomWiseSubmissionDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionRoomWiseSubmissionDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionRoomWiseSubmissionDetails_Id_Revision] UNIQUE ([Id],[RevisionMastId]),
    CONSTRAINT [UQ_RevisionRoomWiseSubmissionDetails_Id_Revision_Period] UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRoomWiseSubmissionDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionRoomWiseSubmissionDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRoomWiseSubmissionDetails_RevisionPropertyMast]
        FOREIGN KEY ([RevisionPropertyMastId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyMast]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRoomWiseSubmissionDetails_RevisionPropertyMast_Revision]
        FOREIGN KEY ([RevisionPropertyMastId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyMast]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRoomWiseSubmissionDetails_RevisionPropertyDetails]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRoomWiseSubmissionDetails_RevisionPropertyDetails_Revision]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRoomWiseSubmissionDetails_RoomTypeMaster]
        FOREIGN KEY ([RoomTypeId]) REFERENCES [PTIS].[RoomTypeMaster]([Id])
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionRoomWiseSubmissionDetails_PropertyDetails]
ON [PTIS].[RevisionRoomWiseSubmissionDetails]([RevisionPropertyDetailsId])
WHERE [RevisionPropertyDetailsId] IS NOT NULL;
GO


/****** Object:  Table [PTIS].[RevisionRoomWiseMinusData] ******/
CREATE TABLE [PTIS].[RevisionRoomWiseMinusData]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionRoomWiseSubmissionId] BIGINT NOT NULL,
    [SourceRoomWiseMinusDataId] INT NULL,
    [LengthMtr] DECIMAL(18,4) NULL,
    [WidthMtr] DECIMAL(18,4) NULL,
    [AreaSqMtr] DECIMAL(18,4) NULL,
    [HeightMtr] DECIMAL(18,4) NULL,
    [Base1Mtr] DECIMAL(18,4) NULL,
    [Base2Mtr] DECIMAL(18,4) NULL,
    [Shape] NVARCHAR(25) NULL,
    [IsOffset] BIT NOT NULL CONSTRAINT [DF_RevisionRoomWiseMinusData_IsOffset] DEFAULT (0),

    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionRoomWiseMinusData_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionRoomWiseMinusData_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionRoomWiseMinusData_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionRoomWiseMinusData] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionRoomWiseMinusData_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionRoomWiseMinusData_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRoomWiseMinusData_RevisionRoomWiseSubmissionDetails]
        FOREIGN KEY ([RevisionRoomWiseSubmissionId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionRoomWiseSubmissionDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRoomWiseMinusData_RevisionRoomWiseSubmissionDetails_Revision]
        FOREIGN KEY ([RevisionRoomWiseSubmissionId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionRoomWiseSubmissionDetails]([Id],[RevisionMastId])
) ON [PRIMARY];
GO


/****** Object:  Table [PTIS].[RevisionPropertySocialDetails] ******/
CREATE TABLE [PTIS].[RevisionPropertySocialDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [SourcePropertySocialDetailsId] INT NULL,
    [EntityType] CHAR(1) NOT NULL,
    [SocietyDetailId] INT NULL,
    [WingDetailId] INT NULL,
    [PropertyId] INT NULL,
    [SocialAttributeId] INT NOT NULL,
    [BitValue] BIT NULL,
    [IntValue] INT NULL,
    [DecimalValue] DECIMAL(18,2) NULL,
    [TextValue] NVARCHAR(500) NULL,
    [DateValue] DATE NULL,
    [DocumentBindingId] INT NULL,
    [Remark] NVARCHAR(500) NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPropertySocialDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPropertySocialDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPropertySocialDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPropertySocialDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionPropertySocialDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionPropertySocialDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertySocialDetails_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId])
        REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionPropertySocialDetails_SocialAttributeMaster]
        FOREIGN KEY ([SocialAttributeId]) REFERENCES [PTIS].[SocialAttributeMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertySocialDetails_DocumentBinding]
        FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]),
    CONSTRAINT [CK_RevisionPropertySocialDetails_EntityScope]
         CHECK (
             ([EntityType] = 'S' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NULL AND [PropertyId] IS NULL) OR
             ([EntityType] = 'W' AND [SocietyDetailId] IS NULL AND [WingDetailId] IS NOT NULL AND [PropertyId] IS NULL) OR
             ([EntityType] = 'P' AND [SocietyDetailId] IS NULL AND [WingDetailId] IS NULL AND [PropertyId] IS NOT NULL)
         )
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPropertySocialDetails_Revision]
ON [PTIS].[RevisionPropertySocialDetails]([RevisionMastId],[RevisionPeriodId])
INCLUDE ([EntityType],[SocialAttributeId]);
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPropertySocialDetails_DocumentBindingId]
ON [PTIS].[RevisionPropertySocialDetails]([DocumentBindingId])
WHERE [DocumentBindingId] IS NOT NULL;
GO


/****** Object:  Table [PTIS].[RevisionPropertyCertificates] ******/
CREATE TABLE [PTIS].[RevisionPropertyCertificates]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyDetailsId] BIGINT NULL,
    [SourcePropertyCertificateId] INT NULL,
    [SourcePropertyDetailsId] INT NULL,
    [EntityType] CHAR(1) NOT NULL,
    [SocietyDetailId] INT NULL,
    [WingDetailId] INT NULL,
    [PropertyId] INT NULL,
    [CertificateTypeId] INT NOT NULL,
    [CertificateNo] NVARCHAR(100) NULL,
    [CertificateIssueDate] DATE NULL,
    [DocumentBindingId] INT NULL,
    [TaxApplied] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyCertificates_TaxApplied] DEFAULT (0),
    [TaxAppliedDate] DATETIME NULL,

    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyCertificates_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyCertificates_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPropertyCertificates_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    [RowVersion] ROWVERSION NOT NULL,

    CONSTRAINT [PK_RevisionPropertyCertificates] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionPropertyCertificates_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionPropertyCertificates_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyCertificates_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId])
        REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionPropertyCertificates_RevisionPropertyDetails]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionPropertyCertificates_RevisionPropertyDetails_Revision]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyCertificates_CertificateType]
        FOREIGN KEY ([CertificateTypeId]) REFERENCES [PTIS].[PropertyCertificateTypeMaster]([Id]),
    CONSTRAINT [FK_RevisionPropertyCertificates_DocumentBinding]
        FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]),
    CONSTRAINT [CK_RevisionPropertyCertificates_TaxAppliedDate]
        CHECK ([TaxApplied] = 0 OR [TaxAppliedDate] IS NOT NULL),
   CONSTRAINT [CK_RevisionPropertyCertificates_EntityScope]
         CHECK (
             ([EntityType] = 'S' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NULL AND [PropertyId] IS NULL AND [RevisionPropertyDetailsId] IS NULL) OR
             ([EntityType] = 'W' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NOT NULL AND [PropertyId] IS NULL AND [RevisionPropertyDetailsId] IS NULL) OR
             ([EntityType] = 'P' AND [PropertyId] IS NOT NULL)
         )
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPropertyCertificates_Revision]
ON [PTIS].[RevisionPropertyCertificates]([RevisionMastId],[RevisionPeriodId],[CertificateTypeId]);
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPropertyCertificates_DocumentBindingId]
ON [PTIS].[RevisionPropertyCertificates]([DocumentBindingId])
WHERE [DocumentBindingId] IS NOT NULL;
GO


/****** Object:  Table [PTIS].[RevisionPropertyPhoto] ******/
CREATE TABLE [PTIS].[RevisionPropertyPhoto]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [SourcePropertyPhotoId] INT NULL,
    [EntityType] CHAR(1) NOT NULL,
    [SocietyDetailId] INT NULL,
    [WingDetailId] INT NULL,
    [PropertyId] INT NULL,
    [Type] NVARCHAR(50) NULL,
    [PhotoTypeId] INT NOT NULL,
    [DocumentBindingId] INT NULL,
    [IsLatest] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyPhoto_IsLatest] DEFAULT (1),
    [DisplayOrder] INT NULL,
    [Remarks] NVARCHAR(500) NULL,

    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyPhoto_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPropertyPhoto_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPropertyPhoto_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPropertyPhoto] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionPropertyPhoto_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionPropertyPhoto_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPropertyPhoto_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId])
        REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionPropertyPhoto_PhotoType]
        FOREIGN KEY ([PhotoTypeId]) REFERENCES [PTIS].[PropertyPhotoType]([Id]),
    CONSTRAINT [FK_RevisionPropertyPhoto_DocumentBinding]
        FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]),
     CONSTRAINT [CK_RevisionPropertyPhoto_EntityScope]
         CHECK (
             ([EntityType] = 'S' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NULL AND [PropertyId] IS NULL) OR
             ([EntityType] = 'W' AND [SocietyDetailId] IS NOT NULL AND [WingDetailId] IS NOT NULL AND [PropertyId] IS NULL) OR
             ([EntityType] = 'P' AND [PropertyId] IS NOT NULL)
         )
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPropertyPhoto_Revision]
ON [PTIS].[RevisionPropertyPhoto]([RevisionMastId],[RevisionPeriodId],[PhotoTypeId])
INCLUDE ([DocumentBindingId],[DisplayOrder]);
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPropertyPhoto_DocumentBindingId]
ON [PTIS].[RevisionPropertyPhoto]([DocumentBindingId])
WHERE [DocumentBindingId] IS NOT NULL;
GO


/****** Object:  Table [PTIS].[RevisionDocumentDetails] ******/
CREATE TABLE [PTIS].[RevisionDocumentDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyDetailsId] BIGINT NULL,
    [DocumentBindingId] INT NOT NULL,
    [DocumentTypeCode] VARCHAR(50) NOT NULL,
    [DocumentTitle] NVARCHAR(200) NULL,
    [DocumentStage] VARCHAR(20) NOT NULL CONSTRAINT [DF_RevisionDocumentDetails_DocumentStage] DEFAULT ('SUPPORTING'),
    [Remarks] NVARCHAR(500) NULL,

    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionDocumentDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionDocumentDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionDocumentDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionDocumentDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionDocumentDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionDocumentDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionDocumentDetails_RevisionPropertyDetails]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionDocumentDetails_RevisionPropertyDetails_Revision]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionDocumentDetails_DocumentBinding]
        FOREIGN KEY ([DocumentBindingId]) REFERENCES [CORE].[DocumentBinding]([Id]),
    CONSTRAINT [CK_RevisionDocumentDetails_DocumentStage]
        CHECK ([DocumentStage] IN ('BEFORE','AFTER','SUPPORTING','APPROVAL','ORDER','REPORT'))
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionDocumentDetails_Revision]
ON [PTIS].[RevisionDocumentDetails]([RevisionMastId],[RevisionPeriodId],[DocumentTypeCode]);
GO


/****** Object:  Table [PTIS].[RevisionRVCalculationResults] ******/
CREATE TABLE [PTIS].[RevisionRVCalculationResults]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [PropertyId] INT NOT NULL,
    [RevisionPropertyDetailsId] BIGINT NOT NULL,
    [SourceRVCalculationResultsId] INT NULL,
    [MonthlyRate] DECIMAL(19,6) NULL,
    [YearlyRate] DECIMAL(19,6) NULL,
    [YearlyRent] DECIMAL(19,4) NULL,
    [AppliedOn] VARCHAR(20) NULL,
    [Depreciation] DECIMAL(19,4) NULL,
    [DepreciationPer] DECIMAL(18,2) NULL,
    [AnnualRentalValue] DECIMAL(19,4) NULL,
    [Maintenance] DECIMAL(19,4) NULL,
    [RateableValue] DECIMAL(19,6) NULL,
    [REducationTax] DECIMAL(19,4) NULL,
    [CEducationTax] DECIMAL(19,4) NULL,
    [CEmploymentTax] DECIMAL(19,4) NULL,
    [TotalAreaSqMtr] DECIMAL(18,4) NULL,
    [RAreaSqMtr] DECIMAL(18,4) NULL,
    [CAreaSqlMtr] DECIMAL(18,4) NULL,
    [ProrationFactor] DECIMAL(18,10) NULL,
    [PeriodAnnualRentalValue] DECIMAL(18,2) NULL,
    [PeriodRateableValue] DECIMAL(18,2) NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionRVCalculationResults_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionRVCalculationResults_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionRVCalculationResults_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionRVCalculationResults] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionRVCalculationResults_Id_Revision] UNIQUE ([Id],[RevisionMastId]),
    CONSTRAINT [UQ_RevisionRVCalculationResults_Id_Revision_Period] UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRVCalculationResults_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId]) REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionRVCalculationResults_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRVCalculationResults_RevisionPropertyDetails]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRVCalculationResults_RevisionPropertyDetails_Revision]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId]),
    CONSTRAINT [CK_RevisionRVCalculationResults_ProrationFactor]
        CHECK ([ProrationFactor] IS NULL OR ([ProrationFactor] >= 0 AND [ProrationFactor] <= 1))
) ON [PRIMARY];
GO

CREATE NONCLUSTERED INDEX [IX_RevisionRVCalculationResults_Property]
ON [PTIS].[RevisionRVCalculationResults]([RevisionMastId],[RevisionPeriodId],[RevisionPropertyDetailsId])
INCLUDE ([AnnualRentalValue],[RateableValue],[PeriodAnnualRentalValue],[PeriodRateableValue]);
GO


/****** Object:  Table [PTIS].[RevisionRVCalculationTaxDetails] ******/
CREATE TABLE [PTIS].[RevisionRVCalculationTaxDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionRVCalculationResultsId] BIGINT NOT NULL,
    [SourceRVCalculationTaxDetailsId] INT NULL,
    [TaxId] INT NOT NULL,
    [TaxPercentage] DECIMAL(9,4) NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
    [ProrationMethod] VARCHAR(30) NOT NULL CONSTRAINT [DF_RevisionRVCalculationTaxDetails_ProrationMethod] DEFAULT ('NO_PRORATION'),
    [PeriodDays] INT NULL,
    [YearDays] INT NULL,
    [ProrationFactor] DECIMAL(18,10) NOT NULL CONSTRAINT [DF_RevisionRVCalculationTaxDetails_ProrationFactor] DEFAULT (1),
    [PeriodTaxAmount] DECIMAL(18,2) NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionRVCalculationTaxDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionRVCalculationTaxDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionRVCalculationTaxDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionRVCalculationTaxDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionRVCalculationTaxDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_RevisionRVCalculationTaxDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRVCalculationTaxDetails_RVResult]
        FOREIGN KEY ([RevisionRVCalculationResultsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionRVCalculationResults]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionRVCalculationTaxDetails_RVResult_Revision]
        FOREIGN KEY ([RevisionRVCalculationResultsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionRVCalculationResults]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionRVCalculationTaxDetails_TaxMaster]
        FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster]([Id]),
    CONSTRAINT [CK_RevisionRVCalculationTaxDetails_ProrationMethod]
        CHECK ([ProrationMethod] IN
              ('NO_PRORATION','DAY_WISE','MONTH_WISE','FULL_YEAR',
               'FROM_EFFECTIVE_MONTH','FROM_NEXT_MONTH')),
    CONSTRAINT [CK_RevisionRVCalculationTaxDetails_ProrationFactor]
        CHECK ([ProrationFactor] >= 0 AND [ProrationFactor] <= 1),
    CONSTRAINT [CK_RevisionRVCalculationTaxDetails_Days]
        CHECK (
            ([PeriodDays] IS NULL OR [PeriodDays] > 0)
            AND ([YearDays] IS NULL OR [YearDays] > 0)
            AND ([PeriodDays] IS NULL OR [YearDays] IS NULL OR [PeriodDays] <= [YearDays])
        )
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionRVCalculationTaxDetails_Result_Tax]
ON [PTIS].[RevisionRVCalculationTaxDetails]([RevisionRVCalculationResultsId],[TaxId])
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


/****** Object:  Table [PTIS].[RevisionPropertyTaxCalculationCVResults] ******/
CREATE TABLE [PTIS].[RevisionPropertyTaxCalculationCVResults]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [RevisionPropertyDetailsId] BIGINT NOT NULL,
    [PropertyId] INT NOT NULL,
    [SourcePropertyTaxCalculationCVResultsId] BIGINT NULL,
    [RateCVMasterId] INT NOT NULL,
    [TaxId] INT NOT NULL,
    [BaseValue] DECIMAL(19,4) NULL,
    [FloorFactorCVId] INT NULL,
    [AgeFactorCVId] INT NULL,
    [NatureFactorCVId] INT NULL,
    [UseFactorCVId] INT NULL,
    [CapitalValue] DECIMAL(19,4) NULL,
    [TaxPercentage] DECIMAL(9,4) NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
    [CVInputHash] NVARCHAR(100) NULL,
    [ProrationMethod] VARCHAR(30) NOT NULL CONSTRAINT [DF_RevisionCVResults_ProrationMethod] DEFAULT ('NO_PRORATION'),
    [PeriodDays] INT NULL,
    [YearDays] INT NULL,
    [ProrationFactor] DECIMAL(18,10) NOT NULL CONSTRAINT [DF_RevisionCVResults_ProrationFactor] DEFAULT (1),
    [PeriodCapitalValue] DECIMAL(18,2) NULL,
    [PeriodTaxAmount] DECIMAL(18,2) NULL,
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionCVResults_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionCVResults_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionCVResults_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPropertyTaxCalculationCVResults] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionCVResults_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId]) REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionCVResults_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionCVResults_RevisionPropertyDetails]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionCVResults_RevisionPropertyDetails_Revision]
        FOREIGN KEY ([RevisionPropertyDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPropertyDetails]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionCVResults_RateCVMaster]
        FOREIGN KEY ([RateCVMasterId]) REFERENCES [PTIS].[RateCVMaster]([Id]),
    CONSTRAINT [FK_RevisionCVResults_TaxMaster]
        FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster]([Id]),
    CONSTRAINT [FK_RevisionCVResults_FloorFactor]
        FOREIGN KEY ([FloorFactorCVId]) REFERENCES [PTIS].[FloorFactorCVMaster]([Id]),
    CONSTRAINT [FK_RevisionCVResults_AgeFactor]
        FOREIGN KEY ([AgeFactorCVId]) REFERENCES [PTIS].[AgeFactorCVMaster]([Id]),
    CONSTRAINT [FK_RevisionCVResults_NatureFactor]
        FOREIGN KEY ([NatureFactorCVId]) REFERENCES [PTIS].[NatureFactorCVMaster]([Id]),
    CONSTRAINT [FK_RevisionCVResults_UseFactor]
        FOREIGN KEY ([UseFactorCVId]) REFERENCES [PTIS].[UseFactorCVMaster]([Id]),
    CONSTRAINT [CK_RevisionCVResults_ProrationMethod]
        CHECK ([ProrationMethod] IN
              ('NO_PRORATION','DAY_WISE','MONTH_WISE','FULL_YEAR',
               'FROM_EFFECTIVE_MONTH','FROM_NEXT_MONTH')),
    CONSTRAINT [CK_RevisionCVResults_ProrationFactor]
        CHECK ([ProrationFactor] >= 0 AND [ProrationFactor] <= 1),
    CONSTRAINT [CK_RevisionCVResults_Days]
        CHECK (
            ([PeriodDays] IS NULL OR [PeriodDays] > 0)
            AND ([YearDays] IS NULL OR [YearDays] > 0)
            AND ([PeriodDays] IS NULL OR [YearDays] IS NULL OR [PeriodDays] <= [YearDays])
        )
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionCVResults_Detail_Tax]
ON [PTIS].[RevisionPropertyTaxCalculationCVResults]
   ([RevisionMastId],[RevisionPeriodId],[RevisionPropertyDetailsId],[TaxId])
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


/****** Object:  Table [PTIS].[RevisionPolicyTaxDetails] ******/
CREATE TABLE [PTIS].[RevisionPolicyTaxDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [PropertyId] INT NOT NULL,
    [SourcePolicyTaxDetailsId] INT NULL,
    [PolicyCodeId] INT NOT NULL,
    [AnnualCalculationValue] DECIMAL(19,4) NULL,
    [CalculationValue] DECIMAL(19,4) NULL,
    [TaxId] INT NOT NULL,
    [AnnualTaxAmount] DECIMAL(19,4) NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
    [IsCurrent] BIT NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetails_IsCurrent] DEFAULT (1),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPolicyTaxDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionPolicyTaxDetails_Id_Revision]
        UNIQUE ([Id],[RevisionMastId]),
    CONSTRAINT [UQ_RevisionPolicyTaxDetails_Id_Revision_Period]
        UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionPolicyTaxDetails_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId]) REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionPolicyTaxDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPolicyTaxDetails_PolicyCodeMaster]
        FOREIGN KEY ([PolicyCodeId]) REFERENCES [PTIS].[PolicyCodeMaster]([Id]),
    CONSTRAINT [FK_RevisionPolicyTaxDetails_TaxMaster]
        FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster]([Id])
) ON [PRIMARY];
GO

ALTER TABLE [PTIS].[RevisionPolicyTaxDetails]
ADD CONSTRAINT [UQ_RevisionPolicyTaxDetails_Id_Context]
UNIQUE
(
    [Id],
    [RevisionMastId],
    [PropertyId],
    [PolicyCodeId],
    [TaxId]
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionPolicyTaxDetails_Revision_Period_Policy_Tax]
ON [PTIS].[RevisionPolicyTaxDetails]
   ([RevisionMastId],[RevisionPeriodId],[PolicyCodeId],[TaxId])
WHERE [IsCurrent] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPolicyTaxDetails_Revision]
ON [PTIS].[RevisionPolicyTaxDetails]([RevisionMastId],[RevisionPeriodId])
INCLUDE ([PolicyCodeId],[TaxId],[CalculationValue],[TaxAmount]);
GO


/****** Object:  Table [PTIS].[RevisionPolicyTaxDetailsCV] ******/
CREATE TABLE [PTIS].[RevisionPolicyTaxDetailsCV]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [PropertyId] INT NOT NULL,
    [SourcePolicyTaxDetailsCVId] INT NULL,
    [PolicyCodeId] INT NOT NULL,
    [AnnualCalculationValue] DECIMAL(19,4) NULL,
    [CalculationValue] DECIMAL(19,4) NULL,
    [TaxId] INT NOT NULL,
    [AnnualTaxAmount] DECIMAL(19,4) NULL,
    [TaxAmount] DECIMAL(19,4) NULL,
    [IsCurrent] BIT NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetailsCV_IsCurrent] DEFAULT (1),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetailsCV_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetailsCV_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_RevisionPolicyTaxDetailsCV_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionPolicyTaxDetailsCV] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_RevisionPolicyTaxDetailsCV_Id_RevisionMastId]
        UNIQUE ([Id],[RevisionMastId]),
    CONSTRAINT [UQ_RevisionPolicyTaxDetailsCV_Id_RevisionMastId_Period]
        UNIQUE ([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_RevisionPolicyTaxDetailsCV_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId]) REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionPolicyTaxDetailsCV_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionPolicyTaxDetailsCV_PolicyCodeMaster]
        FOREIGN KEY ([PolicyCodeId]) REFERENCES [PTIS].[PolicyCodeMaster]([Id]),
    CONSTRAINT [FK_RevisionPolicyTaxDetailsCV_TaxMaster]
        FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster]([Id])
) ON [PRIMARY];
GO
ALTER TABLE [PTIS].[RevisionPolicyTaxDetailsCV]
ADD CONSTRAINT [UQ_RevisionPolicyTaxDetailsCV_Id_Context]
UNIQUE
(
    [Id],
    [RevisionMastId],
    [PropertyId],
    [PolicyCodeId],
    [TaxId]
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionPolicyTaxDetailsCV_Revision_Period_Policy_Tax]
ON [PTIS].[RevisionPolicyTaxDetailsCV]
   ([RevisionMastId],[RevisionPeriodId],[PolicyCodeId],[TaxId])
WHERE [IsCurrent] = 1 AND [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_RevisionPolicyTaxDetailsCV_Revision]
ON [PTIS].[RevisionPolicyTaxDetailsCV]([RevisionMastId],[RevisionPeriodId])
INCLUDE ([PolicyCodeId],[TaxId],[CalculationValue],[TaxAmount]);
GO


/****** Object:  Table [PTIS].[TransMastRevisionDetails] ******/
CREATE TABLE [PTIS].[TransMastRevisionDetails]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [TransMastId] INT NOT NULL,
    [PropertyId] INT NOT NULL,
    [FinanceYearId] INT NOT NULL,
    [PolicyCodeId] INT NOT NULL,
    [TaxId] INT NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [CalculationType] CHAR(2) NOT NULL,
    [RevisionPolicyTaxDetailsId] BIGINT NULL,
    [RevisionPolicyTaxDetailsCVId] BIGINT NULL,
    [AllocatedTaxAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_TransMastRevisionDetails_AllocatedTaxAmount] DEFAULT (0),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_TransMastRevisionDetails_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_TransMastRevisionDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_TransMastRevisionDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_TransMastRevisionDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_TransMastRevisionDetails_TransMast]
        FOREIGN KEY ([TransMastId]) REFERENCES [PTIS].[TransMast]([Id]),
    CONSTRAINT [FK_TransMastRevisionDetails_RevisionMast]
        FOREIGN KEY ([RevisionMastId]) REFERENCES [PTIS].[RevisionMast]([Id]),
    CONSTRAINT [FK_TransMastRevisionDetails_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_TransMastRevisionDetails_RevisionPolicyTaxDetails]
        FOREIGN KEY ([RevisionPolicyTaxDetailsId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPolicyTaxDetails]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_TransMastRevisionDetails_RevisionPolicyTaxDetails_Revision]
        FOREIGN KEY ([RevisionPolicyTaxDetailsId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPolicyTaxDetails]([Id],[RevisionMastId]),
    CONSTRAINT [FK_TransMastRevisionDetails_RevisionPolicyTaxDetailsCV]
        FOREIGN KEY ([RevisionPolicyTaxDetailsCVId],[RevisionMastId],[RevisionPeriodId])
        REFERENCES [PTIS].[RevisionPolicyTaxDetailsCV]([Id],[RevisionMastId],[RevisionPeriodId]),
    CONSTRAINT [FK_TransMastRevisionDetails_RevisionPolicyTaxDetailsCV_Revision]
        FOREIGN KEY ([RevisionPolicyTaxDetailsCVId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPolicyTaxDetailsCV]([Id],[RevisionMastId]),
    CONSTRAINT [CK_TransMastRevisionDetails_CalculationType]
        CHECK ([CalculationType] IN ('RV','CV')),
    CONSTRAINT [CK_TransMastRevisionDetails_ResultReference]
        CHECK (
            ([CalculationType] = 'RV'
             AND [RevisionPolicyTaxDetailsId] IS NOT NULL
             AND [RevisionPolicyTaxDetailsCVId] IS NULL)
            OR
            ([CalculationType] = 'CV'
             AND [RevisionPolicyTaxDetailsId] IS NULL
             AND [RevisionPolicyTaxDetailsCVId] IS NOT NULL)
        ),

    ---------------------------------------------------------
    -- TRANSACTION MUST MATCH ENTIRE CONTEXT
    ---------------------------------------------------------
    CONSTRAINT [FK_TransMastRevisionDetails_TransMast_Context]
        FOREIGN KEY
        (
            [TransMastId],
            [PropertyId],
            [FinanceYearId],
            [CalculationType],
            [PolicyCodeId],
            [TaxId]
        )
        REFERENCES [PTIS].[TransMast]
        (
            [Id],
            [PropertyId],
            [FinanceYearId],
            [CalculationType],
            [PolicyCodeId],
            [TaxId]
        ),

    ---------------------------------------------------------
    -- PROPERTY + FY MUST MATCH REVISION
    ---------------------------------------------------------
    CONSTRAINT [FK_TransMastRevisionDetails_Revision_Context]
        FOREIGN KEY
        (
            [RevisionMastId],
            [PropertyId],
            [FinanceYearId]
        )
        REFERENCES [PTIS].[RevisionMast]
        (
            [Id],
            [PropertyId],
            [FinanceYearId]
        ),

    ---------------------------------------------------------
    -- RV RESULT MUST MATCH REVISION / PROPERTY / POLICY / TAX
    ---------------------------------------------------------
    CONSTRAINT [FK_TransMastRevisionDetails_RVResult_Context]
        FOREIGN KEY
        (
            [RevisionPolicyTaxDetailsId],
            [RevisionMastId],
            [PropertyId],
            [PolicyCodeId],
            [TaxId]
        )
        REFERENCES [PTIS].[RevisionPolicyTaxDetails]
        (
            [Id],
            [RevisionMastId],
            [PropertyId],
            [PolicyCodeId],
            [TaxId]
        ),

    ---------------------------------------------------------
    -- CV RESULT MUST MATCH REVISION / PROPERTY / POLICY / TAX
    ---------------------------------------------------------
    CONSTRAINT [FK_TransMastRevisionDetails_CVResult_Context]
        FOREIGN KEY
        (
            [RevisionPolicyTaxDetailsCVId],
            [RevisionMastId],
            [PropertyId],
            [PolicyCodeId],
            [TaxId]
        )
        REFERENCES [PTIS].[RevisionPolicyTaxDetailsCV]
        (
            [Id],
            [RevisionMastId],
            [PropertyId],
            [PolicyCodeId],
            [TaxId]
        ),

    CONSTRAINT [CK_TransMastRevisionDetails_AllocatedTaxAmount]
        CHECK ([AllocatedTaxAmount] >= 0)
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_TransMastRevisionDetails_RV]
ON [PTIS].[TransMastRevisionDetails]([TransMastId],[RevisionPolicyTaxDetailsId])
WHERE [RevisionPolicyTaxDetailsId] IS NOT NULL
  AND [IsActive] = 1
  AND [MarkedForDeletion] = 0;
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_TransMastRevisionDetails_CV]
ON [PTIS].[TransMastRevisionDetails]([TransMastId],[RevisionPolicyTaxDetailsCVId])
WHERE [RevisionPolicyTaxDetailsCVId] IS NOT NULL
  AND [IsActive] = 1
  AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_TransMastRevisionDetails_Revision]
ON [PTIS].[TransMastRevisionDetails]([RevisionMastId],[RevisionPeriodId])
INCLUDE ([TransMastId],[CalculationType],[AllocatedTaxAmount]);
GO


/****** Object:  Table [PTIS].[RevisionApplyTaxesMaster] ******/
CREATE TABLE [PTIS].[RevisionApplyTaxesMaster]
(
    [Id] BIGINT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [RevisionMastId] BIGINT NOT NULL,
    [RevisionPeriodId] BIGINT NULL,
    [PropertyId] INT NOT NULL,
    [SourceApplyTaxesMasterId] INT NULL,
    [TaxId] INT NOT NULL,
    [MarkedForDeletion] BIT NOT NULL
        CONSTRAINT [DF_RevisionApplyTaxesMaster_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [IsActive] BIT NOT NULL
        CONSTRAINT [DF_RevisionApplyTaxesMaster_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL
        CONSTRAINT [DF_RevisionApplyTaxesMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,

    CONSTRAINT [PK_RevisionApplyTaxesMaster]
        PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RevisionApplyTaxesMaster_RevisionProperty]
        FOREIGN KEY ([RevisionMastId],[PropertyId])
        REFERENCES [PTIS].[RevisionMast]([Id],[PropertyId]),
    CONSTRAINT [FK_RevisionApplyTaxesMaster_RevisionPeriod]
        FOREIGN KEY ([RevisionPeriodId],[RevisionMastId])
        REFERENCES [PTIS].[RevisionPeriod]([Id],[RevisionMastId]),
    CONSTRAINT [FK_RevisionApplyTaxesMaster_TaxMaster]
        FOREIGN KEY ([TaxId]) REFERENCES [PTIS].[TaxMaster]([Id])
) ON [PRIMARY];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_RevisionApplyTaxesMaster_Revision_Period_Property_Tax]
ON [PTIS].[RevisionApplyTaxesMaster]
(
    [RevisionMastId],
    [RevisionPeriodId],
    [PropertyId],
    [TaxId]
)
WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO

CREATE NONCLUSTERED INDEX [IX_RevisionApplyTaxesMaster_Revision]
ON [PTIS].[RevisionApplyTaxesMaster]([RevisionMastId],[RevisionPeriodId])
INCLUDE ([PropertyId],[TaxId],[SourceApplyTaxesMasterId]);
GO

CREATE NONCLUSTERED INDEX [IX_RevisionApplyTaxesMaster_Source]
ON [PTIS].[RevisionApplyTaxesMaster]([SourceApplyTaxesMasterId])
WHERE [SourceApplyTaxesMasterId] IS NOT NULL;
GO

-------------- END OF PTIS-REVISION TABLES --------------

--------------- START OF COLLECTION TABLES -------------

/****** Object:  Table [PTIS].[BillBookMaster] ******/
CREATE TABLE [PTIS].[BillBookMaster] (
  [Id] INT IDENTITY(1, 1) NOT FOR REPLICATION NOT NULL, 
  [BillBookCode] VARCHAR(50) NOT NULL, 
  [BillBookNo] NVARCHAR(50) NOT NULL, 
  [ReceiptPrefix] NVARCHAR(30) NULL, 
  [ReceiptFromNo] BIGINT NOT NULL, 
  [ReceiptToNo] BIGINT NOT NULL, 
  [LastUsedReceiptNo] BIGINT NULL,   --to Get next receipt no
  [CollectionChannelId] INT NULL, 
  [FinanceYearId] INT NOT NULL, 
  [IssuedToUserId] INT NULL, 
  [IssueDate] DATETIME NULL, 
  [ReturnDate] DATETIME NULL, 
  [BillBookStatus] VARCHAR(20) NOT NULL CONSTRAINT DF_BillBookMaster_Status DEFAULT('AVAILABLE'), 
  [Remark] NVARCHAR(500) NULL, 
  [IsActive] BIT NOT NULL CONSTRAINT DF_BillBookMaster_IsActive DEFAULT(1), 
  [CreatedBy] INT NULL, 
  [CreatedDate] DATETIME NOT NULL CONSTRAINT DF_BillBookMaster_CreatedDate DEFAULT(
    GETDATE()
  ), 
  [UpdatedBy] INT NULL, 
  [UpdatedDate] DATETIME NULL, 
  [RowVersion] ROWVERSION, 
  CONSTRAINT PK_BillBookMaster PRIMARY KEY CLUSTERED(Id), 
  CONSTRAINT UQ_BillBookMaster_Code UNIQUE(BillBookCode), 
  CONSTRAINT UQ_BillBookMaster_Id_FinanceYear_Channel UNIQUE(
    Id, FinanceYearId, CollectionChannelId
  ), 
  CONSTRAINT FK_BillBookMaster_FinanceYear FOREIGN KEY(FinanceYearId) REFERENCES CORE.YearMaster(Id), 
  CONSTRAINT FK_BillBookMaster_Channel FOREIGN KEY(CollectionChannelId) REFERENCES CORE.CollectionChannelMaster(Id), 
  CONSTRAINT FK_BillBookMaster_IssuedToUser FOREIGN KEY(IssuedToUserId) REFERENCES CORE.UserMaster(Id), 
  CONSTRAINT CK_BillBookMaster_IssueReturnDates CHECK (
    IssueDate IS NULL 
    OR ReturnDate IS NULL 
    OR ReturnDate >= IssueDate
  ), 
  CONSTRAINT CK_BillBookMaster_Range CHECK (
    ReceiptFromNo > 0 
    AND ReceiptToNo >= ReceiptFromNo
  ), 
  CONSTRAINT CK_BillBookMaster_LastUsed CHECK (
    LastUsedReceiptNo IS NULL 
    OR (
      LastUsedReceiptNo >= ReceiptFromNo 
      AND LastUsedReceiptNo <= ReceiptToNo
    )
  ), 
  CONSTRAINT CK_BillBookMaster_Exhausted CHECK (
    BillBookStatus <> 'EXHAUSTED' 
    OR (
      LastUsedReceiptNo IS NOT NULL 
      AND LastUsedReceiptNo = ReceiptToNo
    )
  ), 
  CONSTRAINT CK_BillBookMaster_Status CHECK (
    BillBookStatus IN (
      'AVAILABLE', 
      'ISSUED', 
      'IN_USE', 
      'CLOSED', 
      'CANCELLED', 
      'LOST', 
      'EXHAUSTED'    ---No more receipts can be issued from this book.
      )
  )
);
GO
CREATE INDEX IX_BillBookMaster_User_Status ON PTIS.BillBookMaster (IssuedToUserId, BillBookStatus) INCLUDE (
  FinanceYearId, BillBookNo, ReceiptFromNo, 
  ReceiptToNo, LastUsedReceiptNo
);
GO
/****** Object:  Table [PTIS].[CollectionTransaction] ******/
CREATE TABLE PTIS.[CollectionTransaction] (
  [Id] BIGINT IDENTITY(1, 1) NOT FOR REPLICATION NOT NULL, 
  [FinanceYearId] INT NOT NULL, 
  [PropertyId] INT NULL, 
  [BillBookId] INT NULL, 
  [ReceiptNo] NVARCHAR(50) NOT NULL, 
  [ReceiptDate] DATETIME NOT NULL CONSTRAINT DF_CollectionTransaction_ReceiptDate DEFAULT(
    GETDATE()
  ), 
  [CollectionType] VARCHAR(20) NOT NULL, 
  [CollectionChannelId] INT NOT NULL, 
  [PaymentModeId] INT NOT NULL, 
  [PaymentGatewayTransactionId] BIGINT NULL,  -- CONSTRAINT FK_CollectionTransaction_Gateway                     
  [MerchantTxnRefNumber] VARCHAR(100) NULL, 
  [CollectionAmount] DECIMAL(18, 2) NOT NULL, 
  [SettlementStatus] VARCHAR(20) NOT NULL, 
  [CollectedByUserId] INT NULL, 
  [PaymentReferenceNo] NVARCHAR(100) NULL, 
  [PaymentReferenceDate] DATE NULL, 
  [BankName] NVARCHAR(200) NULL, 
  [BranchName] NVARCHAR(200) NULL, 
  [PayerName] NVARCHAR(300) NULL, 
  [PayerMobileNo] VARCHAR(20) NULL, 
  [PayerEmailId] NVARCHAR(200) NULL, 
  [Remark] NVARCHAR(1000) NULL, 
  [CollectionStatus] VARCHAR(30) NOT NULL, 
  [IsActive] BIT NOT NULL CONSTRAINT DF_CollectionTransaction_IsActive DEFAULT(1), 
  [CreatedBy] INT NULL, 
  [CreatedDate] DATETIME NOT NULL CONSTRAINT DF_CollectionTransaction_CreatedDate DEFAULT(GETDATE()), 
  [MarkedForDeletion] BIT NOT NULL CONSTRAINT DF_CollectionTransaction_MarkedForDeletion DEFAULT(0), 
  [MarkedForDeletionDate] DATETIME NULL, 
  [UpdatedBy] INT NULL, 
  [UpdatedDate] DATETIME NULL, 
  [RowVersion] ROWVERSION, 
  CONSTRAINT PK_CollectionTransaction PRIMARY KEY(Id), 
  CONSTRAINT FK_CollectionTransaction_BillBook_Context FOREIGN KEY (
    [BillBookId], [FinanceYearId], [CollectionChannelId]
  ) REFERENCES PTIS.[BillBookMaster] (
    [Id], [FinanceYearId], [CollectionChannelId]
  ), 
  CONSTRAINT FK_CollectionTransaction_Year FOREIGN KEY([FinanceYearId]) REFERENCES CORE.YearMaster([Id]), 
  CONSTRAINT FK_CollectionTransaction_Property FOREIGN KEY([PropertyId]) REFERENCES PTIS.PropertyMast([Id]), 
  CONSTRAINT FK_CollectionTransaction_Channel FOREIGN KEY([CollectionChannelId]) REFERENCES CORE.CollectionChannelMaster([Id]), 
  CONSTRAINT FK_CollectionTransaction_Mode FOREIGN KEY([PaymentModeId]) REFERENCES CORE.PaymentModeMaster([Id]), 
  CONSTRAINT FK_CollectionTransaction_User FOREIGN KEY([CollectedByUserId]) REFERENCES CORE.UserMaster([Id]), 
  CONSTRAINT CK_CollectionTransaction_Type CHECK (
    [CollectionType] IN (
      'SINGLE', 'SOCIETY', 'BULK', 'ADVANCE'
    )
  ), 
  CONSTRAINT CK_CollectionTransaction_Property CHECK (
    (
      [CollectionType] IN ('SINGLE', 'ADVANCE') 
      AND [PropertyId] IS NOT NULL
    ) 
    OR (
      [CollectionType] IN ('SOCIETY', 'BULK')
    )
  ), 
  CONSTRAINT CK_CollectionTransaction_Settlement CHECK (
    [SettlementStatus] IN (
      'PENDING', 'FULL', 'PARTIAL', 'MIXED', 
      'ADVANCE'
    )
  ), 
  CONSTRAINT CK_CollectionTransaction_Status CHECK (
    [CollectionStatus] IN (
      'INPROCESS', 'SUCCESS', 'BOUNCED', 
      'CANCELLED', 'REVERSED', 'PARTIALLY_REFUNDED', 
      'REFUNDED'
    )
  ), 
  CONSTRAINT CK_CollectionTransaction_Amount CHECK ([CollectionAmount] > 0)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX UX_CollectionTransaction_Receipt ON PTIS.CollectionTransaction (FinanceYearId, ReceiptNo) 
WHERE 
  MarkedForDeletion = 0;
GO
CREATE UNIQUE NONCLUSTERED INDEX UX_CollectionTransaction_GatewayTransaction ON PTIS.CollectionTransaction (PaymentGatewayTransactionId) 
WHERE 
  PaymentGatewayTransactionId IS NOT NULL 
  AND MarkedForDeletion = 0;
GO
CREATE UNIQUE NONCLUSTERED INDEX UX_CollectionTransaction_MerchantTxnRefNumber ON PTIS.CollectionTransaction (MerchantTxnRefNumber) 
WHERE 
  MerchantTxnRefNumber IS NOT NULL 
  AND MarkedForDeletion = 0;
GO 
/****** Object:  Table [PTIS].[CollectionAllocation] ******/
CREATE TABLE PTIS.[CollectionAllocation] (
  [Id] BIGINT IDENTITY(1, 1) NOT FOR REPLICATION NOT NULL, 
  [CollectionTransactionId] BIGINT NOT NULL, 
  [PropertyId] INT NOT NULL, 
  [FinanceYearId] INT NOT NULL, 
  [TaxId] INT NOT NULL, 
  [CollAmount] DECIMAL(18, 2) NOT NULL, 
  [IsActive] BIT NOT NULL CONSTRAINT DF_CollectionAllocation_IsActive DEFAULT(1), 
  [MarkedForDeletion] BIT NOT NULL CONSTRAINT DF_CollectionAllocation_MarkedForDeletion DEFAULT(0), 
  [MarkedForDeletionDate] DATETIME NULL, 
  [CreatedBy] INT NULL, 
  [CreatedDate] DATETIME NOT NULL CONSTRAINT DF_CollectionAllocation_CreatedDate DEFAULT(
    GETDATE()
  ), 
  [UpdatedBy] INT NULL, 
  [UpdatedDate] DATETIME NULL, 
  CONSTRAINT PK_CollectionAllocation PRIMARY KEY(Id), 
  CONSTRAINT FK_CollectionAllocation_Transaction FOREIGN KEY([CollectionTransactionId]) REFERENCES PTIS.CollectionTransaction([Id]), 
  CONSTRAINT FK_CollectionAllocation_Property FOREIGN KEY([PropertyId]) REFERENCES PTIS.PropertyMast([Id]), 
  CONSTRAINT FK_CollectionAllocation_Year FOREIGN KEY([FinanceYearId]) REFERENCES CORE.YearMaster([Id]), 
  CONSTRAINT FK_CollectionAllocation_Tax FOREIGN KEY([TaxId]) REFERENCES PTIS.TaxMaster([Id]), 
  CONSTRAINT CK_CollectionAllocation_Amount CHECK ([CollAmount] > 0)
);
GO
CREATE NONCLUSTERED INDEX IX_CollectionAllocation_CollectionTransactionId ON PTIS.CollectionAllocation ([CollectionTransactionId]) INCLUDE (
  [PropertyId], [FinanceYearId], [TaxId], 
  [CollAmount]
) 
WHERE 
  [MarkedForDeletion] = 0;
GO
CREATE NONCLUSTERED INDEX IX_CollectionAllocation_Property_FinanceYear ON PTIS.CollectionAllocation ([PropertyId], [FinanceYearId]) INCLUDE (
  [CollectionTransactionId], [TaxId], 
  [CollAmount]
) 
WHERE 
  [IsActive] = 1 
  AND [MarkedForDeletion] = 0;
GO
CREATE UNIQUE NONCLUSTERED INDEX UX_CollectionAllocation_Transaction_Property_Year_Tax ON PTIS.CollectionAllocation (
  [CollectionTransactionId], [PropertyId], 
  [FinanceYearId], [TaxId]
) 
WHERE 
  [IsActive] = 1 
  AND [MarkedForDeletion] = 0;
GO

--------------- END OF COLLECTION TABLES -------------
