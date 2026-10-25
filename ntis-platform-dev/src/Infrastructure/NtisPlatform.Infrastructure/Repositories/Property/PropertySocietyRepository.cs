using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces.Property;
using NtisPlatform.Core.Models;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.Property;

/// <summary>
/// Data-access implementation for the Property "Society Details" tab.
/// All read-only queries use AsNoTracking and project only the columns required for the DTO.
/// Tracked entity loads are reserved for the write path (mutation in the service).
/// The "empty DTO when society is missing" decision belongs to the service, not here.
/// </summary>
public class PropertySocietyRepository : PropertyRepositoryBase, IPropertySocietyRepository
{
    public PropertySocietyRepository(ApplicationDbContext context) : base(context)
    {
    }

    /// <inheritdoc/>
    public async Task<PropertySocietyDetailsDto?> GetSocietyDetailsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var property = await _context.PropertyMast
            .AsNoTracking()
            .Where(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion)
            .Select(p => new { p.WingDetailId })
            .FirstOrDefaultAsync(cancellationToken);

        if (property == null)
            return null; // property not found

        var result = await (
            from s in _context.SocietyDetailsMast.AsNoTracking()
            where s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion
            // Tied to this property's own WingDetailId/PropertyId, not just "any wing under
            // the society" -- a society can have multiple wings, so joining by SocietyDetailsMastId/
            // SocietyDetailId alone (with no per-property ordering) could return an arbitrary one.
            join wdmGroup in _context.Set<NtisPlatform.Core.Entities.WingDetailsMastEntity>().AsNoTracking() on property.WingDetailId equals (int?)wdmGroup.Id into wdmJoin
            from wdm in wdmJoin.Where(x => x.IsActive && !x.MarkedForDeletion).DefaultIfEmpty()
            join swdGroup in _context.Set<NtisPlatform.Core.Entities.SocietyWingDetailsEntity>().AsNoTracking() on (int?)propertyId equals swdGroup.PropertyId into swdJoin
            from swd in swdJoin.Where(x => x.IsActive).DefaultIfEmpty()
            join wingGroup in _context.Set<WingEntity>().AsNoTracking() on
                (wdm != null ? (int?)wdm.WingMasterId : (swd != null ? swd.WingId : null)) equals (int?)wingGroup.Id into wingJoin
            from w in wingJoin.Where(x => x.IsActive).DefaultIfEmpty()
            select new PropertySocietyDetailsDto
            {
                PropertyId = propertyId,
                SocietyDetailId = s.Id,
                WingId = wdm != null ? (int?)wdm.WingMasterId : (swd != null ? swd.WingId : (w != null ? (int?)w.Id : null)),
                // WingNo is WingEntity.WingNo specifically -- no name-field fallback, since
                // WingDetailsMast.WingName / SocietyWingDetails.NewWingName are names, not codes.
                WingNo = w != null ? w.WingNo : null,
                WingName = wdm != null ? wdm.WingName : (swd != null ? swd.NewWingName : null),
                SocietyName = s.SocietyName,
                SocietyAddress = s.SocietyAddress,
                SecretaryName = s.SecretaryName,
                ManagerName = s.ManagerName,
                LandOwnerName = s.LandOwnerName,
                BuilderName = s.BuilderName,
                SocietyNameEnglish = s.SocietyNameEnglish,
                SocietyAddressEnglish = s.SocietyAddressEnglish,
                SecretaryNameEnglish = s.SecretaryNameEnglish,
                ManagerNameEnglish = s.ManagerNameEnglish,
                LandOwnerNameEnglish = s.LandOwnerNameEnglish,
                BuilderNameEnglish = s.BuilderNameEnglish,
                ManagerMobileNo = s.ManagerMobileNo,
                SecretaryMobileNo = s.SecretaryMobileNo,
                SocietyEmailId = s.SocietyEmailId,
                SecretaryEmailId = s.SecretaryEmailId,
                ManagerEmailId = s.ManagerEmailId
            })
            .FirstOrDefaultAsync(cancellationToken);

