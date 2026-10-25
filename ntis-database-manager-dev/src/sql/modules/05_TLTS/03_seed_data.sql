------------------- [TLIS].[FeesStructureMaster] ---------------

SET IDENTITY_INSERT [TLIS].[FeesStructureMaster] ON 
GO

INSERT [TLIS].[FeesStructureMaster] ([Id], [FeesStructure], [Description], [CreatedDate], [UpdatedDate], [CreatedBy], [UpdatedBy], [IsActive]) VALUES (1, N'System Define (Pre-Configured) ', N'System Define', 1, NULL, NULL, NULL, 1)
GO
INSERT [TLIS].[FeesStructureMaster] ([Id], [FeesStructure], [Description], [CreatedDate], [UpdatedDate], [CreatedBy], [UpdatedBy], [IsActive]) VALUES (2, N'Static (Fixed Amount )', N'Fixed Rate', 1, NULL, NULL, NULL, 1)
GO
SET IDENTITY_INSERT [TLIS].[FeesStructureMaster] OFF
GO



------------------- [TLIS].[LicenseSpanMaster] -----------------

SET IDENTITY_INSERT [TLIS].[LicenseSpanMaster] ON 
GO
INSERT [TLIS].[LicenseSpanMaster] ([Id], [LicenseSpan], [Description], [CreatedDate], [UpdatedDate], [CreatedBy], [UpdatedBy], [IsActive]) VALUES (1, N'1 January to 31 December ', N'New Year', 1, NULL, NULL, NULL, 1)
GO
INSERT [TLIS].[LicenseSpanMaster] ([Id], [LicenseSpan], [Description], [CreatedDate], [UpdatedDate], [CreatedBy], [UpdatedBy], [IsActive]) VALUES (2, N'1 April To 31 March', N'As per Finance Year', 1, NULL, NULL, NULL, 1)
GO
INSERT [TLIS].[LicenseSpanMaster] ([Id], [LicenseSpan], [Description], [CreatedDate], [UpdatedDate], [CreatedBy], [UpdatedBy], [IsActive]) VALUES (3, N'1 Year Validity', N'Yearly', 1, NULL, NULL, NULL, 1)
GO
INSERT [TLIS].[LicenseSpanMaster] ([Id], [LicenseSpan], [Description], [CreatedDate], [UpdatedDate], [CreatedBy], [UpdatedBy], [IsActive]) VALUES (4, N'3 Year Validity', N'Quaterly Year ', 1, NULL, NULL, NULL, 1)
GO
INSERT [TLIS].[LicenseSpanMaster] ([Id], [LicenseSpan], [Description], [CreatedDate], [UpdatedDate], [CreatedBy], [UpdatedBy], [IsActive]) VALUES (6, N'31 to 1 testing', N'testibg', CAST(N'2026-02-03T14:56:46.567' AS DateTime), 1, 54, NULL, 1)
GO
SET IDENTITY_INSERT [TLIS].[LicenseSpanMaster] OFF
GO


