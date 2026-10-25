using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.GeographyUnit;

public class GeographyUnitService
    : BaseCommonCrudService<GeographyUnitEntity, GeographyUnitDto, CreateGeographyUnitDto, UpdateGeographyUnitDto, GeographyUnitQueryParameters, int>,
      IGeographyUnitService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<GeographyTypeMasterEntity, int> _geographyTypeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GeographyUnitService(
        IRepository<GeographyUnitEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        IRepository<GeographyTypeMasterEntity, int> geographyTypeRepository,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _geographyTypeRepository = geographyTypeRepository;
        _currentUserService = currentUserService;
    }

    protected override IQueryable<GeographyUnitEntity> ApplyIncludes(IQueryable<GeographyUnitEntity> query)
    {
        return query
            .Include(x => x.GeographyType)
            .Include(x => x.ParentGeographyUnit);
    }

    public override async Task<PagedResult<GeographyUnitDto>> GetAllAsync(
        GeographyUnitQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking();

        if (queryParameters.Id.HasValue)
        {
            query = query.Where(x => x.Id == queryParameters.Id.Value);
        }

        if (queryParameters.GeographyTypeId.HasValue)
        {
            query = query.Where(x => x.GeographyTypeId == queryParameters.GeographyTypeId.Value);
        }

        if (queryParameters.ParentGeographyUnitId.HasValue)
        {
            query = query.Where(x => x.ParentGeographyUnitId == queryParameters.ParentGeographyUnitId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.GeographyUnitCode))
        {
            var geographyUnitCode = queryParameters.GeographyUnitCode.Trim();
            query = query.Where(x => x.GeographyUnitCode == geographyUnitCode);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.GeographyUnitName))
        {
            var geographyUnitName = queryParameters.GeographyUnitName.Trim();
            query = query.Where(x => x.GeographyUnitName == geographyUnitName);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SearchTerm))
        {
            var term = queryParameters.SearchTerm.Trim();
            query = query.Where(x => x.GeographyUnitName.Contains(term) || x.GeographyUnitCode.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = queryParameters.SortBy.ToLower() switch
            {
                "geographyunitname" => isDesc ? query.OrderByDescending(x => x.GeographyUnitName) : query.OrderBy(x => x.GeographyUnitName),
                "geographyunitcode" => isDesc ? query.OrderByDescending(x => x.GeographyUnitCode) : query.OrderBy(x => x.GeographyUnitCode),
                "searchsequence" => isDesc ? query.OrderByDescending(x => x.SearchSequence) : query.OrderBy(x => x.SearchSequence),
                "geographytypeid" => isDesc ? query.OrderByDescending(x => x.GeographyTypeId) : query.OrderBy(x => x.GeographyTypeId),
                "parentgeographyunitid" => isDesc ? query.OrderByDescending(x => x.ParentGeographyUnitId) : query.OrderBy(x => x.ParentGeographyUnitId),
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

        var entities = await ApplyIncludes(pagedQuery).ToListAsync(cancellationToken);
        var items = _mapper.Map<List<GeographyUnitDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<GeographyUnitDto>(items, totalCount, pageNumber, pageSize);
    }

    public override Task<GeographyUnitDto> CreateAsync(
        CreateGeographyUnitDto createDto,
        CancellationToken cancellationToken = default)
    {
        createDto.GeographyUnitCode = createDto.GeographyUnitCode.Trim();
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<GeographyUnitDto?> UpdateAsync(
        int id,
        UpdateGeographyUnitDto updateDto,
        CancellationToken cancellationToken = default)
    {
        updateDto.GeographyUnitCode = updateDto.GeographyUnitCode.Trim();
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override Task<ValidationResult> ValidateForCreateAsync(
        GeographyUnitEntity entity,
        CancellationToken cancellationToken = default)
        => ValidateGeographyUnitDomainRulesAsync(0, entity, cancellationToken);

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        GeographyUnitEntity currentEntity,
        GeographyUnitEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var domainValidation = await ValidateGeographyUnitDomainRulesAsync(id, updatedEntity, cancellationToken);
        if (!domainValidation.IsValid)
            return domainValidation;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<GeographyUnitEntity>(id, cancellationToken);

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GeographyUnitEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<GeographyUnitEntity>(id, cancellationToken);
    }

    public async Task<IReadOnlyList<GeographyUnitLookupDto>> GetParentCandidatesAsync(
        int geographyTypeId,
        CancellationToken cancellationToken = default)
    {
        var geographyType = await _geographyTypeRepository.GetByIdAsync(geographyTypeId, cancellationToken);
        if (geographyType == null || geographyType.LevelNo <= 1)
        {
            return Array.Empty<GeographyUnitLookupDto>();
        }

        var parentType = await _geographyTypeRepository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(x => x.LevelNo == geographyType.LevelNo - 1, cancellationToken);
        if (parentType == null)
        {
            return Array.Empty<GeographyUnitLookupDto>();
        }

        return await _repository.GetQueryable().AsNoTracking()
            .Where(x => x.GeographyTypeId == parentType.Id && x.IsActive && !x.MarkedForDeletion)
            .OrderBy(x => x.SearchSequence ?? int.MaxValue)
            .ThenBy(x => x.GeographyUnitName)
            .Select(x => new GeographyUnitLookupDto
            {
                Id = x.Id,
                GeographyUnitCode = x.GeographyUnitCode,
                GeographyUnitName = x.GeographyUnitName
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<GeographyUnitTreeNodeDto>> GetHierarchyTreeAsync(
        int? rootId = null,
        CancellationToken cancellationToken = default)
    {
        var units = await _repository.GetQueryable().AsNoTracking()
            .Include(x => x.GeographyType)
            .Where(x => x.IsActive && !x.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        var childrenByParentId = units
            .Where(x => x.ParentGeographyUnitId.HasValue)
            .GroupBy(x => x.ParentGeographyUnitId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var byId = units.ToDictionary(x => x.Id);

        List<GeographyUnitEntity> roots;
        if (rootId.HasValue)
        {
            if (!byId.TryGetValue(rootId.Value, out var rootEntity))
            {
                return Array.Empty<GeographyUnitTreeNodeDto>();
            }
            roots = new List<GeographyUnitEntity> { rootEntity };
        }
        else
        {
            roots = units.Where(x => x.ParentGeographyUnitId == null).ToList();
        }

        return SortNodes(roots).Select(x => BuildNode(x, childrenByParentId, new HashSet<int>())).ToList();
    }

    /// <summary>
    /// <paramref name="ancestorIds"/> is the set of node ids already visited on the current
    /// root-to-node path. Create/Update validation (<see cref="IsDescendantAsync"/>) blocks new
    /// cycles going forward, but this guard is defensive: if a cycle ever reaches the database by
    /// another path, a child already on the ancestor chain is dropped instead of recursing forever.
    /// </summary>
    private static GeographyUnitTreeNodeDto BuildNode(
        GeographyUnitEntity entity,
        IReadOnlyDictionary<int, List<GeographyUnitEntity>> childrenByParentId,
        HashSet<int> ancestorIds)
    {
        var childAncestorIds = new HashSet<int>(ancestorIds) { entity.Id };

        var childEntities = childrenByParentId.TryGetValue(entity.Id, out var children)
            ? SortNodes(children.Where(c => !childAncestorIds.Contains(c.Id)))
            : Enumerable.Empty<GeographyUnitEntity>();

        return new GeographyUnitTreeNodeDto
        {
            Id = entity.Id,
            GeographyUnitCode = entity.GeographyUnitCode,
            GeographyUnitName = entity.GeographyUnitName,
            GeographyTypeId = entity.GeographyTypeId,
            GeographyTypeCode = entity.GeographyType?.GeographyTypeCode ?? string.Empty,
            GeographyType = entity.GeographyType?.GeographyType ?? string.Empty,
            LevelNo = entity.GeographyType?.LevelNo ?? 0,
            ParentGeographyUnitId = entity.ParentGeographyUnitId,
            Children = childEntities.Select(c => BuildNode(c, childrenByParentId, childAncestorIds)).ToList()
        };
    }

    private static IEnumerable<GeographyUnitEntity> SortNodes(IEnumerable<GeographyUnitEntity> entities)
        => entities
            .OrderBy(x => x.SearchSequence ?? int.MaxValue)
            .ThenBy(x => x.GeographyUnitName);

    private async Task<ValidationResult> ValidateGeographyUnitDomainRulesAsync(
        int currentId,
        GeographyUnitEntity entity,
        CancellationToken cancellationToken)
    {
        if (entity.ParentGeographyUnitId.HasValue && entity.ParentGeographyUnitId.Value == currentId && currentId != 0)
        {
            return ValidationResult.Failure("A geography unit cannot be its own parent.");
        }

        var geographyType = await _geographyTypeRepository.GetByIdAsync(entity.GeographyTypeId, cancellationToken);
        if (geographyType == null)
        {
            return ValidationResult.Failure($"Geography Type with ID {entity.GeographyTypeId} does not exist.");
        }

        if (!geographyType.IsActive)
        {
            return ValidationResult.Failure($"Geography Type '{geographyType.GeographyType}' is inactive and cannot be used.");
        }

        // Level 1 (top of the hierarchy) must have no parent; every other level must have one,
        // and that parent's Geography Type must sit exactly one level above the child's.
        if (geographyType.LevelNo <= 1)
        {
            if (entity.ParentGeographyUnitId.HasValue)
            {
                return ValidationResult.Failure($"A unit of top-level Geography Type '{geographyType.GeographyType}' (LevelNo {geographyType.LevelNo}) cannot have a parent.");
            }
        }
        else
        {
            if (!entity.ParentGeographyUnitId.HasValue)
            {
                return ValidationResult.Failure($"A unit of Geography Type '{geographyType.GeographyType}' (LevelNo {geographyType.LevelNo}) requires a parent.");
            }

            var parent = await _repository.GetQueryable().AsNoTracking()
                .Include(x => x.GeographyType)
                .FirstOrDefaultAsync(x => x.Id == entity.ParentGeographyUnitId.Value, cancellationToken);
            if (parent == null)
            {
                return ValidationResult.Failure($"Parent Geography Unit with ID {entity.ParentGeographyUnitId.Value} does not exist.");
            }

            if (!parent.IsActive)
            {
                return ValidationResult.Failure($"Parent Geography Unit '{parent.GeographyUnitName}' is inactive and cannot be used.");
            }

            if (parent.GeographyType == null || parent.GeographyType.LevelNo != geographyType.LevelNo - 1)
            {
                return ValidationResult.Failure(
                    $"Parent Geography Unit '{parent.GeographyUnitName}' must belong to the Geography Type one level above '{geographyType.GeographyType}' (LevelNo {geographyType.LevelNo - 1}).");
            }

            if (currentId != 0)
            {
                var isDescendant = await IsDescendantAsync(currentId, entity.ParentGeographyUnitId.Value, cancellationToken);
                if (isDescendant)
                {
                    return ValidationResult.Failure("The selected parent cannot be the unit itself or one of its own descendants (would create a cycle).");
                }
            }
        }

        var isDuplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != currentId &&
                           x.GeographyTypeId == entity.GeographyTypeId &&
                           x.GeographyUnitCode.ToLower() == entity.GeographyUnitCode.Trim().ToLower(), cancellationToken);
        if (isDuplicate)
        {
            return ValidationResult.Failure($"GeographyUnitCode '{entity.GeographyUnitCode}' already exists for the selected Geography Type.");
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Walks up from <paramref name="candidateParentId"/> via ParentGeographyUnitId to see whether
    /// <paramref name="unitId"/> appears anywhere in that ancestor chain -- i.e. whether assigning
    /// <paramref name="candidateParentId"/> as the parent of <paramref name="unitId"/> would create
    /// an indirect cycle (A -> B -> A). Bounded by <paramref name="maxDepth"/> so a pre-existing data
    /// cycle (which this same check prevents going forward) cannot loop forever.
    /// </summary>
    private async Task<bool> IsDescendantAsync(int unitId, int candidateParentId, CancellationToken cancellationToken, int maxDepth = 100)
    {
        var currentParentId = (int?)candidateParentId;
        var depth = 0;

        while (currentParentId.HasValue && depth < maxDepth)
        {
            if (currentParentId.Value == unitId)
            {
                return true;
            }

            currentParentId = await _repository.GetQueryable().AsNoTracking()
                .Where(x => x.Id == currentParentId.Value)
                .Select(x => x.ParentGeographyUnitId)
                .FirstOrDefaultAsync(cancellationToken);

            depth++;
        }

        return false;
    }
}
