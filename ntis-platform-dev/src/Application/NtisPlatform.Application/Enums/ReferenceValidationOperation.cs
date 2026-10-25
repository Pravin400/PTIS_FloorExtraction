namespace NtisPlatform.Application.Enums;

/// <summary>
/// The operation a reference validation guards. It only changes the wording of the readable message
/// ("cannot be deleted" / "cannot be deactivated"); the same references block both operations.
/// </summary>
/// <remarks>
/// Values are explicit so they never shift if a member is added, and 0 is not a valid operation, so an
/// uninitialised value is rejected rather than read as Delete.
/// </remarks>
public enum ReferenceValidationOperation
{
    /// <summary>
    /// Deleting the record
    /// </summary>
    Delete = 1,

    /// <summary>
    /// Setting the record inactive through an update
    /// </summary>
    Deactivate = 2
}
