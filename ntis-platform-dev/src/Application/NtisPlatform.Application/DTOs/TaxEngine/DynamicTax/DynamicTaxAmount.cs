using System.Collections.Generic;

namespace NtisPlatform.Application.DTOs.TaxEngine.DynamicTax
{
    /// <summary>
    /// The amount a Dynamic Tax Register configuration produced for one (property detail, tax) pair,
    /// plus enough provenance for the caller to log <i>how</i> it was derived.
    ///
    /// <para>
    /// <see cref="Resolved"/> is the important flag: <c>false</c> means no configuration row applied
    /// (no condition matched, no master mapping for this key/year, a hybrid whose halves both came up
    /// empty, or a mode this resolver does not handle). The RV pipeline persists a zero-amount row
    /// and logs a warning in that case — mirroring how a missing TaxPercentageMasterRV row is already
    /// handled — so an active tax head is never silently dropped from the output.
    /// </para>
    /// </summary>
    public sealed class DynamicTaxAmount
    {
        /// <summary>
        /// The per-detail portion of the computed amount, already rounded to whole rupees. Charged
        /// on every property detail. Excludes <see cref="PropertyWideAmount"/>.
        /// </summary>
        public decimal Amount { get; init; }

        /// <summary>
        /// The portion that must be charged only ONCE for the whole property, not per detail —
        /// PER_UNIT results, whose unit counts (e.g. <c>PropertyAssessment.NoOfResidentialToilets</c>)
        /// are recorded once per property. See the scope caveat on
        /// <c>TaxConditionRuleEntity.UnitFieldId</c>: adding this per detail would bill a 3-floor
        /// property 3 x rate x count. Equal to the sum of <see cref="PropertyWideContributions"/>'s
        /// values; kept for callers that only need the total (e.g. logging).
        /// </summary>
        public decimal PropertyWideAmount { get; init; }

        /// <summary>
        /// Per-condition-row breakdown of <see cref="PropertyWideAmount"/> (<c>TaxConditionRule.Id</c>
        /// → that row's own PER_UNIT amount for this detail's resolution). The caller must dedupe by
        /// ROW, not by tax: two distinct PER_UNIT rows for the same tax can each apply to a different
        /// detail (e.g. a floor-1-only rule and a separate floor-2-only rule), and charging only the
        /// first row seen would silently drop the second row's contribution forever. The same row
        /// matching on more than one detail (the common "counted once per property" case) must still
        /// only be charged once — tracking by row id, not tax id, gives both behaviours at once.
        /// Empty when nothing contributed.
        /// </summary>
        public IReadOnlyDictionary<int, decimal> PropertyWideContributions { get; init; }
            = new Dictionary<int, decimal>();

        /// <summary>
        /// The percentage applied, for PERCENT results only — persisted to
        /// <c>RVCalculationTaxDetails.TaxPercentage</c>. Null for FIXED and PER_UNIT, where no
        /// percentage exists and storing 0 would read as "0% was configured".
        /// </summary>
        public decimal? Percentage { get; init; }

        /// <summary>FIXED | PERCENT | PER_UNIT, or null when nothing resolved.</summary>
        public string? ResultMode { get; init; }

        /// <summary>NONE | RV | ALV | OTHER_TAX, or null when nothing resolved.</summary>
        public string? ResultBase { get; init; }

        /// <summary>
        /// Id of the configuration row that produced this amount — a
        /// <c>TaxConditionRule.Id</c> or <c>TaxMasterMapping.Id</c>. Null when several condition rows
        /// were summed, or when nothing resolved. Log-only; there is no column to persist it to.
        /// </summary>
        public int? SourceRuleId { get; init; }

        /// <summary>False when no configuration applied — see the type remarks.</summary>
        public bool Resolved { get; init; }

        /// <summary>Human-readable explanation, always set when <see cref="Resolved"/> is false.</summary>
        public string? Reason { get; init; }

        public static DynamicTaxAmount NotResolved(string reason) => new()
        {
            Resolved = false,
            Reason = reason
        };
    }
}
