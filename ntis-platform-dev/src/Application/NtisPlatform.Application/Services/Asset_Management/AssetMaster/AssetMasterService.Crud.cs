using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetDetails;
using NtisPlatform.Application.DTOs.Asset_Management.AssetDocument;
using NtisPlatform.Application.DTOs.Asset_Management.AssetFieldValue;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using System.Text.Json;

namespace NtisPlatform.Application.Services.Asset_Management
{
    public partial class AssetMasterService
    {
        #region Main CRUD Operations

        /// <summary>
        /// Override GetAllAsync to return all assets with proper pagination using ProjectTo.
        /// Follows the order: Filter -> Search -> Sort -> Count -> Skip/Take -> ProjectTo
        /// Note: FieldValues are excluded from list view for performance.
        /// Use GetByIdAsync to get FieldValues for a specific asset.
        /// When ParentAssetId is provided in queryParameters, returns child assets for that parent.
        /// Otherwise, only returns main assets (those with no ParentAssetId). Sub-assets are excluded.
        /// </summary>
        public override Task<PagedResult<AssetMasterDto>> GetAllAsync(AssetMasterQueryParameters queryParameters, CancellationToken cancellationToken = default)
            => GetAllInternalAsync(queryParameters, cancellationToken);

        /// <summary>
        /// Override GetByIdAsync to include all field values for the asset.
        /// </summary>
        public override async Task<AssetMasterDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            // Single round trip for both counts (previously two near-identical queries over the
            // same child+floor-details join), mirroring the TotalCount/ActiveCount GroupBy pattern
            // used in GetAllInternalAsync.
            var unitFloorStats = await (
                from child in _repository.GetQueryable().AsNoTracking()
                join fd in _floorDetailsRepository.GetQueryable().AsNoTracking()
                    on child.Id equals fd.AssetId
                where child.ParentAssetId == id
                      && !child.MarkedForDeletion
                      && child.IsActive
                      && fd.IsActive
                      && !fd.MarkedForDeletion
                select new { ChildId = child.Id, fd.FloorId }
            )
            .GroupBy(x => 1)
            .Select(g => new
            {
                TotalUnits = g.Select(x => x.ChildId).Distinct().Count(),
                TotalFloors = g.Select(x => x.FloorId).Distinct().Count()
            })
            .FirstOrDefaultAsync(cancellationToken);

            var totalUnits = unitFloorStats?.TotalUnits ?? 0;
            var totalFloors = unitFloorStats?.TotalFloors ?? 0;

            var totalSubUnits = await _repository.GetQueryable().AsNoTracking()
                .CountAsync(c => c.ParentAssetId == id && c.IsActive && !c.MarkedForDeletion, cancellationToken);

