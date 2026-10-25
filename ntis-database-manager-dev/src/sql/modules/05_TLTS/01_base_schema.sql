/****** Object:  Table [TLIS].[FeesStructureMaster]******/

CREATE TABLE [TLIS].[FeesStructureMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[FeesStructure] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_FeesStructureMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_FeesStructureMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_FeesStructureMaster] PRIMARY KEY CLUSTERED ([Id] ASC) 
)
/****** Object:  Table TLIS].[LicenseSpanMaster]******/

CREATE TABLE [TLIS].[LicenseSpanMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[LicenseSpan] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_LicenseSpanMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT DF_LicenseSpanMaster_CreatedDate DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	CONSTRAINT [PK_LicenseSpanMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
)