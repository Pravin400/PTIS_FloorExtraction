using System.ComponentModel.DataAnnotations;
using System.Text;

namespace NtisPlatform.Application.Helpers;

public static class UpicIdBuilderHelper
{
    private const int UpicLength = 30;

    public static string Generate(string wardNo, string propertyNo, string? partitionNo)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(wardNo);
        ArgumentException.ThrowIfNullOrWhiteSpace(propertyNo);

        string ward = wardNo.Trim().ToUpperInvariant();
        string property = propertyNo.Trim().ToUpperInvariant();
        string partition = (partitionNo ?? string.Empty).Trim().ToUpperInvariant();

        string year = DateTime.UtcNow.ToString("yy");
        string prefix = $"{ward}{property}{partition}{year}";

        if (prefix.Length >= UpicLength)
            throw new ValidationException($"Combined UPIC prefix cannot exceed {UpicLength - 1} characters.");

        int suffixLength = UpicLength - prefix.Length;
        string suffix = GenerateRandomSuffix(suffixLength);

        string upic = $"{prefix}{suffix}";

        if (upic.Length != UpicLength)
            throw new InvalidOperationException($"UPIC must be exactly {UpicLength} characters.");

        return upic;
    }

    private static string GenerateRandomSuffix(int length)
    {
        var sb = new StringBuilder(length);
        while (sb.Length < length)
        {
            sb.Append(Guid.NewGuid().ToString("N").ToUpperInvariant());
        }
        return sb.ToString(0, length);
    }
}