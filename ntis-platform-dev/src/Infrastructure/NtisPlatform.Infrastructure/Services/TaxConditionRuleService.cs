using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.DTOs.Rules.RuleExecution;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Rules;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Services;

/// <summary>
/// Condition-based tax configuration engine. Uses <see cref="ApplicationDbContext"/> directly
/// (keyed reads + transactional bulk upsert), mirroring <see cref="MasterBasedTaxService"/>'s
/// pattern. <see cref="EvaluateAsync"/> is a standalone evaluator — it never touches the live
/// billing pipeline (RateableValueService/RateableValueTaxCalculator).
/// </summary>
public class TaxConditionRuleService : ITaxConditionRuleService
{
    private static readonly HashSet<string> ValidResultModes = new() { "FIXED", "PERCENT", "PER_UNIT" };
    private static readonly HashSet<string> ValidResultBases = new() { "NONE", "RV", "ALV", "OTHER_TAX" };

    /// <summary>Per-mode ceilings for ResultValue. FIXED keeps the long-standing 3-digit limit;
    /// PERCENT allows up to 999.99 (a condition rule can legitimately apply a multi-hundred-percent
    /// surcharge, e.g. against a small reference tax); PER_UNIT is a RATE that gets multiplied by a
    /// count, so it needs headroom for real currency amounts. The DTO's [Range] is only an absolute
    /// backstop; these are the real rules.</summary>
    private static decimal MaxResultValueFor(string resultMode) => resultMode switch
    {
        "PERCENT" => 999.99m,
        "PER_UNIT" => 99999m,
        _ => 999m,
    };

    private readonly ApplicationDbContext _context;
    private readonly IRepository<RulesFieldEntity, int> _rulesFieldRepo;
    private readonly IPropertyContextLoaderService _propertyContextLoaderService;
    private readonly IPropertyFieldFlattenerService _fieldFlattener;
    private readonly IConditionRuleEvaluator _evaluator;
    private readonly ITaxMasterDataService _masterDataService;
    private readonly IFinanceYearProvider _financeYearProvider;

    public TaxConditionRuleService(
        ApplicationDbContext context,
        IRepository<RulesFieldEntity, int> rulesFieldRepo,
        IPropertyContextLoaderService propertyContextLoaderService,
        IPropertyFieldFlattenerService fieldFlattener,
        IConditionRuleEvaluator evaluator,
        ITaxMasterDataService masterDataService,
        IFinanceYearProvider financeYearProvider)
    {
        _context = context;
        _rulesFieldRepo = rulesFieldRepo;
        _propertyContextLoaderService = propertyContextLoaderService;
        _fieldFlattener = fieldFlattener;
        _evaluator = evaluator;
        _masterDataService = masterDataService;
        _financeYearProvider = financeYearProvider;
    }

    /// <summary>
    /// Single home for every mode/base/value rule. Also NORMALIZES the row: fields that belong to
    /// another mode are nulled out, because leaving a stale value behind would desynchronize this
    /// service's duplicate-signature guard from the client's (which reads the value the UI already
    /// cleared) — two rows rendering identically would then pass one check and fail the other.
    /// </summary>
    private static void ValidateAndNormalizeResult(TaxConditionRuleDto row)
    {
        if (!ValidResultModes.Contains(row.ResultMode))
        {
            throw new ArgumentException($"Invalid ResultMode '{row.ResultMode}'. Must be one of: {string.Join(", ", ValidResultModes)}.");
        }
        if (!ValidResultBases.Contains(row.ResultBase))
        {
            throw new ArgumentException($"Invalid ResultBase '{row.ResultBase}'. Must be one of: {string.Join(", ", ValidResultBases)}.");
        }

        // A base only means anything for PERCENT; PER_UNIT and FIXED carry no base.
        if (row.ResultMode != "PERCENT")
        {
            row.ResultBase = "NONE";
        }

        if (row.ResultBase != "OTHER_TAX")
        {
            row.ReferenceTaxId = null;
        }
        else if (row.ReferenceTaxId is null)
        {
            throw new ArgumentException("ReferenceTaxId is required when ResultBase is 'OTHER_TAX'.");
        }

        if (row.ResultMode == "PER_UNIT")
        {
            row.UnitFieldId = row.UnitFieldId?.Trim();
            if (string.IsNullOrWhiteSpace(row.UnitFieldId))
            {
                throw new ArgumentException("UnitFieldId is required when ResultMode is 'PER_UNIT' — it names the numeric field the rate is multiplied by.");
            }
        }
        else
        {
            row.UnitFieldId = null;
        }

        var maxValue = MaxResultValueFor(row.ResultMode);
        if (row.ResultValue > maxValue)
        {
            throw new ArgumentException($"ResultValue {row.ResultValue} exceeds the maximum of {maxValue} for ResultMode '{row.ResultMode}'.");
        }
    }

    /// <summary>Normalizes the wire AssessmentBasis value to a canonical string.</summary>
    private static string ValidateAndNormalizeAssessmentBasis(string? assessmentBasis)
    {
        var trimmed = assessmentBasis?.Trim();
        if (string.Equals(trimmed, DynamicTaxAssessmentBases.PropertyBased, StringComparison.OrdinalIgnoreCase)) return DynamicTaxAssessmentBases.PropertyBased;
        if (string.Equals(trimmed, DynamicTaxAssessmentBases.BuildingBased, StringComparison.OrdinalIgnoreCase)) return DynamicTaxAssessmentBases.BuildingBased;
        if (string.Equals(trimmed, "FLOOR_BASED", StringComparison.OrdinalIgnoreCase)) return "FLOOR_BASED";
        throw new ArgumentException($"AssessmentBasis '{assessmentBasis}' is invalid. Must be one of: PROPERTY_BASED, BUILDING_BASED, FLOOR_BASED.");
    }

    /// <summary>Maps the wire AssessmentBasis value to TaxConditionRuleEntity.IsBuildingBased.</summary>
    private static bool ValidateAndParseAssessmentBasis(string? assessmentBasis) =>
        ValidateAndNormalizeAssessmentBasis(assessmentBasis) == DynamicTaxAssessmentBases.BuildingBased;

