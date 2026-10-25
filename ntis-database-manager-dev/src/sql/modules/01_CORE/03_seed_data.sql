
SET IDENTITY_INSERT [CORE].[DepartmentMaster] ON;

INSERT INTO [CORE].[DepartmentMaster]
(
    [Id],[DepartmentCode],[DepartmentName],
    [DepartmentNameLocal],[DepartmentIcon],
    [DepartmentDescription],[IsProtected],[IsActive],
    [CreatedBy],[CreatedDate],[UpdatedBy],[UpdatedDate]
)
SELECT *
FROM
(
    VALUES
    (1,'PTIS','Property Tax','string','string','string',1,1,0,GETDATE(),NULL,NULL),
    (2,'TL','Trade License','string','string','string',1,1,0,GETDATE(),NULL,NULL),
    (3,'AM','Asset Management','string','string','string',1,1,0,GETDATE(),NULL,NULL),
    (4,'WT','Water Tax','string','string','string',1,1,0,GETDATE(),NULL,NULL),
    (5,'GRV','Grievance Management','string','string','string',1,1,0,GETDATE(),NULL,NULL),
    (6,'FA','Fire Audit','string','string','string',1,1,0,GETDATE(),NULL,NULL)
) S
(
    Id,DepartmentCode,DepartmentName,
    DepartmentNameLocal,DepartmentIcon,
    DepartmentDescription,IsProtected,IsActive,
    CreatedBy,CreatedDate,UpdatedBy,UpdatedDate
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[DepartmentMaster] D
    WHERE D.Id = S.Id
       OR D.DepartmentCode = S.DepartmentCode
);

SET IDENTITY_INSERT [CORE].[DepartmentMaster] OFF;


IF NOT EXISTS
(
    SELECT 1
    FROM CORE.EmployeeTypeMaster
    WHERE EmployeeType = 'Office'
)
BEGIN
    INSERT INTO CORE.EmployeeTypeMaster
    (
        EmployeeType,
        IsActive,
        CreatedBy,
        CreatedDate
    )
    VALUES
    (
        'Office',
        1,
        1,
        GETDATE()
    );
END


/* =========================================
   UserRoleMaster
 =======================================*/
IF NOT EXISTS
(
    SELECT 1
    FROM CORE.UserRoleMaster
    WHERE UserRoleName = 'Admin'
)
BEGIN
    INSERT INTO CORE.UserRoleMaster
    (
        UserRoleName,
        DepartmentId,
        IsActive,
        CreatedBy,
        CreatedDate
    )
    VALUES
    (
        'Admin',
        1,
        1,
        1,
        GETDATE()
    );
END

IF NOT EXISTS
(
    SELECT 1
    FROM CORE.UserRoleMaster
    WHERE UserRoleName = 'FA_ADMIN'
)
BEGIN
    INSERT INTO CORE.UserRoleMaster
    (
        UserRoleName,
        DepartmentId,
        IsActive,
        CreatedBy,
        CreatedDate
    )
    VALUES
    (
        'FA_ADMIN',
        6,
        1,
        1,
        GETDATE()
    );
END


/* =========================================
   UserMaster
 =======================================*/

DECLARE @EmployeeTypeId INT =
(
    SELECT TOP 1 Id
    FROM CORE.EmployeeTypeMaster
    WHERE EmployeeType = 'Office'
);

IF NOT EXISTS
(
    SELECT 1
    FROM CORE.UserMaster
    WHERE UserName = 'ADMIN'
)
BEGIN
    INSERT INTO [CORE].[UserMaster]
    (
        [UserName],[FirstName],[MiddleName],[LastName],
        [UserCode],[Address],[MobileNo],
        [AlternateMobileNo],[Email],[MustChangePassword],
        [Language],[IsActive],[Remark],[EmployeeTypeId],
        [PasswordHash],[FailedLoginCount],[LastLoginAt],
        [LockedUntilAt],[CreatedBy],[CreatedDate],
        [UpdatedBy],[UpdatedDate],[MarkedForDeletion],
        [MarkedForDeletionDate],[UserLocked]
    )
    VALUES
    (
        N'ADMIN',
        N'ADMIN',
        N'ADMIN',
        N'ADMIN',
        N'PB',
        N'Amravati',
        N'7058601590',
        N'8625085936',
        N'ashwindeshmukh62@gmail.com',
        0,
        N'en',
        1,
        N'Test',
        @EmployeeTypeId,
        N'$2a$12$UrYOuPYbZ2y17gPcoIDtzu2V8GymSpKa/YBByn3q/Q0JxlmjixqAC',
        0,
        GETDATE(),
        NULL,
        1,
        GETDATE(),
        NULL,
        NULL,
        0,
        NULL,
        0
    );
END


/* =========================================
   Variable References
 =======================================*/
DECLARE @adminUserId INT =
(
    SELECT Id
    FROM CORE.UserMaster
    WHERE UserName = 'ADMIN'
);

DECLARE @AdminUserRoleId INT =
(
    SELECT Id
    FROM CORE.UserRoleMaster
    WHERE UserRoleName = 'Admin'
);

DECLARE @FaAdminRoleId INT =
(
    SELECT Id
    FROM CORE.UserRoleMaster
    WHERE UserRoleName = 'FA_ADMIN'
);


/* =========================================
   UserDepartmentAllocation
    =======================================*/

SET IDENTITY_INSERT [CORE].[UserDepartmentAllocation] ON;

INSERT INTO [CORE].[UserDepartmentAllocation]
(
    [Id],[UserId],[DepartmentId],
    [IsActive],[CreatedBy],
    [CreatedDate],[UpdatedBy],[UpdatedDate]
)
SELECT *
FROM
(
    VALUES
    (7,@adminUserId,1,1,1,GETDATE(),NULL,NULL),
    (8,@adminUserId,2,1,1,GETDATE(),NULL,NULL),
    (9,@adminUserId,3,1,1,GETDATE(),NULL,NULL),
    (10,@adminUserId,6,1,1,GETDATE(),NULL,NULL)
) S
(
    Id,UserId,DepartmentId,
    IsActive,CreatedBy,
    CreatedDate,UpdatedBy,UpdatedDate
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[UserDepartmentAllocation] UDA
    WHERE UDA.Id = S.Id
       OR (
            UDA.UserId = S.UserId
        AND UDA.DepartmentId = S.DepartmentId
       )
);

SET IDENTITY_INSERT [CORE].[UserDepartmentAllocation] OFF;


/* =========================================
   UserModuleAllocation
 =======================================*/

SET IDENTITY_INSERT [CORE].[UserModuleAllocation] ON;

INSERT INTO [CORE].[UserModuleAllocation]
(
    [Id],[UserId],[DepartmentId],[ModuleId],
    [IsActive],[CreatedBy],[CreatedDate],
    [UpdatedBy],[UpdatedDate]
)
SELECT *
FROM
(
    VALUES
    (5,@adminUserId,1,1,1,1,GETDATE(),NULL,NULL),
    (6,@adminUserId,2,1001,1,1,GETDATE(),NULL,NULL),
    (7,@adminUserId,3,1004,1,1,GETDATE(),NULL,NULL),
    (8,@adminUserId,6,1201,1,1,GETDATE(),NULL,NULL)
) S
(
    Id,UserId,DepartmentId,ModuleId,
    IsActive,CreatedBy,CreatedDate,
    UpdatedBy,UpdatedDate
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[UserModuleAllocation] UMA
    WHERE UMA.Id = S.Id
       OR (
            UMA.UserId = S.UserId
        AND UMA.DepartmentId = S.DepartmentId
        AND UMA.ModuleId = S.ModuleId
       )
);

SET IDENTITY_INSERT [CORE].[UserModuleAllocation] OFF;


/* =========================================
   UserRoleAllocation
    =======================================*/

SET IDENTITY_INSERT [CORE].[UserRoleAllocation] ON;

INSERT INTO [CORE].[UserRoleAllocation]
(
    [Id],[UserId],[DepartmentId],[UserRoleId],
    [IsActive],[CreatedBy],[CreatedDate],
    [UpdatedBy],[UpdatedDate]
)
SELECT *
FROM
(
    VALUES
    (4,@adminUserId,1,@AdminUserRoleId,1,1,GETDATE(),NULL,NULL),
    (5,@adminUserId,2,@AdminUserRoleId,1,1,GETDATE(),NULL,NULL),
    (6,@adminUserId,3,@AdminUserRoleId,1,1,GETDATE(),NULL,NULL),
    (7,@adminUserId,6,@FaAdminRoleId,1,1,GETDATE(),NULL,NULL)
) S
(
    Id,UserId,DepartmentId,UserRoleId,
    IsActive,CreatedBy,CreatedDate,
    UpdatedBy,UpdatedDate
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[UserRoleAllocation] URA
    WHERE URA.Id = S.Id
       OR (
            URA.UserId = S.UserId
        AND URA.DepartmentId = S.DepartmentId
        AND URA.UserRoleId = S.UserRoleId
       )
);

SET IDENTITY_INSERT [CORE].[UserRoleAllocation] OFF;
GO



SET IDENTITY_INSERT [CORE].[ModuleMaster] ON;

