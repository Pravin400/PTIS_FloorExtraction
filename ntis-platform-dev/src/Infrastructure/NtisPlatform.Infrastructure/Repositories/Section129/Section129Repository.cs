using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces.Section129;
using NtisPlatform.Core.Models.Section129;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories.Property;

namespace NtisPlatform.Infrastructure.Repositories.Section129;

/// <summary>
/// Data-access implementation for the Section 129A single-assessment screen. Extends
/// <see cref="PropertyRepositoryBase"/> so the shared active-property existence check
/// (<see cref="PropertyRepositoryBase.GetActivePropertyAsync"/>) is reused rather than
/// re-implemented, matching every other per-property repository in this solution.
/// </summary>
public class Section129Repository : PropertyRepositoryBase, ISection129Repository
{
    public Section129Repository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Section129PropertyHeaderRow?> GetPropertyHeaderAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var property = await GetActivePropertyAsync(propertyId, cancellationToken);
        if (property == null)
            return null;

        var header = await _context.PropertyMast
            .AsNoTracking()
            .Where(p => p.Id == propertyId)
            .Select(p => new
            {
                p.UPICId,
                p.OwnerName,
                p.Address,
                MoujaName = p.Mouja != null ? p.Mouja.MoujaName : null,
                WardNo = p.Ward != null ? p.Ward.WardNo : string.Empty,
                ZoneDescription = p.Ward != null && p.Ward.Zone != null ? p.Ward.Zone.Description : null
            })
            .FirstAsync(cancellationToken);

        var firstDetail = await _context.PropertyDetails
            .AsNoTracking()
            .Where(d => d.PropertyId == propertyId && d.IsActive && !d.MarkedForDeletion)
            .OrderBy(d => d.Id)
            .Select(d => new
            {
                d.Id,
                d.AssessmentYear,
                d.TypeOfUseId,
                UseTypeGroupName = d.TypeOfUse != null && d.TypeOfUse.TypeOfUseGroup != null
                    ? d.TypeOfUse.TypeOfUseGroup.GroupName
                    : null
            })
            .FirstOrDefaultAsync(cancellationToken);

