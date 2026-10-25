using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.FireAudit.JurisdictionOverlay;
using NtisPlatform.Application.Interfaces.FireAudit;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.FireAudit;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.FireAudit;

public class JurisdictionOverlayMasterService : BaseCommonCrudService<
    JurisdictionOverlayMasterEntity,
    JurisdictionOverlayMasterDto,
    CreateJurisdictionOverlayMasterDto,
    UpdateJurisdictionOverlayMasterDto,
    JurisdictionOverlayMasterQueryParameters,
    int>, IJurisdictionOverlayMasterService
{
    public JurisdictionOverlayMasterService(
        IRepository<JurisdictionOverlayMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
    }

    protected override Task<ValidationResult> ValidateForCreateAsync(
        JurisdictionOverlayMasterEntity entity, CancellationToken cancellationToken = default)
        => ValidateOverlayAsync(entity, excludeId: null, cancellationToken);

    protected override Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        JurisdictionOverlayMasterEntity currentEntity,
        JurisdictionOverlayMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
        => ValidateOverlayAsync(updatedEntity, excludeId: id, cancellationToken);

    private async Task<ValidationResult> ValidateOverlayAsync(
        JurisdictionOverlayMasterEntity entity, int? excludeId, CancellationToken cancellationToken)
    {
        if (entity.EffectiveFrom.HasValue && entity.EffectiveTo.HasValue
            && entity.EffectiveTo.Value.Date < entity.EffectiveFrom.Value.Date)
        {
            return ValidationResult.Failure(nameof(entity.EffectiveTo), "EffectiveTo must be on or after EffectiveFrom.");
        }

        if (!entity.IsActive)
            return ValidationResult.Success();

        var query = _repository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && x.Id != (excludeId ?? 0));

        var stateCode = entity.StateCode?.Trim();
        var stateName = entity.StateName?.Trim();
        var isNational = entity.UlbId is null
            && string.IsNullOrWhiteSpace(stateCode)
            && string.IsNullOrWhiteSpace(stateName);

        if (isNational && await query.AnyAsync(
                x => x.UlbId == null && x.StateCode == null && x.StateName == null, cancellationToken))
        {
            return ValidationResult.Failure(nameof(entity.StateCode), "An active national jurisdiction rule already exists.");
        }

        if (entity.UlbId is int ulbId && await query.AnyAsync(x => x.UlbId == ulbId, cancellationToken))
        {
            return ValidationResult.Failure(nameof(entity.UlbId), "An active jurisdiction rule already exists for this municipality.");
        }

        if (entity.UlbId is null && !string.IsNullOrWhiteSpace(stateName)
            && await query.AnyAsync(x => x.UlbId == null && x.StateName == stateName, cancellationToken))
        {
            return ValidationResult.Failure(nameof(entity.StateName), "An active jurisdiction rule already exists for this state.");
        }

        if (entity.UlbId is null && !string.IsNullOrWhiteSpace(stateCode)
            && await query.AnyAsync(x => x.UlbId == null && x.StateCode == stateCode, cancellationToken))
        {
            return ValidationResult.Failure(nameof(entity.StateCode), "An active jurisdiction rule already exists for this state code.");
        }

        return ValidationResult.Success();
    }
}
