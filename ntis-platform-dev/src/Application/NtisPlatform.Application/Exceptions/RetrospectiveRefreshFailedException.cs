using NtisPlatform.Core.Exceptions;

namespace NtisPlatform.Application.Exceptions;

/// <summary>
/// A property's rateable value (RV) was recalculated and saved, but the retrospective engine run that has to follow it
/// failed. The recalculation replaced the property's current-year TransMast rows with NETTAX rows, including the CC / OC /
/// electricity-bill row a certificate put there, and only the engine puts them back, so the ledger is known to need repair
/// until the property is calculated again. The operation that asked for the recalculation therefore fails instead of
/// reporting success; calculating the property again (the recalculation is skipped when nothing changed, the engine runs)
/// is the repair.
/// <para>
/// The message is safe to show: it names the property and what to do, never the text of a database or framework
/// exception. The failure itself is the inner exception, and it is logged with <see cref="ErrorId"/>, so support can find
/// the full exception from the id a user reports.
/// </para>
/// </summary>
public class RetrospectiveRefreshFailedException : NtisPlatformException
{
    public const string Code = "RETRO_REFRESH_FAILED";

    public RetrospectiveRefreshFailedException(int propertyId, string errorId, string? reason, Exception innerException)
        : base(BuildMessage(propertyId, errorId, reason), Code, innerException)
    {
        PropertyId = propertyId;
        ErrorId = errorId;
        Data["PropertyId"] = propertyId;
        Data["ErrorId"] = errorId;
    }

    /// <summary>The property whose retrospective tax could not be refreshed.</summary>
    public int PropertyId { get; }

    /// <summary>A short id that is also on the log entry holding the full exception.</summary>
    public string ErrorId { get; }

    private static string BuildMessage(int propertyId, string errorId, string? reason)
    {
        var message =
            $"The rateable value of property {propertyId} was recalculated and saved, but its retrospective (certificate) tax could not be refreshed, " +
            "so its ledger may still show the NETTAX demand instead of the certificate's. Calculate the property again once the cause is fixed.";
        if (!string.IsNullOrWhiteSpace(reason))
        {
            message += $" Reason: {reason.Trim()}";
        }

        return $"{message} (Reference: {errorId})";
    }
}
