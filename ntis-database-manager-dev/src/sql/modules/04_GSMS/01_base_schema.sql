/* ===========================
 CommunicationDetails
=========================== */

CREATE TABLE [GSMS].[CommunicationDetails](
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [CommunicationTypeId] INT NOT NULL,
    [CommunicationNo] VARCHAR(50) NULL,
    [CommunicationDate] DATETIME NULL,
    [IssuedBy] INT NULL,
    [ModuleId] INT NULL,
    [Latitude] DECIMAL(10,8) NULL,
    [Longitude] DECIMAL(11,8) NULL,
    [DeviceUniqueNo] VARCHAR(100) NULL,
    [Remarks] NVARCHAR(500) NULL,
    [Status] VARCHAR(50) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_CommunicationDetails_IsActive] DEFAULT ((1)),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_CommunicationDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_CommunicationDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_CommunicationDetails_CommunicationType] FOREIGN KEY ([CommunicationTypeId]) REFERENCES [CORE].[CommunicationTypeMaster] ([Id]),
    CONSTRAINT [FK_CommunicationDetails_IssuedBy] FOREIGN KEY ([IssuedBy]) REFERENCES [CORE].[UserMaster] ([Id]),
    CONSTRAINT [FK_CommunicationDetails_ModuleMaster] FOREIGN KEY ([ModuleId]) REFERENCES [CORE].[ModuleMaster] ([Id])
);
GO

/* ===========================
 CommonRemarkDetails
=========================== */
CREATE TABLE [GSMS].[CommonRemarkDetails](
        [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
        [RemarkTypeId] INT NOT NULL,
        [Remark] NVARCHAR(300) NOT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT [DF_CommonRemarkDetails_IsActive] DEFAULT ((1)),
        [CreatedBy] INT NULL,
        [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_CommonRemarkDetails_CreatedDate] DEFAULT (GETDATE()),
        [UpdatedBy] INT NULL,
        [UpdatedDate] DATETIME NULL,
        CONSTRAINT [PK_CommonRemarkDetails] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_CommonRemarkDetails_CommonRemarkTypeMaster] FOREIGN KEY ([RemarkTypeId]) REFERENCES [CORE].[CommonRemarkTypeMaster] ([Id])
);
GO
 /****** Added here because [GSMS].[CommonRemarkDetails] is created after [PTIS].[PropertyMast], which avoids an execution error. ******/
ALTER TABLE [PTIS].[PropertyMast]  WITH CHECK ADD  CONSTRAINT [FK_PropertyMast_MobileNoRemarkMaster] FOREIGN KEY([MobileNoRemarkId])		
REFERENCES [GSMS].[CommonRemarkDetails] ([Id])
GO
ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_MobileNoRemarkMaster]
GO

ALTER TABLE [PTIS].[PropertyMast]  WITH CHECK ADD  CONSTRAINT [FK_PropertyMast_OccupierMobileNoRemarkMaster] FOREIGN KEY([OccupierMobileNoRemarkId])
REFERENCES [GSMS].[CommonRemarkDetails] ([Id])
GO
ALTER TABLE [PTIS].[PropertyMast] CHECK CONSTRAINT [FK_PropertyMast_OccupierMobileNoRemarkMaster]
GO

ALTER TABLE [GSMS].[CommonRemarkDetails] ADD CONSTRAINT [UQ_CommonRemarkDetails_RemarkTypeId_Remark] UNIQUE ([RemarkTypeId],[Remark])
GO

ALTER TABLE [PTIS].[PropertyMastDetails] WITH CHECK
ADD CONSTRAINT [FK_PropertyMastDetails_CommonRemarkDetails_OwnerSign]
FOREIGN KEY (OwnerSignRemarkId)
REFERENCES [GSMS].[CommonRemarkDetails] ([Id]);
GO

ALTER TABLE [PTIS].[PropertyMastDetails]
CHECK CONSTRAINT [FK_PropertyMastDetails_CommonRemarkDetails_OwnerSign];

GO

/****** Object: Table [GSMS].[SocietyWingDetails] ******/