            var dto = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(a => a.Id == id && !a.MarkedForDeletion)
                .Select(a => new AssetMasterDto
                {
                    Id = a.Id,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate,
                    AssetNo = a.AssetNo,
                    AssetName = a.AssetName,
                    AssetRegionalName = a.AssetRegionalName,
                    AssetCategoryId = a.AssetCategoryId,
                    AssetTypeId = a.AssetTypeId,
                    ParentAssetId = a.ParentAssetId,
                    HierarchyLevel = a.HierarchyLevel,
                    HierarchyPath = a.HierarchyPath,
                    TotalUnits = totalUnits,
                    TotalSubUnits = totalSubUnits,
                    TotalFloors = totalFloors,
                    OwnershipType = a.OwnershipType,
                    OccupancyStatus = a.OccupancyStatus,
                    EncroachmentStatus = a.EncroachmentStatus,
                    AssetConditionId = a.AssetConditionId,
                    Details = new AssetDetailsDto
                    {
                        Id                  = a.Details != null ? a.Details.Id : 0,
                        AssetId             = a.Details != null ? a.Details.AssetId : 0,
                        OrganizationId      = a.Details != null ? a.Details.OrganizationId : 0,
                        ZoneId              = a.Details != null ? a.Details.ZoneId : null,
                        WardId              = a.Details != null ? a.Details.WardId : null,
                        MoujaId             = a.Details != null ? a.Details.MoujaId : null,
                        SubZoneId           = a.Details != null ? a.Details.SubZoneId : null,
                        PropertyNo          = a.Details != null ? a.Details.PropertyNo : null,
                        UnitNo              = a.Details != null ? a.Details.UnitNo : null,
                        PartitionNo         = a.Details != null ? a.Details.PartitionNo : null,
                        UpicId              = a.Details != null ? a.Details.UpicId : null,
                        PTaxId              = a.Details != null ? a.Details.PTaxId : null,
                        PlotNo              = a.Details != null ? a.Details.PlotNo : null,
                        CSN                 = a.Details != null ? a.Details.CSN : null,
                        MpmsNo              = a.Details != null ? a.Details.MpmsNo : null,
                        LengthFt            = a.Details != null ? a.Details.LengthFt : null,
                        LengthMtr           = a.Details != null ? a.Details.LengthMtr : null,
                        WidthFt             = a.Details != null ? a.Details.WidthFt : null,
                        WidthMtr            = a.Details != null ? a.Details.WidthMtr : null,
                        LandAreaSqFeet      = a.Details != null ? a.Details.LandAreaSqFeet : null,
                        LandAreaSqMeter     = a.Details != null ? a.Details.LandAreaSqMeter : null,
                        Address             = a.Details != null ? a.Details.Address : null,
                        RegionalAddress     = a.Details != null ? a.Details.RegionalAddress : null,
                        PinCode             = a.Details != null ? a.Details.PinCode : null,
                        Latitude            = a.Details != null ? a.Details.Latitude : null,
                        Longitude           = a.Details != null ? a.Details.Longitude : null,
                        InChargeName        = a.Details != null ? a.Details.InChargeName : null,
                        InChargeRegionalName = a.Details != null ? a.Details.InChargeRegionalName : null,
                        InChargeDesignationId = a.Details != null ? a.Details.InChargeDesignationId : null,
                        InChargeMobile      = a.Details != null ? a.Details.InChargeMobile : null,
                        InChargeEmail       = a.Details != null ? a.Details.InChargeEmail : null,
                    },
                    Names = new AssetMasterNamesDto
                    {
                        AssetCategoryName = a.AssetCategory != null ? a.AssetCategory.CategoryName : null,
                        AssetTypeName = a.AssetType != null ? a.AssetType.TypeName : null,
                        AssetWardNo = a.AssetType != null ? a.AssetType.AssetWardNo : null,
                        ParentAssetName = a.ParentAsset != null ? a.ParentAsset.AssetName : null
                    },
                    FieldValues = a.FieldValues!
                        .Where(fv => !fv.MarkedForDeletion)
                        .Select(fv => new AssetFieldValueDto
                        {
                            Id = fv.Id,
                            FieldDefinitionId = fv.FieldDefinitionId,
                            FieldName = fv.FieldName,
                            FieldValue = fv.FieldValue
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (dto != null)
            {
                var locations = await GetLocationInfoByAssetIdsAsync(new[] { dto.Id }, cancellationToken);
                if (locations.TryGetValue(dto.Id, out var location))
                {
                    dto.DepartmentId = location.DepartmentId;
                    ApplyLocation(dto.Details, dto.Names, location);
                }

                if (dto.Details != null && dto.Details.InChargeDesignationId.HasValue)
                {
                    dto.Details.InChargeDesignationName = await _designationRepository.GetQueryable()
                        .AsNoTracking()
                        .Where(d => d.Id == dto.Details.InChargeDesignationId.Value)
                        .Select(d => d.DesignationName)
                        .FirstOrDefaultAsync(cancellationToken);
                }

                if (dto.AssetConditionId.HasValue)
                {
                    var cond = await _conditionRepository.GetQueryable()
                        .AsNoTracking()
                        .Where(c => c.Id == dto.AssetConditionId.Value)
                        .Select(c => new { c.ConditionName, c.ConditionFactor })
                        .FirstOrDefaultAsync(cancellationToken);
                    if (cond != null)
                    {
                        dto.Names.AssetCondition = cond.ConditionName;
                        dto.AssetCondition = cond.ConditionName;
                        dto.AssetConditionFactor = cond.ConditionFactor;
                    }
                }

                // Single round trip for both CapitalValue and AssetLife (previously two separate
                // queries) — both are derived from the same floor-details row set: CapitalValue sums
                // every row (this asset's own + its children's), AssetLife looks only at children's
                // construction years, so the child-only filter is applied in-memory below.
                var floorRows = await _floorDetailsRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(fd => fd.IsActive && !fd.MarkedForDeletion &&
                                 (fd.AssetId == id ||
                                  (fd.Asset!.ParentAssetId == id &&
                                   fd.Asset.IsActive &&
                                   !fd.Asset.MarkedForDeletion)))
                    .Select(fd => new { fd.AssetId, fd.CapitalValue, fd.BuiltUpAreaSqMeter, fd.BuiltUpAreaSqFeet, fd.CarpetAreaSqMeter, fd.CarpetAreaSqFeet, fd.ConstructionYear })
                    .ToListAsync(cancellationToken);

                var capitalValue = floorRows.Sum(x => x.CapitalValue ?? 0m);
                dto.CapitalValue = capitalValue;
                var totalBuiltUp = floorRows.Sum(x => x.BuiltUpAreaSqMeter ?? 0m);
                if (totalBuiltUp > 0) dto.BuiltUpAreaSqMeter = totalBuiltUp;
                var totalBuiltUpSqFt = floorRows.Sum(x => x.BuiltUpAreaSqFeet ?? 0m);
                if (totalBuiltUpSqFt > 0) dto.BuiltUpAreaSqFeet = totalBuiltUpSqFt;
                var totalCarpet = floorRows.Sum(x => x.CarpetAreaSqMeter ?? 0m);
                if (totalCarpet > 0) dto.CarpetAreaSqMeter = totalCarpet;
                var totalCarpetSqFt = floorRows.Sum(x => x.CarpetAreaSqFeet ?? 0m);
                if (totalCarpetSqFt > 0) dto.CarpetAreaSqFeet = totalCarpetSqFt;

                // Resolve AssetLife from child assets' AMS.SubUnitsDetails oldest construction year
                var oldestYearParsed = floorRows
                    .Where(x => x.AssetId != id && x.ConstructionYear != null)
                    .Select(x => ParseConstructionYear(x.ConstructionYear))
                    .Where(y => y.HasValue && y.Value > 0)
                    .OrderBy(y => y.Value)
                    .FirstOrDefault();

                if (oldestYearParsed.HasValue && oldestYearParsed.Value <= DateTime.UtcNow.Year)
                {
                    dto.AssetLife = DateTime.UtcNow.Year - oldestYearParsed.Value;
                }
                else
                {
                    dto.AssetLife = null;
                }

                // Fetch photos directly from AMS.AssetPhoto filtered by AssetId
                dto.Photos = await _assetPhotoRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(p => p.AssetId == id && p.IsLatest && p.IsActive && !p.MarkedForDeletion)
                    .OrderBy(p => p.DisplayOrder)
                    .ThenBy(p => p.PhotoTypeId)
                    .Select(p => new AssetPhotoDto
                    {
                        PhotoId             = p.Id,
                        AssetId             = p.AssetId,
                        PhotoTypeId         = p.PhotoTypeId,
                        PhotoTypeCode       = p.PhotoType != null ? p.PhotoType.PhotoTypeCode : string.Empty,
                        PhotoTypeName       = p.PhotoType != null ? p.PhotoType.PhotoTypeName : string.Empty,
                        DisplayOrder        = p.DisplayOrder,
                        Remarks             = p.Remarks,
                        DocumentBindingId   = p.DocumentBindingId,
                        DocumentGuid        = p.DocumentBinding != null && p.DocumentBinding.Document != null
                                             && p.DocumentBinding.Document.IsActive && !p.DocumentBinding.Document.MarkedForDeletion
                                             ? p.DocumentBinding.Document.DocumentGuid : (Guid?)null,
                        FileName            = p.DocumentBinding != null && p.DocumentBinding.Document != null
                                             && p.DocumentBinding.Document.IsActive && !p.DocumentBinding.Document.MarkedForDeletion
                                             ? p.DocumentBinding.Document.OriginalFileName : null,
                        MimeType            = p.DocumentBinding != null && p.DocumentBinding.Document != null
                                             && p.DocumentBinding.Document.IsActive && !p.DocumentBinding.Document.MarkedForDeletion
                                             ? p.DocumentBinding.Document.MimeType : null,
                    })
                    .ToListAsync(cancellationToken);

                // Fetch documents directly from AMS.AssetDocument filtered by AssetId
                dto.Documents = await _assetDocumentRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(d => d.AssetId == id && d.IsLatest && d.IsActive && !d.MarkedForDeletion)
                    .OrderBy(d => d.DisplayOrder)
                    .ThenBy(d => d.DocumentDefinitionId)
                    .ThenBy(d => d.Id)
                    .Select(d => new AssetDocumentDto
                    {
                        DocumentId = d.Id,
                        AssetId = d.AssetId,
                        DocumentDefinitionId = d.DocumentDefinitionId,
                        DocumentCode = d.DocumentDefinition != null ? d.DocumentDefinition.DocumentCode : string.Empty,
                        DocumentName = d.DocumentDefinition != null ? d.DocumentDefinition.DocumentName : string.Empty,
                        DisplayOrder = d.DisplayOrder,
                        Remarks = d.Remarks,
                        DocumentBindingId = d.DocumentBindingId,
                        DocumentGuid = d.DocumentBinding != null && d.DocumentBinding.Document != null
                                       && d.DocumentBinding.Document.IsActive && !d.DocumentBinding.Document.MarkedForDeletion
                                       ? d.DocumentBinding.Document.DocumentGuid : (Guid?)null,
                        FileName = d.DocumentBinding != null && d.DocumentBinding.Document != null
                                   && d.DocumentBinding.Document.IsActive && !d.DocumentBinding.Document.MarkedForDeletion
                                   ? d.DocumentBinding.Document.OriginalFileName : null,
                        MimeType = d.DocumentBinding != null && d.DocumentBinding.Document != null
                                   && d.DocumentBinding.Document.IsActive && !d.DocumentBinding.Document.MarkedForDeletion
                                   ? d.DocumentBinding.Document.MimeType : null,
                    })
                    .ToListAsync(cancellationToken);

                // Populate photo summary fields (TotalPhotos, AssetPhotoGuid, FloorPlanGuid, GisMapGuid)
                if (dto.Photos != null && dto.Photos.Count > 0)
                {
                    dto.TotalPhotos = dto.Photos.Count;
                    var floorPlan = dto.Photos.FirstOrDefault(x => IsPlanPhotoType(x.PhotoTypeCode, x.PhotoTypeName));
                    var gisMap = dto.Photos.FirstOrDefault(x => IsGisPhotoType(x.PhotoTypeCode, x.PhotoTypeName));
                    var photo = dto.Photos.FirstOrDefault(x => !IsPlanPhotoType(x.PhotoTypeCode, x.PhotoTypeName) && !IsGisPhotoType(x.PhotoTypeCode, x.PhotoTypeName));

                    dto.AssetPhotoGuid = photo?.DocumentGuid;
                    dto.FloorPlanGuid = floorPlan?.DocumentGuid;
                    dto.GisMapGuid = gisMap?.DocumentGuid;
                }
                else
                {
                    dto.TotalPhotos = 0;
                    dto.AssetPhotoGuid = null;
                    dto.FloorPlanGuid = null;
                    dto.GisMapGuid = null;
                }

                // Populate document summary field (AssetDocumentId)
                if (dto.Documents != null && dto.Documents.Count > 0)
                {
                    dto.AssetDocumentId = dto.Documents.Min(d => d.DocumentId);
                }
                else
                {
                    dto.AssetDocumentId = null;
                }

                PopulateFlatProperties(dto);

                var leaseRentRows = await _leaseRentDetailsRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(r => r.IsActive && !r.MarkedForDeletion &&
                                (r.AssetId == id ||
                                 (r.Asset != null && r.Asset.ParentAssetId == id && r.Asset.IsActive && !r.Asset.MarkedForDeletion)))
                    .Select(r => new
                    {
                        r.AssetId,
                        r.RentAmount,
                        r.PaymentFrequency,
                        r.LeaseStartDate,
                        r.LeaseEndDate
                    })
                    .ToListAsync(cancellationToken);

                if (leaseRentRows.Count > 0)
                {
                    dto.AnnualRevenue = leaseRentRows.Sum(r => CalculateAnnualRent(r.RentAmount, r.PaymentFrequency));
                    dto.LeaseStartDate = leaseRentRows.Min(r => (DateTime?)r.LeaseStartDate);
                    dto.LeaseEndDate = leaseRentRows.Where(r => r.LeaseEndDate.HasValue).Select(r => r.LeaseEndDate).Max();
                }

                var healthCalc = AssetHealthScoreCalculator.Calculate(dto);
                dto.HealthScore = healthCalc.HealthPercentage;
                dto.HealthScoreRating = healthCalc.RatingString;
            }

            return dto;
        }



        /// <summary>
        /// Override CreateAsync to handle field values in a transaction.
        /// </summary>
        public override async Task<AssetMasterDto> CreateAsync(CreateAssetMasterDto createDto, CancellationToken cancellationToken = default)
        {
            List<CreateAssetFieldValueDto> fieldValuesList = new();

            if (!string.IsNullOrWhiteSpace(createDto.FieldValuesJson))
            {
                try
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var trimmed = createDto.FieldValuesJson.Trim();
                    List<CreateAssetFieldValueDto>? deserialized = null;
                    if (trimmed.StartsWith("["))
                    {
                        deserialized = JsonSerializer.Deserialize<List<CreateAssetFieldValueDto>>(trimmed, options);
                    }
                    else if (trimmed.StartsWith("{"))
                    {
                        var single = JsonSerializer.Deserialize<CreateAssetFieldValueDto>(trimmed, options);
                        if (single != null)
                        {
                            deserialized = new List<CreateAssetFieldValueDto> { single };
                        }
                    }
                    if (deserialized != null)
                    {
                        fieldValuesList = deserialized;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to deserialize FieldValuesJson in CreateAsync");
                }
            }

            AssetMasterEntity entity = _mapper.Map<AssetMasterEntity>(createDto);
            entity.AssetName ??= string.Empty;
            var shouldRollbackTransaction = true;
            List<AssetPhotoDto>? photoMetadata = null;
            var photoFiles = createDto.PhotoFiles;

            entity.AssetNo = await GenerateAssetNoAsync(createDto.AssetCategoryId, createDto.AssetTypeId, cancellationToken);

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                entity.IsActive = false;
                entity.CreatedDate = DateTime.UtcNow;

                var validationResult = await ValidateForCreateAsync(entity, cancellationToken);
                if (!validationResult.IsValid)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    throw new ValidationException("Validation failed for create operation", validationResult.ToDictionary(), OperationType.Create);
                }

                await _repository.AddAsync(entity, cancellationToken);

                // GenerateAssetNoAsync's sequence lock only guards the max-sequence read, not
                // persistence (coverage roadmap Section B item 5) -- a concurrent create can reserve
                // the same AssetNo before either commits. Retry with a freshly generated number instead
                // of surfacing that race as a client-facing failure; UQ_AssetMaster_AssetNo is the
                // last-resort guard this checks for.
                const int maxAssetNoAttempts = 3;
                for (var assetNoAttempt = 1; ; assetNoAttempt++)
                {
                    try
                    {
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                        break;
                    }
                    catch (DbUpdateException ex) when (assetNoAttempt < maxAssetNoAttempts && IsUniqueAssetNoViolation(ex))
                    {
                        entity.AssetNo = await GenerateAssetNoAsync(createDto.AssetCategoryId, createDto.AssetTypeId, cancellationToken);
                    }
                }

                var details = BuildDetails(createDto, entity.Id, createDto.CreatedBy);
                details.IsActive = false;
                await _detailsRepository.AddAsync(details, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                if (fieldValuesList?.Count > 0)
                {
                    var fieldValues = new List<AssetFieldValueEntity>();
                    foreach (var field in fieldValuesList)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        var fieldValue = new AssetFieldValueEntity
                        {
                            AssetId = entity.Id,
                            FieldDefinitionId = field.FieldDefinitionId,
                            FieldName = field.FieldName,
                            FieldValue = field.FieldValue,
                            CreatedBy = field.CreatedBy ?? createDto.CreatedBy,
                            CreatedDate = DateTime.Now,
                            IsActive = false,
                            MarkedForDeletion = false,
                            MarkedForDeletionDate = null
                        };
                        fieldValues.Add(fieldValue);
                    }
                    await _fieldValueRepository.AddRangeAsync(fieldValues.ToArray(), cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }

                if (photoFiles is { Count: > 0 })
                {
                    photoMetadata = new List<AssetPhotoDto>();

                    if (!string.IsNullOrWhiteSpace(createDto.PhotoMetadataJson))
                    {
                        try
                        {
                            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var trimmed = createDto.PhotoMetadataJson.Trim();
                            photoMetadata = trimmed.StartsWith('{')
                                ? new List<AssetPhotoDto> { JsonSerializer.Deserialize<AssetPhotoDto>(trimmed, options)! }
                                : JsonSerializer.Deserialize<List<AssetPhotoDto>>(trimmed, options) ?? [];
                        }
                        catch (JsonException)
                        {
                            throw new ValidationException(
                                "Photo metadata JSON is invalid.",
                                new Dictionary<string, string>
                                {
                                    ["PhotoMetadataJson"] = "Provide valid JSON (object or array) for photo metadata."
                                },
                                OperationType.Create);
                        }
                    }

                    if (photoFiles.Count != photoMetadata.Count)
                    {
                        throw new ValidationException(
                            "PhotoFiles count must match photo metadata count.",
                            new Dictionary<string, string>
                            {
                                ["PhotoFiles"] = "Each file must have matching metadata at same index."
                            },
                            OperationType.Create);
                    }
                }

                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                shouldRollbackTransaction = false;

                if (photoFiles is { Count: > 0 } && photoMetadata is not null)
                {
                    var deptEntity = (await _deptMasterRepository.GetAsync(
                        d => d.DepartmentName != null && d.DepartmentName.ToLower().Contains("asset"),
                        cancellationToken)).FirstOrDefault();
                    var modEntity = (await _moduleMasterRepository.GetAsync(
                        m => m.ModuleName != null && m.ModuleName.ToLower().Contains("asset"),
                        cancellationToken)).FirstOrDefault();

                    var dynamicDeptId = deptEntity?.Id ?? 3;
                    var dynamicModId = modEntity?.Id ?? 2;

                    var bulkDto = new AssetPhotoBulkSaveDto
                    {
                        AssetId = entity.Id,
                        Photos = photoMetadata.Select(m => new AssetPhotoItemDto
                        {
                            PhotoTypeId = m.PhotoTypeId,
                            DisplayOrder = m.DisplayOrder ?? 0,
                            Remarks = m.Remarks,
                            IsEnabled = true
                        }).ToList()
                    };

                    var savedPhotosResponse = await _assetPhotoApplicationService.BulkSaveAllAsync(bulkDto, createDto.CreatedBy ?? 1, cancellationToken);

                    for (var i = 0; i < photoFiles.Count; i++)
                    {
                        cancellationToken.ThrowIfCancellationRequested();

                        var file = photoFiles[i];
                        var meta = photoMetadata[i];

                        if (file == null || file.Length <= 0)
                            continue;

                        var registeredSlot = savedPhotosResponse.UpdatedPhotoTypes
                            .FirstOrDefault(x => x.PhotoTypeId == meta.PhotoTypeId);

                        if (registeredSlot?.PhotoId == null)
                            continue;

                        await using var fileStream = file.OpenReadStream();
                        await _documentApplicationService.UploadDocumentAsync(
                            fileStream,
                            file.FileName,
                            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                            file.Length,
                            new DocumentUploadDto
                            {
                                ReferenceTableName = "AssetPhoto",
                                ReferenceTableId = registeredSlot.PhotoId.Value,
                                ModuleId = dynamicModId,
                                DepartmentId = dynamicDeptId,
                                DocumentType = registeredSlot.PhotoTypeCode,
                                AuthDepartmentId = dynamicDeptId,
                                IsPrimaryDocument = true
                            },
                            uploadedBy: createDto.CreatedBy ?? 1,
                            cancellationToken: cancellationToken);
                    }
                }

                var savedDto = await GetByIdAsync(entity.Id, cancellationToken);
                if (savedDto is null)
                {
                    throw new InvalidOperationException($"Asset was created but could not be reloaded. AssetId: {entity.Id}");
                }
                return savedDto;
            }
            catch (ValidationException)
            {
                if (shouldRollbackTransaction)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                }
                throw;
            }
            catch
            {
                if (shouldRollbackTransaction)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                }
                throw;
            }
        }

