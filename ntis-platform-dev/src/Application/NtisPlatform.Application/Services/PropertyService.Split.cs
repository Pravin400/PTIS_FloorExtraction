using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Partial service implementation providing functionality for property and partition splitting,
/// as well as hierarchical property lookup and relationship mappings.
/// </summary>
public partial class PropertyService
{
    /// <summary>
    /// Splits an existing base property or partition into multiple sub-units with sequential alphabetic suffixes.
    /// Handles UPIC generation, virtual property prefixes, and legacy mapping preservation within an atomic transaction.
    /// </summary>
    /// <param name="dto">The property split request details.</param>
    /// <param name="ct">Cancellation token for async operations.</param>
    /// <returns>A result containing newly created properties, skipped existing properties, and associated old property IDs.</returns>
    /// <exception cref="ArgumentException">Thrown when validation rules on input parameters fail.</exception>
    /// <exception cref="UnauthorizedAccessException">Thrown when the user does not exist, is inactive, or lacks ward allocation.</exception>
    /// <exception cref="InvalidOperationException">Thrown when the base property is not found or max split limits are reached.</exception>
    public async Task<PropertySplitResultDto> SplitProperty(PropertySplitCreateDto dto, CancellationToken ct = default)
    {
        // ─── Step 1: Input Validation ──────────────────────────────────────────────
        ValidateSplitRequest(dto);

        // ─── Step 2: User Authorization & Ward Allocation Verification ─────────────
        await ValidateUserAndWardAllocationAsync(dto.UserId, dto.WardId, dto.ModuleId, ct);

        // ─── Step 3: Transaction Initialization ────────────────────────────────────
        await _unitOfWork.BeginTransactionAsync(ct);

        try
        {
            string cleanDtoPropNo = (dto.PropertyNo ?? string.Empty).Trim();
            string cleanDtoPartNo = (dto.PartitionNo ?? string.Empty).Trim();

            // ─── Step 4: Base Property Resolution ──────────────────────────────────
            var mainProperty = await FindMainPropertyAsync(dto.WardId, cleanDtoPropNo, cleanDtoPartNo, ct);
            if (mainProperty == null)
            {
                throw new InvalidOperationException(PropertySplitConstants.ErrorMessages.BasePropertyNotExistOrInactive);
            }

            // ─── Step 5: Virtual Property Determination ────────────────────────────
            // Inherit virtual property status from DTO, base property flag, or 'VP' prefix
            bool isVirtual = dto.IsVirtualProperty
                ?? mainProperty.IsVirtualProperty
                ?? mainProperty.PropertyNo?.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
                ?? false;

            // ─── Step 6: Ward Code Resolution for UPIC Identifier ──────────────────
            var ward = await _wardRepository.GetByIdAsync(mainProperty.WardId, ct);
            string wardNo = !string.IsNullOrWhiteSpace(ward?.WardNo) ? ward.WardNo : mainProperty.WardId.ToString();

            // ─── Step 7: Historical Property Mapping Resolution ────────────────────
            (int? propertyIdOldLocal, PropertyMastOldEntity? oldProperty) = await ResolveOldPropertyDataAsync(dto, mainProperty.Id, ct);

            List<PropertyEntity> newProperties;
            List<PropertySpiltResponseDto> skippedList;
            List<PropertySpiltResponseDto> createdList;

            // ─── Step 8: Split Generation (Partition Split vs. Property Split) ─────
            if (!string.IsNullOrWhiteSpace(cleanDtoPartNo))
            {
                (newProperties, skippedList, createdList) = await GeneratePartitionSplitsAsync(
                    dto, mainProperty, cleanDtoPartNo, wardNo, isVirtual, oldProperty, ct);
            }
            else
            {
                (newProperties, skippedList, createdList) = await GeneratePropertySplitsAsync(
                    dto, mainProperty, cleanDtoPropNo, wardNo, isVirtual, oldProperty, ct);
            }

            // ─── Step 9: Batch Entity Persistence ──────────────────────────────────
            await _repository.AddRangeAsync(newProperties, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // ─── Step 10: Propagate Generated IDs & Persist Historical Linkages ────
            if (createdList.Count > 0)
            {
                for (int i = 0; i < createdList.Count; i++)
                {
                    createdList[i].PropertyId = newProperties[i].Id;
                }

                if (dto.IsOldPropertyDataAttach && propertyIdOldLocal.HasValue)
                {
                    await PersistPropertyMapDetailsAsync(dto, mainProperty, newProperties, createdList, propertyIdOldLocal.Value, oldProperty, ct);
                }

                // ─── Step 11: Workflow Details Persistence ─────────────────────────────
                await PersistWorkflowDetailsAsync(dto, newProperties, ct);
            }

            // ─── Step 12: Collect Distinct Active Old Property IDs ─────────────────
            var oldPropertyIds = await _propertyMapDetailRepository.GetQueryable()
                .Where(x => x.PropertyIdNew == mainProperty.Id && x.PropertyIdOld.HasValue && x.IsActive)
                .Select(x => x.PropertyIdOld!.Value)
                .Distinct()
                .ToListAsync(ct);

            // ─── Step 13: Atomic Commit ────────────────────────────────────────────
            await _unitOfWork.CommitTransactionAsync(ct);

            return new PropertySplitResultDto
            {
                OldPropertyIds = oldPropertyIds,
                Skipped = skippedList,
                Created = createdList
            };
        }
        catch (Exception)
        {
            // Rollback database transaction atomically upon any error or constraint violation
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }

    /// <summary>
    /// Validates core request constraints before initiating any database transactions.
    /// </summary>
    /// <param name="dto">The property split request DTO to validate.</param>
    /// <exception cref="ArgumentException">Thrown when any required parameter fails business rules.</exception>
    private static void ValidateSplitRequest(PropertySplitCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PropertyNo))
        {
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.PropertyNoRequired);
        }

