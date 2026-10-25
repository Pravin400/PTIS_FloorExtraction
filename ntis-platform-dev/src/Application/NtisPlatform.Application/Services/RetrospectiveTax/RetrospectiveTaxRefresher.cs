using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Core.Exceptions;

namespace NtisPlatform.Application.Services.RetrospectiveTax;

/// <summary>
/// <see cref="IRetrospectiveTaxRefresher"/>: one critical section per property around the RV recalculation and the
/// retrospective engine run that has to follow it.
/// <list type="number">
///   <item>The property's retrospective lock is taken first (<see cref="PropertyCalculationLock"/>: in-process gate, then
///   the database lock) and kept until the engine is done, so a second calculation of the same property cannot start
///   between the two steps, in this process or in another one.</item>
///   <item>The RV recalculation runs on this service's own <see cref="IRateableValueService"/>, i.e. in the caller's
///   scope with the caller's DbContext, as the callers ran it before.</item>
///   <item>The engine runs in a scope of its own (its own DbContext) and is handed the lock that is held, so it does not
///   take it a second time. A caller's DbContext may still track changes that are waiting for its next SaveChanges (a
///   capital value calculation, a job and its detail rows, the steps of a property combine), and an engine run that
///   fails half-way must not leave tracked changes behind for that save to persist.</item>
/// </list>
/// A failure of the engine is never swallowed: the recalculation is already saved and has replaced the certificate's
/// current-year TransMast row with NETTAX, so reporting success would leave a ledger that is known to be wrong. It is
/// thrown as a <see cref="RetrospectiveRefreshFailedException"/> (a message that is safe to show, the failure kept as the
/// inner exception, the full exception logged under the exception's error id).
/// Nothing of the caller runs inside the critical section, so nothing in it can ask for the lock again.
/// </summary>
public sealed class RetrospectiveTaxRefresher : IRetrospectiveTaxRefresher
{
    private readonly IRateableValueService _rateableValueService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<RetrospectiveTaxRefresher> _logger;
    private readonly IRetrospectiveCalculationLock _calculationLock;

    public RetrospectiveTaxRefresher(
        IRateableValueService rateableValueService,
        IServiceScopeFactory serviceScopeFactory,
        IRetrospectiveCalculationLock calculationLock,
        ILogger<RetrospectiveTaxRefresher> logger)
    {
        _rateableValueService = rateableValueService ?? throw new ArgumentNullException(nameof(rateableValueService));
        _serviceScopeFactory = serviceScopeFactory ?? throw new ArgumentNullException(nameof(serviceScopeFactory));
        // Not optional, as for the engine: without the database lock two hosts could recalculate one property at once.
        _calculationLock = calculationLock ?? throw new ArgumentNullException(nameof(calculationLock));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RetrospectiveTaxRefreshResult> RefreshAsync(
        int propertyId,
        int? calculatedBy,
        RetrospectiveTaxRefreshOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var forceRecalculate = options?.ForceRecalculate ?? false;

        await using var propertyLock = await PropertyCalculationLock.AcquireAsync(propertyId, _calculationLock, cancellationToken);

        // A failure of the recalculation propagates as it is: nothing of the property was replaced.
        var rateableValue = await _rateableValueService.CalculateAndSaveAsync(propertyId, forceRecalculate);

        var retrospective = await RunEngineAsync(propertyId, calculatedBy, propertyLock, cancellationToken);
        return new RetrospectiveTaxRefreshResult(rateableValue, retrospective);
    }

    private async Task<RetrospectiveTaxEngineResultDto?> RunEngineAsync(
        int propertyId,
        int? calculatedBy,
        IRetrospectivePropertyLock propertyLock,
        CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var engine = scope.ServiceProvider.GetRequiredService<IRetrospectiveTaxCalculationEngineService>();
            return await engine.CalculateAndSaveAsync(propertyId, calculatedBy, propertyLock, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var errorId = Guid.NewGuid().ToString("N")[..8];
            _logger.LogError(ex,
                "The Retrospective Rule Engine failed after the RV recalculation of PropertyId={PropertyId} (ErrorId={ErrorId}); the property's retrospective ledger needs a new calculation",
                propertyId, errorId);
            throw new RetrospectiveRefreshFailedException(propertyId, errorId, SafeReasonOf(ex), ex);
        }
    }

    /// <summary>
    /// The text of a failure that is meant for people (the platform's own business and validation exceptions); null for
    /// anything else, whose message may carry SQL, EF or framework internals that must not reach a screen or a job log.
    /// </summary>
    private static string? SafeReasonOf(Exception ex) =>
        ex is NtisPlatformException or Exceptions.ValidationException ? ex.Message : null;
}
