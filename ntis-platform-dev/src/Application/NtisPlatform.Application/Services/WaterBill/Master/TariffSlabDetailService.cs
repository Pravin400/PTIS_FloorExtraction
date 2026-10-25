using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master;

public class TariffSlabDetailService
    : BaseCommonCrudService<TariffSlabDetailEntity, TariffSlabDetailDto, CreateTariffSlabDetailDto, UpdateTariffSlabDetailDto, TariffSlabDetailQueryParameters, long>,
      ITariffSlabDetailService
{
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<TariffMasterEntity, long> _tariffRepository;
    private readonly IRepository<GeographyUnitEntity, int> _geographyUnitRepository;

    private static readonly HashSet<string> SupportedFormulaCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "UNIT_RATE",
        "FIXED",
        "UNIT_RATE_FIXED",
        "SLAB_RATE",
        "PER_CONNECTION",
        "MINIMUM_CHARGE"
    };

    public TariffSlabDetailService(
        IRepository<TariffSlabDetailEntity, long> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidationService,
        ICurrentUserService currentUserService,
        IRepository<TariffMasterEntity, long> tariffRepository,
        IRepository<GeographyUnitEntity, int> geographyUnitRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidationService = referenceValidationService ?? throw new ArgumentNullException(nameof(referenceValidationService));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _tariffRepository = tariffRepository ?? throw new ArgumentNullException(nameof(tariffRepository));
        _geographyUnitRepository = geographyUnitRepository ?? throw new ArgumentNullException(nameof(geographyUnitRepository));
    }

    protected override IQueryable<TariffSlabDetailEntity> ApplyIncludes(IQueryable<TariffSlabDetailEntity> query)
    {
        return query
            .Include(x => x.Tariff)
            .Include(x => x.GeographyUnit);
    }

    public override async Task<PagedResult<TariffSlabDetailDto>> GetAllAsync(TariffSlabDetailQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking();

        // 1. Filtering
        if (queryParameters.Id.HasValue)
        {
            query = query.Where(x => x.Id == queryParameters.Id.Value);
        }

        if (queryParameters.TariffId.HasValue)
        {
            query = query.Where(x => x.TariffId == queryParameters.TariffId.Value);
        }

        if (queryParameters.GeographyUnitId.HasValue)
        {
            query = query.Where(x => x.GeographyUnitId == queryParameters.GeographyUnitId.Value);
        }

        if (queryParameters.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == queryParameters.IsActive.Value);
        }

        // 2. SearchTerm
        if (!string.IsNullOrWhiteSpace(queryParameters.SearchTerm))
        {
            var term = queryParameters.SearchTerm.Trim();
            var termLower = term.ToLower();
            var isNumeric = long.TryParse(term, out var numericVal);

            // Normalize legacy formula aliases before comparison.
            // Match supported aliases using exact or bounded substring rules,
            // preventing false positives from unrelated search terms containing "fixed" or "flat" (e.g. "flatland", "prefixed").
            var normalizedTerm = termLower.Replace(" ", "_");
            var matchesFixedOrFlat = normalizedTerm == "fixed" ||
                                     normalizedTerm == "fix" ||
                                     normalizedTerm == "flat" ||
                                     normalizedTerm == "flat_rate";

            query = query.Where(x =>
                (x.Tariff != null && (
                    (x.Tariff.TariffName != null && x.Tariff.TariffName.ToLower().Contains(termLower)) ||
                    (x.Tariff.TariffCode != null && x.Tariff.TariffCode.ToLower().Contains(termLower))
                )) ||
                (x.FormulaCode != null && (
                    x.FormulaCode.ToLower().Contains(termLower) ||
                    (matchesFixedOrFlat && (x.FormulaCode.ToLower() == "flat_rate" || x.FormulaCode.ToLower() == "fixed"))
                )) ||
                (x.GeographyUnit != null && x.GeographyUnit.GeographyUnitName != null && x.GeographyUnit.GeographyUnitName.ToLower().Contains(termLower)) ||
                (isNumeric && (x.Id == numericVal || x.TariffId == numericVal || (x.GeographyUnitId.HasValue && x.GeographyUnitId.Value == numericVal) || x.SortOrder == numericVal)));
        }

        // 3. Sorting
        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            var sortBy = queryParameters.SortBy.Trim().ToLower();

            query = sortBy switch
            {
                "id" => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id),
                "tariffid" => isDesc ? query.OrderByDescending(x => x.TariffId) : query.OrderBy(x => x.TariffId),
                "tariffname" => isDesc ? query.OrderByDescending(x => x.Tariff != null ? x.Tariff.TariffName : "") : query.OrderBy(x => x.Tariff != null ? x.Tariff.TariffName : ""),
                "geographyunitid" => isDesc ? query.OrderByDescending(x => x.GeographyUnitId) : query.OrderBy(x => x.GeographyUnitId),
                "geographyunitname" => isDesc ? query.OrderByDescending(x => x.GeographyUnit != null ? x.GeographyUnit.GeographyUnitName : "") : query.OrderBy(x => x.GeographyUnit != null ? x.GeographyUnit.GeographyUnitName : ""),
                "fromunit" => isDesc ? query.OrderByDescending(x => x.FromUnit) : query.OrderBy(x => x.FromUnit),
                "tounit" => isDesc ? query.OrderByDescending(x => x.ToUnit) : query.OrderBy(x => x.ToUnit),
                "unitrate" => isDesc ? query.OrderByDescending(x => x.UnitRate) : query.OrderBy(x => x.UnitRate),
                "fixedcharge" => isDesc ? query.OrderByDescending(x => x.FixedCharge) : query.OrderBy(x => x.FixedCharge),
                "minimumcharge" => isDesc ? query.OrderByDescending(x => x.MinimumCharge) : query.OrderBy(x => x.MinimumCharge),
                "maximumcharge" => isDesc ? query.OrderByDescending(x => x.MaximumCharge) : query.OrderBy(x => x.MaximumCharge),
                "perconnectionamount" => isDesc ? query.OrderByDescending(x => x.PerConnectionAmount) : query.OrderBy(x => x.PerConnectionAmount),
                "formulacode" => isDesc ? query.OrderByDescending(x => x.FormulaCode) : query.OrderBy(x => x.FormulaCode),
                "sortorder" => isDesc ? query.OrderByDescending(x => x.SortOrder) : query.OrderBy(x => x.SortOrder),
                "isactive" => isDesc ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
                _ => isDesc ? query.OrderByDescending(x => x.SortOrder).ThenByDescending(x => x.Id) : query.OrderBy(x => x.SortOrder).ThenBy(x => x.Id)
            };
        }
        else
        {
            query = query.OrderBy(x => x.SortOrder).ThenBy(x => x.Id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var queryWithIncludes = ApplyIncludes(query);
        var pagedQuery = queryWithIncludes
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize);

        var entities = await pagedQuery.ToListAsync(cancellationToken);
        var items = _mapper.Map<List<TariffSlabDetailDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<TariffSlabDetailDto>(items, totalCount, pageNumber, pageSize);
    }

    public override async Task<TariffSlabDetailDto?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable().AsNoTracking()
            .Include(x => x.Tariff)
            .Include(x => x.GeographyUnit)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity == null)
            return null;

        return _mapper.Map<TariffSlabDetailDto>(entity);
    }

    public override async Task<TariffSlabDetailDto> CreateAsync(CreateTariffSlabDetailDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();

        using (await TariffConcurrencyLock.LockAsync(createDto.TariffId, cancellationToken))
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await base.CreateAsync(createDto, cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                return result;
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                _unitOfWork.DiscardChanges();
                throw;
            }
        }
    }

    public override async Task<TariffSlabDetailDto?> UpdateAsync(long id, UpdateTariffSlabDetailDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();

        using (await TariffConcurrencyLock.LockAsync(updateDto.TariffId, cancellationToken))
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var existingEntity = await _repository.GetByIdAsync(id, cancellationToken);
                if (existingEntity == null)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    return null;
                }

                if (existingEntity.TariffId != updateDto.TariffId)
                {
                    throw new ValidationException(
                        nameof(updateDto.TariffId),
                        "Changing TariffId of an existing slab is not permitted.",
                        OperationType.Update);
                }

                if (updateDto.SortOrder <= 0)
                {
                    updateDto.SortOrder = existingEntity.SortOrder;
                }

                var result = await base.UpdateAsync(id, updateDto, cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                return result;
            }
            catch (DbUpdateConcurrencyException)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                _unitOfWork.DiscardChanges();
                throw new ValidationException(
                    nameof(updateDto.SortOrder),
                    "The tariff slab was modified concurrently by another process. Please reload and try again.",
                    OperationType.Update);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                _unitOfWork.DiscardChanges();
                throw;
            }
        }
    }

    public override async Task<bool> DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing == null)
            return false;

        using (await TariffConcurrencyLock.LockAsync(existing.TariffId, cancellationToken))
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await base.DeleteAsync(id, cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                return result;
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                _unitOfWork.DiscardChanges();
                throw;
            }
        }
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        TariffSlabDetailEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateTariffSlabDomainRulesAsync(0, entity, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        long id,
        TariffSlabDetailEntity currentEntity,
        TariffSlabDetailEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var domainValidation = await ValidateTariffSlabDomainRulesAsync(id, updatedEntity, cancellationToken);
        if (!domainValidation.IsValid)
        {
            return domainValidation;
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            if (id <= int.MaxValue)
            {
                var refResult = await _referenceValidationService.ValidateReferencesAsync<TariffSlabDetailEntity>((int)id, cancellationToken);
                if (!refResult.IsValid)
                {
                    return refResult;
                }
            }
            var referencingTables = await _referenceValidationService.GetReferencingTablesWithDataAsync<TariffSlabDetailEntity, long>(id, "Id", cancellationToken);
            if (referencingTables.Any())
            {
                return ValidationResult.Failure($"Cannot deactivate this Tariff Slab because it is referenced in: {string.Join(", ", referencingTables)}.");
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        long id,
        TariffSlabDetailEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (id <= int.MaxValue)
        {
            var refResult = await _referenceValidationService.ValidateReferencesAsync<TariffSlabDetailEntity>((int)id, cancellationToken);
            if (!refResult.IsValid)
            {
                return refResult;
            }
        }
        var referencingTables = await _referenceValidationService.GetReferencingTablesWithDataAsync<TariffSlabDetailEntity, long>(id, "Id", cancellationToken);
        if (referencingTables.Any())
        {
            return ValidationResult.Failure($"Cannot delete this Tariff Slab because it is referenced in: {string.Join(", ", referencingTables)}.");
        }

        return ValidationResult.Success();
    }

    private async Task<ValidationResult> ValidateTariffSlabDomainRulesAsync(
        long currentId,
        TariffSlabDetailEntity entity,
        CancellationToken cancellationToken)
    {
        // 1. Parent existence and status validation
        var tariff = await _tariffRepository.GetByIdAsync(entity.TariffId, cancellationToken);
        if (tariff == null)
        {
            return ValidationResult.Failure(nameof(entity.TariffId), $"Tariff with ID {entity.TariffId} does not exist.");
        }
        if (entity.IsActive && !tariff.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.TariffId), $"Referenced Tariff '{tariff.TariffCode}' is inactive.");
        }

        if (entity.GeographyUnitId.HasValue)
        {
            var geo = await _geographyUnitRepository.GetByIdAsync(entity.GeographyUnitId.Value, cancellationToken);
            if (geo == null)
            {
                return ValidationResult.Failure(nameof(entity.GeographyUnitId), $"GeographyUnit with ID {entity.GeographyUnitId.Value} does not exist.");
            }
            if (entity.IsActive && (!geo.IsActive || geo.MarkedForDeletion))
            {
                return ValidationResult.Failure(nameof(entity.GeographyUnitId), $"Referenced GeographyUnit '{geo.GeographyUnitName}' is inactive or marked for deletion.");
            }
        }

        // 2. Slab Range shape validation
        if (!entity.FromUnit.HasValue)
        {
            return ValidationResult.Failure(nameof(entity.FromUnit), "FromUnit is required and cannot be null.");
        }

        if (entity.FromUnit.Value < 0)
        {
            return ValidationResult.Failure(nameof(entity.FromUnit), "FromUnit cannot be negative.");
        }

        if (entity.ToUnit.HasValue)
        {
            if (entity.ToUnit.Value < 0)
            {
                return ValidationResult.Failure(nameof(entity.ToUnit), "ToUnit cannot be negative.");
            }

            if (entity.ToUnit.Value < entity.FromUnit.Value)
            {
                return ValidationResult.Failure(nameof(entity.ToUnit), "ToUnit cannot be less than FromUnit.");
            }
        }

        // 3. SortOrder and numeric bounds
        if (entity.SortOrder <= 0)
        {
            return ValidationResult.Failure(nameof(entity.SortOrder), "SortOrder must be greater than 0.");
        }

        if (entity.FixedCharge < 0)
            return ValidationResult.Failure(nameof(entity.FixedCharge), "FixedCharge cannot be negative.");

        if (entity.MinimumCharge < 0)
            return ValidationResult.Failure(nameof(entity.MinimumCharge), "MinimumCharge cannot be negative.");

        if (entity.MaximumCharge.HasValue && entity.MaximumCharge < entity.MinimumCharge)
            return ValidationResult.Failure(nameof(entity.MaximumCharge), "MaximumCharge cannot be less than MinimumCharge.");

        if (entity.UnitRate.HasValue && entity.UnitRate < 0)
            return ValidationResult.Failure(nameof(entity.UnitRate), "UnitRate cannot be negative.");

        if (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount < 0)
            return ValidationResult.Failure(nameof(entity.PerConnectionAmount), "PerConnectionAmount cannot be negative.");

        // 4. FormulaCode and formula-specific pricing validation according to the billing-calculation contract
        string formulaCode;
        if (string.IsNullOrWhiteSpace(entity.FormulaCode))
        {
            // Validate that at least one pricing element is greater than 0 when formula is not specified
            var hasPositivePricing = (entity.UnitRate.HasValue && entity.UnitRate.Value > 0) ||
                                     entity.FixedCharge > 0 ||
                                     (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount.Value > 0) ||
                                     entity.MinimumCharge > 0;
            if (!hasPositivePricing)
            {
                return ValidationResult.Failure(
                    "Pricing",
                    "At least one pricing element (UnitRate, FixedCharge, PerConnectionAmount, MinimumCharge) must be greater than 0.");
            }

            if (entity.FixedCharge > 0 && (!entity.UnitRate.HasValue || entity.UnitRate.Value <= 0))
                formulaCode = "FIXED";
            else if (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount.Value > 0 && (!entity.UnitRate.HasValue || entity.UnitRate.Value <= 0))
                formulaCode = "PER_CONNECTION";
            else if (entity.MinimumCharge > 0 && (!entity.UnitRate.HasValue || entity.UnitRate.Value <= 0))
                formulaCode = "MINIMUM_CHARGE";
            else if (entity.UnitRate.HasValue && entity.UnitRate.Value > 0 && entity.FixedCharge > 0)
                formulaCode = "UNIT_RATE_FIXED";
            else
                formulaCode = "UNIT_RATE";
        }
        else
        {
            formulaCode = entity.FormulaCode.Trim();
            if (string.Equals(formulaCode, "FLAT_RATE", StringComparison.OrdinalIgnoreCase))
            {
                formulaCode = "FIXED";
            }
        }

        if (!SupportedFormulaCodes.Contains(formulaCode))
        {
            return ValidationResult.Failure(nameof(entity.FormulaCode), $"Invalid FormulaCode '{entity.FormulaCode}'. Supported formula codes are: {string.Join(", ", SupportedFormulaCodes)}.");
        }

        entity.FormulaCode = formulaCode.ToUpperInvariant();

        // Formula-specific pricing rules and rejection of incompatible combinations:
        switch (entity.FormulaCode)
        {
            case "UNIT_RATE":
                if (!entity.UnitRate.HasValue || entity.UnitRate.Value <= 0)
                {
                    return ValidationResult.Failure(nameof(entity.UnitRate), "UnitRate must be greater than 0 for UNIT_RATE formula.");
                }
                if (entity.FixedCharge > 0)
                {
                    return ValidationResult.Failure(nameof(entity.FixedCharge), "FixedCharge is not allowed for UNIT_RATE formula. Use UNIT_RATE_FIXED if both unit rate and fixed charge apply.");
                }
                if (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.PerConnectionAmount), "PerConnectionAmount is not compatible with UNIT_RATE formula.");
                }
                break;

            case "FIXED":
                if (entity.FixedCharge <= 0)
                {
                    return ValidationResult.Failure(nameof(entity.FixedCharge), "FixedCharge must be greater than 0 for FIXED formula.");
                }
                if (entity.UnitRate.HasValue && entity.UnitRate.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.UnitRate), "UnitRate is not compatible with FIXED formula.");
                }
                if (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.PerConnectionAmount), "PerConnectionAmount is not compatible with FIXED formula.");
                }
                if (entity.MinimumCharge > 0)
                {
                    return ValidationResult.Failure(nameof(entity.MinimumCharge), "MinimumCharge is not compatible with FIXED formula.");
                }
                if (entity.MaximumCharge.HasValue && entity.MaximumCharge.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.MaximumCharge), "MaximumCharge is not compatible with FIXED formula.");
                }
                break;

            case "UNIT_RATE_FIXED":
                if (!entity.UnitRate.HasValue || entity.UnitRate.Value <= 0)
                {
                    return ValidationResult.Failure(nameof(entity.UnitRate), "UnitRate must be greater than 0 for UNIT_RATE_FIXED formula.");
                }
                if (entity.FixedCharge <= 0)
                {
                    return ValidationResult.Failure(nameof(entity.FixedCharge), "FixedCharge must be greater than 0 for UNIT_RATE_FIXED formula.");
                }
                if (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.PerConnectionAmount), "PerConnectionAmount is not compatible with UNIT_RATE_FIXED formula.");
                }
                break;

            case "SLAB_RATE":
                if (!entity.UnitRate.HasValue || entity.UnitRate.Value <= 0)
                {
                    return ValidationResult.Failure(nameof(entity.UnitRate), "UnitRate must be greater than 0 for SLAB_RATE formula.");
                }
                if (entity.FixedCharge > 0)
                {
                    return ValidationResult.Failure(nameof(entity.FixedCharge), "FixedCharge is not allowed for SLAB_RATE formula.");
                }
                if (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.PerConnectionAmount), "PerConnectionAmount is not compatible with SLAB_RATE formula.");
                }
                break;

            case "PER_CONNECTION":
                if (!entity.PerConnectionAmount.HasValue || entity.PerConnectionAmount.Value <= 0)
                {
                    return ValidationResult.Failure(nameof(entity.PerConnectionAmount), "PerConnectionAmount must be greater than 0 for PER_CONNECTION formula.");
                }
                if (entity.UnitRate.HasValue && entity.UnitRate.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.UnitRate), "UnitRate is not compatible with PER_CONNECTION formula.");
                }
                if (entity.FixedCharge > 0)
                {
                    return ValidationResult.Failure(nameof(entity.FixedCharge), "FixedCharge is not compatible with PER_CONNECTION formula.");
                }
                if (entity.MinimumCharge > 0)
                {
                    return ValidationResult.Failure(nameof(entity.MinimumCharge), "MinimumCharge is not compatible with PER_CONNECTION formula.");
                }
                if (entity.MaximumCharge.HasValue && entity.MaximumCharge.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.MaximumCharge), "MaximumCharge is not compatible with PER_CONNECTION formula.");
                }
                break;

            case "MINIMUM_CHARGE":
                if (entity.MinimumCharge <= 0)
                {
                    return ValidationResult.Failure(nameof(entity.MinimumCharge), "MinimumCharge must be greater than 0 for MINIMUM_CHARGE formula.");
                }
                if (entity.UnitRate.HasValue && entity.UnitRate.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.UnitRate), "UnitRate is not compatible with MINIMUM_CHARGE formula.");
                }
                if (entity.FixedCharge > 0)
                {
                    return ValidationResult.Failure(nameof(entity.FixedCharge), "FixedCharge is not compatible with MINIMUM_CHARGE formula.");
                }
                if (entity.PerConnectionAmount.HasValue && entity.PerConnectionAmount.Value > 0)
                {
                    return ValidationResult.Failure(nameof(entity.PerConnectionAmount), "PerConnectionAmount is not compatible with MINIMUM_CHARGE formula.");
                }
                break;
        }

        // 5. Active slab invariants (Overlap, Wildcard/mixing, SortOrder uniqueness)
        if (entity.IsActive)
        {
            var existingActiveSlabs = await _repository.GetQueryable()
                .Where(x => x.TariffId == entity.TariffId && x.IsActive && x.Id != currentId)
                .ToListAsync(cancellationToken);

            // Prohibit mixing global (NULL GeographyUnitId) and geography-specific slabs for the same Tariff
            if (entity.GeographyUnitId.HasValue)
            {
                if (existingActiveSlabs.Any(x => !x.GeographyUnitId.HasValue))
                {
                    return ValidationResult.Failure(nameof(entity.GeographyUnitId), "Cannot mix geography-specific slabs with existing global slabs for the same Tariff.");
                }
            }
            else
            {
                if (existingActiveSlabs.Any(x => x.GeographyUnitId.HasValue))
                {
                    return ValidationResult.Failure(nameof(entity.GeographyUnitId), "Cannot add a global slab when geography-specific slabs already exist for this Tariff.");
                }
            }

            // Invariants for the same geography scope
            var sameScopeSlabs = existingActiveSlabs
                .Where(x => x.GeographyUnitId == entity.GeographyUnitId)
                .ToList();

            // Check duplicate SortOrder
            if (sameScopeSlabs.Any(x => x.SortOrder == entity.SortOrder))
            {
                return ValidationResult.Failure(nameof(entity.SortOrder), $"A slab with SortOrder {entity.SortOrder} already exists for this Tariff and Geography.");
            }

            // Overlap checking: [FromUnit, ToUnit) half-open intervals
            const decimal maxBound = 999999999999999.9999m;
            var newFrom = entity.FromUnit.Value;
            var newTo = entity.ToUnit ?? maxBound;

            // Only one open-ended slab (ToUnit = null) allowed per Tariff + Geography
            if (!entity.ToUnit.HasValue && sameScopeSlabs.Any(x => !x.ToUnit.HasValue))
            {
                return ValidationResult.Failure(nameof(entity.ToUnit), "An open-ended slab (ToUnit = null) already exists for this Tariff and Geography. Only the final slab may be open-ended.");
            }

            foreach (var existing in sameScopeSlabs)
            {
                if (!existing.FromUnit.HasValue) continue;
                var existFrom = existing.FromUnit.Value;
                var existTo = existing.ToUnit ?? maxBound;

                // Ranges [A_from, A_to) and [B_from, B_to) overlap if:
                // A_from < B_to AND B_from < A_to
                if (newFrom < existTo && existFrom < newTo)
                {
                    var existToDisplay = existing.ToUnit.HasValue ? existing.ToUnit.Value.ToString() : "open";
                    var newToDisplay = entity.ToUnit.HasValue ? entity.ToUnit.Value.ToString() : "open";
                    return ValidationResult.Failure("RangeOverlap", $"Slab range [{newFrom} - {newToDisplay}) overlaps with existing slab [{existFrom} - {existToDisplay}) with SortOrder {existing.SortOrder}.");
                }
            }
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Calculates the billing amount for a tariff slab entity based on formula code and consumption / connection parameters.
    /// Evaluates legacy FLAT_RATE and canonical FIXED formula codes identically.
    /// </summary>
    public decimal CalculateBillingAmount(TariffSlabDetailEntity slab, decimal consumptionUnits, int connectionCount = 1)
    {
        if (slab == null) throw new ArgumentNullException(nameof(slab));
        return CalculateBillingAmount(
            slab.FormulaCode,
            consumptionUnits,
            slab.UnitRate,
            slab.FixedCharge,
            slab.PerConnectionAmount,
            connectionCount,
            slab.MinimumCharge,
            slab.MaximumCharge);
    }

    /// <summary>
    /// Calculates the billing amount for a tariff slab DTO based on formula code and consumption / connection parameters.
    /// Evaluates legacy FLAT_RATE and canonical FIXED formula codes identically.
    /// </summary>
    public decimal CalculateBillingAmount(TariffSlabDetailDto slab, decimal consumptionUnits, int connectionCount = 1)
    {
        if (slab == null) throw new ArgumentNullException(nameof(slab));
        return CalculateBillingAmount(
            slab.FormulaCode,
            consumptionUnits,
            slab.UnitRate,
            slab.FixedCharge,
            slab.PerConnectionAmount,
            connectionCount,
            slab.MinimumCharge,
            slab.MaximumCharge);
    }

    /// <summary>
    /// Canonical billing calculation logic supporting all formulas:
    /// UNIT_RATE, FIXED (and legacy FLAT_RATE), UNIT_RATE_FIXED, PER_CONNECTION, MINIMUM_CHARGE, SLAB_RATE.
    /// Treats legacy FLAT_RATE and canonical FIXED identically (pure fixed charge, independent of consumption).
    /// </summary>
    public static decimal CalculateBillingAmount(
        string? formulaCode,
        decimal consumptionUnits,
        decimal? unitRate,
        decimal fixedCharge,
        decimal? perConnectionAmount = null,
        int connectionCount = 1,
        decimal minimumCharge = 0,
        decimal? maximumCharge = null)
    {
        var normalizedFormula = string.IsNullOrWhiteSpace(formulaCode)
            ? "FIXED"
            : formulaCode.Trim().ToUpperInvariant();

        decimal amount;
        switch (normalizedFormula)
        {
            case "FIXED":
            case "FLAT_RATE": // Legacy backward-compatibility alias for FIXED
                amount = fixedCharge;
                break;

            case "UNIT_RATE":
                amount = consumptionUnits * (unitRate ?? 0m);
                if (minimumCharge > 0m && amount < minimumCharge)
                    amount = minimumCharge;
                if (maximumCharge.HasValue && maximumCharge.Value > 0m && amount > maximumCharge.Value)
                    amount = maximumCharge.Value;
                break;

            case "UNIT_RATE_FIXED":
                amount = (consumptionUnits * (unitRate ?? 0m)) + fixedCharge;
                if (minimumCharge > 0m && amount < minimumCharge)
                    amount = minimumCharge;
                if (maximumCharge.HasValue && maximumCharge.Value > 0m && amount > maximumCharge.Value)
                    amount = maximumCharge.Value;
                break;

            case "PER_CONNECTION":
                amount = (perConnectionAmount ?? 0m) * Math.Max(1, connectionCount);
                break;

            case "MINIMUM_CHARGE":
                amount = Math.Max(consumptionUnits * (unitRate ?? 0m), minimumCharge);
                if (maximumCharge.HasValue && maximumCharge.Value > 0m && amount > maximumCharge.Value)
                    amount = maximumCharge.Value;
                break;

            case "SLAB_RATE":
                amount = consumptionUnits * (unitRate ?? 0m);
                break;

            default:
                throw new ArgumentException($"Unsupported formula code '{formulaCode}' for billing calculation.");
        }

        return Math.Round(amount, 4, MidpointRounding.AwayFromZero);
    }
}
