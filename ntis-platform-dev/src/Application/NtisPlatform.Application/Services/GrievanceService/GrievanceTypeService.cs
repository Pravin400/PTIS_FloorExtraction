using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceTypeMaster;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceTypeService : BaseCommonCrudService<
    GrievanceTypeMasterEntity,
    GrievanceTypeDto,
    CreateGrievanceTypeDto,
    UpdateGrievanceTypeDto,
    GrievanceTypeQueryParameters,
    int>, IGrievanceTypeService
{
    private readonly IRepository<GrievanceDepartmentMasterEntity, int> _departmentRepository;

    public GrievanceTypeService(
        IRepository<GrievanceTypeMasterEntity, int> repository,
        IRepository<GrievanceDepartmentMasterEntity, int> departmentRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
        _departmentRepository = departmentRepository;
    }

    protected override IQueryable<GrievanceTypeMasterEntity> ApplyIncludes(IQueryable<GrievanceTypeMasterEntity> query)
    {
        return query.Include(x => x.GrievanceDepartment);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GrievanceTypeMasterEntity entity, CancellationToken cancellationToken = default)
    {
        var dept = await _departmentRepository.GetByIdAsync(entity.GrievanceDepartmentId, cancellationToken);
        if (dept == null)
        {
            return ValidationResult.Failure(nameof(entity.GrievanceDepartmentId), "Grievance department does not exist.");
        }

        if (!string.IsNullOrWhiteSpace(entity.GrievanceType))
        {
            var typeUpper = entity.GrievanceType.Trim().ToUpper();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.GrievanceDepartmentId == entity.GrievanceDepartmentId && x.GrievanceType != null && x.GrievanceType.Trim().ToUpper() == typeUpper, cancellationToken)
                    : queryable.Any(x => x.GrievanceDepartmentId == entity.GrievanceDepartmentId && x.GrievanceType != null && x.GrievanceType.Trim().ToUpper() == typeUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(entity.GrievanceType), "Grievance type already exists for this department.");
                }
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GrievanceTypeMasterEntity currentEntity, GrievanceTypeMasterEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (updatedEntity.GrievanceDepartmentId != currentEntity.GrievanceDepartmentId)
        {
            var dept = await _departmentRepository.GetByIdAsync(updatedEntity.GrievanceDepartmentId, cancellationToken);
            if (dept == null)
            {
                return ValidationResult.Failure(nameof(updatedEntity.GrievanceDepartmentId), "Grievance department does not exist.");
            }
        }

        if (!string.IsNullOrWhiteSpace(updatedEntity.GrievanceType))
        {
            var typeUpper = updatedEntity.GrievanceType.Trim().ToUpper();
            var currentTypeUpper = currentEntity?.GrievanceType?.Trim()?.ToUpper();

            if (updatedEntity.GrievanceDepartmentId == currentEntity?.GrievanceDepartmentId &&
                string.Equals(typeUpper, currentTypeUpper, StringComparison.OrdinalIgnoreCase))
            {
                return ValidationResult.Success();
            }

            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.GrievanceDepartmentId == updatedEntity.GrievanceDepartmentId && x.GrievanceType != null && x.GrievanceType.Trim().ToUpper() == typeUpper, cancellationToken)
                    : queryable.Any(x => x.Id != id && x.GrievanceDepartmentId == updatedEntity.GrievanceDepartmentId && x.GrievanceType != null && x.GrievanceType.Trim().ToUpper() == typeUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.GrievanceType), "Grievance type already exists for this department.");
                }
            }
        }

        return ValidationResult.Success();
    }
}
