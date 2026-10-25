namespace NtisPlatform.Core.Interfaces;

/// <summary>
/// Extension point invoked whenever a revision is reset from CALCULATED back to DRAFT because a
/// tax-relevant field was edited (REVISION LOGIC.txt section 19). Each revision calculation-result
/// table added in a later phase (RevisionRVCalculationResults, RevisionRVCalculationTaxDetails,
/// RevisionPropertyTaxCalculationCVResults, ...) registers its own handler to clear its stale rows
/// for the revision, without <see cref="IRevisionDraftGuardService"/> needing to know about any of
/// those tables. Mirrors the IDocumentBindingHandler OCP dispatch pattern already used elsewhere in
/// this codebase. No implementations exist yet - the calculation tables are built in a later phase
/// - so today's <c>IEnumerable&lt;IRevisionCalculationCleanupHandler&gt;</c> injection resolves to
/// an empty collection and is a no-op.
/// </summary>
public interface IRevisionCalculationCleanupHandler
{
    Task ClearStaleCalculationAsync(long revisionMastId, CancellationToken cancellationToken = default);
}
