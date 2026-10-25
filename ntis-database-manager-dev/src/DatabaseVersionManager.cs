using System.Data;
using Microsoft.Data.SqlClient;

namespace DatabaseManager;

/// <summary>
/// Manages database versioning - tracks current version, gets version from DB, and updates version
/// </summary>
public class DatabaseVersionManager
{
    private readonly string _connectionString;
    private const string SCHEMA_VERSIONS_TABLE = "dbo.SchemaVersions";
    private const string SCHEMA_VERSION_FILES_TABLE = "dbo.SchemaVersionFiles";

    public DatabaseVersionManager(string connectionString)
    {
        _connectionString = connectionString;
    }

    /// <summary>
    /// Ensures the SchemaVersions tracking table exists
    /// </summary>
    public async Task EnsureSchemaVersionsTableAsync()
    {
        var sql = $@"
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SchemaVersions' AND SCHEMA_NAME(schema_id) = 'dbo')
BEGIN
    CREATE TABLE {SCHEMA_VERSIONS_TABLE} (
        Version NVARCHAR(50) NOT NULL PRIMARY KEY,
        AppliedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SchemaVersionFiles' AND SCHEMA_NAME(schema_id) = 'dbo')
BEGIN
    -- Stores per-upgrade script rows. Each row records which upgrade (FromVersion -> ToVersion) the script belonged to.
    CREATE TABLE {SCHEMA_VERSION_FILES_TABLE} (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FromVersion NVARCHAR(50) NOT NULL,
        ToVersion NVARCHAR(50) NOT NULL,
        Script NVARCHAR(255) NOT NULL,
        AppliedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
-- Ensure an index exists on ToVersion for quick lookups
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE i.name = 'IX_SchemaVersionFiles_ToVersion' AND s.name = 'dbo' AND t.name = 'SchemaVersionFiles'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_SchemaVersionFiles_ToVersion ON dbo.SchemaVersionFiles(ToVersion);
END;
";
        using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Ensures the SchemaVersions tracking table exists in the specified database
    /// </summary>
    public async Task EnsureSchemaVersionsTableAsync(string databaseName)
    {
        var dbConnectionString = new SqlConnectionStringBuilder(_connectionString)
        {
            InitialCatalog = databaseName
        }.ConnectionString;

        var sql = $@"
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SchemaVersions' AND SCHEMA_NAME(schema_id) = 'dbo')
BEGIN
    CREATE TABLE {SCHEMA_VERSIONS_TABLE} (
        Version NVARCHAR(50) NOT NULL PRIMARY KEY,
        AppliedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SchemaVersionFiles' AND SCHEMA_NAME(schema_id) = 'dbo')
BEGIN
    -- Stores per-upgrade script rows. Each row records which upgrade (FromVersion -> ToVersion) the script belonged to.
    CREATE TABLE {SCHEMA_VERSION_FILES_TABLE} (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FromVersion NVARCHAR(50) NOT NULL,
        ToVersion NVARCHAR(50) NOT NULL,
        Script NVARCHAR(255) NOT NULL,
        AppliedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
-- Ensure an index exists on ToVersion for quick lookups
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE i.name = 'IX_SchemaVersionFiles_ToVersion' AND s.name = 'dbo' AND t.name = 'SchemaVersionFiles'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_SchemaVersionFiles_ToVersion ON dbo.SchemaVersionFiles(ToVersion);
END;
";
        using var conn = new SqlConnection(dbConnectionString);
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Gets the current database version from SchemaVersions table
    /// Returns "0.0.0" if no versions are recorded yet
    /// </summary>
    public async Task<string> GetCurrentDatabaseVersionAsync()
    {
        var sql = $"SELECT MAX(Version) FROM {SCHEMA_VERSIONS_TABLE};";

        try
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            var result = await cmd.ExecuteScalarAsync();
            
            if (result == null || result is DBNull)
                return "0.0.0";
            
            return result.ToString() ?? "0.0.0";
        }
        catch (SqlException)
        {
            // Table doesn't exist yet
            return "0.0.0";
        }
    }

    /// <summary>
    /// Gets the current database version from SchemaVersions table in the specified database
    /// Returns "0.0.0" if no versions are recorded yet
    /// </summary>
    public async Task<string> GetCurrentDatabaseVersionAsync(string databaseName)
    {
        var dbConnectionString = new SqlConnectionStringBuilder(_connectionString)
        {
            InitialCatalog = databaseName
        }.ConnectionString;

        var sql = $"SELECT MAX(Version) FROM {SCHEMA_VERSIONS_TABLE};";

        try
        {
            using var conn = new SqlConnection(dbConnectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            var result = await cmd.ExecuteScalarAsync();
            
            if (result == null || result is DBNull)
                return "0.0.0";
            
            return result.ToString() ?? "0.0.0";
        }
        catch (SqlException)
        {
            // Table doesn't exist yet
            return "0.0.0";
        }
    }

    /// <summary>
    /// Records a version as applied in the SchemaVersions table (summary row)
    /// </summary>
    public async Task RecordVersionAsync(string version)
    {
    // Keep only the current DB version in the SchemaVersions table.
    // Implementation: delete any existing rows and insert the current version as the sole row.
    var sql = $@"
DELETE FROM {SCHEMA_VERSIONS_TABLE};
INSERT INTO {SCHEMA_VERSIONS_TABLE} (Version) VALUES (@Version);
";
    using var conn = new SqlConnection(_connectionString);
    await conn.OpenAsync();
    using var cmd = new SqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("@Version", version);
    await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Records a version as applied in the SchemaVersions table using an existing transaction
    /// </summary>
    public async Task RecordVersionAsync(string version, SqlTransaction transaction)
    {
        var sql = $@"
DELETE FROM {SCHEMA_VERSIONS_TABLE};
INSERT INTO {SCHEMA_VERSIONS_TABLE} (Version) VALUES (@Version);
";
        using var cmd = new SqlCommand(sql, transaction.Connection, transaction);
        cmd.Parameters.AddWithValue("@Version", version);
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Records the scripts executed as part of an upgrade from fromVersion -> toVersion.
    /// Each script is inserted as a separate row with FromVersion/ToVersion and Script filename.
    /// </summary>
    public async Task RecordVersionFilesAsync(string fromVersion, string toVersion, List<string> scripts)
    {
        if (scripts == null || scripts.Count == 0) return;

        var sql = $@"
INSERT INTO {SCHEMA_VERSION_FILES_TABLE} (FromVersion, ToVersion, Script)
VALUES (@FromVersion, @ToVersion, @Script);
";

        using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();
        foreach (var s in scripts)
        {
            var fileName = Path.GetFileName(s) ?? s;
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@FromVersion", fromVersion);
            cmd.Parameters.AddWithValue("@ToVersion", toVersion);
            cmd.Parameters.AddWithValue("@Script", fileName);
            await cmd.ExecuteNonQueryAsync();
        }
    }

    /// <summary>
    /// Records the scripts executed as part of an upgrade using an existing transaction
    /// </summary>
    public async Task RecordVersionFilesAsync(string fromVersion, string toVersion, List<string> scripts, SqlTransaction transaction)
    {
        if (scripts == null || scripts.Count == 0) return;

        var sql = $@"
INSERT INTO {SCHEMA_VERSION_FILES_TABLE} (FromVersion, ToVersion, Script)
VALUES (@FromVersion, @ToVersion, @Script);
";

        foreach (var s in scripts)
        {
            var fileName = Path.GetFileName(s) ?? s;
            using var cmd = new SqlCommand(sql, transaction.Connection, transaction);
            cmd.Parameters.AddWithValue("@FromVersion", fromVersion);
            cmd.Parameters.AddWithValue("@ToVersion", toVersion);
            cmd.Parameters.AddWithValue("@Script", fileName);
            await cmd.ExecuteNonQueryAsync();
        }
    }

    /// <summary>
    /// Returns the list of scripts recorded as applied for a given version, ordered by application time.
    /// </summary>
    public async Task<List<string>> GetExecutedScriptsAsync(string toVersion)
    {
        var sql = $"SELECT Script FROM {SCHEMA_VERSION_FILES_TABLE} WHERE ToVersion = @ToVersion ORDER BY AppliedOn;";
        var results = new List<string>();

        try
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ToVersion", toVersion);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(reader.GetString(0));
            }
        }
        catch (SqlException)
        {
            // Table might not exist yet - return empty list
        }

        return results;
    }

    /// <summary>
    /// Gets all applied versions in order
    /// </summary>
    public async Task<List<string>> GetAppliedVersionsAsync()
    {
        var sql = $"SELECT Version FROM {SCHEMA_VERSIONS_TABLE} ORDER BY AppliedOn;";
        var versions = new List<string>();

        try
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                versions.Add(reader.GetString(0));
            }
        }
        catch (SqlException)
        {
            // Table doesn't exist yet
        }

        return versions;
    }
}
