using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master;

public class TariffChargeDetailService
    : BaseCommonCrudService<TariffChargeDetailEntity, TariffChargeDetailDto, CreateTariffChargeDetailDto, UpdateTariffChargeDetailDto, TariffChargeDetailQueryParameters, long>,
      ITariffChargeDetailService
{
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<TariffMasterEntity, long> _tariffRepository;
    private readonly IRepository<ChargeHeadMasterEntity, int> _chargeHeadRepository;
    private readonly IRepository<GeographyUnitEntity, int> _geographyUnitRepository;

    public TariffChargeDetailService(
        IRepository<TariffChargeDetailEntity, long> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidationService,
        ICurrentUserService currentUserService,
        IRepository<TariffMasterEntity, long> tariffRepository,
        IRepository<ChargeHeadMasterEntity, int> chargeHeadRepository,
        IRepository<GeographyUnitEntity, int> geographyUnitRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidationService = referenceValidationService ?? throw new ArgumentNullException(nameof(referenceValidationService));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _tariffRepository = tariffRepository ?? throw new ArgumentNullException(nameof(tariffRepository));
        _chargeHeadRepository = chargeHeadRepository ?? throw new ArgumentNullException(nameof(chargeHeadRepository));
        _geographyUnitRepository = geographyUnitRepository ?? throw new ArgumentNullException(nameof(geographyUnitRepository));
    }

    protected override IQueryable<TariffChargeDetailEntity> ApplyIncludes(IQueryable<TariffChargeDetailEntity> query)
    {
        return query
            .Include(x => x.Tariff)
            .Include(x => x.ChargeHead)
            .Include(x => x.GeographyUnit);
    }

    public override async Task<PagedResult<TariffChargeDetailDto>> GetAllAsync(TariffChargeDetailQueryParameters queryParameters, CancellationToken cancellationToken = default)
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

        if (queryParameters.ChargeHeadId.HasValue)
        {
            query = query.Where(x => x.ChargeHeadId == queryParameters.ChargeHeadId.Value);
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

            query = query.Where(x =>
                (x.Tariff != null && (
                    (x.Tariff.TariffName != null && x.Tariff.TariffName.ToLower().Contains(termLower)) ||
                    (x.Tariff.TariffCode != null && x.Tariff.TariffCode.ToLower().Contains(termLower))
                )) ||
                (x.ChargeHead != null && ((x.ChargeHead.Name != null && x.ChargeHead.Name.ToLower().Contains(termLower)) || (x.ChargeHead.Code != null && x.ChargeHead.Code.ToLower().Contains(termLower)))) ||
                (x.GeographyUnit != null && x.GeographyUnit.GeographyUnitName != null && x.GeographyUnit.GeographyUnitName.ToLower().Contains(termLower)) ||
                (isNumeric && (x.Id == numericVal || x.TariffId == numericVal || (x.GeographyUnitId.HasValue && x.GeographyUnitId.Value == numericVal) || x.ChargeHeadId == numericVal)));
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
                "chargeheadid" => isDesc ? query.OrderByDescending(x => x.ChargeHeadId) : query.OrderBy(x => x.ChargeHeadId),
                "chargeheadname" => isDesc ? query.OrderByDescending(x => x.ChargeHead != null ? x.ChargeHead.Name : "") : query.OrderBy(x => x.ChargeHead != null ? x.ChargeHead.Name : ""),
                "geographyunitid" => isDesc ? query.OrderByDescending(x => x.GeographyUnitId) : query.OrderBy(x => x.GeographyUnitId),
                "geographyunitname" => isDesc ? query.OrderByDescending(x => x.GeographyUnit != null ? x.GeographyUnit.GeographyUnitName : "") : query.OrderBy(x => x.GeographyUnit != null ? x.GeographyUnit.GeographyUnitName : ""),
                "amount" => isDesc ? query.OrderByDescending(x => x.Amount) : query.OrderBy(x => x.Amount),
                "isdynamic" => isDesc ? query.OrderByDescending(x => x.IsDynamic) : query.OrderBy(x => x.IsDynamic),
                "ismandatory" => isDesc ? query.OrderByDescending(x => x.IsMandatory) : query.OrderBy(x => x.IsMandatory),
                "sequenceno" => isDesc ? query.OrderByDescending(x => x.SequenceNo) : query.OrderBy(x => x.SequenceNo),
                "isactive" => isDesc ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
                _ => isDesc ? query.OrderByDescending(x => x.SequenceNo).ThenByDescending(x => x.Id) : query.OrderBy(x => x.SequenceNo).ThenBy(x => x.Id)
            };
        }
        else
        {
            query = query.OrderBy(x => x.SequenceNo).ThenBy(x => x.Id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var queryWithIncludes = ApplyIncludes(query);
        var pagedQuery = queryWithIncludes
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize);

        var entities = await pagedQuery.ToListAsync(cancellationToken);
        var items = _mapper.Map<List<TariffChargeDetailDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<TariffChargeDetailDto>(items, totalCount, pageNumber, pageSize);
    }

    public override async Task<TariffChargeDetailDto?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable().AsNoTracking()
            .Include(x => x.Tariff)
            .Include(x => x.ChargeHead)
            .Include(x => x.GeographyUnit)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity == null)
            return null;

        return _mapper.Map<TariffChargeDetailDto>(entity);
    }

    public override async Task<TariffChargeDetailDto> CreateAsync(CreateTariffChargeDetailDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();

        var isAutoSequence = !createDto.SequenceNo.HasValue || createDto.SequenceNo.Value <= 0;
        const int maxRetries = 3;

        using (await TariffConcurrencyLock.LockAsync(createDto.TariffId, cancellationToken))
        {
            for (var attempt = 1; attempt <= maxRetries; attempt++)
            {
                await _unitOfWork.BeginTransactionAsync(cancellationToken);
                try
                {
                    if (isAutoSequence)
                    {
                        var sequenceQuery = _repository.GetQueryable()
                            .Where(x => x.TariffId == createDto.TariffId && x.IsActive);

                        if (createDto.GeographyUnitId.HasValue)
                        {
                            sequenceQuery = sequenceQuery.Where(x => x.GeographyUnitId == createDto.GeographyUnitId.Value);
                        }
                        else
                        {
                            sequenceQuery = sequenceQuery.Where(x => x.GeographyUnitId == null);
                        }

                        var existingMax = await sequenceQuery
                            .Select(x => (int?)x.SequenceNo)
                            .MaxAsync(cancellationToken);

                        createDto.SequenceNo = (existingMax ?? 0) + 1;
                    }

                    var result = await base.CreateAsync(createDto, cancellationToken);
                    await _unitOfWork.CommitTransactionAsync(cancellationToken);
                    return result;
                }
                catch (DbUpdateException) when (isAutoSequence && attempt < maxRetries)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    _unitOfWork.DiscardChanges();
                    // Concurrency conflict occurred on sequence number; retry with fresh transaction
                }
                catch
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    _unitOfWork.DiscardChanges();
                    throw;
                }
            }

            throw new InvalidOperationException("Failed to allocate unique sequence number after multiple concurrent attempts.");
        }
    }

    public override async Task<TariffChargeDetailDto?> UpdateAsync(long id, UpdateTariffChargeDetailDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();

        using (await TariffConcurrencyLock.LockAsync(updateDto.TariffId, cancellationToken))
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await base.UpdateAsync(id, updateDto, cancellationToken);
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
        TariffChargeDetailEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateTariffChargeDomainRulesAsync(0, entity, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        long id,
        TariffChargeDetailEntity currentEntity,
        TariffChargeDetailEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var domainValidation = await ValidateTariffChargeDomainRulesAsync(id, updatedEntity, cancellationToken);
        if (!domainValidation.IsValid)
        {
            return domainValidation;
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            if (id <= int.MaxValue)
            {
                var refResult = await _referenceValidationService.ValidateReferencesAsync<TariffChargeDetailEntity>((int)id, cancellationToken);
                if (!refResult.IsValid)
                {
                    return refResult;
                }
            }
            var referencingTables = await _referenceValidationService.GetReferencingTablesWithDataAsync<TariffChargeDetailEntity, long>(id, "Id", cancellationToken);
            if (referencingTables.Any())
            {
                return ValidationResult.Failure($"Cannot deactivate this Tariff Charge because it is referenced in: {string.Join(", ", referencingTables)}.");
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        long id,
        TariffChargeDetailEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (id <= int.MaxValue)
        {
            var refResult = await _referenceValidationService.ValidateReferencesAsync<TariffChargeDetailEntity>((int)id, cancellationToken);
            if (!refResult.IsValid)
            {
                return refResult;
            }
        }
        var referencingTables = await _referenceValidationService.GetReferencingTablesWithDataAsync<TariffChargeDetailEntity, long>(id, "Id", cancellationToken);
        if (referencingTables.Any())
        {
            return ValidationResult.Failure($"Cannot delete this Tariff Charge because it is referenced in: {string.Join(", ", referencingTables)}.");
        }

        return ValidationResult.Success();
    }

    private async Task<ValidationResult> ValidateTariffChargeDomainRulesAsync(
        long currentId,
        TariffChargeDetailEntity entity,
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

        var chargeHead = await _chargeHeadRepository.GetByIdAsync(entity.ChargeHeadId, cancellationToken);
        if (chargeHead == null)
        {
            return ValidationResult.Failure(nameof(entity.ChargeHeadId), $"Charge Head with ID {entity.ChargeHeadId} does not exist.");
        }
        if (entity.IsActive && !chargeHead.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.ChargeHeadId), $"Referenced Charge Head '{chargeHead.Name}' is inactive.");
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

        // 2. Field bounds
        if (entity.Amount < 0)
            return ValidationResult.Failure(nameof(entity.Amount), "Amount cannot be negative.");

        if (entity.SequenceNo <= 0)
            return ValidationResult.Failure(nameof(entity.SequenceNo), "SequenceNo must be greater than 0.");

        // 3. Dynamic charge contract: dynamic charges must have static Amount = 0
        if (entity.IsDynamic && entity.Amount != 0)
        {
            return ValidationResult.Failure(nameof(entity.Amount), "Dynamic charges must have Amount set to 0 as their value is calculated at billing time.");
        }

        // 4. Active business key invariants (uniqueness and precedence)
        if (entity.IsActive)
        {
            var existingActiveCharges = await _repository.GetQueryable()
                .Where(x => x.TariffId == entity.TariffId && x.IsActive && x.Id != currentId)
                .ToListAsync(cancellationToken);

            // Duplicate active (TariffId, ChargeHeadId, GeographyUnitId) combination
            if (existingActiveCharges.Any(x => x.ChargeHeadId == entity.ChargeHeadId && x.GeographyUnitId == entity.GeographyUnitId))
            {
                return ValidationResult.Failure(nameof(entity.ChargeHeadId), "An active charge for this Charge Head and Geography already exists for this Tariff.");
            }

            // Global vs Specific Precedence:
            // If new charge is specific, ensure no active global charge exists for the same ChargeHead
            // If new charge is global, ensure no active specific charge exists for the same ChargeHead
            if (entity.GeographyUnitId.HasValue)
            {
                if (existingActiveCharges.Any(x => x.ChargeHeadId == entity.ChargeHeadId && !x.GeographyUnitId.HasValue))
                {
                    return ValidationResult.Failure(nameof(entity.GeographyUnitId), "A global charge for this Charge Head already exists for this Tariff. Global and geography-specific charges for the same Charge Head cannot coexist.");
                }
            }
            else
            {
                if (existingActiveCharges.Any(x => x.ChargeHeadId == entity.ChargeHeadId && x.GeographyUnitId.HasValue))
                {
                    return ValidationResult.Failure(nameof(entity.GeographyUnitId), "Geography-specific charges for this Charge Head already exist for this Tariff. Global and geography-specific charges for the same Charge Head cannot coexist.");
                }
            }

            // SequenceNo uniqueness for the same Tariff and Geography scope
            if (existingActiveCharges.Any(x => x.GeographyUnitId == entity.GeographyUnitId && x.SequenceNo == entity.SequenceNo))
            {
                return ValidationResult.Failure(nameof(entity.SequenceNo), $"A charge with SequenceNo {entity.SequenceNo} already exists for this Tariff and Geography scope.");
            }
        }

        return ValidationResult.Success();
    }
}
