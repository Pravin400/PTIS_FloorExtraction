using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Interfaces.GIS;
using NtisPlatform.Core.Models.GIS;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.GIS;

/// <summary>
/// EF Core LINQ Repository for Asset GIS Spatial Operations and Dynamic KPI/Filter Queries.
/// Queries AMS.GisAssetGeometry, AMS.AssetMaster, AMS.AssetDetails, AMS.SubUnitsDetails, AMS.MonthWiseDemand,
/// AMS.AssetCategory, AMS.AssetType, and PTIS Zone/Ward tables with 0 raw ADO.NET calls.
/// </summary>
public class GisAssetRepository : IGisAssetRepository
{
    private readonly ApplicationDbContext _context;

    public GisAssetRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<List<GisAssetGeometryEntity>> GetIntersectingAssetGeometriesAsync(
        Geometry envelope, 
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(envelope);

        IQueryable<GisAssetGeometryEntity> query = _context.GisAssetGeometries
            .AsNoTracking()
            .Include(g => g.Asset)
                .ThenInclude(a => a!.Details)
            .Include(g => g.Asset)
                .ThenInclude(a => a!.AssetCategory)
            .Include(g => g.Asset)
                .ThenInclude(a => a!.AssetType)
            .Where(g => g.IsActive && !g.MarkedForDeletion && g.PolygonGeometry != null && g.PolygonGeometry.Intersects(envelope) &&
                        (g.Asset == null || (g.Asset.IsActive && !g.Asset.MarkedForDeletion)));

        return await query.ToListAsync(ct);
    }

    public async Task<int?> FindAssetMasterIdAtPointAsync(Point point, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(point);

        return await _context.GisAssetGeometries
            .AsNoTracking()
            .Where(g => g.IsActive && !g.MarkedForDeletion && g.PolygonGeometry != null && g.PolygonGeometry.Intersects(point) &&
                        (g.Asset == null || (g.Asset.IsActive && !g.Asset.MarkedForDeletion)))
            .Select(g => (int?)g.AssetMasterId)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<GisAssetGeometryEntity?> GetAssetGeometryByAssetMasterIdAsync(int assetMasterId, CancellationToken ct = default)
    {
        return await _context.GisAssetGeometries
            .AsNoTracking()
            .Include(g => g.Asset)
                .ThenInclude(a => a!.Details)
            .Include(g => g.Asset)
                .ThenInclude(a => a!.AssetCategory)
            .FirstOrDefaultAsync(g => g.IsActive && !g.MarkedForDeletion && g.AssetMasterId == assetMasterId &&
                                      (g.Asset == null || (g.Asset.IsActive && !g.Asset.MarkedForDeletion)), ct);
    }

    public async Task<GisAssetGeometryEntity?> GetAssetGeometryByBuildingIdAsync(string buildingId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(buildingId)) return null;

        string clean = buildingId.Trim();

        // 1. Direct index seek on AMS.GisAssetGeometry.BuildingId (O(1) Seek via IX_GisAssetGeometry_BuildingId)
        var geom = await _context.GisAssetGeometries
            .AsNoTracking()
            .Include(g => g.Asset)
                .ThenInclude(a => a!.Details)
            .Include(g => g.Asset)
                .ThenInclude(a => a!.AssetCategory)
            .FirstOrDefaultAsync(g => g.IsActive && !g.MarkedForDeletion && g.BuildingId != null && g.BuildingId == clean, ct);

        if (geom != null) return geom;

        // 2. Fallback: Search by MpmsNo in AssetDetails (via UX_AssetDetails_MpmsNo index seek)
        int? matchedAssetId = await _context.AssetDetails
            .AsNoTracking()
            .Where(d => d.IsActive && !d.MarkedForDeletion && d.MpmsNo != null && d.MpmsNo == clean)
            .Select(d => (int?)d.AssetId)
            .FirstOrDefaultAsync(ct);

        // 3. Fallback: Search by AssetNo in AssetMaster (via UQ_AssetMaster_AssetNo index seek)
        if (!matchedAssetId.HasValue)
        {
            matchedAssetId = await _context.AssetMaster
                .AsNoTracking()
                .Where(a => a.IsActive && !a.MarkedForDeletion && a.AssetNo == clean)
                .Select(a => (int?)a.Id)
                .FirstOrDefaultAsync(ct);
        }

        if (matchedAssetId.HasValue && matchedAssetId.Value > 0)
        {
            return await _context.GisAssetGeometries
                .AsNoTracking()
                .Include(g => g.Asset)
                    .ThenInclude(a => a!.Details)
                .Include(g => g.Asset)
                    .ThenInclude(a => a!.AssetCategory)
                .FirstOrDefaultAsync(g => g.IsActive && !g.MarkedForDeletion && g.AssetMasterId == matchedAssetId.Value, ct);
        }

        return null;
    }

