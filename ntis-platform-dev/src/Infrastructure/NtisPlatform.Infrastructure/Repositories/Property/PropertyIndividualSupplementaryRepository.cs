using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.Property;

/// <summary>
/// Read-only repository backing <see cref="IPropertyIndividualSupplementaryRepository"/>.
/// Scoped strictly to the Individual Property GET endpoint — does not touch or affect
/// PTIS.PropertyMast/PropertyDetails usage by the ApartmentQC top-section feature.
/// </summary>
public sealed class PropertyIndividualSupplementaryRepository : IPropertyIndividualSupplementaryRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IFinanceYearProvider? _financeYearProvider;

    public PropertyIndividualSupplementaryRepository(ApplicationDbContext context, IFinanceYearProvider? financeYearProvider = null)
    {
        _context = context;
        _financeYearProvider = financeYearProvider;
    }

    public async Task<PropertyIndividualSupplementaryData> GetOwnerTitleAndPlotAreaAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var propertyInfo = await (
            from pm in _context.PropertyMast.AsNoTracking()
            where pm.Id == propertyId
            join pcm in _context.PropertyCategoryMaster.AsNoTracking() on pm.CategoryId equals pcm.Id into pcmj
            from pcm in pcmj.DefaultIfEmpty()
            join wm in _context.WingDetailsMast.AsNoTracking() on pm.WingDetailId equals wm.Id into wmj
            from wm in wmj.Where(w => w.IsActive && !w.MarkedForDeletion).DefaultIfEmpty()
            select new
            {
                pm.OwnerTitle,
                pm.OwnerTitleEnglish,
                pm.CategoryId,
                CategoryName = pcm != null ? pcm.PropertyCategoryName : null,
                pm.WingDetailId,
                WingName = wm != null ? wm.WingName : null
            }
        ).FirstOrDefaultAsync(cancellationToken);

        // Same "open plot" resolution as PropertyBasicDetailsRepository: PropertyDetails row
        // whose TypeOfUse is categorized as OpenPlot (TypeOfUseCategoryMaster.TypeOfUseCategoryCode == Op).
        var plotArea = await _context.PropertyDetails
            .AsNoTracking()
            .Where(pd => pd.PropertyId == propertyId
                && pd.IsActive && !pd.MarkedForDeletion
                && pd.TypeOfUse != null && pd.TypeOfUse.IsActive
                && pd.TypeOfUse.TypeOfUseCategory != null
                && pd.TypeOfUse.TypeOfUseCategory.TypeOfUseCategoryCode == TypeOfUseConstants.Op)
            .OrderBy(pd => pd.Id)
            .Select(pd => new { pd.BuiltupAreaSqFeet, pd.BuiltupAreaSqMeter })
            .FirstOrDefaultAsync(cancellationToken);

        // Oldest active assessment row by Id — matches PropertyKycService's write target
        // (GetFirstAssessmentIdAsync), so Aadhar reads stay consistent with where it's written.
        var assessment = await _context.PropertyMastDetails
            .AsNoTracking()
            .Where(a => a.PropertyId == propertyId && a.IsActive && !a.MarkedForDeletion)
            .OrderBy(a => a.Id)
            .Select(a => a.AdharCardNo)
            .FirstOrDefaultAsync(cancellationToken);

        // Enforce business rules for Wing resolution:
        // Scenario 1: Apartment unit / flat -> has WingDetailId and WingName
        // Scenario 2: Apartment single building (no wing) -> WingDetailId is null, WingName is null
        // Scenario 3: Individual property -> WingDetailId is null, WingName is null
        bool isApartment = propertyInfo?.CategoryName != null &&
            PropertyCategoryConstants.ApartmentCategoryNames.Any(c => string.Equals(c, propertyInfo.CategoryName, StringComparison.OrdinalIgnoreCase));

        int? wingDetailId = isApartment ? propertyInfo?.WingDetailId : null;
        string? wingName = isApartment ? propertyInfo?.WingName : null;

        return new PropertyIndividualSupplementaryData(
            propertyInfo?.OwnerTitle,
            propertyInfo?.OwnerTitleEnglish,
            plotArea?.BuiltupAreaSqFeet,
            plotArea?.BuiltupAreaSqMeter,
            assessment,
            propertyInfo?.CategoryId,
            wingDetailId,
            wingName);
    }

    public async Task<(double? CarpetFt, double? CarpetMtr, double? BuiltUpFt, double? BuiltUpMtr)> GetAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var openFloorIds = await _context.FloorEntity
            .AsNoTracking()
            .Where(f => f.IsActive && f.FloorCode != null && f.FloorCode.Trim().ToUpper() == "OP")
            .Select(f => f.Id)
            .ToListAsync(cancellationToken);

        var openConstructionTypeIds = await _context.ConstructionTypeEntity
            .AsNoTracking()
            .Where(c => c.IsActive && c.ConstructionCode != null && c.ConstructionCode.Trim().ToUpper() == "OP")
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        var opCategoryIds = await _context.TypeOfUseCategory
            .AsNoTracking()
            .Where(c => c.IsActive && c.TypeOfUseCategoryCode != null && (
                c.TypeOfUseCategoryCode.Trim().ToUpper() == "OP" ||
                c.TypeOfUseCategoryCode.Trim().ToUpper() == "OPENPLOT" ||
                c.TypeOfUseCategoryCode == TypeOfUseConstants.Op))
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        var openTypeOfUseIds = await _context.TypeOfUse
            .AsNoTracking()
            .Where(t => t.IsActive && (
                (t.TypeOfUseCode != null && t.TypeOfUseCode.Trim().ToUpper() == "OP") ||
                (t.TypeOfUseCategoryId.HasValue && opCategoryIds.Contains(t.TypeOfUseCategoryId.Value)) ||
                (t.TypeOfUseCategory != null && t.TypeOfUseCategory.IsActive && (
                    t.TypeOfUseCategory.TypeOfUseCategoryCode == TypeOfUseConstants.Op ||
                    t.TypeOfUseCategory.TypeOfUseCategoryCode == "OP" ||
                    t.TypeOfUseCategory.TypeOfUseCategoryCode == "OpenPlot"
                ))
            ))
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        var result = await _context.PropertyDetails
            .AsNoTracking()
            .Where(d => d.PropertyId == propertyId
                     && d.IsActive
                     && !d.MarkedForDeletion
                     && (!d.FloorId.HasValue || !openFloorIds.Contains(d.FloorId.Value))
                     && (!d.ConstructionTypeId.HasValue || !openConstructionTypeIds.Contains(d.ConstructionTypeId.Value))
                     && !openTypeOfUseIds.Contains(d.TypeOfUseId))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                CarpetFt = g.Sum(d => d.CarpetAreaSqFeet ?? 0),
                CarpetMtr = g.Sum(d => d.CarpetAreaSqMeter ?? 0),
                BuiltUpFt = g.Sum(d => d.BuiltupAreaSqFeet ?? 0),
                BuiltUpMtr = g.Sum(d => d.BuiltupAreaSqMeter ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return result is null
            ? (null, null, null, null)
            : (Math.Round(result.CarpetFt, 2), Math.Round(result.CarpetMtr, 2), Math.Round(result.BuiltUpFt, 2), Math.Round(result.BuiltUpMtr, 2));
    }

    public async Task<PropertyIndividualTaxData> GetAdditionalRevenueTaxDetailsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var currentYear = _financeYearProvider?.GetCurrentFinanceYear();
        if (!currentYear.HasValue || currentYear.Value <= 0)
        {
            var activeYear = await _context.YearMaster.AsNoTracking()
                .Where(y => y.IsActive)
                .OrderByDescending(y => y.Year)
                .Select(y => (int?)y.Year)
                .FirstOrDefaultAsync(cancellationToken);
            currentYear = activeYear ?? DateTime.Today.Year;
        }

        var currentAssessmentYear = currentYear.Value;

        // 1. CurrentTax: PolicyTaxDetails, NETTAX policy only, sum of the REAL tax components,
        // scoped to this property only. Must not include OC/CC/ElectricBill (certificate-driven,
        // retro-eligible policy codes) or OLD_ARREARS -- those flow into RetroTax/PendingCurrent
        // below instead; summing every policy code here would double-count them into "current tax".
        //
        // Must NOT trust the reserved "TaxTotal"/"TAXTOTAL" sentinel row's own stored value: per
        // PropertyRepository.cs's identical exclusion, that write path does not keep the sentinel
        // reliably in sync, so it can sit at a stale 0 while the real NETTAX components are
        // current -- CurrentTax is therefore always the sum of the real (non-sentinel) components.
        var currentTax = await (
            from ptd in _context.PolicyTaxDetails.AsNoTracking()
            join pcm in _context.PolicyCodeMaster.AsNoTracking() on ptd.PolicyCodeId equals pcm.Id
            join tx in _context.TaxMaster.AsNoTracking() on ptd.TaxId equals tx.Id
            where ptd.PropertyId == propertyId
                  && pcm.PolicyCode == PolicyCodes.NetTax
                  && (tx.TaxCode == null || tx.TaxCode.Replace(" ", "").Trim().ToUpper() != "TAXTOTAL")
                  && (tx.TaxName == null || tx.TaxName.Replace(" ", "").Trim().ToUpper() != "TAXTOTAL")
                  && ptd.IsActive
                  && !ptd.MarkedForDeletion
                  && ptd.IsCurrent
            select (decimal?)ptd.TaxAmount
        ).SumAsync(cancellationToken) ?? 0m;

        // 2. RetroTax: TransMast, IsRetroDemand policy, TAXTOTAL, FinanceYear < current, scoped to this property only.
        var retroTax = await (
            from tm in _context.TransMast.AsNoTracking()
            join ym in _context.YearMaster.AsNoTracking() on tm.FinanceYearId equals ym.Id into ymj
            from ym in ymj.DefaultIfEmpty()
            join pcm in _context.PolicyCodeMaster.AsNoTracking() on tm.PolicyCodeId equals pcm.Id
            join tx in _context.TaxMaster.AsNoTracking() on tm.TaxId equals tx.Id
            where tm.PropertyId == propertyId
                  && tx.TaxCode != null && tx.TaxCode.Trim().ToUpper() == "TAXTOTAL"
                  && pcm.IsRetroDemand
                  && tm.IsActive
                  && !tm.MarkedForDeletion
                  && (ym == null || ym.Year == 0 || ym.Year < currentAssessmentYear)
            select (decimal?)tm.TaxAmount
        ).SumAsync(cancellationToken) ?? 0m;

        // 3. PendingCurrent (Old Arrears): TransMast, PolicyCode = OLD_ARREARS, TAXTOTAL, FinanceYear < current, scoped to this property only.
        var pendingCurrent = await (
            from tm in _context.TransMast.AsNoTracking()
            join ym in _context.YearMaster.AsNoTracking() on tm.FinanceYearId equals ym.Id into ymj
            from ym in ymj.DefaultIfEmpty()
            join pcm in _context.PolicyCodeMaster.AsNoTracking() on tm.PolicyCodeId equals pcm.Id
            join tx in _context.TaxMaster.AsNoTracking() on tm.TaxId equals tx.Id
            where tm.PropertyId == propertyId
                  && pcm.PolicyCode == "OLD_ARREARS"
                  && tx.TaxCode != null && tx.TaxCode.Trim().ToUpper() == "TAXTOTAL"
                  && tm.IsActive
                  && !tm.MarkedForDeletion
                  && (ym == null || ym.Year == 0 || ym.Year < currentAssessmentYear)
            select (decimal?)tm.TaxAmount
        ).SumAsync(cancellationToken) ?? 0m;

        // DifferenceAmount input: OldTotalTax from PropertyMastOld, scoped to this property's own mapped old records only.
        var mappedOldPropertyIds = await _context.PropertyMapDetails.AsNoTracking()
            .Where(pmd => pmd.PropertyIdNew == propertyId
                       && pmd.PropertyIdOld != null)
            .Select(pmd => pmd.PropertyIdOld!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        var oldTotalTax = mappedOldPropertyIds.Count > 0
            ? await (
                from pmo in _context.PropertyMastOld.AsNoTracking()
                where mappedOldPropertyIds.Contains(pmo.Id)
                      && !pmo.MarkedForDeletion
                select (decimal?)(decimal)(pmo.OldTotalTax ?? 0)
            ).SumAsync(cancellationToken) ?? 0m
            : 0m;

        return new PropertyIndividualTaxData(currentTax, retroTax, pendingCurrent, oldTotalTax);
    }

    public async Task<(double? OldCarpetAreaSqFeet, double? OldCarpetAreaSqMeter, double? OldBuiltupAreaSqFeet, double? OldBuiltupAreaSqMeter)> GetOldAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var mappedOldPropertyIds = await _context.PropertyMapDetails.AsNoTracking()
            .Where(pmd => pmd.PropertyIdNew == propertyId
                       && pmd.PropertyIdOld != null)
            .Select(pmd => pmd.PropertyIdOld!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (mappedOldPropertyIds.Count == 0)
        {
            return (null, null, null, null);
        }

        var oldDetailsSum = await _context.PropertyDetailsOld
            .AsNoTracking()
            .Where(x => mappedOldPropertyIds.Contains(x.PropertyMastOldId) && !x.MarkedForDeletion)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                OldCarpetAreaSqFeet = g.Sum(x => x.OldCarpetAreaSqFeet ?? 0),
                OldCarpetAreaSqMeter = g.Sum(x => x.OldCarpetAreaSqMeter ?? 0),
                OldBuiltupAreaSqFeet = g.Sum(x => x.OldBuiltupAreaSqFeet ?? 0),
                OldBuiltupAreaSqMeter = g.Sum(x => x.OldBuiltupAreaSqMeter ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (oldDetailsSum is null)
        {
            return (null, null, null, null);
        }

        return (
            Math.Round(oldDetailsSum.OldCarpetAreaSqFeet, 2),
            Math.Round(oldDetailsSum.OldCarpetAreaSqMeter, 2),
            Math.Round(oldDetailsSum.OldBuiltupAreaSqFeet, 2),
            Math.Round(oldDetailsSum.OldBuiltupAreaSqMeter, 2));
    }

    public async Task<PropertyIndividualAreaData> GetCarpetAndBuiltUpAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        // Same "open plot" exclusion as PropertyBasicDetailsRepository.GetBasicDetailsAsync:
        // TypeOfUseCategoryMaster.TypeOfUseCategoryCode == TypeOfUseConstants.Op.
        var openTypeOfUseIds = await _context.TypeOfUse
            .AsNoTracking()
            .Where(t => t.IsActive && t.TypeOfUseCategory != null && t.TypeOfUseCategory.TypeOfUseCategoryCode == TypeOfUseConstants.Op)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        var detailsSum = await _context.PropertyDetails
            .AsNoTracking()
            .Where(x => x.PropertyId == propertyId
                     && x.IsActive
                     && !x.MarkedForDeletion
                     && !openTypeOfUseIds.Contains(x.TypeOfUseId))
            .GroupBy(x => x.PropertyId)
            .Select(g => new
            {
                CarpetAreaSqFeet = g.Sum(x => x.CarpetAreaSqFeet ?? 0),
                CarpetAreaSqMeter = g.Sum(x => x.CarpetAreaSqMeter ?? 0),
                BuiltupAreaSqFeet = g.Sum(x => x.BuiltupAreaSqFeet ?? 0),
                BuiltupAreaSqMeter = g.Sum(x => x.BuiltupAreaSqMeter ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (detailsSum is null)
        {
            return new PropertyIndividualAreaData(null, null, null, null);
        }

        return new PropertyIndividualAreaData(
            Math.Round(detailsSum.CarpetAreaSqFeet, 2),
            Math.Round(detailsSum.CarpetAreaSqMeter, 2),
            Math.Round(detailsSum.BuiltupAreaSqFeet, 2),
            Math.Round(detailsSum.BuiltupAreaSqMeter, 2));
    }

    public async Task<TopSectionUpdateOutcome> UpdateIndividualDetailsAsync(
        int propertyId,
        UpdatePropertyIndividualDto dto,
        int updatedBy,
        CancellationToken cancellationToken = default)
    {
        var property = await _context.PropertyMast
            .FirstOrDefaultAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);

        if (property is null)
        {
            return TopSectionUpdateOutcome.PropertyNotFound;
        }

        var isLocked = await _context.PropertyScreenLocks
            .AnyAsync(l => l.PropertyId == propertyId && l.IsLocked && l.IsActive && !l.MarkedForDeletion, cancellationToken);

        if (isLocked)
        {
            return TopSectionUpdateOutcome.PropertyLocked;
        }

        var now = DateTime.Now;

        // 1. Update PropertyMast fields with trimming
        var ownerName = dto.OwnerNameRegional ?? dto.OwnerName;
        if (ownerName != null) property.OwnerName = ownerName.Trim();
        if (dto.OwnerNameEnglish != null) property.OwnerNameEnglish = dto.OwnerNameEnglish.Trim();
        if (dto.OwnerTitle != null) property.OwnerTitle = dto.OwnerTitle.Trim();
        if (dto.OwnerTitleEnglish != null) property.OwnerTitleEnglish = dto.OwnerTitleEnglish.Trim();

        var occupierName = dto.OccupierNameRegional ?? dto.OccupierName;
        if (occupierName != null) property.OccupierName = occupierName.Trim();
        if (dto.OccupierNameEnglish != null) property.OccupierNameEnglish = dto.OccupierNameEnglish.Trim();
        if (dto.OccupierTitle != null) property.OccupierTitle = dto.OccupierTitle.Trim();
        if (dto.OccupierTitleEnglish != null) property.OccupierTitleEnglish = dto.OccupierTitleEnglish.Trim();

        if (dto.MobileNo != null) property.MobileNo = dto.MobileNo.Trim();
        if (dto.AlternateMobileNo != null) property.AlternateMobileNo = dto.AlternateMobileNo.Trim();
        if (dto.EmailId != null) property.EmailId = dto.EmailId.Trim();

        var address = dto.AddressRegional ?? dto.Address;
        if (address != null) property.Address = address.Trim();
        if (dto.AddressEnglish != null) property.AddressEnglish = dto.AddressEnglish.Trim();
        if (dto.PinCode != null) property.PinCode = dto.PinCode.Trim();

        if (dto.PlotNo != null) property.PlotNo = dto.PlotNo.Trim();
        if (dto.FlatOrShopNo != null) property.FlatOrShopNo = dto.FlatOrShopNo.Trim();
        if (dto.FlatOrShopName != null) property.FlatOrShopName = dto.FlatOrShopName.Trim();
        if (dto.FlatOrShopNameEnglish != null) property.FlatOrShopNameEnglish = dto.FlatOrShopNameEnglish.Trim();
        if (dto.SurveyNo != null) property.CSN = dto.SurveyNo.Trim();

        if (dto.MoujaId.HasValue) property.MoujaId = dto.MoujaId;
        if (dto.TaxZoneId.HasValue) property.TaxZoneId = dto.TaxZoneId.Value;
        if (dto.CategoryId.HasValue) property.CategoryId = dto.CategoryId;
        if (dto.PropertyTypeId.HasValue) property.PropertyTypeId = dto.PropertyTypeId;

        property.UpdatedBy = updatedBy;
        property.UpdatedDate = now;

        // 2. Update PropertyMastDetails (AadharCardNo, OwnerTypeId)
        if (dto.AadharNo != null || dto.OwnerTypeId.HasValue)
        {
            var assessment = await _context.PropertyMastDetails
                .Where(a => a.PropertyId == propertyId && a.IsActive && !a.MarkedForDeletion)
                .OrderByDescending(a => a.CreatedDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (assessment != null)
            {
                if (dto.AadharNo != null) assessment.AdharCardNo = dto.AadharNo.Trim();
                if (dto.OwnerTypeId.HasValue) assessment.OwnerTypeId = dto.OwnerTypeId;
                assessment.UpdatedBy = updatedBy;
                assessment.UpdatedDate = now;
            }
            else
            {
                var newAssessment = new PropertyAssessmentEntity
                {
                    PropertyId = propertyId,
                    AdharCardNo = dto.AadharNo?.Trim(),
                    OwnerTypeId = dto.OwnerTypeId,
                    CreatedBy = updatedBy,
                    CreatedDate = now,
                    IsActive = true,
                    MarkedForDeletion = false
                };
                _context.PropertyMastDetails.Add(newAssessment);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return TopSectionUpdateOutcome.Success;
    }
}
