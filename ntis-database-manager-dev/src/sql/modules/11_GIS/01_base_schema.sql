-- ============================================================================
-- Module: 11_GIS (Geographic Information System Engine)
-- Script: 01_base_schema.sql
-- Description: Creates all 9 GIS Master & Spatial tables with integrity constraints
-- ============================================================================

/****** Object:  Table [GIS].[GisCorporationConfig] ******/
CREATE TABLE [GIS].[GisCorporationConfig](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[UlbId] [int] NOT NULL,
	[DefaultCenterLat] [decimal](18,7) NOT NULL,
	[DefaultCenterLng] [decimal](18,7) NOT NULL,
	[DefaultZoom] [int] NOT NULL CONSTRAINT [DF_GisCorporationConfig_DefaultZoom] DEFAULT (14),
	[MinZoom] [int] NOT NULL CONSTRAINT [DF_GisCorporationConfig_MinZoom] DEFAULT (10),
	[MaxZoom] [int] NOT NULL CONSTRAINT [DF_GisCorporationConfig_MaxZoom] DEFAULT (20),
	[BoundingBoxJson] [nvarchar](max) NULL,
	[BasemapsJson] [nvarchar](max) NULL,
	[PropertyBoundaryColor] [nvarchar](50) NULL CONSTRAINT [DF_GisCorporationConfig_PropertyBoundaryColor] DEFAULT ('#0078FF'),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisCorporationConfig_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisCorporationConfig_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisCorporationConfig] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [CK_GisCorporationConfig_DefaultCenterLat] CHECK ([DefaultCenterLat] BETWEEN -90.0 AND 90.0),
	CONSTRAINT [CK_GisCorporationConfig_DefaultCenterLng] CHECK ([DefaultCenterLng] BETWEEN -180.0 AND 180.0),
	CONSTRAINT [CK_GisCorporationConfig_Zoom] CHECK ([MinZoom] >= 0 AND [MaxZoom] >= [MinZoom] AND [DefaultZoom] BETWEEN [MinZoom] AND [MaxZoom]),
	CONSTRAINT [CK_GisCorporationConfig_BoundingBoxJson] CHECK ([BoundingBoxJson] IS NULL OR ISJSON([BoundingBoxJson]) = 1),
	CONSTRAINT [CK_GisCorporationConfig_BasemapsJson] CHECK ([BasemapsJson] IS NULL OR ISJSON([BasemapsJson]) = 1)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [GIS].[GisCorporationConfig] WITH CHECK ADD CONSTRAINT [FK_GisCorporationConfig_UlbMaster]
	FOREIGN KEY([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id])
GO
ALTER TABLE [GIS].[GisCorporationConfig] CHECK CONSTRAINT [FK_GisCorporationConfig_UlbMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisCorporationConfig_UlbId]
	ON [GIS].[GisCorporationConfig] ([UlbId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [GIS].[GisDepartmentUserAccess] ******/
CREATE TABLE [GIS].[GisDepartmentUserAccess](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[UserId] [int] NOT NULL,
	[DepartmentId] [int] NOT NULL,
	[UlbId] [int] NOT NULL,
	[ZoneId] [int] NOT NULL,
	[CanView] [bit] NOT NULL CONSTRAINT [DF_GisDepartmentUserAccess_CanView] DEFAULT (1),
	[CanEdit] [bit] NOT NULL CONSTRAINT [DF_GisDepartmentUserAccess_CanEdit] DEFAULT (0),
	[CanExport] [bit] NOT NULL CONSTRAINT [DF_GisDepartmentUserAccess_CanExport] DEFAULT (0),
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_GisDepartmentUserAccess_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisDepartmentUserAccess_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisDepartmentUserAccess_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisDepartmentUserAccess] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [GIS].[GisDepartmentUserAccess] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentUserAccess_UserMaster]
	FOREIGN KEY([UserId]) REFERENCES [CORE].[UserMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentUserAccess] CHECK CONSTRAINT [FK_GisDepartmentUserAccess_UserMaster]
GO

ALTER TABLE [GIS].[GisDepartmentUserAccess] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentUserAccess_DepartmentMaster]
	FOREIGN KEY([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentUserAccess] CHECK CONSTRAINT [FK_GisDepartmentUserAccess_DepartmentMaster]
GO

ALTER TABLE [GIS].[GisDepartmentUserAccess] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentUserAccess_UlbMaster]
	FOREIGN KEY([UlbId]) REFERENCES [CORE].[UlbMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentUserAccess] CHECK CONSTRAINT [FK_GisDepartmentUserAccess_UlbMaster]
GO

