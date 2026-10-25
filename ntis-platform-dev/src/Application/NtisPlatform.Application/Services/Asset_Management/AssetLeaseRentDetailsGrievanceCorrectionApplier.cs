using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Applies grievance corrections targeting AMS.AssetLeaseRentDetails — the plan doc's own worked
/// example. Only a fixed, known set of fields can be corrected through a grievance; an unrecognized
/// field name in ChangedFields is ignored rather than failing the whole apply (a stray/unexpected
/// key should not block every other legitimate field change in the same correction).
/// </summary>
public class AssetLeaseRentDetailsGrievanceCorrectionApplier : IAssetGrievanceCorrectionApplier
{
    private readonly IRepository<AssetLeaseRentDetailsEntity, int> _repository;

    public AssetLeaseRentDetailsGrievanceCorrectionApplier(IRepository<AssetLeaseRentDetailsEntity, int> repository)
    {
        _repository = repository;
    }

    public bool CanApply(string targetTableName)
        => string.Equals(targetTableName, "AMS.AssetLeaseRentDetails", StringComparison.OrdinalIgnoreCase)
        || string.Equals(targetTableName, "AssetLeaseRentDetails", StringComparison.OrdinalIgnoreCase);

    public async Task<IReadOnlyDictionary<string, string>?> ReadSnapshotAsync(int recordId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == recordId, cancellationToken);
        if (entity == null)
            return null;

        return new Dictionary<string, string?>
        {
            [nameof(entity.TenantName)] = entity.TenantName,
            [nameof(entity.TenantMobile)] = entity.TenantMobile,
            [nameof(entity.TenantEmail)] = entity.TenantEmail,
            [nameof(entity.TenantAddress)] = entity.TenantAddress,
            [nameof(entity.TenantAadhaarNo)] = entity.TenantAadhaarNo,
            [nameof(entity.TenantPanCardNo)] = entity.TenantPanCardNo,
            [nameof(entity.ShopNo)] = entity.ShopNo,
            [nameof(entity.ShopName)] = entity.ShopName,
            [nameof(entity.GSTNo)] = entity.GSTNo,
            [nameof(entity.RentAmount)] = entity.RentAmount?.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.SecurityDeposit)] = entity.SecurityDeposit.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.LeaseEndDate)] = entity.LeaseEndDate?.ToString("O", CultureInfo.InvariantCulture),
        }
        .Where(kv => kv.Value != null)
        .ToDictionary(kv => kv.Key, kv => kv.Value!);
    }

    public async Task ApplyAsync(int recordId, IReadOnlyDictionary<string, string> changedFields, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == recordId, cancellationToken)
            ?? throw new KeyNotFoundException($"AssetLeaseRentDetails with id {recordId} not found");

        foreach (var (fieldName, value) in changedFields)
        {
            switch (fieldName)
            {
                case nameof(entity.TenantName):
                    entity.TenantName = value;
                    break;
                case nameof(entity.TenantMobile):
                    entity.TenantMobile = value;
                    break;
                case nameof(entity.TenantEmail):
                    entity.TenantEmail = value;
                    break;
                case nameof(entity.TenantAddress):
                    entity.TenantAddress = value;
                    break;
                case nameof(entity.TenantAadhaarNo):
                    entity.TenantAadhaarNo = value;
                    break;
                case nameof(entity.TenantPanCardNo):
                    entity.TenantPanCardNo = value;
                    break;
                case nameof(entity.ShopNo):
                    entity.ShopNo = value;
                    break;
                case nameof(entity.ShopName):
                    entity.ShopName = value;
                    break;
                case nameof(entity.GSTNo):
                    entity.GSTNo = value;
                    break;
                case nameof(entity.RentAmount):
                    entity.RentAmount = decimal.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.SecurityDeposit):
                    entity.SecurityDeposit = decimal.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.LeaseEndDate):
                    entity.LeaseEndDate = DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
                    break;
                // Unrecognized field names are ignored rather than thrown — see class remarks.
            }
        }

        await _repository.UpdateAsync(entity, cancellationToken);
    }
}
