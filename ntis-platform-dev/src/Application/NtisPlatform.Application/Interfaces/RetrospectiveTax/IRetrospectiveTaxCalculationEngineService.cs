using NtisPlatform.Application.DTOs.RetrospectiveTax;

namespace NtisPlatform.Application.Interfaces.RetrospectiveTax;

/// <summary>
/// The "Calculate Retrospective Tax" action: given a property, reads the configured
/// Retrospective Rule Builder rules (evidence conditions, date condition, action, penalty rule),
/// finds the one whose conditions match this property's actual evidence, and calculates + saves
/// the year-wise retrospective tax breakup per that matched rule's configuration. Never invents
/// rule behavior — every value it produces traces back to a field on the matched
/// RetrospectiveRuleMaster row.
/// </summary>
public interface IRetrospectiveTaxCalculationEngineService
{
    /// <summary>
    /// Runs the calculation for <paramref name="propertyId"/> and persists a
    /// RetrospectiveTaxCalculation header + one RetrospectiveTaxCalculationDetail row per
    /// retrospective financial year. Returns null if no active, published rule's evidence
    /// conditions match this property (including no matching fallback rule).
    /// <para>
    /// Takes the property's retrospective lock itself (see <see cref="IRetrospectivePropertyLock"/>) and holds it for the
    /// whole run, so it waits for any other calculation of the same property.
    /// </para>
    /// </summary>
    Task<RetrospectiveTaxEngineResultDto?> CalculateAndSaveAsync(
        int propertyId, int? calculatedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// The same calculation for a caller that already holds the property's retrospective lock
    /// (<paramref name="heldLock"/>, as <see cref="IRetrospectiveTaxRefresher"/> does around the RV recalculation and the
    /// engine run): the engine does not take the lock again, which would wait for itself. Throws when the lock is another
    /// property's or has been released.
    /// </summary>
    Task<RetrospectiveTaxEngineResultDto?> CalculateAndSaveAsync(
        int propertyId, int? calculatedBy, IRetrospectivePropertyLock heldLock, CancellationToken cancellationToken = default);
}
