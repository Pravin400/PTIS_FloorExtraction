using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.TaxEngine.DynamicTax;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Services.Rules;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Services.TaxEngine.DynamicTax
{
    /// <inheritdoc cref="IDynamicTaxAmountResolver"/>
    public class DynamicTaxAmountResolver : IDynamicTaxAmountResolver
    {
        private const string ModeFixed = "FIXED";
        private const string ModePercent = "PERCENT";
        private const string ModePerUnit = "PER_UNIT";
        private const string BaseRv = "RV";
        private const string BaseAlv = "ALV";
        private const string BaseOtherTax = "OTHER_TAX";

        /// <summary>Master sources a MASTER_BASED rule's AttachedReference may name.</summary>
        private const string SourcePropertyType = "PropertyType";
        private const string SourceOwnerType = "OwnerType";
        private const string SourceTypeOfUse = "TypeOfUse";

        private readonly IConditionRuleEvaluator _evaluator;
        private readonly ILogger<DynamicTaxAmountResolver> _logger;

        public DynamicTaxAmountResolver(
            IConditionRuleEvaluator evaluator,
            ILogger<DynamicTaxAmountResolver> logger)
        {
            _evaluator = evaluator;
            _logger = logger;
        }

        public DynamicTaxAmount Resolve(DynamicTaxResolutionContext context)
        {
            var mode = context.Tax.CalculationModeMaster;

            if (mode == null)
            {
                // CalculationModeId is a required, restricted FK — a null navigation means the caller
                // forgot the Include, not that the tax is unconfigured. Say so plainly.
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) has no loaded CalculationModeMaster navigation — " +
                    "cannot dispatch dynamic tax configuration. Ensure GetActiveTaxesAsync includes it.",
                    context.Tax.Id, context.Tax.TaxCode);
                return DynamicTaxAmount.NotResolved("CalculationModeMaster navigation not loaded");
            }

            // Value config stays on the pre-existing TaxPercentageMasterRV path in
            // RateableValueTaxCalculator.ApplyTax — nothing for this resolver to do.
            if (mode.UsesValueConfig && !mode.UsesConditionConfig && !mode.UsesMasterConfig && !mode.UsesHybridConfig)
            {
                return DynamicTaxAmount.NotResolved("Mode uses value config — priced by RateableValueTaxCalculator");
            }

            if (mode.UsesHybridConfig)
            {
                return ResolveHybrid(context);
            }

            if (mode.UsesMasterConfig)
            {
                return ResolveMaster(context);
            }

            if (mode.UsesConditionConfig)
            {
                return ResolveCondition(context);
            }

            _logger.LogWarning(
                "TaxId={TaxId} ({TaxCode}) uses calculation mode '{ModeCode}', which declares no " +
                "configuration capability (all Uses*Config flags are false). Persisting zero.",
                context.Tax.Id, context.Tax.TaxCode, mode.ModeCode);
            return DynamicTaxAmount.NotResolved($"Mode '{mode.ModeCode}' declares no configuration capability");
        }

        // ── MASTER_BASED ─────────────────────────────────────────────────────────────

        /// <param name="resultBaseOverride">
        /// From <c>TaxHybridConfigEntity.ResultBase</c> when called via <see cref="ResolveHybrid"/>
        /// (null/"NONE" otherwise) — RV or ALV here supersedes the mapping row's OWN ResultBase for a
        /// PERCENT mapping, since the register presents the hybrid's basis as a single Source/Basis
        /// pair for the whole tax (e.g. "PropertyType + RV"), not a per-mapping-row choice.
        /// </param>
        private DynamicTaxAmount ResolveMaster(DynamicTaxResolutionContext context, string? resultBaseOverride = null)
        {
            var rule = context.Config.RuleFor(context.Tax.RuleDefinitionId);
            var masterSource = rule?.AttachedReference?.Trim();

            if (string.IsNullOrEmpty(masterSource))
            {
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) uses master config but its rule definition " +
                    "(RuleDefinitionId={RuleDefinitionId}) has no AttachedReference or DisplayName naming the master " +
                    "source. Persisting zero.",
                    context.Tax.Id, context.Tax.TaxCode, context.Tax.RuleDefinitionId);
                return DynamicTaxAmount.NotResolved("Rule definition has no master source reference");
            }

            var masterKeyId = ResolveMasterKeyId(masterSource, context);
            if (masterKeyId == null)
            {
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) master source '{MasterSource}' could not be resolved to " +
                    "a value on this property. Persisting zero.",
                    context.Tax.Id, context.Tax.TaxCode, masterSource);
                return DynamicTaxAmount.NotResolved($"Master source '{masterSource}' unresolved on this property");
            }

            // MasterKey is the numeric master id as a string — the convention MasterBasedTaxService
            // writes and the register UI sends (see getPropertyTypeOptions / getOwnerTypeOptions).
            var masterKey = masterKeyId.Value.ToString();

            var mappings = context.Config.MasterMappingsFor(context.Tax.Id)
                .Where(m => m.AssessmentYearRangeId == context.DetailYearRangeRVId)
                .ToList();

            var mapping = mappings.FirstOrDefault(m =>
                string.Equals(m.MasterKey?.Trim(), masterKey, StringComparison.OrdinalIgnoreCase));

            if (mapping == null)
            {
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) has no PTIS.TaxMasterMapping row for " +
                    "{MasterSource}={MasterKey} at AssessmentYearRangeId={YearRangeId}. Persisting zero.",
                    context.Tax.Id, context.Tax.TaxCode, masterSource, masterKey, context.DetailYearRangeRVId);
                return DynamicTaxAmount.NotResolved(
                    $"No master mapping for {masterSource}={masterKey} in year range {context.DetailYearRangeRVId}");
            }

            // TaxMasterMapping supports FIXED and PERCENT only (MasterBasedTaxService.ValidResultModes),
            // and bases NONE | RV | ALV — never PER_UNIT or OTHER_TAX.
            if (string.Equals(mapping.ResultMode, ModeFixed, StringComparison.OrdinalIgnoreCase))
            {
                return new DynamicTaxAmount
                {
                    Amount = mapping.ResultValue,
                    ResultMode = ModeFixed,
                    ResultBase = mapping.ResultBase,
                    SourceRuleId = mapping.Id,
                    Resolved = true
                };
            }

            var effectiveResultBase = !string.IsNullOrEmpty(resultBaseOverride) ? resultBaseOverride : mapping.ResultBase;
            var baseValue = BaseValueFor(effectiveResultBase, context);
            return new DynamicTaxAmount
            {
                Amount = RoundAmount(baseValue * mapping.ResultValue / 100m),
                Percentage = mapping.ResultValue,
                ResultMode = ModePercent,
                ResultBase = effectiveResultBase,
                SourceRuleId = mapping.Id,
                Resolved = true
            };
        }

        private static int? ResolveMasterKeyId(string masterSource, DynamicTaxResolutionContext context)
        {
            var src = masterSource.Trim().Replace(" ", string.Empty).ToLowerInvariant();

            if (src.Contains("propertytype") || src.Contains("propertycategory") || src.Contains("property"))
                return context.PropertyTypeId > 0 ? context.PropertyTypeId : null;

            if (src.Contains("ownertype") || src.Contains("owner"))
                return context.OwnerTypeId > 0 ? context.OwnerTypeId : null;

            if (src.Contains("typeofuse") || src.Contains("use"))
                return context.TypeOfUseId > 0 ? context.TypeOfUseId : null;

            return null;
        }

        // ── HYBRID ───────────────────────────────────────────────────────────────────

        /// <summary>
        /// Combines the MASTER_BASED and CONDITION_BASED strategies per this tax's
        /// <c>TaxHybridConfigEntity</c> row: <c>EvaluationPriority</c> (MASTER_THEN_CONDITION |
        /// CONDITION_THEN_MASTER) picks which strategy runs first. If that primary strategy doesn't
        /// resolve and <c>FallbackStrategy</c> is CONDITION_RULE, the OTHER strategy (whichever one
        /// didn't run first) is attempted as the fallback — named "CONDITION_RULE" because the common
        /// configuration is MASTER_THEN_CONDITION with this fallback, making the condition rule the
        /// one actually consulted second, but it applies symmetrically: CONDITION_THEN_MASTER with
        /// this same fallback falls through to the master mapping instead. FallbackStrategy
        /// DEFAULT_ZERO means no fallback is attempted at all — the primary strategy failing goes
        /// straight to <see cref="DynamicTaxAmount.NotResolved"/>, which the RV pipeline persists as
        /// zero.
        ///
        /// <para>
        /// <c>ResultBase</c> (NONE | RV | ALV) is this hybrid's own declared pricing basis — the
        /// register presents it combined with the master rule's source as a single "Source/Basis"
        /// pair (e.g. "PropertyType + RV", see <c>DynamicTaxRegisterService</c>), so it must actually
        /// drive the amount: RV or ALV here overrides whichever base the winning strategy's own row
        /// carries for a PERCENT result, rather than being read for display only.
        /// </para>
        /// </summary>
        private DynamicTaxAmount ResolveHybrid(DynamicTaxResolutionContext context)
        {
            var hybridConfig = context.Config.HybridConfigFor(context.Tax.Id);
            if (hybridConfig == null)
            {
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) uses HYBRID calculation mode but has no " +
                    "PTIS.TaxHybridConfig row. Persisting zero.",
                    context.Tax.Id, context.Tax.TaxCode);
                return DynamicTaxAmount.NotResolved("No hybrid configuration row for this tax");
            }

            var conditionFirst = string.Equals(
                hybridConfig.EvaluationPriority, "CONDITION_THEN_MASTER", StringComparison.OrdinalIgnoreCase);

            var resultBaseOverride = string.IsNullOrWhiteSpace(hybridConfig.ResultBase) ||
                                      string.Equals(hybridConfig.ResultBase, "NONE", StringComparison.OrdinalIgnoreCase)
                ? null
                : hybridConfig.ResultBase;

            var primary = conditionFirst
                ? ResolveCondition(context, resultBaseOverride)
                : ResolveMaster(context, resultBaseOverride);
            if (primary.Resolved)
            {
                return primary;
            }

            if (!string.Equals(hybridConfig.FallbackStrategy, "CONDITION_RULE", StringComparison.OrdinalIgnoreCase))
            {
                // DEFAULT_ZERO (or any unrecognized value) — no fallback attempt.
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) HYBRID primary strategy ({Priority}) did not resolve " +
                    "({Reason}) and FallbackStrategy is DEFAULT_ZERO. Persisting zero.",
                    context.Tax.Id, context.Tax.TaxCode, hybridConfig.EvaluationPriority, primary.Reason);
                return primary;
            }

            var secondary = conditionFirst
                ? ResolveMaster(context, resultBaseOverride)
                : ResolveCondition(context, resultBaseOverride);
            if (secondary.Resolved)
            {
                return secondary;
            }

            _logger.LogWarning(
                "TaxId={TaxId} ({TaxCode}) HYBRID primary strategy ({Priority}) and its CONDITION_RULE " +
                "fallback both failed to resolve. Persisting zero.",
                context.Tax.Id, context.Tax.TaxCode, hybridConfig.EvaluationPriority);
            return DynamicTaxAmount.NotResolved(
                $"HYBRID: neither the primary strategy ({primary.Reason}) nor the fallback ({secondary.Reason}) resolved");
        }

        // ── CONDITION_BASED ──────────────────────────────────────────────────────────

        /// <summary>
        /// Evaluates this tax's condition rows in SortOrder, summing every match, halting after a
        /// matching row with StopFurtherProcessing. Mirrors the preview endpoint
        /// (<c>TaxConditionRuleService.EvaluateAsync</c>) row-for-row, including per-row RV/ALV scope
        /// (IsBuildingBased selects THIS detail vs. the property-wide total — same branch in both
        /// places), with one deliberate difference: OTHER_TAX reads the in-run accumulator rather
        /// than already-persisted rows.
        /// </summary>
        /// <param name="resultBaseOverride">
        /// See <see cref="ResolveMaster"/>'s parameter of the same name — applies identically here,
        /// to a matched row's RV/ALV PERCENT base, never to an OTHER_TAX row's reference lookup.
        /// </param>
        private DynamicTaxAmount ResolveCondition(DynamicTaxResolutionContext context, string? resultBaseOverride = null)
        {
            var rows = context.Config.ConditionRulesFor(context.Tax.Id);

            if (rows.Count == 0)
            {
                return DynamicTaxAmount.NotResolved("No condition rows configured");
            }

            decimal perDetailTotal = 0m;
            decimal propertyWideTotal = 0m;
            decimal? singlePercentage = null;
            string? lastMode = null;
            string? lastBase = null;
            var matchedIds = new List<int>();
            var propertyWideByRule = new Dictionary<int, decimal>();

rows = rows
    .Where(r => !r.AssessmentYearRangeId.HasValue ||
                r.AssessmentYearRangeId.Value == context.DetailYearRangeRVId)
    .ToList();

            foreach (var row in rows)
            {
                var rowScope = ConditionRuleEvaluator.ParseConditionEvaluationScope(row.ConditionsJson);
                IReadOnlyDictionary<string, object> fieldValuesToUse = context.FieldValues;
                if (!row.IsBuildingBased)
                {
                    var propertyValues = context.FieldValues.ToDictionary(
                        pair => pair.Key,
                        pair => pair.Value,
                        StringComparer.OrdinalIgnoreCase);
                    propertyValues["RateableValue"] = context.PropertyTotalRateableValue;
                    propertyValues["Rateable Value"] = context.PropertyTotalRateableValue;
                    propertyValues["RV"] = context.PropertyTotalRateableValue;
                    propertyValues["AnnualRentalValue"] = context.PropertyTotalAnnualRentalValue;
                    propertyValues["Annual Rental Value"] = context.PropertyTotalAnnualRentalValue;
                    propertyValues["ALV"] = context.PropertyTotalAnnualRentalValue;
                    propertyValues["ARV"] = context.PropertyTotalAnnualRentalValue;
                    propertyValues["CarpetAreaSqMeter"] = context.PropertyTotalCarpetAreaSqMeter;
                    propertyValues["Carpet Area Sq Meter"] = context.PropertyTotalCarpetAreaSqMeter;
                    propertyValues["Carpet Area SqMeter"] = context.PropertyTotalCarpetAreaSqMeter;
                    propertyValues["CarpetAreaSqFeet"] = context.PropertyTotalCarpetAreaSqFeet;
                    propertyValues["Carpet Area Sq Feet"] = context.PropertyTotalCarpetAreaSqFeet;
                    propertyValues["Carpet Area SqFeet"] = context.PropertyTotalCarpetAreaSqFeet;

                    propertyValues["TotalCarpetAreaSqMeter"] = context.PropertyTotalCarpetAreaSqMeter;
                    propertyValues["TotalCarpetAreaSqFeet"] = context.PropertyTotalCarpetAreaSqFeet;
                    propertyValues["TotalBuiltupAreaSqMeter"] = context.PropertyTotalBuiltupAreaSqMeter;
                    propertyValues["TotalBuiltupAreaSqFeet"] = context.PropertyTotalBuiltupAreaSqFeet;
                    if (string.Equals(rowScope, "ALL_FLOORS_AGGREGATED", StringComparison.OrdinalIgnoreCase))
                    {
                        propertyValues["Builtup Area Sq Feet"] = context.PropertyTotalBuiltupAreaSqFeet;
                        propertyValues["Builtup Area SqFeet"] = context.PropertyTotalBuiltupAreaSqFeet;
                        propertyValues["BuiltupAreaSqFeet"] = context.PropertyTotalBuiltupAreaSqFeet;
                        propertyValues["Builtup Area Sq Meter"] = context.PropertyTotalBuiltupAreaSqMeter;
                        propertyValues["Builtup Area SqMeter"] = context.PropertyTotalBuiltupAreaSqMeter;
                        propertyValues["BuiltupAreaSqMeter"] = context.PropertyTotalBuiltupAreaSqMeter;
                    }
                    else
                    {
                        if (context.FieldValues.TryGetValue("BuiltupAreaSqFeet", out var bldUpFtProp) && bldUpFtProp != null)
                        {
                            propertyValues["Builtup Area Sq Feet"] = bldUpFtProp;
                            propertyValues["Builtup Area SqFeet"] = bldUpFtProp;
                            propertyValues["BuiltupAreaSqFeet"] = bldUpFtProp;
                        }
                        if (context.FieldValues.TryGetValue("BuiltupAreaSqMeter", out var bldUpMtrProp) && bldUpMtrProp != null)
                        {
                            propertyValues["Builtup Area Sq Meter"] = bldUpMtrProp;
                            propertyValues["Builtup Area SqMeter"] = bldUpMtrProp;
                            propertyValues["BuiltupAreaSqMeter"] = bldUpMtrProp;
                        }
                    }
                    fieldValuesToUse = propertyValues;
                }
                else
                {
                    // BUILDING_BASED: match against the whole building's aggregate RV/ALV (summed
                    // across every property sharing this building), not just this one property.
                    var buildingValues = context.FieldValues.ToDictionary(
                        pair => pair.Key,
                        pair => pair.Value,
                        StringComparer.OrdinalIgnoreCase);
                    buildingValues["RateableValue"] = context.BuildingTotalRateableValue;
                    buildingValues["Rateable Value"] = context.BuildingTotalRateableValue;
                    buildingValues["RV"] = context.BuildingTotalRateableValue;
                    buildingValues["AnnualRentalValue"] = context.BuildingTotalAnnualRentalValue;
                    buildingValues["Annual Rental Value"] = context.BuildingTotalAnnualRentalValue;
                    buildingValues["ALV"] = context.BuildingTotalAnnualRentalValue;
                    buildingValues["ARV"] = context.BuildingTotalAnnualRentalValue;
                    buildingValues["CarpetAreaSqMeter"] = context.PropertyTotalCarpetAreaSqMeter;
                    buildingValues["Carpet Area Sq Meter"] = context.PropertyTotalCarpetAreaSqMeter;
                    buildingValues["Carpet Area SqMeter"] = context.PropertyTotalCarpetAreaSqMeter;
                    buildingValues["CarpetAreaSqFeet"] = context.PropertyTotalCarpetAreaSqFeet;
                    buildingValues["Carpet Area Sq Feet"] = context.PropertyTotalCarpetAreaSqFeet;
                    buildingValues["Carpet Area SqFeet"] = context.PropertyTotalCarpetAreaSqFeet;
                    buildingValues["BuiltupAreaSqFeet"] = context.PropertyTotalBuiltupAreaSqFeet;
                    buildingValues["Builtup Area Sq Feet"] = context.PropertyTotalBuiltupAreaSqFeet;
                    buildingValues["Builtup Area SqFeet"] = context.PropertyTotalBuiltupAreaSqFeet;
                    buildingValues["BuiltupAreaSqMeter"] = context.PropertyTotalBuiltupAreaSqMeter;
                    buildingValues["Builtup Area Sq Meter"] = context.PropertyTotalBuiltupAreaSqMeter;
                    buildingValues["Builtup Area SqMeter"] = context.PropertyTotalBuiltupAreaSqMeter;
                    buildingValues["TotalCarpetAreaSqMeter"] = context.PropertyTotalCarpetAreaSqMeter;
                    buildingValues["TotalCarpetAreaSqFeet"] = context.PropertyTotalCarpetAreaSqFeet;
                    buildingValues["TotalBuiltupAreaSqMeter"] = context.PropertyTotalBuiltupAreaSqMeter;
                    buildingValues["TotalBuiltupAreaSqFeet"] = context.PropertyTotalBuiltupAreaSqFeet;

                    // Floor properties for BUILDING_BASED: evaluate against the building's maximum floor
                    // rather than the individual detail's floor, ensuring all units in the building share
                    // the building-wide height assessment.
                    if (context.FieldValues.TryGetValue("BuildingMaxFloorSequence", out var bldSeq) && Convert.ToInt32(bldSeq) > 0)
                    {
                        var bldSeqVal = Convert.ToInt32(bldSeq);
                        buildingValues["BuildingMaxFloorSequence"] = bldSeqVal;
                        buildingValues["FloorSequenceNo"] = bldSeqVal;
                        buildingValues["Floor"] = bldSeqVal;
                        buildingValues["FloorId"] = bldSeqVal;
                    }
                    if (context.FieldValues.TryGetValue("BuildingMaxFloorNumber", out var bldNum) && Convert.ToInt32(bldNum) > 0)
                    {
                        var bldNumVal = Convert.ToInt32(bldNum);
                        buildingValues["BuildingMaxFloorNumber"] = bldNumVal;
                        buildingValues["BuildingMaxFloor"] = bldNumVal;
                        buildingValues["Total Floors"] = bldNumVal;
                        buildingValues["TotalFloors"] = bldNumVal;
                        buildingValues["FloorNumber"] = bldNumVal;
                    }
                    if (context.FieldValues.TryGetValue("BuildingMaxFloorId", out var bldId) && Convert.ToInt32(bldId) > 0)
                    {
                        var bldIdVal = Convert.ToInt32(bldId);
                        buildingValues["BuildingMaxFloorId"] = bldIdVal;
                    }

                    fieldValuesToUse = buildingValues;
                }

                var evaluation = _evaluator.Evaluate(row.ConditionsJson, fieldValuesToUse);
                if (!evaluation.IsMatch)
                {
                    continue;
                }

                matchedIds.Add(row.Id);
                lastMode = row.ResultMode;
                lastBase = row.ResultBase;

                if (string.Equals(row.ResultMode, ModePerUnit, StringComparison.OrdinalIgnoreCase))
                {
                    var perUnitAmount = PerUnitAmount(row, fieldValuesToUse, context);
                    propertyWideTotal += perUnitAmount;
                    propertyWideByRule[row.Id] = perUnitAmount;
                }
                else if (string.Equals(row.ResultMode, ModeFixed, StringComparison.OrdinalIgnoreCase))
                {
                    if (string.Equals(rowScope, "ALL_FLOORS_AGGREGATED", StringComparison.OrdinalIgnoreCase))
                    {
                        propertyWideTotal += row.ResultValue;
                        propertyWideByRule[row.Id] = row.ResultValue;
                    }
                    else
                    {
                        perDetailTotal += row.ResultValue;
                    }
                    singlePercentage = null;
                }
                else
                {
                    perDetailTotal += PercentAmount(row, context, resultBaseOverride);
                    singlePercentage = row.ResultValue;
                    // Reflect the base actually used (not OTHER_TAX, which the override never touches).
                    if (!string.IsNullOrEmpty(resultBaseOverride) &&
                        !string.Equals(row.ResultBase, BaseOtherTax, StringComparison.OrdinalIgnoreCase))
                    {
                        lastBase = resultBaseOverride;
                    }
                }

                if (row.StopFurtherProcessing)
                {
                    break;
                }
            }

            if (matchedIds.Count == 0)
            {
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) has {RowCount} condition row(s) but none matched this " +
                    "property detail (year range {YearRangeId}, {FieldCount} field value(s) resolved). " +
                    "Persisting zero.",
                    context.Tax.Id, context.Tax.TaxCode, rows.Count,
                    context.DetailYearRangeRVId, context.FieldValues.Count);
                return DynamicTaxAmount.NotResolved("No condition row matched this property detail");
            }

            return new DynamicTaxAmount
            {
                Amount = perDetailTotal,
                PropertyWideAmount = propertyWideTotal,
                PropertyWideContributions = propertyWideByRule,
                // A percentage is only meaningful when exactly one row contributed — summing several
                // rows' percentages would persist a number that describes none of them.
                Percentage = matchedIds.Count == 1 ? singlePercentage : null,
                ResultMode = matchedIds.Count == 1 ? lastMode : null,
                ResultBase = matchedIds.Count == 1 ? lastBase : null,
                SourceRuleId = matchedIds.Count == 1 ? matchedIds[0] : null,
                Resolved = true
            };
        }

        private decimal PerUnitAmount(
            TaxConditionRuleEntity row,
            IReadOnlyDictionary<string, object?> fieldValues,
            DynamicTaxResolutionContext context)
        {
            if (!_evaluator.TryResolveNumericField(row.UnitFieldId, fieldValues, out var unitCount))
            {
                // The row DID match, so this is a real gap in the property's data, not a zero result.
                _logger.LogWarning(
                    "TaxId={TaxId} ({TaxCode}) condition row {RuleId} is PER_UNIT on field " +
                    "'{UnitFieldId}', which is not recorded for this property. Contributing zero.",
                    context.Tax.Id, context.Tax.TaxCode, row.Id, row.UnitFieldId);
                return 0m;
            }

            return RoundAmount(row.ResultValue * unitCount);
        }

        private decimal PercentAmount(TaxConditionRuleEntity row, DynamicTaxResolutionContext context, string? resultBaseOverride = null)
        {
            if (string.Equals(row.ResultBase, BaseOtherTax, StringComparison.OrdinalIgnoreCase))
            {
                if (!row.ReferenceTaxId.HasValue || row.ReferenceTaxId.Value <= 0)
                {
                    // Missing/non-positive ReferenceTaxId is malformed configuration (legacy data or
                    // a save-path bug), not "assume tax id 1" — guessing a tax id would charge a
                    // percentage of a completely unrelated tax. Contribute zero, matching the
                    // resolver's contract for anything that doesn't resolve.
                    _logger.LogWarning(
                        "TaxId={TaxId} ({TaxCode}) condition row {RuleId} is OTHER_TAX with a missing " +
                        "or non-positive ReferenceTaxId ({ReferenceTaxId}). Contributing zero.",
                        context.Tax.Id, context.Tax.TaxCode, row.Id, row.ReferenceTaxId);
                    return 0m;
                }

                var referenceAmount = context.ReferenceTaxAmountLookup(row.ReferenceTaxId.Value) ?? 0m;
                return RoundAmount(referenceAmount * row.ResultValue / 100m);
            }

            // A hybrid's own ResultBase (RV/ALV), when supplied, supersedes this row's own —
            // OTHER_TAX is excluded above since it has no RV/ALV base to override.
            var effectiveResultBase = !string.IsNullOrEmpty(resultBaseOverride) ? resultBaseOverride : row.ResultBase;
            return RoundAmount(BaseValueFor(effectiveResultBase, context) * row.ResultValue / 100m);
        }

        private static decimal BaseValueFor(string? resultBase, DynamicTaxResolutionContext context) =>
            string.Equals(resultBase, BaseRv, StringComparison.OrdinalIgnoreCase) ? context.RateableValue
            : string.Equals(resultBase, BaseAlv, StringComparison.OrdinalIgnoreCase) ? context.AnnualRentalValue
            : 0m;

        /// <summary>Whole rupees, away from zero — identical to RateableValueTaxCalculator.ApplyTax.</summary>
        private static decimal RoundAmount(decimal value) =>
            Math.Round(value, 0, MidpointRounding.AwayFromZero);
    }
}
