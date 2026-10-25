using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.GeographyTypeMaster;

public class GeographyTypeMasterService
    : BaseCommonCrudService<GeographyTypeMasterEntity, GeographyTypeMasterDto, CreateGeographyTypeMasterDto, UpdateGeographyTypeMasterDto, GeographyTypeMasterQueryParameters, int>,
      IGeographyTypeMasterService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<GeographyUnitEntity, int> _geographyUnitRepository;

    public GeographyTypeMasterService(
        IRepository<GeographyTypeMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        ICurrentUserService currentUserService,
        IRepository<GeographyUnitEntity, int> geographyUnitRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _currentUserService = currentUserService;
        _geographyUnitRepository = geographyUnitRepository;
    }

    public override async Task<PagedResult<GeographyTypeMasterDto>> GetAllAsync(
        GeographyTypeMasterQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking();

        if (queryParameters.Id.HasValue)
        {
            query = query.Where(x => x.Id == queryParameters.Id.Value);
        }

        if (queryParameters.LevelNo.HasValue)
        {
            query = query.Where(x => x.LevelNo == queryParameters.LevelNo.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.GeographyType))
        {
            var geographyType = queryParameters.GeographyType.Trim();
            query = query.Where(x => x.GeographyType == geographyType);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.GeographyTypeCode))
        {
            var geographyTypeCode = queryParameters.GeographyTypeCode.Trim();
            query = query.Where(x => x.GeographyTypeCode == geographyTypeCode);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SearchTerm))
        {
            var term = queryParameters.SearchTerm.Trim();
            query = query.Where(x => x.GeographyType.Contains(term) || x.GeographyTypeCode.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = queryParameters.SortBy.ToLower() switch
            {
                "geographytype" => isDesc ? query.OrderByDescending(x => x.GeographyType) : query.OrderBy(x => x.GeographyType),
                "geographytypecode" => isDesc ? query.OrderByDescending(x => x.GeographyTypeCode) : query.OrderBy(x => x.GeographyTypeCode),
                "levelno" => isDesc ? query.OrderByDescending(x => x.LevelNo) : query.OrderBy(x => x.LevelNo),
                "id" => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id),
                _ => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id)
            };
        }
        else
        {
            query = query.OrderBy(x => x.Id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagedQuery = query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize);

        var entities = await pagedQuery.ToListAsync(cancellationToken);
        var items = _mapper.Map<List<GeographyTypeMasterDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<GeographyTypeMasterDto>(items, totalCount, pageNumber, pageSize);
    }

    public override Task<GeographyTypeMasterDto> CreateAsync(
        CreateGeographyTypeMasterDto createDto,
        CancellationToken cancellationToken = default)
    {
        createDto.GeographyTypeCode = createDto.GeographyTypeCode.Trim();
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<GeographyTypeMasterDto?> UpdateAsync(
        int id,
        UpdateGeographyTypeMasterDto updateDto,
        CancellationToken cancellationToken = default)
    {
        updateDto.GeographyTypeCode = updateDto.GeographyTypeCode.Trim();
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override Task<ValidationResult> ValidateForCreateAsync(
        GeographyTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
        => ValidateUniqueAsync(entity, excludeId: null, cancellationToken);

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        GeographyTypeMasterEntity currentEntity,
        GeographyTypeMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateValidation = await ValidateUniqueAsync(updatedEntity, id, cancellationToken);
        if (!duplicateValidation.IsValid)
            return duplicateValidation;

        if (currentEntity.LevelNo != updatedEntity.LevelNo)
        {
            var hasUnits = await _geographyUnitRepository.GetQueryable().AsNoTracking()
                .AnyAsync(x => x.GeographyTypeId == id, cancellationToken);
            if (hasUnits)
            {
                return ValidationResult.Failure(
                    $"LevelNo cannot be changed for Geography Type '{currentEntity.GeographyType}' because Geography Units already exist for it; " +
                    "changing it would invalidate their parent/child hierarchy relationships.");
            }
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<GeographyTypeMasterEntity>(id, cancellationToken);

        return ValidationResult.Success();
    }

    /// <summary>
    /// Mirrors the GeographyTypeCode and LevelNo uniqueness expectations. Shared by create
    /// and update validation so the two paths can never drift apart.
    /// </summary>
    private async Task<ValidationResult> ValidateUniqueAsync(
        GeographyTypeMasterEntity entity,
        int? excludeId,
        CancellationToken cancellationToken)
    {
        var query = _repository.GetQueryable().AsNoTracking();
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);

        var isDuplicateCode = await query.AnyAsync(
            x => x.GeographyTypeCode.ToLower() == entity.GeographyTypeCode.ToLower(), cancellationToken);
        if (isDuplicateCode)
            return ValidationResult.Failure($"GeographyTypeCode '{entity.GeographyTypeCode}' already exists.");

        var isDuplicateLevel = await query.AnyAsync(
            x => x.LevelNo == entity.LevelNo, cancellationToken);
        if (isDuplicateLevel)
            return ValidationResult.Failure($"LevelNo '{entity.LevelNo}' already exists.");

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GeographyTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<GeographyTypeMasterEntity>(id, cancellationToken);
    }
}