        if (dto.IsPartitionProperty && string.IsNullOrWhiteSpace(dto.PartitionNo))
        {
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.PartitionNoRequired);
        }

        if (dto.NoOfSplit <= 0)
        {
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.NoOfSplitsGreaterThanZero);
        }

        if (dto.UserId <= 0)
        {
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.UserIdGreaterThanZero);
        }

        if (dto.WardId <= 0)
        {
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.WardIdGreaterThanZero);
        }

        if (dto.ModuleId.HasValue && dto.ModuleId.Value <= 0)
        {
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.ModuleIdGreaterThanZero);
        }
    }

    /// <summary>
    /// Verifies that the initiating user exists, is active, and is allocated to the specified ward and optional module.
    /// </summary>
    /// <param name="userId">The ID of the user requesting the split.</param>
    /// <param name="wardId">The ID of the ward being accessed.</param>
    /// <param name="moduleId">Optional ID of the module being accessed.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <exception cref="UnauthorizedAccessException">Thrown when user is missing/inactive or not assigned to the ward/module.</exception>
    private async Task ValidateUserAndWardAllocationAsync(int userId, int wardId, int? moduleId, CancellationToken ct)
    {
        var validationStatus = await _userRepository.GetQueryable()
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                IsUserValid = u.IsActive && !u.MarkedForDeletion,
                HasWard = _wardAllocationRepository.GetQueryable()
                            .Any(w => w.UserId == u.Id &&
                                      w.WardId == wardId &&
                                      w.IsActive &&
                                      (!moduleId.HasValue || w.ModuleId == moduleId.Value))
            })
            .FirstOrDefaultAsync(ct);

        if (validationStatus == null || !validationStatus.IsUserValid)
        {
            throw new UnauthorizedAccessException(PropertySplitConstants.ErrorMessages.UserNotExistOrInactive);
        }

        if (!validationStatus.HasWard)
        {
            throw new UnauthorizedAccessException(PropertySplitConstants.ErrorMessages.WardNotAllocatedToUser);
        }
    }

    /// <summary>
    /// Resolves the base property record matching either standard or virtual-prefixed property numbers.
    /// </summary>
    /// <param name="wardId">The ward ID to scope the query.</param>
    /// <param name="cleanPropNo">Normalized property number string.</param>
    /// <param name="cleanPartNo">Normalized partition number string, if applicable.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The matched <see cref="PropertyEntity"/>, or null if not found.</returns>
    private async Task<PropertyEntity?> FindMainPropertyAsync(int wardId, string cleanPropNo, string cleanPartNo, CancellationToken ct)
    {
        string unprefixedPropNo = cleanPropNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? cleanPropNo.Substring(VirtualPropertyConstants.VirtualPropertyPrefix.Length).Trim()
            : cleanPropNo;
        string vpPrefixedPropNo = cleanPropNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? cleanPropNo
            : $"{VirtualPropertyConstants.VirtualPropertyPrefix}{cleanPropNo}";

        var query = _repository.GetQueryable()
            .Where(x => x.WardId == wardId &&
                        x.IsActive &&
                        !x.MarkedForDeletion &&
                        x.PropertyNo != null &&
                        (x.PropertyNo.Trim() == cleanPropNo ||
                         x.PropertyNo.Trim() == unprefixedPropNo ||
                         x.PropertyNo.Trim() == vpPrefixedPropNo));

        if (!string.IsNullOrWhiteSpace(cleanPartNo))
        {
            query = query.Where(x => x.PartitionNo != null && x.PartitionNo.Trim() == cleanPartNo);
        }

        return await query.FirstOrDefaultAsync(ct);
    }

    /// <summary>
    /// Resolves historical master data and mapping identifier if old property data attachment is requested.
    /// </summary>
    /// <param name="dto">The split request configuration.</param>
    /// <param name="mainPropertyId">The database ID of the main property.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A tuple with the old property ID and entity, or (null, null) if not applicable.</returns>
    private async Task<(int? PropertyIdOld, PropertyMastOldEntity? OldProperty)> ResolveOldPropertyDataAsync(
        PropertySplitCreateDto dto, int mainPropertyId, CancellationToken ct)
    {
        if (!dto.IsOldPropertyDataAttach)
        {
            return (null, null);
        }

        var oldMappingIds = await _propertyMapDetailRepository.GetQueryable()
            .Where(x => x.PropertyIdNew == mainPropertyId &&
                        x.PropertyIdOld != null &&
                        x.IsActive)
            .OrderByDescending(x => x.Id)
            .Select(x => x.PropertyIdOld!.Value)
            .ToListAsync(ct);

        if (oldMappingIds.Count == 0)
        {
            return (null, null);
        }

        var distinctOldIds = oldMappingIds.Distinct().ToList();

        if (distinctOldIds.Count > 1)
        {
            _logger.LogWarning(
                "PropertyIdNew {MainPropertyId} has {Count} distinct active old property mappings ({MappingIds}). Selecting the latest active mapping PropertyIdOld {SelectedOldId}.",
                mainPropertyId, distinctOldIds.Count, string.Join(", ", distinctOldIds), distinctOldIds[0]);
        }

        int oldId = distinctOldIds[0];
        var oldProp = await _propertyOldRepository.GetByIdAsync(oldId, ct);
        return (oldId, oldProp);
    }

    /// <summary>
    /// Strips trailing alphabetic suffix characters to isolate the underlying base identifier.
    /// Preserves designated prefix length (such as 'VP' for virtual properties).
    /// </summary>
    /// <param name="value">The raw identifier string containing potential suffixes.</param>
    /// <param name="minPrefixLength">Minimum prefix length that must not be stripped.</param>
    /// <returns>The normalized base number string.</returns>
    private static string ExtractBaseNumber(string value, int minPrefixLength = 0)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        string trimmed = value.Trim();
        int suffixStartIndex = trimmed.Length;

        while (suffixStartIndex > minPrefixLength &&
               char.IsLetter(trimmed[suffixStartIndex - 1]) &&
               char.IsUpper(trimmed[suffixStartIndex - 1]))
        {
            suffixStartIndex--;
        }

        return trimmed.Substring(0, suffixStartIndex).Trim();
    }

    /// <summary>
    /// Factory method that constructs a new <see cref="PropertyEntity"/> child instance copied from base property attributes.
    /// </summary>
    /// <param name="mainProperty">Parent property entity supplying template attributes.</param>
    /// <param name="propertyNo">The calculated property number for the child.</param>
    /// <param name="partitionNo">The calculated partition number for the child.</param>
    /// <param name="wardNo">The ward code for UPIC generation.</param>
    /// <param name="isVirtual">Flag indicating whether this is a virtual property.</param>
    /// <param name="isActive">Active status flag.</param>
    /// <param name="createdBy">User ID of the creator.</param>
    /// <param name="oldProperty">Legacy property data, if attaching historical records.</param>
    /// <param name="attachOldData">Whether old property data should be attached.</param>
    /// <returns>A fully initialized <see cref="PropertyEntity"/> instance.</returns>
    private static PropertyEntity CreatePropertyEntity(
        PropertyEntity mainProperty,
        string propertyNo,
        string partitionNo,
        string wardNo,
        bool isVirtual,
        bool isActive,
        int? createdBy,
        PropertyMastOldEntity? oldProperty,
        bool attachOldData)
    {
        bool hasOldData = attachOldData && oldProperty != null;
        string ownerName = hasOldData && !string.IsNullOrWhiteSpace(oldProperty!.OldOwnerName)
            ? oldProperty.OldOwnerName
            : PropertySplitConstants.DefaultOwnerName;
        string ownerNameEnglish = hasOldData && !string.IsNullOrWhiteSpace(oldProperty!.OldOwnerNameEnglish)
            ? oldProperty.OldOwnerNameEnglish
            : PropertySplitConstants.DefaultOwnerNameEnglish;

        return new PropertyEntity
        {
            WardId = mainProperty.WardId,
            TaxZoneId = mainProperty.TaxZoneId,
            PropertyTypeId = mainProperty.PropertyTypeId,
            PropertyNo = propertyNo,
            PartitionNo = partitionNo,
            PropertyAssessmentStatusId = mainProperty.PropertyAssessmentStatusId,
            OpenPlot = mainProperty.OpenPlot,
            CSN = mainProperty.CSN,
            PlotNo = mainProperty.PlotNo,
            CategoryId = mainProperty.CategoryId,
            Type = mainProperty.Type,
            PinCode = mainProperty.PinCode,
            Address = mainProperty.Address,
            AddressEnglish = mainProperty.AddressEnglish,
            FlatOrShopNo = mainProperty.FlatOrShopNo,
            Location = mainProperty.Location,
            LocationEnglish = mainProperty.LocationEnglish,
            MobileNo = mainProperty.MobileNo,
            MobileNoRemarkId = mainProperty.MobileNoRemarkId,
            PropertySeqNo = mainProperty.PropertySeqNo,
            OwnerName = ownerName,
            OwnerNameEnglish = ownerNameEnglish,
            OccupierName = hasOldData ? oldProperty!.OldOccupierName : null,
            OccupierNameEnglish = hasOldData ? oldProperty!.OldOccupierNameEnglish : null,
            UPICId = UpicIdBuilderHelper.Generate(wardNo, propertyNo, string.IsNullOrEmpty(partitionNo) ? null : partitionNo),
            IsActive = isActive,
            IsVirtualProperty = isVirtual,
            MarkedForDeletion = false,
            CreatedBy = createdBy
        };
    }

    /// <summary>
    /// Generates split child partitions (e.g., P1 -> P1A, P1B) advancing alphabetical suffixes sequentially.
    /// </summary>
    /// <param name="dto">The split request payload.</param>
    /// <param name="mainProperty">The base property entity being partitioned.</param>
    /// <param name="cleanPartitionNo">The normalized base partition identifier.</param>
    /// <param name="wardNo">The ward number used for UPIC generation.</param>
    /// <param name="isVirtual">Indicates whether newly generated entities are virtual.</param>
    /// <param name="oldProperty">Legacy property data for historical attachment.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A tuple with generated entities, skipped existing items, and created response items.</returns>
    private async Task<(List<PropertyEntity> NewProperties, List<PropertySpiltResponseDto> Skipped, List<PropertySpiltResponseDto> Created)>
        GeneratePartitionSplitsAsync(
            PropertySplitCreateDto dto,
            PropertyEntity mainProperty,
            string cleanPartitionNo,
            string wardNo,
            bool isVirtual,
            PropertyMastOldEntity? oldProperty,
            CancellationToken ct)
    {
        // ─── Step 1: Base Partition Normalization ──────────────────────────────────
        // Strip trailing uppercase alphabetic characters (e.g. "P1A" -> "P1")
        string basePartitionNo = ExtractBaseNumber(cleanPartitionNo);

        // ─── Step 2: Virtual Property Prefix Handling ──────────────────────────────
        string cleanMainPropNo = (mainProperty.PropertyNo ?? string.Empty).Trim();
        string partitionPropertyNo = isVirtual && !cleanMainPropNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? $"{VirtualPropertyConstants.VirtualPropertyPrefix}{cleanMainPropNo}"
            : cleanMainPropNo;

        // ─── Step 3: Query Sibling Partitions (Active + Inactive) ──────────────────
        // Query both active and inactive records to prevent collisions on unique index UX_PropertyMast_ActiveProperty
        var relatedProperties = await _repository.GetQueryable()
            .Where(x => x.WardId == dto.WardId &&
                        (x.PropertyNo != null && (x.PropertyNo.Trim() == cleanMainPropNo || x.PropertyNo.Trim() == partitionPropertyNo)) &&
                        x.PartitionNo != null &&
                        x.PartitionNo.Trim().StartsWith(basePartitionNo))
            .Select(x => new { x.Id, x.PropertyNo, x.PartitionNo, x.IsActive })
            .ToListAsync(ct);

        var existingSuffixes = new List<string>();
        var existingPartitionNos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var skippedList = new List<PropertySpiltResponseDto>();

        // ─── Step 4: Detect Existing Suffixes & Compile Skipped Items ──────────────
        foreach (var prop in relatedProperties)
        {
            if (string.IsNullOrWhiteSpace(prop.PartitionNo)) continue;
            string cleanPartNo = prop.PartitionNo.Trim();
            existingPartitionNos.Add(cleanPartNo);

            if (cleanPartNo.Length > basePartitionNo.Length && cleanPartNo.StartsWith(basePartitionNo, StringComparison.OrdinalIgnoreCase))
            {
                string suffix = cleanPartNo.Substring(basePartitionNo.Length).Trim();
                if (!string.IsNullOrEmpty(suffix) && suffix.All(char.IsLetter) && suffix.All(char.IsUpper))
                {
                    existingSuffixes.Add(suffix);
                    skippedList.Add(new PropertySpiltResponseDto
                    {
                        PropertyId = prop.Id,
                        GeneratedPropertyNo = prop.PropertyNo!,
                        ParentPropertyNo = mainProperty.PropertyNo!,
                        WardId = mainProperty.WardId,
                        GeneratedPartitionNo = cleanPartNo,
                        ParentPartitionNo = mainProperty.PartitionNo,
                        IsSplit = true,
                        IsPartitionProperty = true,
                        IsVirtualProperty = isVirtual
                    });
                }
            }
        }

        // ─── Step 5: Determine Sequence Seed from Highest Existing Suffix ──────────
        string currentMaxSuffix = existingSuffixes.Count > 0
            ? existingSuffixes.OrderBy(s => s.Length).ThenBy(s => s).Last()
            : string.Empty;

        string nextSuffix = GetNextAlphabeticSuffix(currentMaxSuffix);

        var newProperties = new List<PropertyEntity>();
        var createdList = new List<PropertySpiltResponseDto>();

        // ─── Step 6: Generate Sequential Child Partitions ──────────────────────────
        for (int i = 0; i < dto.NoOfSplit; i++)
        {
            if (nextSuffix.Length > PropertySplitConstants.MaxSuffixLength)
            {
                throw new InvalidOperationException(PropertySplitConstants.ErrorMessages.MaxSplitLimitReached);
            }

            string newPartitionNo = $"{basePartitionNo}{nextSuffix}";

            // Advance suffix until a non-colliding partition number is identified
            while (existingPartitionNos.Contains(newPartitionNo))
            {
                nextSuffix = GetNextAlphabeticSuffix(nextSuffix);
                if (nextSuffix.Length > PropertySplitConstants.MaxSuffixLength)
                {
                    throw new InvalidOperationException(PropertySplitConstants.ErrorMessages.MaxSplitLimitReached);
                }
                newPartitionNo = $"{basePartitionNo}{nextSuffix}";
            }

            existingPartitionNos.Add(newPartitionNo);

            // Instantiate child entity using the centralized factory method
            var newProperty = CreatePropertyEntity(
                mainProperty, partitionPropertyNo, newPartitionNo, wardNo,
                isVirtual, dto.IsActive, dto.CreatedBy, oldProperty, dto.IsOldPropertyDataAttach);
            newProperties.Add(newProperty);

            createdList.Add(new PropertySpiltResponseDto
            {
                GeneratedPropertyNo = partitionPropertyNo,
                ParentPropertyNo = mainProperty.PropertyNo!,
                WardId = mainProperty.WardId,
                GeneratedPartitionNo = newPartitionNo,
                ParentPartitionNo = mainProperty.PartitionNo,
                IsSplit = true,
                IsPartitionProperty = true,
                IsVirtualProperty = isVirtual
            });

            nextSuffix = GetNextAlphabeticSuffix(nextSuffix);
        }

        return (newProperties, skippedList, createdList);
    }

    /// <summary>
    /// Generates split child properties (e.g., 100 -> 100A, 100B or VP100 -> VP100A) advancing alphabetical suffixes sequentially.
    /// </summary>
    /// <param name="dto">The split request payload.</param>
    /// <param name="mainProperty">The base property entity being split.</param>
    /// <param name="cleanPropNo">The normalized base property identifier.</param>
    /// <param name="wardNo">The ward number used for UPIC generation.</param>
    /// <param name="isVirtual">Indicates whether newly generated entities are virtual.</param>
    /// <param name="oldProperty">Legacy property data for historical attachment.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A tuple with generated entities, skipped existing items, and created response items.</returns>
    private async Task<(List<PropertyEntity> NewProperties, List<PropertySpiltResponseDto> Skipped, List<PropertySpiltResponseDto> Created)>
        GeneratePropertySplitsAsync(
            PropertySplitCreateDto dto,
            PropertyEntity mainProperty,
            string cleanPropNo,
            string wardNo,
            bool isVirtual,
            PropertyMastOldEntity? oldProperty,
            CancellationToken ct)
    {
        // ─── Step 1: Virtual Property Prefix Formatting ────────────────────────────
        string basePropertyNo = cleanPropNo;
        if (isVirtual && !basePropertyNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            basePropertyNo = $"{VirtualPropertyConstants.VirtualPropertyPrefix}{basePropertyNo}";
        }

        // ─── Step 2: Base Property Normalization ───────────────────────────────────
        // Strip trailing uppercase alphabetic characters (e.g. "100A" -> "100", "VP100A" -> "VP100")
        int minPrefixLength = basePropertyNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? VirtualPropertyConstants.VirtualPropertyPrefix.Length
            : 0;

        basePropertyNo = ExtractBaseNumber(basePropertyNo, minPrefixLength);

        // ─── Step 3: Query Sibling Properties (Active + Inactive) ──────────────────
        // Query both active and inactive records to prevent collisions on unique index UX_PropertyMast_ActiveProperty
        var relatedProperties = await _repository.GetQueryable()
            .Where(x => x.WardId == dto.WardId &&
                        x.PropertyNo != null &&
                        x.PropertyNo.Trim().StartsWith(basePropertyNo))
            .Select(x => new { x.Id, x.PropertyNo, x.PartitionNo, x.IsActive })
            .ToListAsync(ct);

        var existingSuffixes = new List<string>();
        var existingPropertyNos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var skippedList = new List<PropertySpiltResponseDto>();

        // ─── Step 4: Detect Existing Suffixes & Compile Skipped Items ──────────────
        foreach (var prop in relatedProperties)
        {
            if (string.IsNullOrWhiteSpace(prop.PropertyNo)) continue;
            string cleanExistingPropNo = prop.PropertyNo.Trim();
            existingPropertyNos.Add(cleanExistingPropNo);

            if (cleanExistingPropNo.Length > basePropertyNo.Length && cleanExistingPropNo.StartsWith(basePropertyNo, StringComparison.OrdinalIgnoreCase))
            {
                string suffix = cleanExistingPropNo.Substring(basePropertyNo.Length).Trim();
                if (!string.IsNullOrEmpty(suffix) && suffix.All(char.IsLetter) && suffix.All(char.IsUpper))
                {
                    existingSuffixes.Add(suffix);
                    skippedList.Add(new PropertySpiltResponseDto
                    {
                        PropertyId = prop.Id,
                        WardId = mainProperty.WardId,
                        GeneratedPropertyNo = cleanExistingPropNo,
                        ParentPropertyNo = mainProperty.PropertyNo!,
                        GeneratedPartitionNo = prop.PartitionNo,
                        ParentPartitionNo = mainProperty.PartitionNo,
                        IsSplit = true,
                        IsPartitionProperty = false,
                        IsVirtualProperty = isVirtual
                    });
                }
            }
        }

        // ─── Step 5: Determine Sequence Seed from Highest Existing Suffix ──────────
        string currentMaxSuffix = existingSuffixes.Count > 0
            ? existingSuffixes.OrderBy(s => s.Length).ThenBy(s => s).Last()
            : string.Empty;

        string nextSuffix = GetNextAlphabeticSuffix(currentMaxSuffix);

        var newProperties = new List<PropertyEntity>();
        var createdList = new List<PropertySpiltResponseDto>();

        // ─── Step 6: Generate Sequential Child Properties ──────────────────────────
        for (int i = 0; i < dto.NoOfSplit; i++)
        {
            if (nextSuffix.Length > PropertySplitConstants.MaxSuffixLength)
            {
                throw new InvalidOperationException(PropertySplitConstants.ErrorMessages.MaxSplitLimitReached);
            }

            string newPropertyNo = $"{basePropertyNo}{nextSuffix}";

            // Advance suffix until a non-colliding property number is identified
            while (existingPropertyNos.Contains(newPropertyNo))
            {
                nextSuffix = GetNextAlphabeticSuffix(nextSuffix);
                if (nextSuffix.Length > PropertySplitConstants.MaxSuffixLength)
                {
                    throw new InvalidOperationException(PropertySplitConstants.ErrorMessages.MaxSplitLimitReached);
                }
                newPropertyNo = $"{basePropertyNo}{nextSuffix}";
            }

            existingPropertyNos.Add(newPropertyNo);

            // Instantiate child entity using the centralized factory method
            var newProperty = CreatePropertyEntity(
                mainProperty, newPropertyNo, string.Empty, wardNo,
                isVirtual, dto.IsActive, dto.CreatedBy, oldProperty, dto.IsOldPropertyDataAttach);
            newProperties.Add(newProperty);

            createdList.Add(new PropertySpiltResponseDto
            {
                GeneratedPropertyNo = newPropertyNo,
                ParentPropertyNo = mainProperty.PropertyNo!,
                WardId = mainProperty.WardId,
                GeneratedPartitionNo = string.Empty,
                ParentPartitionNo = mainProperty.PartitionNo,
                IsSplit = true,
                IsPartitionProperty = false,
                IsVirtualProperty = isVirtual
            });

            nextSuffix = GetNextAlphabeticSuffix(nextSuffix);
        }

        return (newProperties, skippedList, createdList);
    }

    /// <summary>
    /// Records mapping relationship entries linking old legacy property records to newly generated split properties.
    /// </summary>
    /// <param name="dto">The split request payload.</param>
    /// <param name="mainProperty">The base property entity.</param>
    /// <param name="newProperties">The newly inserted property entities with populated database IDs.</param>
    /// <param name="createdList">The response DTO items representing the new properties.</param>
    /// <param name="propertyIdOldLocal">The ID of the historical property mapping.</param>
    /// <param name="oldProperty">The historical property entity.</param>
    /// <param name="ct">Cancellation token.</param>
    private async Task PersistPropertyMapDetailsAsync(
        PropertySplitCreateDto dto,
        PropertyEntity mainProperty,
        List<PropertyEntity> newProperties,
        List<PropertySpiltResponseDto> createdList,
        int propertyIdOldLocal,
        PropertyMastOldEntity? oldProperty,
        CancellationToken ct)
    {
        // ─── Step 1: Resolve Active Split Mapping Master ───────────────────────────
        var propertyMapMaster = await _propertyMapMasterRepository.GetQueryable()
            .FirstOrDefaultAsync(x => x.MappingCategory == PropertySplitConstants.MappingCategorySplit && x.IsActive, ct);

        int propertyMapId = propertyMapMaster?.Id ?? PropertySplitConstants.DefaultPropertyMapMasterId;

        // ─── Step 2: Build Child-to-Parent and Legacy Linkage Records ──────────────
        var propertyMapDetails = new List<PropertyMapDetailEntity>();
        for (int i = 0; i < createdList.Count; i++)
        {
            var propertyMapDetail = new PropertyMapDetailEntity
            {
                PropertyMapId = propertyMapId,
                PropertyIdNew = newProperties[i].Id,
                PropertyIdOld = propertyIdOldLocal,
                Status = PropertySplitConstants.StatusActive,
                Remark = PropertySplitConstants.SplitRemark,
                CreatedBy = dto.CreatedBy,
                IsActive = true,
                PropertyNoNew = BuildPropertyNumber(createdList[i].WardId?.ToString(), createdList[i].GeneratedPropertyNo, createdList[i].GeneratedPartitionNo),
                PropertyNoOld = BuildPropertyNumber(oldProperty?.OldWardNo, oldProperty?.OldPropertyNo, oldProperty?.OldPartitionNo),
                CreatedDate = DateTime.Now,
                MergeDetail = new MergeDetailEntity
                {
                    OwnerName = mainProperty.OwnerName,
                    OwnerNameEnglish = mainProperty.OwnerNameEnglish,
                    OccupierName = mainProperty.OccupierName,
                    OccupierNameEnglish = mainProperty.OccupierNameEnglish,
                    MobileNo = mainProperty.MobileNo,
                    Address = mainProperty.Address,
                    AddressEnglish = mainProperty.AddressEnglish,
                    FlatOrShopNo = mainProperty.FlatOrShopNo,
                    FlatOrShopNoEnglish = mainProperty.FlatOrShopNoEnglish,
                    FlatOrShopName = mainProperty.FlatOrShopName,
                    FlatOrShopNameEnglish = mainProperty.FlatOrShopNameEnglish,
                    CreatedBy = dto.CreatedBy
                }
            };

            propertyMapDetails.Add(propertyMapDetail);
        }

        // ─── Step 3: Batch Insert Mapping Detail Entities ──────────────────────────
        if (propertyMapDetails.Count > 0)
        {
            await _propertyMapDetailRepository.AddRangeAsync(propertyMapDetails, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }
    }

    /// <summary>
    /// Persists initial workflow status entries into PropertyWorkflowDetails for newly split properties.
    /// Resolves WorkflowStageId using WorkflowStageConstants.GeoSequencing (defaulting to 1).
    /// </summary>
    /// <param name="dto">The split request containing ModuleId and creator details.</param>
    /// <param name="newProperties">The newly inserted property entities with populated database IDs.</param>
    /// <param name="ct">Cancellation token.</param>
    private async Task PersistWorkflowDetailsAsync(
        PropertySplitCreateDto dto,
        List<PropertyEntity> newProperties,
        CancellationToken ct)
    {
        var workflowDetailsRepo = (IRepository<PropertyWorkflowDetailsEntity, int>?)_workflowDetailsRepository 
            ?? _serviceProvider?.GetService<IPropertyWorkflowDetailsRepository>() 
            ?? _serviceProvider?.GetService<IRepository<PropertyWorkflowDetailsEntity, int>>();
        if (workflowDetailsRepo == null || newProperties.Count == 0) return;

        // Resolve GeoSequencing stage ID using WorkflowStageConstants.GeoSequencing (defaulting to 1)
        var stageRepo = _workflowStageRepository ?? _serviceProvider?.GetService<IRepository<PropertyWorkflowStageMasterEntity, int>>();
        int workflowStageId = 1;
        if (stageRepo != null)
        {
            try
            {
                var geoStageId = await stageRepo.GetQueryable()
                    .AsNoTracking()
                    .Where(s => s.IsActive && s.StageName == WorkflowStageConstants.GeoSequencing)
                    .Select(s => s.Id)
                    .FirstOrDefaultAsync(ct);

                if (geoStageId > 0)
                {
                    workflowStageId = geoStageId;
                }
            }
            catch
            {
                workflowStageId = 1;
            }
        }

        int createdByUserId = dto.CreatedBy.HasValue && dto.CreatedBy.Value > 0 ? dto.CreatedBy.Value : dto.UserId;
        var workflowEntries = new List<PropertyWorkflowDetailsEntity>();
        for (int i = 0; i < newProperties.Count; i++)
        {
            workflowEntries.Add(new PropertyWorkflowDetailsEntity
            {
                PropertyId = newProperties[i].Id,
                WorkflowStageId = workflowStageId,
                ModuleId = dto.ModuleId,
                CurrentStatus = true,
                IsActive = true,
                CreatedBy = createdByUserId,
                CreatedDate = DateTime.Now
            });
        }

        await workflowDetailsRepo.AddRangeAsync(workflowEntries, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Computes the subsequent lexicographical uppercase alphabetic suffix (e.g. A -> B, Z -> AA, etc.).
    /// </summary>
    /// <param name="currentSuffix">The current suffix, or null/empty to start from 'A'.</param>
    /// <returns>The calculated next alphabetical suffix.</returns>
    private static string GetNextAlphabeticSuffix(string currentSuffix)
    {
        // Default seed when starting a new sequence
        if (string.IsNullOrEmpty(currentSuffix)) return "A";

        char[] chars = currentSuffix.ToCharArray();

        // Increment from the least significant character backwards
        for (int i = chars.Length - 1; i >= 0; i--)
        {
            if (chars[i] < 'Z')
            {
                chars[i]++;
                return new string(chars);
            }

            chars[i] = 'A';
        }

        // When all characters roll over (e.g., "Z" -> "AA", "ZZ" -> "AAA")
        return "A" + new string(chars);
    }

    /// <summary>
    /// Retrieves a hierarchical breakdown of a parent property and its associated partition and property splits.
    /// </summary>
    /// <param name="request">Lookup request criteria containing property number and user authorization details.</param>
    /// <param name="ct">Cancellation token for async operations.</param>
    /// <returns>A hierarchical structure detailing the property and child splits.</returns>
    /// <exception cref="ArgumentException">Thrown when request validation fails.</exception>
    /// <exception cref="UnauthorizedAccessException">Thrown when user is invalid or not allocated to the ward.</exception>
    public async Task<List<PropertyHierarchyResponseDto>> GetPropertyListAsync(PropertyLookupRequestDto request, CancellationToken ct = default)
    {
        // ─── Step 1: Input Validation ──────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(request.PropertyNo))
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.PropertyNoRequired);

        if (request.UserId <= 0)
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.UserIdGreaterThanZero);

        if (request.WardId <= 0)
            throw new ArgumentException(PropertySplitConstants.ErrorMessages.WardIdGreaterThanZero);

        // ─── Step 2: User Validation & Ward Allocation Check ───────────────────────
        var validationStatus = await _userRepository.GetQueryable()
            .AsNoTracking()
            .Where(u => u.Id == request.UserId)
            .Select(u => new
            {
                IsUserValid = u.IsActive && !u.MarkedForDeletion,
                HasWard = _wardAllocationRepository.GetQueryable()
                            .Any(w => w.UserId == u.Id && w.WardId == request.WardId && w.IsActive)
            })
            .FirstOrDefaultAsync(ct);

        if (validationStatus == null || !validationStatus.IsUserValid)
            throw new UnauthorizedAccessException(PropertySplitConstants.ErrorMessages.UserNotExistOrInactive);

        if (!validationStatus.HasWard)
            throw new UnauthorizedAccessException(PropertySplitConstants.ErrorMessages.WardNotAllocatedToUser);

        // ─── Step 3: Base Property Number Extraction ───────────────────────────────
        // Strip trailing alphabetic uppercase suffixes to isolate root property identifier
        string basePropertyNo = request.PropertyNo;
        int suffixStartIndex = basePropertyNo.Length;

        while (suffixStartIndex > 0 && char.IsLetter(basePropertyNo[suffixStartIndex - 1]) && char.IsUpper(basePropertyNo[suffixStartIndex - 1]))
        {
            suffixStartIndex--;
        }
        basePropertyNo = basePropertyNo.Substring(0, suffixStartIndex);

        // ─── Step 4: Database Query for Matching Properties & Categories ───────────
        var propertiesQuery = from p in _repository.GetQueryable()
                              join c in _categoryRepository.GetQueryable() on p.CategoryId equals c.Id into catGroup
                              from c in catGroup.DefaultIfEmpty()
                              where p.WardId == request.WardId &&
                                    p.IsActive &&
                                    !p.MarkedForDeletion &&
                                    p.PropertyNo != null &&
                                    p.PropertyNo.StartsWith(basePropertyNo)
                              select new
                              {
                                  PropertyId = p.Id,
                                  p.PropertyNo,
                                  p.PartitionNo,
                                  p.OwnerName,
                                  PropCategoryDesc = c != null ? c.PropertyCategoryName : string.Empty
                              };

        var relatedProperties = await propertiesQuery.ToListAsync(ct);

        var result = new List<PropertyHierarchyResponseDto>();
        var mainPropDict = new Dictionary<string, PropertyHierarchyResponseDto>();

        // ─── Step 5: Hierarchical Tree Assembly ────────────────────────────────────
        foreach (var prop in relatedProperties)
        {
            if (prop.PropertyNo == null) continue;

            bool isBaseProperty = prop.PropertyNo == basePropertyNo;
            bool isPropertySplit = false;

            if (prop.PropertyNo.Length > basePropertyNo.Length)
            {
                var propSuffix = prop.PropertyNo.Substring(basePropertyNo.Length);
                if (propSuffix.All(char.IsLetter) && propSuffix.All(char.IsUpper))
                {
                    isPropertySplit = true;
                }
            }

            if (!isBaseProperty && !isPropertySplit) continue;

            // ── Partition-Filtered Branch ──
            if (!string.IsNullOrWhiteSpace(request.PartitionNo))
            {
                string basePartitionNo = request.PartitionNo;
                int partSuffixIndex = basePartitionNo.Length;
                while (partSuffixIndex > 0 && char.IsLetter(basePartitionNo[partSuffixIndex - 1]) && char.IsUpper(basePartitionNo[partSuffixIndex - 1]))
                {
                    partSuffixIndex--;
                }
                basePartitionNo = basePartitionNo.Substring(0, partSuffixIndex);

                if (prop.PartitionNo == null || !prop.PartitionNo.StartsWith(basePartitionNo))
                    continue;

                bool isBasePartition = prop.PartitionNo == basePartitionNo;
                bool isPartitionSplit = false;
                if (prop.PartitionNo.Length > basePartitionNo.Length)
                {
                    var partSuffix = prop.PartitionNo.Substring(basePartitionNo.Length);
                    if (partSuffix.All(char.IsLetter) && partSuffix.All(char.IsUpper))
                    {
                        isPartitionSplit = true;
                    }
                }

                if (!isBasePartition && !isPartitionSplit) continue;

                string dictKey = $"{basePropertyNo}_{basePartitionNo}";
                if (!mainPropDict.TryGetValue(dictKey, out var hierarchy))
                {
                    hierarchy = new PropertyHierarchyResponseDto
                    {
                        PropertyNo = basePropertyNo,
                        PartitionNo = basePartitionNo
                    };
                    mainPropDict[dictKey] = hierarchy;
                    result.Add(hierarchy);
                }

                if (isBasePartition)
                {
                    hierarchy.PropertyId = prop.PropertyId;
                    hierarchy.PropCategoryDesc = prop.PropCategoryDesc;
                    hierarchy.OwnerName = prop.OwnerName;
                }
                else if (isPartitionSplit)
                {
                    var splitObj = hierarchy.Splits.FirstOrDefault(s => s.PartitionNo == prop.PartitionNo);
                    if (splitObj == null)
                    {
                        splitObj = new PropertySplitHierarchyDto
                        {
                            PropertyNo = prop.PropertyNo,
                            PartitionNo = prop.PartitionNo,
                            PropertyId = prop.PropertyId,
                            PropCategoryDesc = prop.PropCategoryDesc,
                            OwnerName = prop.OwnerName
                        };
                        hierarchy.Splits.Add(splitObj);
                    }
                }
            }
            // ── Property-Wide Branch ──
            else
            {
                if (!mainPropDict.TryGetValue(basePropertyNo, out var hierarchy))
                {
                    hierarchy = new PropertyHierarchyResponseDto
                    {
                        PropertyNo = basePropertyNo
                    };
                    mainPropDict[basePropertyNo] = hierarchy;
                    result.Add(hierarchy);
                }

                if (isBaseProperty)
                {
                    if (string.IsNullOrWhiteSpace(prop.PartitionNo))
                    {
                        hierarchy.PropertyId = prop.PropertyId;
                        hierarchy.PropCategoryDesc = prop.PropCategoryDesc;
                        hierarchy.OwnerName = prop.OwnerName;
                    }
                    else
                    {
                        hierarchy.Partitions.Add(new PropertyPartitionDetailDto
                        {
                            PropertyId = prop.PropertyId,
                            PartitionNo = prop.PartitionNo,
                            PropCategoryDesc = prop.PropCategoryDesc,
                            OwnerName = prop.OwnerName
                        });
                    }
                }
                else if (isPropertySplit)
                {
                    var splitObj = hierarchy.Splits.FirstOrDefault(s => s.PropertyNo == prop.PropertyNo);
                    if (splitObj == null)
                    {
                        splitObj = new PropertySplitHierarchyDto
                        {
                            PropertyNo = prop.PropertyNo
                        };
                        hierarchy.Splits.Add(splitObj);
                    }

                    if (string.IsNullOrWhiteSpace(prop.PartitionNo))
                    {
                        splitObj.PropertyId = prop.PropertyId;
                        splitObj.PropCategoryDesc = prop.PropCategoryDesc;
                        splitObj.OwnerName = prop.OwnerName;
                    }
                    else
                    {
                        splitObj.Partitions.Add(new PropertyPartitionDetailDto
                        {
                            PropertyId = prop.PropertyId,
                            PartitionNo = prop.PartitionNo,
                            PropCategoryDesc = prop.PropCategoryDesc,
                            OwnerName = prop.OwnerName
                        });
                    }
                }
            }
        }

        if (!result.Any())
            return [];

        // ─── Step 6: Deterministic Ordering of Hierarchical Collections ───────────
        foreach (var h in result)
        {
            h.Splits = h.Splits.OrderBy(s => s.PropertyNo).ToList();
            foreach (var s in h.Splits)
            {
                s.Partitions = s.Partitions.OrderBy(p => p.PartitionNo).ToList();
            }
            h.Partitions = h.Partitions.OrderBy(p => p.PartitionNo).ToList();
        }

        return result;
    }

    /// <summary>
    /// Combines composite property number fragments (ward, property number, partition) delimited by hyphens.
    /// </summary>
    /// <param name="propertyNumberParts">Parts of the property number to concatenate.</param>
    /// <returns>A hyphen-separated property string.</returns>
    private static string BuildPropertyNumber(params string?[] propertyNumberParts)
    {
        return string.Join("-", propertyNumberParts.Where(part => !string.IsNullOrWhiteSpace(part)).Select(part => part!.Trim()));
    }
}