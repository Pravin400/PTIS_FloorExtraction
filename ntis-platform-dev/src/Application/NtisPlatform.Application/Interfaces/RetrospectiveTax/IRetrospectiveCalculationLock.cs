namespace NtisPlatform.Application.Interfaces.RetrospectiveTax;

/// <summary>
/// A lock on one property's retrospective calculation that holds across processes (every API instance, any other
/// host that runs the engine), so two calculations for the same property can never run at the same time.
/// <para>
/// The engine reads the property's TransMast / PolicyTaxDetails rows, writes its own and deactivates the rest.
/// Two runs that overlap each work on their own snapshot and can both leave a row active (a CC row and an OC row
/// of the same year do not collide on the unique index, which includes the policy code), i.e. double demand.
/// The in-process gate inside the engine only serialises runs of one process; this lock is the correctness
/// boundary across processes, the in-process gate just keeps the waiters of one process from each holding a
/// database connection.
/// </para>
/// <para>
/// The RV recalculation that precedes an engine run writes some of the same rows (RVPersistenceService), so the lock is
/// held across both: <see cref="IRetrospectiveTaxRefresher"/> takes it (through <see cref="IRetrospectivePropertyLock"/>,
/// together with the in-process gate) before the recalculation and keeps it until the engine is done, and every caller
/// that recalculates RV goes through the refresher. The engine takes the lock itself only when it runs on its own. The API
/// and the Worker register the same lock.
/// </para>
/// </summary>
public interface IRetrospectiveCalculationLock
{
    /// <summary>
    /// Waits until no other process holds the retrospective calculation lock of <paramref name="propertyId"/>, then
    /// holds it until the returned handle is disposed. The lock of one property never blocks another property.
    /// Throws a <see cref="Exceptions.RetrospectiveCalculationInProgressException"/> when the lock cannot be taken within the
    /// configured time; nothing is held then.
    /// </summary>
    Task<IAsyncDisposable> AcquireAsync(int propertyId, CancellationToken cancellationToken = default);
}
