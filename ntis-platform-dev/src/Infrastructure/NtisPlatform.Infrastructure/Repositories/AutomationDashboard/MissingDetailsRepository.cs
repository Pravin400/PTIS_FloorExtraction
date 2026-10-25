using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Interfaces.IAutomationDashboard;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.AutomationDashboard;

/// <summary>
/// Repository for Missing Details dashboard data.
/// Category queries use <c>PropertyMast</c> as the primary table, joined to
/// <c>WardMaster</c> and <c>ZoneMaster</c> for zone-wise grouping and filtering.
/// Registered property queries use <c>PropertyMastOld</c> and <c>PropertyMapDetail</c>.
/// Extends <see cref="WorkflowStageBaseRepository"/> for the shared
/// <c>GetZonesAsync</c> helper and the <c>_context</c> field.
/// </summary>
public class MissingDetailsRepository : WorkflowStageBaseRepository, IMissingDetailsRepository
{
    public MissingDetailsRepository(ApplicationDbContext context) : base(context)
    {
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Zones
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<List<(int ZoneId, string ZoneNo, string ZoneName)>> ReadZonesAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ZoneMaster.AsNoTracking().Where(z => z.IsActive);
        if (!string.IsNullOrWhiteSpace(zoneNo))
        {
            var trimmed = zoneNo.Trim();
            query = query.Where(z => z.ZoneNo == trimmed);
        }

        return await query
            .OrderBy(z => z.SequenceNo ?? 0)
            .ThenBy(z => z.ZoneNo)
            .Select(z => new ValueTuple<int, string, string>(z.Id, z.ZoneNo, z.Description ?? z.ZoneNo))
            .ToListAsync(cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Missing Mobile Number
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMissingMobileNoByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        return await BuildMissingCountByZoneQuery(
                p => string.IsNullOrEmpty(p.MobileNo),
                zoneNo)
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Missing Owner Name
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMissingOwnerNameByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        return await BuildMissingCountByZoneQuery(
                p => string.IsNullOrEmpty(p.OwnerName),
                zoneNo)
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Missing Address
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMissingAddressByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        return await BuildMissingCountByZoneQuery(
                p => string.IsNullOrEmpty(p.Address),
                zoneNo)
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Missing Occupier Name
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMissingOccupierNameByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        return await BuildMissingCountByZoneQuery(
                p => string.IsNullOrEmpty(p.OccupierName),
                zoneNo)
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Missing Shop / Flat Name
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMissingShopNameByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        return await BuildMissingCountByZoneQuery(
                p => string.IsNullOrEmpty(p.FlatOrShopName),
                zoneNo)
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Registered Property Data (PropertyMastOld & PropertyMapDetail)
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadTotalOldPropertiesByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        var zones = await ReadZonesAsync(zoneNo, cancellationToken);
        if (!zones.Any())
            return new Dictionary<int, int>();

        var zoneIds = zones.Select(z => z.ZoneId).ToList();
        var wards = await _context.WardMaster.AsNoTracking()
            .Where(w => w.IsActive && zoneIds.Contains(w.ZoneId) && w.WardNo != null)
            .Select(w => new { w.ZoneId, WardNo = w.WardNo! })
            .ToListAsync(cancellationToken);

        var wardToZoneMap = wards
            .GroupBy(w => w.WardNo.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().ZoneId, StringComparer.OrdinalIgnoreCase);

        var oldZoneGroups = await _context.PropertyMastOld.AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion)
            .GroupBy(p => new { p.OldZoneNo, p.OldWardNo })
            .Select(g => new { g.Key.OldZoneNo, g.Key.OldWardNo, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<int, int>();
        foreach (var z in zones)
        {
            var targetZNo = z.ZoneNo?.Trim();
            var targetZName = z.ZoneName?.Trim();
            var targetZIdStr = z.ZoneId.ToString();

            var count = oldZoneGroups
                .Where(g =>
                {
                    var gz = g.OldZoneNo?.Trim();
                    if (!string.IsNullOrEmpty(gz))
                    {
                        return string.Equals(gz, targetZNo, StringComparison.OrdinalIgnoreCase)
                            || string.Equals(gz, targetZName, StringComparison.OrdinalIgnoreCase)
                            || string.Equals(gz, targetZIdStr, StringComparison.OrdinalIgnoreCase);
                    }
                    var gw = g.OldWardNo?.Trim();
                    if (!string.IsNullOrEmpty(gw) && wardToZoneMap.TryGetValue(gw, out var mappedZoneId))
                    {
                        return mappedZoneId == z.ZoneId;
                    }
                    return false;
                })
                .Sum(g => g.Count);

            result[z.ZoneId] = count;
        }

        return result;
    }

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMergedPropertiesByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        var query = from pmd in _context.PropertyMapDetails.AsNoTracking()
                    where pmd.IsActive
                          && pmd.Status == "ACTIVE"
                          && pmd.PropertyIdOld != null
                          && pmd.PropertyIdNew != null
                    join p in _context.PropertyMast.AsNoTracking()
                        on pmd.PropertyIdNew equals p.Id
                    where p.IsActive && !p.MarkedForDeletion
                    join w in _context.WardMaster.AsNoTracking()
                        on p.WardId equals w.Id
                    where w.IsActive
                    join z in _context.ZoneMaster.AsNoTracking()
                        on w.ZoneId equals z.Id
                    where z.IsActive
                    select new { pmd.PropertyIdOld, w.ZoneId, z.ZoneNo };

        if (!string.IsNullOrWhiteSpace(zoneNo))
        {
            var trimmed = zoneNo.Trim();
            query = query.Where(x => x.ZoneNo == trimmed);
        }

        return await query
            .GroupBy(x => x.ZoneId)
            .Select(g => new
            {
                ZoneId = g.Key,
                Count = g.Select(x => x.PropertyIdOld).Distinct().Count()
            })
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<(int TotalOldProperties, int TotalMergedProperties)> ReadRegisteredPropertyTotalsAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(zoneNo))
        {
            var trimmed = zoneNo.Trim();
            var zone = await _context.ZoneMaster.AsNoTracking()
                .Where(z => z.IsActive && z.ZoneNo == trimmed)
                .Select(z => new { z.Id, z.ZoneNo, ZoneName = z.Description ?? z.ZoneNo })
                .FirstOrDefaultAsync(cancellationToken);

            if (zone == null)
            {
                return (0, 0);
            }

            var targetZoneNo = zone.ZoneNo?.Trim();
            var targetZoneName = zone.ZoneName?.Trim();
            var targetZoneIdStr = zone.Id.ToString();

            var wardNosInZone = await _context.WardMaster.AsNoTracking()
                .Where(w => w.IsActive && w.ZoneId == zone.Id && w.WardNo != null)
                .Select(w => w.WardNo!)
                .ToListAsync(cancellationToken);

            var oldQuery = _context.PropertyMastOld.AsNoTracking()
                .Where(p => p.IsActive && !p.MarkedForDeletion);

            var oldTotal = await oldQuery.CountAsync(p =>
                (targetZoneNo != null && p.OldZoneNo == targetZoneNo)
                || (targetZoneName != null && p.OldZoneNo == targetZoneName)
                || (targetZoneIdStr != null && p.OldZoneNo == targetZoneIdStr)
                || (p.OldWardNo != null && wardNosInZone.Contains(p.OldWardNo)),
                cancellationToken);

            var mergedQuery = from pmd in _context.PropertyMapDetails.AsNoTracking()
                              where pmd.IsActive
                                    && pmd.Status == "ACTIVE"
                                    && pmd.PropertyIdOld != null
                                    && pmd.PropertyIdNew != null
                              join p in _context.PropertyMast.AsNoTracking()
                                  on pmd.PropertyIdNew equals p.Id
                              where p.IsActive && !p.MarkedForDeletion
                              join w in _context.WardMaster.AsNoTracking()
                                  on p.WardId equals w.Id
                              where w.IsActive && w.ZoneId == zone.Id
                              select pmd.PropertyIdOld;

            var mergedTotal = await mergedQuery.Distinct().CountAsync(cancellationToken);

            return (oldTotal, mergedTotal);
        }
        else
        {
            var oldTotal = await _context.PropertyMastOld.AsNoTracking()
                .CountAsync(p => p.IsActive && !p.MarkedForDeletion, cancellationToken);

            var mergedTotal = await _context.PropertyMapDetails.AsNoTracking()
                .Where(pmd => pmd.IsActive
                              && pmd.Status == "ACTIVE"
                              && pmd.PropertyIdOld != null
                              && pmd.PropertyIdNew != null)
                .Select(pmd => pmd.PropertyIdOld)
                .Distinct()
                .CountAsync(cancellationToken);

            return (oldTotal, mergedTotal);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Private shared query builder
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Builds the common EF Core query used by every missing-field method.
    /// Supports optional filtering by zoneNo.
    ///
    /// Pipeline:
    ///   PropertyMast (active, not deleted)
    ///   → filter by the category-specific missing predicate
    ///   → join WardMaster (active wards only)
    ///   → join ZoneMaster (active zones only)
    ///   → optionally filter by zoneNo
    ///   → group by ZoneId
    ///   → project to (ZoneId, Count)
    /// </summary>
    private IQueryable<(int ZoneId, int Count)> BuildMissingCountByZoneQuery(
        System.Linq.Expressions.Expression<Func<Core.Entities.PropertyEntity, bool>> missingPredicate,
        string? zoneNo = null)
    {
        var baseQuery = from p in _context.PropertyMast.AsNoTracking()
                                              .Where(x => x.IsActive && !x.MarkedForDeletion)
                                              .Where(missingPredicate)
                        join w in _context.WardMaster.AsNoTracking()
                            on p.WardId equals w.Id
                        where w.IsActive
                        join z in _context.ZoneMaster.AsNoTracking()
                            on w.ZoneId equals z.Id
                        where z.IsActive
                        select new { p, w.ZoneId, z.ZoneNo };

        if (!string.IsNullOrWhiteSpace(zoneNo))
        {
            var trimmed = zoneNo.Trim();
            baseQuery = baseQuery.Where(x => x.ZoneNo == trimmed);
        }

        return from x in baseQuery
               group x by x.ZoneId into g
               select ValueTuple.Create(g.Key, g.Count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Missing Photo & Plan
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMissingPhotoByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        return await BuildMissingPhotoTypeCountByZoneQuery("PROPERTY_FRONT", zoneNo)
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Dictionary<int, int>> ReadMissingPlanByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        return await BuildMissingPhotoTypeCountByZoneQuery("PROPERTY_PLAN", zoneNo)
            .ToDictionaryAsync(x => x.ZoneId, x => x.Count, cancellationToken);
    }

    /// <summary>
    /// Builds the zone-wise missing photo query for a specific PhotoTypeCode (e.g. PROPERTY_FRONT, PROPERTY_PLAN).
    /// Properties are considered missing if their Id is NOT IN the PropertyPhoto table for that PhotoTypeCode.
    /// Supports optional filtering by zoneNo.
    /// </summary>
    private IQueryable<(int ZoneId, int Count)> BuildMissingPhotoTypeCountByZoneQuery(
        string photoTypeCode,
        string? zoneNo = null)
    {
        var photoPropertyIds = from pp in _context.PropertyPhotos.AsNoTracking()
                               where pp.PropertyId != null
                               join ppt in _context.PropertyPhotoTypes.AsNoTracking()
                                   on pp.PhotoTypeId equals ppt.Id
                               where ppt.PhotoTypeCode == photoTypeCode
                               select pp.PropertyId!.Value;

        var baseQuery = from p in _context.PropertyMast.AsNoTracking()
                        where p.IsActive && !p.MarkedForDeletion
                        where !photoPropertyIds.Contains(p.Id)
                        join w in _context.WardMaster.AsNoTracking()
                            on p.WardId equals w.Id
                        where w.IsActive
                        join z in _context.ZoneMaster.AsNoTracking()
                            on w.ZoneId equals z.Id
                        where z.IsActive
                        select new { p.Id, w.ZoneId, z.ZoneNo };

        if (!string.IsNullOrWhiteSpace(zoneNo))
        {
            var trimmed = zoneNo.Trim();
            baseQuery = baseQuery.Where(x => x.ZoneNo == trimmed);
        }

        return from x in baseQuery
               group x by x.ZoneId into g
               select ValueTuple.Create(g.Key, g.Count());
    }
}
