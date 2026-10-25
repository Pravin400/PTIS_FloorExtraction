
SET IDENTITY_INSERT [GSMS].[CommonRemarkDetails] ON 
GO
 INSERT [GSMS].[CommonRemarkDetails] ([Id], [RemarkTypeId], [Remark], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (10, 1, N'मोबाइल नंबर उपलब्ध नहीं है', 1, NULL, CAST(N'2026-05-05T17:52:13.767' AS DateTime), NULL, NULL)
 GO
 INSERT [GSMS].[CommonRemarkDetails] ([Id], [RemarkTypeId], [Remark], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (11, 1, N'मोबाइल नंबर सत्यापित नहीं है', 1, NULL, CAST(N'2026-05-05T17:52:13.767' AS DateTime), NULL, NULL)
 GO
 INSERT [GSMS].[CommonRemarkDetails] ([Id], [RemarkTypeId], [Remark], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (12, 1, N'मोबाइल नंबर गलत है', 1, NULL, CAST(N'2026-05-05T17:52:13.767' AS DateTime), NULL, NULL)
 GO
SET IDENTITY_INSERT [GSMS].[CommonRemarkDetails] OFF


GO
INSERT INTO [GSMS].[FieldTypeMaster]
(
    [FieldTypeName],
    [CreatedBy]
)
VALUES
('Text',1),
('Number',1),
('Dropdown',1),
('Date',1),
('Checkbox',1),
('File',1),
('Textarea',1),
('RadioButton',1),
('Password',1),
('MultiSelect',1);
GO

GO
INSERT INTO [GSMS].[ButtonTypeMaster]
(
    [ButtonTypeName],
    [CreatedBy]
)
VALUES
('Save',1),
('Update',1),
('Delete',1),
('Approve',1),
('Reject',1),
('Export',1),
('Print',1),
('Search',1),
('Reset',1),
('Submit',1);
GO

