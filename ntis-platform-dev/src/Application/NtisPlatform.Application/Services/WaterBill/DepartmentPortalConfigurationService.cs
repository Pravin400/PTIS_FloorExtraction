using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.WaterBill;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill;

/// <summary>
/// Service implementation for DepartmentPortalConfiguration CRUD operations and business rules.
/// </summary>
public class DepartmentPortalConfigurationService
    : BaseCommonCrudService<DepartmentPortalConfigurationEntity, DepartmentPortalConfigurationDto, CreateDepartmentPortalConfigurationDto, UpdateDepartmentPortalConfigurationDto, DepartmentPortalConfigurationQueryParameters, int>,
      IDepartmentPortalConfigurationService
{
    private readonly IRepository<DepartmentMasterEntity, int> _departmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public DepartmentPortalConfigurationService(
        IRepository<DepartmentPortalConfigurationEntity, int> repository,
        IRepository<DepartmentMasterEntity, int> departmentRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _departmentRepository = departmentRepository;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Gets active portal configuration by DepartmentId for citizen/department runtime portal lookup.
    /// Only active configurations are returned.
    /// </summary>
    public async Task<DepartmentPortalConfigurationDto?> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default)
    {
        if (departmentId <= 0)
            return null;

        var department = await _departmentRepository.GetByIdAsync(departmentId, cancellationToken);
        if (department == null || !department.IsActive)
            return null;

        var entity = await _repository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(x => x.DepartmentId == departmentId && x.IsActive, cancellationToken);

        return entity == null ? null : _mapper.Map<DepartmentPortalConfigurationDto>(entity);
    }

    /// <summary>
    /// Creates a new department portal configuration with backend-controlled initial version (1)
    /// and server-resolved authenticated user audit identity.
    /// </summary>
    public override async Task<DepartmentPortalConfigurationDto> CreateAsync(
        CreateDepartmentPortalConfigurationDto createDto,
        CancellationToken cancellationToken = default)
    {
        var entity = _mapper.Map<DepartmentPortalConfigurationEntity>(createDto);

        entity.ConfigVersion = 1;
        entity.CreatedBy = _currentUserService.GetCurrentUserId();
        entity.CreatedDate = DateTime.UtcNow;

        var validationResult = await ValidateForCreateAsync(entity, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(
                "Validation failed for create operation",
                validationResult.ToDictionary(),
                OperationType.Create);
        }

        try
        {
            await _repository.AddAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            if (msg.Contains("duplicate", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("unique", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("UQ_", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("2601") || msg.Contains("2627"))
            {
                throw new ValidationException(
                    nameof(createDto.DepartmentId),
                    $"A portal configuration already exists for Department Id {createDto.DepartmentId}.",
                    OperationType.Create);
            }
            throw;
        }

        return _mapper.Map<DepartmentPortalConfigurationDto>(entity);
    }

    /// <summary>
    /// Updates an existing configuration with optimistic concurrency enforcement via ExpectedVersion.
    /// DepartmentId remains immutable. ConfigVersion is auto-incremented upon content modification.
    /// </summary>
    public override async Task<DepartmentPortalConfigurationDto?> UpdateAsync(
        int id,
        UpdateDepartmentPortalConfigurationDto updateDto,
        CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing == null)
            return null;

        // Optimistic concurrency: ensure caller's expected version matches current storage version
        if (existing.ConfigVersion != updateDto.ExpectedVersion)
        {
            throw new ValidationException(
                nameof(updateDto.ExpectedVersion),
                $"Concurrency conflict: The configuration has been modified by another process. Expected version was {updateDto.ExpectedVersion}, but current version is {existing.ConfigVersion}.",
                OperationType.Update);
        }

        // Validate that the referenced Department exists and is still active
        var department = await _departmentRepository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == existing.DepartmentId, cancellationToken);
        if (department == null)
        {
            throw new ValidationException(
                "DepartmentId",
                $"Department with Id {existing.DepartmentId} does not exist.",
                OperationType.Update);
        }
        if (!department.IsActive)
        {
            throw new ValidationException(
                "DepartmentId",
                $"Department with Id {existing.DepartmentId} is inactive and cannot be updated.",
                OperationType.Update);
        }

        // Validate JSON content
        var jsonValidation = ValidateConfigJson(updateDto.ConfigJson);
        if (!jsonValidation.IsValid)
        {
            var firstError = jsonValidation.Errors.FirstOrDefault()?.ErrorMessage ?? "Invalid JSON configuration.";
            throw new ValidationException("ConfigJson", firstError, OperationType.Update);
        }

        // Apply mutations (DepartmentId is immutable and never changed)
        existing.ConfigJson = updateDto.ConfigJson;
        existing.IsActive = updateDto.IsActive;
        existing.ConfigVersion += 1;
        existing.UpdatedBy = _currentUserService.GetCurrentUserId();
        existing.UpdatedDate = DateTime.UtcNow;

        try
        {
            await _repository.UpdateAsync(existing, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ValidationException(
                nameof(updateDto.ExpectedVersion),
                "Concurrency conflict: The configuration was modified concurrently by another process.",
                OperationType.Update);
        }

        return _mapper.Map<DepartmentPortalConfigurationDto>(existing);
    }

    /// <summary>
    /// Toggles active status of the portal configuration and advances ConfigVersion for concurrency tracking.
    /// Audit identity is resolved server-side from ICurrentUserService.
    /// </summary>
    public async Task<bool> SetActiveStatusAsync(int id, bool isActive, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing == null)
            return false;

        if (existing.IsActive == isActive)
            return true;

        if (isActive)
        {
            var dept = await _departmentRepository.GetByIdAsync(existing.DepartmentId, cancellationToken);
            if (dept == null || !dept.IsActive)
            {
                throw new ValidationException(
                    nameof(existing.DepartmentId),
                    $"Cannot activate configuration because Department with Id {existing.DepartmentId} is inactive or does not exist.",
                    OperationType.Update);
            }
        }

        existing.IsActive = isActive;
        existing.ConfigVersion += 1;
        existing.UpdatedBy = _currentUserService.GetCurrentUserId();
        existing.UpdatedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(existing, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// Validates business rules prior to entity creation.
    /// </summary>
    protected override async Task<ValidationResult> ValidateForCreateAsync(
        DepartmentPortalConfigurationEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (entity.DepartmentId <= 0)
        {
            return ValidationResult.Failure(nameof(entity.DepartmentId), "DepartmentId must be greater than zero.");
        }

        var department = await _departmentRepository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == entity.DepartmentId, cancellationToken);
        if (department == null)
        {
            return ValidationResult.Failure(nameof(entity.DepartmentId), $"Department with Id {entity.DepartmentId} does not exist.");
        }
        if (!department.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.DepartmentId), $"Department with Id {entity.DepartmentId} is inactive and cannot be configured.");
        }

        var isDuplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.DepartmentId == entity.DepartmentId, cancellationToken);
        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(entity.DepartmentId), $"A portal configuration already exists for Department Id {entity.DepartmentId}.");
        }

        var jsonValidation = ValidateConfigJson(entity.ConfigJson);
        if (!jsonValidation.IsValid)
        {
            return jsonValidation;
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validates JSON structure, syntax, and payload constraints.
    /// Returns a stable business-safe error message on parse failures.
    /// </summary>
    private static ValidationResult ValidateConfigJson(string? configJson)
    {
        if (string.IsNullOrWhiteSpace(configJson))
        {
            return ValidationResult.Failure("ConfigJson", "ConfigJson cannot be null or empty.");
        }

        if (configJson.Length > 2 * 1024 * 1024)
        {
            return ValidationResult.Failure("ConfigJson", "ConfigJson exceeds the maximum allowed size (2MB).");
        }

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return ValidationResult.Failure("ConfigJson", "ConfigJson must be a valid JSON object.");
            }
        }
        catch (JsonException)
        {
            return ValidationResult.Failure("ConfigJson", "ConfigJson contains malformed or invalid JSON.");
        }

        return ValidationResult.Success();
    }
}
