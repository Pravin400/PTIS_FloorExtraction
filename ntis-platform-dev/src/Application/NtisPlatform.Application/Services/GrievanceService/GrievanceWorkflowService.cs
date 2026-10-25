using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflow;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceWorkflowService : BaseCommonCrudService<
    GrievanceWorkflowEntity,
    GrievanceWorkflowDto,
    CreateGrievanceWorkflowDto,
    UpdateGrievanceWorkflowDto,
    GrievanceWorkflowQueryParameters,
    int>, IGrievanceWorkflowService
{
    public GrievanceWorkflowService(
        IRepository<GrievanceWorkflowEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
    }

    protected override IQueryable<GrievanceWorkflowEntity> ApplyIncludes(IQueryable<GrievanceWorkflowEntity> query)
    {
        return query
            .Include(x => x.States)
            .Include(x => x.Transitions);
    }

    public override async Task<GrievanceWorkflowDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable().AsNoTracking());
        var entity = query.Provider is IAsyncQueryProvider
            ? await query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            : query.FirstOrDefault(x => x.Id == id);
        return entity == null ? null : _mapper.Map<GrievanceWorkflowDto>(entity);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GrievanceWorkflowEntity entity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(entity.WorkflowName))
        {
            var nameUpper = entity.WorkflowName.Trim().ToUpper();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.WorkflowName != null && x.WorkflowName.Trim().ToUpper() == nameUpper, cancellationToken)
                    : queryable.Any(x => x.WorkflowName != null && x.WorkflowName.Trim().ToUpper() == nameUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(entity.WorkflowName), "Workflow name must be unique.");
                }

                if (entity.IsDefault)
                {
                    bool defaultExists = queryable.Provider is IAsyncQueryProvider
                        ? await queryable.AsNoTracking().AnyAsync(x => x.IsDefault, cancellationToken)
                        : queryable.Any(x => x.IsDefault);

                    if (defaultExists)
                    {
                        return ValidationResult.Failure(nameof(entity.IsDefault), "Another workflow is already marked as default.");
                    }
                }
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GrievanceWorkflowEntity currentEntity, GrievanceWorkflowEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(updatedEntity.WorkflowName))
        {
            var nameUpper = updatedEntity.WorkflowName.Trim().ToUpper();
            var currentNameUpper = currentEntity?.WorkflowName?.Trim()?.ToUpper();

            if (!string.Equals(nameUpper, currentNameUpper, StringComparison.OrdinalIgnoreCase))
            {
                var queryable = _repository.GetQueryable();
                if (queryable != null)
                {
                    bool exists = queryable.Provider is IAsyncQueryProvider
                        ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.WorkflowName != null && x.WorkflowName.Trim().ToUpper() == nameUpper, cancellationToken)
                        : queryable.Any(x => x.Id != id && x.WorkflowName != null && x.WorkflowName.Trim().ToUpper() == nameUpper);

                    if (exists)
                    {
                        return ValidationResult.Failure(nameof(updatedEntity.WorkflowName), "Workflow name must be unique.");
                    }
                }
            }
        }

        if (updatedEntity.IsDefault && (!currentEntity?.IsDefault ?? true))
        {
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool defaultExists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.IsDefault, cancellationToken)
                    : queryable.Any(x => x.Id != id && x.IsDefault);

                if (defaultExists)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.IsDefault), "Another workflow is already marked as default.");
                }
            }
        }

        return ValidationResult.Success();
    }
}
