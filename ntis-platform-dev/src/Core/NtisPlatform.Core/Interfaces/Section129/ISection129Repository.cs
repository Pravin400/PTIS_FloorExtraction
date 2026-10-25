using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces.Property;
using NtisPlatform.Core.Models.Section129;

namespace NtisPlatform.Core.Interfaces.Section129;

/// <summary>
/// Persistence port for the Section 129A single-assessment screen. Business rules (stage
/// resolution, the old-vs-staged MAX() comparison, property-change detection, the
/// fill-forward loop) live in <c>ISection129Service</c> — this port is read/write access only.
/// Extends <see cref="IPropertyAggregateRepository"/> — the shared aggregate-root existence
/// check is inherited, not repeated.
/// </summary>
public interface ISection129Repository : IPropertyAggregateRepository
{
    /// <summary>Basic property header fields, or null when the property doesn't exist / is deleted.</summary>
    Task<Section129PropertyHeaderRow?> GetPropertyHeaderAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Old tax (per the configured base tax code) + old construction area + distinct old use
    /// types, summed at full value across every current PropertyMapDetail mapping for the
    /// property — handles split/merge migrations, not just 1:1. Share percentages are not applied.
    /// </summary>
    Task<Section129OldSnapshot> GetOldSnapshotAsync(int propertyId, string baseTaxCode, CancellationToken cancellationToken = default);

