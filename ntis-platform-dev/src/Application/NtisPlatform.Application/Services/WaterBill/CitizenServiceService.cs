using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill;
using NtisPlatform.Core.Interfaces;

using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Services.WaterBill;

public class CitizenServiceService
    : BaseCommonCrudService<CitizenServiceEntity, CitizenServiceDto, CreateCitizenServiceDto, UpdateCitizenServiceDto, CitizenServiceQueryParameters, int>,
      ICitizenServiceService
{
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<DepartmentMasterEntity, int>? _departmentRepository;

    public CitizenServiceService(
        IRepository<CitizenServiceEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidationService,
        ICurrentUserService currentUserService,
        IRepository<DepartmentMasterEntity, int>? departmentRepository = null)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidationService = referenceValidationService;
        _currentUserService = currentUserService;
        _departmentRepository = departmentRepository;
    }

    public override Task<CitizenServiceDto> CreateAsync(CreateCitizenServiceDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<CitizenServiceDto?> UpdateAsync(int id, UpdateCitizenServiceDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        CitizenServiceEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (entity.DepartmentId <= 0)
        {
            return ValidationResult.Failure(nameof(entity.DepartmentId), "DepartmentId must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(entity.Title))
        {
            return ValidationResult.Failure(nameof(entity.Title), "Title cannot be null or whitespace.");
        }

        if (_departmentRepository != null)
        {
            var department = await _departmentRepository.GetByIdAsync(entity.DepartmentId, cancellationToken);
            if (department == null)
            {
                return ValidationResult.Failure(nameof(entity.DepartmentId), $"Department with Id {entity.DepartmentId} does not exist.");
            }

            if (!department.IsActive)
            {
                return ValidationResult.Failure(nameof(entity.DepartmentId), $"Department with Id {entity.DepartmentId} is inactive and cannot be associated with a service.");
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        CitizenServiceEntity currentEntity,
        CitizenServiceEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (updatedEntity.DepartmentId <= 0)
        {
            return ValidationResult.Failure(nameof(updatedEntity.DepartmentId), "DepartmentId must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(updatedEntity.Title))
        {
            return ValidationResult.Failure(nameof(updatedEntity.Title), "Title cannot be null or whitespace.");
        }

        if (_departmentRepository != null)
        {
            var department = await _departmentRepository.GetByIdAsync(updatedEntity.DepartmentId, cancellationToken);
            if (department == null)
            {
                return ValidationResult.Failure(nameof(updatedEntity.DepartmentId), $"Department with Id {updatedEntity.DepartmentId} does not exist.");
            }

            if (!department.IsActive)
            {
                return ValidationResult.Failure(nameof(updatedEntity.DepartmentId), $"Department with Id {updatedEntity.DepartmentId} is inactive and cannot be associated with a service.");
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        CitizenServiceEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await Task.FromResult(ValidationResult.Success());
    }

    public async Task<IEnumerable<CitizenServiceDto>> GetActiveCitizenServicesAsync(int? departmentId, CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable()
            .Where(x => x.IsActive);

        if (departmentId.HasValue)
        {
            query = query.Where(x => x.DepartmentId == departmentId.Value);
        }

        var entities = await query
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(cancellationToken);

        return _mapper.Map<IEnumerable<CitizenServiceDto>>(entities);
    }
}
