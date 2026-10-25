using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Common;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories;

/// <summary>
/// Read-only repository for the ApartmentQC certificate grid.
/// Every query is AsNoTracking — this feature never writes.
/// </summary>
public sealed class ApartmentQcCertificateGridRepository : IApartmentQcCertificateGridRepository
{
    private readonly ApplicationDbContext _context;

    public ApartmentQcCertificateGridRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApartmentQcCertificateGridDto?> GetGridAsync(int wardId, string propertyNo, int? explicitSocietyId = null, CancellationToken cancellationToken = default)
    {
        // "Unit" = one PropertyMast row (one partition of this WardId+PropertyNo). All partitions
        // of the same property number together make up the whole apartment/building.
        var rawUnits = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion && p.WardId == wardId && p.PropertyNo == propertyNo)
            .Select(p => new { p.Id, p.PropertyNo, p.PartitionNo, p.FlatOrShopNo, p.WingDetailId })
            .ToListAsync(cancellationToken);

        if (rawUnits.Count == 0)
        {
            return null;
        }

        var units = rawUnits.Select(p => new
        {
            p.Id,
            UnitNo = FormatUnitNo(p.PropertyNo, p.PartitionNo, p.FlatOrShopNo, p.Id),
            p.WingDetailId
        }).ToList();

        var unitIds = units.Select(u => u.Id).ToList();

        var unitWingIds = units.Where(u => u.WingDetailId.HasValue).Select(u => u.WingDetailId!.Value).Distinct().ToList();

        var societyId = explicitSocietyId
            ?? await _context.SocietyDetailsMast.AsNoTracking()
                .Where(s => s.PropertyId.HasValue && unitIds.Contains(s.PropertyId.Value) && s.IsActive)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync(cancellationToken)
            ?? (unitWingIds.Count > 0
                ? await _context.WingDetailsMast.AsNoTracking()
                    .Where(w => unitWingIds.Contains(w.Id) && w.IsActive && w.SocietyDetailsMastId > 0)
                    .Select(w => (int?)w.SocietyDetailsMastId)
                    .FirstOrDefaultAsync(cancellationToken)
                : null);

        // Load all wings belonging to the society, plus any wings directly referenced by the property's units
        var societyWings = societyId.HasValue
            ? await _context.WingDetailsMast.AsNoTracking()
                .Where(w => w.SocietyDetailsMastId == societyId.Value && w.IsActive && !w.MarkedForDeletion)
                .Select(w => new { w.Id, w.WingName })
                .ToListAsync(cancellationToken)
            : new();

        var unitWings = unitWingIds.Count > 0
            ? await _context.WingDetailsMast.AsNoTracking()
                .Where(w => unitWingIds.Contains(w.Id) && w.IsActive && !w.MarkedForDeletion)
                .Select(w => new { w.Id, w.WingName })
                .ToListAsync(cancellationToken)
            : new();

        var wingsMap = new Dictionary<int, string?>();
        foreach (var w in societyWings)
        {
            wingsMap[w.Id] = w.WingName;
        }
        foreach (var w in unitWings)
        {
            wingsMap.TryAdd(w.Id, w.WingName);
        }

        var wings = wingsMap.Select(kvp => (Id: kvp.Key, WingName: kvp.Value)).ToList();
        var wingIds = wings.Select(w => w.Id).ToList();

        var unitsPerWing = units
            .Where(u => u.WingDetailId.HasValue)
            .GroupBy(u => u.WingDetailId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());

        var certTypes = await _context.PropertyCertificateTypeMasters.AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .ToListAsync(cancellationToken);

        var societyRows = new List<CertificateGridRowDto>();
        var wingRows = new List<CertificateGridRowDto>();
        var unitRows = new List<CertificateGridRowDto>();

        // Batch load all certificates for Society, Wings, and Units in 3 queries instead of 3 per certificate type
        var allSocietyCerts = societyId.HasValue
            ? await _context.PropertyCertificates.AsNoTracking()
                .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
                .Where(c => c.EntityType == "S" && c.SocietyDetailId == societyId.Value
                            && !c.MarkedForDeletion)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync(cancellationToken)
            : new List<PropertyCertificateEntity>();

