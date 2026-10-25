using System.Text.Json;

namespace DatabaseManager;

/// <summary>
/// Resolves which SQL scripts need to be executed for a version upgrade
/// Reads from upgradePaths.json configuration file
/// Looks for SQL files in version-specific folders under sql/upgrades/
/// </summary>
public class UpgradePathResolver
{
    private readonly string _upgradePathsFile;
    private readonly string _upgradesBasePath;
    private List<string>? _versions;

    public UpgradePathResolver(string upgradePathsFile, string upgradesBasePath = "")
    {
        _upgradePathsFile = upgradePathsFile;
        // If not provided, assume it's in the same directory as upgradePathsFile
        _upgradesBasePath = string.IsNullOrEmpty(upgradesBasePath) 
            ? Path.GetDirectoryName(upgradePathsFile) ?? ""
            : upgradesBasePath;
    }

    /// <summary>
    /// Loads the upgrade paths configuration from JSON
    /// </summary>
    public async Task LoadAsync()
    {
        if (!File.Exists(_upgradePathsFile))
        {
            throw new FileNotFoundException($"Upgrade paths configuration file not found: {_upgradePathsFile}");
        }

        var json = await File.ReadAllTextAsync(_upgradePathsFile);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        // New format: "upgrades": { "1.0.0": { "enabled": true, "description": "..." }, ... }
        var config = JsonSerializer.Deserialize<UpgradePathsConfig>(json, options);

        if (config?.Upgrades == null || config.Upgrades.Count == 0)
        {
            throw new InvalidOperationException("No upgrade paths defined in configuration");
        }

        // Build versions list from entries that are enabled (or missing the flag -> default true)
        // Note: we do not yet consider the target version here; GetUpgradeScripts will ensure
        // the target version is always included even if marked disabled.
        _versions = config.Upgrades
            .Where(kv => kv.Value?.Enabled ?? true)
            .Select(kv => kv.Key)
            .ToList();
    }

    /// <summary>
    /// Gets the SQL files that need to be executed to upgrade from currentVersion to targetVersion
    /// Returns an ordered list of versions to apply
    /// Reads files from version-specific folders: {version}/01_base_schema.sql, {version}/02_core_schema.sql
    /// </summary>
    public List<UpgradeVersion> GetUpgradeScripts(string currentVersion, string targetVersion)
    {
        if (_versions == null)
        {
            throw new InvalidOperationException("Upgrade paths not loaded. Call LoadAsync() first.");
        }

        var result = new List<UpgradeVersion>();
        var sortedVersions = _versions.OrderBy(v => new Version(v)).ToList();

        // If the targetVersion exists in the config but is disabled, ensure it's included
        // so that the scripts for the target version are executed as requested.
        if (!sortedVersions.Contains(targetVersion))
        {
            // Check if the target is present in the config at all (even if disabled)
            try
            {
                var json = File.ReadAllText(_upgradePathsFile);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var configFull = JsonSerializer.Deserialize<UpgradePathsConfig>(json, options);
                if (configFull?.Upgrades != null && configFull.Upgrades.ContainsKey(targetVersion))
                {
                    sortedVersions = sortedVersions.Append(targetVersion)
                        .OrderBy(v => new Version(v)).ToList();
                }
            }
            catch
            {
                // ignore errors reading the file here; fallback behavior applies
            }
        }

        foreach (var version in sortedVersions)
        {
            // Include target version even if current version equals it (to allow re-execution)
            // Include any version between current and target (exclusive of current, inclusive of target)
            if ((version == targetVersion) || (IsVersionGreater(version, currentVersion) && IsVersionLessThanOrEqual(version, targetVersion)))
            {
                // Read files from version-specific folder
                var versionFolderPath = Path.Combine(_upgradesBasePath, version);
                var scripts = GetScriptsFromFolder(versionFolderPath, version);
                
                if (scripts.Count > 0)
                {
                    var upgradeVersion = new UpgradeVersion
                    {
                        Version = version,
                        Scripts = scripts
                    };
                    result.Add(upgradeVersion);
                }
            }
        }

        return result;
    }

    /// <summary>
    /// Gets all SQL files from a version folder, ordered by filename.
    /// Supports module-based structure: {version}/modules/{module}/*.sql
    /// Falls back to flat structure: {version}/*.sql
    /// </summary>
    private List<string> GetScriptsFromFolder(string folderPath, string version)
    {
        var scripts = new List<string>();

        if (!Directory.Exists(folderPath))
        {
            Console.WriteLine($"Warning: Version folder not found: {folderPath}");
            return scripts;
        }

        // Check for module-based structure
        var modulesPath = Path.Combine(folderPath, "modules");

        if (Directory.Exists(modulesPath))
        {
            // Process modules alphabetically
            var moduleDirectories = Directory.GetDirectories(modulesPath).OrderBy(d => d).ToList();
            foreach (var moduleDir in moduleDirectories)
            {
                var moduleName = Path.GetFileName(moduleDir);
                var moduleFiles = Directory.GetFiles(moduleDir, "*.sql").OrderBy(f => f).ToList();
                foreach (var file in moduleFiles)
                {
                    scripts.Add(Path.Combine(version, "modules", moduleName, Path.GetFileName(file)));
                }
            }
        }
        else
        {
            // Fallback: flat structure (files directly in version folder)
            var sqlFiles = Directory.GetFiles(folderPath, "*.sql").OrderBy(f => f).ToList();
            foreach (var file in sqlFiles)
            {
                scripts.Add(Path.Combine(version, Path.GetFileName(file)));
            }
        }

        return scripts;
    }

    private bool IsVersionGreater(string version, string comparedTo)
    {
        try
        {
            return new Version(version) > new Version(comparedTo);
        }
        catch
        {
            return false;
        }
    }

    private bool IsVersionLessThanOrEqual(string version, string comparedTo)
    {
        try
        {
            return new Version(version) <= new Version(comparedTo);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Configuration classes for deserializing upgradePaths.json
    /// </summary>
    public class UpgradePathsConfig
    {
        // New shape: "upgrades": { "1.0.0": { "enabled": true, "description": "..." }, ... }
        public Dictionary<string, UpgradeEntry> Upgrades { get; set; } = new();
    }

    public class UpgradeEntry
    {
        public bool Enabled { get; set; } = true;
        public string? Description { get; set; }
    }

    public class UpgradeVersion
    {
        public string Version { get; set; } = string.Empty;
        public List<string> Scripts { get; set; } = new();
    }
}
