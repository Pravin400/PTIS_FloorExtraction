using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using System.Globalization;

namespace NtisPlatform.Application.Services;

public class WingWiseDetailsService : IWingWiseDetailsService
{
    private const string TaxTotalCode = "TaxTotal";
    private const string TaxCalculationMethodPolicyCode = "TaxCalculationMethod";
    private const string RateableValueAreaTypePolicyCode = "RateableValueAreaType";
    private const string CapitalValueAreaTypePolicyCode = "CapitalValueAreaType";
    private const string RateMasterAreaUnitPolicyCode = "RateMasterAreaUnit";
    private const string CarpetAreaType = "CarpetArea";
    private const string BuiltUpAreaType = "BuiltUpArea";
    private const string SqMeterUnit = "SqMeter";
    private const string SqFeetUnit = "SqFeet";
    private const string RvCalculationType = "RV";
    private const string AmenityPartType = "Amenity";
    private const string ResidentialPropertyType = "Residential";
    private const string CommercialPropertyType = "Commercial";
    private const string StaticMinFloor = "G";
    private const int AmenityPropertyTypeId = 140;

   

    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<PropertyDetailsEntity, int> _propertyDetailsRepository;
    private readonly IRepository<FloorEntity, int> _floorRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsMastRepository;
    private readonly IRepository<WingEntity, int> _wingRepository;
    private readonly IRepository<TaxMasterEntity, int> _taxRepository;
    private readonly IRepository<TransMastEntity, int> _transMastRepository;
    private readonly IRepository<YearMasterEntity, int> _yearMasterRepository;
    private readonly IRepository<PropertyMastOldEntity, int> _propertyMastOldRepository;
    private readonly IRepository<PropertyMapDetailEntity, int> _propertyMapDetailRepository;
    private readonly IRepository<PolicyTaxDetailsEntity, int> _policyTaxDetailsRepository;
    private readonly IRepository<PolicyTaxDetailsCVEntity, int> _policyTaxDetailsCVRepository;
    private readonly IRepository<PolicyConfigurationEntity, int> _policyConfigurationRepository;
    private readonly IFinanceYearProvider _financeYearProvider;

    public WingWiseDetailsService(
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<PropertyDetailsEntity, int> propertyDetailsRepository,
        IRepository<FloorEntity, int> floorRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsMastRepository,
        IRepository<WingEntity, int> wingRepository,
        IRepository<TaxMasterEntity, int> taxRepository,
        IRepository<TransMastEntity, int> transMastRepository,
        IRepository<YearMasterEntity, int> yearMasterRepository,
        IRepository<PropertyMastOldEntity, int> propertyMastOldRepository,
        IRepository<PropertyMapDetailEntity, int> propertyMapDetailRepository,
        IRepository<PolicyTaxDetailsEntity, int> policyTaxDetailsRepository,
        IRepository<PolicyTaxDetailsCVEntity, int> policyTaxDetailsCVRepository,
        IRepository<PolicyConfigurationEntity, int> policyConfigurationRepository,
        IFinanceYearProvider financeYearProvider)
    {
        _propertyRepository = propertyRepository;
        _propertyTypeRepository = propertyTypeRepository;
        _wardRepository = wardRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _floorRepository = floorRepository;
        _wingDetailsMastRepository = wingDetailsMastRepository;
        _wingRepository = wingRepository;
        _taxRepository = taxRepository;
        _transMastRepository = transMastRepository;
        _yearMasterRepository = yearMasterRepository;
        _propertyMastOldRepository = propertyMastOldRepository;
        _propertyMapDetailRepository = propertyMapDetailRepository;
        _policyTaxDetailsRepository = policyTaxDetailsRepository;
        _policyTaxDetailsCVRepository = policyTaxDetailsCVRepository;
        _policyConfigurationRepository = policyConfigurationRepository;
        _financeYearProvider = financeYearProvider;
    }

    public async Task<WingWiseDetailsResponseDto> GetWingWiseDetailsAsync(WingWiseDetailsQueryParameters query, CancellationToken cancellationToken = default)
    {
        if (!query.WardId.HasValue || string.IsNullOrWhiteSpace(query.PropertyNo))
            return Empty(query);

        var normalizedPropertyNo = query.PropertyNo.Trim();
        var properties = await GetScopedPropertiesAsync(query.WardId.Value, normalizedPropertyNo, cancellationToken);
        var commonAmenityProperties = await GetScopedCommonAmenitiesAsync(query.WardId.Value, normalizedPropertyNo, cancellationToken);
        var policyConfig = await GetPolicyConfigurationsAsync(cancellationToken);
        var rateMasterAreaUnit = policyConfig.GetValueOrDefault(RateMasterAreaUnitPolicyCode)?.Trim() ?? string.Empty;

        if (properties.Count == 0 && commonAmenityProperties.Count == 0)
            return Empty(query.WardId.Value, normalizedPropertyNo, rateMasterAreaUnit);

        var allPropertyIds = properties.Select(p => p.PropertyId)
            .Concat(commonAmenityProperties.Select(p => p.PropertyId))
            .Distinct()
            .ToList();

        var wardNo = await GetWardNoAsync(query.WardId.Value, cancellationToken);
        var totalTaxId = await GetTaxTotalIdAsync(cancellationToken);

        var isRvCalculation = string.Equals(
            policyConfig.GetValueOrDefault(TaxCalculationMethodPolicyCode),
            RvCalculationType,
            StringComparison.OrdinalIgnoreCase);

        var areaSelectionMode = ResolveAreaSelectionMode(isRvCalculation, policyConfig);
        var areaByProperty = await GetAreaByPropertyAsync(allPropertyIds, areaSelectionMode, cancellationToken);
        var floorInfoById = await GetFloorInfoByIdAsync(areaByProperty.Values, cancellationToken);

        // Old-property values (OldTotalTax + OldRV) resolved from active PropertyMapDetail (pmd.IsActive = 1)
        // mapped to PropertyMastOld. Distinct PropertyIdOld are resolved per property type and wing.
        var (mappings, oldPropertiesById) = await GetOldPropertyDataAsync(allPropertyIds, cancellationToken);

        var demandByProperty = totalTaxId.HasValue
            ? await GetDemandByPropertyAsync(allPropertyIds, totalTaxId.Value, isRvCalculation, cancellationToken)
            : new Dictionary<int, PropertyDemand>();

        var rvByProperty = await GetRvByPropertyAsync(allPropertyIds, mappings, oldPropertiesById, cancellationToken);

        var wings = BuildWingDetails(properties, areaByProperty, floorInfoById, demandByProperty, rvByProperty, mappings, oldPropertiesById);
        var commonAmenities = BuildCommonAmenities(commonAmenityProperties, areaByProperty, floorInfoById, demandByProperty, rvByProperty, mappings, oldPropertiesById, wings.FirstOrDefault(w => w.SocietyId.HasValue && w.SocietyId.Value > 0)?.SocietyId);

        var primaryPropertyId = properties.FirstOrDefault()?.PropertyId ?? commonAmenityProperties.First().PropertyId;
        return BuildResponse(primaryPropertyId, normalizedPropertyNo, wardNo, rateMasterAreaUnit, wings, commonAmenities);
    }