        // null here means the FK-referenced society row was deleted/deactivated.
        // The service decides what to do (return empty DTO in that case too).
        return result;
    }

    /// <inheritdoc/>
    public Task<bool> PropertyExistsAsync(int propertyId, CancellationToken cancellationToken = default)
        => _context.PropertyMast
            .AsNoTracking()
            .AnyAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);

    /// <inheritdoc/>
    public Task<SocietyDetailsEntity?> GetSocietyByIdAsync(int societyId, CancellationToken cancellationToken = default)
        => _context.SocietyDetailsMast
            .FirstOrDefaultAsync(s => s.Id == societyId && s.IsActive && !s.MarkedForDeletion, cancellationToken);

    /// <inheritdoc/>
    public Task<SocietyDetailsEntity?> GetSocietyByPropertyIdAsync(int propertyId, CancellationToken cancellationToken = default)
        => _context.SocietyDetailsMast
            .FirstOrDefaultAsync(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion, cancellationToken);

    /// <inheritdoc/>
    public void AddSociety(SocietyDetailsEntity society)
        => _context.SocietyDetailsMast.Add(society);

    /// <inheritdoc/>
    public async Task<WingDetailsMastEntity?> GetWingDetailsMastBySocietyIdAsync(int societyId, CancellationToken cancellationToken = default)
        => await _context.Set<WingDetailsMastEntity>()
            .FirstOrDefaultAsync(w => w.SocietyDetailsMastId == societyId && w.IsActive && !w.MarkedForDeletion, cancellationToken);

    /// <inheritdoc/>
    public async Task<WingDetailsMastEntity?> GetWingDetailsMastByIdAsync(int wingDetailId, CancellationToken cancellationToken = default)
        => await _context.Set<WingDetailsMastEntity>()
            .FirstOrDefaultAsync(w => w.Id == wingDetailId && w.IsActive && !w.MarkedForDeletion, cancellationToken);

    /// <inheritdoc/>
    public void AddWingDetailsMast(WingDetailsMastEntity wingDetailsMast)
        => _context.Set<WingDetailsMastEntity>().Add(wingDetailsMast);

    /// <inheritdoc/>
    public async Task CascadeSocietyAddressToFlatsAsync(
        int propertyId,
        int societyId,
        string? societyAddress,
        string? societyAddressEnglish,
        int? updatedBy,
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        var parentProperty = await _context.PropertyMast
            .FirstOrDefaultAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);

        if (parentProperty is null) return;

        // Sync parent property address if it is the main building (PartitionNo is null or whitespace)
        if (string.IsNullOrWhiteSpace(parentProperty.PartitionNo))
        {
            if (societyAddress != null) parentProperty.Address = societyAddress.Trim();
            if (societyAddressEnglish != null) parentProperty.AddressEnglish = societyAddressEnglish.Trim();
            if (updatedBy.HasValue) parentProperty.UpdatedBy = updatedBy.Value;
            parentProperty.UpdatedDate = now;
        }

        // 1. Wings belonging to this society
        var societyWingIds = await _context.Set<WingDetailsMastEntity>()
            .Where(w => w.SocietyDetailsMastId == societyId && w.IsActive && !w.MarkedForDeletion)
            .Select(w => w.Id)
            .ToListAsync(cancellationToken);

        // 2. Identify properties that have their own DIFFERENT active society row (must NOT be touched)
        var otherSocietyPropertyIds = await _context.SocietyDetailsMast
            .Where(s => s.Id != societyId && s.PropertyId.HasValue && s.IsActive && !s.MarkedForDeletion)
            .Select(s => s.PropertyId!.Value)
            .ToListAsync(cancellationToken);

        // 3. Category guard: Identify apartment categories vs non-apartment categories
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

        // 4. Candidate units sharing same Ward + PropertyNo or having a wing in this society
        var candidateUnits = await _context.PropertyMast
            .Where(p => p.Id != propertyId
                && p.IsActive
                && !p.MarkedForDeletion
                && (
                    (societyWingIds.Count > 0 && p.WingDetailId.HasValue && societyWingIds.Contains(p.WingDetailId.Value))
                    || (p.WardId == parentProperty.WardId && p.PropertyNo == parentProperty.PropertyNo && !string.IsNullOrWhiteSpace(p.PartitionNo))
                ))
            .ToListAsync(cancellationToken);

        // 5. Strict filter to prevent unintended modifications to unrelated properties
        var childUnits = candidateUnits
            .Where(p =>
            {
                // Never modify a property linked to another society
                if (otherSocietyPropertyIds.Contains(p.Id))
                    return false;

                // Never modify a property with an explicit non-apartment category (e.g. Individual, Plot, Industry)
                if (p.CategoryId.HasValue && nonApartmentCategoryIds.Contains(p.CategoryId.Value))
                    return false;

                // If assigned to a wing of another society, exclude it
                if (p.WingDetailId.HasValue && !societyWingIds.Contains(p.WingDetailId.Value))
                    return false;

                // If assigned to a wing of this society, it's a valid child unit
                if (p.WingDetailId.HasValue && societyWingIds.Contains(p.WingDetailId.Value))
                    return true;

                // If apartment categories are defined in master, ensure unit has an apartment category
                if (apartmentCategoryIds.Count > 0 && p.CategoryId.HasValue && !apartmentCategoryIds.Contains(p.CategoryId.Value))
                    return false;

                // Child partition without wing in the same building
                return p.WardId == parentProperty.WardId && p.PropertyNo == parentProperty.PropertyNo && !string.IsNullOrWhiteSpace(p.PartitionNo);
            })
            .ToList();

        if (childUnits.Count == 0) return;

        var childWingIds = childUnits
            .Where(u => u.WingDetailId.HasValue)
            .Select(u => u.WingDetailId!.Value)
            .Distinct()
            .ToList();

        var wingNamesMap = childWingIds.Count > 0
            ? await _context.Set<WingDetailsMastEntity>()
                .AsNoTracking()
                .Where(w => childWingIds.Contains(w.Id) && w.IsActive && !w.MarkedForDeletion)
                .ToDictionaryAsync(w => w.Id, w => w.WingName, cancellationToken)
            : new Dictionary<int, string?>();

        var effectiveSocietyAddress = societyAddress?.Trim()
            ?? (string.IsNullOrWhiteSpace(parentProperty.PartitionNo) ? parentProperty.Address : null);

        var effectiveSocietyAddressEnglish = societyAddressEnglish?.Trim()
            ?? (string.IsNullOrWhiteSpace(parentProperty.PartitionNo) ? parentProperty.AddressEnglish : null);

        foreach (var unit in childUnits)
        {
            var wingName = unit.WingDetailId.HasValue && wingNamesMap.TryGetValue(unit.WingDetailId.Value, out var wn)
                ? wn
                : null;

            if (effectiveSocietyAddress != null)
            {
                var flatPart = !string.IsNullOrWhiteSpace(unit.FlatOrShopName) ? unit.FlatOrShopName : unit.FlatOrShopNo;
                unit.Address = BuildUnitAddress(flatPart, wingName, effectiveSocietyAddress);
            }

            if (effectiveSocietyAddressEnglish != null)
            {
                var flatPartEnglish = !string.IsNullOrWhiteSpace(unit.FlatOrShopNameEnglish)
                    ? unit.FlatOrShopNameEnglish
                    : (!string.IsNullOrWhiteSpace(unit.FlatOrShopNoEnglish)
                        ? unit.FlatOrShopNoEnglish
                        : (!string.IsNullOrWhiteSpace(unit.FlatOrShopName) ? unit.FlatOrShopName : unit.FlatOrShopNo));

                unit.AddressEnglish = BuildUnitAddress(flatPartEnglish, wingName, effectiveSocietyAddressEnglish);
            }

            if (updatedBy.HasValue) unit.UpdatedBy = updatedBy.Value;
            unit.UpdatedDate = now;
        }
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
