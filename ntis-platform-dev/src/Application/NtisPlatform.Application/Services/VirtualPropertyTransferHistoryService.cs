using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.VirtualPropertyTransferHistory;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Service implementing virtual property transfer operations.
/// <para>
/// Supports both self-ward (same ward) and cross-ward (different ward) transfers.
/// Manages property prefix conventions ("VP"), <c>IsVirtualProperty</c> state transitions,
/// and comprehensive wing/society resolution across both <c>PTIS</c> (<see cref="WingDetailsMastEntity"/>, <see cref="SocietyDetailsEntity"/>)
/// and <c>GSMS</c> (<see cref="SocietyWingDetailsEntity"/>) schemas.
/// </para>
/// <para>
/// Features include:
/// <list type="bullet">
/// <item><description>Pre-emptive partition collision detection preventing database unique constraint violations.</description></item>
/// <item><description>Automatic category upgrade (e.g., Individual to Apartment) with preservation of amenity utility categories.</description></item>
/// <item><description>Deep resolution and backfilling of society metadata from sub-properties, wings, or master records.</description></item>
/// <item><description>Automatic deactivation of source virtual master properties when all sub-properties have been transferred.</description></item>
/// <item><description>Distributed concurrency locking via <see cref="PerPropertyGate"/> to prevent race conditions during transfers.</description></item>
/// </list>
/// </para>
/// </summary>
public class VirtualPropertyTransferHistoryService : BaseCommonCrudService<VirtualPropertyTransferHistoryEntity, VirtualPropertyTransferHistoryDto, CreateVirtualPropertyTransferHistoryDto, UpdateVirtualPropertyTransferHistoryDto, VirtualPropertyTransferHistoryQueryParameters, int>, IVirtualPropertyTransferHistoryService
{
    private readonly IRepository<PropertyEntity, int> _propertyMast;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<PropertyCategoryEntity, int>? _propertycategory;
    private readonly IRepository<SocietyWingDetailsEntity, int> _societyWingDetailsRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsMastRepository;
    private readonly IRepository<SocietyDetailsEntity, int> _societyDetailsRepository;
    private readonly IRepository<WingEntity, int>? _wingMasterRepository;

    public VirtualPropertyTransferHistoryService(
        IRepository<VirtualPropertyTransferHistoryEntity, int> repository,
        IRepository<PropertyEntity, int> propertyMast,
        IRepository<WardEntity, int> wardRepository,
        IRepository<PropertyCategoryEntity, int>? propertycategory,
        IRepository<SocietyWingDetailsEntity, int> societyWingDetailsRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsMastRepository,
        IRepository<SocietyDetailsEntity, int> societyDetailsRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<WingEntity, int>? wingMasterRepository = null) : base(repository, unitOfWork, mapper)
    {
        _propertyMast = propertyMast;
        _wardRepository = wardRepository;
        _propertycategory = propertycategory;
        _societyWingDetailsRepository = societyWingDetailsRepository;
        _wingDetailsMastRepository = wingDetailsMastRepository;
        _societyDetailsRepository = societyDetailsRepository;
        _wingMasterRepository = wingMasterRepository;
    }

    /// <summary>
    /// Creates and executes a single virtual property transfer operation.
    /// </summary>
    /// <param name="createDto">Transfer input parameters containing source and target property details.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>A <see cref="VirtualPropertyTransferHistoryDto"/> containing the completed transfer record.</returns>
    public override async Task<VirtualPropertyTransferHistoryDto> CreateAsync(CreateVirtualPropertyTransferHistoryDto createDto, CancellationToken cancellationToken = default)
    {
        return await ProcessTransferAsync(createDto, cancellationToken);
    }

    /// <summary>
    /// Executes a batch of virtual property transfer requests sequentially.
    /// Captures per-item results and aggregate failure details without terminating the entire batch.
    /// </summary>
    /// <param name="request">Batch transfer request containing a list of transfer DTOs.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>An <see cref="ApiResponse{T}"/> containing all processed items and error descriptions if any failed.</returns>
    public async Task<ApiResponse<List<VirtualPropertyTransferHistoryDto>>> BatchTransferAsync(BatchTransferRequestDto request, CancellationToken cancellationToken = default)
    {
        if (request?.Items == null || request.Items.Count == 0)
        {
            return new ApiResponse<List<VirtualPropertyTransferHistoryDto>>
            {
                Success = false,
                Message = "No items provided for batch transfer.",
                Items = new List<VirtualPropertyTransferHistoryDto>(),
                Errors = new List<string> { "Batch request must contain at least one item." }
            };
        }

        var response = new ApiResponse<List<VirtualPropertyTransferHistoryDto>>
        {
            Success = true,
            Items = new List<VirtualPropertyTransferHistoryDto>(),
            Errors = new List<string>()
        };

        foreach (var item in request.Items)
        {
            try
            {
                var result = await ProcessTransferAsync(item, cancellationToken);
                response.Items.Add(result);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                response.Errors.Add($"{item.WardId}-{item.PropertyNo}: {ex.Message}");
            }
        }

        response.Success = response.Errors.Count == 0;
        if (response.Success)
        {
            response.Message = "All transfers successful.";
            response.Errors = null;
        }
        else
        {
            response.Message = response.Items.Count > 0
                ? $"Batch transfer partially completed: {response.Items.Count} succeeded, {response.Errors.Count} failed."
                : "All transfers failed.";
        }

        return response;
    }

