using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management
{
    public class GrievanceWorkflowStageMasterService :
        AssetMasterCrudService<
            GrievanceWorkflowStageMasterEntity,
            GrievanceWorkflowStageMasterDto,
            CreateGrievanceWorkflowStageMasterDto,
            UpdateGrievanceWorkflowStageMasterDto,
            GrievanceWorkflowStageQueryParameters>,
        IGrievanceWorkflowStageMasterService
    {
        private readonly IReferenceValidationService _referenceValidator;

        public GrievanceWorkflowStageMasterService(
            IRepository<GrievanceWorkflowStageMasterEntity, int> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IReferenceValidationService referenceValidator)
            : base(repository, unitOfWork, mapper)
        {
            _referenceValidator = referenceValidator;
        }

        public override Task<GrievanceWorkflowStageMasterDto> CreateAsync(
            CreateGrievanceWorkflowStageMasterDto createDto, CancellationToken cancellationToken = default)
        {
            if (createDto == null)
                throw new ArgumentNullException(nameof(createDto));

            createDto.StageCode = createDto.StageCode?.Trim()!;
            createDto.StageName = createDto.StageName?.Trim()!;
            createDto.IsActive = true;
            return base.CreateAsync(createDto, cancellationToken);
        }

        public override Task<GrievanceWorkflowStageMasterDto?> UpdateAsync(
            int id, UpdateGrievanceWorkflowStageMasterDto updateDto, CancellationToken cancellationToken = default)
        {
            if (updateDto == null)
                throw new ArgumentNullException(nameof(updateDto));

            updateDto.StageCode = updateDto.StageCode?.Trim()!;
            updateDto.StageName = updateDto.StageName?.Trim()!;
            return base.UpdateAsync(id, updateDto, cancellationToken);
        }

        protected override async Task<ValidationResult> ValidateForCreateAsync(
            GrievanceWorkflowStageMasterEntity entity, CancellationToken ct = default)
        {
            return await ValidateStageAsync(null, entity, ct);
        }

        protected override async Task<ValidationResult> ValidateForDeactivationAsync(
            int id, GrievanceWorkflowStageMasterEntity currentEntity, GrievanceWorkflowStageMasterEntity updatedEntity, CancellationToken ct = default)
        {
            var duplicateResult = await ValidateStageAsync(id, updatedEntity, ct);
            if (!duplicateResult.IsValid)
                return duplicateResult;

            if (currentEntity.IsActive && !updatedEntity.IsActive)
            {
                return await _referenceValidator.ValidateReferencesAsync<GrievanceWorkflowStageMasterEntity>(id, ReferenceValidationOperation.Deactivate, ct);
            }

            return ValidationResult.Success();
        }

        protected override async Task<ValidationResult> ValidateForDeleteAsync(
            int id, GrievanceWorkflowStageMasterEntity entity, CancellationToken ct = default)
        {
            return await _referenceValidator.ValidateReferencesAsync<GrievanceWorkflowStageMasterEntity>(id, ReferenceValidationOperation.Delete, ct);
        }

        private async Task<ValidationResult> ValidateStageAsync(
            int? excludeId, GrievanceWorkflowStageMasterEntity entity, CancellationToken ct)
        {
            var errors = new List<ValidationError>();

            if (entity.UlbTypeId <= 0)
                errors.Add(new ValidationError(nameof(entity.UlbTypeId), "ULB Type is required."));

            if (entity.StageOrder <= 0)
                errors.Add(new ValidationError(nameof(entity.StageOrder), "Stage Order must be greater than zero."));

            if (string.IsNullOrWhiteSpace(entity.StageCode))
                errors.Add(new ValidationError(nameof(entity.StageCode), "Stage Code is required."));

            if (string.IsNullOrWhiteSpace(entity.StageName))
                errors.Add(new ValidationError(nameof(entity.StageName), "Stage Name is required."));

            if (errors.Count > 0)
                return AssetMasterValidation.ToResult(errors);

            var others = _repository.GetQueryable()
                .AsNoTracking()
                .Where(x => (excludeId == null || x.Id != excludeId)
                         && x.UlbTypeId == entity.UlbTypeId
                         && !x.MarkedForDeletion);

            var trimmedCode = entity.StageCode.Trim();
            if (await others.AnyAsync(x => x.StageCode == trimmedCode, ct))
                errors.Add(AssetMasterValidation.Duplicate(nameof(entity.StageCode), "Stage Code", trimmedCode, "ULB Type"));

            var trimmedName = entity.StageName.Trim();
            if (await others.AnyAsync(x => x.StageName == trimmedName, ct))
                errors.Add(AssetMasterValidation.Duplicate(nameof(entity.StageName), "Stage Name", trimmedName, "ULB Type"));

            if (await others.AnyAsync(x => x.StageOrder == entity.StageOrder, ct))
                errors.Add(AssetMasterValidation.Duplicate(nameof(entity.StageOrder), "Stage Order", entity.StageOrder, "ULB Type"));

            return AssetMasterValidation.ToResult(errors);
        }

        public async Task<List<GrievanceWorkflowStageMasterDto>> GetStagesByUlbTypeAsync(int ulbTypeId, CancellationToken cancellationToken = default)
        {
            if (ulbTypeId <= 0)
                throw new ArgumentException("UlbTypeId must be greater than zero.", nameof(ulbTypeId));

            var stages = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(x => x.UlbTypeId == ulbTypeId && !x.MarkedForDeletion)
                .OrderBy(x => x.StageOrder)
                .ToListAsync(cancellationToken);

            return _mapper.Map<List<GrievanceWorkflowStageMasterDto>>(stages);
        }
    }
}