CREATE TABLE [GSMS].[SocietyWingDetails]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [SocietyDetailId] INT NULL,
    --[PropertyId] INT NULL,
    [WingDetailsMastId] INT NULL,
    [WingId] INT NULL,
    [FromFloor] NVARCHAR(50) NULL,
    [ToFloor] NVARCHAR(50) NULL,
    [OldWingName] NVARCHAR(MAX) NULL,
    [NewWingName] NVARCHAR(500) NULL,
    [NoOfFlat] INT NULL,
    [NoOfShop] INT NULL,
    [NoOfRowHouse] INT NULL,
    --[WingPhoto] INT NULL,
    --[BoardPhoto] INT NULL,
    [IsBoardPhoto] BIT NULL
    CONSTRAINT [DF_SocietyWingDetails_IsBoardPhoto]
    DEFAULT (0),
    [IsActive] BIT NOT NULL
        CONSTRAINT [DF_SocietyWingDetails_IsActive] DEFAULT ((1)),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL
        CONSTRAINT [DF_SocietyWingDetails_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_GSMS_SocietyWingDetails]
        PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_SocietyWingDetails_SocietyDetailsMast]
        FOREIGN KEY ([SocietyDetailId])
        REFERENCES [PTIS].[SocietyDetailsMast]([Id]),

    -- Uncomment this only if PropertyId column exists
    /*
        CONSTRAINT [FK_SocietyWingDetails_PropertyMast]
        FOREIGN KEY ([PropertyId])
        REFERENCES [PTIS].[PropertyMast]([Id]),
    */

    CONSTRAINT [FK_SocietyWingDetails_WingMaster]
        FOREIGN KEY ([WingId])
        REFERENCES [PTIS].[WingMaster]([Id]),

    CONSTRAINT [FK_SocietyWingDetails_WingDetailsMast]
        FOREIGN KEY ([WingDetailsMastId])
        REFERENCES [PTIS].[WingDetailsMast]([Id])
);
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* ===========================
   STEP 1: [GSMS].[WardAllocation]  
=========================== */

CREATE TABLE [GSMS].[WardAllocation](
    [Id]   INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserId]       INT NOT NULL,
    [DepartmentId] INT NOT NULL,
    [ModuleId]     INT NOT NULL,
    [ZoneId]       INT NOT NULL,
    [WardId]       INT NOT NULL,
    [OldWardId]    INT NULL,
    [FromPropertyNo] NVARCHAR(50) NULL,
    [ToPropertyNo]   NVARCHAR(50) NULL,
    [IsActive]     BIT NOT NULL CONSTRAINT [DF_WardAllocation_IsActive] DEFAULT (1),
    [MarkedForDeletion] BIT NOT NULL CONSTRAINT [DF_WardAllocation_MarkedForDeletion] DEFAULT (0),
    [MarkedForDeletionDate] DATETIME NULL,
    [CreatedBy]    INT NULL,
    [CreatedDate]  DATETIME NOT NULL CONSTRAINT [DF_WardAllocation_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy]    INT NULL,
    [UpdatedDate]  DATETIME NULL,

    CONSTRAINT [PK_WardAllocation]
    PRIMARY KEY CLUSTERED ([Id] ASC),

    CONSTRAINT [UQ_WardAllocation_User_Department_Module_Zone_Ward]
    UNIQUE ([UserId], [DepartmentId], [ModuleId], [ZoneId], [WardId])
);
GO

ALTER TABLE [GSMS].[WardAllocation] WITH CHECK
ADD CONSTRAINT [FK_WardAllocation_UserMaster]
FOREIGN KEY ([UserId]) REFERENCES [CORE].[UserMaster]([Id]);
GO

ALTER TABLE [GSMS].[WardAllocation] CHECK CONSTRAINT [FK_WardAllocation_UserMaster];
GO

ALTER TABLE [GSMS].[WardAllocation] WITH CHECK
ADD CONSTRAINT [FK_WardAllocation_DepartmentMaster]
FOREIGN KEY ([DepartmentId]) REFERENCES [CORE].[DepartmentMaster]([Id]);
GO

