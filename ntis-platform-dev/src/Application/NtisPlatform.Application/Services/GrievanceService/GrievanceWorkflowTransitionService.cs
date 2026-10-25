using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowTransition;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceWorkflowTransitionService : BaseCommonCrudService<
    GrievanceWorkflowTransitionEntity,
    GrievanceWorkflowTransitionDto,
    CreateGrievanceWorkflowTransitionDto,
    UpdateGrievanceWorkflowTransitionDto,
    GrievanceWorkflowTransitionQueryParameters,
    int>, IGrievanceWorkflowTransitionService
{
    private readonly IRepository<GrievanceWorkflowEntity, int> _workflowRepository;
    private readonly IRepository<GrievanceWorkflowStateEntity, int> _workflowStateRepository;

    public GrievanceWorkflowTransitionService(
        IRepository<GrievanceWorkflowTransitionEntity, int> repository,
        IRepository<GrievanceWorkflowEntity, int> workflowRepository,
        IRepository<GrievanceWorkflowStateEntity, int> workflowStateRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
        _workflowRepository = workflowRepository;
        _workflowStateRepository = workflowStateRepository;
    }

    protected override IQueryable<GrievanceWorkflowTransitionEntity> ApplyIncludes(IQueryable<GrievanceWorkflowTransitionEntity> query)
    {
        return query
            .Include(x => x.Workflow)
            .Include(x => x.FromState)
            .Include(x => x.ToState);
    }

    public override async Task<GrievanceWorkflowTransitionDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable().AsNoTracking());
        var entity = query.Provider is IAsyncQueryProvider
            ? await query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            : query.FirstOrDefault(x => x.Id == id);
        return entity == null ? null : _mapper.Map<GrievanceWorkflowTransitionDto>(entity);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GrievanceWorkflowTransitionEntity entity, CancellationToken cancellationToken = default)
    {
        var workflow = await _workflowRepository.GetByIdAsync(entity.WorkflowId, cancellationToken);
        if (workflow == null || !workflow.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.WorkflowId), "Active parent workflow does not exist.");
        }

        var fromState = await _workflowStateRepository.GetByIdAsync(entity.FromStateId, cancellationToken);
        if (fromState == null || !fromState.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.FromStateId), "Active origin (From) state does not exist.");
        }
        if (fromState.WorkflowId != entity.WorkflowId)
        {
            return ValidationResult.Failure(nameof(entity.FromStateId), "From state does not belong to the specified workflow.");
        }

        var toState = await _workflowStateRepository.GetByIdAsync(entity.ToStateId, cancellationToken);
        if (toState == null || !toState.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.ToStateId), "Active destination (To) state does not exist.");
        }
        if (toState.WorkflowId != entity.WorkflowId)
        {
            return ValidationResult.Failure(nameof(entity.ToStateId), "To state does not belong to the specified workflow.");
        }

        if (!string.IsNullOrWhiteSpace(entity.TransitionName))
        {
            var nameUpper = entity.TransitionName.Trim().ToUpper();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.WorkflowId == entity.WorkflowId && x.FromStateId == entity.FromStateId && x.ToStateId == entity.ToStateId && x.TransitionName != null && x.TransitionName.Trim().ToUpper() == nameUpper, cancellationToken)
                    : queryable.Any(x => x.WorkflowId == entity.WorkflowId && x.FromStateId == entity.FromStateId && x.ToStateId == entity.ToStateId && x.TransitionName != null && x.TransitionName.Trim().ToUpper() == nameUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(entity.TransitionName), "Transition name already exists for this From-To state pair in the workflow.");
                }
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GrievanceWorkflowTransitionEntity currentEntity, GrievanceWorkflowTransitionEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        var workflow = await _workflowRepository.GetByIdAsync(updatedEntity.WorkflowId, cancellationToken);
        if (workflow == null || !workflow.IsActive)
        {
            return ValidationResult.Failure(nameof(updatedEntity.WorkflowId), "Active parent workflow does not exist.");
        }

        var fromState = await _workflowStateRepository.GetByIdAsync(updatedEntity.FromStateId, cancellationToken);
        if (fromState == null || !fromState.IsActive)
        {
            return ValidationResult.Failure(nameof(updatedEntity.FromStateId), "Active origin (From) state does not exist.");
        }
        if (fromState.WorkflowId != updatedEntity.WorkflowId)
        {
            return ValidationResult.Failure(nameof(updatedEntity.FromStateId), "From state does not belong to the specified workflow.");
        }

        var toState = await _workflowStateRepository.GetByIdAsync(updatedEntity.ToStateId, cancellationToken);
        if (toState == null || !toState.IsActive)
        {
            return ValidationResult.Failure(nameof(updatedEntity.ToStateId), "Active destination (To) state does not exist.");
        }
        if (toState.WorkflowId != updatedEntity.WorkflowId)
        {
            return ValidationResult.Failure(nameof(updatedEntity.ToStateId), "To state does not belong to the specified workflow.");
        }

        if (!string.IsNullOrWhiteSpace(updatedEntity.TransitionName))
        {
            var nameUpper = updatedEntity.TransitionName.Trim().ToUpper();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.WorkflowId == updatedEntity.WorkflowId && x.FromStateId == updatedEntity.FromStateId && x.ToStateId == updatedEntity.ToStateId && x.TransitionName != null && x.TransitionName.Trim().ToUpper() == nameUpper, cancellationToken)
                    : queryable.Any(x => x.Id != id && x.WorkflowId == updatedEntity.WorkflowId && x.FromStateId == updatedEntity.FromStateId && x.ToStateId == updatedEntity.ToStateId && x.TransitionName != null && x.TransitionName.Trim().ToUpper() == nameUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.TransitionName), "Transition name already exists for this From-To state pair in the workflow.");
                }
            }
        }

        return ValidationResult.Success();
    }
}
