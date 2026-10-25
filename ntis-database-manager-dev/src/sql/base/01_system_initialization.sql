-- System Initialization
-- This file creates infrastructure tables needed for database version tracking
-- Schema version tracking table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SchemaVersions' AND SCHEMA_NAME(schema_id) = 'dbo')
BEGIN
    CREATE TABLE dbo.SchemaVersions (
        Version NVARCHAR(50) NOT NULL PRIMARY KEY,
        Script NVARCHAR(255) NOT NULL,
        AppliedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'SchemaVersions table created successfully.';
END;
GO



IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'PTIS')
    EXEC('CREATE SCHEMA PTIS AUTHORIZATION dbo;');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'CORE')
    EXEC('CREATE SCHEMA CORE AUTHORIZATION dbo;');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'TLIS')
    EXEC('CREATE SCHEMA TLIS AUTHORIZATION dbo;');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'GSMS')
    EXEC('CREATE SCHEMA GSMS AUTHORIZATION dbo;');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'AMS')
    EXEC('CREATE SCHEMA AMS AUTHORIZATION dbo;');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'GIS')
    EXEC('CREATE SCHEMA GIS AUTHORIZATION dbo;');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'GRV')
    EXEC('CREATE SCHEMA GRV AUTHORIZATION dbo;');
Go
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'FAS')
    EXEC('CREATE SCHEMA FAS AUTHORIZATION dbo;');

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'WTIS')
    EXEC('CREATE SCHEMA WTIS AUTHORIZATION dbo;');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'AI')
    EXEC('CREATE SCHEMA AI AUTHORIZATION dbo;');
GO