;WITH SeedData AS
(
    SELECT *
    FROM
    (
        VALUES
        (1, 1, N'PTIS_M', N'Property Tax', N'Property Tax', N'home', N'PTIS', N'Property Tax Module', 1, 1, GETDATE(), NULL, NULL),
        (1001, 2, N'TL_M', N'Trade License', N'Trade License', N'home', N'TL', N'Trade License Module', 1, 1, GETDATE(), NULL, NULL),
        (1004, 3, N'ASSET_M', N'Asset Management', N'मालमत्ता व्यवस्थापन', N'inventory_2', N'ASSET', N'Asset Management Module', 1, 1, GETDATE(), NULL, NULL),
        (1201, 6, N'FA_M', N'Fire Audit', N'अग्नि लेखापरीक्षण', N'local_fire_department', N'FA', N'Fire Audit module', 1, 1, GETDATE(), NULL, NULL),
        (1005, 5, N'GRV_M', N'Grievance Management', N'तक्रार व्यवस्थापन', NULL, N'GRV', N'Grievance Management Module', 1, 1, GETDATE(), NULL, NULL)
        
    ) AS V
    (
        Id, DepartmentId, ModuleCode, ModuleName, ModuleNameLocal,
        ModuleIcon, ModuleLabel, ModuleDescription,
        IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate
    )
)
INSERT INTO [CORE].[ModuleMaster]
(
    [Id],[DepartmentId],[ModuleCode],[ModuleName],[ModuleNameLocal],
    [ModuleIcon],[ModuleLabel],[ModuleDescription],
    [IsActive],[CreatedBy],[CreatedDate],[UpdatedBy],[UpdatedDate]
)
SELECT
    S.Id,
    S.DepartmentId,
    S.ModuleCode,
    S.ModuleName,
    S.ModuleNameLocal,
    S.ModuleIcon,
    S.ModuleLabel,
    S.ModuleDescription,
    ISNULL(S.IsActive,1),
    S.CreatedBy,
    ISNULL(S.CreatedDate,GETDATE()),
    S.UpdatedBy,
    S.UpdatedDate
FROM SeedData S
WHERE EXISTS
(
    SELECT 1
    FROM [CORE].[DepartmentMaster] D
    WHERE D.Id = S.DepartmentId
)
AND NOT EXISTS
(
    SELECT 1
    FROM [CORE].[ModuleMaster] MM
    WHERE MM.Id = S.Id
       OR MM.ModuleCode = S.ModuleCode
       OR MM.ModuleName = S.ModuleName
);

SET IDENTITY_INSERT [CORE].[ModuleMaster] OFF;


SET IDENTITY_INSERT [CORE].[ScreenGroupMaster] ON;

;WITH SeedData AS
(
    SELECT *
    FROM
    (
        VALUES
        (1, N'Masters', N'Masters', N'Masters', N'one', 1, 1, NULL, CAST(N'2026-01-09T11:06:52.080' AS DATETIME), NULL, CAST(N'2026-05-07T16:26:08.887' AS DATETIME)),
        (2, N'Configuration Setting', N'Configuration Setting', NULL, N'FolderTree', 1, 0, NULL, CAST(N'2026-03-25T12:38:09.827' AS DATETIME), NULL, CAST(N'2026-04-06T14:37:29.003' AS DATETIME)),
        (3, N'GRP_DASHBOARD', N'Dashboard', N'GRP', N'dashboard', 1, 1, 1, CAST(N'2026-05-05T19:50:22.753' AS DATETIME), NULL, NULL),

        (1003, N'SG004_A', N'वापरकर्ता व्यवस्थापन', N'वापरकर्ता व्यवस्थापन', N'user-icon', 5, 1, 1, CAST(N'2026-05-06T15:43:16.677' AS DATETIME), 1, CAST(N'2026-05-07T18:51:57.687' AS DATETIME)),


        (1005, N'SG004_C', N'User Management', N'User_M', N'user-icon', 4, 1, 1, CAST(N'2026-05-06T16:10:02.513' AS DATETIME), NULL, NULL),

        (1006, N'SG005', N'Reports', N'अहवाल', N'report-icon', 5, 0, 1, CAST(N'2026-05-06T17:40:53.643' AS DATETIME), NULL, CAST(N'2026-05-07T16:54:29.060' AS DATETIME)),

        -- Asset Management screen groups
        (4001, N'ASSET_DASHBOARD_GRP', N'Dashboard',            N'डॅशबोर्ड',              N'dashboard',       1, 1, 1, GETDATE(), NULL, NULL),
        (4002, N'ASSET_MUNICIPAL_GRP', N'Municipal Assets',     N'महानगरपालिका मालमत्ता',  N'account_balance', 2, 1, 1, GETDATE(), NULL, NULL),
        (4003, N'ASSET_REVENUE_GRP',   N'Revenue Management',   N'महसूल व्यवस्थापन',       N'payments',        3, 1, 1, GETDATE(), NULL, NULL),
        (4004, N'ASSET_CONFIG_GRP',    N'Configure Masters',              N'कॉन्फिगर मास्टर्स',               N'settings',        4, 1, 1, GETDATE(), NULL, NULL),
        (5001, N'FA_ADMIN_GRP',        N'Configure Masters',              N'कॉन्फिगर मास्टर्स',               N'settings',        1, 1, 1, GETDATE(), NULL, NULL),

        -- PTIS Screen Group
        (1008, N'PTIS_CODE', N'PTIS', N'PTIS', NULL, 0, 1, NULL, CAST(N'2026-05-12T17:19:53.977' AS DATETIME), 1, CAST(N'2026-08-20T11:36:33.673' AS DATETIME))
    ) AS V
    (
        Id, ScreenGroupCode, ScreenGroupName, ScreenGroupNameLocal,
        ScreenGroupIcon, DisplayOrder, IsActive,
        CreatedBy, CreatedDate, UpdatedBy, UpdatedDate
    )
)

INSERT INTO [CORE].[ScreenGroupMaster]
(
    [Id], [ScreenGroupCode], [ScreenGroupName], [ScreenGroupNameLocal],
    [ScreenGroupIcon], [DisplayOrder], [IsActive],
    [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]
)
SELECT
    S.Id,
    S.ScreenGroupCode,
    S.ScreenGroupName,
    S.ScreenGroupNameLocal,
    S.ScreenGroupIcon,
    ISNULL(S.DisplayOrder,1),
    ISNULL(S.IsActive,1),
    S.CreatedBy,
    ISNULL(S.CreatedDate,GETDATE()),
    S.UpdatedBy,
    S.UpdatedDate
FROM SeedData S
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[ScreenGroupMaster] X
    WHERE X.Id = S.Id
)
AND NOT EXISTS
(
    SELECT 1
    FROM [CORE].[ScreenGroupMaster] X
    WHERE X.ScreenGroupCode = S.ScreenGroupCode
);

SET IDENTITY_INSERT [CORE].[ScreenGroupMaster] OFF;



SET IDENTITY_INSERT [CORE].[ScreenMaster] ON;

