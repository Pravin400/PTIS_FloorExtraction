namespace NtisPlatform.Application.DTOs.WhatsApp;

/// <summary>
/// Universal dynamic request model for dispatching template-based WhatsApp messages.
/// Designed for reuse across all platform modules (Grievance, Property Tax, Water Billing, User Auth, etc.).
/// All values are dynamically supplied from configuration and callers without static fallbacks.
/// </summary>
public class WhatsAppMessageRequest
{
    /// <summary>
    /// Numeric country dial code (e.g. 91).
    /// </summary>
    public int CountryCode { get; set; }

    /// <summary>
    /// Recipient mobile number.
    /// </summary>
    public string MobileNo { get; set; } = string.Empty;

    /// <summary>
    /// WhatsApp template name registered in Meta.
    /// </summary>
    public string TemplateName { get; set; } = string.Empty;

    /// <summary>
    /// Template language code.
    /// </summary>
    public string Language { get; set; } = string.Empty;

    /// <summary>
    /// Dynamic sequence of body parameter values ({{1}}, {{2}}, ..., {{n}}).
    /// </summary>
    public IReadOnlyList<string> BodyParameters { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Optional dynamic button parameter values (for templates with dynamic CTA buttons).
    /// </summary>
    public IReadOnlyList<string>? ButtonParameters { get; set; }

    /// <summary>
    /// Optional contextual metadata for tracking, auditing, or logging.
    /// </summary>
    public IDictionary<string, string>? Metadata { get; set; }
}
