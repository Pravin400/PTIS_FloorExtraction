using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace DatabaseManager;

internal class Program
{
    private static IConfigurationRoot Configuration = default!;

    private static async Task<int> Main(string[] args)
    {
        // Parse command-line arguments
        bool dryRun = args.Contains("--dry-run", StringComparer.OrdinalIgnoreCase);
        bool force = args.Contains("--force", StringComparer.OrdinalIgnoreCase) || args.Contains("--yes", StringComparer.OrdinalIgnoreCase);
        string? dbNameArg = GetArgValue(args, "--database");
        string? versionArg = GetArgValue(args, "--version");
        string? connectionStringArg = GetArgValue(args, "--connection-string");
        var commandArgs = args.Where(a => !a.StartsWith("--")).ToArray();

        // Load configuration
        Configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
            .Build();

        // Load application settings early so we can examine the database state before prompting
        var appSettings = Configuration.GetSection("Database").Get<AppSettings>();
        if (appSettings == null)
        {
            Console.WriteLine("Missing Database configuration in appsettings.json");
            return 1;
        }

        // Override with command-line arguments if provided
        if (!string.IsNullOrEmpty(dbNameArg))
        {
            appSettings.DatabaseName = dbNameArg;
        }

        if (!string.IsNullOrEmpty(versionArg))
        {
            appSettings.TargetVersion = versionArg;
        }

        if (string.IsNullOrEmpty(appSettings.TargetVersion))
        {
            Console.WriteLine("TargetVersion not specified in appsettings.json or --version argument");
            return 1;
        }

        // Get connection string from command-line, ConnectionStrings section, or build from Database properties
        var connectionString = connectionStringArg
            ?? Configuration.GetConnectionString("Default")
            ?? appSettings.GetConnectionString();
        var runner = new SqlScriptRunner(connectionString);
        var versionManager = new DatabaseVersionManager(connectionString);

        // Analyse the database state
        if (dryRun)
        {
            Console.WriteLine("=== DRY RUN MODE - No changes will be made ===");
        }
        Console.WriteLine("Analysing database...");
        var dbExists = await runner.DatabaseExistsAsync(appSettings.DatabaseName);

        string command;
        if (commandArgs.Length == 0)
        {
            Console.WriteLine("Interactive mode: enter a command and press Enter.");
            if (!dbExists)
            {
                Console.WriteLine("  C - Create database with base schema");
                Console.WriteLine("  Q - Quit without doing anything");

                while (true)
                {
                    Console.Write("Enter command (C/Q): ");
                    var input = Console.ReadLine()?.Trim().ToUpperInvariant();
                    if (string.IsNullOrEmpty(input))
                        continue;
                    if (input == "Q" || input == "QUIT" || input == "EXIT")
                        return 0;
                    if (input == "C")
                    {
                        command = input;
                        break;
                    }

                    Console.WriteLine("Unknown command. Please enter C or Q.");
                }
            }
            else
            {
                Console.WriteLine("  C - Create database with base schema (will DROP existing DB)");
                Console.WriteLine("  U - Upgrade database to target version");
                Console.WriteLine("  Q - Quit without doing anything");

                while (true)
                {
                    Console.Write("Enter command (C/U/Q): ");
                    var input = Console.ReadLine()?.Trim().ToUpperInvariant();
                    if (string.IsNullOrEmpty(input))
                        continue;
                    if (input == "Q" || input == "QUIT" || input == "EXIT")
                        return 0;
                    if (input == "C" || input == "U")
                    {
                        command = input;
                        break;
                    }

                    Console.WriteLine("Unknown command. Please enter C, U, or Q.");
                }
            }
        }
        else
        {
            command = commandArgs[0].ToUpperInvariant();
        }

        // Dry-run mode only supports Upgrade command
        if (dryRun && command != "U")
        {
            Console.WriteLine("Dry-run mode is only supported for Upgrade (U) command.");
            return 1;
        }

        // If user chose Create and the DB already exists, require confirmation and drop DB first
        if (command == "C" && dbExists)
        {
            bool confirmed;
            if (force)
            {
                Console.WriteLine($"Database '{appSettings.DatabaseName}' already exists. --force specified, dropping and recreating without prompting.");
                confirmed = true;
            }
            else
            {
                Console.Write($"Database '{appSettings.DatabaseName}' already exists. This will DROP the database and recreate it. Are you sure? (y/N): ");
                var conf = Console.ReadLine()?.Trim().ToUpperInvariant();
                confirmed = conf == "Y" || conf == "YES";
            }

            if (confirmed)
            {
                Console.WriteLine("Dropping existing database...");
                await runner.DropDatabaseAsync(appSettings.DatabaseName);
                // After drop, ensure flag is false for following logic
                dbExists = false;
            }
            else
            {
                Console.WriteLine("Create cancelled.");
                return 0;
            }
        }

        try
        {
            switch (command)
            {
                case "C":
                    Console.WriteLine("Creating database...");
                    await runner.CreateDatabaseIfNotExistsAsync(appSettings.DatabaseName);

                    // Ensure version tracking table exists
                    await versionManager.EnsureSchemaVersionsTableAsync(appSettings.DatabaseName);

                    // Execute base scripts and record current target version (base schema contains latest code)
                    // Use the output folder's copied `sql` directory so files are available after build
                    var basePath = Path.Combine(AppContext.BaseDirectory, "sql", "base");
                    await runner.ExecuteVersionedSqlFilesAsync(basePath, "0.0.0", appSettings.TargetVersion, versionManager, appSettings.DatabaseName);

                    // Execute post-deployment script
                    await runner.ExecutePostDeploymentAsync(appSettings.DatabaseName);

                    Console.WriteLine($"Database created successfully at version {appSettings.TargetVersion}");
                    break;

                case "U":
                    Console.WriteLine($"Upgrading database to version {appSettings.TargetVersion}...");

                    // Ensure version tracking table exists
                    await versionManager.EnsureSchemaVersionsTableAsync(appSettings.DatabaseName);

                    // Get current database version
                    var currentVersion = await versionManager.GetCurrentDatabaseVersionAsync(appSettings.DatabaseName);
                    Console.WriteLine($"Current database version: {currentVersion}");
                    Console.WriteLine($"Target version: {appSettings.TargetVersion}");

                    // Check if current version is greater than target version
                    if (new Version(currentVersion) > new Version(appSettings.TargetVersion))
                    {
                        Console.WriteLine($"ERROR: Current database version ({currentVersion}) is greater than target version ({appSettings.TargetVersion}).");
                        Console.WriteLine("Cannot downgrade. No changes have been applied.");
                        return 1;
                    }

                    // Load upgrade paths from the output folder where upgradePaths.json is copied
                    var upgradePathsFile = Path.Combine(AppContext.BaseDirectory, "upgradePaths.json");
                    var upgradesBasePathForResolver = Path.Combine(AppContext.BaseDirectory, "sql", "upgrades");
                    var resolver = new UpgradePathResolver(upgradePathsFile, upgradesBasePathForResolver);
                    await resolver.LoadAsync();

                    // Get scripts to execute
                    var upgradeScripts = resolver.GetUpgradeScripts(currentVersion, appSettings.TargetVersion);

                    if (upgradeScripts.Count == 0)
                    {
                        Console.WriteLine("No upgrade scripts found for the specified version range.");
                        return 0;
                    }

                    // Execute each version's scripts (from output folder)
                    var upgradesBasePath = Path.Combine(AppContext.BaseDirectory, "sql", "upgrades");
                    foreach (var upgrade in upgradeScripts)
                    {
                        Console.WriteLine($"\nApplying version {upgrade.Version}...");

                        if (dryRun)
                        {
                            Console.WriteLine($"  [DRY RUN] Would execute scripts for version {upgrade.Version}");
                            foreach (var script in upgrade.Scripts)
                            {
                                Console.WriteLine($"    - {Path.GetFileName(script)}");
                            }
                        }
                        else
                        {
                            // Get fromVersion before applying this version
                            var fromVersion = await versionManager.GetCurrentDatabaseVersionAsync(appSettings.DatabaseName);
                            var versionFolder = Path.Combine(upgradesBasePath, upgrade.Version);
                            await runner.ExecuteVersionedSqlFilesAsync(versionFolder, fromVersion, upgrade.Version, versionManager, appSettings.DatabaseName);
                        }
                    }

                    if (!dryRun)
                    {
                        // Execute post-deployment script
                        await runner.ExecutePostDeploymentAsync(appSettings.DatabaseName);

                        var finalVersion = await versionManager.GetCurrentDatabaseVersionAsync(appSettings.DatabaseName);
                        Console.WriteLine($"\nUpgrade completed. Database is now at version {finalVersion}");
                    }
                    else
                    {
                        Console.WriteLine($"\n[DRY RUN] Upgrade plan completed. No changes were made.");
                        Console.WriteLine($"[DRY RUN] Database would be upgraded from {currentVersion} to {appSettings.TargetVersion}");
                    }
                    break;

                default:
                    Console.WriteLine("Unknown command. Use C for create or U for upgrade.");
                    return 1;
            }

            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return 2;
        }
    }

    /// <summary>
    /// Helper method to split SQL statements by GO keyword
    /// </summary>
    private static IEnumerable<string> SplitSqlStatements(string sql)
    {
        var lines = sql.Replace("\r\n", "\n").Split('\n');
        var sb = new System.Text.StringBuilder();
        foreach (var line in lines)
        {
            if (line.Trim().Equals("GO", StringComparison.OrdinalIgnoreCase))
            {
                yield return sb.ToString();
                sb.Clear();
            }
            else
            {
                sb.AppendLine(line);
            }
        }

        if (sb.Length > 0)
            yield return sb.ToString();
    }

    /// <summary>
    /// Gets the value of a command-line argument like --database=MyDb or --database MyDb
    /// </summary>
    private static string? GetArgValue(string[] args, string argName)
    {
        for (int i = 0; i < args.Length; i++)
        {
            // Check for --argName=value format
            if (args[i].StartsWith($"{argName}=", StringComparison.OrdinalIgnoreCase))
            {
                return args[i].Substring(argName.Length + 1);
            }
            // Check for --argName value format
            if (args[i].Equals(argName, StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                return args[i + 1];
            }
        }
        return null;
    }
}