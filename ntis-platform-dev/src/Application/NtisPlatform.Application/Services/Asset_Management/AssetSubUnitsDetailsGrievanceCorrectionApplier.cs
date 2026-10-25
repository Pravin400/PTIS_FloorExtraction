using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Applies grievance corrections targeting AMS.SubUnitsDetails — the module's "Automated Capital
/// Value Synchronization" requirement. Only structural fields are correctable; CapitalValue,
/// BaseValue and every CV*Factor/CVBaseRate column are derived-only outputs of
/// ISubUnitsDetailsService.CalculateAndUpdateCapitalValueAsync and are deliberately excluded from
/// both ReadSnapshotAsync and ApplyAsync — a correction can trigger a recalculation, never set the
/// result directly. As with AssetLeaseRentDetailsGrievanceCorrectionApplier, an unrecognized field
/// name in ChangedFields is ignored rather than failing the whole apply.
/// </summary>
public class AssetSubUnitsDetailsGrievanceCorrectionApplier : IAssetGrievanceCorrectionApplier
{
    private readonly IRepository<SubUnitsDetailsEntity, int> _repository;
    private readonly ISubUnitsDetailsService _subUnitsDetailsService;

    public AssetSubUnitsDetailsGrievanceCorrectionApplier(
        IRepository<SubUnitsDetailsEntity, int> repository,
        ISubUnitsDetailsService subUnitsDetailsService)
    {
        _repository = repository;
        _subUnitsDetailsService = subUnitsDetailsService;
    }

    public bool CanApply(string targetTableName)
        => string.Equals(targetTableName, "AMS.SubUnitsDetails", StringComparison.OrdinalIgnoreCase)
        || string.Equals(targetTableName, "SubUnitsDetails", StringComparison.OrdinalIgnoreCase);  
    public async Task<IReadOnlyDictionary<string, string>?> ReadSnapshotAsync(int recordId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == recordId, cancellationToken);
        if (entity == null)
            return null;

        return new Dictionary<string, string?>
        {
            [nameof(entity.ConstructionYear)] = entity.ConstructionYear,
            [nameof(entity.AssessmentYear)] = entity.AssessmentYear,
            [nameof(entity.ConstructionTypeId)] = entity.ConstructionTypeId.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.TypeOfUseId)] = entity.TypeOfUseId.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.SubTypeOfUseId)] = entity.SubTypeOfUseId?.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.CarpetAreaSqMeter)] = entity.CarpetAreaSqMeter?.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.CarpetAreaSqFeet)] = entity.CarpetAreaSqFeet?.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.BuiltUpAreaSqMeter)] = entity.BuiltUpAreaSqMeter?.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.BuiltUpAreaSqFeet)] = entity.BuiltUpAreaSqFeet?.ToString(CultureInfo.InvariantCulture),
            [nameof(entity.NoOfRooms)] = entity.NoOfRooms?.ToString(CultureInfo.InvariantCulture),
        }
        .Where(kv => kv.Value != null)
        .ToDictionary(kv => kv.Key, kv => kv.Value!);
    }

    public async Task ApplyAsync(int recordId, IReadOnlyDictionary<string, string> changedFields, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == recordId, cancellationToken)
            ?? throw new KeyNotFoundException($"SubUnitsDetails with id {recordId} not found");

        foreach (var (fieldName, value) in changedFields)
        {
            switch (fieldName)
            {
                case nameof(entity.ConstructionYear):
                    entity.ConstructionYear = value;
                    break;
                case nameof(entity.AssessmentYear):
                    entity.AssessmentYear = value;
                    break;
                case nameof(entity.ConstructionTypeId):
                    entity.ConstructionTypeId = int.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.TypeOfUseId):
                    entity.TypeOfUseId = int.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.SubTypeOfUseId):
                    entity.SubTypeOfUseId = int.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.CarpetAreaSqMeter):
                    entity.CarpetAreaSqMeter = decimal.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.CarpetAreaSqFeet):
                    entity.CarpetAreaSqFeet = decimal.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.BuiltUpAreaSqMeter):
                    entity.BuiltUpAreaSqMeter = decimal.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.BuiltUpAreaSqFeet):
                    entity.BuiltUpAreaSqFeet = decimal.Parse(value, CultureInfo.InvariantCulture);
                    break;
                case nameof(entity.NoOfRooms):
                    entity.NoOfRooms = int.Parse(value, CultureInfo.InvariantCulture);
                    break;
                // Unrecognized field names (and CV-derived fields, which are never in the switch) are
                // ignored rather than thrown — see class remarks.
            }
        }

        await _repository.UpdateAsync(entity, cancellationToken);
    }

    /// <summary>
    /// Recalculates capital value after the caller's transaction has committed — CalculateAndUpdateCapitalValueAsync
    /// opens its own transaction internally, which would fail if called inside ApproveAsync's still-open one.
    /// </summary>
    public Task RunPostApplyFollowUpAsync(int recordId, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
