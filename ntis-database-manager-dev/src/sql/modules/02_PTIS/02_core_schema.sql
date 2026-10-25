IF COL_LENGTH('PTIS.TypeOfUseGroupMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[TypeOfUseGroupMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_TypeOfUseGroupMaster_IsProtected] DEFAULT (0)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.TypeOfUseGroupMasterCV', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[TypeOfUseGroupMasterCV]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_TypeOfUseGroupMasterCV_IsProtected] DEFAULT (0)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.FloorMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[FloorMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_FloorMaster_IsProtected] DEFAULT (0)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.TypeOfUseMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[TypeOfUseMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_TypeOfUseMaster_IsProtected] DEFAULT (0)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.PolicyCodeMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[PolicyCodeMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_PolicyCodeMaster_IsProtected] DEFAULT (0)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.PolicyConfiguration', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[PolicyConfiguration]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_PolicyConfiguration_IsProtected] DEFAULT (0)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.PropertyCategoryMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[PropertyCategoryMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_PropertyCategoryMaster_IsProtected] DEFAULT (1)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.PropertyCertificateTypeMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[PropertyCertificateTypeMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_PropertyCertificateTypeMaster_IsProtected] DEFAULT (1)
        WITH VALUES;
END;
GO


IF COL_LENGTH('PTIS.TaxCategoryMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[TaxCategoryMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_TaxCategoryMaster_IsProtected] DEFAULT (1)
        WITH VALUES;
END;
GO
IF COL_LENGTH('PTIS.TaxMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[TaxMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_TaxMaster_IsProtected] DEFAULT (1)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.ConstructionTypeMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[ConstructionTypeMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_ConstructionTypeMaster_IsProtected] DEFAULT (1)
        WITH VALUES;
END;
GO

IF COL_LENGTH('PTIS.SubFloorMaster', 'IsProtected') IS NULL
BEGIN
    ALTER TABLE [PTIS].[SubFloorMaster]
    ADD [IsProtected] [bit] NOT NULL
        CONSTRAINT [DF_SubFloorMaster_IsProtected] DEFAULT (1)
        WITH VALUES;
END;
GO







CREATE OR ALTER TRIGGER [PTIS].[TR_ConstructionTypeMaster_ProtectUpdate]
ON [PTIS].[ConstructionTypeMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
        Error Code 50201: PTIS master protected delete
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50201,
              'PTIS.ConstructionTypeMaster: Protected records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to all non-audit columns for protected rows.
        Error Code 50202: PTIS master protected update
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 ISNULL(i.[ConstructionCode], N'') <> ISNULL(d.[ConstructionCode], N'')
            --   OR ISNULL(i.[Description], N'') <> ISNULL(d.[Description], N'')
            --   OR ISNULL(i.[SearchSequence], N'') <> ISNULL(d.[SearchSequence], N'')
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50202,
              'PTIS.ConstructionTypeMaster: Protected records cannot be modified. ConstructionCode, IsActive and IsProtected are read-only.',
              1;
    END;
END;
GO

-- property category master
CREATE OR ALTER TRIGGER [PTIS].[TR_PropertyCategoryMaster_Protect]
ON [PTIS].[PropertyCategoryMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
        Error Code 50201: PTIS master protected delete
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50201,
              'PTIS.PropertyCategoryMaster: Protected records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to all non-audit columns for protected rows.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 ISNULL(i.[PropertyCategoryName], N'') <> ISNULL(d.[PropertyCategoryName], N'')
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50202,
              'PTIS.PropertyCategoryMaster: Protected records cannot be modified. PropertyCategoryName, IsActive and IsProtected are read-only.',
              1;
    END;
END;
GO

-- property certificate type master
CREATE OR ALTER TRIGGER [PTIS].[TR_PropertyCertificateTypeMaster_Protect]
ON [PTIS].[PropertyCertificateTypeMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
        Error Code 50201: PTIS master protected delete
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50201,
              'PTIS.PropertyCertificateTypeMaster: Protected records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to all non-audit columns for protected rows.
        Use ISNULL to properly detect changes involving NULL values.
        Error Code 50202: PTIS master protected update
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 ISNULL(i.[CertificateTypeCode], N'') <> ISNULL(d.[CertificateTypeCode], N'')
              OR ISNULL(i.[CertificateTypeName], N'') <> ISNULL(d.[CertificateTypeName], N'')
            --   OR ISNULL(i.[Description], N'') <> ISNULL(d.[Description], N'')
              OR ISNULL(i.[DisplayOrder], 0) <> ISNULL(d.[DisplayOrder], 0)
              OR i.[IsTaxable] <> d.[IsTaxable]
              OR i.[IsRequired] <> d.[IsRequired]
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50202,
              'PTIS.PropertyCertificateTypeMaster: Protected records cannot be modified. CertificateTypeCode, CertificateTypeName,  DisplayOrder, IsTaxable, IsRequired, IsActive and IsProtected are read-only.',
              1;
    END;
END;
GO

-- policy configuration master
CREATE OR ALTER TRIGGER [PTIS].[TR_PolicyConfiguration_Protect]
ON [PTIS].[PolicyConfiguration]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected policy configuration records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to all non-audit columns for protected rows.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[PolicyCode] <> d.[PolicyCode]
            --   OR i.[Category] <> d.[Category]
            --   OR i.[DisplayName] <> d.[DisplayName]
            --   OR ISNULL(i.[Description], N'') <> ISNULL(d.[Description], N)''
              OR i.[DataType] <> d.[DataType]
              OR ISNULL(i.[DefaultValue], N'') <> ISNULL(d.[DefaultValue], N'')
              OR ISNULL(i.[Unit], '') <> ISNULL(d.[Unit], '')
              OR ISNULL(i.[AllowedValues], N'') <> ISNULL(d.[AllowedValues], N'')
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'PolicyCode, DataType, DefaultValue, Unit,  AllowedValues, IsActive and IsProtected cannot be changed for protected policy configuration records.',
              1;
    END;
END;
GO

-- policy code master
CREATE OR ALTER TRIGGER [PTIS].[TR_PolicyCodeMaster_Protect]
ON [PTIS].[PolicyCodeMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected policy code records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to all non-audit columns for protected rows.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[PolicyCode] <> d.[PolicyCode]
              OR i.[PolicyName] <> d.[PolicyName]
              OR ISNULL(i.[Description], N'') <> ISNULL(d.[Description], N'')
              OR i.[PolicyType] <> d.[PolicyType]
              OR ISNULL(i.[NextPolicyCodeId], -2147483648) <> ISNULL(d.[NextPolicyCodeId], -2147483648)
              OR i.[IsFinalStage] <> d.[IsFinalStage]
              OR i.[IsExclusive] <> d.[IsExclusive]
              OR i.[RequiresStageTracking] <> d.[RequiresStageTracking]
              OR i.[DisplayOrder] <> d.[DisplayOrder]
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'PolicyCode, PolicyName, Description, PolicyType, NextPolicyCodeId, IsFinalStage, IsExclusive, RequiresStageTracking, DisplayOrder, IsActive and IsProtected cannot be changed for protected policy code records.',
              1;
    END;
END;
GO

-- type of use master
CREATE OR ALTER TRIGGER [PTIS].[TR_TypeOfUseMaster_Protect]
ON [PTIS].[TypeOfUseMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected type-of-use records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected columns.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[TypeOfUseCode] <> d.[TypeOfUseCode]
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'TypeOfUseCode, IsActive and IsProtected cannot be changed for protected type-of-use records.',
              1;
    END;
END;
GO

-- type of use group cv master
CREATE OR ALTER TRIGGER [PTIS].[TR_TypeOfUseGroupMasterCV_Protect]
ON [PTIS].[TypeOfUseGroupMasterCV]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected type-of-use group CV records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected columns.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[TypeOfUseGroupCVCode] <> d.[TypeOfUseGroupCVCode]
              OR i.[GroupName] <> d.[GroupName]
              OR i.[IsFloorWiseRateApplicable] <> d.[IsFloorWiseRateApplicable]
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'TypeOfUseGroupCVCode, GroupName, IsFloorWiseRateApplicable, IsActive and IsProtected cannot be changed for protected type-of-use group CV records.',
              1;
    END;
END;
GO

-- type of use group master
CREATE OR ALTER TRIGGER [PTIS].[TR_TypeOfUseGroupMaster_Protect]
ON [PTIS].[TypeOfUseGroupMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected type-of-use group records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected columns.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[TypeOfUseGroupCode] <> d.[TypeOfUseGroupCode]
              OR i.[GroupName] <> d.[GroupName]
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'TypeOfUseGroupCode, GroupName, IsActive and IsProtected cannot be changed for protected type-of-use group records.',
              1;
    END;
END;
GO


--- floormaster

CREATE OR ALTER TRIGGER [PTIS].[TR_FloorMaster_Protect]
ON [PTIS].[FloorMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE IsProtected = 1
    )
    BEGIN
        THROW 50001,
              'Protected floor records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected fields.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.Id = i.Id
        WHERE d.IsProtected = 1
          AND
          (
                 i.FloorCode <> d.FloorCode
              OR ISNULL(i.SequenceNo, -2147483648)
                   <> ISNULL(d.SequenceNo, -2147483648)
              OR i.IsActive <> d.IsActive
              OR i.IsProtected <> d.IsProtected
          )
    )
    BEGIN
        THROW 50002,
              'FloorCode, SequenceNo, IsActive and IsProtected cannot be changed for protected floor records.',
              1;
    END;
END;
GO

-----Sub Floor Master

CREATE OR ALTER TRIGGER [PTIS].[TR_SubFloorMaster_Protect]
ON [PTIS].[SubFloorMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE IsProtected = 1
    )
    BEGIN
        THROW 50001,
              'Protected sub-floor records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected fields.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.Id = i.Id
        WHERE d.IsProtected = 1
          AND
          (
                 i.SubFloorCode <> d.SubFloorCode
              OR i.IsActive <> d.IsActive
              OR i.IsProtected <> d.IsProtected
          )
    )
    BEGIN
        THROW 50002,
              'SubFloorCode, IsActive and IsProtected cannot be changed for protected sub-floor records.',
              1;
    END;
END;
GO

--- type of use category master
CREATE OR ALTER TRIGGER [PTIS].[TR_TypeOfUseCategoryMaster_Protect]
ON [PTIS].[TypeOfUseCategoryMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected type-of-use category records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected columns.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[TypeOfUseCategoryCode] <> d.[TypeOfUseCategoryCode]
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'TypeOfUseCategoryCode, IsActive and IsProtected cannot be changed for protected type-of-use category records.',
              1;
    END;
END;
GO



CREATE OR ALTER TRIGGER [PTIS].[TR_TaxCategoryMaster_Protect]
ON [PTIS].[TaxCategoryMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected tax category records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected columns.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[CategoryCode] <> d.[CategoryCode]
              OR i.[CategoryName] <> d.[CategoryName]
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'CategoryCode, CategoryName, IsActive and IsProtected cannot be changed for protected tax category records.',
              1;
    END;
END;

GO

CREATE OR ALTER TRIGGER [PTIS].[TR_TaxMaster_Protect]
ON [PTIS].[TaxMaster]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /*
        Prevent deletion of protected records.
    */
    IF NOT EXISTS
    (
        SELECT 1
        FROM inserted
    )
    AND EXISTS
    (
        SELECT 1
        FROM deleted
        WHERE [IsProtected] = 1
    )
    BEGIN
        THROW 50001,
              'Protected tax records cannot be deleted.',
              1;
    END;

    /*
        Prevent changes to protected columns.
    */
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d
            ON d.[Id] = i.[Id]
        WHERE d.[IsProtected] = 1
          AND
          (
                 i.[TaxCode] <> d.[TaxCode]
              OR i.[TaxCategoryId] <> d.[TaxCategoryId]
            --   OR i.[IsActive] <> d.[IsActive]
            --   OR i.[AssessmentStatus] <> d.[AssessmentStatus]
            --   OR i.[OldTaxStatus] <> d.[OldTaxStatus]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'TaxCode, TaxCategoryId and IsProtected cannot be changed for protected tax records.',
              1;
    END;
END;

GO

/* ============================================================================
   Rename PTIS.RetrospectivePenaltyRule.PenaltyMode code 'ACT_UNLAWFUL' to
   'ACT_PENALTY' (matches the UI's actual field). Guarded on the current CHECK
   constraint definition so this is a no-op on databases created fresh from
   01_base_schema.sql (which already only allows 'ACT_PENALTY') and only runs
   once against a database still on the old constraint.
============================================================================ */
IF EXISTS
(
    SELECT 1
    FROM sys.check_constraints cc
    INNER JOIN sys.tables t ON t.object_id = cc.parent_object_id
    WHERE t.name = 'RetrospectivePenaltyRule'
      AND cc.name = 'CK_RetrospectivePenaltyRule_PenaltyMode'
      AND cc.definition LIKE '%ACT_UNLAWFUL%'
)
BEGIN
    -- Drop the old constraint first: the UPDATE below sets a value the old
    -- constraint doesn't allow yet.
    ALTER TABLE [PTIS].[RetrospectivePenaltyRule]
    DROP CONSTRAINT [CK_RetrospectivePenaltyRule_PenaltyMode];

    UPDATE [PTIS].[RetrospectivePenaltyRule]
    SET [PenaltyMode] = 'ACT_PENALTY'
    WHERE [PenaltyMode] = 'ACT_UNLAWFUL';

    ALTER TABLE [PTIS].[RetrospectivePenaltyRule] WITH CHECK
    ADD CONSTRAINT [CK_RetrospectivePenaltyRule_PenaltyMode]
    CHECK ([PenaltyMode] IN ('NONE', 'ACT_PENALTY', 'DATE_VALIDATION'));
END;

GO


CREATE OR ALTER TRIGGER PTIS.TR_RevisionPeriod_ValidateFinanceYear
ON PTIS.RevisionPeriod
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM inserted I
        INNER JOIN PTIS.RevisionMast RM
            ON RM.Id = I.RevisionMastId
        INNER JOIN CORE.YearMaster YM
            ON YM.Id = RM.FinanceYearId
        WHERE
               YM.StartDate IS NULL
            OR YM.EndDate IS NULL
            OR I.EffectiveFrom < CAST(YM.StartDate AS DATE)
            OR I.EffectiveTo   > CAST(YM.EndDate AS DATE)
    )
    BEGIN
        THROW 50001,
              'Revision period must fall within the selected financial year.',
              1;
    END;
END;
GO