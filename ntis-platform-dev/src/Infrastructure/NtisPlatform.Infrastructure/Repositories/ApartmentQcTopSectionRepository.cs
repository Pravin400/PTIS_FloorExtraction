using System.Data;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories;

/// <summary>
/// Read-only repository for the ApartmentQC top-section panel.
/// Every query is AsNoTracking — this feature never writes.
/// </summary>
public sealed class ApartmentQcTopSectionRepository : IApartmentQcTopSectionRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IFinanceYearProvider? _financeYearProvider;

    public ApartmentQcTopSectionRepository(ApplicationDbContext context, IFinanceYearProvider? financeYearProvider = null)
    {
        _context = context;
        _financeYearProvider = financeYearProvider;
    }

    public async Task<PropertyTopSectionRawData?> GetPropertyAsync(ApartmentQcTopSectionQueryParameters query, CancellationToken cancellationToken = default)
    {
        var propertyId = await ResolvePropertyIdAsync(query, cancellationToken);
        if (propertyId is null)
        {
            return null;
        }

        var joined =
            from pm in _context.PropertyMast.AsNoTracking()
            where pm.Id == propertyId.Value && !pm.MarkedForDeletion
            join tzm in _context.TaxZoneMaster.AsNoTracking() on pm.TaxZoneId equals tzm.Id into tzmj
            from tzm in tzmj.DefaultIfEmpty()
            join wm in _context.WardMaster.AsNoTracking() on pm.WardId equals wm.Id into wmj
            from wm in wmj.DefaultIfEmpty()
            join zm in _context.ZoneMaster.AsNoTracking() on wm.ZoneId equals zm.Id into zmj
            from zm in zmj.DefaultIfEmpty()
            join mm in _context.MoujaEntity.AsNoTracking() on pm.MoujaId equals mm.Id into mmj
            from mm in mmj.DefaultIfEmpty()
            join pcm in _context.PropertyCategoryMaster.AsNoTracking() on pm.CategoryId equals pcm.Id into pcmj
            from pcm in pcmj.DefaultIfEmpty()
            join ptm in _context.PropertyTypeMasters.AsNoTracking() on pm.PropertyTypeId equals ptm.Id into ptmj
            from ptm in ptmj.DefaultIfEmpty()
            let assessment = _context.PropertyMastDetails.AsNoTracking()
                .Where(a => a.PropertyId == pm.Id && a.IsActive && !a.MarkedForDeletion)
                .OrderByDescending(a => a.CreatedDate)
                .FirstOrDefault()
            let society = _context.SocietyDetailsMast.AsNoTracking()
                .Where(s => s.PropertyId == pm.Id && s.IsActive)
                .OrderByDescending(s => s.CreatedDate)
                .FirstOrDefault()
            let isLocked = _context.PropertyScreenLocks.AsNoTracking()
                .Any(l => l.PropertyId == pm.Id && l.IsLocked && l.IsActive && !l.MarkedForDeletion)
            let ownerCategory = _context.OwnerTypeMaster.AsNoTracking()
                .Where(o => assessment != null && o.Id == assessment.OwnerTypeId && o.IsActive)
                .Select(o => o.OwnerType)
                .FirstOrDefault()
            // SOCIETY_PLACE is the closest existing PropertyPhotoType to "society main building
            // photo" - there is no dedicated "building" code at SOCIETY scope (only per-WING has
            // one, WING_BUILDING, which doesn't fit a property that spans multiple wings).
            let societyBuildingPhotoGuid = (
                from photo in _context.PropertyPhotos.AsNoTracking()
                join photoType in _context.PropertyPhotoTypes.AsNoTracking() on photo.PhotoTypeId equals photoType.Id
                join binding in _context.DocumentBindings.AsNoTracking() on photo.DocumentBindingId equals binding.Id
                join doc in _context.Documents.AsNoTracking() on binding.DocumentId equals doc.Id
                where society != null
                    && photo.EntityType == "S" && photo.SocietyDetailId == society.Id
                    && photoType.PhotoTypeCode == "SOCIETY_PLACE"
                    && photo.IsLatest && photo.IsActive && !photo.MarkedForDeletion
                    && binding.IsActive && !binding.MarkedForDeletion
                    && doc.IsActive && !doc.MarkedForDeletion
                select (Guid?)doc.DocumentGuid
            ).FirstOrDefault()
            let individualPropertyPhotoGuid = (
                from photo in _context.PropertyPhotos.AsNoTracking()
                join binding in _context.DocumentBindings.AsNoTracking() on photo.DocumentBindingId equals binding.Id
                join doc in _context.Documents.AsNoTracking() on binding.DocumentId equals doc.Id
                where photo.PropertyId == pm.Id
                    && photo.IsLatest && photo.IsActive && !photo.MarkedForDeletion
                    && binding.IsActive && !binding.MarkedForDeletion
                    && doc.IsActive && !doc.MarkedForDeletion
                orderby photo.CreatedDate descending
                select (Guid?)doc.DocumentGuid
            ).FirstOrDefault()
            let rateSectionName = (
                from rsd in _context.RateSectionDetails.AsNoTracking()
                join rs in _context.RateSection.AsNoTracking() on rsd.RateSectionId equals rs.Id
                where rsd.WardId == pm.WardId && rsd.IsActive && rs.IsActive
                select rs.Description
            ).FirstOrDefault()
            select new PropertyTopSectionRawData
            {
                Id = pm.Id,
                Upic = pm.UPICId ?? string.Empty,
                IsActive = pm.IsActive,
                IsLocked = isLocked,
                WardId = pm.WardId,
                WardNo = wm != null ? wm.WardNo : null,
                PropertyNo = pm.PropertyNo,
                PartitionNo = pm.PartitionNo,
                OwnerName = pm.OwnerName,
                OwnerNameEnglish = pm.OwnerNameEnglish,
                OccupierName = pm.OccupierName,
                OccupierNameEnglish = pm.OccupierNameEnglish,
                PlotNo = pm.PlotNo,
                FlatOrShopNo = pm.FlatOrShopNo,
                FlatOrShopName = pm.FlatOrShopName,
                FlatOrShopNameEnglish = pm.FlatOrShopNameEnglish,
                Csn = pm.CSN,
                SubZoneNo = pm.SubZoneNo,
                Address = pm.Address,
                AddressEnglish = pm.AddressEnglish,
                PinCode = pm.PinCode,
                MobileNo = pm.MobileNo,
                AlternateMobileNo = pm.AlternateMobileNo,
                EmailId = pm.EmailId,
                AadharCardNo = assessment != null ? assessment.AdharCardNo : null,
                PropertyCategoryName = pcm != null ? pcm.PropertyCategoryName : null,
                PropertyDescription = ptm != null ? ptm.PropertyDescription : null,
                TaxZoneNo = tzm != null ? tzm.TaxZoneNo : null,
                TaxZoneRemark = tzm != null ? tzm.Remark : null,
                RateSectionName = rateSectionName,
                DivisionName = zm != null ? zm.Description : null,
                MoujaName = mm != null ? mm.MoujaName : null,
                SecretaryName = society != null ? society.SecretaryName : null,
                SecretaryNameEnglish = society != null ? society.SecretaryNameEnglish : null,
                SecretaryMobileNo = society != null ? society.SecretaryMobileNo : null,
                SecretaryEmailId = society != null ? society.SecretaryEmailId : null,
                ManagerName = society != null ? society.ManagerName : null,
                ManagerNameEnglish = society != null ? society.ManagerNameEnglish : null,
                ManagerMobileNo = society != null ? society.ManagerMobileNo : null,
                ManagerEmailId = society != null ? society.ManagerEmailId : null,
                SocietyName = society != null ? society.SocietyName : null,
                SocietyNameEnglish = society != null ? society.SocietyNameEnglish : null,
                SocietyAddress = society != null ? society.SocietyAddress : null,
                SocietyAddressEnglish = society != null ? society.SocietyAddressEnglish : null,
                SocietyEmailId = society != null ? society.SocietyEmailId : null,
                LandOwnerName = society != null ? society.LandOwnerName : null,
                LandOwnerNameEnglish = society != null ? society.LandOwnerNameEnglish : null,
                BuilderName = society != null ? society.BuilderName : null,
                BuilderNameEnglish = society != null ? society.BuilderNameEnglish : null,
                BuilderMobileNo = society != null ? society.BuilderMobileNo : null,
                OwnerCategory = ownerCategory,
                SocietyBuildingPhotoGuid = societyBuildingPhotoGuid,
                IndividualPropertyGuid = individualPropertyPhotoGuid,
                IndividualPropertyPhotoGuid = individualPropertyPhotoGuid,
            };

        return await joined.FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>
    /// Resolves a PropertyMast.Id from whichever identifier <paramref name="query"/> supplies,
    /// checked in precedence order. WingDetailsId and SocietyId are resolved the same
    /// direct-FK-or-via-society way as <c>GetApartmentDetailsWingWiseService</c>, since
    /// PropertyMast.SocietyDetailId/WingDetailId and SocietyDetailsMast.PropertyId are two
    /// directions of the same relationship and either may be the one that's populated.
    /// </summary>
    private async Task<int?> ResolvePropertyIdAsync(ApartmentQcTopSectionQueryParameters query, CancellationToken cancellationToken)
    {
        if (query.PropertyId is int propertyId)
        {
            return propertyId;
        }

        if (!string.IsNullOrWhiteSpace(query.Upic))
        {
            return await _context.PropertyMast.AsNoTracking()
                .Where(p => p.UPICId == query.Upic && !p.MarkedForDeletion)
                .Select(p => (int?)p.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (query.WardId is int wardId && !string.IsNullOrWhiteSpace(query.PropertyNo))
        {
            return await _context.PropertyMast.AsNoTracking()
                .Where(p => p.WardId == wardId && p.PropertyNo == query.PropertyNo && !p.MarkedForDeletion
                    && (query.PartitionNo == null || p.PartitionNo == query.PartitionNo))
                .Select(p => (int?)p.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (query.WingDetailsId is int wingDetailsId)
        {
            var wing = await _context.WingDetailsMast.AsNoTracking()
                .FirstOrDefaultAsync(w => w.Id == wingDetailsId, cancellationToken);
            if (wing is null)
            {
                return null;
            }

            return await _context.PropertyMast.AsNoTracking()
                    .Where(p => !p.MarkedForDeletion && p.WingDetailId == wingDetailsId)
                    .Select(p => (int?)p.Id)
                    .FirstOrDefaultAsync(cancellationToken)
                ?? await _context.SocietyDetailsMast.AsNoTracking()
                    .Where(s => s.Id == wing.SocietyDetailsMastId && s.PropertyId != null)
                    .Select(s => s.PropertyId)
                    .FirstOrDefaultAsync(cancellationToken);
        }

        if (query.SocietyId is int societyId)
        {
            return await _context.SocietyDetailsMast.AsNoTracking()
                .Where(s => s.Id == societyId && s.PropertyId != null)
                .Select(s => s.PropertyId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return null;
    }

    private async Task<List<int>> GetTargetPropertyIdsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken)
    {
        if (wingDetailId.HasValue)
        {
            return await _context.PropertyMast.AsNoTracking()
                .Where(pm => pm.WingDetailId == wingDetailId.Value && pm.IsActive && !pm.MarkedForDeletion)
                .Select(pm => pm.Id)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        var property = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.Id == propertyId && !p.MarkedForDeletion)
            .Select(p => new { p.Id, p.WardId, p.PropertyNo })
            .FirstOrDefaultAsync(cancellationToken);

        if (property is null)
        {
            return new List<int>();
        }

        return await _context.PropertyMast.AsNoTracking()
            .Where(pm => pm.WardId == property.WardId
                      && pm.PropertyNo == property.PropertyNo
                      && pm.IsActive
                      && !pm.MarkedForDeletion)
            .Select(pm => pm.Id)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    private async Task<(List<int> OpenFloorIds, List<int> OpenConstructionTypeIds, List<int> OpenTypeOfUseIds)> GetOpenPlotMasterIdsAsync(CancellationToken cancellationToken)
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
                c.TypeOfUseCategoryCode == NtisPlatform.Core.Constants.TypeOfUseConstants.Op))
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        var openTypeOfUseIds = await _context.TypeOfUse
            .AsNoTracking()
            .Where(t => t.IsActive && (
                (t.TypeOfUseCode != null && t.TypeOfUseCode.Trim().ToUpper() == "OP") ||
                (t.TypeOfUseCategoryId.HasValue && opCategoryIds.Contains(t.TypeOfUseCategoryId.Value)) ||
                (t.TypeOfUseCategory != null && t.TypeOfUseCategory.IsActive && (
                    t.TypeOfUseCategory.TypeOfUseCategoryCode == NtisPlatform.Core.Constants.TypeOfUseConstants.Op ||
                    t.TypeOfUseCategory.TypeOfUseCategoryCode == "OP" ||
                    t.TypeOfUseCategory.TypeOfUseCategoryCode == "OpenPlot"
                ))
            ))
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        return (openFloorIds, openConstructionTypeIds, openTypeOfUseIds);
    }

    public Task<(double? Ft, double? Mtr)> GetCarpetAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default)
        => GetCarpetAreaTotalsAsync(propertyId, null, cancellationToken);

    public async Task<(double? Ft, double? Mtr)> GetCarpetAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default)
    {
        var targetPropertyIds = await GetTargetPropertyIdsAsync(propertyId, wingDetailId, cancellationToken);
        if (targetPropertyIds.Count == 0)
        {
            return (null, null);
        }

        var (openFloorIds, openConstructionTypeIds, openTypeOfUseIds) = await GetOpenPlotMasterIdsAsync(cancellationToken);

        var result = await _context.PropertyDetails
            .AsNoTracking()
            .Where(d => targetPropertyIds.Contains(d.PropertyId)
                     && d.IsActive
                     && !d.MarkedForDeletion
                     && (!d.FloorId.HasValue || !openFloorIds.Contains(d.FloorId.Value))
                     && (!d.ConstructionTypeId.HasValue || !openConstructionTypeIds.Contains(d.ConstructionTypeId.Value))
                     && !openTypeOfUseIds.Contains(d.TypeOfUseId))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Ft = g.Sum(d => d.CarpetAreaSqFeet ?? 0),
                Mtr = g.Sum(d => d.CarpetAreaSqMeter ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return result is null ? (null, null) : (Math.Round(result.Ft, 2), Math.Round(result.Mtr, 2));
    }

    public Task<(double? Ft, double? Mtr)> GetBuiltUpAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default)
        => GetBuiltUpAreaTotalsAsync(propertyId, null, cancellationToken);

    public async Task<(double? Ft, double? Mtr)> GetBuiltUpAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default)
    {
        var targetPropertyIds = await GetTargetPropertyIdsAsync(propertyId, wingDetailId, cancellationToken);
        if (targetPropertyIds.Count == 0)
        {
            return (null, null);
        }

        var (openFloorIds, openConstructionTypeIds, openTypeOfUseIds) = await GetOpenPlotMasterIdsAsync(cancellationToken);

        var result = await _context.PropertyDetails
            .AsNoTracking()
            .Where(d => targetPropertyIds.Contains(d.PropertyId)
                     && d.IsActive
                     && !d.MarkedForDeletion
                     && (!d.FloorId.HasValue || !openFloorIds.Contains(d.FloorId.Value))
                     && (!d.ConstructionTypeId.HasValue || !openConstructionTypeIds.Contains(d.ConstructionTypeId.Value))
                     && !openTypeOfUseIds.Contains(d.TypeOfUseId))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Ft = g.Sum(d => d.BuiltupAreaSqFeet ?? 0),
                Mtr = g.Sum(d => d.BuiltupAreaSqMeter ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return result is null ? (null, null) : (Math.Round(result.Ft, 2), Math.Round(result.Mtr, 2));
    }

    public Task<(double? Ft, double? Mtr)> GetOldCarpetAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default)
        => GetOldCarpetAreaTotalsAsync(propertyId, null, cancellationToken);

    public async Task<(double? Ft, double? Mtr)> GetOldCarpetAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default)
    {
        var targetPropertyIds = await GetTargetPropertyIdsAsync(propertyId, wingDetailId, cancellationToken);
        if (targetPropertyIds.Count == 0)
        {
            return (null, null);
        }

        var mappedOldPropertyIds = await _context.PropertyMapDetails
            .AsNoTracking()
            .Where(pmd => pmd.PropertyIdNew != null
                       && targetPropertyIds.Contains(pmd.PropertyIdNew.Value)
                       && pmd.IsActive
                       && pmd.PropertyIdOld != null)
            .Select(pmd => pmd.PropertyIdOld!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (mappedOldPropertyIds.Count == 0)
        {
            return (null, null);
        }

        var (openFloorIds, openConstructionTypeIds, openTypeOfUseIds) = await GetOpenPlotMasterIdsAsync(cancellationToken);

        var result = await _context.PropertyDetailsOld
            .AsNoTracking()
            .Where(d => mappedOldPropertyIds.Contains(d.PropertyMastOldId)
                     && d.IsActive
                     && !d.MarkedForDeletion
                     && (!d.OldFloorId.HasValue || !openFloorIds.Contains(d.OldFloorId.Value))
                     && (!d.OldConstructionTypeId.HasValue || !openConstructionTypeIds.Contains(d.OldConstructionTypeId.Value))
                     && (!d.OldTypeOfUseId.HasValue || !openTypeOfUseIds.Contains(d.OldTypeOfUseId.Value)))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Ft = g.Sum(d => d.OldCarpetAreaSqFeet ?? 0),
                Mtr = g.Sum(d => d.OldCarpetAreaSqMeter ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return result is null ? (null, null) : (Math.Round(result.Ft, 2), Math.Round(result.Mtr, 2));
    }

    public Task<(double? Ft, double? Mtr)> GetOldBuiltUpAreaTotalsAsync(int propertyId, CancellationToken cancellationToken = default)
        => GetOldBuiltUpAreaTotalsAsync(propertyId, null, cancellationToken);

    public async Task<(double? Ft, double? Mtr)> GetOldBuiltUpAreaTotalsAsync(int propertyId, int? wingDetailId, CancellationToken cancellationToken = default)
    {
        var targetPropertyIds = await GetTargetPropertyIdsAsync(propertyId, wingDetailId, cancellationToken);
        if (targetPropertyIds.Count == 0)
        {
            return (null, null);
        }

        var mappedOldPropertyIds = await _context.PropertyMapDetails
            .AsNoTracking()
            .Where(pmd => pmd.PropertyIdNew != null
                       && targetPropertyIds.Contains(pmd.PropertyIdNew.Value)
                       && pmd.IsActive
                       && pmd.PropertyIdOld != null)
            .Select(pmd => pmd.PropertyIdOld!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (mappedOldPropertyIds.Count == 0)
        {
            return (null, null);
        }

        var (openFloorIds, openConstructionTypeIds, openTypeOfUseIds) = await GetOpenPlotMasterIdsAsync(cancellationToken);

        var result = await _context.PropertyDetailsOld
            .AsNoTracking()
            .Where(d => mappedOldPropertyIds.Contains(d.PropertyMastOldId)
                     && d.IsActive
                     && !d.MarkedForDeletion
                     && (!d.OldFloorId.HasValue || !openFloorIds.Contains(d.OldFloorId.Value))
                     && (!d.OldConstructionTypeId.HasValue || !openConstructionTypeIds.Contains(d.OldConstructionTypeId.Value))
                     && (!d.OldTypeOfUseId.HasValue || !openTypeOfUseIds.Contains(d.OldTypeOfUseId.Value)))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Ft = g.Sum(d => d.OldBuiltupAreaSqFeet ?? 0),
                Mtr = g.Sum(d => d.OldBuiltupAreaSqMeter ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return result is null ? (null, null) : (Math.Round(result.Ft, 2), Math.Round(result.Mtr, 2));
    }

    /// <summary>
    /// Gets the current tax, retrospective tax, pre-merge old current tax, and pending current tax details for the property.
    /// Uses TAXTOTAL tax code filter.
    /// Tax calculation scope for CurrentTax, RetroTax, OldCurrentTax, and PendingCurrent:
    /// - CASE 1 (Society Search): If wingDetailId is null and the property is a society (PartitionNo is null/empty or registered in SocietyDetailsMast),
    ///   calculates for all flats, wings, and units sharing the same WardId and PropertyNo.
    /// - CASE 2 (Wing Search): If wingDetailId is not null, calculates for all flats belonging to that wing only.
    /// - CASE 3 (Individual Property Search): If wingDetailId is null and the property is an individual flat/unit, calculates for only the selected property.
    /// </summary>
    public Task<(decimal? CurrentTax, decimal? RetroTax, decimal? OldCurrentTax, decimal? PendingCurrent)> GetAdditionalRevenueTaxDetailsAsync(
        int propertyId,
        CancellationToken cancellationToken = default)
        => GetAdditionalRevenueTaxDetailsAsync(propertyId, null, cancellationToken);

    public async Task<(decimal? CurrentTax, decimal? RetroTax, decimal? OldCurrentTax, decimal? PendingCurrent)> GetAdditionalRevenueTaxDetailsAsync(
        int propertyId,
        int? wingDetailId,
        CancellationToken cancellationToken = default)
    {
        var property = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.Id == propertyId && !p.MarkedForDeletion)
            .Select(p => new { p.Id, p.WardId, p.PropertyNo, p.PartitionNo })
            .FirstOrDefaultAsync(cancellationToken);

        if (property is null)
        {
            return (null, null, null, null);
        }

        IQueryable<int> targetPropertyIds;

        if (wingDetailId.HasValue)
        {
            // CASE 2: WING SEARCH
            // Calculate all flats belonging to that wing only
            targetPropertyIds = _context.PropertyMast.AsNoTracking()
                .Where(pm => pm.WingDetailId == wingDetailId.Value && pm.IsActive && !pm.MarkedForDeletion)
                .Select(pm => pm.Id)
                .Distinct();
        }
        else
        {
            var isSociety = string.IsNullOrWhiteSpace(property.PartitionNo)
                || await _context.SocietyDetailsMast.AsNoTracking()
                    .AnyAsync(sdm => sdm.PropertyId == propertyId && sdm.IsActive && !sdm.MarkedForDeletion, cancellationToken);

            if (isSociety)
            {
                // CASE 1: SOCIETY SEARCH
                // Calculate across all units/flats/wings sharing the same WardId and PropertyNo
                targetPropertyIds = _context.PropertyMast.AsNoTracking()
                    .Where(pm => pm.WardId == property.WardId
                              && pm.PropertyNo == property.PropertyNo
                              && pm.IsActive
                              && !pm.MarkedForDeletion)
                    .Select(pm => pm.Id)
                    .Distinct();
            }
            else
            {
                // CASE 3: INDIVIDUAL PROPERTY / FLAT SEARCH
                // Calculate only the selected property
                targetPropertyIds = _context.PropertyMast.AsNoTracking()
                    .Where(pm => pm.Id == propertyId && pm.IsActive && !pm.MarkedForDeletion)
                    .Select(pm => pm.Id);
            }
        }

        // Resolve current finance year to filter pending demand / retro demand (FinanceYear < current finance year)
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

        // NETTAX policy only -- OC/CC/ElectricBill (certificate-driven, retro-eligible policy
        // codes) and OLD_ARREARS must not be summed here; they flow into RetroTax/PendingCurrent
        // below instead, so including them would double-count them into "current tax".
        //
        // Must NOT trust the reserved "TaxTotal"/"TAXTOTAL" sentinel row's own stored value: per
        // PropertyRepository.cs's identical exclusion, that write path does not keep the sentinel
        // reliably in sync, so it can sit at a stale 0 while the real NETTAX components are
        // current -- CurrentTax is therefore always the sum of the real (non-sentinel) components.
        var currentTax = await (
            from ptd in _context.PolicyTaxDetails.AsNoTracking()
            join pcm in _context.PolicyCodeMaster.AsNoTracking() on ptd.PolicyCodeId equals pcm.Id
            join tx in _context.TaxMaster.AsNoTracking() on ptd.TaxId equals tx.Id
            where targetPropertyIds.Contains(ptd.PropertyId)
                  && pcm.PolicyCode == NtisPlatform.Core.Constants.PolicyCodes.NetTax
                  && (tx.TaxCode == null || tx.TaxCode.Replace(" ", "").Trim().ToUpper() != "TAXTOTAL")
                  && (tx.TaxName == null || tx.TaxName.Replace(" ", "").Trim().ToUpper() != "TAXTOTAL")
                  && ptd.IsActive
                  && !ptd.MarkedForDeletion
                  && ptd.IsCurrent
            select (decimal?)ptd.TaxAmount
        ).SumAsync(cancellationToken);

        var retroTax = await (
            from tm in _context.TransMast.AsNoTracking()
            join ym in _context.YearMaster.AsNoTracking() on tm.FinanceYearId equals ym.Id into ymj
            from ym in ymj.DefaultIfEmpty()
            join pcm in _context.PolicyCodeMaster.AsNoTracking() on tm.PolicyCodeId equals pcm.Id
            join tx in _context.TaxMaster.AsNoTracking() on tm.TaxId equals tx.Id
            where targetPropertyIds.Contains(tm.PropertyId)
                  && tx.TaxCode != null && tx.TaxCode.Trim().ToUpper() == "TAXTOTAL"
                  && pcm.IsRetroDemand
                  && tm.IsActive
                  && !tm.MarkedForDeletion
                  && (ym == null || ym.Year == 0 || ym.Year < currentAssessmentYear)
            select (decimal?)tm.TaxAmount
        ).SumAsync(cancellationToken);

        var pendingCurrent = await (
            from tm in _context.TransMast.AsNoTracking()
            join ym in _context.YearMaster.AsNoTracking() on tm.FinanceYearId equals ym.Id into ymj
            from ym in ymj.DefaultIfEmpty()
            join pcm in _context.PolicyCodeMaster.AsNoTracking() on tm.PolicyCodeId equals pcm.Id
            join tx in _context.TaxMaster.AsNoTracking() on tm.TaxId equals tx.Id
            where targetPropertyIds.Contains(tm.PropertyId)
                  && pcm.PolicyCode == "OLD_ARREARS"
                  && tx.TaxCode != null && tx.TaxCode.Trim().ToUpper() == "TAXTOTAL"
                  && tm.IsActive
                  && !tm.MarkedForDeletion
                  && (ym == null || ym.Year == 0 || ym.Year < currentAssessmentYear)
            select (decimal?)tm.TaxAmount
        ).SumAsync(cancellationToken);

        // Get oldCurrentTax from PropertyMastOld.OldTotalTax for pre-merge properties
        var mappedOldPropertyIds = await _context.PropertyMapDetails.AsNoTracking()
            .Where(pmd => pmd.PropertyIdNew != null
                       && targetPropertyIds.Contains(pmd.PropertyIdNew.Value)
                       && pmd.IsActive
                       && pmd.PropertyIdOld != null)
            .Select(pmd => pmd.PropertyIdOld!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        var oldCurrentTax = mappedOldPropertyIds.Count > 0
            ? await (
                from pmo in _context.PropertyMastOld.AsNoTracking()
                where mappedOldPropertyIds.Contains(pmo.Id)
                      && pmo.IsActive
                      && !pmo.MarkedForDeletion
                select (decimal?)(decimal)(pmo.OldTotalTax ?? 0)
            ).SumAsync(cancellationToken)
            : 0m;

        return (currentTax, retroTax, oldCurrentTax, pendingCurrent);
    }

    public async Task<List<SocietyWingSummaryDto>> GetSocietyWingsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        // 1. Resolve societyId in a single step (direct property link with fallback to wing link)
        var societyId = await _context.SocietyDetailsMast
            .AsNoTracking()
            .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
            .OrderByDescending(s => s.CreatedDate)
            .Select(s => (int?)s.Id)
            .FirstOrDefaultAsync(cancellationToken)
            ?? await (from pm in _context.PropertyMast.AsNoTracking()
                      join w in _context.WingDetailsMast.AsNoTracking() on pm.WingDetailId equals w.Id
                      where pm.Id == propertyId && !pm.MarkedForDeletion && w.IsActive && !w.MarkedForDeletion
                      select (int?)w.SocietyDetailsMastId).FirstOrDefaultAsync(cancellationToken);

        if (societyId is null)
        {
            return new List<SocietyWingSummaryDto>();
        }

        return await _context.WingDetailsMast
            .AsNoTracking()
            .Where(w => w.SocietyDetailsMastId == societyId.Value && w.IsActive && !w.MarkedForDeletion)
            .OrderBy(w => w.WingName)
            .Select(w => new SocietyWingSummaryDto
            {
                WingDetailId = w.Id,
                WingMasterId = w.WingMasterId,
                WingName = w.WingName,
                SecretaryName = w.SecretaryName,
                SecretaryNameEnglish = w.SecretaryNameEnglish,
                SecretaryMobileNo = w.SecretaryMobileNo,
                SecretaryEmailId = w.SecretaryEmailId,
                ManagerName = w.ManagerName,
                ManagerNameEnglish = w.ManagerNameEnglish,
                ManagerMobileNo = w.ManagerMobileNo,
                ManagerEmailId = w.ManagerEmailId
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<PropertyTypeCountSummaryDto> GetPropertyTypeCountsAsync(
        int propertyId,
        int? wingDetailId = null,
        CancellationToken cancellationToken = default)
    {
        var property = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.Id == propertyId && !p.MarkedForDeletion)
            .Select(p => new { p.Id, p.WardId, p.PropertyNo, p.PartitionNo, p.WingDetailId })
            .FirstOrDefaultAsync(cancellationToken);

        if (property is null)
        {
            return new PropertyTypeCountSummaryDto();
        }

        IQueryable<NtisPlatform.Core.Entities.PropertyEntity> targetPropertiesQuery;

        if (wingDetailId.HasValue)
        {
            // CASE 2: WING SEARCH
            targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                .Where(pm => pm.WingDetailId == wingDetailId.Value && pm.IsActive && !pm.MarkedForDeletion);
        }
        else
        {
            var isSociety = string.IsNullOrWhiteSpace(property.PartitionNo)
                || await _context.SocietyDetailsMast.AsNoTracking()
                    .AnyAsync(sdm => sdm.PropertyId == propertyId && sdm.IsActive && !sdm.MarkedForDeletion, cancellationToken);

            if (isSociety)
            {
                // CASE 1: SOCIETY SEARCH - all properties sharing the same WardId and PropertyNo (including root society, wings, flats, and amenities)
                targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                    .Where(pm => pm.WardId == property.WardId
                              && pm.PropertyNo == property.PropertyNo
                              && pm.IsActive
                              && !pm.MarkedForDeletion);
            }
            else
            {
                // CASE 3: INDIVIDUAL FLAT SEARCH
                // If the flat has a WingDetailId, show counts for that particular wing;
                // otherwise show counts across the property group (WardId + PropertyNo).
                if (property.WingDetailId.HasValue)
                {
                    targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                        .Where(pm => pm.WingDetailId == property.WingDetailId.Value && pm.IsActive && !pm.MarkedForDeletion);
                }
                else
                {
                    targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                        .Where(pm => pm.WardId == property.WardId
                                  && pm.PropertyNo == property.PropertyNo
                                  && pm.IsActive
                                  && !pm.MarkedForDeletion);
                }
            }
        }

        var propertiesWithTypes = await (
            from pm in targetPropertiesQuery
            join ptm in _context.PropertyTypeMasters.AsNoTracking() on pm.PropertyTypeId equals ptm.Id into ptmj
            from ptm in ptmj.DefaultIfEmpty()
            select new
            {
                pm.Id,
                PropertyType = pm.Type,
                MasterType = ptm != null ? ptm.Type : null,
                PartType = ptm != null ? ptm.PartType : null,
                PropertyDescription = ptm != null ? ptm.PropertyDescription : null
            }
        ).ToListAsync(cancellationToken);

        int residential = 0;
        int commercial = 0;
        int amenity = 0;

        var distinctProps = propertiesWithTypes.DistinctBy(p => p.Id).ToList();
        var total = distinctProps.Count;

        foreach (var p in distinctProps)
        {
            var partType = p.PartType?.Trim() ?? string.Empty;
            var desc = p.PropertyDescription?.Trim() ?? string.Empty;
            var type = (!string.IsNullOrWhiteSpace(p.MasterType) ? p.MasterType : p.PropertyType)?.Trim() ?? string.Empty;

            var isAnivasi = desc.Contains("अनिवासी", StringComparison.OrdinalIgnoreCase)
                || desc.Contains("anivasi", StringComparison.OrdinalIgnoreCase)
                || partType.Contains("अनिवासी", StringComparison.OrdinalIgnoreCase)
                || partType.Contains("anivasi", StringComparison.OrdinalIgnoreCase)
                || type.Contains("अनिवासी", StringComparison.OrdinalIgnoreCase)
                || type.Contains("anivasi", StringComparison.OrdinalIgnoreCase);

            if (partType.Equals("Amenity", StringComparison.OrdinalIgnoreCase)
                || desc.Contains("Amenity", StringComparison.OrdinalIgnoreCase)
                || desc.Contains("अॅमिनीटी")
                || desc.Contains("अ‍ॅमिनीटी")
                || type.Equals("Amenity", StringComparison.OrdinalIgnoreCase))
            {
                amenity++;
            }
            else if (isAnivasi)
            {
                commercial++;
            }
            else if (type.Equals("R", StringComparison.OrdinalIgnoreCase)
                     || type.Equals("N", StringComparison.OrdinalIgnoreCase)
                     || type.Equals("Residential", StringComparison.OrdinalIgnoreCase)
                     || partType.Equals("R", StringComparison.OrdinalIgnoreCase)
                     || partType.Contains("Residential", StringComparison.OrdinalIgnoreCase)
                     || desc.Contains("Residential", StringComparison.OrdinalIgnoreCase)
                     || desc.Contains("निवासी", StringComparison.OrdinalIgnoreCase)
                     || desc.Contains("nivasi", StringComparison.OrdinalIgnoreCase)
                     || partType.Contains("निवासी", StringComparison.OrdinalIgnoreCase)
                     || partType.Contains("nivasi", StringComparison.OrdinalIgnoreCase)
                     || type.Contains("निवासी", StringComparison.OrdinalIgnoreCase)
                     || type.Contains("nivasi", StringComparison.OrdinalIgnoreCase))
            {
                residential++;
            }
            else
            {
                commercial++;
            }
        }

        return new PropertyTypeCountSummaryDto
        {
            Total = total,
            Residential = residential,
            Commercial = commercial,
            Amenity = amenity
        };
    }

    public async Task<string?> GetTotalFloorAsync(
        int propertyId,
        int? wingDetailId = null,
        CancellationToken cancellationToken = default)
    {
        var property = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.Id == propertyId && !p.MarkedForDeletion)
            .Select(p => new { p.Id, p.WardId, p.PropertyNo, p.PartitionNo, p.WingDetailId })
            .FirstOrDefaultAsync(cancellationToken);

        if (property is null)
        {
            return null;
        }

        IQueryable<NtisPlatform.Core.Entities.PropertyEntity> targetPropertiesQuery;

        if (wingDetailId.HasValue)
        {
            // CASE 2: WING SEARCH
            targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                .Where(pm => pm.WingDetailId == wingDetailId.Value && pm.IsActive && !pm.MarkedForDeletion);
        }
        else
        {
            var isSociety = string.IsNullOrWhiteSpace(property.PartitionNo)
                || await _context.SocietyDetailsMast.AsNoTracking()
                    .AnyAsync(sdm => sdm.PropertyId == propertyId && sdm.IsActive && !sdm.MarkedForDeletion, cancellationToken);

            if (isSociety)
            {
                // CASE 1: SOCIETY SEARCH - all units across all wings in the building
                var hasWings = await _context.PropertyMast.AsNoTracking()
                    .AnyAsync(pm => pm.WardId == property.WardId
                                 && pm.PropertyNo == property.PropertyNo
                                 && pm.WingDetailId != null
                                 && pm.IsActive
                                 && !pm.MarkedForDeletion, cancellationToken);

                if (hasWings)
                {
                    targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                        .Where(pm => pm.WardId == property.WardId
                                  && pm.PropertyNo == property.PropertyNo
                                  && pm.WingDetailId != null
                                  && pm.IsActive
                                  && !pm.MarkedForDeletion);
                }
                else
                {
                    targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                        .Where(pm => pm.WardId == property.WardId
                                  && pm.PropertyNo == property.PropertyNo
                                  && pm.IsActive
                                  && !pm.MarkedForDeletion);
                }
            }
            else
            {
                // CASE 3: INDIVIDUAL FLAT SEARCH
                if (property.WingDetailId.HasValue)
                {
                    targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                        .Where(pm => pm.WingDetailId == property.WingDetailId.Value && pm.IsActive && !pm.MarkedForDeletion);
                }
                else
                {
                    targetPropertiesQuery = _context.PropertyMast.AsNoTracking()
                        .Where(pm => pm.WardId == property.WardId
                                  && pm.PropertyNo == property.PropertyNo
                                  && pm.IsActive
                                  && !pm.MarkedForDeletion);
                }
            }
        }

        var maxSequence = await (
            from pd in _context.PropertyDetails.AsNoTracking()
            join pm in targetPropertiesQuery on pd.PropertyId equals pm.Id
            join fm in _context.FloorEntity.AsNoTracking() on pd.FloorId equals fm.Id
            where pd.IsActive && !pd.MarkedForDeletion && fm.IsActive
            select (int?)fm.SequenceNo
        ).MaxAsync(cancellationToken);

        if (maxSequence.HasValue && maxSequence.Value > 0)
        {
            return $"G+{maxSequence.Value}";
        }

        // Fallback: check numeric FloorCode if SequenceNo wasn't populated
        var floorCodes = await (
            from pd in _context.PropertyDetails.AsNoTracking()
            join pm in targetPropertiesQuery on pd.PropertyId equals pm.Id
            join fm in _context.FloorEntity.AsNoTracking() on pd.FloorId equals fm.Id
            where pd.IsActive && !pd.MarkedForDeletion && fm.IsActive && fm.FloorCode != null
            select fm.FloorCode
        ).ToListAsync(cancellationToken);

        var parsedMax = floorCodes
            .Select(fc => int.TryParse(fc, out var n) ? (int?)n : null)
            .Where(n => n.HasValue)
            .Max(n => n);

        if (parsedMax.HasValue && parsedMax.Value > 0)
        {
            return $"G+{parsedMax.Value}";
        }

        var hasAnyFloor = await (
            from pd in _context.PropertyDetails.AsNoTracking()
            join pm in targetPropertiesQuery on pd.PropertyId equals pm.Id
            where pd.IsActive && !pd.MarkedForDeletion && pd.FloorId != null
            select pd.FloorId
        ).AnyAsync(cancellationToken);

        return hasAnyFloor ? "G" : null;
    }


    public async Task<TopSectionUpdateOutcome> UpdateTopSectionAsync(
        int propertyId,
        UpdateApartmentQcTopSectionDto dto,
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
        if (dto.OwnerName != null) property.OwnerName = dto.OwnerName.Trim();
        if (dto.OwnerNameEnglish != null) property.OwnerNameEnglish = dto.OwnerNameEnglish.Trim();
        if (dto.OwnerTitle != null) property.OwnerTitle = dto.OwnerTitle.Trim();
        if (dto.OwnerTitleEnglish != null) property.OwnerTitleEnglish = dto.OwnerTitleEnglish.Trim();
        if (dto.OccupierName != null) property.OccupierName = dto.OccupierName.Trim();
        if (dto.OccupierNameEnglish != null) property.OccupierNameEnglish = dto.OccupierNameEnglish.Trim();
        if (dto.OccupierTitle != null) property.OccupierTitle = dto.OccupierTitle.Trim();
        if (dto.OccupierTitleEnglish != null) property.OccupierTitleEnglish = dto.OccupierTitleEnglish.Trim();
        if (dto.MobileNo != null) property.MobileNo = dto.MobileNo.Trim();
        if (dto.AlternateMobileNo != null) property.AlternateMobileNo = dto.AlternateMobileNo.Trim();
        if (dto.EmailId != null) property.EmailId = dto.EmailId.Trim();
        if (dto.Address != null) property.Address = dto.Address.Trim();
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
                var newAssessment = new NtisPlatform.Core.Entities.PropertyAssessmentEntity
                {
                    PropertyId = propertyId,
                    AdharCardNo = dto.AadharNo?.Trim(),
                    OwnerTypeId = dto.OwnerTypeId,
                    IsActive = true,
                    CreatedBy = updatedBy,
                    CreatedDate = now
                };
                _context.PropertyMastDetails.Add(newAssessment);
            }
        }

        // 3. Update SocietyDetailsMast & cascade to WingDetailsMast
        var hasSecretaryUpdates = dto.SecretaryName != null ||
                                  dto.SecretaryNameEnglish != null ||
                                  dto.SecretaryMobileNo != null ||
                                  dto.SecretaryEmailId != null;

        var hasManagerUpdates = dto.ManagerName != null ||
                                dto.ManagerNameEnglish != null ||
                                dto.ManagerMobileNo != null ||
                                dto.ManagerEmailId != null;

        var hasAdministrativeUpdates = hasSecretaryUpdates || hasManagerUpdates;
        var hasSocietyUpdates = hasAdministrativeUpdates
                                || dto.SocietyName != null
                                || dto.SocietyNameEnglish != null
                                || dto.SocietyAddress != null
                                || dto.SocietyAddressEnglish != null
                                || dto.SocietyEmailId != null
                                || dto.LandOwnerName != null
                                || dto.LandOwnerNameEnglish != null
                                || dto.BuilderName != null
                                || dto.BuilderNameEnglish != null
                                || dto.BuilderMobileNo != null;

        if (hasSocietyUpdates)
        {
            var society = await _context.SocietyDetailsMast
                .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
                .OrderByDescending(s => s.CreatedDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (society != null)
            {
                if (dto.SocietyName != null) society.SocietyName = dto.SocietyName.Trim();
                if (dto.SocietyNameEnglish != null) society.SocietyNameEnglish = dto.SocietyNameEnglish.Trim();
                if (dto.SocietyAddress != null) society.SocietyAddress = dto.SocietyAddress.Trim();
                if (dto.SocietyAddressEnglish != null) society.SocietyAddressEnglish = dto.SocietyAddressEnglish.Trim();
                if (dto.SocietyEmailId != null) society.SocietyEmailId = dto.SocietyEmailId.Trim();
                if (dto.LandOwnerName != null) society.LandOwnerName = dto.LandOwnerName.Trim();
                if (dto.LandOwnerNameEnglish != null) society.LandOwnerNameEnglish = dto.LandOwnerNameEnglish.Trim();
                if (dto.BuilderName != null) society.BuilderName = dto.BuilderName.Trim();
                if (dto.BuilderNameEnglish != null) society.BuilderNameEnglish = dto.BuilderNameEnglish.Trim();
                if (dto.BuilderMobileNo != null) society.BuilderMobileNo = dto.BuilderMobileNo.Trim();
                if (dto.SecretaryName != null) society.SecretaryName = dto.SecretaryName.Trim();
                if (dto.SecretaryNameEnglish != null) society.SecretaryNameEnglish = dto.SecretaryNameEnglish.Trim();
                if (dto.SecretaryMobileNo != null) society.SecretaryMobileNo = dto.SecretaryMobileNo.Trim();
                if (dto.SecretaryEmailId != null) society.SecretaryEmailId = dto.SecretaryEmailId.Trim();
                if (dto.ManagerName != null) society.ManagerName = dto.ManagerName.Trim();
                if (dto.ManagerNameEnglish != null) society.ManagerNameEnglish = dto.ManagerNameEnglish.Trim();
                if (dto.ManagerMobileNo != null) society.ManagerMobileNo = dto.ManagerMobileNo.Trim();
                if (dto.ManagerEmailId != null) society.ManagerEmailId = dto.ManagerEmailId.Trim();
                society.UpdatedBy = updatedBy;
                society.UpdatedDate = now;

                // Sync parent property address if PartitionNo is empty
                if (string.IsNullOrWhiteSpace(property.PartitionNo))
                {
                    if (dto.SocietyAddress != null && dto.Address == null) property.Address = dto.SocietyAddress.Trim();
                    if (dto.SocietyAddressEnglish != null && dto.AddressEnglish == null) property.AddressEnglish = dto.SocietyAddressEnglish.Trim();
                }

                // 4. Cascade to selected child wings (independently for Secretary and Manager)
                var secretaryWingIds = dto.SecretaryTargetWingDetailIds;
                var managerWingIds = dto.ManagerTargetWingDetailIds;

                var allTargetWingIds = (secretaryWingIds ?? Enumerable.Empty<int>())
                    .Union(managerWingIds ?? Enumerable.Empty<int>())
                    .Distinct()
                    .ToList();

                if (allTargetWingIds.Count > 0)
                {
                    var targetWings = await _context.WingDetailsMast
                        .Where(w => w.SocietyDetailsMastId == society.Id
                                    && allTargetWingIds.Contains(w.Id)
                                    && w.IsActive
                                    && !w.MarkedForDeletion)
                        .ToListAsync(cancellationToken);

                    foreach (var wing in targetWings)
                    {
                        var appliesToSecretary = hasSecretaryUpdates && (secretaryWingIds?.Contains(wing.Id) == true);
                        var appliesToManager = hasManagerUpdates && (managerWingIds?.Contains(wing.Id) == true);

                        if (appliesToSecretary)
                        {
                            if (dto.SecretaryName != null) wing.SecretaryName = dto.SecretaryName.Trim();
                            if (dto.SecretaryNameEnglish != null) wing.SecretaryNameEnglish = dto.SecretaryNameEnglish.Trim();
                            if (dto.SecretaryMobileNo != null) wing.SecretaryMobileNo = dto.SecretaryMobileNo.Trim();
                            if (dto.SecretaryEmailId != null) wing.SecretaryEmailId = dto.SecretaryEmailId.Trim();
                        }

                        if (appliesToManager)
                        {
                            if (dto.ManagerName != null) wing.ManagerName = dto.ManagerName.Trim();
                            if (dto.ManagerNameEnglish != null) wing.ManagerNameEnglish = dto.ManagerNameEnglish.Trim();
                            if (dto.ManagerMobileNo != null) wing.ManagerMobileNo = dto.ManagerMobileNo.Trim();
                            if (dto.ManagerEmailId != null) wing.ManagerEmailId = dto.ManagerEmailId.Trim();
                        }

                        if (appliesToSecretary || appliesToManager)
                        {
                            wing.UpdatedBy = updatedBy;
                            wing.UpdatedDate = now;
                        }
                    }
                }
            }
            else
            {
                var newSociety = new NtisPlatform.Core.Entities.SocietyDetailsEntity
                {
                    PropertyId = propertyId,
                    SocietyName = dto.SocietyName?.Trim(),
                    SocietyNameEnglish = dto.SocietyNameEnglish?.Trim(),
                    SocietyAddress = dto.SocietyAddress?.Trim(),
                    SocietyAddressEnglish = dto.SocietyAddressEnglish?.Trim(),
                    SocietyEmailId = dto.SocietyEmailId?.Trim(),
                    LandOwnerName = dto.LandOwnerName?.Trim(),
                    LandOwnerNameEnglish = dto.LandOwnerNameEnglish?.Trim(),
                    BuilderName = dto.BuilderName?.Trim(),
                    BuilderNameEnglish = dto.BuilderNameEnglish?.Trim(),
                    BuilderMobileNo = dto.BuilderMobileNo?.Trim(),
                    SecretaryName = dto.SecretaryName?.Trim(),
                    SecretaryNameEnglish = dto.SecretaryNameEnglish?.Trim(),
                    SecretaryMobileNo = dto.SecretaryMobileNo?.Trim(),
                    SecretaryEmailId = dto.SecretaryEmailId?.Trim(),
                    ManagerName = dto.ManagerName?.Trim(),
                    ManagerNameEnglish = dto.ManagerNameEnglish?.Trim(),
                    ManagerMobileNo = dto.ManagerMobileNo?.Trim(),
                    ManagerEmailId = dto.ManagerEmailId?.Trim(),
                    IsActive = true,
                    CreatedBy = updatedBy,
                    CreatedDate = now
                };
                _context.SocietyDetailsMast.Add(newSociety);

                if (string.IsNullOrWhiteSpace(property.PartitionNo))
                {
                    if (dto.SocietyAddress != null && dto.Address == null) property.Address = dto.SocietyAddress.Trim();
                    if (dto.SocietyAddressEnglish != null && dto.AddressEnglish == null) property.AddressEnglish = dto.SocietyAddressEnglish.Trim();
                }
            }

            // 5. Cascade updated society address to all child flats/units in this society
            var hasAddressUpdate = dto.SocietyAddress != null || dto.SocietyAddressEnglish != null
                || (string.IsNullOrWhiteSpace(property.PartitionNo) && (dto.Address != null || dto.AddressEnglish != null));

            if (hasAddressUpdate)
            {
                var effectiveSocietyAddress = dto.SocietyAddress?.Trim()
                    ?? (society != null ? society.SocietyAddress : null)
                    ?? (string.IsNullOrWhiteSpace(property.PartitionNo) ? property.Address : null);

                var effectiveSocietyAddressEnglish = dto.SocietyAddressEnglish?.Trim()
                    ?? (society != null ? society.SocietyAddressEnglish : null)
                    ?? (string.IsNullOrWhiteSpace(property.PartitionNo) ? property.AddressEnglish : null);

                var societyWingIds = society != null
                    ? await _context.WingDetailsMast
                        .Where(w => w.SocietyDetailsMastId == society.Id && w.IsActive && !w.MarkedForDeletion)
                        .Select(w => w.Id)
                        .ToListAsync(cancellationToken)
                    : new List<int>();

                // Identify properties that have their own DIFFERENT active society row (must NOT be touched)
                var otherSocietyPropertyIds = society != null
                    ? await _context.SocietyDetailsMast
                        .Where(s => s.Id != society.Id && s.PropertyId.HasValue && s.IsActive && !s.MarkedForDeletion)
                        .Select(s => s.PropertyId!.Value)
                        .ToListAsync(cancellationToken)
                    : new List<int>();

                // Category guard: Identify apartment categories vs non-apartment categories
                var apartmentCategoryIds = await _context.PropertyCategoryMaster
                    .AsNoTracking()
                    .Where(pcm => NtisPlatform.Core.Constants.PropertyCategoryConstants.ApartmentCategoryNames.Contains(pcm.PropertyCategoryName) && pcm.IsActive)
                    .Select(pcm => pcm.Id)
                    .ToListAsync(cancellationToken);

                var nonApartmentCategoryIds = await _context.PropertyCategoryMaster
                    .AsNoTracking()
                    .Where(pcm => !NtisPlatform.Core.Constants.PropertyCategoryConstants.ApartmentCategoryNames.Contains(pcm.PropertyCategoryName) && pcm.IsActive)
                    .Select(pcm => pcm.Id)
                    .ToListAsync(cancellationToken);

                var candidateUnits = await _context.PropertyMast
                    .Where(p => p.Id != propertyId
                        && p.IsActive
                        && !p.MarkedForDeletion
                        && (
                            (societyWingIds.Count > 0 && p.WingDetailId.HasValue && societyWingIds.Contains(p.WingDetailId.Value))
                            || (p.WardId == property.WardId && p.PropertyNo == property.PropertyNo && !string.IsNullOrWhiteSpace(p.PartitionNo))
                        ))
                    .ToListAsync(cancellationToken);

                var childUnits = candidateUnits
                    .Where(p =>
                    {
                        if (otherSocietyPropertyIds.Contains(p.Id))
                            return false;

                        if (p.CategoryId.HasValue && nonApartmentCategoryIds.Contains(p.CategoryId.Value))
                            return false;

                        if (p.WingDetailId.HasValue && !societyWingIds.Contains(p.WingDetailId.Value))
                            return false;

                        if (p.WingDetailId.HasValue && societyWingIds.Contains(p.WingDetailId.Value))
                            return true;

                        if (apartmentCategoryIds.Count > 0 && p.CategoryId.HasValue && !apartmentCategoryIds.Contains(p.CategoryId.Value))
                            return false;

                        return p.WardId == property.WardId && p.PropertyNo == property.PropertyNo && !string.IsNullOrWhiteSpace(p.PartitionNo);
                    })
                    .ToList();

                if (childUnits.Count > 0)
                {
                    var childWingIds = childUnits
                        .Where(u => u.WingDetailId.HasValue)
                        .Select(u => u.WingDetailId!.Value)
                        .Distinct()
                        .ToList();

                    var wingNamesMap = childWingIds.Count > 0
                        ? await _context.WingDetailsMast
                            .AsNoTracking()
                            .Where(w => childWingIds.Contains(w.Id) && w.IsActive && !w.MarkedForDeletion)
                            .ToDictionaryAsync(w => w.Id, w => w.WingName, cancellationToken)
                        : new Dictionary<int, string?>();

                    var shouldUpdateRegional = dto.SocietyAddress != null || (string.IsNullOrWhiteSpace(property.PartitionNo) && dto.Address != null);
                    var shouldUpdateEnglish = dto.SocietyAddressEnglish != null || (string.IsNullOrWhiteSpace(property.PartitionNo) && dto.AddressEnglish != null);

                    foreach (var unit in childUnits)
                    {
                        var wingName = unit.WingDetailId.HasValue && wingNamesMap.TryGetValue(unit.WingDetailId.Value, out var wn)
                            ? wn
                            : null;

                        if (shouldUpdateRegional && effectiveSocietyAddress != null)
                        {
                            var flatPart = !string.IsNullOrWhiteSpace(unit.FlatOrShopName) ? unit.FlatOrShopName : unit.FlatOrShopNo;
                            unit.Address = BuildUnitAddress(flatPart, wingName, effectiveSocietyAddress);
                        }

                        if (shouldUpdateEnglish && effectiveSocietyAddressEnglish != null)
                        {
                            var flatPartEnglish = !string.IsNullOrWhiteSpace(unit.FlatOrShopNameEnglish)
                                ? unit.FlatOrShopNameEnglish
                                : (!string.IsNullOrWhiteSpace(unit.FlatOrShopNoEnglish)
                                    ? unit.FlatOrShopNoEnglish
                                    : (!string.IsNullOrWhiteSpace(unit.FlatOrShopName) ? unit.FlatOrShopName : unit.FlatOrShopNo));

                            unit.AddressEnglish = BuildUnitAddress(flatPartEnglish, wingName, effectiveSocietyAddressEnglish);
                        }

                        unit.UpdatedBy = updatedBy;
                        unit.UpdatedDate = now;
                    }
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return TopSectionUpdateOutcome.Success;
    }

    public async Task<TopSectionUpdateOutcome> UpdateWingDetailsAsync(
        int wingDetailId,
        UpdateApartmentQcWingDetailsDto dto,
        int updatedBy,
        CancellationToken cancellationToken = default)
    {
        var wing = await _context.WingDetailsMast
            .FirstOrDefaultAsync(w => w.Id == wingDetailId && w.IsActive && !w.MarkedForDeletion, cancellationToken);

        if (wing is null)
        {
            return TopSectionUpdateOutcome.WingNotFound;
        }

        var isLocked = await (
            from s in _context.SocietyDetailsMast.AsNoTracking()
            join l in _context.PropertyScreenLocks.AsNoTracking() on s.PropertyId equals l.PropertyId
            where s.Id == wing.SocietyDetailsMastId && s.IsActive && !s.MarkedForDeletion
                  && l.IsLocked && l.IsActive && !l.MarkedForDeletion
            select l.Id
        ).AnyAsync(cancellationToken);

        if (isLocked)
        {
            return TopSectionUpdateOutcome.PropertyLocked;
        }

        var now = DateTime.Now;

        if (dto.WingName != null)
        {
            var trimmedWingName = dto.WingName.Trim();
            var wingNameChanged = wing.WingName != trimmedWingName;
            wing.WingName = trimmedWingName;

            if (wingNameChanged)
            {
                var society = await _context.SocietyDetailsMast
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == wing.SocietyDetailsMastId && s.IsActive && !s.MarkedForDeletion, cancellationToken);

                var wingFlats = await _context.PropertyMast
                    .Where(p => p.WingDetailId == wingDetailId && p.IsActive && !p.MarkedForDeletion)
                    .ToListAsync(cancellationToken);

                var effectiveSocietyAddress = !string.IsNullOrWhiteSpace(society?.SocietyAddress)
                    ? society!.SocietyAddress
                    : (society?.PropertyId != null
                        ? await _context.PropertyMast.AsNoTracking()
                            .Where(p => p.Id == society.PropertyId.Value && p.IsActive && !p.MarkedForDeletion)
                            .Select(p => p.Address)
                            .FirstOrDefaultAsync(cancellationToken)
                        : null);

                var effectiveSocietyAddressEnglish = !string.IsNullOrWhiteSpace(society?.SocietyAddressEnglish)
                    ? society!.SocietyAddressEnglish
                    : (society?.PropertyId != null
                        ? await _context.PropertyMast.AsNoTracking()
                            .Where(p => p.Id == society.PropertyId.Value && p.IsActive && !p.MarkedForDeletion)
                            .Select(p => p.AddressEnglish)
                            .FirstOrDefaultAsync(cancellationToken)
                        : null);

                foreach (var flat in wingFlats)
                {
                    if (!string.IsNullOrWhiteSpace(effectiveSocietyAddress))
                    {
                        var flatPart = !string.IsNullOrWhiteSpace(flat.FlatOrShopName) ? flat.FlatOrShopName : flat.FlatOrShopNo;
                        flat.Address = BuildUnitAddress(flatPart, trimmedWingName, effectiveSocietyAddress);
                    }

                    if (!string.IsNullOrWhiteSpace(effectiveSocietyAddressEnglish))
                    {
                        var flatPartEnglish = !string.IsNullOrWhiteSpace(flat.FlatOrShopNameEnglish)
                            ? flat.FlatOrShopNameEnglish
                            : (!string.IsNullOrWhiteSpace(flat.FlatOrShopNoEnglish)
                                ? flat.FlatOrShopNoEnglish
                                : (!string.IsNullOrWhiteSpace(flat.FlatOrShopName) ? flat.FlatOrShopName : flat.FlatOrShopNo));

                        flat.AddressEnglish = BuildUnitAddress(flatPartEnglish, trimmedWingName, effectiveSocietyAddressEnglish);
                    }

                    flat.UpdatedBy = updatedBy;
                    flat.UpdatedDate = now;
                }
            }
        }
        if (dto.SecretaryName != null) wing.SecretaryName = dto.SecretaryName.Trim();
        if (dto.SecretaryNameEnglish != null) wing.SecretaryNameEnglish = dto.SecretaryNameEnglish.Trim();
        if (dto.SecretaryMobileNo != null) wing.SecretaryMobileNo = dto.SecretaryMobileNo.Trim();
        if (dto.SecretaryEmailId != null) wing.SecretaryEmailId = dto.SecretaryEmailId.Trim();
        if (dto.ManagerName != null) wing.ManagerName = dto.ManagerName.Trim();
        if (dto.ManagerNameEnglish != null) wing.ManagerNameEnglish = dto.ManagerNameEnglish.Trim();
        if (dto.ManagerMobileNo != null) wing.ManagerMobileNo = dto.ManagerMobileNo.Trim();
        if (dto.ManagerEmailId != null) wing.ManagerEmailId = dto.ManagerEmailId.Trim();

        wing.UpdatedBy = updatedBy;
        wing.UpdatedDate = now;

        await _context.SaveChangesAsync(cancellationToken);
        return TopSectionUpdateOutcome.Success;
    }

    private static string BuildUnitAddress(string? flatPart, string? wingName, string? baseSocietyAddress)
    {
        var parts = new List<string>(3);
        if (!string.IsNullOrWhiteSpace(flatPart))
            parts.Add(flatPart.Trim());
        if (!string.IsNullOrWhiteSpace(wingName))
            parts.Add(wingName.Trim());
        if (!string.IsNullOrWhiteSpace(baseSocietyAddress))
            parts.Add(baseSocietyAddress.Trim());

        var full = string.Join(", ", parts);
        return full.Length > 500 ? full.Substring(0, 500) : full;
    }
}