    /// <summary>The PropertyMastOld.Id(s) this property currently maps to via PropertyMapDetail (handles split/merge) — same lookup GetOldSnapshotAsync uses internally.</summary>
    Task<List<int>> GetOldPropertyIdsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>Current total built-up area and distinct current use-type-group names across the property's active PropertyDetails rows.</summary>
    Task<Section129CurrentSnapshot> GetCurrentSnapshotAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Comma-joined, deduplicated PropertyMastOld.OldPropertyNo across every current, active
    /// PropertyMapDetail row mapping this property to its old side(s) — same join as
    /// GetOldSnapshotAsync, handles split/merge (multiple old rows) by joining all of them, not just
    /// showing one. Null when the property has no old mapping.
    /// </summary>
    Task<string?> GetOldGpNoAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Every active, non-deleted property (and its partitions) directly in PropertyMast for a ward —
    /// used to build the single-assessment screen's combined "Property No" dropdown. Queries
    /// PropertyMast directly rather than any assessment/search-grid endpoint, since Section 129A
    /// properties (newly included/extended municipal area) often have no PropertyDetails/assessment
    /// row yet, and a generic property-search endpoint would silently exclude them.
    /// </summary>
    Task<List<Section129WardPropertyRow>> GetWardPropertiesAsync(int wardId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reverse lookup: resolves the current (new-side) PropertyId that maps to any of the given
    /// PropertyMastOld.OldPropertyNo values (the officer may paste one or several comma-separated
    /// old GP numbers, e.g. for a merged property). Returns
    /// <see cref="Section129OldGpNoLookupResult.NotFound"/> when none match, and
    /// <see cref="Section129OldGpNoLookupResult.Ambiguous"/> when the given old number(s) resolve
    /// to more than one distinct current property (e.g. the same OldPropertyNo recorded under more
    /// than one ward) — the caller must not silently pick one.
    /// </summary>
    Task<Section129OldGpNoLookupResult> GetPropertyIdByOldGpNoAsync(IReadOnlyList<string> oldGpNos, CancellationToken cancellationToken = default);

    /// <summary>Resolves PropertyDetails.AssessmentYear (e.g. "2020-21" or "2020") to a YearMaster.Id, or null when it can't be parsed/matched.</summary>
    Task<int?> ResolveStartFinanceYearIdAsync(int propertyId, CancellationToken cancellationToken = default);

    Task<PropertySection129ApplicationEntity?> GetApplicationAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>Returns a tracked application row for the property, creating (but not saving) one — stamped with <paramref name="now"/> — if none exists yet.</summary>
    Task<PropertySection129ApplicationEntity> GetOrCreateApplicationAsync(int propertyId, DateTime now, CancellationToken cancellationToken = default);

    /// <summary>Existing schedule rows for the property, ordered by FinanceYearId, projected (PolicyCodeMaster/YearMaster lookups already flattened).</summary>
    Task<List<Section129ScheduleRowProjection>> GetScheduleRowsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>The full SECTION_129_* PolicyCodeMaster chain (PolicyType = STAGE_BASED), keyed by Id.</summary>
    Task<Dictionary<int, PolicyCodeMasterEntity>> GetSection129PolicyChainAsync(CancellationToken cancellationToken = default);

    /// <summary>Resolves a TaxMaster.Id by matching TaxMaster.TaxName (e.g. "General Tax", "Tax Total") — not TaxCode.</summary>
    Task<int?> GetTaxIdByCodeAsync(string taxCode, CancellationToken cancellationToken = default);

    /// <summary>Resolves a TaxMaster id by its TaxCategoryMaster.CategoryCode (e.g. "EDU"/"EMP"), matching RateableValueService's classification.</summary>
    Task<int?> GetTaxIdByCategoryCodeAsync(string categoryCode, CancellationToken cancellationToken = default);

    Task<int?> GetYearMasterIdAsync(int financeYearValue, CancellationToken cancellationToken = default);

    Task<int?> GetFinanceYearValueAsync(int yearMasterId, CancellationToken cancellationToken = default);

    /// <summary>
    /// The ULB's actual "current finance year" — CORE.YearMaster.IsActive = 1 — the same
    /// admin-controlled flag ApartmentTaxDetailsRepository/NoDueCertificateDataProvider read for
    /// "current year", and deliberately NOT IFinanceYearProvider's DateTime.Today math (which only
    /// governs when the RV engine's bulk "Add Tax" job is willing to write a new year — the two can
    /// disagree, e.g. before the ULB has opened the new year in YearMaster). Null if no row is
    /// flagged active.
    /// </summary>
    Task<(int YearMasterId, int Year)?> GetActiveFinanceYearAsync(CancellationToken cancellationToken = default);

    /// <summary>Reads TaxAmount, CalculationValue (RV), and CalculationAnnualValue off the same TransMast row.</summary>
    Task<(decimal TaxAmount, decimal CalculationValue, decimal? CalculationAnnualValue)?> GetCurrentBasisTaxRowAsync(int propertyId, int yearMasterId, int taxId, CancellationToken cancellationToken = default);

    /// <summary>Resolves PTIS.AssessmentYearRange (FromYear/ToYear, active) covering the given assessment year, or null when none covers it.</summary>
    Task<int?> GetYearRangeIdForAssessmentYearAsync(int assessmentYear, CancellationToken cancellationToken = default);

    /// <summary>Reads PTIS.TaxPercentageMasterRV.TaxPercentage for (TaxId, TypeOfUseId, YearRangeRVId) — the "General Tax Rate %" shown on the screen.</summary>
    Task<decimal?> GetTaxPercentageAsync(int taxId, int typeOfUseId, int yearRangeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// TaxMaster ids that compose PTIS.TaxTotal's aggregate (IsActive, OldTaxStatus = 1),
    /// excluding TaxTotal's own id — used to distribute a staged TaxTotal amount back across
    /// its individual component tax heads (§ TaxTotal pro-rata distribution).
    /// </summary>
    Task<List<int>> GetTaxTotalComponentTaxIdsAsync(int taxTotalId, CancellationToken cancellationToken = default);

    /// <summary>Batched read of TransMast TaxAmount for multiple tax ids at once (one query instead of N).</summary>
    Task<Dictionary<int, decimal>> GetCurrentBasisTaxAmountsAsync(int propertyId, int yearMasterId, IReadOnlyCollection<int> taxIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Inserts or updates the tracked schedule row for (PropertyId, FinanceYearId) with the given
    /// field values and <paramref name="now"/> as its timestamp — stages the change via the
    /// change tracker; caller saves via IUnitOfWork.
    /// </summary>
    Task UpsertScheduleRowAsync(Section129ScheduleRowWrite row, DateTime now, CancellationToken cancellationToken = default);

    /// <summary>
    /// Immediately (via ExecuteUpdateAsync — not staged, not gated by the caller's later
    /// SaveChangesAsync) flips IsCurrent to false on every schedule row for the property except
    /// the one at exceptYearMasterId.
    /// </summary>
    Task ClearIsCurrentFlagsAsync(int propertyId, int exceptYearMasterId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Upserts the SECTION_129_* TransMast row for (PropertyId, FinanceYearId, TaxId) with
    /// <paramref name="now"/> as its timestamp, and immediately (via ExecuteUpdateAsync — not
    /// staged) deactivates whatever was previously active at that same key (normally OLD_ARREARS).
    /// The upsert itself stages via the change tracker; caller saves via IUnitOfWork.
    /// </summary>
    Task UpsertTransMastAsync(
        int propertyId,
        int yearMasterId,
        int taxId,
        int policyCodeId,
        decimal taxAmount,
        decimal calculationValue,
        decimal? calculationAnnualValue,
        DateTime now,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Supersedes the "current" PTIS.PolicyTaxDetails row for (PropertyId, TaxId) with the
    /// Section 129A stage's own figure, mirroring UpsertTransMastAsync's pattern for TransMast:
    /// (1) fully retires (IsActive=false, MarkedForDeletion=true) whatever PREVIOUS row was active
    /// under a different id within <paramref name="section129PolicyCodeIds"/> — the Section129
    /// stage chain's own ids, so this never touches the plain NETTAX row or any other writer's
    /// rows; (2) flips IsCurrent=false (WITHOUT touching IsActive) on every other row still active
    /// at this (PropertyId, TaxId) — this is what demotes RVPersistenceService's own NETTAX row
    /// from "current" once Section 129A applies, while leaving it alive as the raw/un-staged
    /// basis; (3) upserts the row for <paramref name="policyCodeId"/> with the staged amount,
    /// marked IsCurrent=true. Immediate (ExecuteUpdateAsync for 1-2, tracked upsert for 3 — caller
    /// saves via IUnitOfWork).
    /// </summary>
    Task SupersedePolicyTaxDetailAsync(
        int propertyId,
        int taxId,
        int policyCodeId,
        decimal taxAmount,
        decimal? calculationValue,
        IReadOnlyCollection<int> section129PolicyCodeIds,
        DateTime now,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reads the ward-wide Section 129A Inclusion Date (WardSection129Master.Section129AInclusionDate),
    /// or null if the ward has no row yet / no date set (callers fall back to PropertyDetails.AssessmentYear).
    /// </summary>
    Task<DateTime?> GetWardSection129InclusionDateAsync(int wardId, CancellationToken cancellationToken = default);

    /// <summary>
    /// The property's own Occupancy Certificate date: the EARLIEST IssueDate among its active OC
    /// certificates (CertificateTypeCode = "OC") across all floors and property-wise rows, falling
    /// back to the wing's then the society's OC when the property has none of its own. Null when no
    /// OC date exists anywhere.
    /// </summary>
    Task<DateTime?> GetOcDateAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Wipes the property's Section 129A schedule so it can be rebuilt from a different start
    /// year: immediately (ExecuteUpdateAsync) retires every PropertySection129Schedule row, and every
    /// TransMast / PolicyTaxDetails row stamped with one of <paramref name="section129PolicyCodeIds"/>
    /// (the SECTION_129_* chain only — OLD_ARREARS and any other writer's rows are untouched).
    /// </summary>
    Task ResetSection129ScheduleAsync(int propertyId, IReadOnlyCollection<int> section129PolicyCodeIds, DateTime now, CancellationToken cancellationToken = default);

    /// <summary>Resolves a PolicyCodeMaster.Id by its PolicyCode (e.g. PolicyCodes.OldArrears) — null if unseeded.</summary>
    Task<int?> GetPolicyCodeIdAsync(string policyCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Batched read of ptis.TransMastOld.TaxAmount for the given old-property id(s) + finance year
    /// + tax ids, summed across old-property ids (handles split/merge) — keyed by TaxId.
    /// </summary>
    Task<Dictionary<int, decimal>> GetTransMastOldAmountsAsync(IReadOnlyCollection<int> oldPropertyIds, int financeYearId, IReadOnlyCollection<int> taxIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sweeps every active OLD_ARREARS TransMast row for the property at/after
    /// <paramref name="startYearValue"/> (restricted to TaxMaster.OldTaxStatus=1 heads) into a
    /// single consolidated OLD_ARREARS row per TaxId at (startYearValue - 1) — summing into
    /// whatever's already there if a row already exists at that key, else inserting fresh — then
    /// deactivates every swept-up original row. Idempotent: a second call after the sweep already
    /// ran finds nothing left at/after startYearValue to sweep. Stages changes via the change
    /// tracker/ExecuteUpdateAsync mix (same pattern as UpsertTransMastAsync); caller saves via
    /// IUnitOfWork for the tracked parts.
    /// </summary>
    Task SweepPreStartYearOldArrearsAsync(int propertyId, int startYearValue, DateTime now, CancellationToken cancellationToken = default);
}