        var societyCertsByType = allSocietyCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        var allWingCerts = wingIds.Count == 0 && !societyId.HasValue
            ? new List<PropertyCertificateEntity>()
            : await _context.PropertyCertificates.AsNoTracking()
                .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
                .Where(c => c.EntityType == "W"
                            && ((c.WingDetailId.HasValue && wingIds.Contains(c.WingDetailId.Value))
                                || (societyId.HasValue && c.SocietyDetailId == societyId.Value && c.WingDetailId.HasValue))
                            && !c.MarkedForDeletion)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync(cancellationToken);

        var wingCertsByType = allWingCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var allUnitCerts = await _context.PropertyCertificates.AsNoTracking()
            .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
            .Where(c => c.EntityType == "P" && c.PropertyDetailsId == null
                        && ((c.PropertyId.HasValue && unitIds.Contains(c.PropertyId.Value))
                            || (societyId.HasValue && c.SocietyDetailId == societyId.Value))
                        && !c.MarkedForDeletion)
            .OrderByDescending(c => c.CreatedDate)
            .ToListAsync(cancellationToken);

        var unitCertsByType = allUnitCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Resolve any wing names referenced in wing certificates that aren't yet in wingsMap
        var referencedWingIds = allWingCerts
            .Where(c => c.WingDetailId.HasValue)
            .Select(c => c.WingDetailId!.Value)
            .Except(wingsMap.Keys)
            .Distinct()
            .ToList();

        if (referencedWingIds.Count > 0)
        {
            var extraWings = await _context.WingDetailsMast.AsNoTracking()
                .Where(w => referencedWingIds.Contains(w.Id))
                .Select(w => new { w.Id, w.WingName })
                .ToListAsync(cancellationToken);
            foreach (var w in extraWings)
            {
                wingsMap.TryAdd(w.Id, w.WingName);
            }
        }

        // Build a unit number lookup including any property IDs referenced in unit certificates
        var unitNumberMap = units.ToDictionary(u => u.Id, u => u.UnitNo);
        var referencedPropertyIds = allUnitCerts
            .Where(c => c.PropertyId.HasValue)
            .Select(c => c.PropertyId!.Value)
            .Except(unitNumberMap.Keys)
            .Distinct()
            .ToList();

        if (referencedPropertyIds.Count > 0)
        {
            var extraProperties = await _context.PropertyMast.AsNoTracking()
                .Where(p => referencedPropertyIds.Contains(p.Id))
                .Select(p => new { p.Id, p.PropertyNo, p.PartitionNo, p.FlatOrShopNo })
                .ToListAsync(cancellationToken);
            foreach (var ep in extraProperties)
            {
                unitNumberMap[ep.Id] = FormatUnitNo(ep.PropertyNo, ep.PartitionNo, ep.FlatOrShopNo, ep.Id);
            }
        }

        foreach (var type in certTypes)
        {
            var societyCert = societyCertsByType.GetValueOrDefault(type.Id);
            if (societyCert != null)
            {
                societyRows.Add(BuildApartmentRow(type, societyCert, wings.Count, units.Count));
            }

            var wingCerts = wingCertsByType.GetValueOrDefault(type.Id) ?? new List<PropertyCertificateEntity>();
            var latestPerWing = wingCerts
                .Where(c => c.WingDetailId.HasValue)
                .GroupBy(c => c.WingDetailId!.Value)
                .ToDictionary(g => g.Key, g => g.First());

            var allEvalWingIds = wingIds.Union(latestPerWing.Keys).Distinct().ToList();

            foreach (var wingId in allEvalWingIds)
            {
                var effectiveCert = latestPerWing.GetValueOrDefault(wingId) ?? societyCert;
                if (effectiveCert == null)
                {
                    continue;
                }

                var wingName = wingsMap.GetValueOrDefault(wingId) ?? "Wing";
                var unitsInWing = unitsPerWing.GetValueOrDefault(wingId);
                wingRows.Add(BuildWingRow(type, effectiveCert, wingId, wingName, unitsInWing));
            }

            var unitCerts = unitCertsByType.GetValueOrDefault(type.Id) ?? new List<PropertyCertificateEntity>();
            if (unitCerts.Count > 0)
            {
                var certsPerUnit = unitCerts
                    .Where(c => c.PropertyId.HasValue)
                    .GroupBy(c => c.PropertyId!.Value)
                    .Select(g => g.First())
                    .ToList();

                foreach (var cert in certsPerUnit)
                {
                    var pid = cert.PropertyId!.Value;
                    var unitNo = unitNumberMap.GetValueOrDefault(pid);
                    var coveredUnitNumbers = !string.IsNullOrWhiteSpace(unitNo) ? new List<string> { unitNo } : new List<string>();
                    var coveredPropertyIds = new List<int> { pid };

                    unitRows.Add(BuildUnitRow(type, cert, coveredUnitNumbers, coveredPropertyIds, 1, units.Count));
                }
            }
        }