ALTER TABLE [GSMS].[WardAllocation] CHECK CONSTRAINT [FK_WardAllocation_DepartmentMaster];
GO

ALTER TABLE [GSMS].[WardAllocation] WITH CHECK
ADD CONSTRAINT [FK_WardAllocation_DepartmentModule]
FOREIGN KEY ([DepartmentId], [ModuleId]) REFERENCES [CORE].[ModuleMaster]([DepartmentId], [Id]);
GO

ALTER TABLE [GSMS].[WardAllocation] CHECK CONSTRAINT [FK_WardAllocation_DepartmentModule];
GO

ALTER TABLE [GSMS].[WardAllocation] WITH CHECK
ADD CONSTRAINT [FK_WardAllocation_ZoneMaster]
FOREIGN KEY ([ZoneId]) REFERENCES [PTIS].[ZoneMaster]([Id]);
GO

ALTER TABLE [GSMS].[WardAllocation] CHECK CONSTRAINT [FK_WardAllocation_ZoneMaster];
GO

ALTER TABLE [GSMS].[WardAllocation] WITH CHECK
ADD CONSTRAINT [FK_WardAllocation_WardMaster]
FOREIGN KEY ([WardId]) REFERENCES [PTIS].[WardMaster]([Id]);
GO

ALTER TABLE [GSMS].[WardAllocation] CHECK CONSTRAINT [FK_WardAllocation_WardMaster];
GO


CREATE TABLE [GSMS].[PropertySurveyVisit]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyWorkflowDetailsId] INT NOT NULL,
    [InternalSurveyVerified] BIT NOT NULL CONSTRAINT [DF_PropertySurveyVisit_InternalSurveyVerified] DEFAULT (0),
    [RemarkId] INT NULL,
    [RemarkText] NVARCHAR(1000) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_PropertySurveyVisit_IsActive] DEFAULT (1),
    [Latitude] DECIMAL(10,7) NULL,
    [Longitude] DECIMAL(10,7) NULL,
    [Location] NVARCHAR(500) NULL,
    [CreatedBy] INT NOT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_PropertySurveyVisit_CreatedDate] DEFAULT GETDATE(),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_PropertySurveyVisit] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_PropertySurveyVisit_PropertyWorkflowDetails] FOREIGN KEY ([PropertyWorkflowDetailsId]) 
                REFERENCES [PTIS].[PropertyWorkflowDetails] ([Id])
);  
GO

ALTER TABLE [GSMS].[PropertySurveyVisit]  WITH CHECK ADD  CONSTRAINT [FK_PropertySurveyVisit_CommonRemarkDetails] FOREIGN KEY([RemarkId])
REFERENCES [GSMS].[CommonRemarkDetails] ([Id])
GO
 

 
 ALTER TABLE [GSMS].[WardAllocation] WITH CHECK ADD CONSTRAINT [FK_WardAllocation_OldWardMaster_OldWardId]
     FOREIGN KEY ([OldWardId]) REFERENCES [PTIS].[OldWardMaster] ([Id]);
GO
ALTER TABLE [GSMS].[WardAllocation] CHECK CONSTRAINT [FK_WardAllocation_OldWardMaster_OldWardId];

GO
CREATE TABLE [GSMS].[MergeDetails]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyMapDetailId] INT NOT NULL,
    [OwnerName] NVARCHAR(1000) NULL,
    [OwnerNameEnglish] VARCHAR(1000) NULL,
    [OccupierName] NVARCHAR(1000) NULL,
    [OccupierNameEnglish] VARCHAR(1000) NULL,
    [MobileNo] VARCHAR(13) NULL,
    [Address] NVARCHAR(500) NULL,
    [AddressEnglish] VARCHAR(500) NULL,
    [BuilderName] NVARCHAR(200) NULL,
    [BuilderNameEnglish] VARCHAR(200) NULL,
    [FlatOrShopNo] NVARCHAR(100) NULL,
    [FlatOrShopNoEnglish] VARCHAR(100) NULL,
    [FlatOrShopName] NVARCHAR(200) NULL,
    [FlatOrShopNameEnglish] VARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_MergeDetails_IsActive] DEFAULT (1),
    [CreatedBy] INT NOT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_MergeDetails_CreatedDate] DEFAULT GETDATE(),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_MergeDetails] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_MergeDetails_PropertyMapDetail] FOREIGN KEY ([PropertyMapDetailId])
            REFERENCES [PTIS].[PropertyMapDetail] ([Id])
);
GO