ALTER TABLE [GIS].[GisDepartmentUserAccess] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentUserAccess_ZoneMaster]
	FOREIGN KEY([ZoneId]) REFERENCES [PTIS].[ZoneMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentUserAccess] CHECK CONSTRAINT [FK_GisDepartmentUserAccess_ZoneMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisDepartmentUserAccess_UserDepartmentUlbZone]
	ON [GIS].[GisDepartmentUserAccess] ([UserId], [DepartmentId], [UlbId], [ZoneId])
	WHERE [IsActive] = 1 AND [MarkedForDeletion] = 0;
GO


/****** Object:  Table [GIS].[GisFilterMaster] ******/
CREATE TABLE [GIS].[GisFilterMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FilterKey] [nvarchar](100) NOT NULL,
	[FilterLabel] [nvarchar](200) NOT NULL,
	[ControlType] [nvarchar](50) NOT NULL CONSTRAINT [DF_GisFilterMaster_ControlType] DEFAULT ('DROPDOWN'),
	[ApiSourceUrl] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisFilterMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisFilterMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisFilterMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [CK_GisFilterMaster_ControlType] CHECK ([ControlType] IN ('DROPDOWN', 'MULTISELECT', 'CHECKBOX', 'RADIO', 'DATE', 'TEXT', 'NUMBER'))
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisFilterMaster_FilterKey]
	ON [GIS].[GisFilterMaster] ([FilterKey])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [GIS].[GisDepartmentFilterMapping] ******/
