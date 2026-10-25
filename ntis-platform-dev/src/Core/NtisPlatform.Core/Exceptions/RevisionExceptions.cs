namespace NtisPlatform.Core.Exceptions;

/// <summary>
/// Thrown when a RevisionMast (or a revision-scoped lookup, e.g. by (PropertyId, RevisionId))
/// cannot be found. Maps to HTTP 404 via GlobalExceptionHandlerMiddleware (EntityNotFoundException).
/// </summary>
public class RevisionNotFoundException : EntityNotFoundException
{
    public RevisionNotFoundException(long revisionId)
        : base("Revision", revisionId, "REVISION_NOT_FOUND")
    {
    }
}

/// <summary>
/// Thrown for Revision-specific input validation failures (invalid scope/effective-date
/// combinations, effective date outside the finance year, etc). Maps to HTTP 400 via
/// GlobalExceptionHandlerMiddleware (NtisPlatformException).
/// </summary>
public class RevisionValidationException : ValidationException
{
    public RevisionValidationException(string message)
        : base(message, "REVISION_VALIDATION_ERROR")
    {
    }
}

/// <summary>
/// Thrown when a requested revision operation conflicts with the property's current revision
/// state - e.g. attempting to open a second DRAFT/CALCULATED revision for the same property and
/// finance year (revision_api_rules.txt section 26: "prevent conflicting draft/current revision
/// where required"). Maps to HTTP 400 via GlobalExceptionHandlerMiddleware (NtisPlatformException).
/// </summary>
public class RevisionConflictException : BusinessRuleException
{
    public RevisionConflictException(string message)
        : base(message, "REVISION_CONFLICT")
    {
    }

    public RevisionConflictException(string message, Exception innerException)
        : base(message, "REVISION_CONFLICT", innerException)
    {
    }
}
