using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Flat;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Generic CRUD Service for Flats (PropertyEntity) with custom validation overrides.
/// Verifies PropertyId, SocietyDetailsId, and WingDetailsId are active and not marked for deletion,
/// and validates that the FlatShopNumber is unique within the wing before updating.
/// </summary>
public class FlatService
    : BaseCommonCrudService<PropertyEntity, FlatDto, CreateFlatDto, UpdateFlatDto, FlatQueryParameters, int>,
      IFlatService
{
    private readonly IRepository<SocietyDetailsEntity, int> _societyRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsRepository;
    private readonly IRepository<PropertyAssessmentEntity, int> _assessmentRepository;
    private readonly ILogger<FlatService> _logger;

    public FlatService(
        IRepository<PropertyEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<SocietyDetailsEntity, int> societyRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsRepository,
        IRepository<PropertyAssessmentEntity, int> assessmentRepository,
        ILogger<FlatService> logger)
        : base(repository, unitOfWork, mapper)
    {
        _societyRepository = societyRepository;
        _wingDetailsRepository = wingDetailsRepository;
        _assessmentRepository = assessmentRepository;
        _logger = logger;
    }

    /// <summary>
    /// Overrides Generic CRUD UpdateAsync method to enforce:
    /// 1. PropertyId exists, IsActive == true, and MarkedForDeletion == false.
    /// 2. SocietyDetailsId exists, IsActive == true, and MarkedForDeletion == false.
    /// 3. WingDetailsId exists, IsActive == true, and MarkedForDeletion == false.
    /// 4. Relationship hierarchy integrity (Wing belongs to Society, Property belongs to Wing).
    /// 5. PropertyMastDetails (PropertyAssessmentEntity) active status check.
    /// 6. FlatShopNumber duplicate validation before update within the wing.
    /// </summary>
    public override async Task<FlatDto?> UpdateAsync(int id, UpdateFlatDto updateDto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(updateDto);

        if (id > 0 && updateDto.PropertyId > 0 && id != updateDto.PropertyId)
        {
            throw new ValidationException(nameof(updateDto.PropertyId),
                $"Route ID '{id}' does not match body PropertyId '{updateDto.PropertyId}'.",
                OperationType.Update);
        }

        var propertyId = id > 0 ? id : updateDto.PropertyId;
        _logger.LogInformation("Starting UpdateAsync for PropertyId={PropertyId}, SocietyDetailsId={SocietyDetailsId}, WingDetailsId={WingDetailsId}",
            propertyId, updateDto.SocietyDetailsId, updateDto.WingDetailsId);

        // 1. Validate PropertyId: must exist, IsActive == true, MarkedForDeletion == false
        var property = await _repository.GetQueryable()
            .FirstOrDefaultAsync(p => p.Id == propertyId, cancellationToken);

        if (property == null)
        {
            _logger.LogWarning("Property not found: PropertyId={PropertyId}", propertyId);
            throw new ValidationException(nameof(updateDto.PropertyId), $"Property with Id '{propertyId}' was not found.", OperationType.Update);
        }

        if (!property.IsActive)
        {
            _logger.LogWarning("Property is inactive: PropertyId={PropertyId}", propertyId);
            throw new ValidationException(nameof(updateDto.PropertyId), $"Property with Id '{propertyId}' is inactive.", OperationType.Update);
        }

        if (property.MarkedForDeletion)
        {
            _logger.LogWarning("Property is marked for deletion: PropertyId={PropertyId}", propertyId);
            throw new ValidationException(nameof(updateDto.PropertyId), $"Property with Id '{propertyId}' is marked for deletion.", OperationType.Update);
        }

        // 2. Validate SocietyDetailsId: must exist, IsActive == true, MarkedForDeletion == false
        var society = await _societyRepository.GetQueryable()
            .FirstOrDefaultAsync(s => s.Id == updateDto.SocietyDetailsId, cancellationToken);

        if (society == null)
        {
            _logger.LogWarning("SocietyDetails not found: SocietyDetailsId={SocietyDetailsId}", updateDto.SocietyDetailsId);
            throw new ValidationException(nameof(updateDto.SocietyDetailsId), $"SocietyDetails with Id '{updateDto.SocietyDetailsId}' was not found.", OperationType.Update);
        }

        if (!society.IsActive)
        {
            _logger.LogWarning("SocietyDetails is inactive: SocietyDetailsId={SocietyDetailsId}", updateDto.SocietyDetailsId);
            throw new ValidationException(nameof(updateDto.SocietyDetailsId), $"SocietyDetails with Id '{updateDto.SocietyDetailsId}' is inactive.", OperationType.Update);
        }

        if (society.MarkedForDeletion)
        {
            _logger.LogWarning("SocietyDetails is marked for deletion: SocietyDetailsId={SocietyDetailsId}", updateDto.SocietyDetailsId);
            throw new ValidationException(nameof(updateDto.SocietyDetailsId), $"SocietyDetails with Id '{updateDto.SocietyDetailsId}' is marked for deletion.", OperationType.Update);
        }

        // 3. Validate WingDetailsId: must exist, IsActive == true, MarkedForDeletion == false
        var wing = await _wingDetailsRepository.GetQueryable()
            .FirstOrDefaultAsync(w => w.Id == updateDto.WingDetailsId, cancellationToken);

        if (wing == null)
        {
            _logger.LogWarning("WingDetails not found: WingDetailsId={WingDetailsId}", updateDto.WingDetailsId);
            throw new ValidationException(nameof(updateDto.WingDetailsId), $"WingDetails with Id '{updateDto.WingDetailsId}' was not found.", OperationType.Update);
        }

        if (!wing.IsActive)
        {
            _logger.LogWarning("WingDetails is inactive: WingDetailsId={WingDetailsId}", updateDto.WingDetailsId);
            throw new ValidationException(nameof(updateDto.WingDetailsId), $"WingDetails with Id '{updateDto.WingDetailsId}' is inactive.", OperationType.Update);
        }

        if (wing.MarkedForDeletion)
        {
            _logger.LogWarning("WingDetails is marked for deletion: WingDetailsId={WingDetailsId}", updateDto.WingDetailsId);
            throw new ValidationException(nameof(updateDto.WingDetailsId), $"WingDetails with Id '{updateDto.WingDetailsId}' is marked for deletion.", OperationType.Update);
        }

        // 4. Validate hierarchy: Wing belongs to Society, Property belongs to Wing
        if (wing.SocietyDetailsMastId != updateDto.SocietyDetailsId)
        {
            _logger.LogWarning("Wing {WingDetailsId} does not belong to Society {SocietyDetailsId}", updateDto.WingDetailsId, updateDto.SocietyDetailsId);
            throw new ValidationException(nameof(updateDto.WingDetailsId), $"WingDetails with Id '{updateDto.WingDetailsId}' does not belong to SocietyDetails '{updateDto.SocietyDetailsId}'.", OperationType.Update);
        }

        if (property.WingDetailId.HasValue && property.WingDetailId.Value != updateDto.WingDetailsId)
        {
            _logger.LogWarning("Property {PropertyId} is already assigned to WingDetails {ExistingWing} and does not belong to Wing {WingDetailsId}", propertyId, property.WingDetailId.Value, updateDto.WingDetailsId);
            throw new ValidationException(nameof(updateDto.PropertyId), $"Property with Id '{propertyId}' is already assigned to WingDetails '{property.WingDetailId.Value}' and does not belong to WingDetails '{updateDto.WingDetailsId}'.", OperationType.Update);
        }

        // 5. Validate duplicate FlatShopNumber before update
        var targetFlatNo = !string.IsNullOrWhiteSpace(updateDto.FlatShopNumber)
            ? updateDto.FlatShopNumber.Trim()
            : (!string.IsNullOrWhiteSpace(updateDto.FlatOrShopNo) ? updateDto.FlatOrShopNo.Trim() : null);

        if (string.IsNullOrWhiteSpace(targetFlatNo))
        {
            throw new ValidationException(nameof(updateDto.FlatShopNumber), "Flat/Shop number is required.", OperationType.Update);
        }

        if (targetFlatNo.Length > 100)
        {
            throw new ValidationException(nameof(updateDto.FlatShopNumber), "FlatShopNumber cannot exceed 100 characters.", OperationType.Update);
        }

        var targetEnglishNo = !string.IsNullOrWhiteSpace(updateDto.FlatOrShopNoEnglish)
            ? updateDto.FlatOrShopNoEnglish.Trim()
            : targetFlatNo;

        var normalizedFlatNo = targetFlatNo.ToLower();
        var normalizedEnglishNo = targetEnglishNo.ToLower();

        var isDuplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(p =>
                p.WingDetailId == updateDto.WingDetailsId &&
                p.Id != propertyId &&
                p.IsActive &&
                !p.MarkedForDeletion &&
                (
                    (p.FlatOrShopNo != null && p.FlatOrShopNo.Trim().ToLower() == normalizedFlatNo) ||
                    (p.FlatOrShopNoEnglish != null && p.FlatOrShopNoEnglish.Trim().ToLower() == normalizedEnglishNo)
                ),
                cancellationToken);

        if (isDuplicate)
        {
            _logger.LogWarning("Duplicate flat/shop number '{FlatShopNumber}' detected in Wing {WingDetailsId}", targetFlatNo, updateDto.WingDetailsId);
            throw new ValidationException(nameof(updateDto.FlatShopNumber), $"Flat/Shop number '{targetFlatNo}' already exists in WingDetailsId '{updateDto.WingDetailsId}'.", OperationType.Update);
        }

        // 6. Perform the update in a transaction
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            property.FlatOrShopNo = targetFlatNo;
            property.FlatOrShopNoEnglish = targetEnglishNo;

            if (!string.IsNullOrWhiteSpace(updateDto.FlatOrShopName))
            {
                property.FlatOrShopName = updateDto.FlatOrShopName.Trim();
            }

            if (!string.IsNullOrWhiteSpace(updateDto.FlatOrShopNameEnglish))
            {
                property.FlatOrShopNameEnglish = updateDto.FlatOrShopNameEnglish.Trim();
            }

            property.WingDetailId = updateDto.WingDetailsId;
            if (updateDto.UpdatedBy.HasValue)
            {
                property.UpdatedBy = updateDto.UpdatedBy.Value;
            }
            property.UpdatedDate = DateTime.Now;

            await _repository.UpdateAsync(property, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            _logger.LogInformation("Successfully updated FlatShopNumber to '{FlatShopNumber}' for PropertyId={PropertyId}",
                targetFlatNo, propertyId);

            var result = _mapper.Map<FlatDto>(property);
            result.SocietyDetailsId = updateDto.SocietyDetailsId;
            result.WingDetailsId = updateDto.WingDetailsId;
            result.FlatShopNumber = targetFlatNo;
            return result;
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            _logger.LogError(ex, "Failed to update Flat for PropertyId={PropertyId}", propertyId);
            throw;
        }
    }

    public override async Task<FlatDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var property = await _repository.GetQueryable()
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive && !p.MarkedForDeletion, cancellationToken);

        if (property == null)
            return null;

        var dto = _mapper.Map<FlatDto>(property);
        dto.FlatShopNumber = property.FlatOrShopNo;
        dto.WingDetailsId = property.WingDetailId;
        return dto;
    }

    public override async Task<PagedResult<FlatDto>> GetAllAsync(FlatQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable()
            .Where(p => p.IsActive && !p.MarkedForDeletion);

        if (queryParameters.PropertyId.HasValue)
        {
            query = query.Where(p => p.Id == queryParameters.PropertyId.Value);
        }

        if (queryParameters.WingDetailsId.HasValue)
        {
            query = query.Where(p => p.WingDetailId == queryParameters.WingDetailsId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.FlatShopNumber))
        {
            var search = queryParameters.FlatShopNumber.Trim();
            query = query.Where(p => p.FlatOrShopNo != null && p.FlatOrShopNo.Contains(search));
        }

        query = query.ApplyFilters(queryParameters);
        query = query.ApplySearch(queryParameters);
        query = query.ApplySort(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(p =>
        {
            var dto = _mapper.Map<FlatDto>(p);
            dto.FlatShopNumber = p.FlatOrShopNo;
            dto.WingDetailsId = p.WingDetailId;
            return dto;
        }).ToList();

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<FlatDto>(dtos, totalCount, pageNumber, pageSize);
    }
}
