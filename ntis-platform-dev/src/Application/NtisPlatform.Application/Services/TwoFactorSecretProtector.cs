using Microsoft.AspNetCore.DataProtection;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Single source of truth for the Data Protection purpose string used to encrypt TOTP secrets
/// at rest, so setup and login-verification always agree on how to unprotect them.
/// </summary>
public class TwoFactorSecretProtector : ITwoFactorSecretProtector
{
    private const string ProtectorPurpose = "NtisPlatform.TwoFactorAuthentication.Secret.v1";

    private readonly IDataProtector _protector;

    public TwoFactorSecretProtector(IDataProtectionProvider dataProtectionProvider)
    {
        _protector = dataProtectionProvider.CreateProtector(ProtectorPurpose);
    }

    public string Protect(string plaintextSecret) => _protector.Protect(plaintextSecret);

    public string Unprotect(string encryptedSecret)
    {
        if (string.IsNullOrEmpty(encryptedSecret))
        {
            return string.Empty;
        }

        try
        {
            return _protector.Unprotect(encryptedSecret);
        }
        catch (System.Security.Cryptography.CryptographicException)
        {
            // If the secret is stored in plain Base32 (e.g. legacy/seed/admin data), fallback gracefully
            // but NEVER return un-decryptable ciphertext (starts with CfDJ8...) as a valid TOTP secret.
            if (IsLikelyBase32(encryptedSecret))
            {
                return encryptedSecret;
            }

            return string.Empty;
        }
    }

    private static bool IsLikelyBase32(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return false;
        var clean = input.Replace(" ", "").Replace("-", "").TrimEnd('=');
        return clean.Length >= 16 && clean.All(c => (c >= 'A' && c <= 'Z') || (c >= '2' && c <= '7'));
    }
}
