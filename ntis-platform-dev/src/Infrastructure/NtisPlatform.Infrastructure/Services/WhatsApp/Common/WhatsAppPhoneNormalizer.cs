using System.Text.RegularExpressions;

namespace NtisPlatform.Infrastructure.Services.WhatsApp.Common;

/// <summary>
/// Utility for standardizing phone numbers for WhatsApp WABA dispatch.
/// Completely dynamic: uses caller-provided country code without hardcoded country code fallbacks.
/// </summary>
public static class WhatsAppPhoneNormalizer
{
    /// <summary>
    /// Normalizes mobile numbers using the dynamically configured country code.
    /// </summary>
    public static string NormalizePhoneNumber(string? rawMobile, int countryCode)
    {
        if (string.IsNullOrWhiteSpace(rawMobile))
            return string.Empty;

        var digitsOnly = Regex.Replace(rawMobile.Split('.')[0].Trim(), @"\D", "");
        if (string.IsNullOrWhiteSpace(digitsOnly))
            return string.Empty;

        if (countryCode <= 0)
        {
            // If no country code is configured, return clean digits directly
            return digitsOnly;
        }

        var ccPrefix = countryCode.ToString();

        // 11 digits starting with 0 -> strip leading 0 and prepend country code
        if (digitsOnly.Length == 11 && digitsOnly.StartsWith("0"))
        {
            digitsOnly = digitsOnly.Substring(1);
        }

        // 10 digits -> prepend country code
        if (digitsOnly.Length == 10)
        {
            return ccPrefix + digitsOnly;
        }

        // Digits starting with country code -> valid
        if (digitsOnly.Length == 10 + ccPrefix.Length && digitsOnly.StartsWith(ccPrefix))
        {
            return digitsOnly;
        }

        return digitsOnly;
    }
}
