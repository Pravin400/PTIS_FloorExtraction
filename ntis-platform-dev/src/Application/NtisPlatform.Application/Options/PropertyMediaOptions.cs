namespace NtisPlatform.Application.Options;

/// <summary>
/// Strongly-typed settings for Property Media Development-only tooling, bound from the
/// "PropertyMediaDevTools" configuration section. Belongs in appsettings.Development.json only
/// (developer-machine-specific), never in the shared appsettings.json.
/// </summary>
public sealed class PropertyMediaDevToolsOptions
{
    public const string Section = "PropertyMediaDevTools";

    /// <summary>
    /// Local folder to import test images from. Fixed via server-side configuration only -
    /// never accepted as request input - and only ever used when the host environment is
    /// Development.
    /// </summary>
    public string? LocalImportFolder { get; set; }
}

/// <summary>
/// Strongly-typed settings for Property Media browse-upload session storage, bound from the
/// "PropertyMediaBrowseSessions" configuration section. Path resolution mirrors
/// FileStorageOptions.BasePath (relative to the app's working directory) - this is a sibling
/// folder of "Uploads", not nested inside it.
/// </summary>
public sealed class PropertyMediaBrowseSessionOptions
{
    public const string Section = "PropertyMediaBrowseSessions";

    /// <summary>Base directory for per-session browse-upload folders. Defaults to "BrowseSessions".</summary>
    public string BasePath { get; set; } = System.IO.Path.Combine("Uploads", "BrowseSessions");

    /// <summary>How long a session folder is kept before the cleanup sweep deletes it. Defaults to 2 hours.</summary>
    public int RetentionHours { get; set; } = 2;
}
