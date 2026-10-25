using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowState;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceWorkflowStateService : BaseCommonCrudService<
    GrievanceWorkflowStateEntity,
    GrievanceWorkflowStateDto,
    CreateGrievanceWorkflowStateDto,
    UpdateGrievanceWorkflowStateDto,
    GrievanceWorkflowStateQueryParameters,
    int>, IGrievanceWorkflowStateService
{
    private readonly IRepository<GrievanceWorkflowEntity, int> _workflowRepository;

    public GrievanceWorkflowStateService(
        IRepository<GrievanceWorkflowStateEntity, int> repository,
        IRepository<GrievanceWorkflowEntity, int> workflowRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
        _workflowRepository = workflowRepository;
    }

    protected override IQueryable<GrievanceWorkflowStateEntity> ApplyIncludes(IQueryable<GrievanceWorkflowStateEntity> query)
    {
        return query.Include(x => x.Workflow);
    }

    public override async Task<GrievanceWorkflowStateDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable().AsNoTracking());
        var entity = query.Provider is IAsyncQueryProvider
            ? await query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            : query.FirstOrDefault(x => x.Id == id);
        return entity == null ? null : _mapper.Map<GrievanceWorkflowStateDto>(entity);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GrievanceWorkflowStateEntity entity, CancellationToken cancellationToken = default)
    {
        var workflow = await _workflowRepository.GetByIdAsync(entity.WorkflowId, cancellationToken);
        if (workflow == null || !workflow.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.WorkflowId), "Active parent workflow does not exist.");
        }

        if (!string.IsNullOrWhiteSpace(entity.StateName))
        {
            var nameUpper = entity.StateName.Trim().ToUpper();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.WorkflowId == entity.WorkflowId && x.StateName != null && x.StateName.Trim().ToUpper() == nameUpper, cancellationToken)
                    : queryable.Any(x => x.WorkflowId == entity.WorkflowId && x.StateName != null && x.StateName.Trim().ToUpper() == nameUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(entity.StateName), "State name must be unique within the workflow.");
                }

                if (entity.IsInitial)
                {
                    bool initialExists = queryable.Provider is IAsyncQueryProvider
                        ? await queryable.AsNoTracking().AnyAsync(x => x.WorkflowId == entity.WorkflowId && x.IsInitial, cancellationToken)
                        : queryable.Any(x => x.WorkflowId == entity.WorkflowId && x.IsInitial);

                    if (initialExists)
                    {
                        return ValidationResult.Failure(nameof(entity.IsInitial), "Another state in this workflow is already marked as initial.");
                    }
                }
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GrievanceWorkflowStateEntity currentEntity, GrievanceWorkflowStateEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (updatedEntity.WorkflowId != currentEntity.WorkflowId)
        {
            var workflow = await _workflowRepository.GetByIdAsync(updatedEntity.WorkflowId, cancellationToken);
            if (workflow == null || !workflow.IsActive)
            {
                return ValidationResult.Failure(nameof(updatedEntity.WorkflowId), "Active parent workflow does not exist.");
            }
        }

        if (!string.IsNullOrWhiteSpace(updatedEntity.StateName))
        {
            var nameUpper = updatedEntity.StateName.Trim().ToUpper();
            var currentNameUpper = currentEntity?.StateName?.Trim()?.ToUpper();

            if (updatedEntity.WorkflowId != currentEntity?.WorkflowId || !string.Equals(nameUpper, currentNameUpper, StringComparison.OrdinalIgnoreCase))
            {
                var queryable = _repository.GetQueryable();
                if (queryable != null)
                {
                    bool exists = queryable.Provider is IAsyncQueryProvider
                        ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.WorkflowId == updatedEntity.WorkflowId && x.StateName != null && x.StateName.Trim().ToUpper() == nameUpper, cancellationToken)
                        : queryable.Any(x => x.Id != id && x.WorkflowId == updatedEntity.WorkflowId && x.StateName != null && x.StateName.Trim().ToUpper() == nameUpper);

                    if (exists)
                    {
                        return ValidationResult.Failure(nameof(updatedEntity.StateName), "State name must be unique within the workflow.");
                    }
                }
            }
        }

        if (updatedEntity.IsInitial && (updatedEntity.WorkflowId != currentEntity?.WorkflowId || (!currentEntity?.IsInitial ?? true)))
        {
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool initialExists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.WorkflowId == updatedEntity.WorkflowId && x.IsInitial, cancellationToken)
                    : queryable.Any(x => x.Id != id && x.WorkflowId == updatedEntity.WorkflowId && x.IsInitial);

                if (initialExists)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.IsInitial), "Another state in this workflow is already marked as initial.");
                }
            }
        }

        return ValidationResult.Success();
    }
}