        /// <summary>
        /// Override UpdateAsync to handle field values in a transaction.
        /// Supports create, update, and delete of field values.
        /// </summary>
        public override async Task<AssetMasterDto?> UpdateAsync(int id, UpdateAssetMasterDto updateDto, CancellationToken cancellationToken = default)
        {
            var entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity == null)
                return default;
            var currentEntitySnapshot = await _repository.GetQueryable()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
            if (currentEntitySnapshot == null)
                return default;

            List<AssetPhotoDto>? photoMetadata = null;
            var photoFiles = updateDto.PhotoFiles;

            if (photoFiles is { Count: > 0 })
            {
                photoMetadata = new List<AssetPhotoDto>();

                if (!string.IsNullOrWhiteSpace(updateDto.PhotoMetadataJson))
                {
                    try
                    {
                        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var trimmed = updateDto.PhotoMetadataJson.Trim();
                        photoMetadata = trimmed.StartsWith('{')
                            ? new List<AssetPhotoDto> { JsonSerializer.Deserialize<AssetPhotoDto>(trimmed, options)! }
                            : JsonSerializer.Deserialize<List<AssetPhotoDto>>(trimmed, options) ?? [];
                    }
                    catch (JsonException)
                    {
                        throw new ValidationException(
                            "Photo metadata JSON is invalid.",
                            new Dictionary<string, string>
                            {
                                ["PhotoMetadataJson"] = "Provide valid JSON array for photo metadata."
                            },
                            OperationType.Update);
                    }
                }

                if (photoFiles.Count != photoMetadata.Count)
                {
                    throw new ValidationException(
                        "PhotoFiles count must match photo metadata count.",
                        new Dictionary<string, string>
                        {
                            ["PhotoFiles"] = "Each file must have matching metadata at same index."
                        },
                        OperationType.Update);
                }
            }

            var shouldRollbackTransaction = true;
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var oldCategoryId = entity.AssetCategoryId;
                var oldTypeId = entity.AssetTypeId;

                _mapper.Map(updateDto, entity);
                entity.AssetName ??= string.Empty;
                entity.UpdatedDate = DateTime.UtcNow;

                var assetNoRegenerated = false;
                if (oldCategoryId != entity.AssetCategoryId || oldTypeId != entity.AssetTypeId || string.IsNullOrWhiteSpace(entity.AssetNo))
                {
                    entity.AssetNo = await GenerateAssetNoAsync(entity.AssetCategoryId, entity.AssetTypeId, cancellationToken);
                    assetNoRegenerated = true;
                }
                var validationResult = await ValidateForDeactivationAsync(id, currentEntitySnapshot, entity, cancellationToken);
                if (!validationResult.IsValid)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    throw new ValidationException("Validation failed for update operation", validationResult.ToDictionary(), OperationType.Update);
                }
                await _repository.UpdateAsync(entity, cancellationToken);