CREATE TABLE [GIS].[GisDepartmentFilterMapping](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[DepartmentId] [int] NOT NULL,
	[FilterMasterId] [int] NOT NULL,
	[CustomLabel] [nvarchar](200) NULL,
	[DisplayOrder] [int] NOT NULL CONSTRAINT [DF_GisDepartmentFilterMapping_DisplayOrder] DEFAULT (1),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisDepartmentFilterMapping_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisDepartmentFilterMapping_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisDepartmentFilterMapping] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [GIS].[GisDepartmentFilterMapping] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentFilterMapping_DepartmentMaster]
	FOREIGN KEY([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentFilterMapping] CHECK CONSTRAINT [FK_GisDepartmentFilterMapping_DepartmentMaster]
GO

ALTER TABLE [GIS].[GisDepartmentFilterMapping] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentFilterMapping_GisFilterMaster]
	FOREIGN KEY([FilterMasterId]) REFERENCES [GIS].[GisFilterMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentFilterMapping] CHECK CONSTRAINT [FK_GisDepartmentFilterMapping_GisFilterMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisDepartmentFilterMapping_DepartmentFilter]
	ON [GIS].[GisDepartmentFilterMapping] ([DepartmentId], [FilterMasterId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [GIS].[GisKpiMaster] ******/
CREATE TABLE [GIS].[GisKpiMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[KpiCode] [nvarchar](100) NOT NULL,
	[DefaultTitle] [nvarchar](200) NOT NULL,
	[DefaultIcon] [nvarchar](100) NOT NULL CONSTRAINT [DF_GisKpiMaster_DefaultIcon] DEFAULT ('fa-building'),
	[DefaultColor] [nvarchar](50) NOT NULL CONSTRAINT [DF_GisKpiMaster_DefaultColor] DEFAULT ('#0078FF'),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisKpiMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisKpiMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisKpiMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisKpiMaster_KpiCode]
	ON [GIS].[GisKpiMaster] ([KpiCode])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [GIS].[GisDepartmentKpiMapping] ******/
CREATE TABLE [GIS].[GisDepartmentKpiMapping](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[DepartmentId] [int] NOT NULL,
	[KpiMasterId] [int] NOT NULL,
	[CustomTitle] [nvarchar](200) NULL,
	[CustomIcon] [nvarchar](100) NULL,
	[CustomColor] [nvarchar](50) NULL,
	[DisplayOrder] [int] NOT NULL CONSTRAINT [DF_GisDepartmentKpiMapping_DisplayOrder] DEFAULT (1),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisDepartmentKpiMapping_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisDepartmentKpiMapping_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisDepartmentKpiMapping] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

ALTER TABLE [GIS].[GisDepartmentKpiMapping] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentKpiMapping_DepartmentMaster]
	FOREIGN KEY([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentKpiMapping] CHECK CONSTRAINT [FK_GisDepartmentKpiMapping_DepartmentMaster]
GO

ALTER TABLE [GIS].[GisDepartmentKpiMapping] WITH CHECK ADD CONSTRAINT [FK_GisDepartmentKpiMapping_GisKpiMaster]
	FOREIGN KEY([KpiMasterId]) REFERENCES [GIS].[GisKpiMaster] ([Id])
GO
ALTER TABLE [GIS].[GisDepartmentKpiMapping] CHECK CONSTRAINT [FK_GisDepartmentKpiMapping_GisKpiMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisDepartmentKpiMapping_DepartmentKpi]
	ON [GIS].[GisDepartmentKpiMapping] ([DepartmentId], [KpiMasterId])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [GIS].[GisLayerMaster] ******/
CREATE TABLE [GIS].[GisLayerMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[DepartmentId] [int] NOT NULL,
	[LayerCode] [nvarchar](100) NOT NULL,
	[LayerName] [nvarchar](200) NOT NULL,
	[GeometryType] [nvarchar](50) NOT NULL CONSTRAINT [DF_GisLayerMaster_GeometryType] DEFAULT ('POLYGON'),
	[VectorTileUrl] [nvarchar](500) NULL,
	[StyleConfigJson] [nvarchar](max) NULL,
	[PopupSchemaJson] [nvarchar](max) NULL,
	[DisplayOrder] [int] NOT NULL CONSTRAINT [DF_GisLayerMaster_DisplayOrder] DEFAULT (1),
	[IsVisibleByDefault] [bit] NOT NULL CONSTRAINT [DF_GisLayerMaster_IsVisibleByDefault] DEFAULT (1),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisLayerMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisLayerMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisLayerMaster] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [CK_GisLayerMaster_GeometryType] CHECK ([GeometryType] IN ('POINT', 'LINESTRING', 'POLYGON', 'MULTIPOLYGON', 'MULTILINESTRING', 'MULTIPOINT', 'GEOMETRYCOLLECTION')),
	CONSTRAINT [CK_GisLayerMaster_StyleConfigJson] CHECK ([StyleConfigJson] IS NULL OR ISJSON([StyleConfigJson]) = 1),
	CONSTRAINT [CK_GisLayerMaster_PopupSchemaJson] CHECK ([PopupSchemaJson] IS NULL OR ISJSON([PopupSchemaJson]) = 1)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [GIS].[GisLayerMaster] WITH CHECK ADD CONSTRAINT [FK_GisLayerMaster_DepartmentMaster]
	FOREIGN KEY([DepartmentId]) REFERENCES [CORE].[DepartmentMaster] ([Id])
GO
ALTER TABLE [GIS].[GisLayerMaster] CHECK CONSTRAINT [FK_GisLayerMaster_DepartmentMaster]
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_GisLayerMaster_DepartmentLayerCode]
	ON [GIS].[GisLayerMaster] ([DepartmentId], [LayerCode])
	WHERE [IsActive] = 1;
GO


/****** Object:  Table [GIS].[GisLayerJson] ******/
CREATE TABLE [GIS].[GisLayerJson](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[LayerMasterId] [int] NOT NULL,
	[GeoJsonData] [nvarchar](max) NOT NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_GisLayerJson_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisLayerJson_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisLayerJson_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisLayerJson] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [CK_GisLayerJson_GeoJsonData] CHECK (ISJSON([GeoJsonData]) = 1)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [GIS].[GisLayerJson] WITH CHECK ADD CONSTRAINT [FK_GisLayerJson_GisLayerMaster]
	FOREIGN KEY([LayerMasterId]) REFERENCES [GIS].[GisLayerMaster] ([Id])
GO
ALTER TABLE [GIS].[GisLayerJson] CHECK CONSTRAINT [FK_GisLayerJson_GisLayerMaster]
GO


/****** Object:  Table [GIS].[GisUploadHistory] ******/
CREATE TABLE [GIS].[GisUploadHistory](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FileName] [nvarchar](255) NOT NULL,
	[FileSizeBytes] [bigint] NOT NULL CONSTRAINT [DF_GisUploadHistory_FileSizeBytes] DEFAULT (0),
	[RecordCount] [int] NOT NULL CONSTRAINT [DF_GisUploadHistory_RecordCount] DEFAULT (0),
	[UploadedBy] [int] NOT NULL,
	[Status] [nvarchar](50) NOT NULL CONSTRAINT [DF_GisUploadHistory_Status] DEFAULT ('PENDING'),
	[Remarks] [nvarchar](max) NULL,
	[MarkedForDeletion] [bit] NOT NULL CONSTRAINT [DF_GisUploadHistory_MarkedForDeletion] DEFAULT (0),
	[MarkedForDeletionDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_GisUploadHistory_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_GisUploadHistory_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_GisUploadHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
	CONSTRAINT [CK_GisUploadHistory_Status] CHECK ([Status] IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL')),
	CONSTRAINT [CK_GisUploadHistory_FileSizeBytes] CHECK ([FileSizeBytes] >= 0),
	CONSTRAINT [CK_GisUploadHistory_RecordCount] CHECK ([RecordCount] >= 0)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [GIS].[GisUploadHistory] WITH CHECK ADD CONSTRAINT [FK_GisUploadHistory_UserMaster]
	FOREIGN KEY([UploadedBy]) REFERENCES [CORE].[UserMaster] ([Id])
GO
ALTER TABLE [GIS].[GisUploadHistory] CHECK CONSTRAINT [FK_GisUploadHistory_UserMaster]
GO
