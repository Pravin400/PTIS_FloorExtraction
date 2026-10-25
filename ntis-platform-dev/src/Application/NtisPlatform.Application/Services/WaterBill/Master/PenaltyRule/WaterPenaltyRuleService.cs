using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.PenaltyRule;

public class WaterPenaltyRuleService
    : BaseCommonCrudService<WaterPenaltyRuleMasterEntity, WaterPenaltyRuleDto, CreateWaterPenaltyRuleDto, UpdateWaterPenaltyRuleDto, WaterPenaltyRuleQueryParameters, long>,
      IWaterPenaltyRuleService
{
    private readonly IWaterPenaltyRuleValidationService _validationService;
    private readonly ILogger<WaterPenaltyRuleService> _logger;
    private readonly IUserRepository? _userRepository;
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private static readonly SemaphoreSlim _mutationLock = new(1, 1);
    private static readonly TimeSpan MutationLockTimeout = TimeSpan.FromSeconds(30);

    public WaterPenaltyRuleService(
        IRepository<WaterPenaltyRuleMasterEntity, long> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWaterPenaltyRuleValidationService validationService,
        ILogger<WaterPenaltyRuleService> logger,
        IUserRepository? userRepository = null,
        IHttpContextAccessor? httpContextAccessor = null)
        : base(repository, unitOfWork, mapper)
    {
        _validationService = validationService;
        _logger = logger;
        _userRepository = userRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    protected override IQueryable<WaterPenaltyRuleMasterEntity> ApplyIncludes(IQueryable<WaterPenaltyRuleMasterEntity> query)
    {
        return query
            .Include(x => x.FinancialYear)
            .Include(x => x.ConnectionCategory)
            .Include(x => x.GeographyUnit)
            .Include(x => x.ChargeHead);
    }

    public override async Task<PagedResult<WaterPenaltyRuleDto>> GetAllAsync(
        WaterPenaltyRuleQueryParameters qp,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable());

        if (qp.FinancialYearId.HasValue)
            query = query.Where(x => x.FinancialYearId == qp.FinancialYearId.Value);

        if (qp.ConnectionCategoryId.HasValue)
            query = query.Where(x => x.ConnectionCategoryId == qp.ConnectionCategoryId.Value);

        if (qp.GeographyUnitId.HasValue)
            query = query.Where(x => x.GeographyUnitId == qp.GeographyUnitId.Value);

        if (qp.ChargeHeadId.HasValue)
            query = query.Where(x => x.ChargeHeadId == qp.ChargeHeadId.Value);

        if (!string.IsNullOrWhiteSpace(qp.PenaltyType))
            query = query.Where(x => x.PenaltyType == qp.PenaltyType);

        if (qp.IsCurrentBill.HasValue)
            query = query.Where(x => x.IsCurrentBill == qp.IsCurrentBill.Value);

        if (qp.IsPendingBill.HasValue)
            query = query.Where(x => x.IsPendingBill == qp.IsPendingBill.Value);

        if (qp.IsActive.HasValue)
            query = query.Where(x => x.IsActive == qp.IsActive.Value);

        if (qp.EffectiveDate.HasValue)
        {
            var dt = qp.EffectiveDate.Value.Date;
            query = query.Where(x => x.EffectiveFrom.Date <= dt && (x.EffectiveTo == null || x.EffectiveTo.Value.Date >= dt));
        }

        if (!string.IsNullOrWhiteSpace(qp.SearchTerm))
        {
            var search = qp.SearchTerm.Trim();
            query = query.Where(x => x.PenaltyType.Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var isDesc = string.Equals(qp.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(qp.SortBy))
        {
            query = qp.SortBy.Trim().ToLowerInvariant() switch
            {
                "penaltyruleid" or "id" => isDesc ? query.OrderByDescending(x => x.PenaltyRuleId) : query.OrderBy(x => x.PenaltyRuleId),
                "penaltytype" => isDesc ? query.OrderByDescending(x => x.PenaltyType) : query.OrderBy(x => x.PenaltyType),
                "financialyearid" => isDesc ? query.OrderByDescending(x => x.FinancialYearId) : query.OrderBy(x => x.FinancialYearId),
                "financialyear" or "financialyearname" => isDesc
                    ? query.OrderByDescending(x => x.FinancialYear != null ? (x.FinancialYear.YearCode ?? x.FinancialYear.Year.ToString()) : x.FinancialYearId.ToString())
                    : query.OrderBy(x => x.FinancialYear != null ? (x.FinancialYear.YearCode ?? x.FinancialYear.Year.ToString()) : x.FinancialYearId.ToString()),
                "connectioncategoryid" => isDesc ? query.OrderByDescending(x => x.ConnectionCategoryId) : query.OrderBy(x => x.ConnectionCategoryId),
                "connectioncategory" or "connectioncategoryname" => isDesc
                    ? query.OrderByDescending(x => x.ConnectionCategory != null ? x.ConnectionCategory.ConnectionCategory : "")
                    : query.OrderBy(x => x.ConnectionCategory != null ? x.ConnectionCategory.ConnectionCategory : ""),
                "geographyunitid" => isDesc ? query.OrderByDescending(x => x.GeographyUnitId) : query.OrderBy(x => x.GeographyUnitId),
                "geographyunit" or "geographyname" => isDesc
                    ? query.OrderByDescending(x => x.GeographyUnit != null ? x.GeographyUnit.GeographyUnitName : "")
                    : query.OrderBy(x => x.GeographyUnit != null ? x.GeographyUnit.GeographyUnitName : ""),
                "chargeheadid" => isDesc ? query.OrderByDescending(x => x.ChargeHeadId) : query.OrderBy(x => x.ChargeHeadId),
                "chargehead" or "chargeheadname" => isDesc
                    ? query.OrderByDescending(x => x.ChargeHead != null ? x.ChargeHead.Name : "")
                    : query.OrderBy(x => x.ChargeHead != null ? x.ChargeHead.Name : ""),
                "fromday" => isDesc ? query.OrderByDescending(x => x.FromDay) : query.OrderBy(x => x.FromDay),
                "today" => isDesc ? query.OrderByDescending(x => x.ToDay) : query.OrderBy(x => x.ToDay),
                "percentagerate" or "rate" => isDesc ? query.OrderByDescending(x => x.PercentageRate) : query.OrderBy(x => x.PercentageRate),
                "flatamount" => isDesc ? query.OrderByDescending(x => x.FlatAmount) : query.OrderBy(x => x.FlatAmount),
                "maximumamount" or "maxamount" => isDesc ? query.OrderByDescending(x => x.MaximumAmount) : query.OrderBy(x => x.MaximumAmount),
                "effectivefrom" => isDesc ? query.OrderByDescending(x => x.EffectiveFrom) : query.OrderBy(x => x.EffectiveFrom),
                "effectiveto" => isDesc ? query.OrderByDescending(x => x.EffectiveTo) : query.OrderBy(x => x.EffectiveTo),
                "iscurrentbill" => isDesc ? query.OrderByDescending(x => x.IsCurrentBill) : query.OrderBy(x => x.IsCurrentBill),
                "ispendingbill" => isDesc ? query.OrderByDescending(x => x.IsPendingBill) : query.OrderBy(x => x.IsPendingBill),
                "isactive" or "status" => isDesc ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
                "createddate" => isDesc ? query.OrderByDescending(x => x.CreatedDate) : query.OrderBy(x => x.CreatedDate),
                "updateddate" => isDesc ? query.OrderByDescending(x => x.UpdatedDate) : query.OrderBy(x => x.UpdatedDate),
                _ => isDesc ? query.OrderByDescending(x => x.PenaltyRuleId) : query.OrderBy(x => x.PenaltyRuleId)
            };
        }
        else
        {
            query = isDesc
                ? query.OrderByDescending(x => x.PenaltyRuleId)
                : query.OrderBy(x => x.PenaltyRuleId);
        }

        var paged = qp.PageSize == -1
            ? query
            : query.Skip((qp.PageNumber - 1) * qp.PageSize).Take(qp.PageSize);

        var entities = await paged.ToListAsync(cancellationToken);
        var dtos = _mapper.Map<List<WaterPenaltyRuleDto>>(entities);
        await ResolveUserNamesAsync(dtos, cancellationToken);

        var pageNum = qp.PageSize == -1 ? 1 : qp.PageNumber;
        var pageSize = qp.PageSize == -1 ? Math.Max(totalCount, 1) : qp.PageSize;
        return new PagedResult<WaterPenaltyRuleDto>(dtos, totalCount, pageNum, pageSize);
    }

    public override async Task<WaterPenaltyRuleDto?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await ApplyIncludes(_repository.GetQueryable())
            .FirstOrDefaultAsync(x => x.PenaltyRuleId == id, cancellationToken);
        if (entity == null)
            entity = await _repository.GetByIdAsync(id, cancellationToken);

        if (entity == null)
            return null;

        var dto = _mapper.Map<WaterPenaltyRuleDto>(entity);
        await ResolveUserNamesAsync(new[] { dto }, cancellationToken);
        return dto;
    }

    public override async Task<WaterPenaltyRuleDto> CreateAsync(
        CreateWaterPenaltyRuleDto createDto,
        CancellationToken cancellationToken = default)
    {
        if (!createDto.EffectiveFrom.HasValue || createDto.EffectiveFrom.Value == default || createDto.EffectiveFrom.Value == DateTime.MinValue)
        {
            throw new ValidationException(nameof(createDto.EffectiveFrom), "EffectiveFrom is required and must be a valid date.", OperationType.Create);
        }

        var entity = _mapper.Map<WaterPenaltyRuleMasterEntity>(createDto);
        entity.CreatedDate = DateTime.UtcNow;
        entity.UpdatedBy = createDto.CreatedBy;
        entity.UpdatedDate = entity.CreatedDate;

        var lockAcquired = await _mutationLock.WaitAsync(MutationLockTimeout, cancellationToken);
        if (!lockAcquired)
        {
            _logger.LogWarning("Mutation lock acquisition timed out for penalty rule creation.");
            throw new InvalidOperationException("Failed to acquire penalty rule mutation lock within timeout. Please retry.");
        }
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var validationResult = await _validationService.ValidateRuleAsync(entity, null, cancellationToken);
                if (!validationResult.IsValid)
                {
                    throw new ValidationException("Validation failed for penalty rule creation", validationResult.ToDictionary(), OperationType.Create);
                }

                await _repository.AddAsync(entity, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
        finally
        {
            _mutationLock.Release();
        }

        try
        {
            var loadedEntity = await ApplyIncludes(_repository.GetQueryable().AsNoTracking())
                .FirstOrDefaultAsync(x => x.PenaltyRuleId == entity.PenaltyRuleId, cancellationToken) ?? entity;
            var dto = _mapper.Map<WaterPenaltyRuleDto>(loadedEntity);
            await ResolveUserNamesAsync(new[] { dto }, cancellationToken);
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fully enrich penalty rule DTO after commit for rule {Id}. Falling back to mapped entity.", entity.PenaltyRuleId);
            return _mapper.Map<WaterPenaltyRuleDto>(entity);
        }
    }

    public override async Task<WaterPenaltyRuleDto?> UpdateAsync(
        long id,
        UpdateWaterPenaltyRuleDto updateDto,
        CancellationToken cancellationToken = default)
    {
        var lockAcquired = await _mutationLock.WaitAsync(MutationLockTimeout, cancellationToken);
        if (!lockAcquired)
        {
            _logger.LogWarning("Mutation lock acquisition timed out for penalty rule update on rule {Id}.", id);
            throw new InvalidOperationException("Failed to acquire penalty rule mutation lock within timeout. Please retry.");
        }
        WaterPenaltyRuleMasterEntity entity;
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var existing = await _repository.GetByIdAsync(id, cancellationToken);
                if (existing == null)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    return null;
                }
                entity = existing;

                if (updateDto.EffectiveFrom.HasValue && (updateDto.EffectiveFrom.Value == default || updateDto.EffectiveFrom.Value == DateTime.MinValue))
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    throw new ValidationException(nameof(updateDto.EffectiveFrom), "EffectiveFrom must be a valid date.", OperationType.Update);
                }

                var existingEffectiveFrom = existing.EffectiveFrom;
                _mapper.Map(updateDto, entity);
                if (!updateDto.EffectiveFrom.HasValue)
                {
                    entity.EffectiveFrom = existingEffectiveFrom;
                }
                entity.UpdatedBy = updateDto.UpdatedBy;
                entity.UpdatedDate = DateTime.UtcNow;

                var validationResult = await _validationService.ValidateRuleAsync(entity, id, cancellationToken);
                if (!validationResult.IsValid)
                {
                    throw new ValidationException("Validation failed for penalty rule update", validationResult.ToDictionary(), OperationType.Update);
                }

                await _repository.UpdateAsync(entity, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
        finally
        {
            _mutationLock.Release();
        }

        try
        {
            var loadedEntity = await ApplyIncludes(_repository.GetQueryable().AsNoTracking())
                .FirstOrDefaultAsync(x => x.PenaltyRuleId == entity.PenaltyRuleId, cancellationToken) ?? entity;
            var dto = _mapper.Map<WaterPenaltyRuleDto>(loadedEntity);
            await ResolveUserNamesAsync(new[] { dto }, cancellationToken);
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fully enrich penalty rule DTO after commit for rule {Id}. Falling back to mapped entity.", entity.PenaltyRuleId);
            return _mapper.Map<WaterPenaltyRuleDto>(entity);
        }
    }

    private async Task ResolveUserNamesAsync(IEnumerable<WaterPenaltyRuleDto> dtos, CancellationToken cancellationToken)
    {
        try
        {
            var list = dtos.ToList();
            if (_userRepository == null || list.Count == 0)
                return;

            var userIds = list
                .Select(d => d.CreatedBy)
                .Concat(list.Select(d => d.UpdatedBy))
                .Where(id => id.HasValue && id.Value > 0)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            if (userIds.Count == 0)
                return;

            var users = await _userRepository.GetQueryable()
                .AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.UserName, u.FirstName, u.LastName })
                .ToListAsync(cancellationToken);

            var userMap = users.ToDictionary(
                u => u.Id,
                u => !string.IsNullOrWhiteSpace(u.UserName)
                    ? u.UserName
                    : string.Join(" ", new[] { u.FirstName, u.LastName }.Where(x => !string.IsNullOrWhiteSpace(x))));

            foreach (var dto in list)
            {
                if (dto.CreatedBy.HasValue && userMap.TryGetValue(dto.CreatedBy.Value, out var cName))
                    dto.CreatedByName = cName;
                if (dto.UpdatedBy.HasValue && userMap.TryGetValue(dto.UpdatedBy.Value, out var uName))
                    dto.UpdatedByName = uName;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve user names for penalty rules");
        }
    }

    public async Task<bool> UpdateStatusAsync(long id, bool isActive, int? updatedBy = null, CancellationToken cancellationToken = default)
    {
        updatedBy ??= GetCurrentUserId();

        var lockAcquired = await _mutationLock.WaitAsync(MutationLockTimeout, cancellationToken);
        if (!lockAcquired)
        {
            _logger.LogWarning("Mutation lock acquisition timed out for penalty rule status update on rule {Id}.", id);
            throw new InvalidOperationException("Failed to acquire penalty rule mutation lock within timeout. Please retry.");
        }
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var entity = await _repository.GetByIdAsync(id, cancellationToken);
                if (entity == null)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    return false;
                }

                if (isActive)
                {
                    entity.IsActive = true;
                    var validationResult = await _validationService.ValidateRuleAsync(entity, id, cancellationToken);
                    if (!validationResult.IsValid)
                    {
                        entity.IsActive = false;
                        throw new ValidationException("Validation failed for penalty rule update", validationResult.ToDictionary(), OperationType.Update);
                    }
                }

                entity.IsActive = isActive;
                if (updatedBy.HasValue && updatedBy.Value > 0)
                {
                    entity.UpdatedBy = updatedBy.Value;
                }
                entity.UpdatedDate = DateTime.UtcNow;

                await _repository.UpdateAsync(entity, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                return true;
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
        finally
        {
            _mutationLock.Release();
        }
    }

    public Task<WaterPenaltyRuleValidationResultDto> ValidateConflictAsync(
        WaterPenaltyRuleValidationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        return _validationService.ValidateConflictAsync(request, cancellationToken);
    }

    /// <summary>
    /// Explicitly deletes (soft-deactivates) the penalty rule using the provided caller user ID for audit tracking.
    /// </summary>
    public async Task<bool> DeleteAsync(long id, int userId, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, isActive: false, updatedBy: userId, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Overrides DeleteAsync to soft-delete (deactivate) the penalty rule rather than physically removing it.
    /// Because WaterPenaltyRuleMasterEntity uses a long key and does not inherit from BaseEntity,
    /// the generic repository fallback would physically delete the entity via _dbSet.Remove,
    /// which permanently erases audit history and breaks billing calculations.
    /// </summary>
    public override async Task<bool> DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        return await UpdateStatusAsync(id, isActive: false, updatedBy: userId, cancellationToken: cancellationToken);
    }

    private int? GetCurrentUserId()
    {
        var user = _httpContextAccessor?.HttpContext?.User;
        if (user == null) return null;

        string[] idClaimTypes = [ClaimTypes.NameIdentifier, "userId", "sub", "id", "uid"];
        foreach (var type in idClaimTypes)
        {
            var value = user.FindFirst(type)?.Value;
            if (!string.IsNullOrEmpty(value) && int.TryParse(value, out var id) && id > 0)
            {
                return id;
            }
        }

        var nameClaim = user.FindFirst(ClaimTypes.Name)?.Value;
        if (!string.IsNullOrEmpty(nameClaim) && int.TryParse(nameClaim, out var nameId) && nameId > 0)
        {
            return nameId;
        }

        return null;
    }
}