    public async Task ReplaceAllGeometriesAsync(IEnumerable<GisAssetGeometryEntity> entities, int? ulbId = null, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(entities);

        var entityList = entities.ToList();

        await using var tx = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            if (ulbId.HasValue && ulbId.Value > 0)
            {
                // Scope deletion strictly to the specified ULB/Organization
                await _context.GisAssetGeometries
                    .Where(g => g.Asset != null && g.Asset.Details != null && g.Asset.Details.OrganizationId == ulbId.Value)
                    .ExecuteDeleteAsync(ct);
            }
            else
            {
                // If ulbId was not explicitly passed, resolve the target ULBs from the incoming assets
                var targetAssetIds = entityList.Select(e => e.AssetMasterId).Distinct().ToList();
                var targetUlbIds = await _context.AssetDetails
                    .Where(d => targetAssetIds.Contains(d.AssetId) && d.OrganizationId > 0)
                    .Select(d => d.OrganizationId)
                    .Distinct()
                    .ToListAsync(ct);

                if (targetUlbIds.Count > 0)
                {
                    // Scope deletion only to geometries in the affected ULBs
                    await _context.GisAssetGeometries
                        .Where(g => g.Asset != null && g.Asset.Details != null && targetUlbIds.Contains(g.Asset.Details.OrganizationId))
                        .ExecuteDeleteAsync(ct);
                }
                else
                {
                    // Safe fallback: delete only geometries for the specific incoming assets rather than the entire statewide database
                    await _context.GisAssetGeometries
                        .Where(g => targetAssetIds.Contains(g.AssetMasterId))
                        .ExecuteDeleteAsync(ct);
                }
            }

            if (entityList.Count > 0)
            {
                await _context.GisAssetGeometries.AddRangeAsync(entityList, ct);
                await _context.SaveChangesAsync(ct);
            }

            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task UpsertGeometriesAsync(IEnumerable<GisAssetGeometryEntity> entities, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(entities);

        // Deduplicate incoming batch by AssetMasterId to guarantee single geometry per asset
        var entityList = entities
            .GroupBy(e => e.AssetMasterId)
            .Select(g => g.Last())
            .ToList();
        if (entityList.Count == 0) return;

        var assetIds = entityList.Select(e => e.AssetMasterId).Distinct().ToList();
        var existingDict = await _context.GisAssetGeometries
            .Where(g => assetIds.Contains(g.AssetMasterId))
            .ToDictionaryAsync(g => g.AssetMasterId, ct);

        var toAdd = new List<GisAssetGeometryEntity>();

        foreach (var item in entityList)
        {
            if (existingDict.TryGetValue(item.AssetMasterId, out var existing))
            {
                existing.BuildingId = item.BuildingId;
                existing.PolygonGeometry = item.PolygonGeometry;
                existing.TotalAreaSqMeter = item.TotalAreaSqMeter;
                existing.TotalAreaSqFeet = item.TotalAreaSqFeet;
                existing.CentroidX = item.CentroidX;
                existing.CentroidY = item.CentroidY;
                existing.GoogleMapLink = item.GoogleMapLink;
                existing.Link360 = item.Link360;
                existing.MarkedForDeletion = false;
            }
            else
            {
                toAdd.Add(item);
            }
        }

        if (toAdd.Count > 0)
        {
            await _context.GisAssetGeometries.AddRangeAsync(toAdd, ct);
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task<(HashSet<int> ValidIds, Dictionary<string, int> AssetNoToIdMap)> GetAssetMasterValidationLookupAsync(CancellationToken ct = default)
    {
        var activeAssets = await _context.AssetMaster
            .AsNoTracking()
            .Where(a => a.IsActive && !a.MarkedForDeletion)
            .Select(a => new { a.Id, a.AssetNo })
            .ToListAsync(ct);

        var validIds = new HashSet<int>(activeAssets.Count);
        var assetNoMap = new Dictionary<string, int>(activeAssets.Count, StringComparer.OrdinalIgnoreCase);

        foreach (var a in activeAssets)
        {
            validIds.Add(a.Id);
            if (!string.IsNullOrWhiteSpace(a.AssetNo))
            {
                assetNoMap.TryAdd(a.AssetNo.Trim(), a.Id);
            }
        }

        return (validIds, assetNoMap);
    }

    /// <summary>
    /// Pure EF Core LINQ query calculating raw metrics for the 6 Asset GIS dynamic KPI cards.
    /// </summary>
    public async Task<AssetKpiMetricsRawDto> GetAssetKpiMetricsAsync(
        int? zoneId,
        int? wardId,
        int? assetCategoryId,
        int? assetTypeId,
        string? kpiCode,
        int? financeYear,
        string? searchTerm,
        int? departmentId = null,
        CancellationToken ct = default)
    {
        // 1. Base Asset query (active records only: IsActive = 1 and !MarkedForDeletion)
        IQueryable<AssetMasterEntity> query = _context.AssetMaster
            .AsNoTracking()
            .Where(a => a.IsActive && !a.MarkedForDeletion);

        if (departmentId.HasValue && departmentId.Value > 0)
        {
            query = query.Where(a => a.DepartmentId == departmentId.Value);
        }

        // 2. Filter by Zone and/or Ward via AMS.AssetDetails (1:1 with AssetMaster, active only)
        bool hasZone = zoneId.HasValue && zoneId.Value > 0;
        bool hasWard = wardId.HasValue && wardId.Value > 0;
        if (hasZone || hasWard)
        {
            query = query.Where(a => _context.AssetDetails
                .Any(d => d.AssetId == a.Id && d.IsActive && !d.MarkedForDeletion &&
                          (!hasZone || d.ZoneId == zoneId!.Value) &&
                          (!hasWard || d.WardId == wardId!.Value)));
        }

        // 3. Filter by Asset Category (active only)
        if (assetCategoryId.HasValue && assetCategoryId.Value > 0)
        {
            query = query.Where(a => a.AssetCategoryId == assetCategoryId.Value &&
                _context.AssetCategory.Any(c => c.Id == a.AssetCategoryId && c.IsActive && !c.MarkedForDeletion));
        }

        // 4. Filter by Asset Type (active only)
        if (assetTypeId.HasValue && assetTypeId.Value > 0)
        {
            query = query.Where(a => a.AssetTypeId == assetTypeId.Value &&
                _context.AssetType.Any(t => t.Id == a.AssetTypeId && t.IsActive && !t.MarkedForDeletion));
        }

        // 5. Search term filtering on AssetNo or AssetName
        if (!string.IsNullOrWhiteSpace(searchTerm) && !string.Equals(searchTerm.Trim(), "string", StringComparison.OrdinalIgnoreCase))
        {
            string term = searchTerm.Trim();
            query = query.Where(a => a.AssetNo.Contains(term) || a.AssetName.Contains(term));
        }

        // 6. Optional KPI Code filter (if user selected a specific KPI card)
        if (!string.IsNullOrWhiteSpace(kpiCode) && !string.Equals(kpiCode.Trim(), "string", StringComparison.OrdinalIgnoreCase))
        {
            var cleanKpi = kpiCode.Trim().ToUpperInvariant();
            if (cleanKpi == "FIXED_ASSETS")
            {
                query = query.Where(a => _context.AssetCategory
                    .Any(c => c.Id == a.AssetCategoryId && c.IsActive && !c.MarkedForDeletion && !c.IsMovable));
            }
            else if (cleanKpi == "MOVABLE_ASSETS")
            {
                query = query.Where(a => _context.AssetCategory
                    .Any(c => c.Id == a.AssetCategoryId && c.IsActive && !c.MarkedForDeletion && c.IsMovable));
            }
            else if (cleanKpi == "ENCROACHED_ASSETS")
            {
                query = query.Where(a => a.EncroachmentStatus != null &&
                    (a.EncroachmentStatus.Trim().ToUpper() == "FULL" || a.EncroachmentStatus.Trim().ToUpper() == "PARTIAL"));
            }
        }

        // Extract subquery of matched asset IDs for aggregate joins
        var assetIdsQuery = query.Select(a => a.Id);

        // Calculate card metrics concurrently / efficiently
        int totalAssets = await query.CountAsync(ct);

        int fixedAssets = await query.Where(a => _context.AssetCategory
            .Any(c => c.Id == a.AssetCategoryId && c.IsActive && !c.MarkedForDeletion && !c.IsMovable))
            .CountAsync(ct);

        int movableAssets = await query.Where(a => _context.AssetCategory
            .Any(c => c.Id == a.AssetCategoryId && c.IsActive && !c.MarkedForDeletion && c.IsMovable))
            .CountAsync(ct);

        int encroachedAssets = await query.Where(a => a.EncroachmentStatus != null &&
            (a.EncroachmentStatus.Trim().ToUpper() == "FULL" || a.EncroachmentStatus.Trim().ToUpper() == "PARTIAL"))
            .CountAsync(ct);

        decimal totalValue = await _context.SubUnitsDetails
            .AsNoTracking()
            .Where(s => s.IsActive && !s.MarkedForDeletion && assetIdsQuery.Contains(s.AssetId))
            .SumAsync(s => (decimal?)(s.CapitalValue ?? 0m), ct) ?? 0m;

        int targetFy = financeYear ?? 2026;
        decimal annualRevenue = await _context.MonthWiseDemand
            .AsNoTracking()
            .Where(m => m.IsActive && assetIdsQuery.Contains(m.AssetId) && (m.FinanceYear == targetFy || m.DemandYear == targetFy))
            .SumAsync(m => (decimal?)m.TotalDemandAmount, ct) ?? 0m;

        return new AssetKpiMetricsRawDto
        {
            TotalAssets = totalAssets,
            FixedAssets = fixedAssets,
            MovableAssets = movableAssets,
            TotalValue = totalValue,
            AnnualRevenue = annualRevenue,
            EncroachedAssets = encroachedAssets
        };
    }

    /// <summary>
    /// Pure EF Core LINQ query retrieving Zone, Ward, Category, and Type lookup datasets for cascading UI filters.
    /// </summary>
    public async Task<(List<(int Id, string Name)> Zones, 
          List<(int Id, string Name, int ZoneId)> Wards, 
          List<(int Id, string Name, string Code)> Categories, 
          List<(int Id, string Name, string Code, int CategoryId, string? ColorCode, string? BorderColor, string? AssetWardNo)> Types)> GetFilterLookupsAsync(
        int? zoneId, 
        int? assetCategoryId, 
        CancellationToken ct = default)
    {
        // 1. Zones
        var zonesRaw = await _context.ZoneMaster
            .AsNoTracking()
            .OrderBy(z => z.SequenceNo ?? z.Id)
            .ThenBy(z => z.ZoneNo)
            .Select(z => new { z.Id, z.ZoneNo, z.Description })
            .ToListAsync(ct);

        var zones = zonesRaw
            .Select(z => (z.Id, string.IsNullOrWhiteSpace(z.Description) ? z.ZoneNo : $"{z.ZoneNo} - {z.Description}"))
            .ToList();

        // 2. Wards (cascaded by zoneId if supplied)
        var wardsQuery = _context.WardMaster.AsNoTracking();
        if (zoneId.HasValue)
        {
            wardsQuery = wardsQuery.Where(w => w.ZoneId == zoneId.Value);
        }

        var wardsRaw = await wardsQuery
            .OrderBy(w => w.SequenceNo ?? w.Id)
            .ThenBy(w => w.WardNo)
            .Select(w => new { w.Id, w.WardNo, w.Description, w.ZoneId })
            .ToListAsync(ct);

        var wards = wardsRaw
            .Select(w => (w.Id, string.IsNullOrWhiteSpace(w.Description) ? w.WardNo : $"{w.WardNo} - {w.Description}", w.ZoneId))
            .ToList();

        // 3. Asset Categories
        var categoriesRaw = await _context.AssetCategory
            .AsNoTracking()
            .Where(c => c.IsActive && !c.MarkedForDeletion)
            .OrderBy(c => c.CategoryName)
            .Select(c => new { c.Id, c.CategoryName, c.CategoryCode })
            .ToListAsync(ct);

        var categories = categoriesRaw
            .Select(c => (c.Id, c.CategoryName, c.CategoryCode))
            .ToList();

        // 4. Asset Types (cascaded by assetCategoryId if supplied)
        var typesQuery = _context.AssetType
            .AsNoTracking()
            .Where(t => t.IsActive && !t.MarkedForDeletion);

        if (assetCategoryId.HasValue)
        {
            typesQuery = typesQuery.Where(t => t.AssetCategoryId == assetCategoryId.Value);
        }

        var typesRaw = await typesQuery
            .OrderBy(t => t.TypeName)
            .Select(t => new { t.Id, t.TypeName, t.TypeCode, t.AssetCategoryId, t.ColorCode, t.BorderColor, t.AssetWardNo })
            .ToListAsync(ct);

        var types = typesRaw
            .Select(t => (t.Id, t.TypeName, t.TypeCode, t.AssetCategoryId, t.ColorCode, t.BorderColor, t.AssetWardNo))
            .ToList();

        return (zones, wards, categories, types);
    }

    public async Task<List<GisDepartmentKpiConfigDto>> GetActiveDepartmentKpisAsync(int departmentId, CancellationToken ct = default)
    {
        var deptConfigs = await _context.GisDepartmentKpiMappings
            .AsNoTracking()
            .Include(m => m.KpiMaster)
            .Where(m => m.DepartmentId == departmentId && 
                        m.IsActive && 
                        m.KpiMaster != null && 
                        m.KpiMaster.IsActive)
            .OrderBy(m => m.DisplayOrder)
            .Select(m => new GisDepartmentKpiConfigDto
            {
                KpiCode = m.KpiMaster!.KpiCode,
                Title = !string.IsNullOrWhiteSpace(m.CustomTitle) ? m.CustomTitle : m.KpiMaster.DefaultTitle,
                Icon = !string.IsNullOrWhiteSpace(m.CustomIcon) ? m.CustomIcon : m.KpiMaster.DefaultIcon,
                Color = !string.IsNullOrWhiteSpace(m.CustomColor) ? m.CustomColor : m.KpiMaster.DefaultColor,
                DisplayOrder = m.DisplayOrder
            })
            .ToListAsync(ct);

        if (deptConfigs != null && deptConfigs.Count > 0)
        {
            return deptConfigs;
        }

        // Fallback: Read directly from GIS.GisKpiMaster table so any updated DefaultColor dynamically reflects
        return await _context.GisKpiMasters
            .AsNoTracking()
            .Where(k => k.IsActive)
            .OrderBy(k => k.Id)
            .Select(k => new GisDepartmentKpiConfigDto
            {
                KpiCode = k.KpiCode,
                Title = k.DefaultTitle,
                Icon = k.DefaultIcon,
                Color = k.DefaultColor,
                DisplayOrder = k.Id
            })
            .ToListAsync(ct);
    }

    public async Task<List<GisDepartmentFilterConfigDto>> GetActiveDepartmentFiltersAsync(int departmentId, CancellationToken ct = default)
    {
        return await _context.GisDepartmentFilterMappings
            .AsNoTracking()
            .Include(m => m.FilterMaster)
            .Where(m => m.DepartmentId == departmentId && 
                        m.IsActive && 
                        m.FilterMaster != null && 
                        m.FilterMaster.IsActive)
            .OrderBy(m => m.DisplayOrder)
            .Select(m => new GisDepartmentFilterConfigDto
            {
                FilterKey = m.FilterMaster!.FilterKey,
                FilterLabel = !string.IsNullOrWhiteSpace(m.CustomLabel) ? m.CustomLabel : m.FilterMaster.FilterLabel,
                ControlType = m.FilterMaster.ControlType,
                ApiSourceUrl = m.FilterMaster.ApiSourceUrl,
                DisplayOrder = m.DisplayOrder
            })
            .ToListAsync(ct);
    }

    public async Task<GisAssetPopupDetailsDto?> GetAssetPopupDetailsAsync(int assetId, CancellationToken ct = default)
    {
        // 1. Fetch Asset Master and related details with Parent Asset navigation
        var asset = await _context.AssetMaster
            .AsNoTracking()
            .Include(a => a.Details)
            .Include(a => a.AssetType)
            .Include(a => a.ParentAsset)
            .FirstOrDefaultAsync(a => a.Id == assetId && a.IsActive && !a.MarkedForDeletion, ct);

        if (asset == null) return null;

        // 2. Fetch Department Name if DepartmentId is set
        string? departmentName = null;
        if (asset.DepartmentId.HasValue)
        {
            departmentName = await _context.OwningDepartment
                .AsNoTracking()
                .Where(d => d.Id == asset.DepartmentId.Value && d.IsActive && !d.MarkedForDeletion)
                .Select(d => d.OwningDepartmentName)
                .FirstOrDefaultAsync(ct);
        }

        // 3. Fetch SubUnits for area, floor, construction year, and capital value
        var subUnits = await _context.SubUnitsDetails
            .AsNoTracking()
            .Where(s => s.AssetId == assetId && s.IsActive && !s.MarkedForDeletion)
            .Select(s => new { s.CarpetAreaSqFeet, s.BuiltUpAreaSqFeet, s.ConstructionYear, s.FloorId, s.CapitalValue })
            .ToListAsync(ct);

        decimal carpetArea = subUnits.Sum(s => s.CarpetAreaSqFeet ?? 0m);
        decimal builtUpArea = subUnits.Sum(s => s.BuiltUpAreaSqFeet ?? 0m);
        decimal capitalValue = subUnits.Sum(s => s.CapitalValue ?? 0m);
        int totalFloors = subUnits.Select(s => s.FloorId).Distinct().Count();

        var constYears = subUnits
            .Select(s => s.ConstructionYear)
            .Where(y => !string.IsNullOrWhiteSpace(y))
            .Distinct()
            .ToList();
        string? constYearStr = constYears.Count > 0 ? string.Join(", ", constYears) : null;

        // 4. Fetch Room / Unit count
        int roomsOrUnits = await _context.AssetRoomWiseSubmissionDetails
            .AsNoTracking()
            .CountAsync(r => r.AssetId == assetId && !r.MarkedForDeletion, ct);

        // 5. Fetch Annual Revenue (Demand Amount)
        decimal annualRevenue = await _context.MonthWiseDemand
            .AsNoTracking()
            .Where(m => m.AssetId == assetId && m.IsActive)
            .SumAsync(m => (decimal?)m.TotalDemandAmount, ct) ?? 0m;

        // 6. Fetch Lease / Tenant details (if this asset or shop is leased)
        var activeLease = await _context.AssetLeaseRentDetails
            .AsNoTracking()
            .Where(l => l.AssetId == assetId && !l.MarkedForDeletion)
            .OrderByDescending(l => l.Id)
            .Select(l => new { l.TenantName, l.TenantMobile, l.RentAmount, l.ShopNo, l.ShopName })
            .FirstOrDefaultAsync(ct);

        // 7. Fetch GIS Geometry Links
        var geom = await _context.GisAssetGeometries
            .AsNoTracking()
            .Where(g => g.AssetMasterId == assetId && !g.MarkedForDeletion)
            .Select(g => new { g.GoogleMapLink, g.Link360 })
            .FirstOrDefaultAsync(ct);

        // 8. Fetch Photos (Front, Aerial, Interior, etc.)
        // ams.AssetPhoto -> ams.AssetPhotoType + CORE.DocumentBinding -> CORE.Document
        var photos = await _context.AssetPhotos
            .AsNoTracking()
            .Include(p => p.PhotoType)
            .Include(p => p.DocumentBinding)
                .ThenInclude(b => b!.Document)
            .Where(p => p.AssetId == assetId && p.IsLatest && p.IsActive && !p.MarkedForDeletion)
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.PhotoTypeId)
            .Select(p => new GisAssetPopupPhotoDto
            {
                PhotoId = p.Id,
                PhotoTypeId = p.PhotoTypeId,
                PhotoTypeName = p.PhotoType != null ? p.PhotoType.PhotoTypeName : "Asset Photo",
                PhotoTypeCode = p.PhotoType != null ? p.PhotoType.PhotoTypeCode : "PHOTO",
                DocumentBindingId = p.DocumentBindingId,
                DocumentGuid = p.DocumentBinding != null && p.DocumentBinding.Document != null ? p.DocumentBinding.Document.DocumentGuid : null,
                FileName = p.DocumentBinding != null && p.DocumentBinding.Document != null ? p.DocumentBinding.Document.OriginalFileName : null,
                FileExtension = p.DocumentBinding != null && p.DocumentBinding.Document != null ? p.DocumentBinding.Document.FileExtension : null,
                MimeType = p.DocumentBinding != null && p.DocumentBinding.Document != null ? p.DocumentBinding.Document.MimeType : null,
                FileSizeBytes = p.DocumentBinding != null && p.DocumentBinding.Document != null ? p.DocumentBinding.Document.FileSizeBytes : null,
                FileUrl = p.DocumentBinding != null && p.DocumentBinding.Document != null && p.DocumentBinding.Document.DocumentGuid != Guid.Empty
                    ? $"/api/documents/{p.DocumentBinding.Document.DocumentGuid}/view"
                    : $"/api/asset-photos/{p.Id}/file",
                Remarks = p.Remarks,
                DisplayOrder = p.DisplayOrder
            })
            .ToListAsync(ct);

        // 9. Fetch Documents (7/12 Extract, Survey Form, Property Card, Akhiv Patrika, etc.)
        // ams.AssetDocument -> ams.AssetDocumentDefinition + CORE.DocumentBinding -> CORE.Document
        var documents = await _context.AssetDocuments
            .AsNoTracking()
            .Include(d => d.DocumentDefinition)
            .Include(d => d.DocumentBinding)
                .ThenInclude(b => b!.Document)
            .Where(d => d.AssetId == assetId && d.IsActive && !d.MarkedForDeletion)
            .OrderBy(d => d.DocumentDefinition != null ? d.DocumentDefinition.DisplayOrder : 1)
            .ThenBy(d => d.DocumentDefinitionId)
            .Select(d => new GisAssetPopupDocumentDto
            {
                DocumentId = d.Id,
                DocumentDefinitionId = d.DocumentDefinitionId,
                DocumentName = d.DocumentDefinition != null ? d.DocumentDefinition.DocumentName : "Document",
                DocumentCode = d.DocumentDefinition != null ? d.DocumentDefinition.DocumentCode : "DOC",
                DocumentBindingId = d.DocumentBindingId,
                DocumentGuid = d.DocumentBinding != null && d.DocumentBinding.Document != null ? d.DocumentBinding.Document.DocumentGuid : null,
                FileName = d.DocumentBinding != null && d.DocumentBinding.Document != null ? d.DocumentBinding.Document.OriginalFileName : null,
                FileExtension = d.DocumentBinding != null && d.DocumentBinding.Document != null ? d.DocumentBinding.Document.FileExtension : null,
                MimeType = d.DocumentBinding != null && d.DocumentBinding.Document != null ? d.DocumentBinding.Document.MimeType : null,
                FileSizeBytes = d.DocumentBinding != null && d.DocumentBinding.Document != null ? d.DocumentBinding.Document.FileSizeBytes : null,
                FileUrl = d.DocumentBinding != null && d.DocumentBinding.Document != null && d.DocumentBinding.Document.DocumentGuid != Guid.Empty
                    ? $"/api/documents/{d.DocumentBinding.Document.DocumentGuid}/download"
                    : $"/api/asset-documents/{d.Id}/file",
                Remarks = d.Remarks,
                DisplayOrder = d.DisplayOrder
            })
            .ToListAsync(ct);

        // 10. Fetch Child Shops / Galas / Sub-units for Shopping Complexes (AMS.AssetMaster WHERE ParentAssetId = @AssetId)
        var childShopsRaw = await _context.AssetMaster
            .AsNoTracking()
            .Where(c => c.ParentAssetId == assetId && c.IsActive && !c.MarkedForDeletion)
            .OrderBy(c => c.AssetNo)
            .Select(c => new
            {
                c.Id,
                c.ParentAssetId,
                c.AssetNo,
                c.AssetName,
                c.OccupancyStatus,
                Details = _context.AssetDetails.FirstOrDefault(d => d.AssetId == c.Id && d.IsActive && !d.MarkedForDeletion),
                SubUnits = _context.SubUnitsDetails
                    .Where(s => s.AssetId == c.Id && s.IsActive && !s.MarkedForDeletion)
                    .Select(s => new
                    {
                        s.CarpetAreaSqFeet,
                        s.BuiltUpAreaSqFeet,
                        s.CapitalValue,
                        FloorDesc = s.Floor != null ? (s.Floor.Description ?? s.Floor.FloorCode) : null
                    })
                    .ToList(),
                Lease = _context.AssetLeaseRentDetails
                    .Where(l => l.AssetId == c.Id && l.IsActive && !l.MarkedForDeletion)
                    .OrderByDescending(l => l.Id)
                    .Select(l => new
                    {
                        l.ShopNo,
                        l.ShopName,
                        l.TenantName,
                        l.TenantMobile,
                        l.RentAmount,
                        l.TotalAreaSqFt,
                        l.WorkflowStatus
                    })
                    .FirstOrDefault(),
                AnnualRevenue = _context.MonthWiseDemand
                    .Where(m => m.AssetId == c.Id && m.IsActive)
                    .Sum(m => (decimal?)m.TotalDemandAmount) ?? 0m,
                PhotoCount = _context.AssetPhotos
                    .Count(p => p.AssetId == c.Id && p.IsLatest && p.IsActive && !p.MarkedForDeletion),
                PrimaryPhoto = _context.AssetPhotos
                    .Where(p => p.AssetId == c.Id && p.IsLatest && p.IsActive && !p.MarkedForDeletion)
                    .OrderBy(p => p.DisplayOrder)
                    .Select(p => new
                    {
                        p.Id,
                        DocumentGuid = p.DocumentBinding != null && p.DocumentBinding.Document != null ? (Guid?)p.DocumentBinding.Document.DocumentGuid : (Guid?)null
                    })
                    .FirstOrDefault(),
                DocumentCount = _context.AssetDocuments
                    .Count(d => d.AssetId == c.Id && d.IsActive && !d.MarkedForDeletion)
            })
            .ToListAsync(ct);

        var childShops = childShopsRaw.Select(cs =>
        {
            decimal shopCarpet = cs.SubUnits.Sum(s => s.CarpetAreaSqFeet ?? 0m);
            if (shopCarpet == 0 && cs.Lease?.TotalAreaSqFt.HasValue == true)
            {
                shopCarpet = cs.Lease.TotalAreaSqFt.Value;
            }
            else if (shopCarpet == 0 && cs.Details?.LandAreaSqFeet.HasValue == true)
            {
                shopCarpet = cs.Details.LandAreaSqFeet.Value;
            }

            decimal shopBuiltUp = cs.SubUnits.Sum(s => s.BuiltUpAreaSqFeet ?? 0m);
            decimal shopCapitalVal = cs.SubUnits.Sum(s => s.CapitalValue ?? 0m);
            string? floorName = cs.SubUnits.FirstOrDefault(s => !string.IsNullOrWhiteSpace(s.FloorDesc))?.FloorDesc;

            string? primaryPhotoUrl = null;
            if (cs.PrimaryPhoto != null)
            {
                primaryPhotoUrl = cs.PrimaryPhoto.DocumentGuid.HasValue && cs.PrimaryPhoto.DocumentGuid.Value != Guid.Empty
                    ? $"/api/documents/{cs.PrimaryPhoto.DocumentGuid.Value}/view"
                    : $"/api/asset-photos/{cs.PrimaryPhoto.Id}/file";
            }

            string? tenantName = !string.IsNullOrWhiteSpace(cs.Lease?.TenantName)
                ? cs.Lease.TenantName
                : (!string.IsNullOrWhiteSpace(cs.Details?.InChargeName) ? cs.Details.InChargeName : null);

            string? tenantMobile = !string.IsNullOrWhiteSpace(cs.Lease?.TenantMobile)
                ? cs.Lease.TenantMobile
                : (!string.IsNullOrWhiteSpace(cs.Details?.InChargeMobile) ? cs.Details.InChargeMobile : null);

            decimal? monthlyRent = cs.Lease?.RentAmount;

            return new GisAssetChildShopDto
            {
                AssetId = cs.Id,
                ParentAssetId = cs.ParentAssetId,
                AssetNo = cs.AssetNo,
                MPMSNo = cs.Details?.MpmsNo ?? cs.Details?.PropertyNo ?? cs.AssetNo,
                AssetName = cs.AssetName,
                UnitNo = cs.Details?.UnitNo ?? cs.Lease?.ShopNo,
                FloorName = floorName,
                CarpetAreaSqFt = shopCarpet > 0 ? shopCarpet : null,
                BuiltUpAreaSqFt = shopBuiltUp > 0 ? shopBuiltUp : null,
                TenantName = tenantName,
                TenantMobile = tenantMobile,
                OccupancyStatus = !string.IsNullOrWhiteSpace(cs.OccupancyStatus) 
                    ? cs.OccupancyStatus 
                    : (!string.IsNullOrWhiteSpace(tenantName) ? "Rented" : "Vacant"),
                MonthlyRent = monthlyRent,
                CapitalValue = shopCapitalVal > 0 ? shopCapitalVal : null,
                AnnualRevenue = cs.AnnualRevenue > 0 ? cs.AnnualRevenue : (monthlyRent.HasValue ? monthlyRent.Value * 12 : null),
                PhotoCount = cs.PhotoCount,
                DocumentCount = cs.DocumentCount,
                PrimaryPhotoUrl = primaryPhotoUrl
            };
        }).ToList();

        var details = asset.Details;

        return new GisAssetPopupDetailsDto
        {
            AssetId = asset.Id,
            ParentAssetId = asset.ParentAssetId,
            ParentAssetName = asset.ParentAsset?.AssetName,
            ParentAssetNo = asset.ParentAsset?.AssetNo,
            MPMSID = details?.MpmsNo ?? details?.PropertyNo ?? asset.AssetNo,
            AssetNo = details?.MpmsNo ?? asset.AssetNo,
            AssetName = asset.AssetName,
            AssetType = asset.AssetType?.TypeName,
            Department = departmentName,
            InCharge = details?.InChargeName,
            TenantName = activeLease?.TenantName ?? details?.InChargeName,
            Encroachment = asset.EncroachmentStatus,
            MobileNo = activeLease?.TenantMobile ?? details?.InChargeMobile,
            PlotNo = details?.PlotNo,
            PlotArea = details?.LandAreaSqFeet,
            FormattedPlotArea = details?.LandAreaSqFeet.HasValue == true ? $"{details.LandAreaSqFeet.Value:N2} Sq.Ft" : null,
            CitySurveyNo = details?.CSN,
            CarpetAreaSqFt = carpetArea > 0 ? carpetArea : null,
            FormattedCarpetArea = carpetArea > 0 ? $"{carpetArea:N2} Sq.Ft" : null,
            BuiltUpAreaSqFt = builtUpArea > 0 ? builtUpArea : null,
            FormattedBuiltUpArea = builtUpArea > 0 ? $"{builtUpArea:N2} Sq.Ft" : null,
            ConstYear = constYearStr,
            TotalFloors = totalFloors,
            RoomsOrUnits = roomsOrUnits,
            Address = !string.IsNullOrWhiteSpace(details?.RegionalAddress) ? details.RegionalAddress : details?.Address,
            CapitalValue = capitalValue,
            AnnualRevenue = annualRevenue,
            MonthlyRent = activeLease?.RentAmount,
            FormattedMonthlyRent = activeLease?.RentAmount.HasValue == true ? $"₹ {activeLease.RentAmount.Value:N0}" : null,
            GoogleMapLink = geom?.GoogleMapLink,
            Link360 = geom?.Link360,
            Photos = photos,
            Documents = documents,
            ChildShops = childShops
        };
    }

    /// <inheritdoc />
    public async Task<List<GisAssetExportRowDto>> GetFilteredAssetExportListAsync(
        int? zoneId,
        int? wardId,
        int? assetCategoryId,
        int? assetTypeId,
        int? departmentId,
        string? encroachmentStatus,
        string? ownershipType,
        string? searchTerm,
        string? kpiCode,
        int? financeYear,
        double? minLat,
        double? minLng,
        double? maxLat,
        double? maxLng,
        int? ulbId = null,
        CancellationToken ct = default)
    {
        // 1. Base Asset query (active records only)
        IQueryable<AssetMasterEntity> query = _context.AssetMaster
            .AsNoTracking()
            .Where(a => a.IsActive && !a.MarkedForDeletion);

        // 2. Zone, Ward, and ULB filter via AMS.AssetDetails
        bool hasZone = zoneId.HasValue && zoneId.Value > 0;
        bool hasWard = wardId.HasValue && wardId.Value > 0;
        bool hasUlb = ulbId.HasValue && ulbId.Value > 0;
        if (hasZone || hasWard || hasUlb)
        {
            query = query.Where(a => _context.AssetDetails
                .Any(d => d.AssetId == a.Id && d.IsActive && !d.MarkedForDeletion &&
                          (!hasUlb || d.OrganizationId == ulbId!.Value) &&
                          (!hasZone || d.ZoneId == zoneId!.Value) &&
                          (!hasWard || d.WardId == wardId!.Value)));
        }

        // 3. Category filter
        if (assetCategoryId.HasValue && assetCategoryId.Value > 0)
        {
            query = query.Where(a => a.AssetCategoryId == assetCategoryId.Value &&
                _context.AssetCategory.Any(c => c.Id == a.AssetCategoryId && c.IsActive && !c.MarkedForDeletion));
        }

        // 4. Type filter
        if (assetTypeId.HasValue && assetTypeId.Value > 0)
        {
            query = query.Where(a => a.AssetTypeId == assetTypeId.Value &&
                _context.AssetType.Any(t => t.Id == a.AssetTypeId && t.IsActive && !t.MarkedForDeletion));
        }

        // 5. Owning Department filter
        if (departmentId.HasValue && departmentId.Value > 0)
        {
            query = query.Where(a => a.DepartmentId == departmentId.Value);
        }

        // 6. Encroachment status filter
        if (!string.IsNullOrWhiteSpace(encroachmentStatus) && !string.Equals(encroachmentStatus.Trim(), "string", StringComparison.OrdinalIgnoreCase))
        {
            string enc = encroachmentStatus.Trim().ToUpper();
            query = query.Where(a => a.EncroachmentStatus != null && a.EncroachmentStatus.ToUpper() == enc);
        }

        // 7. Ownership type filter
        if (!string.IsNullOrWhiteSpace(ownershipType) && !string.Equals(ownershipType.Trim(), "string", StringComparison.OrdinalIgnoreCase))
        {
            string own = ownershipType.Trim().ToUpper();
            query = query.Where(a => a.OwnershipType != null && a.OwnershipType.ToUpper() == own);
        }

        // 8. Search Term filter
        if (!string.IsNullOrWhiteSpace(searchTerm) && !string.Equals(searchTerm.Trim(), "string", StringComparison.OrdinalIgnoreCase))
        {
            string term = searchTerm.Trim();
            query = query.Where(a => a.AssetNo.Contains(term) || a.AssetName.Contains(term));
        }

        // 9. KPI Code filter
        if (!string.IsNullOrWhiteSpace(kpiCode) && !string.Equals(kpiCode.Trim(), "string", StringComparison.OrdinalIgnoreCase))
        {
            var cleanKpi = kpiCode.Trim().ToUpperInvariant();
            if (cleanKpi == "FIXED_ASSETS")
            {
                query = query.Where(a => _context.AssetCategory
                    .Any(c => c.Id == a.AssetCategoryId && !c.MarkedForDeletion && !c.IsMovable));
            }
            else if (cleanKpi == "MOVABLE_ASSETS")
            {
                query = query.Where(a => _context.AssetCategory
                    .Any(c => c.Id == a.AssetCategoryId && !c.MarkedForDeletion && c.IsMovable));
            }
            else if (cleanKpi == "ENCROACHED_ASSETS")
            {
                query = query.Where(a => a.EncroachmentStatus != null &&
                    (a.EncroachmentStatus.Trim().ToUpper() == "FULL" || a.EncroachmentStatus.Trim().ToUpper() == "PARTIAL"));
            }
        }

        // 10. Spatial Bounding Box Filter
        if (minLat.HasValue && minLng.HasValue && maxLat.HasValue && maxLng.HasValue)
        {
            decimal minLatDec = (decimal)minLat.Value;
            decimal maxLatDec = (decimal)maxLat.Value;
            decimal minLngDec = (decimal)minLng.Value;
            decimal maxLngDec = (decimal)maxLng.Value;

            query = query.Where(a => _context.GisAssetGeometries
                .Any(g => g.AssetMasterId == a.Id && !g.MarkedForDeletion &&
                          g.CentroidY >= minLatDec && g.CentroidY <= maxLatDec &&
                          g.CentroidX >= minLngDec && g.CentroidX <= maxLngDec));
        }

        int targetFy = (financeYear.HasValue && financeYear.Value > 1900) ? financeYear.Value : 2026;

        // Execute query and project to export DTO
        var items = await query
            .OrderBy(a => a.Id)
            .Select(a => new
            {
                Asset = a,
                Category = a.AssetCategory,
                Type = a.AssetType,
                Details = _context.AssetDetails.FirstOrDefault(d => d.AssetId == a.Id && d.IsActive && !d.MarkedForDeletion),
                Geom = _context.GisAssetGeometries.FirstOrDefault(g => g.AssetMasterId == a.Id && !g.MarkedForDeletion),
                CapitalValue = _context.SubUnitsDetails
                    .Where(s => s.AssetId == a.Id && s.IsActive && !s.MarkedForDeletion)
                    .Sum(s => (decimal?)(s.CapitalValue ?? 0m)) ?? 0m,
                CarpetArea = _context.SubUnitsDetails
                    .Where(s => s.AssetId == a.Id && s.IsActive && !s.MarkedForDeletion)
                    .Sum(s => (decimal?)(s.CarpetAreaSqFeet ?? 0m)) ?? 0m,
                BuiltUpArea = _context.SubUnitsDetails
                    .Where(s => s.AssetId == a.Id && s.IsActive && !s.MarkedForDeletion)
                    .Sum(s => (decimal?)(s.BuiltUpAreaSqFeet ?? 0m)) ?? 0m,
                AnnualRevenue = _context.MonthWiseDemand
                    .Where(m => m.AssetId == a.Id && m.IsActive && (m.FinanceYear == targetFy || m.DemandYear == targetFy))
                    .Sum(m => (decimal?)m.TotalDemandAmount) ?? 0m,
                PhotoCount = _context.AssetPhotos
                    .Count(p => p.AssetId == a.Id && p.IsLatest && p.IsActive && !p.MarkedForDeletion),
                DocumentCount = _context.AssetDocuments
                    .Count(d => d.AssetId == a.Id && d.IsActive && !d.MarkedForDeletion)
            })
            .ToListAsync(ct);

        // Fetch Zone & Ward lookups to resolve friendly names
        var zoneMap = await _context.ZoneMaster.AsNoTracking().ToDictionaryAsync(z => z.Id, z => z.ZoneNo, ct);
        var wardMap = await _context.WardMaster.AsNoTracking().ToDictionaryAsync(w => w.Id, w => w.WardNo, ct);
        var deptMap = await _context.DepartmentMasters.AsNoTracking().ToDictionaryAsync(d => d.Id, d => d.DepartmentName, ct);

        var result = new List<GisAssetExportRowDto>(items.Count);

        foreach (var item in items)
        {
            var a = item.Asset;
            var d = item.Details;
            var g = item.Geom;

            string? zoneName = d?.ZoneId.HasValue == true && zoneMap.TryGetValue(d.ZoneId.Value, out var zn) ? zn : null;
            string? wardName = d?.WardId.HasValue == true && wardMap.TryGetValue(d.WardId.Value, out var wn) ? wn : null;
            string? deptName = a.DepartmentId.HasValue && deptMap.TryGetValue(a.DepartmentId.Value, out var dn) 
                ? dn 
                : "Asset Department";

            result.Add(new GisAssetExportRowDto
            {
                AssetId = a.Id,
                MPMSID = d?.MpmsNo ?? d?.PropertyNo ?? a.AssetNo,
                AssetNo = a.AssetNo,
                AssetName = a.AssetName,
                Department = deptName,
                AssetCategory = item.Category?.CategoryName ?? "General",
                AssetType = item.Type?.TypeName ?? "General",
                OwnershipType = a.OwnershipType ?? "Municipal Corporation",
                Zone = zoneName,
                Ward = wardName,
                PlotNo = d?.PlotNo,
                CitySurveyNo = d?.CSN,
                Address = !string.IsNullOrWhiteSpace(d?.RegionalAddress) ? d.RegionalAddress : d?.Address,
                Latitude = g?.CentroidY.HasValue == true ? (double)g.CentroidY.Value : (d?.Latitude.HasValue == true ? (double)d.Latitude.Value : null),
                Longitude = g?.CentroidX.HasValue == true ? (double)g.CentroidX.Value : (d?.Longitude.HasValue == true ? (double)d.Longitude.Value : null),
                PlotAreaSqFt = d?.LandAreaSqFeet,
                CarpetAreaSqFt = item.CarpetArea,
                BuiltUpAreaSqFt = item.BuiltUpArea,
                ConstYear = null,
                TotalFloors = 1,
                RoomsOrUnits = 1,
                CapitalValue = item.CapitalValue,
                AnnualRevenue = item.AnnualRevenue,
                Encroachment = a.EncroachmentStatus ?? "None",
                InCharge = d?.InChargeName,
                MobileNo = d?.InChargeMobile,
                GoogleMapLink = g?.GoogleMapLink,
                Link360 = g?.Link360,
                PhotoCount = item.PhotoCount,
                DocumentCount = item.DocumentCount
            });
        }

        return result;
    }
}