/****** Object: Table [GSMS].[VirtualPropertyTransferHistory] ******/
CREATE TABLE [GSMS].[VirtualPropertyTransferHistory]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [PropertyId] INT NOT NULL,
    [WardId] INT NOT NULL,
    [PropertyNo] NVARCHAR(10) NULL,
    [PartitionNo] NVARCHAR(10) NULL,
    [TransferredWardId] INT NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_VirtualPropertyTransferHistory_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_VirtualPropertyTransferHistory_CreatedDate] DEFAULT GETDATE(),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_VirtualPropertyTransferHistory] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

ALTER TABLE [GSMS].[VirtualPropertyTransferHistory] WITH CHECK
ADD CONSTRAINT [FK_VirtualPropertyTransferHistory_PropertyMast]
FOREIGN KEY ([PropertyId])
REFERENCES [PTIS].[PropertyMast]([Id]);
GO

ALTER TABLE [GSMS].[VirtualPropertyTransferHistory] WITH CHECK
ADD CONSTRAINT [FK_VirtualPropertyTransferHistory_Ward]
FOREIGN KEY ([WardId])
REFERENCES [PTIS].[WardMaster]([Id]);
GO

ALTER TABLE [GSMS].[VirtualPropertyTransferHistory] WITH CHECK
ADD CONSTRAINT [FK_VirtualPropertyTransferHistory_TransferredWard]
FOREIGN KEY ([TransferredWardId])
REFERENCES [PTIS].[WardMaster]([Id]);
GO


CREATE TABLE [GSMS].[VillageMaster](
	[Id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[ZoneId] INT NOT NULL,
	[VillageName] [nvarchar](100) NOT NULL,
	[VillageNameEnglish] [varchar](100) NULL,
	[PinCode] VARCHAR(6) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF_VillageMaster_IsActive] DEFAULT (1),
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_VillageMaster_CreatedDate] DEFAULT (GETDATE()),
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
  CONSTRAINT [PK_VillageMaster] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

ALTER TABLE [GSMS].[VillageMaster] WITH CHECK
ADD CONSTRAINT [FK_VillageMaster_ZoneMaster]
FOREIGN KEY ([ZoneId])
REFERENCES [PTIS].[ZoneMaster] ([Id]);
GO

ALTER TABLE [GSMS].[VillageMaster]
ADD CONSTRAINT [UQ_VillageMaster_Zone_Village_Pincode]
UNIQUE ([ZoneId],[VillageName],[PinCode]);
GO


CREATE TABLE [GSMS].[FieldTypeMaster]
(
    [Id] INT IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [FieldTypeName] VARCHAR(50) NOT NULL, -- Text, Number, Dropdown, Date, Checkbox, File, etc.
    [IsActive] BIT NOT NULL CONSTRAINT [DF_FieldTypeMaster_IsActive] DEFAULT(1),
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME NOT NULL CONSTRAINT [DF_FieldTypeMaster_CreatedDate] DEFAULT(GETDATE()),
    [UpdatedBy] INT NULL,
    [UpdatedDate] DATETIME NULL,
    CONSTRAINT [PK_FieldTypeMaster] PRIMARY KEY CLUSTERED([Id])
);
GO

ALTER TABLE [GSMS].[FieldTypeMaster] ADD CONSTRAINT [UK_FieldTypeMaster_FieldTypeName] UNIQUE ([FieldTypeName]);
GO

