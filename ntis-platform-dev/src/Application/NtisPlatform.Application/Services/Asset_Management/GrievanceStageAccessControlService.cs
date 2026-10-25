using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management
{
    public class GrievanceStageAccessControlService :
        BaseCommonCrudService<
            GrievanceStageAccessControlEntity,
            GrievanceStageAccessControlDto,
            CreateGrievanceStageAccessControlDto,
            UpdateGrievanceStageAccessControlDto,
            GrievanceStageAccessControlQueryParameters,
            int>,
        IGrievanceStageAccessControlService
    {
        private readonly IRepository<GrievanceWorkflowStageMasterEntity, int> _stageRepository;

        public GrievanceStageAccessControlService(
            IRepository<GrievanceStageAccessControlEntity, int> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IRepository<GrievanceWorkflowStageMasterEntity, int> stageRepository)
            : base(repository, unitOfWork, mapper)
        {
            _stageRepository = stageRepository;
        }

        public override Task<GrievanceStageAccessControlDto> CreateAsync(
            CreateGrievanceStageAccessControlDto createDto, CancellationToken cancellationToken = default)
        {
            if (createDto == null)
                throw new ArgumentNullException(nameof(createDto));

            createDto.IsActive = true;
            return base.CreateAsync(createDto, cancellationToken);
        }

        protected override async Task<ValidationResult> ValidateForCreateAsync(
            GrievanceStageAccessControlEntity entity, CancellationToken ct = default)
        {
            if (entity.StageId <= 0)
                return ValidationResult.Failure(nameof(entity.StageId), "GrievanceStageAccess_StageId_Required");

            var stageExists = await _stageRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(s => s.Id == entity.StageId && !s.MarkedForDeletion, ct);

            if (!stageExists)
                return ValidationResult.Failure(nameof(entity.StageId), "GrievanceStageAccess_StageNotFound");

            if (!entity.DesignationId.HasValue && !entity.UserId.HasValue)
                return ValidationResult.Failure(nameof(entity.DesignationId), "GrievanceStageAccess_DesignationOrUserRequired");

            var duplicate = await _repository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(x => x.StageId == entity.StageId
                            && x.DesignationId == entity.DesignationId
                            && x.UserId == entity.UserId
                            && !x.MarkedForDeletion, ct);

            return duplicate
                ? ValidationResult.Failure(nameof(entity.StageId), "GrievanceStageAccess_DuplicateAllocation")
                : ValidationResult.Success();
        }

        protected override async Task<ValidationResult> ValidateForDeactivationAsync(
            int id, GrievanceStageAccessControlEntity currentEntity, GrievanceStageAccessControlEntity updatedEntity, CancellationToken ct = default)
        {
            if (updatedEntity.StageId <= 0)
                return ValidationResult.Failure(nameof(updatedEntity.StageId), "GrievanceStageAccess_StageId_Required");

            if (!updatedEntity.DesignationId.HasValue && !updatedEntity.UserId.HasValue)
                return ValidationResult.Failure(nameof(updatedEntity.DesignationId), "GrievanceStageAccess_DesignationOrUserRequired");

            var duplicate = await _repository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(x => x.Id != id
                            && x.StageId == updatedEntity.StageId
                            && x.DesignationId == updatedEntity.DesignationId
                            && x.UserId == updatedEntity.UserId
                            && !x.MarkedForDeletion, ct);

            return duplicate
                ? ValidationResult.Failure(nameof(updatedEntity.StageId), "GrievanceStageAccess_DuplicateAllocation")
                : ValidationResult.Success();
        }

        public async Task<bool> HasAccessToStageAsync(int stageId, int userId, CancellationToken cancellationToken = default)
        {
            if (stageId <= 0 || userId <= 0)
                return false;

            var rules = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(x => x.StageId == stageId && x.IsActive && !x.MarkedForDeletion)
                .ToListAsync(cancellationToken);

            // Soft fallback: if no rules configured for this stage yet, allow access
            if (rules.Count == 0)
                return true;

            // Direct user rule check
            var directUserRule = rules.FirstOrDefault(r => r.UserId == userId);
            if (directUserRule != null)
                return directUserRule.CanTakeAction;

            return false;
        }
    }
}