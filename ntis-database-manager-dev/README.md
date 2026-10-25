# Database Manager

A command-line tool for managing SQL Server database schema versioning and upgrades.

## Features

- **Version-based upgrades**: Apply incremental schema changes based on version numbers
- **Interactive mode**: User-friendly prompts for database operations
- **Dry-run mode**: Preview changes without executing them
- **Script tracking**: Records all executed scripts with version history
- **Safe operations**: Confirmation prompts for destructive actions

## Prerequisites

- .NET 10.0 or later
- SQL Server (LocalDB, Express, or full installation)
- Integrated Windows Authentication or SQL Server credentials

## Configuration

Edit `appsettings.json` to configure your database connection:

```json
{
  ConnectionStrings: {
    Default: Data Source=.\\SQLEXPRESS;Initial Catalog=master;Integrated Security=True;TrustServerCertificate=True
  },
  Database: {
    DatabaseName: MyAppDb,
    TargetVersion: 1.1.0
  }
}
```

**Configuration Options:**
- `ConnectionStrings.Default`: Connection string to SQL Server (connects to master database)
- `DatabaseName`: Target database name that will be created/upgraded
- `TargetVersion`: Desired schema version (used for both Create and Upgrade operations)

## Usage

### Interactive Mode

Run without arguments for interactive prompts:

```powershell
DatabaseManager.exe
```

The tool will analyze the database and present available options:
- **C** - Create database (drops existing if present)
- **U** - Upgrade to target version
- **Q** - Quit

### Command-Line Mode

Execute specific commands directly:

```powershell
# Create database at target version (base schema contains latest code)
dotnet run -- C

# Upgrade existing database to target version
dotnet run -- U

# Dry-run (preview upgrade without executing)
dotnet run -- U --dry-run

# Override database name from command line
dotnet run -- C --database MyCustomDb

# Override target version from command line
dotnet run -- U --version 2.0.0

# Override connection string from command line
dotnet run -- U --connection-string "Data Source=.\SQLEXPRESS;Integrated Security=True;TrustServerCertificate=True"
```

**Command-Line Options:**
- `--database <name>`: Override the database name from `appsettings.json`
- `--version <version>`: Override the target version from `appsettings.json`
- `--connection-string <connection>`: Override the connection string from `appsettings.json`
- `--dry-run`: Preview changes without executing them (Upgrade command only)

**Important:** When creating a database with the `C` command, it will be created directly at the `TargetVersion` specified in `appsettings.json` (or overridden with `--version`). The base schema files (`sql/base/`) are expected to always contain the latest schema code matching the target version.

### Dry-Run Mode

Preview what scripts would be executed without making any changes:

```powershell
dotnet run -- U --dry-run
```

This will:
- Show current and target versions
- List all scripts that would be executed
- Display the upgrade path
- Exit without modifying the database

**Note:** Dry-run is only supported for the Upgrade (U) command.

## Project Structure

```
DatabaseManager/
├── sql/
│   ├── base/               # Latest database schema (at TargetVersion)
│   │   ├── 01_system_initialization.sql
│   │   ├── 02_base_schema.sql
│   │   ├── 03_core_schema.sql
│   │   ├── 04_seed_data.sql
│   ├── upgrades/           # Incremental version upgrades
│   │   ├── 1.1.0/
│   │   │   ├── 01_base_schema.sql
│   │   │   ├── 02_core_schema.sql
│   │   ├── 1.5.0/
│   │   ├── 1.7.0/
│   │   ├── 2.0.0/
│   ├──post-deployment.sql  
├── appsettings.json        # Database configuration
├── upgradePaths.json       # Version upgrade definitions
├── DatabaseManager.csproj  # Project file
```

**Key Concepts:**
- `sql/base/`: Contains the complete latest schema. When creating a new database, these scripts are executed and the database is marked with the `TargetVersion` from `appsettings.json`.
- `sql/upgrades/`: Contains incremental changes between versions. Used only when upgrading an existing database from one version to another.