        RenumberRows(societyRows);
        RenumberRows(wingRows);
        RenumberRows(unitRows);

        return new ApartmentQcCertificateGridDto
        {
            WingCount = wings.Count,
            UnitCount = units.Count,
            SocietyCertificates = societyRows,
            WingCertificates = wingRows,
            UnitCertificates = unitRows,
        };
    }

    public async Task<ApartmentQcCertificateGridDto?> GetGridForWingAsync(int wingDetailsId, CancellationToken cancellationToken = default)
    {
        var wing = await _context.WingDetailsMast.AsNoTracking()
            .Where(w => w.Id == wingDetailsId && w.IsActive && !w.MarkedForDeletion)
            .Select(w => new { w.WingName, w.SocietyDetailsMastId })
            .FirstOrDefaultAsync(cancellationToken);

        if (wing is null)
        {
            return null;
        }

        var rawUnits = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.WingDetailId == wingDetailsId && p.IsActive && !p.MarkedForDeletion)
            .Select(p => new { p.Id, p.PropertyNo, p.PartitionNo, p.FlatOrShopNo, p.WardId })
            .ToListAsync(cancellationToken);

        if (rawUnits.Count == 0)
        {
            return null;
        }

        var units = rawUnits.Select(p => new
        {
            p.Id,
            UnitNo = FormatUnitNo(p.PropertyNo, p.PartitionNo, p.FlatOrShopNo, p.Id),
            p.WardId,
            p.PropertyNo
        }).ToList();

        var unitIds = units.Select(u => u.Id).ToList();

        var societyId = await _context.SocietyDetailsMast.AsNoTracking()
            .Where(s => s.Id == wing.SocietyDetailsMastId && s.IsActive)
            .Select(s => (int?)s.Id)
            .FirstOrDefaultAsync(cancellationToken);

        // A Society-level certificate applies to the whole apartment, not just this wing -- report
        // the true apartment-wide wing/unit counts on that row.
        var (apartmentWingCount, apartmentUnitCount) = await GetApartmentCountsAsync(units[0].WardId, units[0].PropertyNo, cancellationToken);

        var certTypes = await _context.PropertyCertificateTypeMasters.AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .ToListAsync(cancellationToken);

        var societyRows = new List<CertificateGridRowDto>();
        var wingRows = new List<CertificateGridRowDto>();
        var unitRows = new List<CertificateGridRowDto>();

        // Batch load all certificates for Society, Wing, and Units
        var allSocietyCerts = societyId.HasValue
            ? await _context.PropertyCertificates.AsNoTracking()
                .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
                .Where(c => c.EntityType == "S" && c.SocietyDetailId == societyId.Value
                            && !c.MarkedForDeletion)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync(cancellationToken)
            : new List<PropertyCertificateEntity>();

        var societyCertsByType = allSocietyCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        var allWingCerts = await _context.PropertyCertificates.AsNoTracking()
            .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
            .Where(c => c.EntityType == "W" && c.WingDetailId == wingDetailsId
                        && !c.MarkedForDeletion)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync(cancellationToken);

        var wingCertsByType = allWingCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        var allUnitCerts = await _context.PropertyCertificates.AsNoTracking()
            .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
            .Where(c => c.EntityType == "P" && c.PropertyDetailsId == null && c.PropertyId.HasValue
                        && unitIds.Contains(c.PropertyId.Value)
                        && !c.MarkedForDeletion)
            .OrderByDescending(c => c.CreatedDate)
            .ToListAsync(cancellationToken);

        var unitCertsByType = allUnitCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var type in certTypes)
        {
            var societyCert = societyCertsByType.GetValueOrDefault(type.Id);
            if (societyCert != null)
            {
                societyRows.Add(BuildApartmentRow(type, societyCert, apartmentWingCount, apartmentUnitCount));
            }

            var wingCert = wingCertsByType.GetValueOrDefault(type.Id);
            var effectiveWingCert = wingCert ?? societyCert;
            if (effectiveWingCert != null)
            {
                wingRows.Add(BuildWingRow(type, effectiveWingCert, wingDetailsId, wing.WingName, units.Count));
            }

            var unitCerts = unitCertsByType.GetValueOrDefault(type.Id) ?? new List<PropertyCertificateEntity>();
            if (unitCerts.Count > 0)
            {
                var latestPerUnit = unitCerts
                    .GroupBy(c => c.PropertyId!.Value)
                    .Select(g => g.First())
                    .ToList();

                foreach (var cert in latestPerUnit)
                {
                    var pid = cert.PropertyId!.Value;
                    var unitNo = units.FirstOrDefault(u => u.Id == pid)?.UnitNo;
                    var coveredUnitNumbers = !string.IsNullOrWhiteSpace(unitNo) ? new List<string> { unitNo } : new List<string>();
                    var coveredPropertyIds = new List<int> { pid };

                    unitRows.Add(BuildUnitRow(type, cert, coveredUnitNumbers, coveredPropertyIds, 1, units.Count));
                }
            }
        }

        RenumberRows(societyRows);
        RenumberRows(wingRows);
        RenumberRows(unitRows);

        return new ApartmentQcCertificateGridDto
        {
            WingCount = 1,
            UnitCount = units.Count,
            SocietyCertificates = societyRows,
            WingCertificates = wingRows,
            UnitCertificates = unitRows,
        };
    }

    public async Task<ApartmentQcCertificateGridDto?> GetGridForUnitAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var unit = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion)
            .Select(p => new { p.Id, p.PartitionNo, p.FlatOrShopNo, p.WingDetailId, p.WardId, p.PropertyNo })
            .FirstOrDefaultAsync(cancellationToken);

        if (unit is null)
        {
            return null;
        }

        string? wingName = null;
        int? societyId = null;

        if (unit.WingDetailId.HasValue)
        {
            var wing = await _context.WingDetailsMast.AsNoTracking()
                .Where(w => w.Id == unit.WingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                .Select(w => new { w.WingName, w.SocietyDetailsMastId })
                .FirstOrDefaultAsync(cancellationToken);

            if (wing != null)
            {
                wingName = wing.WingName;
                societyId = await _context.SocietyDetailsMast.AsNoTracking()
                    .Where(s => s.Id == wing.SocietyDetailsMastId && s.IsActive)
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            }
        }

        // Fallback for units not linked to a wing -- check direct property link or sibling partitions of the same apartment
        societyId ??= await _context.SocietyDetailsMast.AsNoTracking()
            .Where(s => s.PropertyId == propertyId && s.IsActive)
            .Select(s => (int?)s.Id)
            .FirstOrDefaultAsync(cancellationToken)
            ?? await (
                from s in _context.SocietyDetailsMast.AsNoTracking()
                join p in _context.PropertyMast.AsNoTracking() on s.PropertyId equals p.Id
                where p.WardId == unit.WardId && p.PropertyNo == unit.PropertyNo && s.IsActive && !p.MarkedForDeletion
                select (int?)s.Id
            ).FirstOrDefaultAsync(cancellationToken);

        // A Society-level certificate applies to the whole apartment, not just this unit -- report
        // the true apartment-wide wing/unit counts on that row.
        var (apartmentWingCount, apartmentUnitCount) = await GetApartmentCountsAsync(unit.WardId, unit.PropertyNo, cancellationToken);

        var certTypes = await _context.PropertyCertificateTypeMasters.AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .ToListAsync(cancellationToken);

        var societyRows = new List<CertificateGridRowDto>();
        var wingRows = new List<CertificateGridRowDto>();
        var unitRows = new List<CertificateGridRowDto>();
        var floorRows = new List<CertificateGridRowDto>();

        var allSocietyCerts = societyId.HasValue
            ? await _context.PropertyCertificates.AsNoTracking()
                .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
                .Where(c => c.EntityType == "S" && c.SocietyDetailId == societyId.Value
                            && !c.MarkedForDeletion)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync(cancellationToken)
            : new List<PropertyCertificateEntity>();

        var societyCertsByType = allSocietyCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        var allWingCerts = unit.WingDetailId.HasValue
            ? await _context.PropertyCertificates.AsNoTracking()
                .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
                .Where(c => c.EntityType == "W" && c.WingDetailId == unit.WingDetailId.Value
                            && !c.MarkedForDeletion)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync(cancellationToken)
            : new List<PropertyCertificateEntity>();

        var wingCertsByType = allWingCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        var allPropertyCerts = await _context.PropertyCertificates.AsNoTracking()
            .Include(c => c.DocumentBinding).ThenInclude(db => db!.Document)
            .Where(c => c.EntityType == "P" && c.PropertyId == propertyId
                        && !c.MarkedForDeletion)
            .OrderByDescending(c => c.CreatedDate)
            .ToListAsync(cancellationToken);

        var propertyCertsByType = allPropertyCerts
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var allFloorPropertyDetailIds = allPropertyCerts
            .Where(c => c.PropertyDetailsId.HasValue)
            .Select(c => c.PropertyDetailsId!.Value)
            .Distinct()
            .ToList();

        var floorNames = allFloorPropertyDetailIds.Count > 0
            ? await (
                from pd in _context.PropertyDetails.AsNoTracking()
                join f in _context.FloorEntity.AsNoTracking() on pd.FloorId equals f.Id into fj
                from f in fj.DefaultIfEmpty()
                where allFloorPropertyDetailIds.Contains(pd.Id)
                select new { pd.Id, FloorName = f != null ? f.Description : null }
            ).ToDictionaryAsync(x => x.Id, x => x.FloorName, cancellationToken)
            : new Dictionary<int, string?>();

        foreach (var type in certTypes)
        {
            var societyCert = societyCertsByType.GetValueOrDefault(type.Id);
            if (societyCert != null)
            {
                societyRows.Add(BuildApartmentRow(type, societyCert, apartmentWingCount, apartmentUnitCount));
            }

            if (unit.WingDetailId.HasValue)
            {
                var wingCert = wingCertsByType.GetValueOrDefault(type.Id);
                var effectiveWingCert = wingCert ?? societyCert;
                if (effectiveWingCert != null)
                {
                    wingRows.Add(BuildWingRow(type, effectiveWingCert, unit.WingDetailId.Value, wingName, 1));
                }
            }

            var propertyCerts = propertyCertsByType.GetValueOrDefault(type.Id) ?? new List<PropertyCertificateEntity>();
            var unitCert = propertyCerts
                .Where(c => c.PropertyDetailsId == null)
                .FirstOrDefault();

            if (unitCert != null)
            {
                var unitNumber = FormatUnitNo(unit.PropertyNo, unit.PartitionNo, unit.FlatOrShopNo, unit.Id);
                unitRows.Add(BuildUnitRow(type, unitCert, new List<string> { unitNumber }, new List<int> { propertyId }, 1, 1));
            }

            var floorCerts = propertyCerts
                .Where(c => c.PropertyDetailsId.HasValue)
                .GroupBy(c => c.PropertyDetailsId!.Value)
                .Select(g => g.First())
                .ToList();

            if (floorCerts.Count > 0)
            {
                foreach (var floorCert in floorCerts)
                {
                    var floorLabel = floorNames.GetValueOrDefault(floorCert.PropertyDetailsId!.Value) ?? "Floor";
                    var unitNumber = FormatUnitNo(unit.PropertyNo, unit.PartitionNo, unit.FlatOrShopNo, unit.Id);
                    floorRows.Add(BuildFloorRow(type, floorCert, floorLabel, unitNumber));
                }
            }
        }

        RenumberRows(societyRows);
        RenumberRows(wingRows);
        RenumberRows(unitRows);
        RenumberRows(floorRows);

        return new ApartmentQcCertificateGridDto
        {
            WingCount = unit.WingDetailId.HasValue ? 1 : 0,
            UnitCount = 1,
            SocietyCertificates = societyRows,
            WingCertificates = wingRows,
            UnitCertificates = unitRows,
            FloorCertificates = floorRows,
        };
    }

    private async Task<(int WingCount, int UnitCount)> GetApartmentCountsAsync(int wardId, string? propertyNo, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(propertyNo))
        {
            return (0, 0);
        }

        var unitCount = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.WardId == wardId && p.PropertyNo == propertyNo && p.IsActive && !p.MarkedForDeletion)
            .CountAsync(cancellationToken);

        var wingCount = await _context.PropertyMast.AsNoTracking()
            .Where(p => p.WardId == wardId && p.PropertyNo == propertyNo && p.IsActive && !p.MarkedForDeletion && p.WingDetailId.HasValue)
            .Select(p => p.WingDetailId!.Value)
            .Distinct()
            .CountAsync(cancellationToken);

        return (wingCount, unitCount);
    }

    private static void RenumberRows(List<CertificateGridRowDto> rows)
    {
        for (var i = 0; i < rows.Count; i++)
        {
            rows[i].RowNumber = i + 1;
        }
    }

    private static CertificateGridRowDto BuildApartmentRow(
        NtisPlatform.Core.Entities.Master.PropertyCertificateTypeMasterEntity type,
        PropertyCertificateEntity cert,
        int wingCount,
        int unitCount)
        => new()
        {
            Level = "Apartment",
            ApplicableToLabel = "Entire Apartment",
            ApplicableToSubLabel = $"{wingCount} wings · {unitCount} units",
            SocietyDetailId = cert.SocietyDetailId,
            WingDetailId = cert.WingDetailId,
            PropertyId = cert.PropertyId,
            PropertyDetailsId = cert.PropertyDetailsId,
            CertificateTypeId = type.Id,
            CertificateTypeCode = type.CertificateTypeCode,
            CertificateTypeName = type.CertificateTypeName,
            CertificateDate = cert.IssueDate,
            CertificateNumber = cert.CertificateNo,
            Status = ResolveStatus(cert),
            HasDocument = cert.DocumentBindingId.HasValue,
            DocumentGuid = DocumentBindingHelper.GetSafeDocumentGuid(cert.DocumentBinding),
        };

    private static CertificateGridRowDto BuildWingRow(
        NtisPlatform.Core.Entities.Master.PropertyCertificateTypeMasterEntity type,
        PropertyCertificateEntity cert,
        int wingId,
        string? wingName,
        int unitsInWing)
        => new()
        {
            Level = "Wing",
            ApplicableToLabel = wingName ?? "Wing",
            ApplicableToSubLabel = $"{unitsInWing} units in this wing",
            SocietyDetailId = cert.SocietyDetailId,
            WingDetailId = wingId,
            WingName = wingName,
            PropertyId = cert.PropertyId,
            PropertyDetailsId = cert.PropertyDetailsId,
            CertificateTypeId = type.Id,
            CertificateTypeCode = type.CertificateTypeCode,
            CertificateTypeName = type.CertificateTypeName,
            CertificateDate = cert.IssueDate,
            CertificateNumber = cert.CertificateNo,
            Status = ResolveStatus(cert),
            HasDocument = cert.DocumentBindingId.HasValue,
            DocumentGuid = DocumentBindingHelper.GetSafeDocumentGuid(cert.DocumentBinding),
        };

    private static CertificateGridRowDto BuildUnitRow(
        NtisPlatform.Core.Entities.Master.PropertyCertificateTypeMasterEntity type,
        PropertyCertificateEntity representative,
        List<string> coveredUnitNumbers,
        List<int>? coveredPropertyIds,
        int coveredCount,
        int totalUnitCount)
        => new()
        {
            Level = "Unit",
            ApplicableToLabel = coveredUnitNumbers.Count > 0
                ? string.Join(" ", coveredUnitNumbers)
                : (coveredPropertyIds != null && coveredPropertyIds.Count > 0
                    ? $"Unit {string.Join(", ", coveredPropertyIds)}"
                    : "Unit"),
            ApplicableToSubLabel = null,
            UnitsCoveredCount = coveredCount,
            UnitsTotalCount = totalUnitCount,
            UnitsMissingCount = totalUnitCount - coveredCount,
            CoveredUnitNumbers = coveredUnitNumbers,
            CoveredPropertyIds = coveredPropertyIds ?? (representative.PropertyId.HasValue ? new List<int> { representative.PropertyId.Value } : new List<int>()),
            SocietyDetailId = representative.SocietyDetailId,
            WingDetailId = representative.WingDetailId,
            PropertyId = representative.PropertyId,
            PropertyDetailsId = representative.PropertyDetailsId,
            CertificateTypeId = type.Id,
            CertificateTypeCode = type.CertificateTypeCode,
            CertificateTypeName = type.CertificateTypeName,
            CertificateDate = representative.IssueDate,
            CertificateNumber = representative.CertificateNo,
            Status = ResolveStatus(representative),
            HasDocument = representative.DocumentBindingId.HasValue,
            DocumentGuid = DocumentBindingHelper.GetSafeDocumentGuid(representative.DocumentBinding),
        };

    private static CertificateGridRowDto BuildFloorRow(
        NtisPlatform.Core.Entities.Master.PropertyCertificateTypeMasterEntity type,
        PropertyCertificateEntity cert,
        string floorLabel,
        string? unitNumber)
        => new()
        {
            Level = "Floor",
            ApplicableToLabel = floorLabel,
            ApplicableToSubLabel = string.IsNullOrWhiteSpace(unitNumber) ? null : $"Unit {unitNumber}",
            SocietyDetailId = cert.SocietyDetailId,
            WingDetailId = cert.WingDetailId,
            PropertyId = cert.PropertyId,
            PropertyDetailsId = cert.PropertyDetailsId,
            CertificateTypeId = type.Id,
            CertificateTypeCode = type.CertificateTypeCode,
            CertificateTypeName = type.CertificateTypeName,
            CertificateDate = cert.IssueDate,
            CertificateNumber = cert.CertificateNo,
            Status = ResolveStatus(cert),
            HasDocument = cert.DocumentBindingId.HasValue,
            DocumentGuid = DocumentBindingHelper.GetSafeDocumentGuid(cert.DocumentBinding),
        };

    /// <summary>"Active" once the certificate has both a number and an issue date, else "Pending" — per business direction there is no separate active/inactive gate on top of this.</summary>
    private static string ResolveStatus(PropertyCertificateEntity cert)
        => !string.IsNullOrWhiteSpace(cert.CertificateNo) && cert.IssueDate.HasValue ? "Active" : "Pending";

    private static string FormatUnitNo(string? propertyNo, string? partitionNo, string? flatOrShopNo, int id)
    {
        if (!string.IsNullOrWhiteSpace(partitionNo))
        {
            var part = partitionNo.Trim();
            if (!string.IsNullOrWhiteSpace(propertyNo))
            {
                var pno = propertyNo.Trim();
                if (part.StartsWith(pno, StringComparison.OrdinalIgnoreCase))
                {
                    return part;
                }
                if (part.StartsWith("-") || part.StartsWith("/"))
                {
                    return $"{pno}{part}";
                }
                return $"{pno}-{part}";
            }
            return part;
        }

        if (!string.IsNullOrWhiteSpace(flatOrShopNo))
        {
            return flatOrShopNo.Trim();
        }

        if (!string.IsNullOrWhiteSpace(propertyNo))
        {
            return propertyNo.Trim();
        }

        return "Unit " + id;
    }
}
