namespace NtisPlatform.Application.Exceptions;

/// <summary>
/// Exception thrown when an authenticated user lacks authorization or permissions to access a resource.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
    }

    public ForbiddenException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
