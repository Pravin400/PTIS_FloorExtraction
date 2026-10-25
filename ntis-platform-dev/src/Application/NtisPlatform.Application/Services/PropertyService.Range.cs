using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.Property.PropertyWorkflowDetails;
using NtisPlatform.Application.DTOs.Range;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Property creation operations (Range, Single)
/// </summary>
public partial class PropertyService
{
    /// <summary>
    /// Creates multiple properties based on a range request with transactional consistency.
    /// All properties are created within a single transaction - if any fails, all are rolled back.
    /// </summary>
    /// <param name="request">The range creation parameters containing template and range bounds.</param>
    /// <param name="ct">Cancellation token to cancel the operation.</param>
    /// <returns>
    /// A RangeResult containing success/failure counts and any error messages.
    /// On success: SuccessCount equals total properties created, FailedCount is 0.
    /// On failure: SuccessCount is 0, FailedCount equals total range size, Errors contains details.
    /// </returns>
    /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
    public async Task<RangeResult<CreateNewPropertyResponseDto>> CreatePropertiesFromRangeAsync(RangeCreateRequest<CreateNewPropertyDto> request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.Template == null)
        {
            return new RangeResult<CreateNewPropertyResponseDto>(
                SuccessCount: CreatePropertiesFromRange.Numeric.InitialSuccessCount,
                FailedCount: CreatePropertiesFromRange.Numeric.InitialFailedCount,
                Results: [],
                Errors: new List<string> { CreatePropertiesFromRange.Messages.TemplateCannotBeNull });
        }

        if (string.IsNullOrWhiteSpace(request.Template.AdharCardNo))
        {
            var rootAadhaar = request.AdharCardNo;
            if (!string.IsNullOrWhiteSpace(rootAadhaar))
            {
                if (rootAadhaar.Length > 12)
                {
                    return new RangeResult<CreateNewPropertyResponseDto>(
                        SuccessCount: CreatePropertiesFromRange.Numeric.InitialSuccessCount,
                        FailedCount: CreatePropertiesFromRange.Numeric.InitialFailedCount,
                        Results: [],
                        Errors: new List<string> { "CreateNewProperty_AdharCardNo_MaxLength" });
                }

                if (System.Text.RegularExpressions.Regex.IsMatch(rootAadhaar, @"[<>;|~=]"))
                {
                    return new RangeResult<CreateNewPropertyResponseDto>(
                        SuccessCount: CreatePropertiesFromRange.Numeric.InitialSuccessCount,
                        FailedCount: CreatePropertiesFromRange.Numeric.InitialFailedCount,
                        Results: [],
                        Errors: new List<string> { "CreateNewProperty_InvalidCharacters" });
                }

                request.Template.AdharCardNo = rootAadhaar;
            }
        }

        _logger.LogInformation("Starting property range creation: WardId={WardId}, RangeFrom={RangeFrom}, RangeTo={RangeTo}, Prefix={Prefix}, Suffix={Suffix}", request.Template.WardId, request.RangeFrom, request.RangeTo, request.Prefix, request.Suffix);
        var rangeValues = RangeGenerator.GenerateRangeValues(request.RangeFrom, request.RangeTo, request.Prefix, request.Suffix);

        var templateValidationErrors = await ValidateTemplateAsync(request.Template, ct);
        if (templateValidationErrors.Count > 0)
        {
            _logger.LogWarning("Template validation failed for property range creation: {Errors}", string.Join("; ", templateValidationErrors));
            return new RangeResult<CreateNewPropertyResponseDto>(
                SuccessCount: CreatePropertiesFromRange.Numeric.InitialSuccessCount,
                FailedCount: rangeValues.Count,
                Results: [],
                Errors: templateValidationErrors);
        }

        _logger.LogInformation("Generated {Count} property numbers for range creation", rangeValues.Count);
        var results = new List<CreateNewPropertyResponseDto>();
        var errors = new List<string>();