## Version Management

### Version Tracking Tables

The tool creates two tracking tables:

**dbo.SchemaVersions** - Stores current database version:
- `Version`: Current schema version (only one row)
- `AppliedOn`: Timestamp of last upgrade

**dbo.SchemaVersionFiles** - Audit log of executed scripts:
- `FromVersion`: Starting version of the upgrade
- `ToVersion`: Target version of the upgrade
- `Script`: Script filename that was executed
- `AppliedOn`: Execution timestamp

### Adding New Versions

When releasing a new version, you need to update both the base schema and create upgrade scripts:

1. **Update base schema**: Modify files in `sql/base/` to reflect the complete latest schema
2. **Create upgrade scripts**: Add a new version folder under `sql/upgrades/` (e.g., `2.1.0/`) with SQL scripts containing only the incremental changes from the previous version
3. **Update configuration files**:

   In `upgradePaths.json`:
   ```json
   {
     upgrades: {
       2.1.0: { enabled: true }
     }
   }
   ```

   In `appsettings.json`:
   ```json
   {
     Database: {
       TargetVersion: 2.1.0
     }
   }
   ```

4. Run upgrade on existing databases: `dotnet run -- U`
5. New database creations will automatically be at version 2.1.0

### Disabling Versions

To skip a version during upgrades, set `enabled` to `false`:

```json
{
  upgrades: {
    1.7.0: { enabled: false }
  }
}
```

**Note:** The target version is always executed even if disabled.

## SQL Script Guidelines

- Use `GO` statements to separate batches
- Scripts are executed in alphanumeric order (01_, 02_, etc.)
- Each script should be idempotent when possible
- Use conditional logic: `IF NOT EXISTS`, `IF OBJECT_ID(...) IS NULL`
- Avoid `USE [DatabaseName]` statements (connection context is pre-set)

Example script structure:

```sql
-- Check if change already exists
IF NOT EXISTS (SELECT 1 FROM sys.columns 
               WHERE object_id = OBJECT_ID('dbo.Users') 
               AND name = 'Status')
BEGIN
    ALTER TABLE dbo.Users ADD Status NVARCHAR(50) NULL;
END
GO

-- Update stored procedure
IF OBJECT_ID('dbo.GetUsers') IS NOT NULL
    DROP PROCEDURE dbo.GetUsers;
GO

CREATE PROCEDURE dbo.GetUsers
AS
BEGIN
    SELECT Id, Username, Email, Status FROM dbo.Users;
END
GO
```

## Build & Deploy

### Build from Source

```powershell
dotnet build -c Release
# or
dotnet run -- C  # Run directly without building exe
```

Output location: `bin\Release\net10.0\`

### Deploy to Server

Copy these files to the target server:
- `DatabaseManager.dll` and all supporting DLLs
- `appsettings.json`
- `upgradePaths.json`
- `sql/` folder (with all base and upgrade scripts)

Update `appsettings.json` with production connection details and run with `dotnet DatabaseManager.dll <command>`.

## Troubleshooting

**Database does not exist error:**
- Run with `C` command to create the database first

**Column 'Version' does not exist error:**
- Drop and recreate the database, or manually drop tracking tables

**Connection timeout:**
- Verify SQL Server is running
- Check connection string in `appsettings.json`
- Test with: `sqlcmd -S .\SQLEXPRESS -E -Q SELECT @@VERSION`

**Scripts fail mid-upgrade:**
- Check error message for SQL syntax issues
- Review `dbo.SchemaVersionFiles` to see what was applied
- Fix the failing script and re-run upgrade

**Dry-run shows wrong scripts:**
- Check `upgradePaths.json` for correct version entries
- Verify script files exist in the version folder

## Exit Codes

- `0` - Success
- `1` - Invalid arguments or configuration error
- `2` - Runtime error (SQL execution failed)

## License

This project is provided as-is for database version management.