CREATE TABLE [GSMS].[ScreenFieldMaster]
(
    [Id] [INT] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [FieldCode] [VARCHAR](25) NOT NULL,
    [FieldName] [VARCHAR](100) NOT NULL,
    [FieldTypeId] [INT] NOT NULL, -- Text, Number, Dropdown, Date, Checkbox, File, etc.
    [DefaultDisplayOrder] [INT] NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_ScreenFieldMaster_IsActive] DEFAULT (1),
    [CreatedBy] [INT] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_ScreenFieldMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [INT] NULL,
    [UpdatedDate] [DATETIME] NULL,
    CONSTRAINT [PK_ScreenFieldMaster] PRIMARY KEY CLUSTERED ([Id])
);
GO

ALTER TABLE [GSMS].[ScreenFieldMaster] ADD CONSTRAINT [UK_ScreenFieldMaster_FieldTypeId_FieldCode_FieldName]
UNIQUE
(
    [FieldTypeId],
    [FieldCode],
    [FieldName]
);
GO

ALTER TABLE [GSMS].[ScreenFieldMaster] WITH CHECK ADD CONSTRAINT [FK_ScreenFieldMaster_FieldTypeMaster]
FOREIGN KEY ([FieldTypeId]) REFERENCES [GSMS].[FieldTypeMaster] ([Id]);
GO

CREATE TABLE [GSMS].[ScreenFieldValidation]
(
    [Id] [INT] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserRoleAllocationId] [INT] NULL,
    [ScreenId] [INT] NOT NULL, -- FK ScreenMaster.Id
    [ScreenFieldId] [INT] NOT NULL,
    [IsVisible] [BIT] NOT NULL DEFAULT 1,
    [IsMandatory] [BIT] NOT NULL DEFAULT 0,
    [IsReadonly] [BIT] NOT NULL DEFAULT 0,
    [MinLength] [INT] NULL,
    [MaxLength] [INT] NULL,
    [ValidationExpression] [NVARCHAR](100) NULL,
    [ErrorMessage] [NVARCHAR](200) NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_ScreenFieldValidation_IsActive] DEFAULT (1),
    [CreatedBy] [INT] NULL,
    [CreatedDate] [datetime] NOT NULL CONSTRAINT [DF_ScreenFieldValidation_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [INT] NULL,
    [UpdatedDate] [DATETIME] NULL,
    CONSTRAINT [PK_ScreenFieldValidation] PRIMARY KEY CLUSTERED ([Id]),
);
GO

ALTER TABLE [GSMS].[ScreenFieldValidation] ADD CONSTRAINT [UK_ScreenFieldValidation]
UNIQUE
(
    [UserRoleAllocationId],
    [ScreenId],
    [ScreenFieldId]
);
GO

ALTER TABLE [GSMS].[ScreenFieldValidation] WITH CHECK ADD CONSTRAINT [FK_ScreenFieldValidation_UserRoleAllocation]
FOREIGN KEY ([UserRoleAllocationId]) REFERENCES [CORE].[UserRoleAllocation] ([Id]);
GO

ALTER TABLE [GSMS].[ScreenFieldValidation] WITH CHECK ADD CONSTRAINT [FK_ScreenFieldValidation_ScreenMaster]
FOREIGN KEY ([ScreenId]) REFERENCES [CORE].[ScreenMaster] ([Id]);
GO

ALTER TABLE [GSMS].[ScreenFieldValidation] WITH CHECK ADD CONSTRAINT [FK_ScreenFieldValidation_ScreenFieldMaster]
FOREIGN KEY ([ScreenFieldId]) REFERENCES [GSMS].[ScreenFieldMaster] ([Id]);
GO


CREATE TABLE [GSMS].[ButtonTypeMaster]
(
    [Id] [INT] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ButtonTypeName] [NVARCHAR](50) NOT NULL,
    [IsActive] [BIT] NOT NULL CONSTRAINT [DF_ButtonTypeMaster_IsActive] DEFAULT(1),
    [CreatedBy] [INT] NULL,
    [CreatedDate] [DATETIME] NOT NULL CONSTRAINT [DF_ButtonTypeMaster_CreatedDate] DEFAULT(GETDATE()),
    [UpdatedBy] [INT] NULL,
    [UpdatedDate] [DATETIME] NULL,
    CONSTRAINT [PK_ButtonTypeMaster] PRIMARY KEY CLUSTERED ([Id])
);
GO

