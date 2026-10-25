-- ============================================================================
-- CORE Module - Protect Triggers
-- ============================================================================

-- Department Master
CREATE OR ALTER TRIGGER [CORE].[TR_DepartmentMaster_Protect]
ON [CORE].[DepartmentMaster]
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
              'Protected department records cannot be deleted.',
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
                 i.[DepartmentCode] <> d.[DepartmentCode]
              OR i.[DepartmentName] <> d.[DepartmentName]
                   
              OR i.[IsActive] <> d.[IsActive]
              OR i.[IsProtected] <> d.[IsProtected]
          )
    )
    BEGIN
        THROW 50002,
              'DepartmentCode, DepartmentName, DepartmentNameLocal, DepartmentIcon, DepartmentDescription, IsActive and IsProtected cannot be changed for protected department records.',
              1;
    END;
END;
GO