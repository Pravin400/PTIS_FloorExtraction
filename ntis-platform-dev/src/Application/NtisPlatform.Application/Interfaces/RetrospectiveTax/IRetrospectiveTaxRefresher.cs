using NtisPlatform.Application.DTOs.RetrospectiveTax;

namespace NtisPlatform.Application.Interfaces.RetrospectiveTax;

/// <summary>
/// Recalculates a property's rateable value (RV) and puts its retrospective (certificate) demand back, as one critical
/// section per property. A recalculation that persists replaces every current-year TransMast row of the property with
/// NETTAX rows, including the CC / OC / electricity-bill row a certificate put there, while the certificate's
/// PolicyTaxDetails row stays; only the retrospective engine puts the ledger right again. Both steps write the same
/// rows, so a second calculation of the property that started between them would work on rows the first one is about to
/// change. The refresher therefore takes the property's retrospective lock (<see cref="IRetrospectivePropertyLock"/>:
/// the in-process gate and the database lock that holds across processes) before the recalculation
/// and keeps it until the engine is done: overlapping refreshes of one property, and engine runs of any other caller,
/// run one after the other; different properties never wait for each other.
/// <para>
/// Every caller that recalculates RV goes through this, so the recalculation is never left without its engine run.
/// </para>
/// </summary>
public interface IRetrospectiveTaxRefresher
{
    /// <summary>
    /// Takes the lock of <paramref name="propertyId"/>, recalculates its RV in the caller's scope (the caller's
    /// DbContext, as the callers did before), then runs the retrospective engine in a scope of its own (its own
    /// DbContext) under the lock that is already held. The engine gets a scope of its own because a caller's DbContext
    /// may still track changes that wait for its next SaveChanges (a capital value calculation, a job and its detail rows,
    /// the steps of a combine), and an engine run that fails half-way must not leave tracked changes behind for that save.
    /// <para>
    /// A failure of the RV recalculation propagates as it is. A failure of the engine is never swallowed: the
    /// recalculation is already saved and has replaced the certificate's current-year TransMast row with NETTAX, so the
    /// ledger is known to need repair and success would be a lie. It is thrown as a
    /// <see cref="Exceptions.RetrospectiveRefreshFailedException"/> (a message that is safe to show, the failure kept as the
    /// inner exception and logged under the exception's error id). Cancellation always propagates. When the lock cannot be
    /// taken in time a <see cref="Exceptions.RetrospectiveCalculationInProgressException"/> is thrown and nothing was started.
    /// </para>
    /// </summary>
    Task<RetrospectiveTaxRefreshResult> RefreshAsync(
        int propertyId,
        int? calculatedBy,
        RetrospectiveTaxRefreshOptions? options = null,
        CancellationToken cancellationToken = default);
}