    private static bool IsAreaUnitField(string? unitFieldId)
    {
        if (string.IsNullOrWhiteSpace(unitFieldId)) return false;
        var key = unitFieldId.Trim().Replace(" ", string.Empty);
        return key.Contains("BuiltupArea", StringComparison.OrdinalIgnoreCase) ||
               key.Contains("CarpetArea", StringComparison.OrdinalIgnoreCase);
    }

    private static List<TaxConditionItemDto> ParseConditions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            var trimmed = json.Trim();
            if (trimmed.StartsWith("["))
            {
                return JsonSerializer.Deserialize<List<TaxConditionItemDto>>(trimmed) ?? new();
            }
            if (trimmed.StartsWith("{"))
            {
                using var doc = JsonDocument.Parse(trimmed);
                if (doc.RootElement.TryGetProperty("conditions", out var condsEl))
                {
                    return JsonSerializer.Deserialize<List<TaxConditionItemDto>>(condsEl.GetRawText()) ?? new();
                }
            }

            // Non-blank but unsupported/invalid format => treat as invalid rule, never a catch-all match.
            return new() { new TaxConditionItemDto { FieldId = "__INVALID_JSON__", Operator = "__INVALID__" } };
        }
        catch
        {
            // Malformed/legacy JSON never 500s a read — surfaces an invalid-state signal,
            // matching ConditionRuleEvaluator so read DTOs reflect the non-matching behavior
            // and resaving without edits does not turn an invalid rule into an active catch-all.
            return new() { new TaxConditionItemDto { FieldId = "__INVALID_JSON__", Operator = "__INVALID__" } };
        }
    }

    private static string ParseConditionEvaluationScope(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return DynamicTaxConditionEvaluationScopes.FloorWise;
        try
        {
            var trimmed = json.Trim();
            if (trimmed.StartsWith("{"))
            {
                using var doc = JsonDocument.Parse(trimmed);
                if (doc.RootElement.TryGetProperty("conditionEvaluationScope", out var prop))
                {
                    var val = prop.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) return val;
                }
            }
        }
        catch { }
        return DynamicTaxConditionEvaluationScopes.FloorWise;
    }

    public async Task<PagedResult<TaxConditionRuleDto>> GetByTaxAsync(
        int taxId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.TaxConditionRules
            .AsNoTracking()
            .Where(c => c.TaxId == taxId);

        query = query.OrderBy(c => c.SortOrder).ThenBy(c => c.Id);

        var totalCount = await query.CountAsync(cancellationToken);

        var (normalizedPageNumber, effectivePageSize, skip) = PagingGuard.Normalize(pageNumber, pageSize, totalCount);
        pageNumber = normalizedPageNumber;

        // Conditions is JSON — can't translate to SQL, so materialize scalars first, then
        // deserialize in-memory.
        var entities = await query
            .Skip(skip)
            .Take(effectivePageSize)
            .ToListAsync(cancellationToken);

        var rows = entities.Select(c => new TaxConditionRuleDto
        {
            Id = c.Id,
            TaxId = c.TaxId,
            SortOrder = c.SortOrder,
            Conditions = ParseConditions(c.ConditionsJson),
            AssessmentYearRangeId = c.AssessmentYearRangeId,
            ResultMode = c.ResultMode,
            ResultBase = c.ResultBase,
            ResultValue = c.ResultValue,
            ReferenceTaxId = c.ReferenceTaxId,
            UnitFieldId = c.UnitFieldId,
            IsActive = c.IsActive,
            StopFurtherProcessing = c.StopFurtherProcessing,
            AssessmentBasis = c.AssessmentBasis ?? (c.IsBuildingBased ? DynamicTaxAssessmentBases.BuildingBased : DynamicTaxAssessmentBases.PropertyBased),
            ConditionEvaluationScope = ParseConditionEvaluationScope(c.ConditionsJson),
        }).ToList();

        return new PagedResult<TaxConditionRuleDto>(rows, totalCount, pageNumber, effectivePageSize);
    }

    public async Task<int> SaveAsync(
        SaveTaxConditionRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.TaxId <= 0)
        {
            throw new ArgumentException("A valid TaxId is required. Please save the tax settings first before adding condition rules.");
        }

        var taxExists = await _context.TaxMaster
            .AsNoTracking()
            .AnyAsync(t => t.Id == request.TaxId, cancellationToken);
        if (!taxExists)
        {
            throw new ArgumentException($"Tax with Id {request.TaxId} does not exist in TaxMaster. Please save the tax settings first.");
        }

        foreach (var row in request.Rows)
        {
            ValidateAndNormalizeResult(row);

            if (row.ResultBase == "OTHER_TAX" && row.ReferenceTaxId == request.TaxId)
            {
                throw new ArgumentException("A condition rule cannot reference its own tax as ReferenceTaxId.");
            }

            // An empty Conditions list is a valid "always matches" catch-all row — only the
            // shape of each *present* item is validated.
            foreach (var item in row.Conditions)
            {
                if (string.IsNullOrWhiteSpace(item.FieldId) || string.IsNullOrWhiteSpace(item.Operator))
                {
                    throw new ArgumentException("Each condition item must have a non-blank FieldId and Operator.");
                }

                // Normalize to a known value rather than rejecting the save — a blank/garbage
                // LogicalOperator (e.g. an older client that never sent one) defaults to AND,
                // matching the evaluator's own left-to-right fold behavior.
                item.LogicalOperator = string.Equals(item.LogicalOperator, "OR", StringComparison.OrdinalIgnoreCase)
                    ? "OR"
                    : "AND";
            }
        }

        // OTHER_TAX rows must reference an existing, active tax (any CalculationMode — not
        // restricted to VALUE_BASED). Note a non-VALUE_BASED reference's persisted
        // PropertyTaxCalculationRVResults.TaxAmount is always 0 today (see
        // RateableValueTaxCalculator.ApplyTax), so EvaluateAsync will compute 0 for those until
        // the calculation engine wires up the other modes. One batched lookup for every
        // referenced id across all rows, rather than a query per row.
        var referenceTaxIds = request.Rows
            .Where(r => r.ResultBase == "OTHER_TAX" && r.ReferenceTaxId.HasValue)
            .Select(r => r.ReferenceTaxId!.Value)
            .Distinct()
            .ToList();
        if (referenceTaxIds.Count > 0)
        {
            var validReferenceTaxIds = await _context.TaxMaster
                .AsNoTracking()
                .Where(t => referenceTaxIds.Contains(t.Id) && t.IsActive)
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);
            var invalidIds = referenceTaxIds.Except(validReferenceTaxIds).ToList();
            if (invalidIds.Count > 0)
            {
                throw new ArgumentException(
                    $"ReferenceTaxId must point to an existing, active tax. Invalid id(s): {string.Join(", ", invalidIds)}.");
            }

        }

        // PER_UNIT rows must name a field that actually exists and is active. Without this a typo
        // or a since-renamed field saves cleanly and then silently evaluates to 0 forever — the
        // same reasoning as the ReferenceTaxId check above. Matched on FieldName OR
        // DatabaseColumnName because the client sends whichever it has (see the UI's fieldId).
        var unitFieldIds = request.Rows
            .Where(r => r.ResultMode == "PER_UNIT" && !string.IsNullOrWhiteSpace(r.UnitFieldId))
            .Select(r => r.UnitFieldId!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (unitFieldIds.Count > 0)
        {
            var knownFieldKeys = await _rulesFieldRepo.GetQueryable()
                .AsNoTracking()
                .Where(f => f.IsActive)
                .Select(f => new { f.FieldName, f.DatabaseColumnName })
                .ToListAsync(cancellationToken);

            var knownSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var f in knownFieldKeys)
            {
                if (!string.IsNullOrWhiteSpace(f.FieldName)) knownSet.Add(f.FieldName.Trim());
                if (!string.IsNullOrWhiteSpace(f.DatabaseColumnName)) knownSet.Add(f.DatabaseColumnName.Trim());
            }

            var unknownFields = unitFieldIds.Where(id => !knownSet.Contains(id)).ToList();
            if (unknownFields.Count > 0)
            {
                throw new ArgumentException(
                    $"UnitFieldId must name an existing, active rule field. Unknown field(s): {string.Join(", ", unknownFields)}.");
            }
        }

        // Block exact-duplicate rows within this tax's set (same conditions + assessment year +
        // result). They are redundant regardless of StopFurtherProcessing — under the current
        // sum-all-matches evaluation, two identical rows would both match and double-count the same
        // amount — so we reject the save rather than persist copies (LogicalOperator is already
        // normalized above, so identical conditions serialize identically here).
        //
        // Reads are paged and saves are explicitly upsert-only — seed seenSignatures from existing
        // persisted rows for this tax/rule (excluding IDs being updated by this request) so a new
        // row cannot duplicate an existing persisted row on another page/request.
        var updatingIds = request.Rows.Where(r => r.Id > 0).Select(r => r.Id).ToList();

        var existingPersistedQuery = _context.TaxConditionRules
            .AsNoTracking()
            .Where(c => c.TaxId == request.TaxId);

        if (updatingIds.Count > 0)
        {
            existingPersistedQuery = existingPersistedQuery.Where(c => !updatingIds.Contains(c.Id));
        }

        var existingPersistedRows = await existingPersistedQuery.ToListAsync(cancellationToken);

        var seenSignatures = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var existing in existingPersistedRows)
        {
            var existingConditions = ParseConditions(existing.ConditionsJson);
            var signature = string.Join(
                "|",
                JsonSerializer.Serialize(existingConditions),
                existing.AssessmentYearRangeId?.ToString(CultureInfo.InvariantCulture) ?? "null",
                existing.ResultMode,
                existing.ResultBase,
                existing.ResultValue.ToString(CultureInfo.InvariantCulture),
                existing.ReferenceTaxId?.ToString(CultureInfo.InvariantCulture) ?? "null",
                existing.UnitFieldId ?? "null");
            seenSignatures.Add(signature);
        }

        foreach (var row in request.Rows)
        {
            var signature = string.Join(
                "|",
                JsonSerializer.Serialize(row.Conditions),
                row.AssessmentYearRangeId?.ToString(CultureInfo.InvariantCulture) ?? "null",
                row.ResultMode,
                row.ResultBase,
                row.ResultValue.ToString(CultureInfo.InvariantCulture),
                row.ReferenceTaxId?.ToString(CultureInfo.InvariantCulture) ?? "null",
                row.UnitFieldId ?? "null");
            if (!seenSignatures.Add(signature))
            {
                throw new ArgumentException(
                    "Duplicate condition rule: two rows have the same conditions, assessment year, and result. Remove the duplicate before saving.");
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // No natural key exists (ConditionsJson is arbitrary JSON) — match by Id only,
            // scoped to this TaxId so a stale/mismatched Id from another tax falls through to
            // an insert instead of silently overwriting that other tax's row.
            var ids = request.Rows.Where(r => r.Id > 0).Select(r => r.Id).ToList();
            var existingById = await _context.TaxConditionRules
                .Where(c => ids.Contains(c.Id) && c.TaxId == request.TaxId)
                .ToDictionaryAsync(c => c.Id, cancellationToken);

            var affected = 0;
            foreach (var row in request.Rows)
            {
                var conditionsJson = string.Equals(row.ConditionEvaluationScope, DynamicTaxConditionEvaluationScopes.AllFloorsAggregated, StringComparison.OrdinalIgnoreCase)
                    ? JsonSerializer.Serialize(new { conditions = row.Conditions ?? new List<TaxConditionItemDto>(), conditionEvaluationScope = DynamicTaxConditionEvaluationScopes.AllFloorsAggregated })
                    : JsonSerializer.Serialize(new { conditions = row.Conditions ?? new List<TaxConditionItemDto>(), conditionEvaluationScope = DynamicTaxConditionEvaluationScopes.FloorWise });

                if (row.Id > 0 && existingById.TryGetValue(row.Id, out var entity))
                {
                    var normalizedBasis = ValidateAndNormalizeAssessmentBasis(row.AssessmentBasis);
                    entity.SortOrder = row.SortOrder;
                    entity.ConditionsJson = conditionsJson;
                    entity.AssessmentYearRangeId = row.AssessmentYearRangeId;
                    entity.ResultMode = row.ResultMode;
                    entity.ResultBase = row.ResultBase;
                    entity.ResultValue = row.ResultValue;
                    entity.ReferenceTaxId = row.ReferenceTaxId;
                    entity.UnitFieldId = row.UnitFieldId;
                    entity.IsActive = row.IsActive;
                    entity.StopFurtherProcessing = row.StopFurtherProcessing;
                    entity.AssessmentBasis = normalizedBasis;
                    entity.IsBuildingBased = (normalizedBasis == DynamicTaxAssessmentBases.BuildingBased);
                    entity.UpdatedBy = request.UpdatedBy;
                    entity.UpdatedDate = DateTime.Now;
                }
                else
                {
                    var normalizedBasis = ValidateAndNormalizeAssessmentBasis(row.AssessmentBasis);
                    entity = new TaxConditionRuleEntity
                    {
                        TaxId = request.TaxId,
                        SortOrder = row.SortOrder,
                        ConditionsJson = conditionsJson,
                        AssessmentYearRangeId = row.AssessmentYearRangeId,
                        ResultMode = row.ResultMode,
                        ResultBase = row.ResultBase,
                        ResultValue = row.ResultValue,
                        ReferenceTaxId = row.ReferenceTaxId,
                        UnitFieldId = row.UnitFieldId,
                        IsActive = row.IsActive,
                        StopFurtherProcessing = row.StopFurtherProcessing,
                        AssessmentBasis = normalizedBasis,
                        IsBuildingBased = (normalizedBasis == DynamicTaxAssessmentBases.BuildingBased),
                        CreatedBy = request.UpdatedBy,
                        CreatedDate = DateTime.Now,
                    };
                    _context.TaxConditionRules.Add(entity);
                }

                affected++;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return affected;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task DeleteAsync(int id, int taxId, CancellationToken cancellationToken = default)
    {
        var entity = await _context.TaxConditionRules
            .FirstOrDefaultAsync(c => c.Id == id && c.TaxId == taxId, cancellationToken);
        if (entity == null)
        {
            throw new ArgumentException($"Condition rule row Id={id} not found for TaxId={taxId}.");
        }

        _context.TaxConditionRules.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<EvaluateTaxConditionRuleResponseDto> EvaluateAsync(
        EvaluateTaxConditionRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        var financeYear = request.FinanceYear ?? _financeYearProvider.GetCurrentFinanceYear();

        PropertyCalculationContext propertyContext;
        try
        {
            propertyContext = await _propertyContextLoaderService.LoadPropertyContextAsync(request.PropertyId, financeYear, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            throw new ArgumentException(ex.Message);
        }

        var response = new EvaluateTaxConditionRuleResponseDto
        {
            TaxId = request.TaxId,
            PropertyId = request.PropertyId,
        };

        if (propertyContext.Details.Count == 0)
        {
            throw new ArgumentException($"Property {request.PropertyId} has no active details to evaluate against.");
        }

        var detail = request.PropertyDetailsId.HasValue
            ? propertyContext.Details.FirstOrDefault(d => d.Id == request.PropertyDetailsId.Value)
            : propertyContext.Details.OrderBy(d => d.Id).FirstOrDefault();

        if (detail == null)
        {
            throw new ArgumentException($"PropertyDetailsId={request.PropertyDetailsId} does not belong to PropertyId={request.PropertyId}.");
        }

        response.PropertyDetailsId = detail.Id;

        var typeOfUses = await _masterDataService.GetActiveTypeOfUsesAsync();
        var detailTypeOfUse = typeOfUses.FirstOrDefault(t => t.Id == detail.TypeOfUseId);

        // Same "nothing to evaluate" guard as RuleApplierService.ApplyRulesAsync — graceful,
        // not an exception.
        if (detail.FloorId <= 0 || detailTypeOfUse == null || detailTypeOfUse.TypeOfUseGroupId <= 0)
        {
            response.Matched = false;
            response.Trace.Add(new TaxConditionRuleEvaluationTraceDto
            {
                Skipped = true,
                SkipReason = "Property detail has no resolved Floor/TypeOfUseGroup — nothing to evaluate.",
            });
            return response;
        }

        var activeFields = await _rulesFieldRepo.GetQueryable()
            .Where(f => f.IsActive)
            .ToListAsync(cancellationToken);

        var clonedContext = propertyContext.CloneForDetail(detail, detailTypeOfUse);
        var fieldValues = _fieldFlattener.Flatten(clonedContext, activeFields);

        var detailYearRangeRVId = propertyContext.DetailYearRangeRVIdMap.TryGetValue(detail.Id, out var yr)
            ? yr
            : propertyContext.Parameters.YearRangeRVId;

        var rows = await (
                 from c in _context.TaxConditionRules.AsNoTracking()
                 where c.TaxId == request.TaxId && c.IsActive
                 orderby c.SortOrder, c.Id
                 select c)
            .ToListAsync(cancellationToken);

        var activeDetails = propertyContext.Details.Where(d => d.IsActive != false).ToList();
        var propertyTotalCarpetAreaSqMeter = activeDetails.Sum(d => Convert.ToDecimal(d.CarpetAreaSqMeter ?? 0d));
        var propertyTotalCarpetAreaSqFeet = activeDetails.Sum(d => Convert.ToDecimal(d.CarpetAreaSqFeet ?? 0d));
        var propertyTotalBuiltupAreaSqFeet = activeDetails.Sum(d => Convert.ToDecimal(d.BuiltupAreaSqFeet ?? 0d));
        var propertyTotalBuiltupAreaSqMeter = activeDetails.Sum(d => Convert.ToDecimal(d.BuiltupAreaSqMeter ?? 0d));

        // Floor aggregation for FLOOR_BASED rules
        var floorDetails = propertyContext.Details.Where(d => d.FloorId == detail.FloorId).ToList();
        var floorTotalBuiltupAreaSqFeet = (decimal)floorDetails.Sum(d => d.BuiltupAreaSqFeet ?? 0.0);
        var floorTotalBuiltupAreaSqMeter = (decimal)floorDetails.Sum(d => d.BuiltupAreaSqMeter ?? 0.0);
        var floorTotalCarpetAreaSqFeet = (decimal)floorDetails.Sum(d => d.CarpetAreaSqFeet ?? 0.0);
        var floorTotalCarpetAreaSqMeter = (decimal)floorDetails.Sum(d => d.CarpetAreaSqMeter ?? 0.0);
        var detailBuiltupAreaSqFeet = (decimal)(detail.BuiltupAreaSqFeet ?? 0.0);

        // RV/ALV base is shared property-level context, not per-row — compute it once up front if
        // ANY candidate row might need it, rather than re-querying per matched row.
        decimal? rvSum = null;
        double? alvSum = null;
        decimal detailRv = 0m;
        double detailAlv = 0d;
        decimal floorRvVal = 0m;
        decimal floorAlvVal = 0m;
        var currentFy = _financeYearProvider.GetCurrentFinanceYear();
        var isCurrentYear = (financeYear == currentFy);

        bool NeedsRvOrAlv(TaxConditionRuleEntity r)
        {
            if (r.ResultBase is "RV" or "ALV") return true;
            if (string.IsNullOrWhiteSpace(r.ConditionsJson)) return false;
            return r.ConditionsJson.Contains("Rateable", StringComparison.OrdinalIgnoreCase) ||
                   r.ConditionsJson.Contains("AnnualRental", StringComparison.OrdinalIgnoreCase) ||
                   r.ConditionsJson.Contains("RV", StringComparison.OrdinalIgnoreCase) ||
                   r.ConditionsJson.Contains("ALV", StringComparison.OrdinalIgnoreCase) ||
                   r.ConditionsJson.Contains("ARV", StringComparison.OrdinalIgnoreCase);
        }

        if (rows.Any(NeedsRvOrAlv))
        {
            if (isCurrentYear)
            {
                var rvAlvByDetail = await _context.RVCalculationResults
                    .AsNoTracking()
                    .Where(r => r.PropertyId == request.PropertyId && r.IsActive && !r.MarkedForDeletion)
                    .GroupBy(r => r.PropertyDetailsId)
                    .Select(g => new { PropertyDetailsId = g.Key, RV = g.Max(x => x.RateableValue) ?? 0m, ALV = g.Max(x => x.AnnualRentalValue) ?? 0d })
                    .ToListAsync(cancellationToken);

                rvSum = rvAlvByDetail.Sum(x => x.RV);
                alvSum = rvAlvByDetail.Sum(x => x.ALV);

                var thisDetail = rvAlvByDetail.FirstOrDefault(x => x.PropertyDetailsId == detail.Id);
                detailRv = thisDetail?.RV ?? 0m;
                detailAlv = thisDetail?.ALV ?? 0d;

                var floorDetailIds = floorDetails.Select(d => d.Id).ToHashSet();
                var floorRvAlvRows = rvAlvByDetail.Where(x => floorDetailIds.Contains(x.PropertyDetailsId)).ToList();
                floorRvVal = floorRvAlvRows.Sum(x => x.RV);
                floorAlvVal = Convert.ToDecimal(floorRvAlvRows.Sum(x => x.ALV));
            }
            else
            {
                var yearMaster = await _context.YearMaster
                    .AsNoTracking()
                    .FirstOrDefaultAsync(y => y.Year == financeYear && y.IsActive, cancellationToken);

                if (yearMaster != null)
                {
                    var transMastRows = await _context.TransMast
                        .AsNoTracking()
                        .Where(t => t.PropertyId == request.PropertyId && t.FinanceYearId == yearMaster.Id && t.IsActive && !t.MarkedForDeletion)
                        .ToListAsync(cancellationToken);

                    var rvRow = transMastRows.FirstOrDefault(t => string.Equals(t.CalculationType, "RV", StringComparison.OrdinalIgnoreCase));
                    if (rvRow != null)
                    {
                        rvSum = rvRow.CalculationValue;
                        alvSum = (double?)(rvRow.CalculationAnnualValue ?? 0m);
                    }
                }

                // TransMast only persists one property-wide RV/ALV row per finance year — there is
                // no per-detail breakdown for past years, so BUILDING_BASED rows fall back to the
                // same property-total figure PROPERTY_BASED rows use.
                detailRv = rvSum ?? 0m;
                detailAlv = alvSum ?? 0d;
                floorRvVal = detailRv;
                floorAlvVal = Convert.ToDecimal(detailAlv);
            }

            response.RateableValueUsed = rvSum;
            response.AnnualRentalValueUsed = alvSum;
        }

        var rvVal = rvSum ?? 0m;
        var alvVal = Convert.ToDecimal(alvSum ?? 0d);
        var detailRvVal = detailRv;
        var detailAlvVal = Convert.ToDecimal(detailAlv);
        if (floorRvVal == 0m) floorRvVal = detailRvVal;
        if (floorAlvVal == 0m) floorAlvVal = detailAlvVal;

        // Default to THIS detail's own RV/ALV — mirrors the live billing pipeline
        // (DynamicTaxAmountResolver.ResolveCondition), where a row's field values are per-detail
        // unless the row is PROPERTY_BASED, in which case they're overridden with the property-wide
        // total below.
        fieldValues["RateableValue"] = detailRvVal;
        fieldValues["Rateable Value"] = detailRvVal;
        fieldValues["RV"] = detailRvVal;
        fieldValues["AnnualRentalValue"] = detailAlvVal;
        fieldValues["Annual Rental Value"] = detailAlvVal;
        fieldValues["ALV"] = detailAlvVal;
        fieldValues["ARV"] = detailAlvVal;

        var matchedResults = new List<TaxConditionRuleMatchResultDto>();

        var applicableRows = rows
            .Where(r => !r.AssessmentYearRangeId.HasValue ||
                        r.AssessmentYearRangeId.Value == detailYearRangeRVId)
            .ToList();

        foreach (var skippedRow in rows.Except(applicableRows))
        {
            response.Trace.Add(new TaxConditionRuleEvaluationTraceDto
            {
                RuleId = skippedRow.Id,
                SortOrder = skippedRow.SortOrder,
                Skipped = true,
                SkipReason = "AssessmentYearRangeId does not match this property detail's resolved year range.",
            });
        }

        rows = applicableRows;

        // TaxTotal is priced as "sum of every other regular tax computed for this detail", not a
        // single referenced TaxId's amount — resolved separately below rather than through the
        // ordinary per-tax RVCalculationTaxDetails/TransMast lookup.
        var otherTaxReferenceIds = rows.Where(r => r.ResultBase == "OTHER_TAX" && r.ReferenceTaxId.HasValue).Select(r => r.ReferenceTaxId!.Value).Distinct().ToList();

        var referencedTaxTotalId = await _context.TaxMaster
            .AsNoTracking()
            .Where(t => otherTaxReferenceIds.Contains(t.Id) &&
                        t.TaxCode == "TaxTotal")
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var excludedTaxIds = new List<int>();
        if (referencedTaxTotalId.HasValue)
        {
            var applicableSurchargeRules = await _context.TaxConditionRules
                .AsNoTracking()
                .Where(r => r.IsActive &&
                            r.ResultBase == "OTHER_TAX" &&
                            r.ReferenceTaxId.HasValue &&
                            (!r.AssessmentYearRangeId.HasValue || r.AssessmentYearRangeId.Value == detailYearRangeRVId))
                .Select(r => new { r.TaxId, ReferenceTaxId = r.ReferenceTaxId!.Value })
                .Distinct()
                .ToListAsync(cancellationToken);

            var surchargeTaxIds = new HashSet<int>(
                applicableSurchargeRules
                    .Where(r => r.ReferenceTaxId == referencedTaxTotalId.Value)
                    .Select(r => r.TaxId));

            bool addedNew = true;
            while (addedNew)
            {
                addedNew = false;
                foreach (var rule in applicableSurchargeRules)
                {
                    if (!surchargeTaxIds.Contains(rule.TaxId) && surchargeTaxIds.Contains(rule.ReferenceTaxId))
                    {
                        surchargeTaxIds.Add(rule.TaxId);
                        addedNew = true;
                    }
                }
            }

            var eduEmpTaxIds = await _context.TaxMaster
                .AsNoTracking()
                .Where(t => t.IsActive && t.TaxCategoryMaster != null &&
                            (t.TaxCategoryMaster.CategoryCode == "EDU" || t.TaxCategoryMaster.CategoryCode == "EMP"))
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);

            excludedTaxIds.AddRange(surchargeTaxIds);
            excludedTaxIds.AddRange(eduEmpTaxIds);
            excludedTaxIds = excludedTaxIds.Distinct().ToList();
        }

        foreach (var row in rows)
        {
            // PROPERTY_BASED (the default) evaluates against the property-wide RV/ALV total;
            // BUILDING_BASED evaluates against this specific detail's own RV/ALV. Same branch as
            // DynamicTaxAmountResolver.ResolveCondition, so a rule matches (or doesn't) identically
            // here and in live billing.
            var fieldValuesToUse = fieldValues;
            if (row.IsFloorBased || string.Equals(row.AssessmentBasis, "FLOOR_BASED", StringComparison.OrdinalIgnoreCase))
            {
                var floorValues = new Dictionary<string, object>(fieldValues, StringComparer.OrdinalIgnoreCase);
                floorValues["BuiltupAreaSqFeet"] = floorTotalBuiltupAreaSqFeet;
                floorValues["Builtup Area SqFeet"] = floorTotalBuiltupAreaSqFeet;
                floorValues["BuiltupAreaSqMeter"] = floorTotalBuiltupAreaSqMeter;
                floorValues["Builtup Area SqMeter"] = floorTotalBuiltupAreaSqMeter;
                floorValues["CarpetAreaSqFeet"] = floorTotalCarpetAreaSqFeet;
                floorValues["Carpet Area SqFeet"] = floorTotalCarpetAreaSqFeet;
                floorValues["CarpetAreaSqMeter"] = floorTotalCarpetAreaSqMeter;
                floorValues["Carpet Area SqMeter"] = floorTotalCarpetAreaSqMeter;
                floorValues["RateableValue"] = floorRvVal;
                floorValues["Rateable Value"] = floorRvVal;
                floorValues["RV"] = floorRvVal;
                floorValues["AnnualRentalValue"] = floorAlvVal;
                floorValues["Annual Rental Value"] = floorAlvVal;
                floorValues["ALV"] = floorAlvVal;
                floorValues["ARV"] = floorAlvVal;
                fieldValuesToUse = floorValues;
            }
            else if (!row.IsBuildingBased)
            {
                var copy = new Dictionary<string, object>(fieldValues, StringComparer.OrdinalIgnoreCase);
                if (rvVal > 0 || alvVal > 0)
                {
                    copy["RateableValue"] = rvVal;
                    copy["Rateable Value"] = rvVal;
                    copy["RV"] = rvVal;
                    copy["AnnualRentalValue"] = alvVal;
                    copy["Annual Rental Value"] = alvVal;
                    copy["ALV"] = alvVal;
                    copy["ARV"] = alvVal;
                }
                copy["CarpetAreaSqMeter"] = propertyTotalCarpetAreaSqMeter;
                copy["Carpet Area Sq Meter"] = propertyTotalCarpetAreaSqMeter;
                copy["Carpet Area SqMeter"] = propertyTotalCarpetAreaSqMeter;
                copy["CarpetAreaSqFeet"] = propertyTotalCarpetAreaSqFeet;
                copy["Carpet Area Sq Feet"] = propertyTotalCarpetAreaSqFeet;
                copy["Carpet Area SqFeet"] = propertyTotalCarpetAreaSqFeet;
                copy["BuiltupAreaSqFeet"] = propertyTotalBuiltupAreaSqFeet;
                copy["Builtup Area Sq Feet"] = propertyTotalBuiltupAreaSqFeet;
                copy["Builtup Area SqFeet"] = propertyTotalBuiltupAreaSqFeet;
                copy["BuiltupAreaSqMeter"] = propertyTotalBuiltupAreaSqMeter;
                copy["Builtup Area Sq Meter"] = propertyTotalBuiltupAreaSqMeter;
                copy["Builtup Area SqMeter"] = propertyTotalBuiltupAreaSqMeter;
                copy["TotalCarpetAreaSqMeter"] = propertyTotalCarpetAreaSqMeter;
                copy["TotalCarpetAreaSqFeet"] = propertyTotalCarpetAreaSqFeet;
                copy["TotalBuiltupAreaSqMeter"] = propertyTotalBuiltupAreaSqMeter;
                copy["TotalBuiltupAreaSqFeet"] = propertyTotalBuiltupAreaSqFeet;
                fieldValuesToUse = copy;
            }
            else if (row.IsBuildingBased)
            {
                var buildingRvVal = propertyContext.Parameters.BuildingTotalRateableValue;
                var buildingAlvVal = propertyContext.Parameters.BuildingTotalAnnualRentalValue;
                var copy = new Dictionary<string, object>(fieldValues, StringComparer.OrdinalIgnoreCase);
                copy["RateableValue"] = buildingRvVal;
                copy["Rateable Value"] = buildingRvVal;
                copy["RV"] = buildingRvVal;
                copy["AnnualRentalValue"] = buildingAlvVal;
                copy["Annual Rental Value"] = buildingAlvVal;
                copy["ALV"] = buildingAlvVal;
                copy["ARV"] = buildingAlvVal;
                copy["CarpetAreaSqMeter"] = propertyTotalCarpetAreaSqMeter;
                copy["Carpet Area Sq Meter"] = propertyTotalCarpetAreaSqMeter;
                copy["Carpet Area SqMeter"] = propertyTotalCarpetAreaSqMeter;
                copy["CarpetAreaSqFeet"] = propertyTotalCarpetAreaSqFeet;
                copy["Carpet Area Sq Feet"] = propertyTotalCarpetAreaSqFeet;
                copy["Carpet Area SqFeet"] = propertyTotalCarpetAreaSqFeet;
                copy["BuiltupAreaSqFeet"] = propertyTotalBuiltupAreaSqFeet;
                copy["Builtup Area Sq Feet"] = propertyTotalBuiltupAreaSqFeet;
                copy["Builtup Area SqFeet"] = propertyTotalBuiltupAreaSqFeet;
                copy["BuiltupAreaSqMeter"] = propertyTotalBuiltupAreaSqMeter;
                copy["Builtup Area Sq Meter"] = propertyTotalBuiltupAreaSqMeter;
                copy["Builtup Area SqMeter"] = propertyTotalBuiltupAreaSqMeter;
                copy["TotalCarpetAreaSqMeter"] = propertyTotalCarpetAreaSqMeter;
                copy["TotalCarpetAreaSqFeet"] = propertyTotalCarpetAreaSqFeet;
                copy["TotalBuiltupAreaSqMeter"] = propertyTotalBuiltupAreaSqMeter;
                copy["TotalBuiltupAreaSqFeet"] = propertyTotalBuiltupAreaSqFeet;

                if (propertyContext.Parameters.BuildingMaxFloorSequence > 0)
                {
                    copy["BuildingMaxFloorSequence"] = propertyContext.Parameters.BuildingMaxFloorSequence;
                    copy["FloorSequenceNo"] = propertyContext.Parameters.BuildingMaxFloorSequence;
                    copy["Floor"] = propertyContext.Parameters.BuildingMaxFloorSequence;
                    copy["FloorId"] = propertyContext.Parameters.BuildingMaxFloorSequence;
                }
                if (propertyContext.Parameters.BuildingMaxFloorNumber > 0)
                {
                    copy["BuildingMaxFloorNumber"] = propertyContext.Parameters.BuildingMaxFloorNumber;
                    copy["BuildingMaxFloor"] = propertyContext.Parameters.BuildingMaxFloorNumber;
                    copy["Total Floors"] = propertyContext.Parameters.BuildingMaxFloorNumber;
                    copy["TotalFloors"] = propertyContext.Parameters.BuildingMaxFloorNumber;
                    copy["FloorNumber"] = propertyContext.Parameters.BuildingMaxFloorNumber;
                }
                if (propertyContext.Parameters.BuildingMaxFloorId > 0)
                {
                    copy["BuildingMaxFloorId"] = propertyContext.Parameters.BuildingMaxFloorId;
                }

                fieldValuesToUse = copy;
            }

            var evalResult = _evaluator.Evaluate(row.ConditionsJson, fieldValuesToUse);
            response.Trace.Add(new TaxConditionRuleEvaluationTraceDto
            {
                RuleId = row.Id,
                SortOrder = row.SortOrder,
                IsMatch = evalResult.IsMatch,
                UnresolvedFields = evalResult.ConditionResults
                    .Where(c => !c.FieldResolved)
                    .Select(c => c.FieldId)
                    .ToList(),
                Conditions = evalResult.ConditionResults,
            });

            if (!evalResult.IsMatch)
            {
                continue;
            }

            var matchResult = new TaxConditionRuleMatchResultDto
            {
                RuleId = row.Id,
                SortOrder = row.SortOrder,
                ResultMode = row.ResultMode,
                ResultBase = row.ResultBase,
                StoppedFurtherProcessing = row.StopFurtherProcessing,
            };

            // PER_UNIT — a rate multiplied by a per-property count (e.g. 150 per toilet). The count
            // comes from the SAME already-built fieldValues dictionary the conditions matched
            // against, resolved through the evaluator so the key convention and numeric coercion can
            // never drift from what conditions accept.
            if (row.ResultMode == "PER_UNIT")
            {
                var isFloorBased = row.IsFloorBased || string.Equals(row.AssessmentBasis, "FLOOR_BASED", StringComparison.OrdinalIgnoreCase);
                var valuesForUnit = (isFloorBased && IsAreaUnitField(row.UnitFieldId)) ? fieldValues : fieldValuesToUse;
                var resolved = _evaluator.TryResolveNumericField(row.UnitFieldId, valuesForUnit, out var unitCount);
                matchResult.UnitCountResolved = resolved;

                if (!resolved)
                {
                    // The row DID match, so a bare 0 would read as a confident answer — the caller
                    // must explain the count isn't recorded for this property rather than presenting
                    // a confident ₹0.
                    matchResult.UnitCountUsed = null;
                    matchResult.ComputedAmount = 0m;
                }
                else
                {
                    matchResult.UnitCountUsed = unitCount;
                    // Rounded like the PERCENT branches below — this is a derived amount, and a
                    // DECIMAL multiplier (e.g. an area) would otherwise show fractions where every
                    // sibling mode shows whole rupees.
                    matchResult.ComputedAmount = Math.Round(row.ResultValue * unitCount, 0, MidpointRounding.AwayFromZero);
                }
            }
            else if (row.ResultMode == "FIXED")
            {
                var isFloorBased = row.IsFloorBased || string.Equals(row.AssessmentBasis, "FLOOR_BASED", StringComparison.OrdinalIgnoreCase);
                if (isFloorBased && floorDetails.Count > 1)
                {
                    var ratio = floorTotalBuiltupAreaSqFeet > 0m
                        ? (detailBuiltupAreaSqFeet / floorTotalBuiltupAreaSqFeet)
                        : (1m / floorDetails.Count);
                    matchResult.ComputedAmount = Math.Round(row.ResultValue * ratio, 0, MidpointRounding.AwayFromZero);
                }
                else
                {
                    matchResult.ComputedAmount = row.ResultValue;
                }
            }
            // PERCENT — OTHER_TAX reads the referenced tax's already-persisted amount (a flat,
            // non-recursive lookup — never calls RateableValueTaxCalculator/touches billing).
            // RV/ALV instead sum across this property's already-computed results, same guarantee.
            else if (row.ResultBase == "OTHER_TAX" && row.ReferenceTaxId.HasValue)
            {
                var isTaxTotalReference = referencedTaxTotalId.HasValue && row.ReferenceTaxId == referencedTaxTotalId.Value;

                List<decimal> referenceTaxAmounts;
                if (isCurrentYear && isTaxTotalReference)
                {
                    // TaxTotal isn't itself a per-detail computed tax row during a live run — it's
                    // the sum of every OTHER regular tax already computed for this detail. Same
                    // "this detail first, else property-wide" fallback as the single-tax branch
                    // below, but summing across every tax id except TaxTotal itself and all taxes
                    // whose rules reference TaxTotal (pre-surcharge base, matching live billing).
                    referenceTaxAmounts = await (
                            from td in _context.RVCalculationTaxDetails.AsNoTracking()
                            join r in _context.RVCalculationResults.AsNoTracking() on td.RVCalculationResultsId equals r.Id
                            where r.PropertyId == request.PropertyId
                               && r.PropertyDetailsId == detail.Id
                               && r.IsActive && !r.MarkedForDeletion
                               && td.IsActive && !td.MarkedForDeletion
                               && td.TaxId != referencedTaxTotalId!.Value
                               && !excludedTaxIds.Contains(td.TaxId)
                            select td.TaxAmount ?? 0m)
                        .ToListAsync(cancellationToken);

                    if (referenceTaxAmounts.Count == 0)
                    {
                        referenceTaxAmounts = await (
                                from td in _context.RVCalculationTaxDetails.AsNoTracking()
                                join r in _context.RVCalculationResults.AsNoTracking() on td.RVCalculationResultsId equals r.Id
                                where r.PropertyId == request.PropertyId
                                   && r.IsActive && !r.MarkedForDeletion
                                   && td.IsActive && !td.MarkedForDeletion
                                   && td.TaxId != referencedTaxTotalId!.Value
                                   && !excludedTaxIds.Contains(td.TaxId)
                                select td.TaxAmount ?? 0m)
                            .ToListAsync(cancellationToken);
                    }
                }
                else if (isCurrentYear)
                {
                    // Live billing (DynamicTaxAmountResolver via RateableValueService's
                    // ReferenceTaxAmountLookup) resolves this SAME detail's already-computed amount
                    // first, only summing across every detail when nothing was computed yet for this
                    // detail specifically. On a multi-detail property this matters most for
                    // BUILDING_BASED rows, where the referenced tax's per-detail amounts can differ —
                    // matching THIS query's scope keeps preview and billing computing the same number.
                    referenceTaxAmounts = await (
                            from td in _context.RVCalculationTaxDetails.AsNoTracking()
                            join r in _context.RVCalculationResults.AsNoTracking() on td.RVCalculationResultsId equals r.Id
                            where r.PropertyId == request.PropertyId
                               && r.PropertyDetailsId == detail.Id
                               && r.IsActive && !r.MarkedForDeletion
                               && td.IsActive && !td.MarkedForDeletion
                               && td.TaxId == row.ReferenceTaxId.Value
                            select td.TaxAmount ?? 0m)
                        .ToListAsync(cancellationToken);

                    if (referenceTaxAmounts.Count == 0)
                    {
                        referenceTaxAmounts = await (
                                from td in _context.RVCalculationTaxDetails.AsNoTracking()
                                join r in _context.RVCalculationResults.AsNoTracking() on td.RVCalculationResultsId equals r.Id
                                where r.PropertyId == request.PropertyId
                                   && r.IsActive && !r.MarkedForDeletion
                                   && td.IsActive && !td.MarkedForDeletion
                                   && td.TaxId == row.ReferenceTaxId.Value
                                select td.TaxAmount ?? 0m)
                            .ToListAsync(cancellationToken);
                    }
                }
                else
                {
                    var yearMasterId = await _context.YearMaster.AsNoTracking()
                        .Where(y => y.Year == financeYear && y.IsActive)
                        .Select(y => (int?)y.Id)
                        .FirstOrDefaultAsync(cancellationToken);

                    referenceTaxAmounts = yearMasterId.HasValue
                        ? await _context.TransMast.AsNoTracking()
                            .Where(t => t.PropertyId == request.PropertyId
                                     && t.FinanceYearId == yearMasterId.Value
                                     && t.TaxId == row.ReferenceTaxId.Value
                                     && t.IsActive && !t.MarkedForDeletion)
                            .Select(t => t.TaxAmount)
                            .ToListAsync(cancellationToken)
                        : new List<decimal>();
                }

                matchResult.ReferenceTaxAmountResolved = referenceTaxAmounts.Count > 0;
                var referenceTaxAmount = referenceTaxAmounts.Sum();
                matchResult.ReferenceTaxAmountUsed = referenceTaxAmount;
                matchResult.ComputedAmount = Math.Round(referenceTaxAmount * row.ResultValue / 100m, 0, MidpointRounding.AwayFromZero);
            }
            else
            {
                // Always this detail's own RV/ALV, regardless of IsBuildingBased — matches
                // DynamicTaxAmountResolver.PercentAmount/BaseValueFor, which uses the detail's RV/ALV
                // unconditionally for the amount base. Using the property-wide total here instead
                // would multiply that total once per detail when a multi-detail property's condition
                // rows all evaluate PROPERTY_BASED, over-counting the tax.
                var baseValue = row.ResultBase == "RV" ? detailRvVal
                    : row.ResultBase == "ALV" ? detailAlvVal
                    : 0m;
                matchResult.ComputedAmount = Math.Round(baseValue * row.ResultValue / 100m, 0, MidpointRounding.AwayFromZero);
            }

            matchedResults.Add(matchResult);

            if (row.StopFurtherProcessing)
            {
                break; // Reproduces first-match-wins from this row onward — rows below are never evaluated.
            }
        }

        response.Matched = matchedResults.Count > 0;
        response.ComputedAmount = matchedResults.Sum(m => m.ComputedAmount);
        response.MatchedResults = matchedResults;
        return response;
    }
}