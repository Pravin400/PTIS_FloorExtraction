namespace NtisPlatform.Application.Interfaces.RetrospectiveTax;

/// <summary>
/// The retrospective lock of one property, held by the owner of a critical section on that property's tax rows: an RV
/// recalculation followed by a retrospective engine run (<see cref="IRetrospectiveTaxRefresher"/>) or an engine run on
/// its own. While it is held, no other retrospective calculation for the same property can start, in this process or in
/// another one. Dispose it to release the lock; disposing twice is harmless.
/// <para>
/// A holder that runs the engine passes the lock on (<see cref="IRetrospectiveTaxCalculationEngineService"/>'s overload
/// that takes it) instead of letting the engine take the lock again: the lock is not re-entrant, so a second
/// acquisition for the same property from inside the critical section would wait for itself.
/// </para>
/// </summary>
public interface IRetrospectivePropertyLock : IAsyncDisposable
{
    /// <summary>The property whose lock this is.</summary>
    int PropertyId { get; }

    /// <summary>True until the lock is released.</summary>
    bool IsHeld { get; }
}