    /// <summary>
    /// Retrieves paginated virtual property transfer history based on search filters (WardId, PropertyNo, PartitionNo).
    /// </summary>
    /// <param name="request">Filter criteria including ward, property number, partition number, and pagination.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>An <see cref="ApiResponse{T}"/> containing the list of matching transfer history records.</returns>
    public async Task<ApiResponse<List<VirtualPropertyTransferHistoryDto>>> GetHistoryAsync(
        GetVirtualPropertyTransferHistoryRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking().Where(h => h.IsActive);

        if (request != null)
        {
            if (request.WardId.HasValue && !string.IsNullOrWhiteSpace(request.PropertyNo))
            {
                var trimmedPropertyNo = request.PropertyNo.Trim();
                int wardId = request.WardId.Value;
                query = query.Where(h =>
                    (h.WardId == wardId && h.PropertyNo == trimmedPropertyNo) ||
                    (h.TransferredWardId == wardId && h.TransferredPropertyNo == trimmedPropertyNo));
            }
            else if (request.WardId.HasValue)
            {
                int wardId = request.WardId.Value;
                query = query.Where(h => h.WardId == wardId || h.TransferredWardId == wardId);
            }
            else if (!string.IsNullOrWhiteSpace(request.PropertyNo))
            {
                var trimmedPropertyNo = request.PropertyNo.Trim();
                query = query.Where(h => h.PropertyNo == trimmedPropertyNo || h.TransferredPropertyNo == trimmedPropertyNo);
            }

            if (!string.IsNullOrWhiteSpace(request.PartitionNo))
            {
                var trimmedPartitionNo = request.PartitionNo.Trim();
                query = query.Where(h => h.PartitionNo == trimmedPartitionNo);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var orderedQuery = query
            .OrderByDescending(h => h.CreatedDate ?? DateTime.MinValue)
            .ThenByDescending(h => h.Id);

        List<VirtualPropertyTransferHistoryEntity> entities;
        if (request?.PageNumber.HasValue == true || request?.PageSize.HasValue == true)
        {
            var page = request?.PageNumber.GetValueOrDefault(1) ?? 1;
            if (page < 1) page = 1;

            var size = request?.PageSize.GetValueOrDefault(10) ?? 10;
            if (size < 1) size = 10;

            entities = await orderedQuery
                .Skip((page - 1) * size)
                .Take(size)
                .ToListAsync(cancellationToken);
        }
        else
        {
            entities = await orderedQuery.ToListAsync(cancellationToken);
        }

        var dtos = _mapper.Map<List<VirtualPropertyTransferHistoryDto>>(entities) ?? new List<VirtualPropertyTransferHistoryDto>();

        return new ApiResponse<List<VirtualPropertyTransferHistoryDto>>
        {
            Success = true,
            Message = "Virtual property transfer history retrieved successfully.",
            Items = dtos,
            TotalCount = totalCount
        };
    }

    /// <summary>
    /// Coordinates the full lifecycle of a virtual property transfer workflow.
    /// <para>
    /// Workflow Execution Pipeline:
    /// <list type="number">
    /// <item><description>Step 1: Validate input parameters (self-ward vs cross-ward constraints).</description></item>
    /// <item><description>Step 2: Fetch source master property &amp; resolve all active sub-properties/amenities.</description></item>
    /// <item><description>Step 3: Validate and resolve the target master property and target ward.</description></item>
    /// <item><description>Step 4: Pre-emptively detect partition collisions against existing target sub-properties.</description></item>
    /// <item><description>Step 5: Acquire ordered per-property concurrency locks (<see cref="PerPropertyGate"/>) to eliminate race conditions.</description></item>
    /// <item><description>Step 6: Upgrade target master property to Apartment category if currently Individual.</description></item>
    /// <item><description>Step 7: Re-link or generate wings and societies (handles full property transfers and wing-specific transfers).</description></item>
    /// <item><description>Step 8: Update sub-properties with new WardId, PropertyNo, SequenceNo, UPIC, and preserve amenity categories.</description></item>
    /// <item><description>Step 9: Deactivate source master property if 0 sub-properties remain active.</description></item>
    /// <item><description>Step 10: Create audit transfer history record and commit transaction.</description></item>
    /// </list>
    /// </para>
    /// </summary>
    /// <param name="item">Input DTO describing the transfer request.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>A mapped <see cref="VirtualPropertyTransferHistoryDto"/> representing the transfer log.</returns>
    /// <exception cref="ValidationException">Thrown if any validation check fails.</exception>
    private async Task<VirtualPropertyTransferHistoryDto> ProcessTransferAsync(CreateVirtualPropertyTransferHistoryDto item, CancellationToken cancellationToken)
    {
        // -------------------------------------------------------------------------
        // Step 1: Input Validation (Handles self-ward and cross-ward)
        // -------------------------------------------------------------------------
        ValidateInput(item);

        // -------------------------------------------------------------------------
        // Step 2: Source Ward, Master Property, & Sub-properties resolution
        // -------------------------------------------------------------------------
        var (sourceMasterProperty, subProperties) = await FetchSourceDataAsync(item, cancellationToken);

        // -------------------------------------------------------------------------
        // Step 3: Target Master Property & Target Ward resolution
        // -------------------------------------------------------------------------
        var (targetMasterProperty, transferredWard) = await ValidateTargetAsync(item, cancellationToken);

        // -------------------------------------------------------------------------
        // Step 4: Pre-emptive Partition Collision Validation
        // Prevents database UX_PropertyMast_ActiveProperty unique constraint violation.
        // -------------------------------------------------------------------------
        var internalDuplicates = subProperties
            .Where(p => !string.IsNullOrEmpty(p.PartitionNo))
            .GroupBy(p => p.PartitionNo!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (internalDuplicates.Count > 0)
        {
            throw new ValidationException(
                $"Source property contains duplicate sub-properties with partition number(s): {string.Join(", ", internalDuplicates)}.",
                OperationType.Create);
        }

        // -------------------------------------------------------------------------
        // Step 5: Distributed Concurrency Locking
        // Sort IDs deterministically to prevent deadlocks across concurrent requests.
        // -------------------------------------------------------------------------
        var firstId = Math.Min(sourceMasterProperty.Id, targetMasterProperty.Id);
        var secondId = Math.Max(sourceMasterProperty.Id, targetMasterProperty.Id);
        using var firstLock = await PerPropertyGate.EnterAsync(firstId, cancellationToken);
        using var secondLock = firstId != secondId ? await PerPropertyGate.EnterAsync(secondId, cancellationToken) : null;

        // -------------------------------------------------------------------------
        // Step 6: Begin Database Transaction & Check Idempotency & Partition Collision
        // -------------------------------------------------------------------------
        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            // Idempotency check INSIDE transaction
            var existingTransfer = await _repository.GetQueryable()
                .FirstOrDefaultAsync(h => h.WardId == item.WardId
                    && (h.PropertyNo == item.PropertyNo || h.PropertyNo == sourceMasterProperty.PropertyNo)
                    && h.TransferredWardId == item.TransferredWardId
                    && (h.TransferredPropertyNo == item.TransferredPropertyNo || h.TransferredPropertyNo == targetMasterProperty.PropertyNo),
                    cancellationToken);

            if (existingTransfer != null)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return _mapper.Map<VirtualPropertyTransferHistoryDto>(existingTransfer);
            }

            // Pre-emptive partition collision check INSIDE concurrency lock
            var incomingPartitions = subProperties
                .Where(p => !string.IsNullOrEmpty(p.PartitionNo))
                .Select(p => p.PartitionNo!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (incomingPartitions.Count > 0)
            {
                var targetPropNo = targetMasterProperty.PropertyNo ?? item.TransferredPropertyNo.Trim();
                var conflictingPartitions = await _propertyMast.GetQueryable().AsNoTracking()
                    .Where(p => p.WardId == item.TransferredWardId
                        && p.PropertyNo == targetPropNo
                        && !string.IsNullOrEmpty(p.PartitionNo)
                        && incomingPartitions.Contains(p.PartitionNo.Trim())
                        && p.IsActive
                        && !p.MarkedForDeletion)
                    .Select(p => p.PartitionNo!.Trim())
                    .ToListAsync(cancellationToken);

                if (conflictingPartitions.Count > 0)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    throw new ValidationException(
                        $"Cannot transfer: Target property already contains sub-properties with partition number(s): {string.Join(", ", conflictingPartitions.Distinct(StringComparer.OrdinalIgnoreCase))}.",
                        OperationType.Create);
                }
            }

            var sequenceNo = targetMasterProperty.PropertySeqNo;

            List<int> relinkedWingDetailIds;
            List<int> relinkedSocietyDetailIds;

            // -------------------------------------------------------------------------
            // Step 7: Resolve Property Category (Upgrade Individual -> Apartment)
            // -------------------------------------------------------------------------
            int? apartmentCategoryId = null;
            bool isTargetAlreadyApartment = false;
            bool isTargetIndividual = false;

            if (_propertycategory != null)
            {
                var categories = await _propertycategory.GetQueryable().AsNoTracking()
                    .Where(c => c.IsActive)
                    .ToListAsync(cancellationToken);

                var apartmentCat = categories.FirstOrDefault(c => string.Equals(c.PropertyCategoryName, "Apartment", StringComparison.OrdinalIgnoreCase))
                    ?? categories.FirstOrDefault(c => PropertyCategoryConstants.ApartmentCategoryNames.Contains(c.PropertyCategoryName, StringComparer.OrdinalIgnoreCase));

                apartmentCategoryId = apartmentCat?.Id;

                if (targetMasterProperty.CategoryId.HasValue)
                {
                    var targetCat = categories.FirstOrDefault(c => c.Id == targetMasterProperty.CategoryId.Value);
                    if (targetCat != null)
                    {
                        isTargetAlreadyApartment = PropertyCategoryConstants.ApartmentCategoryNames.Contains(targetCat.PropertyCategoryName, StringComparer.OrdinalIgnoreCase);
                        isTargetIndividual = PropertyCategoryConstants.IndividualCategoryNames.Contains(targetCat.PropertyCategoryName, StringComparer.OrdinalIgnoreCase);
                    }
                }
            }

            // Restrict upgrade to Individual target categories ONLY when transferring multi-unit sub-properties.
            // A standalone single virtual house transfer (subProperties.Count == 0) remains Individual and is NOT upgraded to Apartment.
            var isStandaloneTransfer = subProperties.Count == 0;

            if (!isStandaloneTransfer && isTargetIndividual && apartmentCategoryId.HasValue)
            {
                targetMasterProperty.CategoryId = apartmentCategoryId.Value;
                targetMasterProperty.UpdatedDate = DateTime.Now;
            }

            var effectiveSubPropertyCategoryId = (!isStandaloneTransfer && isTargetIndividual && apartmentCategoryId.HasValue)
                ? apartmentCategoryId.Value
                : targetMasterProperty.CategoryId;

            // -------------------------------------------------------------------------
            // Step 8: Transfer Sub-Properties & Re-link Wings / Societies
            // -------------------------------------------------------------------------
            if (!isStandaloneTransfer)
            {
                if (item.WingDetailIds is { Count: > 0 })
                {
                    // Wing-specific transfer: check and generate wing on target property according to master wing id
                    var (wingMap, targetWingIds, targetSocIds) = await EnsureTargetWingsAndSocietiesAsync(
                        sourceMasterProperty,
                        subProperties,
                        targetMasterProperty,
                        item.WingDetailIds,
                        item.SocityDetailMastIds,
                        item.CreatedBy,
                        cancellationToken);

                    relinkedWingDetailIds = targetWingIds;
                    relinkedSocietyDetailIds = targetSocIds;

                    // Transfer sub-properties and update their WingDetailId to the target wing
                    TransferSubProperties(subProperties, item, targetMasterProperty, transferredWard, sequenceNo, wingMap, effectiveSubPropertyCategoryId);
                }
                else
                {
                    // Full property transfer: Updates WardId, PropertyNo, PropertySeqNo, IsVirtualProperty, CategoryId, and UPICId
                    TransferSubProperties(subProperties, item, targetMasterProperty, transferredWard, sequenceNo, null, effectiveSubPropertyCategoryId);

                    // Re-link society details and wings from source property to target property
                    var relinkResult = await RelinkWingsAndSocietiesAsync(
                        sourceMasterProperty,
                        subProperties,
                        targetMasterProperty.Id,
                        item.WingDetailIds,
                        item.SocityDetailMastIds,
                        cancellationToken);

                    relinkedWingDetailIds = relinkResult.RelinkedWingDetailIds;
                    relinkedSocietyDetailIds = relinkResult.RelinkedSocietyDetailIds;
                }
            }
            else
            {
                // Standalone single virtual house transfer (no sub-properties / partitions)
                // Direct transfer of standalone virtual house into physical house without upgrading either to Apartment
                relinkedWingDetailIds = new List<int>();
                relinkedSocietyDetailIds = new List<int>();
                targetMasterProperty.UpdatedDate = DateTime.Now;
            }

            // -------------------------------------------------------------------------
            // Step 9: Save Updates & Conditionally Deactivate Source Master Property
            // -------------------------------------------------------------------------
            if (subProperties.Count > 0)
            {
                await _propertyMast.UpdateRangeAsync(subProperties, cancellationToken);
            }
            await _propertyMast.UpdateAsync(targetMasterProperty, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Check if any active sub-properties remain under sourceMasterProperty; if none, deactivate source master
            var remainingSubPropertiesCount = await _propertyMast.GetQueryable().AsNoTracking()
                .CountAsync(p => p.WardId == sourceMasterProperty.WardId
                    && p.PropertyNo == sourceMasterProperty.PropertyNo
                    && !string.IsNullOrEmpty(p.PartitionNo)
                    && p.Id != sourceMasterProperty.Id
                    && p.IsActive
                    && !p.MarkedForDeletion, cancellationToken);

            if (remainingSubPropertiesCount == 0)
            {
                sourceMasterProperty.IsActive = false;
                sourceMasterProperty.UpdatedDate = DateTime.Now;
                await _propertyMast.UpdateAsync(sourceMasterProperty, cancellationToken);
            }

            // -------------------------------------------------------------------------
            // Step 10: Create Transfer History Record & Commit Transaction
            // -------------------------------------------------------------------------
            var historyEntity = new VirtualPropertyTransferHistoryEntity
            {
                PropertyId = sourceMasterProperty.Id,
                WardId = item.WardId,
                PropertyNo = sourceMasterProperty.PropertyNo ?? item.PropertyNo,
                PartitionNo = string.Empty,
                TransferredWardId = item.TransferredWardId,
                TransferredPropertyNo = targetMasterProperty.PropertyNo ?? item.TransferredPropertyNo,
                IsActive = true,
                CreatedBy = item.CreatedBy,
                CreatedDate = DateTime.Now
            };
            await _repository.AddAsync(historyEntity, cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return new VirtualPropertyTransferHistoryDto
            {
                Id = historyEntity.Id,
                PropertyId = historyEntity.PropertyId,
                WardId = item.WardId,
                PropertyNo = historyEntity.PropertyNo ?? string.Empty,
                PartitionNo = historyEntity.PartitionNo,
                TransferredWardId = item.TransferredWardId,
                TransferredPropertyNo = historyEntity.TransferredPropertyNo,
                IsActive = historyEntity.IsActive,
                CreatedBy = historyEntity.CreatedBy,
                CreatedDate = historyEntity.CreatedDate,
                WingDetailIds = relinkedWingDetailIds,
                SocityDetailMastIds = relinkedSocietyDetailIds
            };
        }
        catch (DbUpdateException dbEx)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            if (dbEx.InnerException?.Message.Contains("UX_PropertyMast_ActiveProperty", StringComparison.OrdinalIgnoreCase) == true
                || dbEx.Message.Contains("UX_PropertyMast_ActiveProperty", StringComparison.OrdinalIgnoreCase)
                || dbEx.InnerException?.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) == true
                || dbEx.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException(
                    "Cannot transfer: A partition number conflict occurred on the target property.",
                    OperationType.Create);
            }
            throw;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    #region Step Helpers

    /// <summary>
    /// Step 1: Validates required input parameters and transfer constraints.
    /// Supports self-ward (WardId == TransferredWardId) and cross-ward (WardId != TransferredWardId) transfers.
    /// In a self-ward transfer, PropertyNo and TransferredPropertyNo cannot be identical.
    /// </summary>
    /// <param name="item">Input DTO describing the transfer request.</param>
    /// <exception cref="ValidationException">Thrown if input fails validation constraints.</exception>
    private static void ValidateInput(CreateVirtualPropertyTransferHistoryDto item)
    {
        if (string.IsNullOrWhiteSpace(item.PropertyNo))
            throw new ValidationException("PropertyNo is required.", OperationType.Create);

        if (string.IsNullOrWhiteSpace(item.TransferredPropertyNo))
            throw new ValidationException("TransferredPropertyNo is required.", OperationType.Create);

        if (item.WardId <= 0)
            throw new ValidationException("WardId must be greater than 0.", OperationType.Create);

        if (item.TransferredWardId <= 0)
            throw new ValidationException("TransferredWardId must be greater than 0.", OperationType.Create);

        // Self-ward validation: Cannot transfer to the exact same property number in the same ward
        if (item.WardId == item.TransferredWardId)
        {
            var cleanSource = item.PropertyNo.Trim();
            var cleanTarget = item.TransferredPropertyNo.Trim();

            if (string.Equals(cleanSource, cleanTarget, StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Cannot transfer property to the same property number within the same ward.", OperationType.Create);
            }
        }
    }

    /// <summary>
    /// Step 2: Finds the source master property, validates it is an active virtual main property,
    /// and fetches all corresponding active sub-properties (flats/amenities).
    /// Supports optional filtering by WingDetailIds or SocityDetailMastIds.
    /// </summary>
    /// <param name="item">Transfer request DTO.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>A tuple containing the source master property entity and list of sub-property entities.</returns>
    /// <exception cref="ValidationException">Thrown if ward, property, or sub-properties are invalid or not found.</exception>
    private async Task<(PropertyEntity SourceMaster, List<PropertyEntity> SubProperties)> FetchSourceDataAsync(
        CreateVirtualPropertyTransferHistoryDto item,
        CancellationToken cancellationToken)
    {
        if (!await _wardRepository.ExistsAsync(item.WardId, cancellationToken))
            throw new ValidationException("Given Ward No not found.", OperationType.Create);

        var sourceMaster = await _propertyMast.GetByIdAsync(item.PropertyId, cancellationToken)
            ?? throw new ValidationException($"Property with Id {item.PropertyId} not found.", OperationType.Create);

        if (!sourceMaster.IsActive || sourceMaster.MarkedForDeletion)
            throw new ValidationException($"Property with Id {item.PropertyId} is inactive or marked for deletion.", OperationType.Create);

        if (sourceMaster.WardId != item.WardId)
            throw new ValidationException($"Property with Id {item.PropertyId} does not belong to Ward {item.WardId}.", OperationType.Create);

        if (!string.IsNullOrEmpty(sourceMaster.PartitionNo))
            throw new ValidationException($"Provided PropertyNo : {sourceMaster.PropertyNo}, PartitionNo : {sourceMaster.PartitionNo} is not a Main property.", OperationType.Create);

        // Verify that source property is a virtual property (IsVirtualProperty == true or PropertyNo starts with VP)
        var hasVpPrefix = sourceMaster.PropertyNo?.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase) ?? false;
        var isVirtual = sourceMaster.IsVirtualProperty == true || hasVpPrefix;

        if (!isVirtual)
            throw new ValidationException($"Property {sourceMaster.PropertyNo} is not a Virtual Property.", OperationType.Create);

        // Validate that caller-supplied PropertyNo belongs to sourceMaster
        var cleanPropNo = item.PropertyNo.Trim();
        var sourceMasterPropNo = (sourceMaster.PropertyNo ?? string.Empty).Trim();
        var cleanSourceMasterPropNo = sourceMasterPropNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? sourceMasterPropNo[VirtualPropertyConstants.VirtualPropertyPrefix.Length..]
            : sourceMasterPropNo;

        var prefixedPropNo = cleanPropNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? cleanPropNo
            : $"{VirtualPropertyConstants.VirtualPropertyPrefix}{cleanPropNo}";
        var unPrefixedPropNo = cleanPropNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? cleanPropNo[VirtualPropertyConstants.VirtualPropertyPrefix.Length..]
            : cleanPropNo;

        if (!string.Equals(cleanPropNo, sourceMasterPropNo, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(unPrefixedPropNo, cleanSourceMasterPropNo, StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException(
                $"Property number '{item.PropertyNo}' does not match source master property number '{sourceMaster.PropertyNo}'.",
                OperationType.Create);
        }

        var subQuery = _propertyMast.GetQueryable()
            .Where(p => p.WardId == sourceMaster.WardId
                && p.PropertyNo == sourceMaster.PropertyNo
                && !string.IsNullOrEmpty(p.PartitionNo)
                && p.Id != sourceMaster.Id
                && p.IsActive
                && !p.MarkedForDeletion);

        // Filter by WingDetailIds or SocityDetailMastIds if provided
        if (item.WingDetailIds is { Count: > 0 })
        {
            subQuery = subQuery.Where(p => p.WingDetailId.HasValue && item.WingDetailIds.Contains(p.WingDetailId.Value));
        }
        else if (item.SocityDetailMastIds is { Count: > 0 })
        {
            // Find wing detail IDs that belong to the requested societies
            var wingDetailIdsFromSocieties = await _wingDetailsMastRepository.GetQueryable()
                .Where(w => item.SocityDetailMastIds.Contains(w.SocietyDetailsMastId) && w.IsActive && !w.MarkedForDeletion)
                .Select(w => w.Id)
                .ToListAsync(cancellationToken);

            if (wingDetailIdsFromSocieties.Count > 0)
            {
                subQuery = subQuery.Where(p =>
                    (p.WingDetailId.HasValue && wingDetailIdsFromSocieties.Contains(p.WingDetailId.Value))
                    || (p.WingDetailsMast != null && item.SocityDetailMastIds.Contains(p.WingDetailsMast.SocietyDetailsMastId)));
            }
        }

        var subProperties = await subQuery.ToListAsync(cancellationToken);

        // If wing filters were explicitly specified but no matching sub-properties were found, throw validation error
        if (subProperties.Count == 0 && item.WingDetailIds is { Count: > 0 })
            throw new ValidationException($"{item.WardId}-{item.PropertyNo} Matching Sub-properties Not Found", OperationType.Create);

        return (sourceMaster, subProperties);
    }

    /// <summary>
    /// Step 3: Validates that the target ward exists and resolves the target master property.
    /// Handles prefix matching ("VP" prefix or bare number) and ensures target is not identical to source.
    /// </summary>
    /// <param name="item">Transfer request DTO.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>A tuple containing the validated target master property and ward entity.</returns>
    /// <exception cref="ValidationException">Thrown if target ward or master property is invalid or not found.</exception>
    private async Task<(PropertyEntity TargetMaster, WardEntity TransferredWard)> ValidateTargetAsync(
        CreateVirtualPropertyTransferHistoryDto item,
        CancellationToken cancellationToken)
    {
        var transferredWard = await _wardRepository.GetByIdAsync(item.TransferredWardId, cancellationToken)
            ?? throw new ValidationException("Transferred Ward No not found.", OperationType.Create);

        var cleanTargetNo = item.TransferredPropertyNo.Trim();
        var prefixedTargetNo = cleanTargetNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? cleanTargetNo
            : $"{VirtualPropertyConstants.VirtualPropertyPrefix}{cleanTargetNo}";
        var unPrefixedTargetNo = cleanTargetNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? cleanTargetNo[VirtualPropertyConstants.VirtualPropertyPrefix.Length..]
            : cleanTargetNo;

        var targetMaster = await _propertyMast.GetQueryable()
            .FirstOrDefaultAsync(p => p.WardId == item.TransferredWardId
                && (p.PropertyNo == cleanTargetNo || p.PropertyNo == prefixedTargetNo || p.PropertyNo == unPrefixedTargetNo)
                && string.IsNullOrEmpty(p.PartitionNo)
                && p.IsActive
                && !p.MarkedForDeletion, cancellationToken)
            ?? throw new ValidationException($"Target master property {item.TransferredPropertyNo} not found in ward {item.TransferredWardId}.", OperationType.Create);

        if (targetMaster.Id == item.PropertyId)
            throw new ValidationException("Target property cannot be the same as the source property.", OperationType.Create);

        return (targetMaster, transferredWard);
    }

    /// <summary>
    /// Handles wing-specific transfer operations:
    /// <para>
    /// 1. Resolves or generates the target property's <see cref="SocietyDetailsEntity"/> record,
    ///    backfilling missing fields from the source society if available.
    /// </para>
    /// <para>
    /// 2. For each requested source wing:
    ///    <list type="bullet">
    ///    <item><description>If wing already exists under target society and contains active partitions: throws <see cref="ValidationException"/>.</description></item>
    ///    <item><description>If wing already exists and is empty: reuses the existing target wing.</description></item>
    ///    <item><description>If wing does not exist: creates a new <see cref="WingDetailsMastEntity"/> (PTIS) and <see cref="SocietyWingDetailsEntity"/> (GSMS).</description></item>
    ///    </list>
    /// </para>
    /// </summary>
    /// <param name="sourceMasterProperty">Source master property entity.</param>
    /// <param name="subProperties">All active sub-properties of the source master.</param>
    /// <param name="targetMasterProperty">Target master property entity.</param>
    /// <param name="wingDetailIds">List of specific source wing IDs to transfer.</param>
    /// <param name="requestedSocietyDetailIds">Optional society IDs provided in the request.</param>
    /// <param name="createdBy">User ID performing the transfer.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>A tuple containing the mapping dictionary (sourceWingId -> targetWingId) and lists of target wing and society IDs.</returns>
    private async Task<(Dictionary<int, int> WingMap, List<int> TargetWingDetailIds, List<int> TargetSocietyDetailIds)> EnsureTargetWingsAndSocietiesAsync(
        PropertyEntity sourceMasterProperty,
        List<PropertyEntity> subProperties,
        PropertyEntity targetMasterProperty,
        List<int> wingDetailIds,
        List<int>? requestedSocietyDetailIds,
        int? createdBy,
        CancellationToken cancellationToken)
    {
        var wingMap = new Dictionary<int, int>();
        var targetWingDetailIds = new List<int>();
        var targetSocietyDetailIds = new List<int>();

        // 1. Ensure target property has a SocietyDetailsMast record (reuse existing society if target already has one)
        SocietyDetailsEntity? targetSociety = null;

        if (requestedSocietyDetailIds is { Count: > 0 })
        {
            targetSociety = await _societyDetailsRepository.GetQueryable()
                .FirstOrDefaultAsync(s => requestedSocietyDetailIds.Contains(s.Id) && s.PropertyId == targetMasterProperty.Id && s.IsActive && !s.MarkedForDeletion, cancellationToken);
        }

        if (targetSociety == null)
        {
            targetSociety = await _societyDetailsRepository.GetQueryable()
                .FirstOrDefaultAsync(s => s.PropertyId == targetMasterProperty.Id && s.IsActive && !s.MarkedForDeletion, cancellationToken);
        }

        // Resolve source society for metadata backfill / new society generation
        var allSourcePropIds = subProperties.Select(p => p.Id).Append(sourceMasterProperty.Id).Distinct().ToList();
        var sourceSociety = await _societyDetailsRepository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(s => s.PropertyId.HasValue && allSourcePropIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion, cancellationToken);

        if (sourceSociety == null && wingDetailIds.Count > 0)
        {
            var wingSocId = await _wingDetailsMastRepository.GetQueryable().AsNoTracking()
                .Where(w => wingDetailIds.Contains(w.Id) && w.IsActive && !w.MarkedForDeletion)
                .Select(w => (int?)w.SocietyDetailsMastId)
                .FirstOrDefaultAsync(cancellationToken);

            if (wingSocId.HasValue)
            {
                sourceSociety = await _societyDetailsRepository.GetQueryable().AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == wingSocId.Value, cancellationToken);
            }
        }

        if (targetSociety != null)
        {
            // Backfill missing fields from source society if any exist
            if (sourceSociety != null && BackfillSocietyDetails(targetSociety, sourceSociety))
            {
                targetSociety.UpdatedDate = DateTime.Now;
                await _societyDetailsRepository.UpdateAsync(targetSociety, cancellationToken);
            }
        }
        else
        {
            targetSociety = new SocietyDetailsEntity
            {
                PropertyId = targetMasterProperty.Id,
                SocietyName = sourceSociety?.SocietyName ?? targetMasterProperty.OwnerName ?? targetMasterProperty.PropertyNo,
                SocietyAddress = sourceSociety?.SocietyAddress ?? targetMasterProperty.Address,
                SecretaryName = sourceSociety?.SecretaryName,
                ManagerName = sourceSociety?.ManagerName,
                LandOwnerName = sourceSociety?.LandOwnerName,
                BuilderName = sourceSociety?.BuilderName,
                SocietyNameEnglish = sourceSociety?.SocietyNameEnglish ?? targetMasterProperty.OwnerNameEnglish ?? targetMasterProperty.PropertyNo,
                SocietyAddressEnglish = sourceSociety?.SocietyAddressEnglish ?? targetMasterProperty.AddressEnglish,
                SecretaryNameEnglish = sourceSociety?.SecretaryNameEnglish,
                ManagerNameEnglish = sourceSociety?.ManagerNameEnglish,
                LandOwnerNameEnglish = sourceSociety?.LandOwnerNameEnglish,
                BuilderNameEnglish = sourceSociety?.BuilderNameEnglish,
                ManagerMobileNo = sourceSociety?.ManagerMobileNo,
                ManagerMobileNoRemarkId = sourceSociety?.ManagerMobileNoRemarkId,
                SecretaryMobileNo = sourceSociety?.SecretaryMobileNo,
                SecretaryMobileNoRemarkId = sourceSociety?.SecretaryMobileNoRemarkId,
                BuilderMobileNo = sourceSociety?.BuilderMobileNo,
                BuilderMobileNoRemarkId = sourceSociety?.BuilderMobileNoRemarkId,
                SocietyEmailId = sourceSociety?.SocietyEmailId,
                SecretaryEmailId = sourceSociety?.SecretaryEmailId,
                ManagerEmailId = sourceSociety?.ManagerEmailId,
                IsActive = true,
                CreatedBy = createdBy,
                CreatedDate = DateTime.Now
            };

            await _societyDetailsRepository.AddAsync(targetSociety, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        if (!targetSocietyDetailIds.Contains(targetSociety.Id))
        {
            targetSocietyDetailIds.Add(targetSociety.Id);
        }

        // 2. Process each requested wing
        foreach (var sourceWingDetailId in wingDetailIds)
        {
            var sourceWing = await _wingDetailsMastRepository.GetByIdAsync(sourceWingDetailId, cancellationToken);
            SocietyWingDetailsEntity? sourceSocietyWing = null;

            if (sourceWing == null)
            {
                sourceSocietyWing = await _societyWingDetailsRepository.GetByIdAsync(sourceWingDetailId, cancellationToken)
                    ?? await _societyWingDetailsRepository.GetQueryable()
                        .FirstOrDefaultAsync(w => (w.Id == sourceWingDetailId || w.WingDetailsMastId == sourceWingDetailId) && w.IsActive, cancellationToken);

                if (sourceSocietyWing?.WingDetailsMastId.HasValue == true)
                {
                    sourceWing = await _wingDetailsMastRepository.GetByIdAsync(sourceSocietyWing.WingDetailsMastId.Value, cancellationToken);
                }
            }

            if (sourceWing == null && sourceSocietyWing != null)
            {
                sourceWing = new WingDetailsMastEntity
                {
                    Id = sourceSocietyWing.WingDetailsMastId ?? sourceSocietyWing.Id,
                    SocietyDetailsMastId = sourceSocietyWing.SocietyDetailId ?? targetSociety.Id,
                    WingMasterId = sourceSocietyWing.WingId ?? 0,
                    WingName = sourceSocietyWing.NewWingName ?? sourceSocietyWing.OldWingName,
                    IsActive = true
                };
            }

            if (sourceWing == null)
            {
                sourceWing = await _wingDetailsMastRepository.GetQueryable()
                    .FirstOrDefaultAsync(w => w.Id == sourceWingDetailId && w.IsActive && !w.MarkedForDeletion, cancellationToken);
            }

            if (sourceWing == null)
                throw new ValidationException($"Source wing detail with Id {sourceWingDetailId} not found.", OperationType.Create);

            var wingName = sourceWing.WingName;
            if (string.IsNullOrWhiteSpace(wingName) && _wingMasterRepository != null && sourceWing.WingMasterId > 0)
            {
                var masterWing = await _wingMasterRepository.GetByIdAsync(sourceWing.WingMasterId, cancellationToken);
                if (masterWing != null)
                {
                    wingName = masterWing.WingNo;
                }
            }

            // Check if this wing already exists under target society (by WingMasterId or WingName)
            var existingTargetWing = await _wingDetailsMastRepository.GetQueryable()
                .FirstOrDefaultAsync(w => w.SocietyDetailsMastId == targetSociety.Id
                    && (w.WingMasterId == sourceWing.WingMasterId
                        || (!string.IsNullOrEmpty(wingName) && w.WingName == wingName))
                    && w.IsActive
                    && !w.MarkedForDeletion, cancellationToken);

            if (existingTargetWing == null)
            {
                var existingSocietyWing = await _societyWingDetailsRepository.GetQueryable()
                    .FirstOrDefaultAsync(w => w.PropertyId == targetMasterProperty.Id
                        && w.WingId == sourceWing.WingMasterId
                        && w.IsActive, cancellationToken);

                if (existingSocietyWing?.WingDetailsMastId.HasValue == true)
                {
                    existingTargetWing = await _wingDetailsMastRepository.GetByIdAsync(existingSocietyWing.WingDetailsMastId.Value, cancellationToken);
                }
            }

            if (existingTargetWing != null)
            {
                // Wing exists on target property: check if it already has sub-properties/partitions
                var hasSubProperties = await _propertyMast.GetQueryable()
                    .AsNoTracking()
                    .AnyAsync(p => p.WingDetailId == existingTargetWing.Id
                        && !string.IsNullOrEmpty(p.PartitionNo)
                        && p.IsActive
                        && !p.MarkedForDeletion, cancellationToken);

                if (hasSubProperties)
                {
                    throw new ValidationException(
                        $"Target property wing '{existingTargetWing.WingName ?? wingName}' already has sub-properties/partitions. Transfer not allowed.",
                        OperationType.Create);
                }

                wingMap[sourceWingDetailId] = existingTargetWing.Id;
                if (!targetWingDetailIds.Contains(existingTargetWing.Id))
                {
                    targetWingDetailIds.Add(existingTargetWing.Id);
                }
            }
            else
            {
                // Wing does not exist on target property: generate it first
                var newTargetWing = new WingDetailsMastEntity
                {
                    SocietyDetailsMastId = targetSociety.Id,
                    WingMasterId = sourceWing.WingMasterId,
                    WingName = wingName,
                    SecretaryName = sourceWing.SecretaryName,
                    ManagerName = sourceWing.ManagerName,
                    SecretaryNameEnglish = sourceWing.SecretaryNameEnglish,
                    ManagerNameEnglish = sourceWing.ManagerNameEnglish,
                    SecretaryMobileNo = sourceWing.SecretaryMobileNo,
                    SecretaryMobileNoRemarkId = sourceWing.SecretaryMobileNoRemarkId,
                    ManagerMobileNo = sourceWing.ManagerMobileNo,
                    ManagerMobileNoRemarkId = sourceWing.ManagerMobileNoRemarkId,
                    SecretaryEmailId = sourceWing.SecretaryEmailId,
                    ManagerEmailId = sourceWing.ManagerEmailId,
                    IsActive = true,
                    CreatedBy = createdBy,
                    CreatedDate = DateTime.Now
                };

                await _wingDetailsMastRepository.AddAsync(newTargetWing, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Also create corresponding SocietyWingDetails record
                if (sourceSocietyWing == null)
                {
                    sourceSocietyWing = await _societyWingDetailsRepository.GetQueryable()
                        .FirstOrDefaultAsync(w => (w.WingDetailsMastId == sourceWingDetailId
                            || w.Id == sourceWingDetailId
                            || (w.PropertyId == sourceMasterProperty.Id && w.WingId == sourceWing.WingMasterId))
                            && w.IsActive, cancellationToken);
                }

                var newSocietyWing = new SocietyWingDetailsEntity
                {
                    PropertyId = targetMasterProperty.Id,
                    SocietyDetailId = targetSociety.Id,
                    WingDetailsMastId = newTargetWing.Id,
                    WingId = sourceWing.WingMasterId,
                    FromFloor = sourceSocietyWing?.FromFloor,
                    ToFloor = sourceSocietyWing?.ToFloor,
                    OldWingName = sourceSocietyWing?.OldWingName ?? wingName,
                    NewWingName = sourceSocietyWing?.NewWingName ?? wingName,
                    NoOfFlat = sourceSocietyWing?.NoOfFlat,
                    NoOfShop = sourceSocietyWing?.NoOfShop,
                    NoOfRowHouse = sourceSocietyWing?.NoOfRowHouse,
                    IsActive = true,
                    CreatedBy = createdBy,
                    CreatedDate = DateTime.Now
                };

                await _societyWingDetailsRepository.AddAsync(newSocietyWing, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                wingMap[sourceWingDetailId] = newTargetWing.Id;
                if (!targetWingDetailIds.Contains(newTargetWing.Id))
                {
                    targetWingDetailIds.Add(newTargetWing.Id);
                }
            }
        }

        return (wingMap, targetWingDetailIds, targetSocietyDetailIds);
    }

    /// <summary>
    /// Step 8: Updates sub-properties/amenities with the target property's attributes:
    /// <list type="bullet">
    /// <item><description>Updates <c>WardId</c>, <c>PropertyNo</c>, <c>PropertySeqNo</c>, and <c>IsVirtualProperty</c>.</description></item>
    /// <item><description>Updates <c>WingDetailId</c> to mapped target wing if wing map is provided.</description></item>
    /// <item><description>Applies Apartment category to winged units and individual properties while preserving specific amenity categories.</description></item>
    /// <item><description>Regenerates the canonical <c>UPICId</c> based on new Ward, Property, and Partition numbers.</description></item>
    /// </list>
    /// </summary>
    /// <param name="subProperties">List of sub-properties being transferred.</param>
    /// <param name="item">Transfer request DTO.</param>
    /// <param name="targetMasterProperty">Target master property entity.</param>
    /// <param name="transferredWard">Target ward entity.</param>
    /// <param name="sequenceNo">Target property sequence number.</param>
    /// <param name="sourceToTargetWingMap">Optional mapping of source wing ID to target wing ID.</param>
    /// <param name="apartmentCategoryId">Resolved Apartment category ID.</param>
    private static void TransferSubProperties(
        List<PropertyEntity> subProperties,
        CreateVirtualPropertyTransferHistoryDto item,
        PropertyEntity targetMasterProperty,
        WardEntity transferredWard,
        int? sequenceNo,
        Dictionary<int, int>? sourceToTargetWingMap = null,
        int? apartmentCategoryId = null)
    {
        var targetPropertyNo = targetMasterProperty.PropertyNo ?? item.TransferredPropertyNo.Trim();
        var targetIsVirtual = targetMasterProperty.IsVirtualProperty ?? false;
        var effectiveCategoryId = apartmentCategoryId ?? targetMasterProperty.CategoryId;

        foreach (var sp in subProperties)
        {
            sp.WardId = item.TransferredWardId;
            sp.PropertyNo = targetPropertyNo;
            sp.PropertySeqNo = sequenceNo;
            sp.IsVirtualProperty = targetIsVirtual;
            sp.UpdatedDate = DateTime.Now;

            // Only apply Apartment category if sub-property belongs to a wing,
            // or if it doesn't already have an amenity/utility specific category
            if (effectiveCategoryId.HasValue)
            {
                if (sp.WingDetailId.HasValue || !sp.CategoryId.HasValue || sp.CategoryId == targetMasterProperty.CategoryId)
                {
                    sp.CategoryId = effectiveCategoryId.Value;
                }
            }

            if (sourceToTargetWingMap != null && sp.WingDetailId.HasValue && sourceToTargetWingMap.TryGetValue(sp.WingDetailId.Value, out var targetWingId))
            {
                sp.WingDetailId = targetWingId;
            }

            sp.UPICId = UpicIdBuilderHelper.Generate(transferredWard.WardNo, targetPropertyNo, sp.PartitionNo);
        }
    }

    /// <summary>
    /// Re-links society details and wing details from the source property to the target property for full property transfers.
    /// <para>
    /// Resolves wings and societies across the entire source property chain:
    /// <list type="number">
    /// <item><description><c>subProperties' WingDetailId</c> -> <c>WingDetailsMast</c> -> <c>SocietyDetailsMastId</c></description></item>
    /// <item><description><c>subProperties' Id</c> &amp; <c>sourceMasterProperty.Id</c> -> <c>SocietyDetailsMast.PropertyId</c></description></item>
    /// <item><description><c>GSMS.SocietyWingDetails</c> records linked to source property/wings/societies</description></item>
    /// </list>
    /// </para>
    /// </summary>
    /// <param name="sourceMasterProperty">Source virtual master property.</param>
    /// <param name="subProperties">All active sub-properties of the source master.</param>
    /// <param name="targetPropertyId">Target master property ID.</param>
    /// <param name="wingDetailIds">Optional wing IDs if filtered.</param>
    /// <param name="societyDetailIds">Optional society IDs if filtered.</param>
    /// <param name="cancellationToken">Cancellation token for async operations.</param>
    /// <returns>A tuple of re-linked wing detail IDs and re-linked society detail IDs.</returns>
    private async Task<(List<int> RelinkedWingDetailIds, List<int> RelinkedSocietyDetailIds)> RelinkWingsAndSocietiesAsync(
        PropertyEntity sourceMasterProperty,
        List<PropertyEntity> subProperties,
        int targetPropertyId,
        List<int>? wingDetailIds,
        List<int>? societyDetailIds,
        CancellationToken cancellationToken)
    {
        var relinkedWingDetailIds = new List<int>();
        var relinkedSocietyDetailIds = new List<int>();

        // 1. Collect all source property IDs (master property + all subproperties)
        var allSourcePropertyIds = subProperties.Select(p => p.Id).Append(sourceMasterProperty.Id).Distinct().ToList();

        // 2. Collect all source wing IDs (from explicit parameter + from subProperties.WingDetailId)
        var allSourceWingIds = new HashSet<int>();
        if (wingDetailIds is { Count: > 0 })
        {
            foreach (var id in wingDetailIds) allSourceWingIds.Add(id);
        }
        foreach (var sp in subProperties)
        {
            if (sp.WingDetailId.HasValue)
                allSourceWingIds.Add(sp.WingDetailId.Value);
        }

        // 3. Resolve all source society IDs across both schemas (PTIS & GSMS)
        var allSourceSocietyIds = new HashSet<int>();
        if (societyDetailIds is { Count: > 0 })
        {
            var validRequestedSocIds = await _societyDetailsRepository.GetQueryable().AsNoTracking()
                .Where(s => societyDetailIds.Contains(s.Id)
                    && s.PropertyId.HasValue
                    && allSourcePropertyIds.Contains(s.PropertyId.Value)
                    && s.IsActive
                    && !s.MarkedForDeletion)
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);

            foreach (var id in validRequestedSocIds) allSourceSocietyIds.Add(id);
        }

        if (allSourceWingIds.Count > 0)
        {
            var socIdsFromWings = await _wingDetailsMastRepository.GetQueryable().AsNoTracking()
                .Where(w => allSourceWingIds.Contains(w.Id) && w.IsActive && !w.MarkedForDeletion)
                .Select(w => w.SocietyDetailsMastId)
                .Distinct()
                .ToListAsync(cancellationToken);

            foreach (var id in socIdsFromWings) allSourceSocietyIds.Add(id);

            var gsmsDerivedSocIds = await _societyWingDetailsRepository.GetQueryable().AsNoTracking()
                .Where(w => w.WingDetailsMastId.HasValue && allSourceWingIds.Contains(w.WingDetailsMastId.Value) && w.SocietyDetailId.HasValue && w.IsActive)
                .Select(w => w.SocietyDetailId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            foreach (var id in gsmsDerivedSocIds) allSourceSocietyIds.Add(id);
        }

        var socIdsFromProps = await _societyDetailsRepository.GetQueryable().AsNoTracking()
            .Where(s => s.PropertyId.HasValue && allSourcePropertyIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
            .Select(s => s.Id)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var id in socIdsFromProps) allSourceSocietyIds.Add(id);

        // Fetch source societies
        List<SocietyDetailsEntity> sourceSocieties = new();
        if (allSourceSocietyIds.Count > 0)
        {
            sourceSocieties = await _societyDetailsRepository.GetQueryable()
                .Where(s => allSourceSocietyIds.Contains(s.Id) && s.IsActive && !s.MarkedForDeletion)
                .ToListAsync(cancellationToken);
        }

        // 4. Resolve / Re-link Target Society
        int targetSocietyId;
        SocietyDetailsEntity? existingTargetSociety = null;
        if (societyDetailIds is { Count: > 0 })
        {
            existingTargetSociety = await _societyDetailsRepository.GetQueryable()
                .FirstOrDefaultAsync(s => societyDetailIds.Contains(s.Id) && s.PropertyId == targetPropertyId && s.IsActive && !s.MarkedForDeletion, cancellationToken);
        }

        if (existingTargetSociety == null)
        {
            existingTargetSociety = await _societyDetailsRepository.GetQueryable()
                .FirstOrDefaultAsync(s => s.PropertyId == targetPropertyId && s.IsActive && !s.MarkedForDeletion, cancellationToken);
        }

        if (existingTargetSociety != null)
        {
            targetSocietyId = existingTargetSociety.Id;
            if (!relinkedSocietyDetailIds.Contains(targetSocietyId))
                relinkedSocietyDetailIds.Add(targetSocietyId);

            // If existing target society has missing/empty fields, backfill from primary source society
            var primarySource = sourceSocieties.FirstOrDefault(s => !string.IsNullOrEmpty(s.SocietyName)) ?? sourceSocieties.FirstOrDefault();
            if (primarySource != null && BackfillSocietyDetails(existingTargetSociety, primarySource))
            {
                existingTargetSociety.UpdatedDate = DateTime.Now;
                await _societyDetailsRepository.UpdateAsync(existingTargetSociety, cancellationToken);
            }
        }
        else if (sourceSocieties.Count > 0)
        {
            var primarySociety = sourceSocieties[0];
            primarySociety.PropertyId = targetPropertyId;
            primarySociety.UpdatedDate = DateTime.Now;
            targetSocietyId = primarySociety.Id;
            relinkedSocietyDetailIds.Add(primarySociety.Id);

            for (int i = 1; i < sourceSocieties.Count; i++)
            {
                sourceSocieties[i].PropertyId = targetPropertyId;
                sourceSocieties[i].UpdatedDate = DateTime.Now;
                relinkedSocietyDetailIds.Add(sourceSocieties[i].Id);
            }
            await _societyDetailsRepository.UpdateRangeAsync(sourceSocieties, cancellationToken);
        }
        else
        {
            var targetProp = await _propertyMast.GetByIdAsync(targetPropertyId, cancellationToken);
            var newTargetSociety = new SocietyDetailsEntity
            {
                PropertyId = targetPropertyId,
                SocietyName = targetProp?.OwnerName ?? targetProp?.PropertyNo ?? "Society",
                SocietyNameEnglish = targetProp?.OwnerNameEnglish ?? targetProp?.PropertyNo ?? "Society",
                SocietyAddress = targetProp?.Address,
                SocietyAddressEnglish = targetProp?.AddressEnglish,
                IsActive = true,
                CreatedDate = DateTime.Now
            };
            await _societyDetailsRepository.AddAsync(newTargetSociety, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            targetSocietyId = newTargetSociety.Id;
            relinkedSocietyDetailIds.Add(newTargetSociety.Id);
        }

        // 5. Re-link WingDetailsMast (PTIS) to target society
        var wingDetailsMastQuery = _wingDetailsMastRepository.GetQueryable()
            .Where(w => w.IsActive && !w.MarkedForDeletion);

        if (allSourceWingIds.Count > 0)
        {
            wingDetailsMastQuery = wingDetailsMastQuery.Where(w => allSourceWingIds.Contains(w.Id));
        }
        else if (allSourceSocietyIds.Count > 0)
        {
            wingDetailsMastQuery = wingDetailsMastQuery.Where(w => allSourceSocietyIds.Contains(w.SocietyDetailsMastId));
        }

        if (allSourceWingIds.Count > 0 || allSourceSocietyIds.Count > 0)
        {
            var wingDetailsMastList = await wingDetailsMastQuery.ToListAsync(cancellationToken);
            if (wingDetailsMastList.Count > 0)
            {
                foreach (var w in wingDetailsMastList)
                {
                    w.SocietyDetailsMastId = targetSocietyId;
                    w.UpdatedDate = DateTime.Now;
                    if (!relinkedWingDetailIds.Contains(w.Id))
                        relinkedWingDetailIds.Add(w.Id);
                }
                await _wingDetailsMastRepository.UpdateRangeAsync(wingDetailsMastList, cancellationToken);
            }
        }

        // 6. Re-link SocietyWingDetails (GSMS) to target property and target society
        var wingsQuery = _societyWingDetailsRepository.GetQueryable()
            .Where(w => ((w.PropertyId.HasValue && allSourcePropertyIds.Contains(w.PropertyId.Value))
                || (w.WingDetailsMastId.HasValue && allSourceWingIds.Contains(w.WingDetailsMastId.Value))
                || (w.SocietyDetailId.HasValue && allSourceSocietyIds.Contains(w.SocietyDetailId.Value)))
                && w.IsActive);

        var wings = await wingsQuery.ToListAsync(cancellationToken);
        if (wings.Count > 0)
        {
            foreach (var wing in wings)
            {
                wing.PropertyId = targetPropertyId;
                wing.SocietyDetailId = targetSocietyId;
                wing.UpdatedDate = DateTime.Now;

                if (wing.WingDetailsMastId.HasValue && !relinkedWingDetailIds.Contains(wing.WingDetailsMastId.Value))
                    relinkedWingDetailIds.Add(wing.WingDetailsMastId.Value);

                if (!relinkedSocietyDetailIds.Contains(targetSocietyId))
                    relinkedSocietyDetailIds.Add(targetSocietyId);
            }
            await _societyWingDetailsRepository.UpdateRangeAsync(wings, cancellationToken);
        }

        if (allSourceWingIds.Count > 0)
        {
            foreach (var id in allSourceWingIds)
            {
                if (!relinkedWingDetailIds.Contains(id))
                    relinkedWingDetailIds.Add(id);
            }
        }

        return (relinkedWingDetailIds, relinkedSocietyDetailIds);
    }

    /// <summary>
    /// Backfills missing or empty string fields in target society from source society.
    /// Returns true if any field was updated.
    /// </summary>
    private static bool BackfillSocietyDetails(SocietyDetailsEntity target, SocietyDetailsEntity source)
    {
        bool updated = false;

        if (string.IsNullOrWhiteSpace(target.SocietyName) && !string.IsNullOrWhiteSpace(source.SocietyName))
        {
            target.SocietyName = source.SocietyName;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.SocietyNameEnglish) && !string.IsNullOrWhiteSpace(source.SocietyNameEnglish))
        {
            target.SocietyNameEnglish = source.SocietyNameEnglish;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.SocietyAddress) && !string.IsNullOrWhiteSpace(source.SocietyAddress))
        {
            target.SocietyAddress = source.SocietyAddress;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.SocietyAddressEnglish) && !string.IsNullOrWhiteSpace(source.SocietyAddressEnglish))
        {
            target.SocietyAddressEnglish = source.SocietyAddressEnglish;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.SecretaryName) && !string.IsNullOrWhiteSpace(source.SecretaryName))
        {
            target.SecretaryName = source.SecretaryName;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.SecretaryNameEnglish) && !string.IsNullOrWhiteSpace(source.SecretaryNameEnglish))
        {
            target.SecretaryNameEnglish = source.SecretaryNameEnglish;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.ManagerName) && !string.IsNullOrWhiteSpace(source.ManagerName))
        {
            target.ManagerName = source.ManagerName;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.ManagerNameEnglish) && !string.IsNullOrWhiteSpace(source.ManagerNameEnglish))
        {
            target.ManagerNameEnglish = source.ManagerNameEnglish;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.BuilderName) && !string.IsNullOrWhiteSpace(source.BuilderName))
        {
            target.BuilderName = source.BuilderName;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.BuilderNameEnglish) && !string.IsNullOrWhiteSpace(source.BuilderNameEnglish))
        {
            target.BuilderNameEnglish = source.BuilderNameEnglish;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.LandOwnerName) && !string.IsNullOrWhiteSpace(source.LandOwnerName))
        {
            target.LandOwnerName = source.LandOwnerName;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.LandOwnerNameEnglish) && !string.IsNullOrWhiteSpace(source.LandOwnerNameEnglish))
        {
            target.LandOwnerNameEnglish = source.LandOwnerNameEnglish;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.SecretaryMobileNo) && !string.IsNullOrWhiteSpace(source.SecretaryMobileNo))
        {
            target.SecretaryMobileNo = source.SecretaryMobileNo;
            updated = true;
        }
        if (string.IsNullOrWhiteSpace(target.ManagerMobileNo) && !string.IsNullOrWhiteSpace(source.ManagerMobileNo))
        {
            target.ManagerMobileNo = source.ManagerMobileNo;
            updated = true;
        }

        return updated;
    }

    #endregion
}