    private async Task<string> GetWardNoAsync(int wardId, CancellationToken cancellationToken)
    {
        return await _wardRepository.GetQueryable().AsNoTracking()
            .Where(w => w.IsActive && w.Id == wardId)
            .Select(w => w.WardNo)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
    }

    private async Task<List<PropertyScopeRow>> GetScopedPropertiesAsync(int wardId,string propertyNo,CancellationToken cancellationToken)
    {
        var propertyQuery = _propertyRepository.GetQueryable().AsNoTracking()
            .Where(pm => pm.IsActive
                && !pm.MarkedForDeletion
                && pm.WardId == wardId
                && pm.PropertyNo == propertyNo
                && pm.WingDetailId.HasValue);

        var typeQuery = _propertyTypeRepository.GetQueryable().AsNoTracking()
            .Where(ptm => ptm.IsActive);

        var wingDetailsQuery = _wingDetailsMastRepository.GetQueryable().AsNoTracking()
            .Where(wd => wd.IsActive && !wd.MarkedForDeletion);

        var wingQuery = _wingRepository.GetQueryable().AsNoTracking()
            .Where(wm => wm.IsActive);

        return await (
            from pm in propertyQuery
            join ptm in typeQuery on pm.PropertyTypeId equals ptm.Id into ptmJoin
            from ptm in ptmJoin.DefaultIfEmpty()
            join wd in wingDetailsQuery on pm.WingDetailId!.Value equals wd.Id
            join wm in wingQuery on wd.WingMasterId equals wm.Id
            select new PropertyScopeRow
            {
                PropertyId = pm.Id,
                PartitionNo = pm.PartitionNo,
                PropertyTypeId = pm.PropertyTypeId,
                PropertyTypeName = ptm != null ? ptm.PropertyDescription : string.Empty,
                PartType = ptm != null ? ptm.PartType : null,
                Type = ptm != null ? ptm.Type : pm.Type,
                WingDetailId = wd.Id,
                WingMasterId = wd.WingMasterId,
                WingId = wm.Id,
                WingNo = wm.WingNo,
                WingName = wd.WingName,
                SocietyDetailsMastId = wd.SocietyDetailsMastId
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<List<PropertyScopeRow>> GetScopedCommonAmenitiesAsync(
        int wardId,
        string propertyNo,
        CancellationToken cancellationToken)
    {
        var propertyQuery = _propertyRepository.GetQueryable().AsNoTracking()
            .Where(pm => pm.IsActive
                && !pm.MarkedForDeletion
                && pm.WardId == wardId
                && pm.PropertyNo == propertyNo
                && pm.WingDetailId == null);

        var typeQuery = _propertyTypeRepository.GetQueryable().AsNoTracking()
            .Where(ptm => ptm.IsActive);

        var rows = await (
            from pm in propertyQuery
            join ptm in typeQuery on pm.PropertyTypeId equals ptm.Id into ptmJoin
            from ptm in ptmJoin.DefaultIfEmpty()
            select new PropertyScopeRow
            {
                PropertyId = pm.Id,
                PartitionNo = pm.PartitionNo,
                PropertyTypeId = pm.PropertyTypeId,
                PropertyTypeName = ptm != null ? ptm.PropertyDescription : string.Empty,
                PartType = ptm != null ? ptm.PartType : null,
                Type = ptm != null ? ptm.Type : pm.Type,
                WingDetailId = null,
                WingMasterId = null,
                WingId = null,
                WingNo = "Common Amenities",
                WingName = "Common Amenities",
                SocietyDetailsMastId = null
            })
            .ToListAsync(cancellationToken);

        return rows.Where(IsAmenity).ToList();
    }

    private async Task<int?> GetTaxTotalIdAsync(CancellationToken cancellationToken)
    {
        return await _taxRepository.GetQueryable().AsNoTracking()
            .Where(t => t.IsActive && t.TaxCode == TaxTotalCode)
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Dictionary<string, string>> GetPolicyConfigurationsAsync(CancellationToken cancellationToken)
    {
        var relevantCodes = new[]
        {
            TaxCalculationMethodPolicyCode,
            RateableValueAreaTypePolicyCode,
            CapitalValueAreaTypePolicyCode,
            RateMasterAreaUnitPolicyCode
        };

        var records = await _policyConfigurationRepository.GetQueryable().AsNoTracking()
            .Where(pc => pc.IsActive && relevantCodes.Contains(pc.PolicyCode))
            .Select(pc => new
            {
                pc.PolicyCode,
                Value = pc.DefaultValue ?? pc.PolicyValue ?? string.Empty
            })
            .ToListAsync(cancellationToken);

        return records
            .GroupBy(x => x.PolicyCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                g => g.Key,
                g => g.First().Value,
                StringComparer.OrdinalIgnoreCase);
    }

    private async Task<Dictionary<int, PropertyArea>> GetAreaByPropertyAsync(IReadOnlyCollection<int> propertyIds, AreaSelectionMode areaMode,CancellationToken cancellationToken)
    {
        var baseQuery = _propertyDetailsRepository.GetQueryable().AsNoTracking()
            .Where(pd => propertyIds.Contains(pd.PropertyId)
                && pd.IsActive
                && !pd.MarkedForDeletion);

        var details = areaMode switch
        {
            // Open Plot properties (TypeOfUseGroup.IsOpenPlot = true) must contribute 0 area.
            // The check is inlined here so no extra query or parameter threading is needed.
            AreaSelectionMode.CarpetAreaSqMeter => await baseQuery
                .Select(pd => new
                {
                    pd.PropertyId,
                    pd.FloorId,
                    Area = (pd.TypeOfUse != null && pd.TypeOfUse.TypeOfUseGroup != null && pd.TypeOfUse.TypeOfUseGroup.IsOpenPlot)
                        ? 0m
                        : (decimal?)(pd.CarpetAreaSqMeter ?? 0d) ?? 0m
                })
                .ToListAsync(cancellationToken),

            AreaSelectionMode.BuiltUpAreaSqMeter => await baseQuery
                .Select(pd => new
                {
                    pd.PropertyId,
                    pd.FloorId,
                    Area = (pd.TypeOfUse != null && pd.TypeOfUse.TypeOfUseGroup != null && pd.TypeOfUse.TypeOfUseGroup.IsOpenPlot)
                        ? 0m
                        : (decimal?)(pd.BuiltupAreaSqMeter ?? 0d) ?? 0m
                })
                .ToListAsync(cancellationToken),

            AreaSelectionMode.BuiltUpAreaSqFeet => await baseQuery
                .Select(pd => new
                {
                    pd.PropertyId,
                    pd.FloorId,
                    Area = (pd.TypeOfUse != null && pd.TypeOfUse.TypeOfUseGroup != null && pd.TypeOfUse.TypeOfUseGroup.IsOpenPlot)
                        ? 0m
                        : (decimal?)(pd.BuiltupAreaSqFeet ?? 0d) ?? 0m
                })
                .ToListAsync(cancellationToken),

            _ => await baseQuery
                .Select(pd => new
                {
                    pd.PropertyId,
                    pd.FloorId,
                    Area = (pd.TypeOfUse != null && pd.TypeOfUse.TypeOfUseGroup != null && pd.TypeOfUse.TypeOfUseGroup.IsOpenPlot)
                        ? 0m
                        : (decimal?)(pd.CarpetAreaSqFeet ?? 0d) ?? 0m
                })
                .ToListAsync(cancellationToken)
        };

        return details
            .GroupBy(d => d.PropertyId)
            .ToDictionary(
                g => g.Key,
                g => new PropertyArea(
                    g.Where(x => x.FloorId.HasValue).Select(x => x.FloorId!.Value).Distinct().ToList(),
                    g.Sum(x => x.Area)));
    }

    private async Task<Dictionary<int, FloorInfo>> GetFloorInfoByIdAsync(IEnumerable<PropertyArea> propertyAreas, CancellationToken cancellationToken)
    {
        var floorIds = propertyAreas
            .SelectMany(area => area.FloorIds ?? Array.Empty<int>())
            .Distinct()
            .ToList();

        if (floorIds.Count == 0)
            return new Dictionary<int, FloorInfo>();

        return await _floorRepository.GetQueryable().AsNoTracking()
            .Where(floor => floor.IsActive && floorIds.Contains(floor.Id))
            .Select(floor => new
            {
                floor.Id,
                FloorCode = floor.FloorCode ?? floor.Description ?? string.Empty,
                SequenceNo = floor.SequenceNo ?? 0
            })
            .ToDictionaryAsync(
                x => x.Id,
                x => new FloorInfo(x.FloorCode, x.SequenceNo),
                cancellationToken);
    }

    private async Task<(List<PropertyMappingRow> Mappings, Dictionary<int, OldPropertyValues> OldPropertiesById)> GetOldPropertyDataAsync(
        IReadOnlyCollection<int> propertyIds,
        CancellationToken cancellationToken)
    {
        // Resolve active mappings (pmd.IsActive = 1) for the scoped new properties
        var mappings = await _propertyMapDetailRepository.GetQueryable().AsNoTracking()
            .Where(map => map.IsActive
                && map.PropertyIdNew.HasValue
                && propertyIds.Contains(map.PropertyIdNew.Value)
                && map.PropertyIdOld.HasValue)
            .Select(map => new PropertyMappingRow(map.PropertyIdNew!.Value, map.PropertyIdOld!.Value))
            .ToListAsync(cancellationToken);

        var oldPropertyIds = mappings.Select(m => m.PropertyIdOld).Distinct().ToList();

        var oldPropertiesById = oldPropertyIds.Count > 0
            ? await _propertyMastOldRepository.GetQueryable().AsNoTracking()
                .Where(old => oldPropertyIds.Contains(old.Id)
                    && old.IsActive
                    && !old.MarkedForDeletion)
                .Select(old => new
                {
                    old.Id,
                    OldTotalTax = (decimal?)old.OldTotalTax ?? 0m,
                    OldRV = (decimal?)old.OldRV ?? 0m
                })
                .ToDictionaryAsync(
                    x => x.Id,
                    x => new OldPropertyValues(x.OldTotalTax, x.OldRV),
                    cancellationToken)
            : new Dictionary<int, OldPropertyValues>();

        return (mappings, oldPropertiesById);
    }

    private async Task<Dictionary<int, PropertyDemand>> GetDemandByPropertyAsync(
        IReadOnlyCollection<int> propertyIds,
        int totalTaxId,
        bool isRvCalculation,
        CancellationToken cancellationToken)
    {
        // ── Current Demand ──────────────────────────────────────────────────────
        // Sourced from PolicyTaxDetails (RV) or PolicyTaxDetailsCV (CV) based on
        // PolicyConfiguration.TaxCalculationMethod.DefaultValue.
        // Filter: IsCurrent = true, !MarkedForDeletion, TaxId = TaxTotal. On the RV path a certificate
        // policy's current-year row replaces the NETTAX row instead of adding to it (see GetCurrentRVDemandAsync),
        // so Current + Retro (prior years) equals the property's retrospective ledger.
        var currentDemandByProperty = isRvCalculation
            ? await GetCurrentRVDemandAsync(propertyIds, totalTaxId, cancellationToken)
            : await GetCurrentCVDemandAsync(propertyIds, totalTaxId, cancellationToken);

        // ── Retro Demand ────────────────────────────────────────────────────────
        // Sourced from TransMast joined with PolicyCodeMaster: prior finance years
        // (FinanceYearId != currentFinanceYearId) where pcm.IsRetroDemand = 1.
        var currentFinanceYear = _financeYearProvider.GetCurrentFinanceYear();
        var currentFinanceYearId = await _yearMasterRepository.GetQueryable().AsNoTracking()
            .Where(y => y.IsActive && y.Year == currentFinanceYear)
            .Select(y => (int?)y.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!currentFinanceYearId.HasValue)
        {
            currentFinanceYearId = await _yearMasterRepository.GetQueryable().AsNoTracking()
                .Where(y => y.IsActive)
                .OrderByDescending(y => y.Year)
                .Select(y => (int?)y.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var retroDemandByProperty = new Dictionary<int, decimal>();
        if (currentFinanceYearId.HasValue)
        {
            // Retro Demand:
            // SELECT SUM(tm.TaxAmount) FROM ptis.TransMast tm
            // JOIN ptis.PolicyCodeMaster pcm ON pcm.id = tm.PolicyCodeId
            // JOIN ptis.TaxMaster t ON t.id = tm.TaxId AND t.TaxCode = 'TaxTotal' AND t.IsActive = 1
            // WHERE pcm.IsRetroDemand = 1 AND tm.PropertyId IN (...) AND tm.IsActive = 1
            retroDemandByProperty = await _transMastRepository.GetQueryable().AsNoTracking()
                .Where(tm => propertyIds.Contains(tm.PropertyId)
                    && tm.IsActive
                    && !tm.MarkedForDeletion
                    && tm.TaxId == totalTaxId
                    && tm.FinanceYearId != currentFinanceYearId
                    && tm.PolicyCodeMaster != null
                    && tm.PolicyCodeMaster.IsRetroDemand)
                .GroupBy(tm => tm.PropertyId)
                .Select(g => new
                {
                    PropertyId = g.Key,
                    Retro = g.Sum(tm => tm.TaxAmount)
                })
                .ToDictionaryAsync(x => x.PropertyId, x => x.Retro, cancellationToken);
        }

        // ── Assemble per-property demand (Current + Retro) ────────────────
        return propertyIds.ToDictionary(
            propertyId => propertyId,
            propertyId => new PropertyDemand(
                currentDemandByProperty.GetValueOrDefault(propertyId),
                retroDemandByProperty.GetValueOrDefault(propertyId)));
    }

    /// <summary>
    /// Current Demand from PTIS.PolicyTaxDetails (RV path).
    /// IsCurrent = true, !MarkedForDeletion, TaxId = TaxTotal per property.
    /// <para>
    /// A property under a certificate (OC / CC / their PARTIAL_ forms) has TWO current TaxTotal rows: its base
    /// NETTAX row and the certificate-policy row the retrospective engine writes for the current year. The
    /// engine replaces NETTAX with that certificate row in TransMast, so the current year's demand is the
    /// certificate row alone -- adding both counted the current year twice, which inflated the wing's Total
    /// Demand and Revenue Impact. When a retro-demand policy row exists it is therefore the current demand;
    /// otherwise the plain (non-retro) rows are.
    /// </para>
    /// </summary>
    private async Task<Dictionary<int, decimal>> GetCurrentRVDemandAsync(IReadOnlyCollection<int> propertyIds,int totalTaxId,CancellationToken cancellationToken)
    {
        var rows = await _policyTaxDetailsRepository.GetQueryable().AsNoTracking()
            .Where(ptd => propertyIds.Contains(ptd.PropertyId)
                && ptd.IsActive
                && ptd.IsCurrent
                && !ptd.MarkedForDeletion
                && ptd.TaxId == totalTaxId)
            .Select(ptd => new
            {
                ptd.PropertyId,
                IsRetroDemand = ptd.PolicyCodeMaster != null && ptd.PolicyCodeMaster.IsRetroDemand,
                TaxAmount = ptd.TaxAmount ?? 0m
            })
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(r => r.PropertyId)
            .ToDictionary(
                g => g.Key,
                g => g.Any(r => r.IsRetroDemand)
                    ? g.Where(r => r.IsRetroDemand).Sum(r => r.TaxAmount)
                    : g.Sum(r => r.TaxAmount));
    }

    /// <summary>
    /// Current Demand from PTIS.PolicyTaxDetailsCV (CV path).
    /// IsCurrent = true, !MarkedForDeletion, TaxId = TaxTotal → SUM(TaxAmount) per property.
    /// </summary>
    private async Task<Dictionary<int, decimal>> GetCurrentCVDemandAsync(IReadOnlyCollection<int> propertyIds,int totalTaxId,CancellationToken cancellationToken)
    {
        return await _policyTaxDetailsCVRepository.GetQueryable().AsNoTracking()
            .Where(ptd => propertyIds.Contains(ptd.PropertyId)
                && ptd.IsActive
                && ptd.IsCurrent
                && !ptd.MarkedForDeletion
                && ptd.TaxId == totalTaxId)
            .GroupBy(ptd => ptd.PropertyId)
            .Select(g => new
            {
                PropertyId = g.Key,
                TaxAmount = g.Sum(ptd => ptd.TaxAmount ?? 0m)
            })
            .ToDictionaryAsync(x => x.PropertyId, x => x.TaxAmount, cancellationToken);
    }

    private async Task<Dictionary<int, PropertyRv>> GetRvByPropertyAsync(
        IReadOnlyCollection<int> propertyIds,
        IReadOnlyList<PropertyMappingRow> mappings,
        IReadOnlyDictionary<int, OldPropertyValues> oldPropertiesById,
        CancellationToken cancellationToken)
    {
        // Revised RV: TOP 1 current PolicyTaxDetails.CalculationValue per property.
        var revisedRvByProperty = await _policyTaxDetailsRepository.GetQueryable().AsNoTracking()
            .Where(ptd => propertyIds.Contains(ptd.PropertyId)
                && ptd.IsActive
                && ptd.IsCurrent
                && !ptd.MarkedForDeletion)
            .GroupBy(ptd => ptd.PropertyId)
            .Select(g => new
            {
                PropertyId = g.Key,
                Amount = g.OrderByDescending(ptd => ptd.Id)
                    .Select(ptd => ptd.CalculationValue)
                    .FirstOrDefault() ?? 0m
            })
            .ToDictionaryAsync(x => x.PropertyId, x => x.Amount, cancellationToken);

        var oldIdsByNewProperty = mappings
            .GroupBy(m => m.PropertyIdNew)
            .ToDictionary(
                g => g.Key,
                g => g.Select(m => m.PropertyIdOld).Distinct().ToList());

        return propertyIds.ToDictionary(
            propertyId => propertyId,
            propertyId =>
            {
                var previousRv = oldIdsByNewProperty.TryGetValue(propertyId, out var oldIds)
                    ? oldIds.Sum(id => oldPropertiesById.TryGetValue(id, out var oldVal) ? oldVal.OldRV : 0m)
                    : 0m;

                return new PropertyRv(
                    previousRv,
                    revisedRvByProperty.GetValueOrDefault(propertyId));
            });
    }

    private static List<WingWiseDetailDto> BuildWingDetails(
        IReadOnlyList<PropertyScopeRow> properties,
        IReadOnlyDictionary<int, PropertyArea> areaByProperty,
        IReadOnlyDictionary<int, FloorInfo> floorInfoById,
        IReadOnlyDictionary<int, PropertyDemand> demandByProperty,
        IReadOnlyDictionary<int, PropertyRv> rvByProperty,
        IReadOnlyList<PropertyMappingRow> mappings,
        IReadOnlyDictionary<int, OldPropertyValues> oldPropertiesById)
    {
        return properties
            .GroupBy(p => new
            {
                p.WingDetailId,
                p.WingMasterId,
                p.WingId,
                p.WingNo,
                p.WingName,
                p.SocietyDetailsMastId
            })
            .Select(wingGroup =>
            {
                var propertyTypeTotals = BuildPropertyTypeTotals(wingGroup, areaByProperty, demandByProperty, mappings, oldPropertiesById);
                var oldDemand = propertyTypeTotals.Sum(x => x.OldDemand);
                var currentDemand = propertyTypeTotals.Sum(x => x.CurrentDemand);
                var retroDemand = propertyTypeTotals.Sum(x => x.RetroDemand);
                var totalDemand = currentDemand + retroDemand;
                var propertyTypeTotalDemand = propertyTypeTotals.Sum(x => x.TotalDemand);
                var collectionAmount = 0m;
                var revenueImpact = propertyTypeTotals.Sum(x => x.TotalRevenue);
                var exemptionAppliedAmount = propertyTypeTotals
                    .Where(x => string.Equals(x.Name, AmenityPartType, StringComparison.OrdinalIgnoreCase))
                    .Sum(x => x.TotalDemand);
                var wingPropertyIds = wingGroup.Select(x => x.PropertyId).Distinct().ToList();

                // Previous RV for the wing: sum of OldRV for all distinct OldPropertyId mapped to this wing
                var wingOldIds = mappings
                    .Where(m => wingPropertyIds.Contains(m.PropertyIdNew))
                    .Select(m => m.PropertyIdOld)
                    .Distinct()
                    .ToList();
                var previousRv = wingOldIds.Sum(id => oldPropertiesById.TryGetValue(id, out var oldVal) ? oldVal.OldRV : 0m);
                var revisedRv = wingPropertyIds.Sum(id => rvByProperty.GetValueOrDefault(id).RevisedRV);
                var differenceRv = revisedRv - previousRv;
                var affectedUnits = GetAffectedUnits(wingGroup, rvByProperty);

                return new WingWiseDetailDto
                {
                    WingMasterId = wingGroup.Key.WingMasterId,
                    WingDetailId = wingGroup.Key.WingDetailId,
                    WingId = wingGroup.Key.WingId,
                    SocietyId = wingGroup.Key.SocietyDetailsMastId,
                    WingNo = wingGroup.Key.WingNo,
                    WingName = wingGroup.Key.WingName,
                    PropertyCount = wingPropertyIds.Count,
                    FloorRange = GetFloorRange(wingPropertyIds, areaByProperty, floorInfoById),
                    TotalArea = wingPropertyIds.Sum(id => areaByProperty.GetValueOrDefault(id).TotalArea),
                    CollectionPercentage = Percentage(collectionAmount, totalDemand),
                    OldDemand = FormatDemand(oldDemand),
                    CurrentDemand = FormatDemand(currentDemand),
                    RetroDemand = FormatDemand(retroDemand),
                    TotalDemand = FormatDemand(totalDemand),
                    TotalPropertyTypeDemand = FormatDemand(propertyTypeTotalDemand),
                    RevenueImpact = FormatDemand(revenueImpact),
                    RevenueImpactPercentage = Percentage(revenueImpact, oldDemand),
                    RevenueImpactDetails =
                    [
                        new RevenueImpactDetailDto
                        {
                            PreviousRV = FormatDemand(previousRv),
                            RevisedRV = FormatDemand(revisedRv),
                            DifferenceRV = FormatDemand(differenceRv),
                            AffectedUnits = affectedUnits
                        }
                    ],
                    ExemptionAppliedAmount = FormatDemand(exemptionAppliedAmount),
                    ExemptedPropertyCount = wingGroup
                        .Where(IsAmenity)
                        .Select(x => x.PropertyId)
                        .Distinct()
                        .Count(),
                    PropertyTypes = propertyTypeTotals.Select(ToPropertyTypeDto).ToList()
                };
            })
            .OrderBy(x => x.WingNo)
            .ThenBy(x => x.WingName)
            .ToList();
    }

    private static List<WingWiseDetailDto> BuildCommonAmenities(
        IReadOnlyList<PropertyScopeRow> commonAmenities,
        IReadOnlyDictionary<int, PropertyArea> areaByProperty,
        IReadOnlyDictionary<int, FloorInfo> floorInfoById,
        IReadOnlyDictionary<int, PropertyDemand> demandByProperty,
        IReadOnlyDictionary<int, PropertyRv> rvByProperty,
        IReadOnlyList<PropertyMappingRow> mappings,
        IReadOnlyDictionary<int, OldPropertyValues> oldPropertiesById,
        int? societyId)
    {
        if (commonAmenities.Count == 0)
            return [];

        var propertyTypeTotals = BuildPropertyTypeTotals(commonAmenities, areaByProperty, demandByProperty, mappings, oldPropertiesById);
        var oldDemand = propertyTypeTotals.Sum(x => x.OldDemand);
        var currentDemand = propertyTypeTotals.Sum(x => x.CurrentDemand);
        var retroDemand = propertyTypeTotals.Sum(x => x.RetroDemand);
        var totalDemand = currentDemand + retroDemand;
        var propertyTypeTotalDemand = propertyTypeTotals.Sum(x => x.TotalDemand);
        var collectionAmount = 0m;
        var revenueImpact = propertyTypeTotals.Sum(x => x.TotalRevenue);
        var exemptionAppliedAmount = propertyTypeTotals
            .Where(x => string.Equals(x.Name, AmenityPartType, StringComparison.OrdinalIgnoreCase))
            .Sum(x => x.TotalDemand);
        var commonPropertyIds = commonAmenities.Select(x => x.PropertyId).Distinct().ToList();

        var commonOldIds = mappings
            .Where(m => commonPropertyIds.Contains(m.PropertyIdNew))
            .Select(m => m.PropertyIdOld)
            .Distinct()
            .ToList();
        var previousRv = commonOldIds.Sum(id => oldPropertiesById.TryGetValue(id, out var oldVal) ? oldVal.OldRV : 0m);
        var revisedRv = commonPropertyIds.Sum(id => rvByProperty.GetValueOrDefault(id).RevisedRV);
        var differenceRv = revisedRv - previousRv;
        var affectedUnits = GetAffectedUnits(commonAmenities, rvByProperty);

        return
        [
            new WingWiseDetailDto
            {
                WingMasterId = null,
                WingDetailId = null,
                WingId = null,
                SocietyId = societyId,
                WingNo = "Common Amenities",
                WingName = "Common Amenities",
                PropertyCount = commonPropertyIds.Count,
                FloorRange = GetFloorRange(commonPropertyIds, areaByProperty, floorInfoById),
                TotalArea = commonPropertyIds.Sum(id => areaByProperty.GetValueOrDefault(id).TotalArea),
                CollectionPercentage = Percentage(collectionAmount, totalDemand),
                OldDemand = FormatDemand(oldDemand),
                CurrentDemand = FormatDemand(currentDemand),
                RetroDemand = FormatDemand(retroDemand),
                TotalDemand = FormatDemand(totalDemand),
                TotalPropertyTypeDemand = FormatDemand(propertyTypeTotalDemand),
                RevenueImpact = FormatDemand(revenueImpact),
                RevenueImpactPercentage = Percentage(revenueImpact, oldDemand),
                RevenueImpactDetails =
                [
                    new RevenueImpactDetailDto
                    {
                        PreviousRV = FormatDemand(previousRv),
                        RevisedRV = FormatDemand(revisedRv),
                        DifferenceRV = FormatDemand(differenceRv),
                        AffectedUnits = affectedUnits
                    }
                ],
                ExemptionAppliedAmount = FormatDemand(exemptionAppliedAmount),
                ExemptedPropertyCount = commonPropertyIds.Count,
                PropertyTypes = propertyTypeTotals.Select(ToPropertyTypeDto).ToList()
            }
        ];
    }

    private static int GetAffectedUnits(IEnumerable<PropertyScopeRow> wingProperties,IReadOnlyDictionary<int, PropertyRv> rvByProperty)
    {
        return wingProperties
            .GroupBy(p => p.PartitionNo ?? string.Empty)
            .Count(partition => partition
                .Select(p => p.PropertyId)
                .Distinct()
                .Any(id =>
                {
                    var rv = rvByProperty.GetValueOrDefault(id);
                    return rv.PreviousRV != rv.RevisedRV;
                }));
    }

    private static List<PropertyTypeTotal> BuildPropertyTypeTotals(
        IEnumerable<PropertyScopeRow> wingProperties,
        IReadOnlyDictionary<int, PropertyArea> areaByProperty,
        IReadOnlyDictionary<int, PropertyDemand> demandByProperty,
        IReadOnlyList<PropertyMappingRow> mappings,
        IReadOnlyDictionary<int, OldPropertyValues> oldPropertiesById)
    {
        var groupedData = wingProperties
            .GroupBy(GetPropertyTypeBucket)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var propertyIds = g.Select(x => x.PropertyId).Distinct().ToHashSet();

                    // Distinct OldPropertyId for this property type in this wing:
                    // SELECT OldTotalTax, OldRV FROM ptis.PropertyMastOld WHERE id IN (
                    //   SELECT PropertyIdOld FROM ptis.PropertyMapDetail pmd
                    //   JOIN ptis.PropertyMast pm ON pm.id = pmd.PropertyIdNew
                    //   WHERE pm.WardId = ... AND pm.PropertyNo = ... AND pm.WingDetailId = ... AND pm.PropertyTypeId = ... AND pmd.IsActive = 1
                    // )
                    var mappedOldIds = mappings
                        .Where(m => propertyIds.Contains(m.PropertyIdNew))
                        .Select(m => m.PropertyIdOld)
                        .Distinct()
                        .ToList();

                    var oldDemand = mappedOldIds.Sum(id => oldPropertiesById.TryGetValue(id, out var oldVal) ? oldVal.OldTotalTax : 0m);
                    var currentDemand = propertyIds.Sum(id => demandByProperty.GetValueOrDefault(id).CurrentDemand);
                    var retroDemand = propertyIds.Sum(id => demandByProperty.GetValueOrDefault(id).RetroDemand);
                    var totalDemand = currentDemand + retroDemand;

                    return new PropertyTypeTotal(
                        g.Key,
                        propertyIds.Count,
                        propertyIds.Sum(id => areaByProperty.GetValueOrDefault(id).TotalArea),
                        oldDemand,
                        currentDemand,
                        retroDemand,
                        totalDemand,
                        totalDemand - oldDemand);
                },
                StringComparer.OrdinalIgnoreCase);

        return PropertyTypeBuckets
            .Select(bucket =>
            {
                return groupedData.TryGetValue(bucket, out var total)
                    ? total
                    : new PropertyTypeTotal(bucket, 0, 0m, 0m, 0m, 0m, 0m, 0m);
            })
            .ToList();
    }

    private static WingWisePropertyTypeDetailDto ToPropertyTypeDto(PropertyTypeTotal total) => new()
    {
        PropertyTypeName = total.Name,
        PropertyCount = total.PropertyCount,
        TotalArea = total.TotalArea,
        OldDemand = FormatDemand(total.OldDemand),
        CurrentDemand = FormatDemand(total.CurrentDemand),
        RetroDemand = FormatDemand(total.RetroDemand),
        TotalDemand = FormatDemand(total.TotalDemand),
        TotalRevenue = FormatDemand(total.TotalRevenue)
    };

    private static string GetFloorRange(IEnumerable<int> propertyIds,IReadOnlyDictionary<int, PropertyArea> areaByProperty,IReadOnlyDictionary<int, FloorInfo> floorInfoById)
    {
        var floors = propertyIds
            .Select(id => areaByProperty.GetValueOrDefault(id))
            .SelectMany(area => area.FloorIds ?? Array.Empty<int>())
            .Distinct()
            .Select(floorId => floorInfoById.GetValueOrDefault(floorId))
            .Where(f => !IsExcludedFloorCode(f.FloorCode))
            .ToList();

        if (floors.Count == 0)
            return StaticMinFloor;

        // When upper floors exist (floors other than G), determine maximum by SequenceNo.
        var upperFloors = floors
            .Where(f => !string.Equals(f.FloorCode.Trim(), StaticMinFloor, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (upperFloors.Count > 0)
        {
            var maxUpperFloor = upperFloors
                .OrderByDescending(f => f.SequenceNo)
                .ThenByDescending(f => int.TryParse(f.FloorCode.Trim(), out var n) ? n : 0)
                .First();

            return $"{StaticMinFloor}-{maxUpperFloor.FloorCode.Trim()}";
        }

        // If only G exists among valid floors
        return $"{StaticMinFloor}-{StaticMinFloor}";
    }

    private static WingWiseDetailsResponseDto BuildResponse(
        int propertyId,
        string propertyNo,
        string wardNo,
        string rateMasterAreaUnit,
        IReadOnlyList<WingWiseDetailDto> wings,
        IReadOnlyList<WingWiseDetailDto> commonAmenities) => new()
    {
        PropertyId = propertyId,
        PropertyNo = propertyNo,
        WardNo = wardNo,
        RateMasterAreaUnit = rateMasterAreaUnit,
        SocietyId = wings.FirstOrDefault(w => w.SocietyId.HasValue && w.SocietyId.Value > 0)?.SocietyId
            ?? commonAmenities.FirstOrDefault(w => w.SocietyId.HasValue && w.SocietyId.Value > 0)?.SocietyId,
        Wings = wings,
        CommonAmenities = commonAmenities
    };

    private static bool IsAmenity(PropertyScopeRow property) =>
        property.PropertyTypeId == AmenityPropertyTypeId
        || (property.WingDetailId == null && property.PartitionNo != null && property.PartitionNo.Trim().StartsWith("AM", StringComparison.OrdinalIgnoreCase))
        || string.Equals(property.PartType, AmenityPartType, StringComparison.OrdinalIgnoreCase)
        || property.PropertyTypeName.Contains(AmenityPartType, StringComparison.OrdinalIgnoreCase)
        || property.PropertyTypeName.Contains("अॅमिनीटी")
        || property.PropertyTypeName.Contains("अ‍ॅमिनीटी")
        || string.Equals(property.Type, AmenityPartType, StringComparison.OrdinalIgnoreCase);

    private static IReadOnlyList<string> PropertyTypeBuckets { get; } =
    [
        ResidentialPropertyType,
        CommercialPropertyType,
        AmenityPartType
    ];

    private static bool IsAnivasi(PropertyScopeRow property)
    {
        var desc = property.PropertyTypeName ?? string.Empty;
        var partType = property.PartType ?? string.Empty;
        var type = property.Type ?? string.Empty;

        return desc.Contains("अनिवासी", StringComparison.OrdinalIgnoreCase)
            || desc.Contains("anivasi", StringComparison.OrdinalIgnoreCase)
            || partType.Contains("अनिवासी", StringComparison.OrdinalIgnoreCase)
            || partType.Contains("anivasi", StringComparison.OrdinalIgnoreCase)
            || type.Contains("अनिवासी", StringComparison.OrdinalIgnoreCase)
            || type.Contains("anivasi", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetPropertyTypeBucket(PropertyScopeRow property)
    {
        if (IsAmenity(property))
            return AmenityPartType;

        if (IsAnivasi(property))
            return CommercialPropertyType;

        var desc = property.PropertyTypeName ?? string.Empty;
        var partType = property.PartType ?? string.Empty;
        var type = property.Type?.Trim() ?? string.Empty;

        if (type.Equals("R", StringComparison.OrdinalIgnoreCase)
            || type.Equals("N", StringComparison.OrdinalIgnoreCase)
            || type.Equals("Residential", StringComparison.OrdinalIgnoreCase)
            || string.Equals(partType, "R", StringComparison.OrdinalIgnoreCase)
            || ContainsIgnoreCase(partType, ResidentialPropertyType)
            || ContainsIgnoreCase(desc, ResidentialPropertyType)
            || desc.Contains("निवासी", StringComparison.OrdinalIgnoreCase)
            || desc.Contains("nivasi", StringComparison.OrdinalIgnoreCase)
            || partType.Contains("निवासी", StringComparison.OrdinalIgnoreCase)
            || partType.Contains("nivasi", StringComparison.OrdinalIgnoreCase)
            || type.Contains("निवासी", StringComparison.OrdinalIgnoreCase)
            || type.Contains("nivasi", StringComparison.OrdinalIgnoreCase))
            return ResidentialPropertyType;

        return CommercialPropertyType;
    }

    private static bool ContainsIgnoreCase(string? value, string expected) =>
        !string.IsNullOrWhiteSpace(value)
        && value.Contains(expected, StringComparison.OrdinalIgnoreCase);

    private static decimal Percentage(decimal value, decimal total) =>
        total == 0m ? 0m : Math.Round(value * 100m / total, 2, MidpointRounding.AwayFromZero);

    private static string FormatDemand(decimal amount)
    {
        var roundedAmount = Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        var absoluteAmount = Math.Abs(roundedAmount);
        var sign = roundedAmount < 0m ? "-" : string.Empty;

        if (absoluteAmount >= 10000000m)
            return sign + FormatScaledAmount(absoluteAmount / 10000000m, "Crore");

        if (absoluteAmount >= 100000m)
            return sign + FormatScaledAmount(absoluteAmount / 100000m, "Lakh");

        if (absoluteAmount >= 1000m)
            return sign + FormatScaledAmount(absoluteAmount / 1000m, "K");

        return sign + FormatNumber(absoluteAmount);
    }

    private static string FormatScaledAmount(decimal value, string suffix) =>
        string.Equals(suffix, "K", StringComparison.Ordinal)
            ? $"{FormatNumber(value)}{suffix}"
            : $"{FormatNumber(value)} {suffix}";

    private static string FormatNumber(decimal value) =>
        decimal.Truncate(value) == value
            ? value.ToString("0", CultureInfo.InvariantCulture)
            : value.ToString("0.##", CultureInfo.InvariantCulture);

    private static WingWiseDetailsResponseDto Empty(WingWiseDetailsQueryParameters query, string rateMasterAreaUnit = "") =>
        Empty(query.WardId ?? 0, query.PropertyNo?.Trim() ?? string.Empty, rateMasterAreaUnit);

    private static WingWiseDetailsResponseDto Empty(int wardId, string propertyNo, string rateMasterAreaUnit = "") => new()
    {
        PropertyNo = propertyNo,
        RateMasterAreaUnit = rateMasterAreaUnit
    };
    public enum AreaSelectionMode
    {
        CarpetAreaSqFeet,
        CarpetAreaSqMeter,
        BuiltUpAreaSqFeet,
        BuiltUpAreaSqMeter
    }

    private static readonly HashSet<string> StaticExcludedFloorCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "B", "L", "M", "OP", "P", "U"
    };

    /// <summary>
    /// Checks whether a floor code should be excluded from FloorRange calculation.
    /// Excludes:
    /// - Static codes: B, L, M, OP, P, U
    /// - Dynamic Podium floors: P1, P2, P3 ... P7, P8, P9, P10+
    /// - Dynamic Utility / Upper floors: U1, U2, U3 ... Un
    /// - Dynamic Basement floors: B1, B2 ... Bn
    /// </summary>
    public static bool IsExcludedFloorCode(string? floorCode)
    {
        if (string.IsNullOrWhiteSpace(floorCode))
            return true;

        var code = floorCode.Trim();

        if (StaticExcludedFloorCodes.Contains(code))
            return true;

        // Future-proof dynamic check:
        // Matches any Podium floor (P1, P2, P3 ... P7, P8, P9, P10, etc.),
        // Utility / Upper floor (U1, U2, U3 ... Un), or Basement (B1, B2 ... Bn),
        // including optional hyphen e.g., P-1, U-2.
        char prefix = char.ToUpperInvariant(code[0]);
        if (prefix is 'P' or 'U' or 'B')
        {
            var remainder = code.AsSpan(1).TrimStart('-').TrimStart(' ');
            if (remainder.Length > 0 && int.TryParse(remainder, out _))
                return true;
        }

        return false;
    }

    /// <summary>
    /// Resolves the AreaSelectionMode based on TaxCalculationMethod (RV vs CV),
    /// the corresponding area type policy (RateableValueAreaType or CapitalValueAreaType),
    /// and the area unit policy (RateMasterAreaUnit).
    /// </summary>
    public static AreaSelectionMode ResolveAreaSelectionMode(bool isRvCalculation,IReadOnlyDictionary<string, string> policyConfig)
    {
        var areaTypePolicyCode = isRvCalculation
            ? RateableValueAreaTypePolicyCode
            : CapitalValueAreaTypePolicyCode;

        var areaType = policyConfig.GetValueOrDefault(areaTypePolicyCode)?.Trim() ?? string.Empty;
        var areaUnit = policyConfig.GetValueOrDefault(RateMasterAreaUnitPolicyCode)?.Trim() ?? string.Empty;

        var isBuiltUp = string.Equals(areaType, BuiltUpAreaType, StringComparison.OrdinalIgnoreCase)
                     || string.Equals(areaType, "BuiltupArea", StringComparison.OrdinalIgnoreCase);
        var isSqMeter = string.Equals(areaUnit, SqMeterUnit, StringComparison.OrdinalIgnoreCase);

        return (isBuiltUp, isSqMeter) switch
        {
            (true, true) => AreaSelectionMode.BuiltUpAreaSqMeter,
            (true, false) => AreaSelectionMode.BuiltUpAreaSqFeet,
            (false, true) => AreaSelectionMode.CarpetAreaSqMeter,
            (false, false) => AreaSelectionMode.CarpetAreaSqFeet
        };
    } 
    

    private readonly record struct FloorInfo(string FloorCode, int SequenceNo);

    private readonly record struct PropertyArea(IReadOnlyList<int> FloorIds, decimal TotalArea);

    private readonly record struct PropertyDemand(decimal CurrentDemand, decimal RetroDemand);

    private readonly record struct PropertyRv(decimal PreviousRV, decimal RevisedRV);

    private readonly record struct OldPropertyValues(decimal OldTotalTax, decimal OldRV);

    private readonly record struct PropertyMappingRow(int PropertyIdNew, int PropertyIdOld);

    private readonly record struct PropertyTypeTotal(
        string Name,
        int PropertyCount,
        decimal TotalArea,
        decimal OldDemand,
        decimal CurrentDemand,
        decimal RetroDemand,
        decimal TotalDemand,
        decimal TotalRevenue);
}
