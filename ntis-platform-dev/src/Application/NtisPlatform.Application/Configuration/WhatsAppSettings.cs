namespace NtisPlatform.Application.Configuration;

/// <summary>
/// Configuration settings for WhatsApp notifications.
/// Fully dynamic configuration loaded strictly from appsettings.json.
/// Zero hardcoded fallbacks, zero static data in C# code.
/// </summary>
public class WhatsAppSettings
{
    public const string SectionName = "WhatsApp";

    /// <summary>
    /// Master toggle to enable or disable WhatsApp dispatch platform-wide.
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Gateway API URL configured in appsettings.json.
    /// </summary>
    public string ApiUrl { get; set; } = string.Empty;

    /// <summary>
    /// API Authentication Token / Key for gateway authorization.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// WABA Registered Sender Number configured in appsettings.json.
    /// </summary>
    public string WabaNumber { get; set; } = string.Empty;

    /// <summary>
    /// Country code for phone number normalization configured in appsettings.json.
    /// </summary>
    public int DefaultCountryCode { get; set; }

    /// <summary>
    /// Template language code configured in appsettings.json.
    /// </summary>
    public string DefaultLanguage { get; set; } = string.Empty;

    /// <summary>
    /// HTTP client timeout in seconds configured in appsettings.json.
    /// </summary>
    public int TimeoutSeconds { get; set; }

    /// <summary>
    /// Base URL for tracking grievances via dynamic link configured in appsettings.json.
    /// </summary>
    public string TrackingBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// TimeZone identifier for date formatting configured in appsettings.json.
    /// </summary>
    public string TimeZoneId { get; set; } = string.Empty;

    /// <summary>
    /// Text and placeholder values configured in appsettings.json.
    /// </summary>
    public WhatsAppDefaultsSettings Defaults { get; set; } = new();

    /// <summary>
    /// Template mapping configured in appsettings.json.
    /// </summary>
    public Dictionary<string, string> Templates { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Resolves template name dynamically by event key from appsettings.json.
    /// Returns null if not configured.
    /// </summary>
    public string? GetTemplate(string eventKey)
    {
        return Templates != null && Templates.TryGetValue(eventKey, out var name) && !string.IsNullOrWhiteSpace(name)
            ? name
            : null;
    }
}

/// <summary>
/// Text and placeholder defaults loaded strictly from appsettings.json.
/// </summary>
public class WhatsAppDefaultsSettings
{
    public string DefaultCitizenName { get; set; } = string.Empty;
    public string DefaultDepartmentName { get; set; } = string.Empty;
    public string DefaultGrievanceType { get; set; } = string.Empty;
    public string DefaultStatus { get; set; } = string.Empty;
    public string GrievancePrefix { get; set; } = string.Empty;
}