        _logger.LogInformation("Beginning database transaction for property range creation");
        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            for (int i = 0; i < rangeValues.Count; i++)
            {
                ct.ThrowIfCancellationRequested();

                try
                {
                    if (string.IsNullOrWhiteSpace(rangeValues[i]))
                    {
                        _logger.LogWarning("Generated property name at index {Index} is empty or null", i);
                        errors.Add($"{i + 1}: Generated property name is empty or null.");
                        break;
                    }

                    var propertyNo = rangeValues[i];
                    var sequenceNo = Convert.ToInt32(rangeValues[i]);

                    // Business Rule: Apply VP prefix for virtual properties before duplicate check
                    var propertyNoForCheck = request.Template.IsVirtualProperty == true && !propertyNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
                        ? $"{VirtualPropertyConstants.VirtualPropertyPrefix}{propertyNo}"
                        : propertyNo;

                    var isDuplicate = await _propertyRepository.IsPropertyExists(request.Template.WardId, propertyNoForCheck, null);

                    if (isDuplicate)
                    {
                        _logger.LogWarning("Duplicate property detected: PropertyNo={PropertyNo}, WardId={WardId}. Checking remaining range.", propertyNo, request.Template.WardId);
                        
                        // Check remaining range for duplicates
                        for (int existCount = i; existCount < rangeValues.Count; existCount++)
                        {
                            var existPropertyNo = request.Template.IsVirtualProperty == true && !rangeValues[existCount].StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
                                ? $"{VirtualPropertyConstants.VirtualPropertyPrefix}{rangeValues[existCount]}"
                                : rangeValues[existCount];

                            if (await _propertyRepository.IsPropertyExists(request.Template.WardId, existPropertyNo, null))
                            {
                                errors.Add($"{rangeValues[existCount]} : {CreatePropertiesFromRange.Messages.PropertyAlreadyExists}");
                            }
                            else
                            {
                                errors.Add(string.Format(CreatePropertiesFromRange.Messages.DuplicateCheckFailedTemplate, 
                                    existCount + CreatePropertiesFromRange.Numeric.IndexOffset));
                                break;
                            }
                        }
                        break;
                    }

                    // Create property with all business logic in service layer
                    var result = await CreateSinglePropertyAsync(request.Template, propertyNo, sequenceNo, ct);

                    if (result != null && result.Success)
                    {
                        _logger.LogInformation("Successfully created property {PropertyNo} at index {Index}", propertyNo, i + CreatePropertiesFromRange.Numeric.IndexOffset);
                        results.Add(result);
                    }
                    else
                    {
                        var errorMessage = result?.Message ?? CreatePropertiesFromRange.Messages.UnknownErrorOccurred;
                        _logger.LogWarning("Failed to create property {PropertyNo} at index {Index}: {Message}",
                            propertyNo, i + CreatePropertiesFromRange.Numeric.IndexOffset, errorMessage);
                        errors.Add(string.Format(CreatePropertiesFromRange.Messages.PropertyCreationFailedTemplate,
                            i + CreatePropertiesFromRange.Numeric.IndexOffset, propertyNo, errorMessage));
                        break;
                    }
                }
                catch (Exception ex)
                {
                    var errorMessage = ex switch
                    {
                        DbUpdateException dbEx => string.Format(CreatePropertiesFromRange.Messages.DatabaseErrorTemplate, dbEx.InnerException?.Message ?? dbEx.Message),
                        OperationCanceledException => CreatePropertiesFromRange.Messages.OperationCancelled,
                        ArgumentException argEx => string.Format(CreatePropertiesFromRange.Messages.InvalidArgumentTemplate, argEx.Message),
                        _ => $"{ex.GetType().Name}: {ex.Message}"
                    };
                    
                    _logger.LogError(ex, "Error creating property {PropertyNo} at index {Index}: {ErrorMessage}",
                        rangeValues[i], i + CreatePropertiesFromRange.Numeric.IndexOffset, errorMessage);
                    
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.PropertyCreationFailedTemplate,
                        i + CreatePropertiesFromRange.Numeric.IndexOffset, rangeValues[i], errorMessage));
                    break;
                }
            }

            if (errors.Count > CreatePropertiesFromRange.Numeric.InitialSuccessCount)
            {
                _logger.LogWarning("Rolling back transaction due to {ErrorCount} errors in property range creation", errors.Count);
                await _unitOfWork.RollbackTransactionAsync(ct);
                return new RangeResult<CreateNewPropertyResponseDto>(
                    SuccessCount: CreatePropertiesFromRange.Numeric.InitialSuccessCount,
                    FailedCount: rangeValues.Count,
                    Results: [],
                    Errors: errors
                );
            }

            _logger.LogInformation("Committing transaction: Successfully created {Count} properties", results.Count);
            await _unitOfWork.CommitTransactionAsync(ct);

            _logger.LogInformation("Property range creation completed successfully: {SuccessCount} properties created", results.Count);
            return new RangeResult<CreateNewPropertyResponseDto>(
                SuccessCount: results.Count,
                FailedCount: CreatePropertiesFromRange.Numeric.InitialFailedCount,
                Results: results,
                Errors: null
            );
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Property range creation was cancelled.");
            
            try
            {
                await _unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            }
            catch (Exception rollbackEx)
            {
                _logger.LogError(rollbackEx, "Failed to rollback transaction after cancellation: {Message}", rollbackEx.Message);
            }

            errors.Add(CreatePropertiesFromRange.Messages.OperationCancelled);

            return new RangeResult<CreateNewPropertyResponseDto>(
                SuccessCount: CreatePropertiesFromRange.Numeric.InitialSuccessCount,
                FailedCount: rangeValues.Count,
                Results: [],
                Errors: errors
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during property range creation: {Message}", ex.Message);
            
            try
            {
                await _unitOfWork.RollbackTransactionAsync(ct);
                _logger.LogInformation("Transaction rolled back successfully after error");
            }
            catch (Exception rollbackEx)
            {
                _logger.LogError(rollbackEx, "Failed to rollback transaction: {Message}", rollbackEx.Message);
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.RollbackErrorTemplate, rollbackEx.Message));
            }

            errors.Add(string.Format(CreatePropertiesFromRange.Messages.UnexpectedTransactionErrorTemplate, 
                ex.GetType().Name, ex.Message));

            return new RangeResult<CreateNewPropertyResponseDto>(
                SuccessCount: CreatePropertiesFromRange.Numeric.InitialSuccessCount,
                FailedCount: rangeValues.Count,
                Results: [],
                Errors: errors
            );
        }
    }

    /// <summary>
    /// Creates a single property with all related entities.
    /// Business logic extracted from repository layer per CLAUDE.md guidelines.
    /// All business rules (category checks, UPIC generation, conditional entity creation) live here in Application layer.
    /// </summary>
    /// <param name="dto">The property creation data.</param>
    /// <param name="propertyNo">The property number for this specific property.</param>
    /// <param name="sequenceNo">The sequence number for this property.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Success response with PropertyId when operation succeeds, null on failure.</returns>
    private async Task<CreateNewPropertyResponseDto?> CreateSinglePropertyAsync(CreateNewPropertyDto dto, string propertyNo, int sequenceNo, CancellationToken ct)
    {
        _logger.LogInformation("Creating single property: PropertyNo={PropertyNo}, WardId={WardId}, CategoryId={CategoryId}",propertyNo, dto.WardId, dto.CategoryId);
        
        //STEP 1: Get Ward for UPIC generation (Business Rule)
        var ward = await _wardRepository.GetByIdAsync(dto.WardId, ct);
        _logger.LogInformation("Retrieved ward {WardNo} for property {PropertyNo}", ward?.WardNo, propertyNo);

        // STEP 2: Get Category for business logic (Apartment vs Plot handling) 
        var category = await _categoryRepository.GetByIdAsync(dto.CategoryId, ct);
        _logger.LogInformation("Retrieved category {CategoryName} for property {PropertyNo}", category?.PropertyCategoryName, propertyNo);

        // STEP 3: Create PropertyEntity using AutoMapper
        var property = _mapper.Map<PropertyEntity>(dto);

        // Get Assessment Status default value if not provided
        var assessmentStatus = _assessmentStatusRepository != null
            ? await _assessmentStatusRepository.GetQueryable().AsNoTracking().FirstOrDefaultAsync(x => x.StatusName == PropertyAssessmentStatus.Unassessed, ct)
            : null;

        // Set range-specific values
        var cleanPropNo = propertyNo?.Trim() ?? string.Empty;
        property.PropertyNo = dto.IsVirtualProperty == true && !cleanPropNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase)
            ? $"{VirtualPropertyConstants.VirtualPropertyPrefix}{cleanPropNo}"
            : cleanPropNo;
        property.PropertySeqNo = sequenceNo;
        property.PropertyAssessmentStatusId = (dto.PropertyAssessmentStatusId.HasValue && dto.PropertyAssessmentStatusId.Value > 0) ? dto.PropertyAssessmentStatusId.Value : assessmentStatus?.Id;
        property.PartitionNo = string.Empty;
        property.IsVirtualProperty = dto.IsVirtualProperty ?? false;
        property.UPICId = UpicIdBuilderHelper.Generate(ward?.WardNo ?? dto.WardId.ToString(), property.PropertyNo ?? propertyNo ?? string.Empty, property.PartitionNo);

        await _repository.AddAsync(property, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // STEP 4: Society Creation (Business Rule: Apartment category only) 
        SocietyDetailsEntity? society = null;
        if (category != null && category.PropertyCategoryName.Contains(CreatePropertiesFromRange.CategoryNames.Apartment, CreatePropertiesFromRange.ComparisonOptions.CategoryNameComparison))
        {
            society = _mapper.Map<SocietyDetailsEntity>(dto);
            society.PropertyId = property.Id;

            await _societyRepository.AddAsync(society, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            _logger.LogInformation("SocietyDetailsEntity created with Id={SocietyId} for property {PropertyNo}", society.Id, propertyNo);

            if (dto.LengthMtr != null && dto.LengthMtr > 0 && dto.WidthMtr != null && dto.WidthMtr > 0 && dto.TotalAreaSqMtr != null && dto.TotalAreaSqMtr > 0)
            {
                // Check if property details already exist
                var existingDetails = await _propertyDetailsRepository.GetQueryable().AsNoTracking().FirstOrDefaultAsync(x => x.PropertyId == property.Id, ct);

                if (existingDetails == null)
                {
                    var propertyDetails = _mapper.Map<PropertyDetailsEntity>(dto);
                    propertyDetails.PropertyId = property.Id;

                    await _propertyDetailsRepository.AddAsync(propertyDetails, ct);
                    await _unitOfWork.SaveChangesAsync(ct);
                    _logger.LogInformation("PropertyDetailsEntity created with Id={PropertyDetailsId} for property {PropertyNo}", propertyDetails.Id, propertyNo);

                    // Create RoomWiseSubmissionDetails using AutoMapper
                    var roomWiseDetails = _mapper.Map<RoomWiseSubmissionDetailsEntity>(dto);
                    roomWiseDetails.PropertyId = property.Id;
                    roomWiseDetails.PropertyDetailsId = propertyDetails.Id;

                    await _roomWiseRepository.AddAsync(roomWiseDetails, ct);
                    await _unitOfWork.SaveChangesAsync(ct);
                    _logger.LogInformation("RoomWiseSubmissionDetailsEntity created with Id={RoomWiseId} for property {PropertyNo}", roomWiseDetails.Id, propertyNo);
                }
            
            }

        }

        // STEP 5: Assessment Record using AutoMapper
        var propertyAssessment = _mapper.Map<PropertyAssessmentEntity>(dto);
        propertyAssessment.PropertyId = property.Id;
        if (!string.IsNullOrWhiteSpace(dto.AdharCardNo))
        {
            propertyAssessment.AdharCardNo = dto.AdharCardNo.Trim();
        }

        await _assessmentRepository.AddAsync(propertyAssessment, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _logger.LogInformation("PropertyAssessmentEntity created with Id={AssessmentId} for property {PropertyNo}",
            propertyAssessment.Id, propertyNo);

        // STEP 6: PropertyDetails (Business Rule: PLOT category only) 
        if (category != null && category.PropertyCategoryName.Equals(CreatePropertiesFromRange.CategoryNames.Plot, CreatePropertiesFromRange.ComparisonOptions.CategoryNameComparison))
        {
            // Check if property details already exist
            var existingDetails = await _propertyDetailsRepository.GetQueryable().AsNoTracking().FirstOrDefaultAsync(x => x.PropertyId == property.Id, ct);

            if (existingDetails == null)
            {
                var propertyDetails = _mapper.Map<PropertyDetailsEntity>(dto);
                propertyDetails.PropertyId = property.Id;

                await _propertyDetailsRepository.AddAsync(propertyDetails, ct);
                await _unitOfWork.SaveChangesAsync(ct);
                _logger.LogInformation("PropertyDetailsEntity created with Id={PropertyDetailsId} for property {PropertyNo}", propertyDetails.Id, propertyNo);

                // Create RoomWiseSubmissionDetails using AutoMapper
                var roomWiseDetails = _mapper.Map<RoomWiseSubmissionDetailsEntity>(dto);
                roomWiseDetails.PropertyId = property.Id;
                roomWiseDetails.PropertyDetailsId = propertyDetails.Id;

                await _roomWiseRepository.AddAsync(roomWiseDetails, ct);
                await _unitOfWork.SaveChangesAsync(ct);
                _logger.LogInformation("RoomWiseSubmissionDetailsEntity created with Id={RoomWiseId} for property {PropertyNo}", roomWiseDetails.Id, propertyNo);
            }
        }

        // STEP 7: Entry in Workflow Details Table using AutoMapper
        var workflowDetailsRepo = _workflowDetailsRepository ?? _serviceProvider?.GetService<IPropertyWorkflowDetailsRepository>();
        if (workflowDetailsRepo != null)
        {
            await workflowDetailsRepo.ResetCurrentStatusAsync(property.Id, ct);

            var workflowDto = new CreatePropertyWorkflowDetailsDto
            {
                PropertyId = property.Id,
                WorkflowStageId = CreatePropertiesFromRange.Numeric.WorkflowStageMinId,
                IsActive = true,
                CurrentStatus = true,
                ModuleId = dto.ModuleId,
                CreatedBy = dto.CreatedBy
            };

            var workflowDetails = _mapper.Map<PropertyWorkflowDetailsEntity>(workflowDto);
            workflowDetails.PropertyId = property.Id;

            await workflowDetailsRepo.AddAsync(workflowDetails, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            _logger.LogInformation("PropertyWorkflowDetailsEntity created with Id={WorkflowDetailsId} for property {PropertyNo} and WorkflowStageId={WorkflowStageId}", workflowDetails.Id, propertyNo, workflowDetails.WorkflowStageId);
        }

        _logger.LogInformation("Successfully completed all entity creation for property {PropertyNo} with PropertyId={PropertyId}", propertyNo, property.Id);

        return new CreateNewPropertyResponseDto
        {
            PropertyId = property.Id,
            UPICID = property.UPICId,
            WardID = property.WardId,
            SocietyDetailsId = society?.Id,
            Success = true,
            Message = CreatePropertiesFromRange.Messages.PropertyCreatedSuccessfully
        };
    }

    /// <summary>
    /// Validates all foreign-key master ID references provided in the property template.
    /// Returns a list of error messages for any invalid or inactive master IDs.
    /// </summary>
    private async Task<List<string>> ValidateTemplateAsync(CreateNewPropertyDto dto, CancellationToken ct)
    {
        var errors = new List<string>();

        // 1. WardId (Required)
        if (dto.WardId <= 0)
        {
            errors.Add(string.Format(CreatePropertiesFromRange.Messages.WardNotFoundOrInactiveTemplate, dto.WardId));
        }
        else if (_masterRepository != null)
        {
            if (!await _masterRepository.WardExistsAsync(dto.WardId, ct))
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.WardNotFoundOrInactiveTemplate, dto.WardId));
        }
        else if (_wardRepository != null)
        {
            var ward = await _wardRepository.GetByIdAsync(dto.WardId, ct);
            if (ward == null || !ward.IsActive)
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.WardNotFoundOrInactiveTemplate, dto.WardId));
        }

        // 2. TaxZoneId (Required)
        if (dto.TaxZoneId <= 0)
        {
            errors.Add(string.Format(CreatePropertiesFromRange.Messages.TaxZoneNotFoundOrInactiveTemplate, dto.TaxZoneId));
        }
        else if (_masterRepository != null)
        {
            if (!await _masterRepository.TaxZoneExistsAsync(dto.TaxZoneId, ct))
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.TaxZoneNotFoundOrInactiveTemplate, dto.TaxZoneId));
        }
        else if (_taxZoneRepository != null)
        {
            var taxZone = await _taxZoneRepository.GetByIdAsync(dto.TaxZoneId, ct);
            if (taxZone == null || !taxZone.IsActive)
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.TaxZoneNotFoundOrInactiveTemplate, dto.TaxZoneId));
        }

        // 3. CategoryId (Required)
        if (dto.CategoryId <= 0)
        {
            errors.Add(string.Format(CreatePropertiesFromRange.Messages.CategoryNotFoundOrInactiveTemplate, dto.CategoryId));
        }
        else if (_masterRepository != null)
        {
            if (!await _masterRepository.CategoryExistsAsync(dto.CategoryId, ct))
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.CategoryNotFoundOrInactiveTemplate, dto.CategoryId));
        }
        else if (_categoryRepository != null)
        {
            var cat = await _categoryRepository.GetByIdAsync(dto.CategoryId, ct);
            if (cat == null || !cat.IsActive)
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.CategoryNotFoundOrInactiveTemplate, dto.CategoryId));
        }

        // 4. PropertyTypeId (Required)
        if (dto.PropertyTypeId <= 0)
        {
            errors.Add(string.Format(CreatePropertiesFromRange.Messages.PropertyTypeNotFoundOrInactiveTemplate, dto.PropertyTypeId));
        }
        else if (_masterRepository != null)
        {
            if (!await _masterRepository.PropertyTypeExistsAsync(dto.PropertyTypeId, ct))
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.PropertyTypeNotFoundOrInactiveTemplate, dto.PropertyTypeId));
        }
        else if (_propertyTypeRepository != null)
        {
            var propType = await _propertyTypeRepository.GetByIdAsync(dto.PropertyTypeId, ct);
            if (propType == null || !propType.IsActive)
                errors.Add(string.Format(CreatePropertiesFromRange.Messages.PropertyTypeNotFoundOrInactiveTemplate, dto.PropertyTypeId));
        }

        // 5. PropertyAssessmentStatusId (Optional)
        if (dto.PropertyAssessmentStatusId.HasValue && dto.PropertyAssessmentStatusId.Value > 0)
        {
            if (_masterRepository != null)
            {
                if (!await _masterRepository.PropertyAssessmentStatusExistsAsync(dto.PropertyAssessmentStatusId.Value, ct))
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.AssessmentStatusNotFoundOrInactiveTemplate, dto.PropertyAssessmentStatusId.Value));
            }
            else if (_assessmentStatusRepository != null)
            {
                var status = await _assessmentStatusRepository.GetByIdAsync(dto.PropertyAssessmentStatusId.Value, ct);
                if (status == null || !status.IsActive)
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.AssessmentStatusNotFoundOrInactiveTemplate, dto.PropertyAssessmentStatusId.Value));
            }
        }

        // 6. OwnerTypeId (Optional)
        if (dto.OwnerTypeId.HasValue && dto.OwnerTypeId.Value > 0)
        {
            if (_masterRepository != null)
            {
                if (!await _masterRepository.OwnerTypeExistsAsync(dto.OwnerTypeId.Value, ct))
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.OwnerTypeNotFoundOrInactiveTemplate, dto.OwnerTypeId.Value));
            }
            else if (_ownerTypeRepository != null)
            {
                var ownerType = await _ownerTypeRepository.GetByIdAsync(dto.OwnerTypeId.Value, ct);
                if (ownerType == null || !ownerType.IsActive)
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.OwnerTypeNotFoundOrInactiveTemplate, dto.OwnerTypeId.Value));
            }
        }

        // 7. Mobile Remarks (Optional)
        var remarkChecks = new (int? Id, string Name)[]
        {
            (dto.MobileNoRemarkId, nameof(dto.MobileNoRemarkId)),
            (dto.OccupierMobileNoRemarkId, nameof(dto.OccupierMobileNoRemarkId)),
            (dto.BuilderMobileNoRemarkId, nameof(dto.BuilderMobileNoRemarkId)),
            (dto.ManagerMobileNoRemarkId, nameof(dto.ManagerMobileNoRemarkId)),
            (dto.SecretaryMobileNoRemarkId, nameof(dto.SecretaryMobileNoRemarkId))
        };

        foreach (var (remarkId, name) in remarkChecks)
        {
            if (remarkId.HasValue && remarkId.Value > 0)
            {
                if (_masterRepository != null)
                {
                    if (!await _masterRepository.CommonRemarkDetailsExistsAsync(remarkId.Value, ct))
                        errors.Add(string.Format(CreatePropertiesFromRange.Messages.CommonRemarkDetailsNotFoundOrInactiveTemplate, remarkId.Value, name));
                }
                else if (_commonRemarkDetailsRepository != null)
                {
                    var remark = await _commonRemarkDetailsRepository.GetByIdAsync(remarkId.Value, ct);
                    if (remark == null || !remark.IsActive)
                        errors.Add(string.Format(CreatePropertiesFromRange.Messages.CommonRemarkDetailsNotFoundOrInactiveTemplate, remarkId.Value, name));
                }
            }
        }

        // 8. FloorId (Optional)
        if (dto.FloorId.HasValue && dto.FloorId.Value > 0)
        {
            if (_masterRepository != null)
            {
                if (!await _masterRepository.FloorExistsAsync(dto.FloorId.Value, ct))
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.FloorNotFoundOrInactiveTemplate, dto.FloorId.Value));
            }
            else if (_floorRepository != null)
            {
                var floor = await _floorRepository.GetByIdAsync(dto.FloorId.Value, ct);
                if (floor == null || !floor.IsActive)
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.FloorNotFoundOrInactiveTemplate, dto.FloorId.Value));
            }
        }

        // 9. ConstructionTypeId (Optional)
        if (dto.ConstructionTypeId.HasValue && dto.ConstructionTypeId.Value > 0)
        {
            if (_masterRepository != null)
            {
                if (!await _masterRepository.ConstructionTypeExistsAsync(dto.ConstructionTypeId.Value, ct))
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.ConstructionTypeNotFoundOrInactiveTemplate, dto.ConstructionTypeId.Value));
            }
            else if (_constructionTypeRepository != null)
            {
                var ctEntity = await _constructionTypeRepository.GetByIdAsync(dto.ConstructionTypeId.Value, ct);
                if (ctEntity == null || !ctEntity.IsActive)
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.ConstructionTypeNotFoundOrInactiveTemplate, dto.ConstructionTypeId.Value));
            }
        }

        // 10. TypeOfUseId (Optional)
        if (dto.TypeOfUseId.HasValue && dto.TypeOfUseId.Value > 0)
        {
            if (_masterRepository != null)
            {
                if (!await _masterRepository.TypeOfUseExistsAsync(dto.TypeOfUseId.Value, ct))
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.TypeOfUseNotFoundOrInactiveTemplate, dto.TypeOfUseId.Value));
            }
            else if (_typeOfUseRepository != null)
            {
                var tou = await _typeOfUseRepository.GetByIdAsync(dto.TypeOfUseId.Value, ct);
                if (tou == null || !tou.IsActive)
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.TypeOfUseNotFoundOrInactiveTemplate, dto.TypeOfUseId.Value));
            }
        }

        // 11. RoomTypeId (Optional)
        if (dto.RoomTypeId.HasValue && dto.RoomTypeId.Value > 0)
        {
            if (_masterRepository != null)
            {
                if (!await _masterRepository.RoomTypeExistsAsync(dto.RoomTypeId.Value, ct))
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.RoomTypeNotFoundOrInactiveTemplate, dto.RoomTypeId.Value));
            }
            else if (_roomTypeRepository != null)
            {
                var roomType = await _roomTypeRepository.GetByIdAsync(dto.RoomTypeId.Value, ct);
                if (roomType == null || !roomType.IsActive)
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.RoomTypeNotFoundOrInactiveTemplate, dto.RoomTypeId.Value));
            }
        }

        // 12. WorkflowStageId (Optional)
        if (dto.WorkflowStageId.HasValue && dto.WorkflowStageId.Value > 0)
        {
            if (_masterRepository != null)
            {
                if (!await _masterRepository.WorkflowStageExistsAsync(dto.WorkflowStageId.Value, ct))
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.WorkflowStageNotFoundOrInactiveTemplate, dto.WorkflowStageId.Value));
            }
            else if (_workflowStageRepository != null)
            {
                var stage = await _workflowStageRepository.GetByIdAsync(dto.WorkflowStageId.Value, ct);
                if (stage == null || !stage.IsActive)
                    errors.Add(string.Format(CreatePropertiesFromRange.Messages.WorkflowStageNotFoundOrInactiveTemplate, dto.WorkflowStageId.Value));
            }
        }

        return errors;
    }
}