                var details = await _detailsRepository.GetQueryable()
                    .FirstOrDefaultAsync(d => d.AssetId == id, cancellationToken);
                if (details != null)
                {
                    ApplyDetailsUpdate(updateDto, details, updateDto.UpdatedBy);
                    await _detailsRepository.UpdateAsync(details, cancellationToken);
                }
                // AMS.AssetDetails is 1:1 with a PARENT asset only — a child (shop/unit/floor) never
                // gets its own row; its Zone/Ward/Address are resolved from the parent's row instead
                // (see GetLocationInfoByAssetIdsAsync). Without this guard, updating a child asset
                // that has no row yet (e.g. from the lease/rent registration flow) would create one.
                else if (entity.ParentAssetId == null)
                {
                    var newDetails = new AssetDetailsEntity
                    {
                        AssetId        = id,
                        OrganizationId = updateDto.OrganizationId,
                        ZoneId         = updateDto.ZoneId,
                        WardId         = updateDto.WardId,
                        MoujaId        = updateDto.MoujaId,
                        SubZoneId      = updateDto.SubZoneId,
                        PropertyNo     = updateDto.PropertyNo,
                        PartitionNo    = updateDto.PartitionNo,
                        UpicId         = updateDto.UpicId,
                        PTaxId         = updateDto.PTaxId,
                        PlotNo         = updateDto.PlotNo,
                        CSN            = updateDto.CSN,
                        MpmsNo         = updateDto.MpmsNo,
                        LengthMtr       = updateDto.TotalLength,
                        WidthMtr        = updateDto.AverageWidth,
                        LandAreaSqMeter = updateDto.LandAreaSqMeter,
                        LengthFt        = updateDto.LengthFt,
                        WidthFt         = updateDto.WidthFt,
                        LandAreaSqFeet  = updateDto.LandAreaSqFeet,
                        Address        = updateDto.Address,
                        RegionalAddress = updateDto.RegionalAddress,
                        PinCode        = updateDto.PinCode,
                        Latitude       = updateDto.Latitude,
                        Longitude      = updateDto.Longitude,
                        InChargeName        = updateDto.InChargeName,
                        InChargeRegionalName = updateDto.InChargeRegionalName,
                        InChargeDesignationId = updateDto.InChargeDesignationId,
                        InChargeMobile      = updateDto.InChargeMobile,
                        InChargeEmail       = updateDto.InChargeEmail,
                        IsActive = true,
                        CreatedBy = updateDto.UpdatedBy,
                        CreatedDate = DateTime.UtcNow,
                        MarkedForDeletion = false,
                        MarkedForDeletionDate = null
                    };
                    await _detailsRepository.AddAsync(newDetails, cancellationToken);
                }
                if (updateDto.FieldValues != null)
                {
                    var existingFieldValues = await _fieldValueRepository.GetQueryable()
                        .Where(fv => fv.AssetId == id)
                        .ToListAsync(cancellationToken);

                    static string NormalizeFieldName(string? fieldName) => (fieldName ?? string.Empty).Trim().ToLowerInvariant();
                    var duplicateFieldNames = updateDto.FieldValues
                        .GroupBy(fv => NormalizeFieldName(fv.FieldName))
                        .Where(g => !string.IsNullOrWhiteSpace(g.Key) && g.Count() > 1)
                        .Select(g => g.First().FieldName)
                        .ToList();

                    if (duplicateFieldNames.Count > 0)
                    {
                        throw new InvalidOperationException(
                            $"Duplicate field values are not allowed for the same asset. Duplicate fields: {string.Join(", ", duplicateFieldNames)}");
                    }

                    // Pre-index existing field values by Id and by normalized name (first occurrence
                    // wins, same as the FirstOrDefault scans below) so each incoming fieldDto resolves
                    // its match in O(1) instead of scanning existingFieldValues twice per iteration.
                    var existingById = new Dictionary<int, AssetFieldValueEntity>();
                    var existingByNormalizedName = new Dictionary<string, AssetFieldValueEntity>();
                    foreach (var fv in existingFieldValues)
                    {
                        existingById[fv.Id] = fv;
                        var key = NormalizeFieldName(fv.FieldName);
                        if (!existingByNormalizedName.ContainsKey(key))
                        {
                            existingByNormalizedName[key] = fv;
                        }
                    }

                    foreach (var fieldDto in updateDto.FieldValues)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        AssetFieldValueEntity? targetFieldValue = null;

                        if (fieldDto.Id.HasValue)
                        {
                            existingById.TryGetValue(fieldDto.Id.Value, out targetFieldValue);
                        }
                        if (targetFieldValue == null)
                        {
                            var normalizedFieldName = NormalizeFieldName(fieldDto.FieldName);
                            existingByNormalizedName.TryGetValue(normalizedFieldName, out targetFieldValue);
                        }
                        if (targetFieldValue != null)
                        {
                            targetFieldValue.FieldDefinitionId = fieldDto.FieldDefinitionId;
                            targetFieldValue.FieldName = fieldDto.FieldName;
                            targetFieldValue.FieldValue = fieldDto.FieldValue;
                            targetFieldValue.IsActive = true;
                            targetFieldValue.MarkedForDeletion = false;
                            targetFieldValue.MarkedForDeletionDate = null;
                            targetFieldValue.UpdatedDate = DateTime.Now;
                            targetFieldValue.UpdatedBy = fieldDto.UpdatedBy ?? updateDto.UpdatedBy;
                            // Backfill rows saved before CreatedBy was captured. CreatedBy is a concurrency
                            // token, so if another request backfilled this row first, SaveChanges fails
                            // (see the DbUpdateConcurrencyException catch below) rather than overwriting it.
                            targetFieldValue.CreatedBy ??= fieldDto.CreatedBy ?? updateDto.UpdatedBy;
                            await _fieldValueRepository.UpdateAsync(targetFieldValue, cancellationToken);
                        }
                        else
                        {
                            var newFieldValue = new AssetFieldValueEntity
                            {
                                AssetId = id,
                                FieldDefinitionId = fieldDto.FieldDefinitionId,
                                FieldName = fieldDto.FieldName,
                                FieldValue = fieldDto.FieldValue,
                                CreatedBy = fieldDto.CreatedBy ?? updateDto.UpdatedBy,
                                CreatedDate = DateTime.Now,
                                IsActive = true,
                                MarkedForDeletion = false,
                                MarkedForDeletionDate = null
                            };
                            await _fieldValueRepository.AddAsync(newFieldValue, cancellationToken);
                        }
                    }
                }

                // See the matching comment in CreateAsync: GenerateAssetNoAsync's sequence lock only
                // guards the max-sequence read, not persistence, so a concurrent request can reserve
                // the same AssetNo before either commits. Only retry here when this call actually
                // regenerated the number -- an update that didn't touch AssetNo hitting this unique
                // index would indicate a different, unrelated problem worth surfacing as-is.
                const int maxAssetNoAttempts = 3;
                for (var assetNoAttempt = 1; ; assetNoAttempt++)
                {
                    try
                    {
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                        break;
                    }
                    catch (DbUpdateException ex) when (assetNoRegenerated && assetNoAttempt < maxAssetNoAttempts && IsUniqueAssetNoViolation(ex))
                    {
                        entity.AssetNo = await GenerateAssetNoAsync(entity.AssetCategoryId, entity.AssetTypeId, cancellationToken);
                    }
                }
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                shouldRollbackTransaction = false;

                if (photoFiles is { Count: > 0 } && photoMetadata is not null)
                {
                    var deptEntity = (await _deptMasterRepository.GetAsync(
                        d => d.DepartmentName != null && d.DepartmentName.ToLower().Contains("asset"),
                        cancellationToken)).FirstOrDefault();
                    var modEntity = (await _moduleMasterRepository.GetAsync(
                        m => m.ModuleName != null && m.ModuleName.ToLower().Contains("asset"),
                        cancellationToken)).FirstOrDefault();

                    var dynamicDeptId = deptEntity?.Id ?? 3;
                    var dynamicModId = modEntity?.Id ?? 2;

                    var bulkDto = new AssetPhotoBulkSaveDto
                    {
                        AssetId = id,
                        Photos = photoMetadata.Select(m => new AssetPhotoItemDto
                        {
                            PhotoTypeId = m.PhotoTypeId,
                            DisplayOrder = m.DisplayOrder ?? 0,
                            Remarks = m.Remarks,
                            IsEnabled = true
                        }).ToList()
                    };

                    var savedPhotosResponse = await _assetPhotoApplicationService.BulkSaveAllAsync(bulkDto, updateDto.UpdatedBy ?? 1, cancellationToken);

                    for (var i = 0; i < photoFiles.Count; i++)
                    {
                        cancellationToken.ThrowIfCancellationRequested();

                        var file = photoFiles[i];
                        var meta = photoMetadata[i];

                        if (file == null || file.Length <= 0)
                            continue;

                        var registeredSlot = savedPhotosResponse.UpdatedPhotoTypes
                            .FirstOrDefault(x => x.PhotoTypeId == meta.PhotoTypeId);

                        if (registeredSlot?.PhotoId == null)
                            continue;

                        await using var fileStream = file.OpenReadStream();
                        await _documentApplicationService.UploadDocumentAsync(
                            fileStream,
                            file.FileName,
                            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                            file.Length,
                            new DocumentUploadDto
                            {
                                ReferenceTableName = "AssetPhoto",
                                ReferenceTableId = registeredSlot.PhotoId.Value,
                                ModuleId = dynamicModId,
                                DepartmentId = dynamicDeptId,
                                DocumentType = registeredSlot.PhotoTypeCode,
                                AuthDepartmentId = dynamicDeptId,
                                IsPrimaryDocument = true
                            },
                            uploadedBy: updateDto.UpdatedBy ?? 1,
                            cancellationToken: cancellationToken);
                    }
                }

                return await GetByIdAsync(id, cancellationToken);
            }
            catch (ValidationException)
            {
                if (shouldRollbackTransaction)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                }
                throw;
            }
            catch (DbUpdateConcurrencyException) when (shouldRollbackTransaction)
            {
                // Another request backfilled the CreatedBy (a concurrency token) of a field value this
                // request also backfilled. ExecuteUpdate turns anything but a ValidationException into a
                // 500, so surface the lost race as a 400 the client can retry. Only before the commit:
                // the photo uploads after it write tables with their own row versions.
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw new ValidationException(
                    nameof(updateDto.FieldValues),
                    "AMS_AssetMaster_ConcurrentModification",
                    OperationType.Update);
            }
            catch
            {
                if (shouldRollbackTransaction)
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                }
                throw;
            }
        }

        /// <summary>
        /// Override DeleteAsync to soft delete field values along with the asset.
        /// </summary>
        public override async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity == null)
                return false;
            var validationResult = await ValidateForDeleteAsync(id, entity, cancellationToken);
            if (!validationResult.IsValid)
            {
                var firstError = validationResult.Errors.FirstOrDefault()?.ErrorMessage ?? "Validation failed for delete operation";
                throw new ValidationException(firstError, validationResult.ToDictionary(), OperationType.Delete);
            }
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var fieldValues = await _fieldValueRepository.GetQueryable()
                    .Where(fv => fv.AssetId == id && fv.IsActive)
                    .ToListAsync(cancellationToken);
                foreach (var fieldValue in fieldValues)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    fieldValue.IsActive = false;
                    fieldValue.MarkedForDeletion = true;
                    fieldValue.MarkedForDeletionDate = DateTime.Now;
                    fieldValue.UpdatedDate = DateTime.Now;
                    await _fieldValueRepository.UpdateAsync(fieldValue, cancellationToken);
                }

                var details = await _detailsRepository.GetQueryable()
                    .FirstOrDefaultAsync(d => d.AssetId == id && d.IsActive, cancellationToken);
                if (details != null)
                {
                    details.IsActive = false;
                    details.MarkedForDeletion = true;
                    details.MarkedForDeletionDate = DateTime.Now;
                    details.UpdatedDate = DateTime.Now;
                    await _detailsRepository.UpdateAsync(details, cancellationToken);
                }

                entity.MarkedForDeletion = true;
                entity.MarkedForDeletionDate = DateTime.Now;
                entity.UpdatedDate = DateTime.Now;
                await _repository.DeleteAsync(entity, cancellationToken);
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

        #endregion

        #region CRUD Helper Methods

        private static decimal CalculateAnnualRent(decimal? rentAmount, string? paymentFrequency)
        {
            if (!rentAmount.HasValue || rentAmount.Value <= 0m) return 0m;
            var freq = (paymentFrequency ?? "").Trim().ToLowerInvariant();
            if (freq.Contains("quarter"))
            {
                return rentAmount.Value * 4m;
            }
            if (freq.Contains("half"))
            {
                return rentAmount.Value * 2m;
            }
            if (freq.Contains("one-time") || freq.Contains("one time") ||
                freq.Contains("year") || freq.Contains("annual") || freq.Contains("annum") || freq == "2")
            {
                return rentAmount.Value * 1m;
            }
            return rentAmount.Value * 12m;
        }


        private static AssetDetailsEntity BuildDetails(CreateAssetMasterDto dto, int assetId, int? userId)
            => new()
            {
                AssetId        = assetId,
                OrganizationId = dto.OrganizationId,
                ZoneId         = dto.ZoneId,
                WardId         = dto.WardId,
                MoujaId        = dto.MoujaId,
                SubZoneId      = dto.SubZoneId,
                PropertyNo     = dto.PropertyNo,
                PartitionNo    = dto.PartitionNo,
                UpicId         = dto.UpicId,
                PTaxId         = dto.PTaxId,
                PlotNo         = dto.PlotNo,
                CSN            = dto.CSN,
                MpmsNo         = dto.MpmsNo,
                LengthMtr       = dto.TotalLength,
                WidthMtr        = dto.AverageWidth,
                LandAreaSqMeter = dto.LandAreaSqMeter,
                LengthFt        = dto.LengthFt,
                WidthFt         = dto.WidthFt,
                LandAreaSqFeet  = dto.LandAreaSqFeet,
                Address        = dto.Address,
                RegionalAddress = dto.RegionalAddress,
                PinCode        = dto.PinCode,
                Latitude       = dto.Latitude,
                Longitude      = dto.Longitude,
                InChargeName        = dto.InChargeName,
                InChargeRegionalName = dto.InChargeRegionalName,
                InChargeDesignationId = dto.InChargeDesignationId,
                InChargeMobile      = dto.InChargeMobile,
                InChargeEmail       = dto.InChargeEmail,
                IsActive       = true,
                CreatedBy      = userId,
                CreatedDate    = DateTime.UtcNow,
                MarkedForDeletion = false
            };

        private static void ApplyDetailsUpdate(UpdateAssetMasterDto dto, AssetDetailsEntity d, int? userId)
        {
            d.OrganizationId = dto.OrganizationId;
            d.ZoneId         = dto.ZoneId;
            d.WardId         = dto.WardId;
            d.MoujaId        = dto.MoujaId;
            d.SubZoneId      = dto.SubZoneId;
            d.PropertyNo     = dto.PropertyNo;
            d.PartitionNo    = dto.PartitionNo;
            d.UpicId         = dto.UpicId;
            d.PTaxId         = dto.PTaxId;
            d.PlotNo         = dto.PlotNo;
            d.CSN            = dto.CSN;
            d.MpmsNo         = dto.MpmsNo;
            d.LengthMtr       = dto.TotalLength;
            d.WidthMtr        = dto.AverageWidth;
            d.LandAreaSqMeter = dto.LandAreaSqMeter;
            d.LengthFt        = dto.LengthFt;
            d.WidthFt         = dto.WidthFt;
            d.LandAreaSqFeet  = dto.LandAreaSqFeet;
            d.Address        = dto.Address;
            d.RegionalAddress = dto.RegionalAddress;
            d.PinCode        = dto.PinCode;
            d.Latitude       = dto.Latitude;
            d.Longitude      = dto.Longitude;
            d.InChargeName        = dto.InChargeName;
            d.InChargeRegionalName = dto.InChargeRegionalName;
            d.InChargeDesignationId = dto.InChargeDesignationId;
            d.InChargeMobile      = dto.InChargeMobile;
            d.InChargeEmail       = dto.InChargeEmail;
            d.UpdatedBy      = userId;
            d.UpdatedDate    = DateTime.UtcNow;
        }

        private async Task<PagedResult<AssetMasterDto>> GetAllInternalAsync(AssetMasterQueryParameters queryParameters, CancellationToken cancellationToken)
        {
            var query = BuildAssetListQuery(queryParameters);

            var stats = await query
                .GroupBy(a => 1)
                .Select(g => new
                {
                    TotalCount = g.Count(),
                    ActiveCount = g.Count(a => a.IsActive)
                })
                .FirstOrDefaultAsync(cancellationToken);

            var totalCount = stats?.TotalCount ?? 0;
            var activeAssetsCount = stats?.ActiveCount ?? 0;

            int totalSubUnitsCount = 0;
            if (totalCount > 0)
            {
                var matchingAssetIdsQuery = query.Select(a => a.Id);
                if (queryParameters.ParentAssetId.HasValue)
                {
                    totalSubUnitsCount = totalCount;
                }
                else
                {
                    totalSubUnitsCount = await _repository.GetQueryable()
                        .AsNoTracking()
                        .CountAsync(a => a.ParentAssetId.HasValue && matchingAssetIdsQuery.Contains(a.ParentAssetId.Value) && a.IsActive && !a.MarkedForDeletion, cancellationToken);
                }
            }

            decimal totalCapitalValue = 0m;
            decimal totalAnnualRevenue = 0m;
            decimal totalOutstanding = 0m;
            int encroachmentsCount = 0;
            decimal? avgHealthScore = null;
            if (totalCount > 0)
            {
                var matchingAssetIdsQuery = query.Select(a => a.Id);
                totalCapitalValue = await _floorDetailsRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(fd => fd.IsActive && !fd.MarkedForDeletion &&
                                 (matchingAssetIdsQuery.Contains(fd.AssetId) ||
                                  (fd.Asset!.ParentAssetId.HasValue &&
                                   fd.Asset.IsActive &&
                                   !fd.Asset.MarkedForDeletion &&
                                   matchingAssetIdsQuery.Contains(fd.Asset.ParentAssetId.Value))))
                    .SumAsync(fd => fd.CapitalValue ?? 0m, cancellationToken);

                var matchingAssetAndChildIdsQuery = _repository.GetQueryable()
                    .AsNoTracking()
                    .Where(a => a.IsActive && !a.MarkedForDeletion &&
                                (matchingAssetIdsQuery.Contains(a.Id) ||
                                 (a.ParentAssetId.HasValue && matchingAssetIdsQuery.Contains(a.ParentAssetId.Value))))
                    .Select(a => a.Id);

                encroachmentsCount = await _repository.GetQueryable()
                    .AsNoTracking()
                    .Where(a => a.IsActive && !a.MarkedForDeletion &&
                                matchingAssetAndChildIdsQuery.Contains(a.Id) &&
                                a.EncroachmentStatus != null &&
                                (a.EncroachmentStatus == "Partially Encroached" ||
                                 a.EncroachmentStatus == "Fully Encroached"))
                    .CountAsync(cancellationToken);

                var allMatchingLeaseRows = await _leaseRentDetailsRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(r => r.IsActive && !r.MarkedForDeletion && matchingAssetAndChildIdsQuery.Contains(r.AssetId))
                    .Select(r => new
                    {
                        r.RentAmount,
                        r.PaymentFrequency
                    })
                    .ToListAsync(cancellationToken);

                totalAnnualRevenue = allMatchingLeaseRows.Sum(r => CalculateAnnualRent(r.RentAmount, r.PaymentFrequency));

                if (_demandRepository != null)
                {
                    totalOutstanding = await _demandRepository.GetQueryable()
                        .AsNoTracking()
                        .Where(d => d.IsActive && d.DemandStatus != "Cancelled" && matchingAssetAndChildIdsQuery.Contains(d.AssetId))
                        .SumAsync(d => (decimal?)(d.MonthlyRentAmount + d.PenaltyAmount + d.GSTAmount - d.PaidAmount), cancellationToken) ?? 0m;
                }

                var matchingAssetIds = await matchingAssetIdsQuery.ToListAsync(cancellationToken);
                var healthScoresById = await ComputeHealthScoresForAssetIdsAsync(matchingAssetIds, cancellationToken);
                if (healthScoresById.Count > 0)
                {
                    avgHealthScore = Math.Round(healthScoresById.Values.Select(v => v.Score).Average(), 0);
                }
            }

            query = ApplyAssetListSort(query, queryParameters);
            int pageNumber = queryParameters.PageNumber;
            int pageSize = queryParameters.PageSize;
            if (pageSize != -1)
            {
                query = query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize);
            }
            else
            {
                pageSize = totalCount > 0 ? totalCount : 1;
                pageNumber = 1;
            }
            var items = await query
                .Select(a => new AssetMasterDto
                {
                    Id = a.Id,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate,
                    AssetNo = a.AssetNo,
                    AssetName = a.AssetName,
                    AssetRegionalName = a.AssetRegionalName,
                    AssetCategoryId = a.AssetCategoryId,
                    AssetTypeId = a.AssetTypeId,
                    ParentAssetId = a.ParentAssetId,
                    HierarchyLevel = a.HierarchyLevel,
                    HierarchyPath = a.HierarchyPath,
                    OwnershipType = a.OwnershipType,
                    OccupancyStatus = a.OccupancyStatus,
                    EncroachmentStatus = a.EncroachmentStatus,
                    AssetConditionId = a.AssetConditionId,
                    Details = new AssetDetailsDto
                    {
                        Id = a.Details != null ? a.Details.Id : 0,
                        AssetId = a.Details != null ? a.Details.AssetId : 0,
                        OrganizationId = a.Details != null ? a.Details.OrganizationId : 0,
                        ZoneId = a.Details != null ? a.Details.ZoneId : null,
                        WardId = a.Details != null ? a.Details.WardId : null,
                        MoujaId = a.Details != null ? a.Details.MoujaId : null,
                        SubZoneId = a.Details != null ? a.Details.SubZoneId : null,
                        PropertyNo = a.Details != null ? a.Details.PropertyNo : null,
                        UnitNo = a.Details != null ? a.Details.UnitNo : null,
                        PartitionNo = a.Details != null ? a.Details.PartitionNo : null,
                        PlotNo = a.Details != null ? a.Details.PlotNo : null,
                        CSN = a.Details != null ? a.Details.CSN : null,
                        MpmsNo = a.Details != null ? a.Details.MpmsNo : null,
                        UpicId = a.Details != null ? a.Details.UpicId : null,
                        LengthFt = a.Details != null ? a.Details.LengthFt : null,
                        LengthMtr = a.Details != null ? a.Details.LengthMtr : null,
                        WidthFt = a.Details != null ? a.Details.WidthFt : null,
                        WidthMtr = a.Details != null ? a.Details.WidthMtr : null,
                        LandAreaSqFeet = a.Details != null ? a.Details.LandAreaSqFeet : null,
                        LandAreaSqMeter = a.Details != null ? a.Details.LandAreaSqMeter : null,
                        Address = a.Details != null ? a.Details.Address : null,
                        RegionalAddress = a.Details != null ? a.Details.RegionalAddress : null,
                        PinCode = a.Details != null ? a.Details.PinCode : null,
                        Latitude = a.Details != null ? a.Details.Latitude : null,
                        Longitude = a.Details != null ? a.Details.Longitude : null,
                        InChargeName = a.Details != null ? a.Details.InChargeName : null,
                        InChargeRegionalName = a.Details != null ? a.Details.InChargeRegionalName : null,
                        InChargeDesignationId = a.Details != null ? a.Details.InChargeDesignationId : null,
                        InChargeMobile = a.Details != null ? a.Details.InChargeMobile : null,
                        InChargeEmail = a.Details != null ? a.Details.InChargeEmail : null
                    },
                    Names = new AssetMasterNamesDto
                    {
                        AssetCategoryName = a.AssetCategory != null ? a.AssetCategory.CategoryName : null,
                        AssetTypeName = a.AssetType != null ? a.AssetType.TypeName : null,
                        AssetWardNo = a.AssetType != null ? a.AssetType.AssetWardNo : null,
                        ParentAssetName = a.ParentAsset != null ? a.ParentAsset.AssetName : null
                    }
                })
                .ToListAsync(cancellationToken);

            if (items.Count > 0)
            {
                var assetIds = items.Select(x => x.Id).ToList();
                var assetImages = await _assetPhotoRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(p => p.IsActive && !p.MarkedForDeletion && p.IsLatest && assetIds.Contains(p.AssetId) && p.DocumentBinding != null)
                    .Select(p => new {
                        p.AssetId,
                        p.Remarks,
                        DocumentId = p.DocumentBinding!.DocumentId,
                        DocumentGuid = p.DocumentBinding.Document != null &&
                                       p.DocumentBinding.Document.IsActive &&
                                       !p.DocumentBinding.Document.MarkedForDeletion
                                       ? p.DocumentBinding.Document.DocumentGuid : (Guid?)null,
                        PhotoTypeCode = p.PhotoType != null ? p.PhotoType.PhotoTypeCode : null,
                        PhotoTypeName = p.PhotoType != null ? p.PhotoType.PhotoTypeName : null
                    })
                    .ToListAsync(cancellationToken);

                var assetPhotosCounts = await _assetPhotoRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(p => p.IsActive && !p.MarkedForDeletion && p.IsLatest && assetIds.Contains(p.AssetId) && p.DocumentBinding != null)
                    .GroupBy(p => p.AssetId)
                    .Select(g => new { AssetId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(g => g.AssetId, g => g.Count, cancellationToken);

                var assetDocumentInfo = await _assetDocumentRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(d => d.IsActive && !d.MarkedForDeletion && d.IsLatest && assetIds.Contains(d.AssetId))
                    .GroupBy(d => d.AssetId)
                    .Select(g => new { AssetId = g.Key, FirstDocumentId = g.Min(d => d.Id), Count = g.Count() })
                    .ToDictionaryAsync(g => g.AssetId, g => g, cancellationToken);

                var childUnitRows = await (
                    from child in _repository.GetQueryable().AsNoTracking()
                    join fd in _floorDetailsRepository.GetQueryable().AsNoTracking()
                        on child.Id equals fd.AssetId
                    where child.ParentAssetId.HasValue
                          && assetIds.Contains(child.ParentAssetId.Value)
                          && !child.MarkedForDeletion
                          && child.IsActive
                          && fd.IsActive
                          && !fd.MarkedForDeletion
                    select new
                    {
                        ParentAssetId = child.ParentAssetId!.Value,
                        ChildId = child.Id,
                        fd.ConstructionYear
                    })
                    .ToListAsync(cancellationToken);

                var subUnitCounts = childUnitRows
                    .GroupBy(x => x.ParentAssetId)
                    .ToDictionary(g => g.Key, g => g.Select(x => x.ChildId).Distinct().Count());

                var conditionIds = items.Where(x => x.AssetConditionId.HasValue)
                    .Select(x => x.AssetConditionId!.Value).Distinct().ToList();
                var conditionNames = conditionIds.Count == 0
                    ? new Dictionary<int, string?>()
                    : await _conditionRepository.GetQueryable()
                        .AsNoTracking()
                        .Where(c => conditionIds.Contains(c.Id))
                        .ToDictionaryAsync(c => c.Id, c => (string?)c.ConditionName, cancellationToken);

                var oldestConstructionYearByAsset = childUnitRows
                    .Where(x => x.ConstructionYear != null)
                    .Select(x => new
                    {
                        x.ParentAssetId,
                        Year = ParseConstructionYear(x.ConstructionYear)
                    })
                    .Where(x => x.Year.HasValue && x.Year.Value > 0)
                    .GroupBy(x => x.ParentAssetId)
                    .ToDictionary(g => g.Key, g => g.Min(x => x.Year!.Value));

                int currentYear = DateTime.UtcNow.Year;
                foreach (var item in items)
                {
                    var itemPhotos = assetImages.Where(x => x.AssetId == item.Id).ToList();

                    var floorPlan = itemPhotos.FirstOrDefault(x => IsPlanPhotoType(x.PhotoTypeCode, x.PhotoTypeName));
                    var gisMap = itemPhotos.FirstOrDefault(x => IsGisPhotoType(x.PhotoTypeCode, x.PhotoTypeName));
                    var photo = itemPhotos.FirstOrDefault(x => !IsPlanPhotoType(x.PhotoTypeCode, x.PhotoTypeName) && !IsGisPhotoType(x.PhotoTypeCode, x.PhotoTypeName));

                    item.AssetPhotoGuid = photo?.DocumentGuid;
                    item.FloorPlanGuid = floorPlan?.DocumentGuid;
                    item.GisMapGuid = gisMap?.DocumentGuid;

                    item.AssetDocumentId = assetDocumentInfo.TryGetValue(item.Id, out var docInfo) ? docInfo.FirstDocumentId : (int?)null;
                    item.TotalPhotos = assetPhotosCounts.TryGetValue(item.Id, out var photoCount) ? photoCount : 0;

                    item.TotalSubUnits = subUnitCounts.TryGetValue(item.Id, out var subUnitCount) ? subUnitCount : 0;

                    if (item.AssetConditionId.HasValue &&
                        conditionNames.TryGetValue(item.AssetConditionId.Value, out var conditionName))
                    {
                        item.Names.AssetCondition = conditionName;
                    }

                    if (oldestConstructionYearByAsset.TryGetValue(item.Id, out var oldestYear) &&
                        oldestYear > 0 &&
                        oldestYear <= currentYear)
                    {
                        item.AssetLife = currentYear - oldestYear;
                    }
                    else
                    {
                        item.AssetLife = null;
                    }
                }

                var floorAggregates = await _floorDetailsRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(fd => fd.IsActive && !fd.MarkedForDeletion &&
                                 (assetIds.Contains(fd.AssetId) ||
                                  (fd.Asset!.ParentAssetId.HasValue &&
                                   fd.Asset.IsActive &&
                                   !fd.Asset.MarkedForDeletion &&
                                   assetIds.Contains(fd.Asset.ParentAssetId.Value))))
                    .Select(fd => new
                    {
                        AssetKey = fd.Asset != null && fd.Asset.ParentAssetId.HasValue && assetIds.Contains(fd.Asset.ParentAssetId.Value)
                            ? fd.Asset.ParentAssetId.Value
                            : fd.AssetId,
                        CapitalValue = fd.CapitalValue ?? 0m,
                        BuiltUpAreaSqMeter = fd.BuiltUpAreaSqMeter ?? 0m,
                        BuiltUpAreaSqFeet = fd.BuiltUpAreaSqFeet ?? 0m,
                        CarpetAreaSqMeter = fd.CarpetAreaSqMeter ?? 0m,
                        CarpetAreaSqFeet = fd.CarpetAreaSqFeet ?? 0m
                    })
                    .GroupBy(x => x.AssetKey)
                    .Select(g => new
                    {
                        AssetKey = g.Key,
                        CapitalValue = g.Sum(x => x.CapitalValue),
                        BuiltUpAreaSqMeter = g.Sum(x => x.BuiltUpAreaSqMeter),
                        BuiltUpAreaSqFeet = g.Sum(x => x.BuiltUpAreaSqFeet),
                        CarpetAreaSqMeter = g.Sum(x => x.CarpetAreaSqMeter),
                        CarpetAreaSqFeet = g.Sum(x => x.CarpetAreaSqFeet)
                    })
                    .ToDictionaryAsync(g => g.AssetKey, g => g, cancellationToken);

                var pagedLeaseRows = await _leaseRentDetailsRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(r => r.IsActive && !r.MarkedForDeletion &&
                                (assetIds.Contains(r.AssetId) ||
                                 (r.Asset != null && r.Asset.ParentAssetId.HasValue &&
                                  r.Asset.IsActive && !r.Asset.MarkedForDeletion &&
                                  assetIds.Contains(r.Asset.ParentAssetId.Value))))
                    .Select(r => new
                    {
                        r.AssetId,
                        ParentAssetId = r.Asset != null ? r.Asset.ParentAssetId : null,
                        r.RentAmount,
                        r.PaymentFrequency,
                        r.LeaseStartDate,
                        r.LeaseEndDate
                    })
                    .ToListAsync(cancellationToken);

                var leaseByAssetGroup = pagedLeaseRows
                    .Select(r => new
                    {
                        AssetKey = r.ParentAssetId.HasValue && assetIds.Contains(r.ParentAssetId.Value) ? r.ParentAssetId.Value : r.AssetId,
                        r.RentAmount,
                        r.PaymentFrequency,
                        r.LeaseStartDate,
                        r.LeaseEndDate
                    })
                    .GroupBy(x => x.AssetKey)
                    .ToDictionary(
                        g => g.Key,
                        g => new
                        {
                            AnnualRevenue = g.Sum(x => CalculateAnnualRent(x.RentAmount, x.PaymentFrequency)),
                            MinStartDate = g.Min(x => (DateTime?)x.LeaseStartDate),
                            MaxEndDate = g.Where(x => x.LeaseEndDate.HasValue).Select(x => x.LeaseEndDate).Max()
                        }
                    );

                foreach (var item in items)
                {
                    if (floorAggregates.TryGetValue(item.Id, out var fAgg))
                    {
                        item.CapitalValue = fAgg.CapitalValue;
                        item.BuiltUpAreaSqMeter = fAgg.BuiltUpAreaSqMeter > 0 ? fAgg.BuiltUpAreaSqMeter : (decimal?)null;
                        item.BuiltUpAreaSqFeet = fAgg.BuiltUpAreaSqFeet > 0 ? fAgg.BuiltUpAreaSqFeet : (decimal?)null;
                        item.CarpetAreaSqMeter = fAgg.CarpetAreaSqMeter > 0 ? fAgg.CarpetAreaSqMeter : (decimal?)null;
                        item.CarpetAreaSqFeet = fAgg.CarpetAreaSqFeet > 0 ? fAgg.CarpetAreaSqFeet : (decimal?)null;
                    }
                    else
                    {
                        item.CapitalValue = 0m;
                    }

                    if (leaseByAssetGroup.TryGetValue(item.Id, out var leaseInfo))
                    {
                        item.AnnualRevenue = leaseInfo.AnnualRevenue;
                        item.LeaseStartDate = leaseInfo.MinStartDate;
                        item.LeaseEndDate = leaseInfo.MaxEndDate;
                    }
                    var healthCalc = AssetHealthScoreCalculator.Calculate(item);
                    item.HealthScore = healthCalc.HealthPercentage;
                    item.HealthScoreRating = healthCalc.RatingString;
                }

                await EnrichLocationAsync(items, cancellationToken);
            }

            return new PagedAssetMasterResult(items, totalCount, pageNumber, pageSize)
            {
                ActiveAssetsCount = activeAssetsCount,
                TotalCapitalValue = totalCapitalValue,
                TotalOutstanding = totalOutstanding,
                TotalAnnualRevenue = totalAnnualRevenue,
                TotalSubUnits = totalSubUnitsCount,
                EncroachmentsCount = encroachmentsCount,
                AvgHealthScore = avgHealthScore
            };
        }

        /// <summary>
        /// Computes a real HealthScore/HealthScoreRating for each of the given asset ids from actual
        /// data (condition, occupancy, ownership, real document existence, real photo count, real
        /// sub-unit count, real capital value) — the same inputs GetAllInternalAsync feeds into
        /// AssetHealthScoreCalculator for top-level list rows. Used both for that list's average and
        /// for <see cref="GetHealthScoresBatchAsync"/>, so a child/sub-unit asset (which is a full
        /// AssetMaster row with its own id) gets an actual computed score instead of a static
        /// placeholder — child rows previously never had a health score computed for them at all.
        /// </summary>
        private async Task<Dictionary<int, (decimal Score, string Rating)>> ComputeHealthScoresForAssetIdsAsync(
            List<int> assetIds, CancellationToken cancellationToken)
        {
            var result = new Dictionary<int, (decimal Score, string Rating)>();
            if (assetIds == null || assetIds.Count == 0) return result;

            var healthInputs = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(a => assetIds.Contains(a.Id) && !a.MarkedForDeletion)
                .Select(a => new { a.Id, a.AssetConditionId, a.OccupancyStatus, a.OwnershipType, a.IsActive })
                .ToListAsync(cancellationToken);

            var healthPhotoCounts = await _assetPhotoRepository.GetQueryable()
                .AsNoTracking()
                .Where(p => p.IsActive && !p.MarkedForDeletion && p.IsLatest && assetIds.Contains(p.AssetId) && p.DocumentBinding != null)
                .GroupBy(p => p.AssetId)
                .Select(g => new { AssetId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.AssetId, g => g.Count, cancellationToken);

            var healthGisPhotos = await _assetPhotoRepository.GetQueryable()
                .AsNoTracking()
                .Where(p => p.IsActive && !p.MarkedForDeletion && p.IsLatest && assetIds.Contains(p.AssetId) &&
                            p.DocumentBinding != null &&
                            ((p.PhotoType != null && p.PhotoType.PhotoTypeCode.Contains("GIS")) ||
                             (p.PhotoType != null && p.PhotoType.PhotoTypeName.Contains("gis"))))
                .Select(p => p.AssetId)
                .Distinct()
                .ToHashSetAsync(cancellationToken);

            var healthDocumentInfo = await _assetDocumentRepository.GetQueryable()
                .AsNoTracking()
                .Where(d => d.IsActive && !d.MarkedForDeletion && d.IsLatest && assetIds.Contains(d.AssetId))
                .GroupBy(d => d.AssetId)
                .Select(g => new { AssetId = g.Key, FirstDocumentId = g.Min(d => d.Id) })
                .ToDictionaryAsync(g => g.AssetId, g => g.FirstDocumentId, cancellationToken);

            var healthSubUnitCounts = await _repository.GetQueryable()
                .AsNoTracking()
                .Where(child => child.ParentAssetId.HasValue && assetIds.Contains(child.ParentAssetId.Value)
                                 && child.IsActive && !child.MarkedForDeletion)
                .GroupBy(child => child.ParentAssetId!.Value)
                .Select(g => new { ParentAssetId = g.Key, Count = g.Select(c => c.Id).Distinct().Count() })
                .ToDictionaryAsync(g => g.ParentAssetId, g => g.Count, cancellationToken);

            var healthCapitalValues = await _floorDetailsRepository.GetQueryable()
                .AsNoTracking()
                .Where(fd => fd.IsActive && !fd.MarkedForDeletion &&
                             (assetIds.Contains(fd.AssetId) ||
                              (fd.Asset!.ParentAssetId.HasValue && fd.Asset.IsActive && !fd.Asset.MarkedForDeletion &&
                               assetIds.Contains(fd.Asset.ParentAssetId.Value))))
                .Select(fd => new
                {
                    AssetKey = fd.Asset != null && fd.Asset.ParentAssetId.HasValue && assetIds.Contains(fd.Asset.ParentAssetId.Value)
                        ? fd.Asset.ParentAssetId.Value
                        : fd.AssetId,
                    CapitalValue = fd.CapitalValue ?? 0m
                })
                .GroupBy(x => x.AssetKey)
                .Select(g => new { AssetKey = g.Key, Value = g.Sum(x => x.CapitalValue) })
                .ToDictionaryAsync(g => g.AssetKey, g => g.Value, cancellationToken);

            var conditionIds = healthInputs
                .Where(a => a.AssetConditionId.HasValue)
                .Select(a => a.AssetConditionId!.Value)
                .Distinct()
                .ToList();

            var conditionMap = new Dictionary<int, (string Name, decimal? Factor)>();
            if (conditionIds.Count > 0)
            {
                conditionMap = await _conditionRepository.GetQueryable()
                    .AsNoTracking()
                    .Where(c => conditionIds.Contains(c.Id))
                    .Select(c => new { c.Id, c.ConditionName, c.ConditionFactor })
                    .ToDictionaryAsync(c => c.Id, c => (c.ConditionName, c.ConditionFactor), cancellationToken);
            }

            foreach (var input in healthInputs)
            {
                string? condName = null;
                decimal? condFactor = null;
                if (input.AssetConditionId.HasValue && conditionMap.TryGetValue(input.AssetConditionId.Value, out var cInfo))
                {
                    condName = cInfo.Name;
                    condFactor = cInfo.Factor;
                }

                var lightweightDto = new AssetMasterDto
                {
                    Id = input.Id,
                    AssetConditionId = input.AssetConditionId,
                    AssetCondition = condName,
                    AssetConditionFactor = condFactor,
                    OccupancyStatus = input.OccupancyStatus,
                    OwnershipType = input.OwnershipType,
                    IsActive = input.IsActive,
                    TotalPhotos = healthPhotoCounts.TryGetValue(input.Id, out var photoCountForCalc) ? photoCountForCalc : 0,
                    GisMapGuid = healthGisPhotos.Contains(input.Id) ? Guid.NewGuid() : null,
                    AssetDocumentId = healthDocumentInfo.TryGetValue(input.Id, out var docIdForCalc) ? docIdForCalc : (int?)null,
                    TotalSubUnits = healthSubUnitCounts.TryGetValue(input.Id, out var subUnitCountForCalc) ? subUnitCountForCalc : 0,
                    CapitalValue = healthCapitalValues.TryGetValue(input.Id, out var capValForCalc) ? capValForCalc : 0m
                };
                var calc = AssetHealthScoreCalculator.Calculate(lightweightDto);
                result[input.Id] = (calc.HealthPercentage, calc.RatingString);
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<List<AssetHealthScoreDto>> GetHealthScoresBatchAsync(List<int> assetIds, CancellationToken cancellationToken = default)
        {
            var scores = await ComputeHealthScoresForAssetIdsAsync(assetIds, cancellationToken);
            return scores.Select(kv => new AssetHealthScoreDto
            {
                AssetId = kv.Key,
                HealthScore = kv.Value.Score,
                HealthScoreRating = kv.Value.Rating
            }).ToList();
        }

        protected override Task<ValidationResult> ValidateForCreateAsync(
            AssetMasterEntity entity,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(ValidationResult.Success());
        }
        // EncroachmentStatus is free text; these values mean "not encroached".
        private static readonly string[] NotEncroachedStatuses = { "No Issue", "None", "No Encroachment", "Not Encroached" };

        /// <summary>
        /// Filtered (not yet sorted or paged) asset list query shared by the list endpoints.
        /// Returns children of <c>ParentAssetId</c> when it is set, otherwise main assets only.
        /// </summary>
        private IQueryable<AssetMasterEntity> BuildAssetListQuery(AssetMasterQueryParameters queryParameters)
        {
            var query = _repository.GetQueryable()
                .AsNoTracking()
                .Where(a => !a.MarkedForDeletion);

            if (queryParameters.ParentAssetId.HasValue)
            {
                query = query.Where(a => a.ParentAssetId == queryParameters.ParentAssetId.Value);
            }
            else
            {
                query = query.Where(a => a.ParentAssetId == null);
            }

            query = query.ApplyFilters(queryParameters);
            query = query.ApplySearch(queryParameters);

            if (queryParameters.ZoneId.HasValue || queryParameters.WardId.HasValue || !string.IsNullOrWhiteSpace(queryParameters.Address))
            {
                var detailsQuery = _detailsRepository.GetQueryable().AsNoTracking();
                if (queryParameters.ZoneId.HasValue)
                    detailsQuery = detailsQuery.Where(d => d.ZoneId == queryParameters.ZoneId.Value);
                if (queryParameters.WardId.HasValue)
                    detailsQuery = detailsQuery.Where(d => d.WardId == queryParameters.WardId.Value);
                if (!string.IsNullOrWhiteSpace(queryParameters.Address))
                    detailsQuery = detailsQuery.Where(d => d.Address != null && d.Address.Contains(queryParameters.Address));
                var matchingAssetIds = detailsQuery.Select(d => d.AssetId);
                query = query.Where(a => matchingAssetIds.Contains(a.Id));
            }

            var encroachmentStatuses = queryParameters.EncroachmentStatus?
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToList();
            if (encroachmentStatuses is { Count: > 0 })
            {
                // "No issue" is usually stored as NULL, so asking for it selects the whole
                // not-encroached group rather than only rows holding that exact text.
                var includeNotEncroached = encroachmentStatuses.Any(s => NotEncroachedStatuses.Contains(s, StringComparer.OrdinalIgnoreCase));
                var otherStatuses = encroachmentStatuses
                    .Where(s => !NotEncroachedStatuses.Contains(s, StringComparer.OrdinalIgnoreCase))
                    .ToList();

                query = query.Where(a =>
                    (includeNotEncroached &&
                     (a.EncroachmentStatus == null || a.EncroachmentStatus == "" || NotEncroachedStatuses.Contains(a.EncroachmentStatus))) ||
                    otherStatuses.Contains(a.EncroachmentStatus!));
            }

            return query;
        }

        /// <summary>
        /// Sort shared by the list endpoints: newest first by default, plus the computed
        /// CapitalValue / AssetLife columns that <c>ApplySort</c> cannot handle. Id is always the
        /// last key so rows that tie on the sort column keep one order across Skip/Take pages.
        /// The computed columns here follow the values GetAllAsync returns (every active child);
        /// the parent list orders them by its own roll-up instead (<c>ApplyParentAssetListSort</c>).
        /// </summary>
        private IQueryable<AssetMasterEntity> ApplyAssetListSort(IQueryable<AssetMasterEntity> query, AssetMasterQueryParameters queryParameters)
        {
            if (string.IsNullOrWhiteSpace(queryParameters.SortBy))
            {
                return query.OrderByDescending(a => a.CreatedDate).ThenByDescending(a => a.Id);
            }

            var descending = queryParameters.SortOrder?.ToLower() == "desc";
            IOrderedQueryable<AssetMasterEntity> ordered;

            if (string.Equals(queryParameters.SortBy, "CapitalValue", StringComparison.OrdinalIgnoreCase))
            {
                var fdQuery = _floorDetailsRepository.GetQueryable()
                    .Where(fd => fd.IsActive && !fd.MarkedForDeletion);

                if (descending)
                {
                    ordered = query.OrderByDescending(a =>
                        fdQuery.Where(fd => fd.AssetId == a.Id || (fd.Asset != null && fd.Asset.ParentAssetId == a.Id && fd.Asset.IsActive && !fd.Asset.MarkedForDeletion))
                               .Sum(fd => fd.CapitalValue ?? 0m)
                    );
                }
                else
                {
                    ordered = query.OrderBy(a =>
                        fdQuery.Where(fd => fd.AssetId == a.Id || (fd.Asset != null && fd.Asset.ParentAssetId == a.Id && fd.Asset.IsActive && !fd.Asset.MarkedForDeletion))
                               .Sum(fd => fd.CapitalValue ?? 0m)
                    );
                }
            }
            else if (string.Equals(queryParameters.SortBy, "AssetLife", StringComparison.OrdinalIgnoreCase))
            {
                var fdQuery = _floorDetailsRepository.GetQueryable()
                    .Where(fd => fd.IsActive && !fd.MarkedForDeletion && fd.ConstructionYear != null && fd.ConstructionYear != "");

                if (descending)
                {
                    ordered = query.OrderBy(a =>
                        _repository.GetQueryable()
                            .Where(child => child.ParentAssetId == a.Id && child.IsActive && !child.MarkedForDeletion)
                            .Join(fdQuery, child => child.Id, fd => fd.AssetId, (child, fd) => fd.ConstructionYear)
                            .Min()
                    );
                }
                else
                {
                    ordered = query.OrderByDescending(a =>
                        _repository.GetQueryable()
                            .Where(child => child.ParentAssetId == a.Id && child.IsActive && !child.MarkedForDeletion)
                            .Join(fdQuery, child => child.Id, fd => fd.AssetId, (child, fd) => fd.ConstructionYear)
                            .Min()
                    );
                }
            }
            else
            {
                // With SortBy set, ApplySort always returns an OrderBy/OrderByDescending (or throws).
                ordered = (IOrderedQueryable<AssetMasterEntity>)query.ApplySort(queryParameters);
            }

            return ThenById(ordered, descending);
        }

        /// <summary>Id as the final key, so rows that tie on the sort column keep one order across pages.</summary>
        private static IOrderedQueryable<AssetMasterEntity> ThenById(IOrderedQueryable<AssetMasterEntity> ordered, bool descending)
            => descending ? ordered.ThenByDescending(a => a.Id) : ordered.ThenBy(a => a.Id);

        protected override async Task<ValidationResult> ValidateForDeactivationAsync(
            int id,
            AssetMasterEntity currentEntity,
            AssetMasterEntity updatedEntity,
            CancellationToken cancellationToken = default)
        {
            if (currentEntity.IsActive && !updatedEntity.IsActive)
            {
                return await _referenceValidator.ValidateReferencesAsync<AssetMasterEntity>(id, cancellationToken);
            }
            return ValidationResult.Success();
        }

        protected override async Task<ValidationResult> ValidateForDeleteAsync(
            int id,
            AssetMasterEntity entity,
            CancellationToken cancellationToken = default)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetMasterEntity>(id, cancellationToken);
        }

        private static int? ParseConstructionYear(string? yearText)
        {
            if (string.IsNullOrWhiteSpace(yearText))
                return null;

            if (int.TryParse(yearText.Trim(), out var exactYear))
                return exactYear;

            var firstFourDigits = new string(yearText.Where(char.IsDigit).Take(4).ToArray());
            if (firstFourDigits.Length == 4 && int.TryParse(firstFourDigits, out var extractedYear))
                return extractedYear;

            return null;
        }

        private static bool IsPlanPhotoType(string? code, string? name) =>
            (code?.Contains("PLAN", StringComparison.OrdinalIgnoreCase) ?? false) ||
            (name?.Contains("plan", StringComparison.OrdinalIgnoreCase) ?? false);

        private static bool IsGisPhotoType(string? code, string? name) =>
            (code?.Contains("GIS", StringComparison.OrdinalIgnoreCase) ?? false) ||
            (name?.Contains("gis map", StringComparison.OrdinalIgnoreCase) ?? false);

        #endregion
    }
}
