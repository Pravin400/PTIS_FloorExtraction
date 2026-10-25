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

public class PortalContentService
    : BaseCommonCrudService<PortalContentEntity, PortalContentDto, CreatePortalContentDto, UpdatePortalContentDto, PortalContentQueryParameters, int>,
      IPortalContentService
{
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<DepartmentMasterEntity, int>? _departmentRepository;

    public PortalContentService(
        IRepository<PortalContentEntity, int> repository,
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

    public override Task<PortalContentDto> CreateAsync(CreatePortalContentDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<PortalContentDto?> UpdateAsync(int id, UpdatePortalContentDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        PortalContentEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entity.ContentType))
        {
            return ValidationResult.Failure(nameof(entity.ContentType), "ContentType cannot be null or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(entity.Title))
        {
            return ValidationResult.Failure(nameof(entity.Title), "Title cannot be null or whitespace.");
        }

        if (entity.DepartmentId.HasValue)
        {
            if (entity.DepartmentId.Value <= 0)
            {
                return ValidationResult.Failure(nameof(entity.DepartmentId), "DepartmentId must be greater than zero.");
            }

            if (_departmentRepository != null)
            {
                var department = await _departmentRepository.GetByIdAsync(entity.DepartmentId.Value, cancellationToken);
                if (department == null)
                {
                    return ValidationResult.Failure(nameof(entity.DepartmentId), $"Department with Id {entity.DepartmentId.Value} does not exist.");
                }

                if (!department.IsActive)
                {
                    return ValidationResult.Failure(nameof(entity.DepartmentId), $"Department with Id {entity.DepartmentId.Value} is inactive and cannot be associated with portal content.");
                }
            }
        }

        if (entity.PublishFromDate.HasValue && entity.PublishToDate.HasValue &&
            entity.PublishFromDate.Value > entity.PublishToDate.Value)
        {
            return ValidationResult.Failure(nameof(entity.PublishToDate), "PublishToDate must be on or after PublishFromDate.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        PortalContentEntity currentEntity,
        PortalContentEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(updatedEntity.ContentType))
        {
            return ValidationResult.Failure(nameof(updatedEntity.ContentType), "ContentType cannot be null or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(updatedEntity.Title))
        {
            return ValidationResult.Failure(nameof(updatedEntity.Title), "Title cannot be null or whitespace.");
        }

        if (updatedEntity.DepartmentId.HasValue)
        {
            if (updatedEntity.DepartmentId.Value <= 0)
            {
                return ValidationResult.Failure(nameof(updatedEntity.DepartmentId), "DepartmentId must be greater than zero.");
            }

            if (_departmentRepository != null)
            {
                var department = await _departmentRepository.GetByIdAsync(updatedEntity.DepartmentId.Value, cancellationToken);
                if (department == null)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.DepartmentId), $"Department with Id {updatedEntity.DepartmentId.Value} does not exist.");
                }

                if (!department.IsActive)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.DepartmentId), $"Department with Id {updatedEntity.DepartmentId.Value} is inactive and cannot be associated with portal content.");
                }
            }
        }

        if (updatedEntity.PublishFromDate.HasValue && updatedEntity.PublishToDate.HasValue &&
            updatedEntity.PublishFromDate.Value > updatedEntity.PublishToDate.Value)
        {
            return ValidationResult.Failure(nameof(updatedEntity.PublishToDate), "PublishToDate must be on or after PublishFromDate.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        PortalContentEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await Task.FromResult(ValidationResult.Success());
    }

    public async Task<IEnumerable<PortalContentDto>> GetActivePortalContentAsync(int? departmentId, string contentType, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var query = _repository.GetQueryable()
            .Where(x => x.IsActive)
            .Where(x => x.ContentType == contentType)
            .Where(x => !x.PublishFromDate.HasValue || x.PublishFromDate.Value <= now)
            .Where(x => !x.PublishToDate.HasValue || x.PublishToDate.Value >= now);

        if (departmentId.HasValue)
        {
            query = query.Where(x => x.DepartmentId == departmentId.Value);
        }

        var entities = await query
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(cancellationToken);

        return _mapper.Map<IEnumerable<PortalContentDto>>(entities);
    }
}
