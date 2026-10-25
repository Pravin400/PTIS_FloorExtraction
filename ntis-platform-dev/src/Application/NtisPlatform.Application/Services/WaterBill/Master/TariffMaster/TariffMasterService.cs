using System.Text.RegularExpressions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master.WaterBill;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Master.WaterBill;

public class TariffMasterService
    : BaseCommonCrudService<TariffMasterEntity, TariffMasterDto, CreateTariffMasterDto, UpdateTariffMasterDto, TariffMasterQueryParameters, long>,
      ITariffMasterService
{
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<YearMasterEntity, int> _yearRepository;
    private readonly IRepository<ConnectionTypeMasterEntity, int> _connectionTypeRepository;
    private readonly IRepository<ConnectionCategoryMasterEntity, int> _connectionCategoryRepository;
    private readonly IRepository<TapSizeMasterEntity, int> _tapSizeRepository;

    public TariffMasterService(
        IRepository<TariffMasterEntity, long> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidationService,
        ICurrentUserService currentUserService,
        IRepository<YearMasterEntity, int> yearRepository,
        IRepository<ConnectionTypeMasterEntity, int> connectionTypeRepository,
        IRepository<ConnectionCategoryMasterEntity, int> connectionCategoryRepository,
        IRepository<TapSizeMasterEntity, int> tapSizeRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidationService = referenceValidationService ?? throw new ArgumentNullException(nameof(referenceValidationService));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _yearRepository = yearRepository ?? throw new ArgumentNullException(nameof(yearRepository));
        _connectionTypeRepository = connectionTypeRepository ?? throw new ArgumentNullException(nameof(connectionTypeRepository));
        _connectionCategoryRepository = connectionCategoryRepository ?? throw new ArgumentNullException(nameof(connectionCategoryRepository));
        _tapSizeRepository = tapSizeRepository ?? throw new ArgumentNullException(nameof(tapSizeRepository));
    }

    protected override IQueryable<TariffMasterEntity> ApplyIncludes(IQueryable<TariffMasterEntity> query)
    {
        return query
            .Include(x => x.Year)
            .Include(x => x.ConnectionType)
            .Include(x => x.ConnectionCategory)
            .Include(x => x.TapSize)
            .Include(x => x.Slabs);
    }

    public override async Task<PagedResult<TariffMasterDto>> GetAllAsync(
        TariffMasterQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking();

        // 1. Direct filters
        if (queryParameters.Id.HasValue)
        {
            query = query.Where(x => x.Id == queryParameters.Id.Value);
        }

        if (queryParameters.FinancialYearId.HasValue)
        {
            query = query.Where(x => x.YearId == queryParameters.FinancialYearId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.FinancialYear))
        {
            var yr = queryParameters.FinancialYear.Trim();
            query = query.Where(x => x.Year != null && (x.Year.Year.ToString() == yr || (x.Year.YearCode != null && x.Year.YearCode.Contains(yr))));
        }

        if (queryParameters.ConnectionTypeId.HasValue)
        {
            query = query.Where(x => x.ConnectionTypeId == queryParameters.ConnectionTypeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.ConnectionTypeCode))
        {
            var codeLower = queryParameters.ConnectionTypeCode.Trim().ToLower();
            query = query.Where(x => x.ConnectionType != null && x.ConnectionType.ConnectionTypeCode != null && x.ConnectionType.ConnectionTypeCode.ToLower().Contains(codeLower));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.ConnectionTypeName))
        {
            var nameLower = queryParameters.ConnectionTypeName.Trim().ToLower();
            query = query.Where(x => x.ConnectionType != null && x.ConnectionType.ConnectionType != null && x.ConnectionType.ConnectionType.ToLower().Contains(nameLower));
        }

        if (queryParameters.ConnectionCategoryId.HasValue)
        {
            query = query.Where(x => x.ConnectionCategoryId == queryParameters.ConnectionCategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.ConnectionCategoryCode))
        {
            var codeLower = queryParameters.ConnectionCategoryCode.Trim().ToLower();
            query = query.Where(x => x.ConnectionCategory != null && x.ConnectionCategory.ConnectionCategoryCode != null && x.ConnectionCategory.ConnectionCategoryCode.ToLower().Contains(codeLower));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.ConnectionCategoryName))
        {
            var nameLower = queryParameters.ConnectionCategoryName.Trim().ToLower();
            query = query.Where(x => x.ConnectionCategory != null && x.ConnectionCategory.ConnectionCategory != null && x.ConnectionCategory.ConnectionCategory.ToLower().Contains(nameLower));
        }

        if (queryParameters.TapSizeId.HasValue)
        {
            query = query.Where(x => x.TapSizeId == queryParameters.TapSizeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.TapSizeCode))
        {
            var codeLower = queryParameters.TapSizeCode.Trim().ToLower();
            query = query.Where(x => x.TapSize != null && x.TapSize.TapSizeCode != null && x.TapSize.TapSizeCode.ToLower().Contains(codeLower));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.TapSizeName))
        {
            var nameLower = queryParameters.TapSizeName.Trim().ToLower();
            query = query.Where(x => x.TapSize != null && x.TapSize.TapSize != null && x.TapSize.TapSize.ToLower().Contains(nameLower));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.TariffCode))
        {
            var codeLower = queryParameters.TariffCode.Trim().ToLower();
            query = query.Where(x => x.TariffCode != null && x.TariffCode.ToLower().Contains(codeLower));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.TariffName))
        {
            var nameLower = queryParameters.TariffName.Trim().ToLower();
            query = query.Where(x => x.TariffName != null && x.TariffName.ToLower().Contains(nameLower));
        }

        if (queryParameters.EffectiveFrom.HasValue)
        {
            query = query.Where(x => x.EffectiveFrom == queryParameters.EffectiveFrom.Value.Date);
        }

        if (queryParameters.EffectiveTo.HasValue)
        {
            query = query.Where(x => x.EffectiveTo == queryParameters.EffectiveTo.Value.Date);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.Description))
        {
            var desc = queryParameters.Description.Trim();
            query = query.Where(x => x.Description != null && x.Description.Contains(desc));
        }

        if (queryParameters.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == queryParameters.IsActive.Value);
        }

        // 2. SearchTerm:
        // Allows searching across:
        // - TariffCode
        // - TariffName
        // - ConnectionType (Code and Name)
        // - ConnectionCategory (Code and Name)
        // - TapSize (Code and Name)
        // - Financial Year (YearCode and Year)
        // - Description
        // - Numeric IDs (Id, ConnectionTypeId, ConnectionCategoryId, TapSizeId, YearId)
        if (!string.IsNullOrWhiteSpace(queryParameters.SearchTerm))
        {
            var term = queryParameters.SearchTerm.Trim();
            var termLower = term.ToLower();
            var isLong = long.TryParse(term, out var numericValLong);
            var isInt = int.TryParse(term, out var numericValInt);

            query = query.Where(x =>
                (x.TariffCode != null && x.TariffCode.ToLower().Contains(termLower)) ||
                (x.TariffName != null && x.TariffName.ToLower().Contains(termLower)) ||
                (x.ConnectionType != null && (
                    (x.ConnectionType.ConnectionType != null && x.ConnectionType.ConnectionType.ToLower().Contains(termLower)) ||
                    (x.ConnectionType.ConnectionTypeCode != null && x.ConnectionType.ConnectionTypeCode.ToLower().Contains(termLower))
                )) ||
                (x.ConnectionCategory != null && (
                    (x.ConnectionCategory.ConnectionCategory != null && x.ConnectionCategory.ConnectionCategory.ToLower().Contains(termLower)) ||
                    (x.ConnectionCategory.ConnectionCategoryCode != null && x.ConnectionCategory.ConnectionCategoryCode.ToLower().Contains(termLower))
                )) ||
                (x.TapSize != null && (
                    (x.TapSize.TapSize != null && x.TapSize.TapSize.ToLower().Contains(termLower)) ||
                    (x.TapSize.TapSizeCode != null && x.TapSize.TapSizeCode.ToLower().Contains(termLower))
                )) ||
                (x.Year != null && (
                    (x.Year.YearCode != null && x.Year.YearCode.ToLower().Contains(termLower)) ||
                    (isInt && x.Year.Year == numericValInt)
                )) ||
                (x.Description != null && x.Description.ToLower().Contains(termLower)) ||
                (isLong && x.Id == numericValLong) ||
                (isInt && (x.ConnectionTypeId == numericValInt || x.ConnectionCategoryId == numericValInt || x.TapSizeId == numericValInt || x.YearId == numericValInt)));
        }

        // 3. Sorting:
        // Allowed sort columns: YearId, ConnectionTypeId, ConnectionCategoryId, TapSizeId, TariffCode, TariffName, EffectiveFrom, EffectiveTo, Description (and Id, IsActive)
        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            var sortBy = queryParameters.SortBy.Trim().ToLower();

            query = sortBy switch
            {
                "financialyearid" or "yearid" => isDesc ? query.OrderByDescending(x => x.YearId) : query.OrderBy(x => x.YearId),
                "financialyear" or "year" or "yearcode" => isDesc ? query.OrderByDescending(x => x.Year != null ? (x.Year.YearCode ?? x.Year.Year.ToString()) : "") : query.OrderBy(x => x.Year != null ? (x.Year.YearCode ?? x.Year.Year.ToString()) : ""),

                "connectiontypeid" => isDesc ? query.OrderByDescending(x => x.ConnectionTypeId) : query.OrderBy(x => x.ConnectionTypeId),
                "connectiontype" or "connectiontypename" => isDesc ? query.OrderByDescending(x => x.ConnectionType != null ? x.ConnectionType.ConnectionType : "") : query.OrderBy(x => x.ConnectionType != null ? x.ConnectionType.ConnectionType : ""),
                "connectiontypecode" => isDesc ? query.OrderByDescending(x => x.ConnectionType != null ? x.ConnectionType.ConnectionTypeCode : "") : query.OrderBy(x => x.ConnectionType != null ? x.ConnectionType.ConnectionTypeCode : ""),

                "connectioncategoryid" => isDesc ? query.OrderByDescending(x => x.ConnectionCategoryId) : query.OrderBy(x => x.ConnectionCategoryId),
                "connectioncategory" or "connectioncategoryname" => isDesc ? query.OrderByDescending(x => x.ConnectionCategory != null ? x.ConnectionCategory.ConnectionCategory : "") : query.OrderBy(x => x.ConnectionCategory != null ? x.ConnectionCategory.ConnectionCategory : ""),
                "connectioncategorycode" => isDesc ? query.OrderByDescending(x => x.ConnectionCategory != null ? x.ConnectionCategory.ConnectionCategoryCode : "") : query.OrderBy(x => x.ConnectionCategory != null ? x.ConnectionCategory.ConnectionCategoryCode : ""),

                "tapsizeid" => isDesc ? query.OrderByDescending(x => x.TapSizeId) : query.OrderBy(x => x.TapSizeId),
                "tapsize" or "tapsizename" => isDesc ? query.OrderByDescending(x => x.TapSize != null ? x.TapSize.TapSize : "") : query.OrderBy(x => x.TapSize != null ? x.TapSize.TapSize : ""),
                "tapsizecode" => isDesc ? query.OrderByDescending(x => x.TapSize != null ? x.TapSize.TapSizeCode : "") : query.OrderBy(x => x.TapSize != null ? x.TapSize.TapSizeCode : ""),

                "tariffcode" => isDesc ? query.OrderByDescending(x => x.TariffCode) : query.OrderBy(x => x.TariffCode),
                "tariffname" => isDesc ? query.OrderByDescending(x => x.TariffName) : query.OrderBy(x => x.TariffName),
                "effectivefrom" => isDesc ? query.OrderByDescending(x => x.EffectiveFrom) : query.OrderBy(x => x.EffectiveFrom),
                "effectiveto" => isDesc ? query.OrderByDescending(x => x.EffectiveTo) : query.OrderBy(x => x.EffectiveTo),
                "description" => isDesc ? query.OrderByDescending(x => x.Description) : query.OrderBy(x => x.Description),
                "isactive" => isDesc ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
                "id" => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id),
                _ => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id)
            };
        }
        else
        {
            query = query.OrderBy(x => x.Id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var queryWithIncludes = ApplyIncludes(query);
        var pagedQuery = queryWithIncludes
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize);

        var entities = await pagedQuery.ToListAsync(cancellationToken);
        var items = _mapper.Map<List<TariffMasterDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<TariffMasterDto>(items, totalCount, pageNumber, pageSize);
    }

    public override async Task<TariffMasterDto?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await ApplyIncludes(_repository.GetQueryable())
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity == null)
            return null;

        return _mapper.Map<TariffMasterDto>(entity);
    }

    public override Task<TariffMasterDto> CreateAsync(CreateTariffMasterDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<TariffMasterDto?> UpdateAsync(long id, UpdateTariffMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        TariffMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateTariffMasterDomainRulesAsync(0, entity, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        long id,
        TariffMasterEntity currentEntity,
        TariffMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var domainValidation = await ValidateTariffMasterDomainRulesAsync(id, updatedEntity, cancellationToken);
        if (!domainValidation.IsValid)
        {
            return domainValidation;
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            if (id <= int.MaxValue)
            {
                var refResult = await _referenceValidationService.ValidateReferencesAsync<TariffMasterEntity>((int)id, cancellationToken);
                if (!refResult.IsValid)
                {
                    return refResult;
                }
            }
            var referencingTables = await _referenceValidationService.GetReferencingTablesWithDataAsync<TariffMasterEntity, long>(id, "Id", cancellationToken);
            if (referencingTables.Any())
            {
                return ValidationResult.Failure($"Cannot deactivate this Tariff because it is referenced in: {string.Join(", ", referencingTables)}.");
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        long id,
        TariffMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (id <= int.MaxValue)
        {
            var refResult = await _referenceValidationService.ValidateReferencesAsync<TariffMasterEntity>((int)id, cancellationToken);
            if (!refResult.IsValid)
            {
                return refResult;
            }
        }
        var referencingTables = await _referenceValidationService.GetReferencingTablesWithDataAsync<TariffMasterEntity, long>(id, "Id", cancellationToken);
        if (referencingTables.Any())
        {
            return ValidationResult.Failure($"Cannot delete this Tariff because it is referenced in: {string.Join(", ", referencingTables)}.");
        }

        return ValidationResult.Success();
    }

    private async Task<ValidationResult> ValidateTariffMasterDomainRulesAsync(
        long currentId,
        TariffMasterEntity entity,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(entity.TariffCode))
        {
            return ValidationResult.Failure(nameof(entity.TariffCode), "TariffCode cannot be null or whitespace.");
        }

        if (entity.TariffCode.Length > 60)
        {
            return ValidationResult.Failure(nameof(entity.TariffCode), "TariffCode cannot exceed 60 characters.");
        }

        if (!Regex.IsMatch(entity.TariffCode, @"^[A-Z0-9_-]+$"))
        {
            return ValidationResult.Failure(nameof(entity.TariffCode), "Tariff Code can only contain uppercase alphanumeric characters, hyphen (-), and underscore (_).");
        }

        if (string.IsNullOrWhiteSpace(entity.TariffName))
        {
            return ValidationResult.Failure(nameof(entity.TariffName), "TariffName cannot be null or whitespace.");
        }

        if (entity.TariffName.Length > 200)
        {
            return ValidationResult.Failure(nameof(entity.TariffName), "TariffName cannot exceed 200 characters.");
        }

        if (entity.YearId <= 0)
        {
            return ValidationResult.Failure(nameof(entity.YearId), "YearId must be greater than 0.");
        }

        if (_yearRepository != null)
        {
            var year = await _yearRepository.GetByIdAsync(entity.YearId, cancellationToken);
            if (year == null)
            {
                return ValidationResult.Failure(nameof(entity.YearId), $"Year with ID {entity.YearId} does not exist.");
            }
            if (!year.IsActive)
            {
                return ValidationResult.Failure(nameof(entity.YearId), $"Year '{year.YearCode ?? year.Year.ToString()}' is inactive and cannot be used.");
            }
        }

        if (entity.ConnectionTypeId <= 0)
        {
            return ValidationResult.Failure(nameof(entity.ConnectionTypeId), "ConnectionTypeId must be greater than 0.");
        }

        if (_connectionTypeRepository != null)
        {
            var connType = await _connectionTypeRepository.GetByIdAsync(entity.ConnectionTypeId, cancellationToken);
            if (connType == null)
            {
                return ValidationResult.Failure(nameof(entity.ConnectionTypeId), $"Connection Type with ID {entity.ConnectionTypeId} does not exist.");
            }
            if (!connType.IsActive)
            {
                return ValidationResult.Failure(nameof(entity.ConnectionTypeId), $"Connection Type '{connType.ConnectionType}' is inactive and cannot be used.");
            }
        }

        if (entity.ConnectionCategoryId <= 0)
        {
            return ValidationResult.Failure(nameof(entity.ConnectionCategoryId), "ConnectionCategoryId must be greater than 0.");
        }

        if (_connectionCategoryRepository != null)
        {
            var connCategory = await _connectionCategoryRepository.GetByIdAsync(entity.ConnectionCategoryId, cancellationToken);
            if (connCategory == null)
            {
                return ValidationResult.Failure(nameof(entity.ConnectionCategoryId), $"Connection Category with ID {entity.ConnectionCategoryId} does not exist.");
            }
            if (!connCategory.IsActive)
            {
                return ValidationResult.Failure(nameof(entity.ConnectionCategoryId), $"Connection Category '{connCategory.ConnectionCategory}' is inactive and cannot be used.");
            }
        }

        if (entity.TapSizeId <= 0)
        {
            return ValidationResult.Failure(nameof(entity.TapSizeId), "TapSizeId must be greater than 0.");
        }

        if (_tapSizeRepository != null)
        {
            var tapSize = await _tapSizeRepository.GetByIdAsync(entity.TapSizeId, cancellationToken);
            if (tapSize == null)
            {
                return ValidationResult.Failure(nameof(entity.TapSizeId), $"Tap Size with ID {entity.TapSizeId} does not exist.");
            }
            if (!tapSize.IsActive)
            {
                return ValidationResult.Failure(nameof(entity.TapSizeId), $"Tap Size '{tapSize.TapSize}' is inactive and cannot be used.");
            }
        }

        var minAllowedDate = new DateTime(1900, 1, 1);
        var maxAllowedDate = new DateTime(2100, 12, 31, 23, 59, 59, 999);

        if (entity.EffectiveFrom == default || entity.EffectiveFrom == DateTime.MinValue)
        {
            return ValidationResult.Failure(nameof(entity.EffectiveFrom), "EffectiveFrom must be a valid date.");
        }

        if (entity.EffectiveFrom < minAllowedDate || entity.EffectiveFrom > maxAllowedDate)
        {
            return ValidationResult.Failure(nameof(entity.EffectiveFrom), "EffectiveFrom must be between 01 Jan 1900 and 31 Dec 2100.");
        }

        if (entity.EffectiveTo.HasValue)
        {
            if (entity.EffectiveTo.Value < minAllowedDate || entity.EffectiveTo.Value > maxAllowedDate)
            {
                return ValidationResult.Failure(nameof(entity.EffectiveTo), "EffectiveTo must be between 01 Jan 1900 and 31 Dec 2100.");
            }

            if (entity.EffectiveTo.Value < entity.EffectiveFrom)
            {
                return ValidationResult.Failure(nameof(entity.EffectiveTo), "EffectiveTo cannot be earlier than EffectiveFrom.");
            }
        }

        if (entity.Description != null && entity.Description.Length > 500)
        {
            return ValidationResult.Failure(nameof(entity.Description), "Description cannot exceed 500 characters.");
        }

        var isDuplicate = await _repository.GetQueryable()
            .AnyAsync(x => x.TariffCode.ToLower() == entity.TariffCode.ToLower() && x.Id != currentId, cancellationToken);

        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(entity.TariffCode), $"TariffCode '{entity.TariffCode}' already exists.");
        }

        return ValidationResult.Success();
    }
}