;WITH SeedData AS
(
    SELECT *
    FROM
    (
        VALUES
        (1,1,1,N'M',N'Data Analytics',N'Data Analytics',N'',N'proprtytax/departmentmaster',1,0,0,1,1,NULL,CAST('2026-01-09T11:08:13.743' AS DATETIME),NULL,CAST('2026-04-06T15:24:22.910' AS DATETIME)),
        (2,2,1,N'BM',N'Search Property',N'Search Property',NULL,N'/bank-master',1,0,0,1,2,NULL,CAST('2026-03-25T12:38:22.990' AS DATETIME),NULL,NULL),
        (3,2,1,N'SM',N'PTIS',N'PTIS',NULL,N'/screen-access',1,1,0,1,3,NULL,CAST('2026-03-25T12:38:22.990' AS DATETIME),NULL,NULL),
        (4,2,1,N'OM',N'Report Engine',N'Report Engine',NULL,N'/office-master',1,1,0,1,4,NULL,CAST('2026-03-25T12:38:22.990' AS DATETIME),NULL,NULL),
        (5,2,1,N'UC',N'GIS',N'GIS',NULL,N'/ulb-configuration',1,1,0,1,5,NULL,CAST('2026-03-25T12:38:22.990' AS DATETIME),NULL,NULL),
        (6,2,1,N'FY',N'Master',N'Master',NULL,N'/financial-year-master',1,1,0,1,6,NULL,CAST('2026-03-25T12:38:22.990' AS DATETIME),NULL,NULL),
        (7,2,1,N'PM',N'User Management',N'User Management',NULL,N'/payment-mode-master',1,1,0,1,7,NULL,CAST('2026-03-25T12:38:22.990' AS DATETIME),NULL,NULL),
        (8,1,1,N'TEST',N'test',N'test',N'Monitor',N'/test',1,1,0,1,8,NULL,CAST('2026-04-06T14:38:12.743' AS DATETIME),2,CAST('2026-05-05T19:33:13.623' AS DATETIME)),
        (1008,2,1001,N'SRC101',N'Screen Name 101',N'Screen Name 101',N'Monitor',N'/scr-101',1,1,0,1,9,NULL,CAST('2026-04-09T16:03:50.443' AS DATETIME),NULL,NULL),
        (1009,1,1,N'TEST1',N'test1',N'test1',N'Monitor',N'/tst1',1,1,0,1,10,NULL,CAST('2026-04-09T19:03:11.097' AS DATETIME),NULL,NULL),
        (1011,1,1,N'CT_01',N'Construction Type',N'बांधकाम प्रकार',NULL,N'/construction-type',1,1,0,1,1,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1012,1,1,N'FM_01',N'Floor Master',N'मजला मास्टर',NULL,N'/floor-master/floor',1,1,0,1,2,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1013,1,1,N'DM_01',N'Depreciation Master',N'घसारा मास्टर',NULL,N'/depreciationmaster',1,1,0,0,3,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,CAST('2026-05-08T16:24:38.507' AS DATETIME)),
        (1014,1,1,N'TU_01',N'Type of Use Master',N'वापर प्रकार मास्टर',NULL,N'/typeofusemaster',1,1,0,1,4,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1015,1,1,N'TZ_01',N'Tax Zone',N'कर क्षेत्र',NULL,N'/taxzone',1,1,0,1,5,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1016,1,1,N'RS_01',N'Rate Section Master',N'दर विभाग मास्टर',NULL,N'/rate-section-master',1,1,0,1,6,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1017,1,1,N'ZM_01_A',N'Zone Master',N'झोन मास्टर',NULL,N'/zone-master',1,1,0,1,7,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1018,1,1,N'RM_01',N'Rate Master (RV)',N'दर मास्टर (RV)',NULL,N'/rate-master/rvratemaster',1,1,0,1,8,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1019,1,1,N'RP_01',N'Retention Policy (Year)',N'रिटेन्शन पॉलिसी (वर्ष)',NULL,N'/retentionpolicy/yearwise',1,1,0,1,9,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1020,1,1,N'RP_02',N'Retention Policy (Factor)',N'रिटेन्शन पॉलिसी (फॅक्टर)',NULL,N'/retentionpolicy/factorwise',1,1,0,1,10,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1021,1,1,N'WM_01',N'Weightage Master',N'वेटेज मास्टर',NULL,N'/weightage-master',1,1,0,1,11,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1022,1,1,N'TN_01',N'Tax Zoning',N'कर झोनिंग',NULL,N'/taxzoning',1,1,0,1,12,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1023,1,1,N'AY_01',N'Assessment Year Range',N'मूल्यांकन वर्ष श्रेणी',NULL,N'/assessment-year-range/capitalvalue',1,1,0,1,13,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1024,1,1,N'MJ_01',N'Mouja Master',N'मौजा मास्टर',NULL,N'/moujamaster',1,1,0,1,14,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (1025,1,1,N'PY_01',N'Property Type',N'मालमत्ता प्रकार',NULL,N'/propertytype',1,1,0,1,15,NULL,CAST('2026-04-28T15:46:49.360' AS DATETIME),NULL,NULL),
        (2011,1,1,N'ZM_01_B',N'Zone Master',N'झोन मास्टर',NULL,N'/zone-master',1,1,0,1,7,1,CAST('2026-05-05T16:10:46.620' AS DATETIME),NULL,NULL),
        (2012,2,1,N'T1',N'TestTest',N'TestTest',N'Monitor',N'/testtest',0,1,0,1,0,2,CAST('2026-05-05T19:26:47.937' AS DATETIME),NULL,NULL),
        (3011,1,1,N'SCR_DASHBOARD',N'Dashboard',N'मुख्यपृष्ठ',N'dashboard-icon',N'/dashboard',1,1,0,1,1,1,CAST('2026-05-08T11:22:48.963' AS DATETIME),NULL,NULL),
        (3012,2,1,N'AMC_A',N'महानगरपालिका डॅशबोर्ड',N'म.न.पा. मुख्यपृष्ठ',N'AMC-icon',N'/amc',1,1,0,1,1,1,CAST('2026-05-08T12:57:11.273' AS DATETIME),NULL,NULL),
        (3013,2,1,N'AMC_B',N'पुणे_ऑफिस-डॅशबोर्ड',N'म.न_पा',N'AMC-icon',N'/amc',1,0,0,1,1,2,CAST('2026-05-08T13:21:56.270' AS DATETIME),NULL,NULL),

        -- Asset Management screens (ModuleId 1004 = ASSET, groups 4001-4004)
        (4001,4001,1004,N'ASSET_DASHBOARD',      N'Dashboard',             N'डॅशबोर्ड',                N'dashboard',       N'/assets/dashboard/master-dashboard',1,1,0,1,1,1,GETDATE(),NULL,NULL),
        (4002,4002,1004,N'MUNICIPAL_ASSET',      N'Municipal Assets',      N'महानगरपालिका मालमत्ता',    N'account_balance', N'/assets/municipal-Asset',           1,1,0,1,1,1,GETDATE(),NULL,NULL),
        (4003,4003,1004,N'MANAGE_RENTAL_DETAILS',N'Manage Rental Details', N'भाडे तपशील व्यवस्थापन',   N'groups',          N'/assets/revenue/manage-renters',    1,1,0,1,1,1,GETDATE(),NULL,NULL),
        (4004,4003,1004,N'PAYMENT',              N'Payment',               N'पेमेंट',                  N'payment',         N'/assets/revenue/payment',           1,1,0,1,2,1,GETDATE(),NULL,NULL),
        -- Old generic Configuration Master menu item: superseded by the granular
        -- master-data screens below (4006-4026), so seeded INACTIVE (IsActive = 0).
        (4005,4004,1004,N'CONFIGURATION_MASTER', N'Configuration Master',  N'कॉन्फिगरेशन मास्टर',      N'settings',        N'/assets/configuration/master-data', 1,1,0,0,1,1,GETDATE(),NULL,NULL),

        -- Asset master-data configuration screens (group 4004 = Masters, module 1004 = ASSET)
        (4006,4004,1004,N'ASSET_MASTER_ASSET_CATEGORY',  N'Asset Category',      N'मालमत्ता श्रेणी',       N'category',        N'/assets/configuration/master-data/asset-category',     1,1,0,1,1, 1,GETDATE(),NULL,NULL),
        (4007,4004,1004,N'ASSET_MASTER_ASSET_PHOTO_TYPE',N'Asset Photo Type',    N'मालमत्ता फोटो प्रकार',   N'photo_camera',    N'/assets/configuration/master-data/asset-photo-type',   1,1,0,1,2, 1,GETDATE(),NULL,NULL),
        (4008,4004,1004,N'ASSET_MASTER_ASSET_ROOM_TYPE', N'Asset Room Type',     N'मालमत्ता खोली प्रकार',   N'meeting_room',    N'/assets/configuration/master-data/asset-room-type',    1,1,0,1,3, 1,GETDATE(),NULL,NULL),
        (4009,4004,1004,N'ASSET_MASTER_ASSET_TYPE',      N'Asset Type',          N'मालमत्ता प्रकार',        N'inventory_2',     N'/assets/configuration/master-data/asset-type',         1,1,0,1,4, 1,GETDATE(),NULL,NULL),
        (4010,4004,1004,N'ASSET_MASTER_GST',             N'GST Master',          N'जीएसटी मास्टर',          N'receipt_long',    N'/assets/configuration/master-data/gst-master',         1,1,0,1,5, 1,GETDATE(),NULL,NULL),
        (4011,4004,1004,N'ASSET_MASTER_INVENTORY_CATEGORY',N'Inventory Category',N'इन्व्हेंटरी श्रेणी',      N'category',        N'/assets/configuration/master-data/inventory-category', 1,1,0,1,6, 1,GETDATE(),NULL,NULL),
        (4012,4004,1004,N'ASSET_MASTER_INVENTORY_CONDITION',N'Condition Master',N'स्थिती मास्टर',    N'fact_check',      N'/assets/configuration/master-data/inventory-condition',1,1,0,1,7, 1,GETDATE(),NULL,NULL),
        (4013,4004,1004,N'ASSET_MASTER_INVENTORY_MODEL', N'Inventory Model',     N'इन्व्हेंटरी मॉडेल',       N'view_module',     N'/assets/configuration/master-data/inventory-model',    1,1,0,1,8, 1,GETDATE(),NULL,NULL),
        (4014,4004,1004,N'ASSET_MASTER_INVENTORY_NAME',  N'Inventory Name',      N'इन्व्हेंटरी नाव',        N'label',           N'/assets/configuration/master-data/inventory-name',     1,1,0,1,9, 1,GETDATE(),NULL,NULL),
        (4015,4004,1004,N'ASSET_MASTER_OWNERSHIP_TYPE',  N'Ownership Type',      N'मालकी प्रकार',           N'home',            N'/assets/configuration/master-data/ownership-type',     1,1,0,1,10,1,GETDATE(),NULL,NULL),
        (4016,4004,1004,N'ASSET_MASTER_OWNING_DEPARTMENT',N'Owning Department',  N'मालकी विभाग',            N'account_balance', N'/assets/configuration/master-data/owning-department',  1,1,0,1,11,1,GETDATE(),NULL,NULL),
        (4017,4004,1004,N'ASSET_MASTER_PENALTY_RULE',    N'Penalty Rule Master', N'दंड नियम मास्टर',        N'rule',            N'/assets/configuration/master-data/penalty-rule-master',1,1,0,1,12,1,GETDATE(),NULL,NULL),
        (4018,4004,1004,N'ASSET_MASTER_TYPE_OF_USE',     N'Type of Use Master',  N'वापर प्रकार मास्टर',      N'business',        N'/assets/configuration/master-data/type-of-use',        1,1,0,1,13,1,GETDATE(),NULL,NULL),
        (4019,4004,1004,N'ASSET_MASTER_DESIGNATION',     N'Designation Master',  N'पदनाम मास्टर',            N'badge',           N'/assets/configuration/master-data/designation-master', 1,1,0,1,14,1,GETDATE(),NULL,NULL),
        (4020,4004,1004,N'ASSET_MASTER_GRIEVANCE_CATEGORY',N'Grievance Category Master',N'तक्रार श्रेणी मास्टर', N'report_problem', N'/assets/configuration/master-data/grievance-category-master',1,1,0,1,15,1,GETDATE(),NULL,NULL),
        (4021,4004,1004,N'ASSET_MASTER_GRIEVANCE_REMARK',N'Grievance Remark Master',N'तक्रार शेरा मास्टर',    N'comment',         N'/assets/configuration/master-data/grievance-remark-master',1,1,0,1,16,1,GETDATE(),NULL,NULL),
        (4022,4004,1004,N'ASSET_MASTER_MOUJA_SUBZONE',   N'Mouja Subzone',       N'मौजा उपक्षेत्र',           N'map',             N'/assets/configuration/master-data/mouja-subzone',      1,1,0,1,17,1,GETDATE(),NULL,NULL),
        (4023,4004,1004,N'ASSET_MASTER_DOCUMENT_DEFINITION',N'Asset Document Definition Master',N'मालमत्ता दस्तऐवज व्याख्या मास्टर',N'description',N'/assets/configuration/master-data/asset-document-definition',1,1,0,1,18,1,GETDATE(),NULL,NULL),
        (4024,4004,1004,N'ASSET_MASTER_ASSESSMENT_YEAR_RANGE_CV',N'Assessment Year Range - Capital Value',N'मूल्यांकन वर्ष श्रेणी - भांडवली मूल्य',N'date_range',N'/assets/configuration/master-data/assessment-year-range/capitalvalue',1,1,0,1,19,1,GETDATE(),NULL,NULL),
        (4025,4004,1004,N'ASSET_MASTER_WEIGHTAGE',       N'Weightage Master - Weightage',N'वेटेज मास्टर - वेटेज',   N'balance',         N'/assets/configuration/master-data/weightage-master',   1,1,0,1,20,1,GETDATE(),NULL,NULL),
        (4026,4004,1004,N'ASSET_MASTER_FIELD_DEFINITION',N'Asset Field Definition Master',N'मालमत्ता फील्ड व्याख्या मास्टर',N'dynamic_form',N'/assets/configuration/master-data/asset-field-definition',1,1,0,1,21,1,GETDATE(),NULL,NULL),

        -- PTIS Extended Area Assessment - Single Assessment (ScreenGroupId 1008 = PTIS)
        (5001,1008,1,N'EA_01',N'Extended Area Assessment - Single Assessment',N'विस्तारित क्षेत्र मूल्यांकन - एकल मूल्यांकन',N'calculator',N'/extended-area-assesment/single-assessment',1,1,0,1,9,NULL,GETDATE(),NULL,NULL),

        -- PTIS Dynamic Tax Register (ScreenGroupId 1 = Masters)
        (5002,1,1,N'DTR_01',N'Tax Percentage Master',N'कर टक्केवारी मास्टर',N'percent',N'/property-tax/dynamic-tax-register',1,1,0,1,16,NULL,GETDATE(),NULL,NULL),

        -- Fire Audit. Screen ids start at 5101 because 5001 and 5002 are already PTIS screens.
        (5101,5001,1201,N'FA_HOME',         N'Fire Audit',           N'अग्नि लेखापरीक्षण',     N'local_fire_department', N'/fire-audit',                         1,1,0,1,1, 1,GETDATE(),NULL,NULL),
        (5102,5001,1201,N'FA_MST_OVERLAY',  N'Jurisdiction',         N'अधिकार क्षेत्र',        N'gavel',                 N'/fire-audit/masters/jurisdiction',    1,1,0,1,2, 1,GETDATE(),NULL,NULL),
        (5103,5001,1201,N'FA_MST_OCCUPANCY',N'Occupancy',            N'वापर प्रकार',           N'apartment',             N'/fire-audit/masters/occupancy',       1,1,0,1,3, 1,GETDATE(),NULL,NULL),
        (5104,5001,1201,N'FA_MST_BAND',     N'Requirement bands',    N'आवश्यकता पट्टे',        N'straighten',            N'/fire-audit/masters/bands',           1,1,0,1,4, 1,GETDATE(),NULL,NULL),
        (5105,5001,1201,N'FA_MST_CHECKLIST',N'Checklist catalog',    N'तपासणी यादी',           N'checklist',             N'/fire-audit/masters/checklist-items', 1,1,0,1,5, 1,GETDATE(),NULL,NULL),
        (5106,5001,1201,N'FA_MST_MATRIX',   N'Requirement matrix',   N'आवश्यकता मॅट्रिक्स',    N'grid_on',               N'/fire-audit/masters/matrix',          1,1,0,1,6, 1,GETDATE(),NULL,NULL),
        (5107,5001,1201,N'FA_MST_APPTYPE',  N'Application types',    N'अर्ज प्रकार',           N'description',           N'/fire-audit/masters/application-types',1,1,0,1,7,1,GETDATE(),NULL,NULL),
        (5108,5001,1201,N'FA_MST_DOCTYPE',  N'Document types',       N'दस्तऐवज प्रकार',        N'folder',                N'/fire-audit/masters/document-types',  1,1,0,1,8, 1,GETDATE(),NULL,NULL),
        (5109,5001,1201,N'FA_MST_STATION',  N'Fire stations',        N'अग्निशमन केंद्र',       N'local_fire_department', N'/fire-audit/masters/stations',        1,1,0,1,9, 1,GETDATE(),NULL,NULL),
        (5110,5001,1201,N'FA_MST_FEEHEAD',  N'Fee heads',            N'शुल्क शीर्ष',           N'payments',              N'/fire-audit/masters/fee-heads',       1,1,0,1,10,1,GETDATE(),NULL,NULL),
        (5111,5001,1201,N'FA_MST_FEERULE',  N'Fee rules',            N'शुल्क नियम',            N'rule',                  N'/fire-audit/masters/fee-rules',       1,1,0,1,11,1,GETDATE(),NULL,NULL),
        (5112,5001,1201,N'FA_MST_STATUS',   N'Status catalog',       N'स्थिती यादी',           N'flag',                  N'/fire-audit/masters/statuses',        1,1,0,1,12,1,GETDATE(),NULL,NULL)
    ) AS V
    (
        Id,ScreenGroupId,ModuleId,ScreenCode,ScreenName,ScreenNameLocal,
        ScreenIcon,RoutePath,IsMenu,IsAuthenticationRequired,IsPropertyLockable,
        IsActive,DisplayOrder,CreatedBy,CreatedDate,UpdatedBy,UpdatedDate
    )
)

INSERT INTO [CORE].[ScreenMaster]
(
    [Id],[ScreenGroupId],[ModuleId],[ScreenCode],[ScreenName],
    [ScreenNameLocal],[ScreenIcon],[RoutePath],[IsMenu],
    [IsAuthenticationRequired],[IsPropertyLockable],[IsActive],[DisplayOrder],
    [CreatedBy],[CreatedDate],[UpdatedBy],[UpdatedDate]
)
SELECT
    S.Id,
    S.ScreenGroupId,
    S.ModuleId,
    S.ScreenCode,
    S.ScreenName,
    S.ScreenNameLocal,
    S.ScreenIcon,
    S.RoutePath,
    S.IsMenu,
    S.IsAuthenticationRequired,
    S.IsPropertyLockable,
    ISNULL(S.IsActive,1),
    ISNULL(S.DisplayOrder,1),
    S.CreatedBy,
    ISNULL(S.CreatedDate,GETDATE()),
    S.UpdatedBy,
    S.UpdatedDate
FROM SeedData S
INNER JOIN [CORE].[ScreenGroupMaster] SG
    ON SG.Id = S.ScreenGroupId
INNER JOIN [CORE].[ModuleMaster] MM
    ON MM.Id = S.ModuleId
LEFT JOIN [CORE].[ScreenMaster] SM
    ON SM.Id = S.Id
WHERE SM.Id IS NULL
AND NOT EXISTS
(
    SELECT 1
    FROM [CORE].[ScreenMaster] X
    WHERE X.ScreenCode = S.ScreenCode
);

SET IDENTITY_INSERT [CORE].[ScreenMaster] OFF;


/* =========================================
   RoleWiseScreenAccessMaster
    =======================================*/

SET IDENTITY_INSERT [CORE].[RoleWiseScreenAccessMaster] ON;

;WITH SeedData AS
(
    SELECT *
    FROM
    (
        VALUES
        (1,1,1,1,0,0,0,0,1,GETDATE(),NULL,CAST('2026-05-05T17:13:17.827' AS DATETIME),2),
        (2,1,2,1,0,0,0,0,1,GETDATE(),NULL,CAST('2026-04-23T16:23:59.647' AS DATETIME),2),
        (3,1,3,1,1,0,0,0,1,GETDATE(),NULL,CAST('2026-04-23T16:24:04.193' AS DATETIME),2),
        (4,1,4,1,1,1,1,0,1,GETDATE(),NULL,NULL,NULL),
        (5,1,5,1,1,0,0,0,1,GETDATE(),NULL,CAST('2026-04-23T16:23:59.647' AS DATETIME),2),
        (6,1,6,1,1,1,1,0,1,GETDATE(),NULL,NULL,NULL),
        (7,1,7,1,0,0,0,0,1,GETDATE(),NULL,CAST('2026-04-23T16:23:59.647' AS DATETIME),2),
        (8,1,8,1,0,0,0,0,1,CAST('2026-04-23T16:24:04.243' AS DATETIME),2,NULL,NULL),
        (10,1,1008,1,0,0,0,0,1,CAST('2026-04-23T16:24:04.243' AS DATETIME),2,NULL,NULL),
        (11,1,1009,1,1,0,0,0,1,CAST('2026-04-23T16:24:04.243' AS DATETIME),2,NULL,NULL),
        (1008,1,1012,1,0,0,0,0,1,CAST('2026-05-05T11:45:44.033' AS DATETIME),3,NULL,NULL),
        (1009,1,2012,1,1,0,0,0,1,CAST('2026-05-05T19:32:49.543' AS DATETIME),2,NULL,NULL),

        -- Asset Management screen access (Admin role = full access on screens 4001-4005)
        (2001,1,4001,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2002,1,4002,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2003,1,4003,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2004,1,4004,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2005,1,4005,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),

        -- Admin full access to the asset master-data screens (4006-4026)
        (2006,1,4006,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2007,1,4007,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2008,1,4008,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2009,1,4009,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2010,1,4010,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2011,1,4011,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2012,1,4012,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2013,1,4013,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2014,1,4014,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2015,1,4015,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2016,1,4016,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2017,1,4017,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2018,1,4018,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2019,1,4019,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2020,1,4020,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2021,1,4021,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2022,1,4022,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2023,1,4023,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2024,1,4024,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2025,1,4025,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),
        (2026,1,4026,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),

        -- Extended Area Assessment screen access for Admin role
        (5001,1,5001,1,1,1,1,0,1,GETDATE(),1,NULL,NULL),

        -- Dynamic Tax Register screen access for Admin role
        (5002,1,5002,1,1,1,1,0,1,GETDATE(),1,NULL,NULL)
    ) AS V
    (
        Id,UserRoleId,ScreenId,
        CanView,CanEdit,CanDelete,
        HaveFullAccess,HaveNoAccess,
        IsActive,CreatedDate,
        CreatedBy,UpdatedDate,UpdatedBy
    )
)

INSERT INTO [CORE].[RoleWiseScreenAccessMaster]
(
    [Id],[UserRoleId],[ScreenId],
    [CanView],[CanEdit],[CanDelete],
    [HaveFullAccess],[HaveNoAccess],
    [IsActive],[CreatedDate],
    [CreatedBy],[UpdatedDate],[UpdatedBy]
)
SELECT
    S.Id,
    S.UserRoleId,
    S.ScreenId,
    S.CanView,
    S.CanEdit,
    S.CanDelete,
    S.HaveFullAccess,
    S.HaveNoAccess,
    ISNULL(S.IsActive,1),
    ISNULL(S.CreatedDate,GETDATE()),
    S.CreatedBy,
    S.UpdatedDate,
    S.UpdatedBy
FROM SeedData S
INNER JOIN [CORE].[UserRoleMaster] UR
    ON UR.Id = S.UserRoleId
INNER JOIN [CORE].[ScreenMaster] SM
    ON SM.Id = S.ScreenId
LEFT JOIN [CORE].[RoleWiseScreenAccessMaster] RW
    ON RW.Id = S.Id
    OR (RW.UserRoleId = S.UserRoleId AND RW.ScreenId = S.ScreenId)
WHERE RW.Id IS NULL;

SET IDENTITY_INSERT [CORE].[RoleWiseScreenAccessMaster] OFF;

INSERT INTO [CORE].[RoleWiseScreenAccessMaster]
(
    [UserRoleId],[ScreenId],
    [CanView],[CanEdit],[CanDelete],
    [HaveFullAccess],[HaveNoAccess],
    [IsActive],[CreatedDate],[CreatedBy]
)
SELECT
    UR.Id,
    SM.Id,
    1,
    CASE WHEN SM.ScreenCode = N'FA_MST_STATUS' THEN 0 ELSE 1 END,
    CASE WHEN SM.ScreenCode = N'FA_MST_STATUS' THEN 0 ELSE 1 END,
    CASE WHEN SM.ScreenCode = N'FA_MST_STATUS' THEN 0 ELSE 1 END,
    0,
    1,
    GETDATE(),
    1
FROM [CORE].[UserRoleMaster] UR
INNER JOIN [CORE].[ScreenMaster] SM
    ON SM.ModuleId = 1201
   AND SM.ScreenCode LIKE N'FA[_]%'
WHERE UR.UserRoleName = N'FA_ADMIN'
AND NOT EXISTS
(
    SELECT 1
    FROM [CORE].[RoleWiseScreenAccessMaster] RW
    WHERE RW.UserRoleId = UR.Id
      AND RW.ScreenId = SM.Id
);


SET IDENTITY_INSERT [CORE].[CommonRemarkTypeMaster] ON;

IF NOT EXISTS (
    SELECT 1
    FROM [CORE].[CommonRemarkTypeMaster]
    WHERE [Id] = 1
       OR [RemarkTypeName] = 'MobileNoRemark'
)
BEGIN
    INSERT INTO [CORE].[CommonRemarkTypeMaster]
        ([Id],[RemarkTypeName],[IsActive],[CreatedBy],[CreatedDate],[UpdatedBy],[UpdatedDate])
    VALUES
        (1,'MobileNoRemark',1,NULL,'2026-05-05T17:23:40.557',NULL,NULL);
END

SET IDENTITY_INSERT [CORE].[CommonRemarkTypeMaster] OFF;


  SET IDENTITY_INSERT [CORE].[ConfigCategoryMaster] ON 
GO
INSERT [CORE].[ConfigCategoryMaster] ([Id], [CategoryCode], [CategoryName], [DisplayOrder], [IsActive], [CreatedDate], [CreatedBy], [UpdatedDate], [UpdatedBy]) VALUES (1, N'SECURITY_AUTH', N'Security & Authentication', 1, 1, GETDATE(), 1, NULL, NULL)
GO
INSERT [CORE].[ConfigCategoryMaster] ([Id], [CategoryCode], [CategoryName], [DisplayOrder], [IsActive], [CreatedDate], [CreatedBy], [UpdatedDate], [UpdatedBy]) VALUES (5, N'Payment', N'Payment Configurations', 3, 0, GETDATE(), 1, NULL, NULL)
GO
INSERT [CORE].[ConfigCategoryMaster] ([Id], [CategoryCode], [CategoryName], [DisplayOrder], [IsActive], [CreatedDate], [CreatedBy], [UpdatedDate], [UpdatedBy]) VALUES (3006, N'PAYROLL', N'Payroll Management', 3, 0, GETDATE(), 1, NULL, NULL)
GO
INSERT [CORE].[ConfigCategoryMaster] ([Id], [CategoryCode], [CategoryName], [DisplayOrder], [IsActive], [CreatedDate], [CreatedBy], [UpdatedDate], [UpdatedBy]) VALUES (3007, N'EmailSettings', N'Email Configuration', 5, 1, GETDATE(), NULL, NULL, NULL)
GO
INSERT [CORE].[ConfigCategoryMaster] ([Id], [CategoryCode], [CategoryName], [DisplayOrder], [IsActive], [CreatedDate], [CreatedBy], [UpdatedDate], [UpdatedBy]) VALUES (3008, N'AI_CHATBOT', N'AI Chatbot (Karmitra)', 6, 1, GETDATE(), 1, NULL, NULL)
GO

SET IDENTITY_INSERT [CORE].[ConfigCategoryMaster] OFF
GO
SET IDENTITY_INSERT [CORE].[ConfigKeyMaster] ON 
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1, 1, N'MAXFAILEDATTEMPTS', N'Maximum Failed Login Attempts', N'Number of failed login attempts before account lockout', N'decimal', N'textbox', N'2', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2, 1, N'LOCKOUTDURATIONMINUTES', N'Lockout Duration Minutes', N'Duration in minutes for which account remains locked', N'int', N'calendar', N'30', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3, 1, N'REFRESHTOKENEXPIRYDAYS', N'Refresh Token Expiry Days', N'Number of days before refresh token expires', N'int', N'number', N'7', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (4, 1, N'ACCESSTOKENEXPIRYMINUTES', N'Access Token Expiry Minutes', N'Number of minutes before access token expires', N'int', N'number', N'61', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (5, 1, N'PASSWORDALGORITHM', N'Password Hashing Algorithm', N'Algorithm used for password hashing (BCrypt/PBKDF2)', N'string', N'dropdown', N'BCrypt', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (6, 1, N'MINPASSWORDLENGTH', N'Minimum Password Length', N'Minimum number of characters required in password', N'int', N'number', N'8', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (7, 1, N'MAXPASSWORDLENGTH', N'Maximum Password Length', N'Maximum number of characters allowed in password', N'int', N'number', N'100', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (8, 1, N'REQUIREUPPERCASE', N'Require Uppercase Letter', N'Password must contain at least one uppercase letter', N'bool', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (9, 1, N'REQUIRELOWERCASE', N'Require Lowercase Letter', N'Password must contain at least one lowercase letter', N'bool', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (10, 1, N'REQUIREDIGIT', N'Require Digit', N'Password must contain at least one digit', N'bool', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (11, 1, N'REQUIRESPECIALCHAR', N'Require Special Character', N'Password must contain at least one special character', N'bool', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (12, 1, N'PASSWORDEXPIRYDAYS', N'Password Expiry Days', N'Number of days before password expires', N'int', N'number', N'15', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (13, 1, N'PASSWORDHISTORYCOUNT', N'Password History Count', N'Number of previous passwords that cannot be reused', N'int', N'number', N'5', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (14, 1, N'SESSIONTIMEOUTMINUTES', N'Session Timeout Minutes', N'Duration in minutes before session times out due to inactivity', N'int', N'number', N'480', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (15, 1, N'MAXCONCURRENTSESSIONS', N'Maximum Concurrent Sessions', N'Maximum number of concurrent sessions allowed per user', N'int', N'number', N'2', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (16, 1, N'MFAREQUIRED', N'MFA Required', N'Whether Multi-Factor Authentication is mandatory', N'boolean', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (17, 1, N'MFABACKUPCODECOUNT', N'MFA Backup Code Count', N'Number of backup codes generated for MFA', N'int', N'number', N'10', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (19, 1, N'PASSWORDRESETTOKENEXPIRYMINUTES', N'Password Reset Token Expiry Minutes', N'Duration in minutes for which the password reset token remains valid Default is 60 minutes 1 hour', N'int', N'number', N'5', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (22, 1, N'LOGINOTPONMAIL', N'Login Otp On Mail', N'Login Otp On Mail', N'boolean', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (23, 1, N'LOGINOTPONSMS', N'Enable Login OTP via SMS', N'When enabled, login OTP will be sent via SMS to user mobile number', N'Boolean', N'Toggle', N'false', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (25, 1, N'LOGINOTPEXPIRYMINUTES', N'Login Otp Expiry Minutes', N'Login OTP validity duration in minutes', N'int', N'number', N'2', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (29, 5, N'GOOGLE_PAY_01', N'GOOGLE PAY', N'GOOGLE PAY', N'datetime', N'calendar', N'2026-07-18T23:23', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (30, 5, N'PHONE PE', N'phone pe', N'phonepe', N'boolean', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1034, 3006, N'PAYROLL_CONFIG', N'PayrollConfig', N'PayrollConfig', N'int', N'number', N'2', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1035, 3007, N'SMTPHOST', N'SMTP Server Host', N'SMTP server hostname (e.g., smtp.gmail.com)', N'string', N'textbox', N'smtp.gmail.com', 1, NULL, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2036, 3007, N'SMTPPORT', N'SMTP Port', N'SMTP server port 587 for TLS 465 for SSL', N'int', N'textbox', N'587', 1, 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2037, 3007, N'SMTPUSERNAME', N'SMTP Username', N'SMTP authentication username', N'string', N'textbox', N'hr.payrollsolutionservo@gmail.com', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2038, 3007, N'SMTPPASSWORD', N'SMTP Password', N'SMTP authentication password use App Password for Gmail', N'string', N'textbox', N'dujbbskqhedlmjpg', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2039, 3007, N'FROMEMAIL', N'From Email Address', N'Sender email address', N'string', N'textbox', N'hr.payrollsolutionservo@gmail.com', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2040, 3007, N'FROMNAME', N'From Display Name', N'Sender display name', N'string', N'textbox', N'UserInfo', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2041, 3007, N'USESSL', N'Use SSLTLS', N'Whether to use SSLTLS encryption', N'boolean', N'checkbox', N'true', 1, 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2042, 3007, N'LOGINURL', N'Login URL', N'Login URL', N'string', N'textbox', N'https://ptisqa.scipl.info.in/en/login', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3036, 1, N'FPASSOTPMAIL', N'Forgot Password Otp on Mail', N'this flag use to define forgot passwork otp on mail', N'boolean', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3037, 1, N'FPASSOTPONSMS', N'Forgot password Otp On Sms', N'this flag use to get forgot password otp on sms', N'boolean', N'checkbox', N'false', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3038, 1, N'2FALOGIN', N'2FA Activation For Login', N'2FA activation for Login', N'boolean', N'checkbox', N'true', 1, 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3039, 1, N'2FALOGINFORFPASS', N'2FA Activation For Forgot Password', N'2FA Activation For Forgot Password', N'boolean', N'checkbox', N'false', 1, 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3041, 1, N'MAXOTPCHALLENGELOCKOUTS', N'Max Otp Challenge Lockouts', N'Max Otp Challenge Lock outs', N'int', N'number', N'5', 1, 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (3042, 1, N'OTPCHALLENGELOCKOUTDURATIONMINUTES', N'Otp Challenge Lockout Duration Minutes', N'OtpChallengeLockoutDurationMinutes', N'int', N'number', N'2', 1, 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigKeyMaster] ([Id], [CategoryId], [ConfigCode], [ConfigName], [Description], [DataType], [ControlType], [DefaultValue], [IsActive])
VALUES
    (3043, 3008, 'AI_CITIZEN_MPIN_VALIDITY_DAYS', 'Citizen MPIN Validity (Days)', 'Number of days a citizen MPIN remains valid before it must be reset via OTP.', 'INT', 'NUMBER', '30', 1),
    (3044, 3008, 'AI_EMBEDDING_PIPELINE_ENABLED', 'Embedding Pipeline Enabled', 'When false, the background embedding pipeline (NtisPlatform.Worker) skips its sweep - documents stay PENDING until re-enabled. Manual "Process now" is unaffected.', 'BOOLEAN', 'TOGGLE', 'true', 1),
    (3045, 3008, 'AI_ORCHESTRATOR_ENABLED', 'AI Orchestrator Enabled', 'When true, the citizen chat pipeline tries the new AI Orchestrator / Intelligent Router before falling back to the legacy chat pipeline. When false, the legacy pipeline handles every message, exactly as if the orchestrator did not exist.', 'BOOLEAN', 'TOGGLE', 'true', 1);
GO
SET IDENTITY_INSERT [CORE].[ConfigKeyMaster] OFF
GO
SET IDENTITY_INSERT [CORE].[ConfigValueMaster] ON 
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (73, 29, 1, NULL, 1, N'2026-05-14T18:11', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (74, 29, 1, 1, 0, N'2026-05-14T18:11', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (75, 29, 4, NULL, 0, N'2026-05-14T18:11', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (76, 30, 1, NULL, 1, N'true', 1, GETDATE(), 2, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (77, 30, 1, 1, 1, N'true', 1, GETDATE(), 2, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (78, 30, 2, NULL, 1, N'true', 1, GETDATE(), 2, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (79, 30, 2, 1001, 0, N'false', 1, GETDATE(), 2, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (82, 29, 2, NULL, 1, N'2026-05-14T18:11', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (83, 29, 3, NULL, 1, N'2026-05-14T18:11', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (84, 30, 3, NULL, 1, N'true', 1, GETDATE(), 2, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (85, 30, 4, NULL, 1, N'true', 1, GETDATE(), 2, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (86, 30, 3, 1004, 1, N'true', 1, GETDATE(), 2, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (87, 29, 3, 1004, 1, N'2026-05-16T18:14', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (93, 29, 2, 1001, 1, N'2026-05-14T18:14', 2, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1101, 1034, 1, 1, 1, N'25', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1102, 1034, 1, 2006, 0, N'2', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1103, 1034, 1, NULL, 1, N'2', 1, GETDATE(), 1, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (1104, 1034, 1, 8008, 0, N'2', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2119, 1035, NULL, NULL, 1, N'smtp.gmail.com', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2122, 2036, NULL, NULL, 1, N'587', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2124, 2038, NULL, NULL, 1, N'dujbbskqhedlmjpg', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2125, 2037, NULL, NULL, 1, N'hr.payrollsolutionservo@gmail.com', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2128, 2039, NULL, NULL, 1, N'hr.payrollsolutionservo@gmail.com', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2130, 2041, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2131, 2042, NULL, NULL, 1, N'https://ptisqa.scipl.info.in/en/login', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2133, 2040, NULL, NULL, 1, N'UserInfo', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2144, 1, NULL, NULL, 1, N'3', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2145, 2, NULL, NULL, 1, N'2026-08-13', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2146, 3, NULL, NULL, 1, N'5', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2147, 4, NULL, NULL, 1, N'30', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2148, 6, NULL, NULL, 1, N'20', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2149, 8, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2150, 9, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2151, 10, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2152, 12, NULL, NULL, 1, N'20', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2153, 11, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2154, 14, NULL, NULL, 1, N'40', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2155, 15, NULL, NULL, 1, N'2', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2156, 16, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2157, 19, NULL, NULL, 1, N'5', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2158, 22, NULL, NULL, 1, N'0', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2159, 25, NULL, NULL, 1, N'2', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2160, 3036, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2161, 3038, NULL, NULL, 1, N'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2162, 3041, NULL, NULL, 1, N'5', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2163, 3042, NULL, NULL, 1, N'2', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2164, 3043, NULL, NULL, 1,'30', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2165, 3044, NULL, NULL, 1,'true', 1, GETDATE(), NULL, NULL)
GO
INSERT [CORE].[ConfigValueMaster] ([Id], [ConfigKeyId], [DepartmentId], [ModuleId], [IsActive], [Value], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]) VALUES (2166, 3045, NULL, NULL, 1,'true', 1, GETDATE(), NULL, NULL);
GO
SET IDENTITY_INSERT [CORE].[ConfigValueMaster] OFF
GO




/* =========================================
    AliasMaster
=======================================*/

SET IDENTITY_INSERT [CORE].[AliasMaster] ON;

;WITH SeedData AS
(
    SELECT *
    FROM
    (
        VALUES
        (47, 'Ward_No', N'Ward No', N'Sector No', N'सेक्टर क्र.1', N'सेक्टर क्र.2', 1, 1, CAST('2026-08-25T11:49:27.240' AS DATETIME), 1, CAST('2026-08-25T18:25:32.950' AS DATETIME)),
        (48, 'Construction_Type', N'Construction Type', N'Construction Type', N'बांधकाम प्रकार', N'निर्माण प्रकार', 1, 1, CAST('2026-08-25T18:41:40.540' AS DATETIME), 1, CAST('2026-08-26T15:55:14.760' AS DATETIME)),
        (49, 'Property_No', N'Property No', N'Property No', N'मालमत्ता क्र.', N'संपत्ति क्र.', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), 1, CAST('2026-08-26T15:50:59.183' AS DATETIME)),
        (50, 'Partition_No', N'Partition No', N'Partition No', N'विभाग क्र.', N'विभाजन क्र.', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (51, 'Old_No', N'Old No', N'Old No', N'जुना क्र.', N'पुराना क्र.', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (52, 'Upic_Id', N'Upic Id', N'Upic Id', N'UPIC क्र.', N'UPIC आईडी', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (53, 'Assessment_Status', N'Assessment Status', N'Assessment Status', N'आकारणी स्थिती', N'निर्धारण स्थिति', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), 1, CAST('2026-08-26T11:53:38.450' AS DATETIME)),
        (54, 'Division', N'Division', N'Division', N'विभाग', N'प्रभाग', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (55, 'Category', N'Category', N'Category', N'वर्ग', N'श्रेणी', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (56, 'Wing', N'Wing', N'Wing', N'विंग', N'विंग', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (57, 'Flat_No_Shop_No', N'Flat No/Shop No', N'Flat No/Shop No', N'फ्लॅट क्र./दुकान क्र.', N'फ्लैट क्र./दुकान क्र.', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (58, 'Tax_Zone_No', N'Tax Zone No', N'Tax Zone No', N'कर क्षेत्र क्र.', N'कर क्षेत्र क्र.', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (59, 'Rate_Section_Name', N'Ratesection Name', N'Ratesection Name', N'दर विभागाचे नाव', N'दर अनुभाग का नाम', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (60, 'Mouja_Name', N'Mouja Name', N'Mouja Name', N'मौजा नाव', N'मौजा नाम', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), 1, CAST('2026-08-26T15:50:33.640' AS DATETIME)),
        (61, 'Sub_Zone_No', N'Subzone No', N'Subzone No', N'उपक्षेत्र क्र.', N'उपक्षेत्र क्र.', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (62, 'Survey_No', N'Survey No', N'Survey No', N'सर्वे क्र.', N'सर्वे क्र.', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (63, 'Floor', N'Floor', N'Floor', N'मजला', N'मंजिल', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (64, 'Sub_Floor', N'Sub Floor', N'Sub Floor', N'उपमजला', N'उपमंजिल', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (65, 'Construction_Year', N'Con Year', N'Con Year', N'बांधकाम वर्ष', N'निर्माण वर्ष', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (66, 'Assessment_Year', N'Asst Year', N'Asst Year', N'आकारणी वर्ष', N'निर्धारण वर्ष', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (67, 'Use', N'Use', N'Use', N'वापर', N'उपयोग', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (68, 'Sub_Type_Of_Use', N'Sub Type Of Use', N'Sub Type Of Use', N'वापराचा उपप्रकार', N'उपयोग का उपप्रकार', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (69, 'Rooms', N'Rooms', N'Rooms', N'खोल्या', N'कमरे', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (70, 'Carpet_Area', N'Carpet Area(Ft/Mtr)', N'Carpet Area(Ft/Mtr)', N'चटई क्षेत्रफळ (फु./मी.)', N'कार्पेट क्षेत्रफल (फु./मी.)', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (71, 'Builtup_Area', N'Builtup Area(Ft/Mtr)', N'Builtup Area(Ft/Mtr)', N'बांधकाम क्षेत्रफळ (फु./मी.)', N'निर्मित क्षेत्रफल (फु./मी.)', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (72, 'OC_Number', N'Oc Number', N'Oc Number', N'ओ.सी. क्र.', N'ओ.सी. नंबर', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL),
        (73, 'OC_Date', N'Oc Date', N'Oc Date', N'ओ.सी. दिनांक', N'ओ.सी. दिनांक', 1, 1, CAST('2026-08-26T10:36:57.990' AS DATETIME), NULL, NULL)
    ) AS V
    (
        Id, KeyName, LabelName, EnglishName, RegionalName, HindiName,
        IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate
    )
)
INSERT INTO [CORE].[AliasMaster]
(
    [Id], [KeyName], [LabelName], [EnglishName], [RegionalName], [HindiName],
    [IsActive], [CreatedBy], [CreatedDate], [UpdatedBy], [UpdatedDate]
)

SELECT 
    S.Id, S.KeyName, S.LabelName, S.EnglishName, S.RegionalName, S.HindiName,
    S.IsActive, S.CreatedBy, S.CreatedDate, S.UpdatedBy, S.UpdatedDate
FROM SeedData S

WHERE NOT EXISTS
(
    SELECT 1 
    FROM [CORE].[AliasMaster] X
    WHERE X.Id = S.Id
);

SET IDENTITY_INSERT [CORE].[AliasMaster] OFF;

-- ============================================================================
-- CORE Module - CDC Table Registration (PTIS)
-- ============================================================================

SET IDENTITY_INSERT [CORE].[CdcTableConfig] ON;

INSERT INTO [CORE].[CdcTableConfig]
(
    [Id],[DepartmentCode],[CaptureInstance],[SourceSchema],[SourceTable],
    [ProcessingType],[CalculationType],[EntityType],[TriggersRecalculation],[IsActive],
    [CreatedDate],[UpdatedDate]
)
SELECT *
FROM
(
    VALUES
    -- Note: ProcessingType='PROPERTY' in the source data has been mapped to 'ENTITY'
    -- (the framework's CK_CdcTableConfig_ProcessingType constraint allows only ENTITY/MASTER/AUDIT);
    -- that source value is instead carried in the new EntityType column.
    (1,'PTIS','PTIS_PropertyMast','PTIS','PropertyMast','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (2,'PTIS','PTIS_PropertyDetails','PTIS','PropertyDetails','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (3,'PTIS','PTIS_RenterMast','PTIS','RenterMast','ENTITY','RV','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (4,'PTIS','PTIS_RenterDetails','PTIS','RenterDetails','ENTITY','RV','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    -- PropertyCertificates/PropertySocialDetails are polymorphic (PropertyId/SocietyDetailId/WingDetailId,
    -- selected via EntityType='P'/'S'/'W'); CORE.usp_ResolveCdcEntityBatch has no DIRECT/PARENT resolver
    -- that can pick a column conditionally, so these are seeded inactive until a CUSTOM resolver
    -- procedure is written for them (see CORE.CdcEntityResolverConfig).
    (5,'PTIS','PTIS_PropertyCertificates','PTIS','PropertyCertificates','ENTITY','BOTH','PROPERTY',1,0,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (6,'PTIS','PTIS_PropertySocialDetails','PTIS','PropertySocialDetails','ENTITY','BOTH','PROPERTY',1,0,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (7,'PTIS','PTIS_PropertyOccupancyDetails','PTIS','PropertyOccupancyDetails','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (8,'PTIS','PTIS_SocietyDetailsMast','PTIS','SocietyDetailsMast','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (9,'PTIS','PTIS_WingDetailsMast','PTIS','WingDetailsMast','ENTITY','BOTH','PROPERTY',1,1,'2026-09-03 17:55:53.893','2026-09-08 14:30:52.850'),
    (10,'PTIS','PTIS_RateMaster','PTIS','RateMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (11,'PTIS','PTIS_RateSectionMaster','PTIS','RateSectionMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (12,'PTIS','PTIS_RateSectionDetails','PTIS','RateSectionDetails','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (13,'PTIS','PTIS_TypeOfUseMaster','PTIS','TypeOfUseMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-07 12:08:01.497'),
    (14,'PTIS','PTIS_TypeOfUseCategoryMaster','PTIS','TypeOfUseCategoryMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-07 12:10:56.950'),
    (15,'PTIS','PTIS_ConstructionTypeMaster','PTIS','ConstructionTypeMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (16,'PTIS','PTIS_FloorMaster','PTIS','FloorMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (17,'PTIS','PTIS_DepreciationMaster','PTIS','DepreciationMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (18,'PTIS','PTIS_TaxPercentageMasterRV','PTIS','TaxPercentageMasterRV','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-07 12:11:16.680'),
    (19,'PTIS','PTIS_AssessmentYearRangeMasterRV','PTIS','AssessmentYearRangeMasterRV','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (20,'PTIS','PTIS_EmploymentTaxMaster','PTIS','EmploymentTaxMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (21,'PTIS','PTIS_EducationTaxMaster','PTIS','EducationTaxMaster','MASTER','RV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (22,'PTIS','PTIS_RateCVMaster','PTIS','RateCVMaster','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    -- Row 23 (PTIS_RateMasterCV / PTIS.RateMasterCV) skipped: no such table in PTIS schema
    -- (only PTIS.RateCVMaster, above, exists).
    (24,'PTIS','PTIS_CSNDetails','PTIS','CSNDetails','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (25,'PTIS','PTIS_AssessmentYearRangeMasterCV','PTIS','AssessmentYearRangeMasterCV','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (26,'PTIS','PTIS_TaxPercentageMasterCV','PTIS','TaxPercentageMasterCV','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (27,'PTIS','PTIS_MoujaMaster','PTIS','MoujaMaster','MASTER','CV',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.293'),
    (28,'PTIS','PTIS_TaxMaster','PTIS','TaxMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (29,'PTIS','PTIS_TaxCategoryMaster','PTIS','TaxCategoryMaster','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (30,'PTIS','PTIS_PolicyConfiguration','PTIS','PolicyConfiguration','MASTER','BOTH',NULL,1,1,'2026-09-03 17:55:53.893','2026-09-04 18:12:02.290'),
    (31,'PTIS','PTIS_PropertyMastOld','PTIS','PropertyMastOld','ENTITY','BOTH','PROPERTY',1,1,'2026-09-07 11:44:58.460','2026-09-08 14:30:52.850'),
    (32,'PTIS','PTIS_PropertyDetailsOld','PTIS','PropertyDetailsOld','ENTITY','BOTH','PROPERTY',1,1,'2026-09-07 12:00:37.460','2026-09-08 14:30:52.850'),
    (33,'PTIS','PTIS_RuleEngineMaster','PTIS','RuleEngineMaster','MASTER','BOTH',NULL,1,1,'2026-09-15 00:00:00.000','2026-09-15 00:00:00.000')
) S
(
    Id,DepartmentCode,CaptureInstance,SourceSchema,SourceTable,
    ProcessingType,CalculationType,EntityType,TriggersRecalculation,IsActive,
    CreatedDate,UpdatedDate
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[CdcTableConfig] C
    WHERE C.Id = S.Id
       OR C.CaptureInstance = S.CaptureInstance
);

SET IDENTITY_INSERT [CORE].[CdcTableConfig] OFF;

-- ============================================================================
-- CORE Module - CDC Entity Resolver Mappings (PTIS ENTITY registrations)
-- ============================================================================
-- Maps each active PTIS 'ENTITY' registration above to the PropertyMast.Id
-- (or, for the legacy hierarchy, PropertyMastOld.Id) it belongs to, so that
-- CORE.usp_ResolveCdcEntityBatch can resolve EntityId instead of falling
-- into its missing-configuration UNRESOLVED branch.
-- PropertyCertificates and PropertySocialDetails are intentionally excluded
-- here: they are polymorphic (see comment above their CdcTableConfig rows)
-- and are seeded IsActive=0 until a CUSTOM resolver procedure exists.

SET IDENTITY_INSERT [CORE].[CdcEntityResolverConfig] ON;

INSERT INTO [CORE].[CdcEntityResolverConfig]
(
    [Id],[DepartmentCode],[SourceSchema],[SourceTable],[ResolverType],[EntityType],
    [SourceEntityColumn],[SourceEntityDataType],
    [ParentSchema],[ParentTable],[ParentJoinColumn],[ParentEntityColumn],
    [CustomResolverProcedure],[IsActive],[CreatedDate]
)
SELECT *
FROM
(
    VALUES
    -- PropertyMast IS the root property entity: its own Id is the EntityId.
    (1,'PTIS','PTIS','PropertyMast','DIRECT','PROPERTY','Id','INT',NULL,NULL,NULL,NULL,NULL,1,GETDATE()),
    -- PropertyDetails.PropertyId already holds PropertyMast.Id directly.
    (2,'PTIS','PTIS','PropertyDetails','DIRECT','PROPERTY','PropertyId','INT',NULL,NULL,NULL,NULL,NULL,1,GETDATE()),
    -- RenterMast/RenterDetails only carry PropertyDetailsId; hop through PropertyDetails to get PropertyId.
    (3,'PTIS','PTIS','RenterMast','PARENT','PROPERTY','PropertyDetailsId','INT','PTIS','PropertyDetails','Id','PropertyId',NULL,1,GETDATE()),
    (4,'PTIS','PTIS','RenterDetails','PARENT','PROPERTY','PropertyDetailsId','INT','PTIS','PropertyDetails','Id','PropertyId',NULL,1,GETDATE()),
    -- PropertyOccupancyDetails only carries PropertyDetailId; hop through PropertyDetails to get PropertyId.
    (5,'PTIS','PTIS','PropertyOccupancyDetails','PARENT','PROPERTY','PropertyDetailId','INT','PTIS','PropertyDetails','Id','PropertyId',NULL,1,GETDATE()),
    -- SocietyDetailsMast.PropertyId already holds PropertyMast.Id directly.
    (6,'PTIS','PTIS','SocietyDetailsMast','DIRECT','PROPERTY','PropertyId','INT',NULL,NULL,NULL,NULL,NULL,1,GETDATE()),
    -- WingDetailsMast only carries SocietyDetailsMastId; hop through SocietyDetailsMast to get PropertyId.
    (7,'PTIS','PTIS','WingDetailsMast','PARENT','PROPERTY','SocietyDetailsMastId','INT','PTIS','SocietyDetailsMast','Id','PropertyId',NULL,1,GETDATE()),
    -- Legacy hierarchy: PropertyMastOld is its own root; PropertyDetailsOld hops through it.
    (8,'PTIS','PTIS','PropertyMastOld','DIRECT','PROPERTY','Id','INT',NULL,NULL,NULL,NULL,NULL,1,GETDATE()),
    (9,'PTIS','PTIS','PropertyDetailsOld','PARENT','PROPERTY','PropertyMastOldId','INT','PTIS','PropertyMastOld','Id','Id',NULL,1,GETDATE())
) S
(
    Id,DepartmentCode,SourceSchema,SourceTable,ResolverType,EntityType,
    SourceEntityColumn,SourceEntityDataType,
    ParentSchema,ParentTable,ParentJoinColumn,ParentEntityColumn,
    CustomResolverProcedure,IsActive,CreatedDate
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CORE].[CdcEntityResolverConfig] C
    WHERE C.Id = S.Id
       OR (C.DepartmentCode = S.DepartmentCode AND C.SourceSchema = S.SourceSchema AND C.SourceTable = S.SourceTable)
);

SET IDENTITY_INSERT [CORE].[CdcEntityResolverConfig] OFF;

-- ----------------------------------------------------------------------------
-- CORE.GrievanceCategoryMaster
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT [CORE].[GrievanceCategoryMaster] ON;

INSERT INTO [CORE].[GrievanceCategoryMaster] ([Id], [CategoryCode], [CategoryName], [Priority], [ResolutionSla], [Description], [IsActive])
VALUES 
(1, 'WATER_SUPPLY', 'Water Supply', 'HIGH', '48 hours', 'No water supply, leakage, or contamination complaints.', 1),
(2, 'ROADS_INFRASTRUCTURE', 'Roads & Infrastructure', 'MEDIUM', '7 days', 'Potholes, broken streetlights, damaged footpaths.', 1),
(3, 'SANITATION_WASTE', 'Sanitation & Waste', 'MEDIUM', '72 hours', 'Garbage collection, drainage, and public cleanliness complaints.', 1),
(4, 'OTHER', 'Other', 'LOW', '15 days', 'Anything not covered by the categories above.', 1);
GO

SET IDENTITY_INSERT [CORE].[GrievanceCategoryMaster] OFF;



SET IDENTITY_INSERT CORE.CollectionChannelMaster ON;

INSERT INTO CORE.CollectionChannelMaster
(
    Id,
    CollectionChannelCode,
    CollectionChannelName,
    IsOfflineCapable,
    IsGatewayBased,
    DisplayOrder,
    IsActive,
    CreatedDate
)
SELECT *
FROM (VALUES
    (1, 'COUNTER',     N'Counter',       0, 0, 1, 1, GETDATE()),
    (2, 'TAB',         N'Tab',           1, 0, 2, 1, GETDATE()),
    (3, 'POS',         N'POS',           0, 0, 3, 1, GETDATE()),
    (4, 'OFFLINE',     N'Offline',       1, 0, 4, 1, GETDATE()),
    (5, 'WEB',         N'Web Portal',    0, 1, 5, 1, GETDATE()),
    (6, 'MOBILE',      N'Mobile App',    0, 1, 6, 1, GETDATE()),
    (7, 'BANK_IMPORT', N'Bank Import',   0, 0, 7, 1, GETDATE())
) S (Id, CollectionChannelCode, CollectionChannelName, IsOfflineCapable, IsGatewayBased, DisplayOrder, IsActive, CreatedDate)
WHERE NOT EXISTS
(
    SELECT 1
    FROM CORE.CollectionChannelMaster C
    WHERE C.Id = S.Id OR C.CollectionChannelCode = S.CollectionChannelCode
);

SET IDENTITY_INSERT CORE.CollectionChannelMaster OFF;
GO



SET IDENTITY_INSERT CORE.PaymentModeMaster ON;

INSERT INTO CORE.PaymentModeMaster
(
    Id,
    PaymentModeCode,
    PaymentModeName,
    RequiresReferenceNo,
    IsElectronic,
    DisplayOrder
)
VALUES
(1, 'CASH',       N'Cash',         0, 0, 1),
(2, 'CHEQUE',     N'Cheque',       1, 0, 2),
(3, 'DD',         N'Demand Draft', 1, 0, 3),
(4, 'UPI',        N'UPI',          0, 1, 4),
(5, 'CARD',       N'Card',         0, 1, 5),
(6, 'NETBANKING', N'Net Banking',  0, 1, 6),
(7, 'NEFT',       N'NEFT',         1, 1, 7),
(8, 'RTGS',       N'RTGS',         1, 1, 8),
(9, 'IMPS',       N'IMPS',         1, 1, 9);

SET IDENTITY_INSERT CORE.PaymentModeMaster OFF;
GO
-- BHKMaster
INSERT INTO [CORE].[BHKMaster]
(
    [BHKCode],
    [BHKName],
    [Description],
    [DisplayOrder],
    [RoomCount],
    [IsActive],
    [CreatedBy]
)
VALUES
-- RoomCount = bedrooms + hall + kitchen (half bedroom = 0.5); Other has no standard count
('1R',     '1 R',       'One Room',                             0, 1,    1, 1),
('1RK',    '1 RK',      'One Room Kitchen',                     1, 2,    1, 1),
('1BHK',   '1 BHK',     'One Bedroom Hall Kitchen',             2, 3,    1, 1),
('1.5BHK', '1.5 BHK',   'One and Half Bedroom Hall Kitchen',    3, 3.5,  1, 1),
('2BHK',   '2 BHK',     'Two Bedroom Hall Kitchen',             4, 4,    1, 1),
('2.5BHK', '2.5 BHK',   'Two and Half Bedroom Hall Kitchen',    5, 4.5,  1, 1),
('3BHK',   '3 BHK',     'Three Bedroom Hall Kitchen',           6, 5,    1, 1),
('3.5BHK', '3.5 BHK',   'Three and Half Bedroom Hall Kitchen',  7, 5.5,  1, 1),
('4BHK',   '4 BHK',     'Four Bedroom Hall Kitchen',            8, 6,    1, 1),
('5BHK',   '5 BHK',     'Five Bedroom Hall Kitchen',            9, 7,    1, 1),
('OTHER',  'Other',     'Other BHK configuration',             99, NULL, 1, 1);
GO