ALTER TABLE [GSMS].[ButtonTypeMaster] ADD CONSTRAINT [UK_ButtonTypeMaster_ButtonTypeName] UNIQUE ([ButtonTypeName]);
GO

CREATE TABLE [GSMS].[ScreenButtonMaster]
(
    [Id] [INT] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [ButtonCode] [NVARCHAR](50) NOT NULL,
    [ButtonName] [NVARCHAR](100) NOT NULL,
    [ButtonTypeId] [INT] NOT NULL, -- Save, Update, Delete, Approve, Reject, Export
    [DisplayOrder] [INT] NULL,
    [IsActive] [BIT] NOT NULL CONSTRAINT [DF_ScreenButtonMaster_IsActive] DEFAULT (1),
    [CreatedBy] [INT] NULL,
    [CreatedDate] [DATETIME] NOT NULL CONSTRAINT [DF_ScreenButtonMaster_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [INT] NULL,
    [UpdatedDate] [DATETIME] NULL,
    CONSTRAINT [PK_ScreenButtonMaster] PRIMARY KEY CLUSTERED ([Id])
);
GO

ALTER TABLE [GSMS].[ScreenButtonMaster] ADD CONSTRAINT [UK_ScreenButtonMaster_ButtonTypeId_ButtonCode_ButtonName]
UNIQUE
(
    [ButtonTypeId],
    [ButtonCode],
    [ButtonName]
);
GO

ALTER TABLE [GSMS].[ScreenButtonMaster] WITH CHECK ADD CONSTRAINT [FK_ScreenButtonMaster_ButtonTypeMaster]
FOREIGN KEY ( [ButtonTypeId]) REFERENCES [GSMS].[ButtonTypeMaster] ([Id]);
GO

CREATE TABLE [GSMS].[ScreenButtonPermission]
(
    [Id] [INT] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
    [UserRoleAllocationId] [INT] NULL,
    [ScreenId] [INT] NOT NULL,
    [ScreenButtonId] [INT] NOT NULL,
    [IsVisible] [BIT] NOT NULL CONSTRAINT [DF_ScreenButtonPermission_IsVisible] DEFAULT (1),
    [IsEnabled] [BIT] NOT NULL CONSTRAINT [DF_ScreenButtonPermission_IsEnabled] DEFAULT (1),
    [IsActive] [BIT] NOT NULL CONSTRAINT [DF_ScreenButtonPermission_IsActive] DEFAULT (1),
    [CreatedBy] [INT] NULL,
    [CreatedDate] [DATETIME] NOT NULL CONSTRAINT [DF_ScreenButtonPermission_CreatedDate] DEFAULT (GETDATE()),
    [UpdatedBy] [INT] NULL,
    [UpdatedDate] [DATETIME] NULL,
    CONSTRAINT [PK_ScreenButtonPermission] PRIMARY KEY CLUSTERED ([Id])
);
GO

ALTER TABLE [GSMS].[ScreenButtonPermission] ADD CONSTRAINT [UK_ScreenButtonPermission]
UNIQUE
(
    [UserRoleAllocationId],
    [ScreenId],
    [ScreenButtonId]
);
GO

ALTER TABLE [GSMS].[ScreenButtonPermission] WITH CHECK ADD CONSTRAINT [FK_ScreenButtonPermission_UserRoleAllocation]
FOREIGN KEY ([UserRoleAllocationId]) REFERENCES [CORE].[UserRoleAllocation] ([Id]);
GO

ALTER TABLE [GSMS].[ScreenButtonPermission] WITH CHECK ADD CONSTRAINT [FK_ScreenButtonPermission_ScreenMaster]
FOREIGN KEY ([ScreenId]) REFERENCES [CORE].[ScreenMaster] ([Id]);
GO

ALTER TABLE [GSMS].[ScreenButtonPermission] WITH CHECK ADD CONSTRAINT [FK_ScreenButtonPermission_ScreenButtonMaster]
FOREIGN KEY ([ScreenButtonId]) REFERENCES [GSMS].[ScreenButtonMaster] ([Id]);
GO



