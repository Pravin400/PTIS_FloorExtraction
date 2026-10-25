namespace NtisPlatform.Application.Exceptions;

/// <summary>
/// The retrospective lock of a property could not be taken because another calculation (in this process or in another
/// one) held it for longer than the lock waits. Nothing of the calculation that asked for the lock was started, so
/// trying again later is safe. Inherits from <see cref="InvalidOperationException"/> so everything that handled the lock's
/// failure as an <see cref="InvalidOperationException"/> still does, while a caller that must tell it from the other
/// failures of a calculation (an RV recalculation that is rejected, say) can.
/// </summary>
public class RetrospectiveCalculationInProgressException : InvalidOperationException
{
    public RetrospectiveCalculationInProgressException(int propertyId, string message)
        : base(message)
    {
        PropertyId = propertyId;
    }

    /// <summary>The property whose lock was held by another calculation.</summary>
    public int PropertyId { get; }
}