        return new Section129PropertyHeaderRow(
            header.UPICId ?? string.Empty,
            header.OwnerName ?? string.Empty,
            header.Address ?? string.Empty,
            header.MoujaName,
            header.WardNo,
            header.ZoneDescription,
            firstDetail?.UseTypeGroupName,
            firstDetail?.AssessmentYear,
            firstDetail?.Id,
            firstDetail?.TypeOfUseId,
            property.WardId);
    }

    public Task<List<int>> GetOldPropertyIdsAsync(int propertyId, CancellationToken cancellationToken = default)
        => _context.PropertyMapDetails
            .AsNoTracking()
            .Where(m => m.PropertyIdNew == propertyId && m.IsCurrent && m.Status == "ACTIVE" && m.PropertyIdOld != null)
            .Select(m => m.PropertyIdOld!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

    public async Task<Section129OldSnapshot> GetOldSnapshotAsync(int propertyId, string baseTaxCode, CancellationToken cancellationToken = default)
    {
        var oldPropertyIds = await GetOldPropertyIdsAsync(propertyId, cancellationToken);

        if (oldPropertyIds.Count == 0)
            return new Section129OldSnapshot(0m, 0m, new HashSet<string>());

        var oldMasters = await _context.PropertyMastOld
            .AsNoTracking()
            .Where(o => oldPropertyIds.Contains(o.Id))
            .ToListAsync(cancellationToken);

        decimal oldTaxTotal = 0m;
        decimal oldAreaTotal = 0m;
        var oldUseTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        bool useTaxTotal = string.Equals(baseTaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase);

        // Always take the old property's full (100%) figures — TaxSharePercent/AreaSharePercent
        // (the split/merge proration columns on PropertyMapDetail) are no longer applied here, per
        // explicit instruction: sum the full OldGeneralTax/OldTotalTax/OldConstructionArea across
        // every currently-mapped old property, not a percentage-weighted share of them.
        foreach (var oldMaster in oldMasters)
        {
            var oldTax = useTaxTotal ? oldMaster.OldTotalTax : oldMaster.OldGeneralTax;
            oldTaxTotal += Convert.ToDecimal(oldTax ?? 0d);
            oldAreaTotal += Convert.ToDecimal(oldMaster.OldConstructionArea ?? 0d);

            if (!string.IsNullOrWhiteSpace(oldMaster.OldUseType))
                oldUseTypes.Add(oldMaster.OldUseType.Trim());
        }

        return new Section129OldSnapshot(oldTaxTotal, oldAreaTotal, oldUseTypes);
    }

    public async Task<string?> GetOldGpNoAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var oldPropertyIds = await _context.PropertyMapDetails
            .AsNoTracking()
            .Where(m => m.PropertyIdNew == propertyId && m.IsCurrent && m.Status == "ACTIVE" && m.PropertyIdOld != null)
            .Select(m => m.PropertyIdOld!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (oldPropertyIds.Count == 0)
            return null;

        // OldPropertyNo (not OldEgovNo) — this is what the officer actually searches by in the Old
        // GP Number field, so the read-only display must echo the same column. Distinct() because a
        // split property maps to several PropertyMastOld rows that commonly share the same
        // OldPropertyNo (one row per partition/floor) — without it, the display would repeat the
        // same number several times instead of once.
        var oldGpNos = await _context.PropertyMastOld
            .AsNoTracking()
            .Where(o => oldPropertyIds.Contains(o.Id) && !string.IsNullOrEmpty(o.OldPropertyNo))
            .OrderBy(o => o.Id)
            .Select(o => o.OldPropertyNo!)
            .Distinct()
            .ToListAsync(cancellationToken);

        return oldGpNos.Count == 0 ? null : string.Join(", ", oldGpNos);
    }

    public Task<List<Section129WardPropertyRow>> GetWardPropertiesAsync(int wardId, CancellationToken cancellationToken = default)
        // Queries PropertyMast directly — NOT a search-by-category/assessment-grid endpoint — so a
        // property that hasn't been assessed yet (no PropertyDetails row) still appears. Ordered by
        // PropertyNo then PartitionNo so the dropdown lists properties/partitions in a sane order.
        => _context.PropertyMast
            .AsNoTracking()
            .Where(p => p.WardId == wardId && p.IsActive && !p.MarkedForDeletion && p.PropertyNo != null)
            .OrderBy(p => p.PropertyNo)
            .ThenBy(p => p.PartitionNo)
            .Select(p => new Section129WardPropertyRow(p.Id, p.PropertyNo!, p.PartitionNo, p.UPICId))
            .ToListAsync(cancellationToken);

    public async Task<Section129OldGpNoLookupResult> GetPropertyIdByOldGpNoAsync(IReadOnlyList<string> oldGpNos, CancellationToken cancellationToken = default)
    {
        if (oldGpNos.Count == 0)
            return Section129OldGpNoLookupResult.NotFound;

        // Matches on PropertyMastOld.OldPropertyNo (not OldEgovNo) — an officer searching "Old GP
        // Number" means the old ward-wise property number, which is not guaranteed unique across
        // wards, so every matching candidate's WardNo and resolved PropertyIdNew are both carried
        // through here to detect ambiguity below, rather than silently picking the first match.
        //
        // Existence is checked SEPARATELY from the mapped-JOIN query below, so "this old property
        // number was never recorded at all" (NotFound) can be told apart from "it exists but has no
        // current, active mapping to any property" (NotMapped) — the two have different causes
        // (a typo/unknown number vs. a real migration gap) and the officer needs different guidance
        // for each.
        var oldPropertyExists = await _context.PropertyMastOld
            .AsNoTracking()
            .AnyAsync(o => o.OldPropertyNo != null && oldGpNos.Contains(o.OldPropertyNo) &&
                           o.IsActive && !o.MarkedForDeletion, cancellationToken);

        if (!oldPropertyExists)
            return Section129OldGpNoLookupResult.NotFound;

        // Single JOIN query so only old-GP candidates that have an active mapping participate.
        // Two separate queries would commit to the first matching old property before checking
        // whether it is mapped — an unmapped first candidate would block a valid later one,
        // breaking the documented "match ANY" behaviour for merged properties.
        var candidates = await (
            from oldProperty in _context.PropertyMastOld.AsNoTracking()
            join map in _context.PropertyMapDetails.AsNoTracking()
                on (int?)oldProperty.Id equals map.PropertyIdOld
            where oldProperty.OldPropertyNo != null &&
                  oldGpNos.Contains(oldProperty.OldPropertyNo) &&
                  oldProperty.IsActive && !oldProperty.MarkedForDeletion &&
                  map.IsCurrent && map.Status == "ACTIVE" && map.PropertyIdNew != null
            select new { oldProperty.OldWardNo, PropertyIdNew = map.PropertyIdNew!.Value })
            .ToListAsync(cancellationToken);

        if (candidates.Count == 0)
            return Section129OldGpNoLookupResult.NotMapped;

        var distinctPropertyIds = candidates.Select(c => c.PropertyIdNew).Distinct().ToList();
        var distinctWardNos = candidates.Select(c => c.OldWardNo).Distinct().ToList();

        if (distinctPropertyIds.Count > 1 || distinctWardNos.Count > 1)
            return Section129OldGpNoLookupResult.Ambiguous;

        return Section129OldGpNoLookupResult.Found(distinctPropertyIds[0]);
    }

    public async Task<Section129CurrentSnapshot> GetCurrentSnapshotAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var details = await _context.PropertyDetails
            .AsNoTracking()
            .Where(d => d.PropertyId == propertyId && d.IsActive && !d.MarkedForDeletion)
            .Select(d => new
            {
                d.BuiltupAreaSqMeter,
                UseTypeGroupName = d.TypeOfUse != null && d.TypeOfUse.TypeOfUseGroup != null
                    ? d.TypeOfUse.TypeOfUseGroup.GroupName
                    : null
            })
            .ToListAsync(cancellationToken);

        var currentArea = details.Sum(d => Convert.ToDecimal(d.BuiltupAreaSqMeter ?? 0d));
        var currentUseTypes = details
            .Where(d => !string.IsNullOrWhiteSpace(d.UseTypeGroupName))
            .Select(d => d.UseTypeGroupName!.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return new Section129CurrentSnapshot(currentArea, currentUseTypes);
    }

    public async Task<int?> ResolveStartFinanceYearIdAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var assessmentYear = await _context.PropertyDetails
            .AsNoTracking()
            .Where(d => d.PropertyId == propertyId && d.IsActive && !d.MarkedForDeletion)
            .OrderBy(d => d.Id)
            .Select(d => d.AssessmentYear)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(assessmentYear))
            return null;

        var match = Regex.Match(assessmentYear, @"\d{4}");
        if (!match.Success || !int.TryParse(match.Value, out var year))
            return null;

        return await GetYearMasterIdAsync(year, cancellationToken);
    }

    public Task<PropertySection129ApplicationEntity?> GetApplicationAsync(int propertyId, CancellationToken cancellationToken = default)
        => _context.PropertySection129Application
            .Where(a => a.PropertyId == propertyId && a.IsActive && !a.MarkedForDeletion)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<PropertySection129ApplicationEntity> GetOrCreateApplicationAsync(int propertyId, DateTime now, CancellationToken cancellationToken = default)
    {
        var existing = await GetApplicationAsync(propertyId, cancellationToken);
        if (existing != null)
            return existing;

        var created = new PropertySection129ApplicationEntity
        {
            PropertyId = propertyId,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = now,
            UpdatedDate = now
        };

        await _context.PropertySection129Application.AddAsync(created, cancellationToken);
        return created;
    }

    public Task<List<Section129ScheduleRowProjection>> GetScheduleRowsAsync(int propertyId, CancellationToken cancellationToken = default)
        => _context.PropertySection129Schedule
            .AsNoTracking()
            .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
            .OrderBy(s => s.FinanceYear!.Year)
            .Select(s => new Section129ScheduleRowProjection
            {
                FinanceYearId = s.FinanceYearId,
                FinanceYearValue = s.FinanceYear!.Year,
                TaxId = s.TaxId,
                PolicyCodeId = s.PolicyCodeId,
                PolicyCode = s.PolicyCodeMaster!.PolicyCode,
                PolicyName = s.PolicyCodeMaster!.PolicyName,
                IsFinalStage = s.PolicyCodeMaster!.IsFinalStage,
                TaxPercentage = s.TaxPercentage,
                OldTaxAmount = s.OldTaxAmount,
                FullBasisTaxAmount = s.FullBasisTaxAmount,
                StageTaxAmount = s.StageTaxAmount,
                TaxAmount = s.TaxAmount,
                IsCurrent = s.IsCurrent,
                IsPropertyChangeDisqualified = s.IsPropertyChangeDisqualified
            })
            .ToListAsync(cancellationToken);

    public async Task<Dictionary<int, PolicyCodeMasterEntity>> GetSection129PolicyChainAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _context.PolicyCodeMaster
            .AsNoTracking()
            .Where(p => p.IsActive && p.PolicyType == "STAGE_BASED" && p.PolicyCode.StartsWith("SECTION_129"))
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(r => r.Id);
    }

    // Matches TaxMaster.TaxName (e.g. "General Tax", "TaxTotal" — this ULB's seed data has no space
    // before "Total", but another ULB's TaxMaster or PolicyConfiguration.PolicyValue could easily be
    // entered/seeded as "Tax Total" instead) rather than TaxCode — Section 129A's base-tax policy
    // config (SECTION129_STAGE_BASE_TAXCODE) is stored/compared as a TaxName, per explicit
    // instruction, so every caller of this method now passes a TaxName, not a TaxCode. Spaces are
    // stripped from both sides before comparing (translates to SQL REPLACE(), still matches naturally
    // on an index-free lookup since TaxMaster is a tiny master table) so neither side's spacing can
    // silently break the match the way "Tax Total" vs "TaxTotal" previously did.
    public Task<int?> GetTaxIdByCodeAsync(string taxCode, CancellationToken cancellationToken = default)
    {
        var normalizedTaxCode = taxCode.Replace(" ", "", StringComparison.Ordinal);
        return _context.TaxMaster
            .AsNoTracking()
            .Where(t => t.IsActive && t.TaxName != null && t.TaxName.Replace(" ", "") == normalizedTaxCode)
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<int?> GetTaxIdByCategoryCodeAsync(string categoryCode, CancellationToken cancellationToken = default)
        => _context.TaxMaster
            .AsNoTracking()
            .Where(t => t.IsActive && t.TaxCategoryMaster != null && t.TaxCategoryMaster.CategoryCode == categoryCode)
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<int?> GetYearMasterIdAsync(int financeYearValue, CancellationToken cancellationToken = default)
        => _context.YearMaster
            .AsNoTracking()
            .Where(y => y.Year == financeYearValue)
            .Select(y => (int?)y.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<int?> GetFinanceYearValueAsync(int yearMasterId, CancellationToken cancellationToken = default)
        => _context.YearMaster
            .AsNoTracking()
            .Where(y => y.Id == yearMasterId)
            .Select(y => (int?)y.Year)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<(int YearMasterId, int Year)?> GetActiveFinanceYearAsync(CancellationToken cancellationToken = default)
    {
        var active = await _context.YearMaster
            .AsNoTracking()
            .Where(y => y.IsActive)
            .Select(y => new { y.Id, y.Year })
            .FirstOrDefaultAsync(cancellationToken);

        return active == null ? null : (active.Id, active.Year);
    }

    public async Task<(decimal TaxAmount, decimal CalculationValue, decimal? CalculationAnnualValue)?> GetCurrentBasisTaxRowAsync(int propertyId, int yearMasterId, int taxId, CancellationToken cancellationToken = default)
    {
        var row = await _context.TransMast
            .AsNoTracking()
            .Where(t => t.PropertyId == propertyId &&
                        t.FinanceYearId == yearMasterId &&
                        t.TaxId == taxId &&
                        t.CalculationType == "RV" &&
                        t.IsActive && !t.MarkedForDeletion)
            .OrderByDescending(t => t.Id)
            .Select(t => new { t.TaxAmount, t.CalculationValue, t.CalculationAnnualValue })
            .FirstOrDefaultAsync(cancellationToken);

        return row == null ? null : (row.TaxAmount, row.CalculationValue, row.CalculationAnnualValue);
    }

    public Task<int?> GetYearRangeIdForAssessmentYearAsync(int assessmentYear, CancellationToken cancellationToken = default)
        => _context.AssessmentYearRangeEntities
            .AsNoTracking()
            .Where(y => y.IsActive && y.FromYear <= assessmentYear && y.ToYear >= assessmentYear)
            .Select(y => (int?)y.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<decimal?> GetTaxPercentageAsync(int taxId, int typeOfUseId, int yearRangeId, CancellationToken cancellationToken = default)
        => _context.TaxPercentageMasterRVs
            .AsNoTracking()
            .Where(p => p.TaxId == taxId && p.TypeOfUseId == typeOfUseId && p.YearRangeRVId == yearRangeId)
            .Select(p => (decimal?)p.TaxPercentage)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<List<int>> GetTaxTotalComponentTaxIdsAsync(int taxTotalId, CancellationToken cancellationToken = default)
        => _context.TaxMaster
            .AsNoTracking()
            .Where(t => t.IsActive && t.OldTaxStatus && t.Id != taxTotalId)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

    public async Task<Dictionary<int, decimal>> GetCurrentBasisTaxAmountsAsync(int propertyId, int yearMasterId, IReadOnlyCollection<int> taxIds, CancellationToken cancellationToken = default)
    {
        if (taxIds.Count == 0)
            return new Dictionary<int, decimal>();

        var rows = await _context.TransMast
            .AsNoTracking()
            .Where(t => t.PropertyId == propertyId &&
                        t.FinanceYearId == yearMasterId &&
                        taxIds.Contains(t.TaxId) &&
                        t.CalculationType == "RV" &&
                        t.IsActive && !t.MarkedForDeletion)
            .OrderByDescending(t => t.Id)
            .Select(t => new { t.TaxId, t.TaxAmount })
            .ToListAsync(cancellationToken);

        // One TransMast row can, in principle, be superseded by a later one at the same
        // (property, year, tax) key before the old one is deactivated — OrderByDescending(Id)
        // first means the first row encountered per TaxId in the grouping below is the latest.
        return rows
            .GroupBy(r => r.TaxId)
            .ToDictionary(g => g.Key, g => g.First().TaxAmount);
    }

    public async Task UpsertScheduleRowAsync(Section129ScheduleRowWrite row, DateTime now, CancellationToken cancellationToken = default)
    {
        var existing = await _context.PropertySection129Schedule
            .Where(s => s.PropertyId == row.PropertyId && s.FinanceYearId == row.FinanceYearId &&
                        s.IsActive && !s.MarkedForDeletion)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing == null)
        {
            await _context.PropertySection129Schedule.AddAsync(new PropertySection129ScheduleEntity
            {
                PropertyId = row.PropertyId,
                PropertyDetailsId = row.PropertyDetailsId,
                FinanceYearId = row.FinanceYearId,
                PolicyCodeId = row.PolicyCodeId,
                TaxId = row.TaxId,
                TaxPercentage = row.TaxPercentage,
                OldTaxAmount = row.OldTaxAmount,
                FullBasisTaxAmount = row.FullBasisTaxAmount,
                StageTaxAmount = row.StageTaxAmount,
                TaxAmount = row.TaxAmount,
                IsCurrent = row.IsCurrent,
                IsPropertyChangeDisqualified = row.IsPropertyChangeDisqualified,
                IsActive = true,
                MarkedForDeletion = false,
                CreatedDate = now,
                UpdatedDate = now
            }, cancellationToken);
            return;
        }

        existing.PropertyDetailsId = row.PropertyDetailsId;
        existing.PolicyCodeId = row.PolicyCodeId;
        existing.TaxId = row.TaxId;
        existing.TaxPercentage = row.TaxPercentage;
        existing.OldTaxAmount = row.OldTaxAmount;
        existing.FullBasisTaxAmount = row.FullBasisTaxAmount;
        existing.StageTaxAmount = row.StageTaxAmount;
        existing.TaxAmount = row.TaxAmount;
        existing.IsCurrent = row.IsCurrent;
        existing.IsPropertyChangeDisqualified = row.IsPropertyChangeDisqualified;
        existing.UpdatedDate = now;
    }

    public Task ClearIsCurrentFlagsAsync(int propertyId, int exceptYearMasterId, CancellationToken cancellationToken = default)
        => _context.PropertySection129Schedule
            .Where(s => s.PropertyId == propertyId && s.FinanceYearId != exceptYearMasterId &&
                        s.IsCurrent && s.IsActive && !s.MarkedForDeletion)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), cancellationToken);

    public async Task UpsertTransMastAsync(
        int propertyId,
        int yearMasterId,
        int taxId,
        int policyCodeId,
        decimal taxAmount,
        decimal calculationValue,
        decimal? calculationAnnualValue,
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        await _context.TransMast
            .Where(t => t.PropertyId == propertyId &&
                        t.FinanceYearId == yearMasterId &&
                        t.TaxId == taxId &&
                        t.IsActive && !t.MarkedForDeletion &&
                        t.PolicyCodeId != policyCodeId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.IsActive, false)
                .SetProperty(t => t.MarkedForDeletion, true)
                .SetProperty(t => t.MarkedForDeletionDate, now)
                .SetProperty(t => t.UpdatedDate, now), cancellationToken);

        var existing = await _context.TransMast
            .Where(t => t.PropertyId == propertyId &&
                        t.FinanceYearId == yearMasterId &&
                        t.TaxId == taxId &&
                        t.PolicyCodeId == policyCodeId &&
                        t.IsActive && !t.MarkedForDeletion)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing != null)
        {
            existing.TaxAmount = taxAmount;
            existing.CalculationValue = calculationValue;
            if (calculationAnnualValue.HasValue)
            {
                existing.CalculationAnnualValue = calculationAnnualValue.Value;
            }
            existing.UpdatedDate = now;
            return;
        }

        await _context.TransMast.AddAsync(new TransMastEntity
        {
            PropertyId = propertyId,
            FinanceYearId = yearMasterId,
            TaxId = taxId,
            PolicyCodeId = policyCodeId,
            TaxAmount = taxAmount,
            CalculationType = "RV",
            CalculationValue = calculationValue,
            CalculationAnnualValue = calculationAnnualValue,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = now,
            UpdatedDate = now
        }, cancellationToken);
    }

    public async Task SupersedePolicyTaxDetailAsync(
        int propertyId,
        int taxId,
        int policyCodeId,
        decimal taxAmount,
        decimal? calculationValue,
        IReadOnlyCollection<int> section129PolicyCodeIds,
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        // 1. Fully retire whatever PREVIOUS Section129-stage row was active for this (property, tax)
        //    — scoped to the Section129 chain's own ids so this never touches RVPersistenceService's
        //    NETTAX row (a different id entirely).
        await _context.PolicyTaxDetails
            .Where(x => x.PropertyId == propertyId &&
                        x.TaxId == taxId &&
                        section129PolicyCodeIds.Contains(x.PolicyCodeId) &&
                        x.PolicyCodeId != policyCodeId &&
                        x.IsActive && !x.MarkedForDeletion)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.IsActive, false)
                .SetProperty(x => x.MarkedForDeletion, true)
                .SetProperty(x => x.MarkedForDeletionDate, now)
                .SetProperty(x => x.UpdatedDate, now), cancellationToken);

        // 2. Demote every other row still marked current at this (property, tax) key — this is what
        //    flips RVPersistenceService's own NETTAX row from "current" once Section129A applies,
        //    WITHOUT deactivating it — it stays alive as the raw/un-staged basis, just no longer
        //    "the" figure officer-facing screens should read as current dues.
        await _context.PolicyTaxDetails
            .Where(x => x.PropertyId == propertyId &&
                        x.TaxId == taxId &&
                        x.PolicyCodeId != policyCodeId &&
                        x.IsActive && !x.MarkedForDeletion && x.IsCurrent)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.IsCurrent, false)
                .SetProperty(x => x.UpdatedDate, now), cancellationToken);

        // 3. Upsert this year's resolved-stage row, marked current.
        var existing = await _context.PolicyTaxDetails
            .Where(x => x.PropertyId == propertyId &&
                        x.TaxId == taxId &&
                        x.PolicyCodeId == policyCodeId &&
                        x.IsActive && !x.MarkedForDeletion)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing != null)
        {
            existing.TaxAmount = taxAmount;
            existing.CalculationValue = calculationValue;
            existing.IsCurrent = true;
            existing.UpdatedDate = now;
            return;
        }

        await _context.PolicyTaxDetails.AddAsync(new PolicyTaxDetailsEntity
        {
            PropertyId = propertyId,
            TaxId = taxId,
            PolicyCodeId = policyCodeId,
            TaxAmount = taxAmount,
            CalculationValue = calculationValue,
            IsCurrent = true,
            IsActive = true,
            MarkedForDeletion = false,
            CreatedDate = now,
            UpdatedDate = now
        }, cancellationToken);
    }

    public Task<DateTime?> GetWardSection129InclusionDateAsync(int wardId, CancellationToken cancellationToken = default)
        => _context.WardSection129Master
            .AsNoTracking()
            .Where(w => w.WardId == wardId && w.IsActive)
            .Select(w => w.Section129AInclusionDate)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<DateTime?> GetOcDateAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        // Property-scoped OC certificates: property-wise (PropertyDetailsId null) and every floor-wise
        // one (PropertyDetailsId set) — earliest IssueDate wins (first occupancy).
        var propertyOcDate = await _context.PropertyCertificates
            .AsNoTracking()
            .Where(pc => pc.PropertyId == propertyId &&
                         pc.IsActive && !pc.MarkedForDeletion &&
                         pc.IssueDate != null &&
                         pc.CertificateType != null &&
                         pc.CertificateType.CertificateTypeCode.ToUpper() == CertificateTypeCodes.OC)
            .MinAsync(pc => pc.IssueDate, cancellationToken);

        if (propertyOcDate.HasValue)
            return propertyOcDate;

        // Inherited fallback — same wing → society precedence PropertyCertificateApplicationService
        // uses for its own "effective OC" resolution.
        var wingDetailId = await _context.PropertyMast
            .AsNoTracking()
            .Where(p => p.Id == propertyId)
            .Select(p => p.WingDetailId)
            .FirstOrDefaultAsync(cancellationToken);

        int? societyDetailId = null;
        if (wingDetailId.HasValue && wingDetailId.Value > 0)
        {
            var wingOcDate = await _context.PropertyCertificates
                .AsNoTracking()
                .Where(pc => pc.WingDetailId == wingDetailId.Value &&
                             pc.IsActive && !pc.MarkedForDeletion &&
                             pc.IssueDate != null &&
                             pc.CertificateType != null &&
                             pc.CertificateType.CertificateTypeCode.ToUpper() == CertificateTypeCodes.OC)
                .MinAsync(pc => pc.IssueDate, cancellationToken);

            if (wingOcDate.HasValue)
                return wingOcDate;

            societyDetailId = await _context.WingDetailsMast
                .AsNoTracking()
                .Where(w => w.Id == wingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                .Select(w => (int?)w.SocietyDetailsMastId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (!societyDetailId.HasValue)
        {
            societyDetailId = await _context.SocietyDetailsMast
                .AsNoTracking()
                .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (!societyDetailId.HasValue)
            return null;

        return await _context.PropertyCertificates
            .AsNoTracking()
            .Where(pc => pc.SocietyDetailId == societyDetailId.Value &&
                         pc.IsActive && !pc.MarkedForDeletion &&
                         pc.IssueDate != null &&
                         pc.CertificateType != null &&
                         pc.CertificateType.CertificateTypeCode.ToUpper() == CertificateTypeCodes.OC)
            .MinAsync(pc => pc.IssueDate, cancellationToken);
    }

    public async Task ResetSection129ScheduleAsync(
        int propertyId,
        IReadOnlyCollection<int> section129PolicyCodeIds,
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        await _context.PropertySection129Schedule
            .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.IsActive, false)
                .SetProperty(x => x.MarkedForDeletion, true)
                .SetProperty(x => x.MarkedForDeletionDate, now)
                .SetProperty(x => x.IsCurrent, false)
                .SetProperty(x => x.UpdatedDate, now), cancellationToken);

        // Scoped to the SECTION_129_* chain ids so OLD_ARREARS, NETTAX and every other writer's
        // rows are left exactly as they are.
        await _context.TransMast
            .Where(t => t.PropertyId == propertyId &&
                        section129PolicyCodeIds.Contains(t.PolicyCodeId) &&
                        t.IsActive && !t.MarkedForDeletion)
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.IsActive, false)
                .SetProperty(t => t.MarkedForDeletion, true)
                .SetProperty(t => t.MarkedForDeletionDate, now)
                .SetProperty(t => t.UpdatedDate, now), cancellationToken);

        await _context.PolicyTaxDetails
            .Where(x => x.PropertyId == propertyId &&
                        section129PolicyCodeIds.Contains(x.PolicyCodeId) &&
                        x.IsActive && !x.MarkedForDeletion)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.IsActive, false)
                .SetProperty(x => x.MarkedForDeletion, true)
                .SetProperty(x => x.MarkedForDeletionDate, now)
                .SetProperty(x => x.UpdatedDate, now), cancellationToken);
    }

    public Task<int?> GetPolicyCodeIdAsync(string policyCode, CancellationToken cancellationToken = default)
        => _context.PolicyCodeMaster
            .AsNoTracking()
            .Where(p => p.PolicyCode == policyCode && p.IsActive)
            .Select(p => (int?)p.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<Dictionary<int, decimal>> GetTransMastOldAmountsAsync(IReadOnlyCollection<int> oldPropertyIds, int financeYearId, IReadOnlyCollection<int> taxIds, CancellationToken cancellationToken = default)
    {
        if (oldPropertyIds.Count == 0 || taxIds.Count == 0)
            return new Dictionary<int, decimal>();

        var rows = await _context.TransMastOld
            .AsNoTracking()
            .Where(t => oldPropertyIds.Contains(t.PropertyMastOldId) &&
                        t.FinanceYearId == financeYearId &&
                        taxIds.Contains(t.TaxId) &&
                        t.IsActive && !t.MarkedForDeletion)
            .GroupBy(t => t.TaxId)
            .Select(g => new { TaxId = g.Key, Amount = g.Sum(t => t.TaxAmount) })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(r => r.TaxId, r => r.Amount);
    }

    public async Task SweepPreStartYearOldArrearsAsync(int propertyId, int startYearValue, DateTime now, CancellationToken cancellationToken = default)
    {
        var oldArrearsPolicyCodeId = await GetPolicyCodeIdAsync(PolicyCodes.OldArrears, cancellationToken);
        if (oldArrearsPolicyCodeId == null)
            return; // OLD_ARREARS not seeded — nothing to sweep.

        var targetYearMasterId = await GetYearMasterIdAsync(startYearValue - 1, cancellationToken);
        if (targetYearMasterId == null)
            return; // No YearMaster row for startYear-1 — can't sweep safely.

        var rowsToSweep = await _context.TransMast
            .Where(t => t.PropertyId == propertyId &&
                        t.PolicyCodeId == oldArrearsPolicyCodeId.Value &&
                        t.IsActive && !t.MarkedForDeletion &&
                        t.FinanceYear != null && t.FinanceYear.Year >= startYearValue &&
                        t.Tax != null && t.Tax.OldTaxStatus)
            .ToListAsync(cancellationToken);

        if (rowsToSweep.Count == 0)
            return;

        var sumsByTaxId = rowsToSweep
            .GroupBy(r => r.TaxId)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.TaxAmount));

        foreach (var (taxId, amount) in sumsByTaxId)
        {
            if (amount == 0m)
                continue;

            var existing = await _context.TransMast
                .Where(t => t.PropertyId == propertyId &&
                            t.FinanceYearId == targetYearMasterId.Value &&
                            t.TaxId == taxId &&
                            t.PolicyCodeId == oldArrearsPolicyCodeId.Value &&
                            t.IsActive && !t.MarkedForDeletion)
                .FirstOrDefaultAsync(cancellationToken);

            if (existing != null)
            {
                existing.TaxAmount += amount;
                existing.UpdatedDate = now;
            }
            else
            {
                await _context.TransMast.AddAsync(new TransMastEntity
                {
                    PropertyId = propertyId,
                    FinanceYearId = targetYearMasterId.Value,
                    TaxId = taxId,
                    PolicyCodeId = oldArrearsPolicyCodeId.Value,
                    TaxAmount = amount,
                    CalculationType = "RV",
                    CalculationValue = 0m,
                    IsActive = true,
                    MarkedForDeletion = false,
                    CreatedDate = now,
                    UpdatedDate = now
                }, cancellationToken);
            }
        }

        var sweptIds = rowsToSweep.Select(r => r.Id).ToList();
        await _context.TransMast
            .Where(t => sweptIds.Contains(t.Id))
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.IsActive, false)
                .SetProperty(t => t.MarkedForDeletion, true)
                .SetProperty(t => t.MarkedForDeletionDate, now)
                .SetProperty(t => t.UpdatedDate, now), cancellationToken);
    }
}
