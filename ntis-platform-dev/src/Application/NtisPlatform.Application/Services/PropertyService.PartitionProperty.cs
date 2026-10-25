using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public partial class PropertyService
{
    /// <summary>
    /// Generates missing partition properties for a given main property based on existing partitions.
    /// Identifies gaps in the partition sequence (e.g., if P1 and P3 exist, P2 is considered missing)
    /// and creates new property records for those missing partitions.
    /// </summary>
    /// <param name="request">The request containing WardId, MainPropertyNo, and UserId.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A response containing details of created and skipped partitions.</returns>
    public async Task<ApiResponse<GenerateMissingPartitionResponseDto>> GenerateMissingPartition(GenerateMissingPartitionRequestDto request, CancellationToken cancellationToken = default)
    {
        // Validate the requested Ward ID
        if (request.WardId <= 0)
            return ErrorResponse("GenerateMissingPartition_WardId_is_Invalid.", request);

        // Validate that the main property number is provided
        if (string.IsNullOrWhiteSpace(request.MainPropertyNo))
            return ErrorResponse("GenerateMissingPartition_MainPropertyNo_is_required.", request);

        // Validate the User ID making the request
        if (request.UserId <= 0)
            return ErrorResponse("GenerateMissingPartition_UserId_is_required.", request);

        if (request.ModuleId.HasValue && request.ModuleId.Value <= 0)
            return ErrorResponse("GenerateMissingPartition_ModuleId_is_Invalid.", request);

        // Check if the user exists in the system
        var users = await _userRepository.GetAsync(
            x => x.Id == request.UserId && x.IsActive && !x.MarkedForDeletion, cancellationToken);
        var isUserExists = users.Any();

        if (!isUserExists)
            return ErrorResponse("GenerateMissingPartition_User_not_found.", request);

        // Check if the requested ward is actively allocated to the user
        var wardAllocations = await _wardAllocationRepository.GetAsync(
            x => x.UserId == request.UserId && 
                 x.WardId == request.WardId && 
                 x.IsActive &&
                 !x.MarkedForDeletion &&
                 (!request.ModuleId.HasValue || x.ModuleId == request.ModuleId.Value), 
            cancellationToken);
        var isWardAllocated = wardAllocations.Any();

        if (!isWardAllocated)
            return ErrorResponse("GenerateMissingPartition_Ward_not_allocated.", request);

        // Fetch the ward details to get the WardNo for UPIC ID generation
        var ward = await _wardRepository.GetByIdAsync(request.WardId, cancellationToken);
        var wardNo = !string.IsNullOrWhiteSpace(ward?.WardNo) ? ward.WardNo : request.WardId.ToString();

        // Clean up the input property number
        var mainPropertyNo = request.MainPropertyNo.Trim();

        // Fetch the main property details to ensure it exists and is active
        var mainProperties = await _repository.GetAsync(x =>
                x.WardId == request.WardId &&
                x.PropertyNo == mainPropertyNo &&
                x.IsActive,
                cancellationToken);
        var mainProperty = mainProperties.FirstOrDefault();

        if (mainProperty == null)
            return ErrorResponse("GenerateMissingPartition_Main_property_not_found.", request);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Fetch all existing partition numbers for the given main property (including inactive to prevent unique index collisions)
            var existingPartitions = await _repository.GetQueryable()
                .Where(x =>
                    x.WardId == request.WardId &&
                    x.PropertyNo == mainProperty.PropertyNo &&
                    !string.IsNullOrWhiteSpace(x.PartitionNo))
                .Select(x => x.PartitionNo)
                .ToListAsync(cancellationToken);

            // Extract the numerical parts of the existing partition numbers to find gaps
            var existingNumbers = existingPartitions
                .Select(ExtractPartitionNumber)
                .Where(x => x > 0)
                .Distinct()
                .ToHashSet();

            var createdList = new List<string>();
            var skippedList = new List<string>();
            var newProperties = new List<PropertyEntity>();

            // Identify the partition prefix from existing records (e.g., 'P' in 'P1')
            var firstPartition = existingPartitions.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x));
            var partitionPrefix = ExtractPartitionPrefix(firstPartition);

            // Determine the maximum partition number to iterate up to
            var maxIndex = existingNumbers.Count > 0 ? existingNumbers.Max() : 0;

            // Iterate from 1 to the maximum partition number to find and generate missing partitions
            for (int i = 1; i <= maxIndex; i++)
            {
                var partitionNo = $"{partitionPrefix}{i}";
                var generatedPropertyNo = $"{mainProperty.PropertyNo}-{partitionNo}";

                // If the partition number already exists, skip it
                if (existingNumbers.Contains(i))
                {
                    skippedList.Add(generatedPropertyNo);
                    continue;
                }

                var upicId = UpicIdBuilderHelper.Generate(wardNo, mainPropertyNo, partitionNo);
                PropertyEntity newProperty;

                if (request.IsMainPropertyDataAttach)
                {
                    // Clone main property and copy all its details for missing partition
                    newProperty = _mapper.Map<PropertyEntity>(mainProperty);

                    // Override cloned fields with specific values for the new partition
                    newProperty.Id = 0;
                    newProperty.PropertyNo = mainProperty.PropertyNo;
                    newProperty.UPICId = upicId;
                    newProperty.IsActive = true;
                    newProperty.PartitionNo = partitionNo;
                    newProperty.MarkedForDeletion = false;
                    newProperty.CreatedBy = request.UserId;
                    newProperty.UpdatedBy = null;
                    newProperty.PropertyAssessmentStatusId = mainProperty.PropertyAssessmentStatusId;
                }
                else
                {
                    // Create a new property entity for the missing partition
                    newProperty = new PropertyEntity
                    {
                        WardId = mainProperty.WardId,
                        TaxZoneId = mainProperty.TaxZoneId,
                        PropertyNo = mainProperty.PropertyNo,
                        PropertySeqNo = mainProperty.PropertySeqNo,
                        PropertyAssessmentStatusId = mainProperty.PropertyAssessmentStatusId,
                        OwnerName = "धारक", 
                        OwnerNameEnglish = "The Holder",
                        PartitionNo = partitionNo,
                        UPICId = upicId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        CreatedBy = request.UserId
                    };
                }

                newProperties.Add(newProperty);
                createdList.Add(generatedPropertyNo);
            }

            // If there are new partitions to create, persist them to the database
            if (newProperties.Count > 0)
            {
                await _repository.AddRangeAsync(newProperties, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Persist workflow details for newly created missing partition properties
                await PersistPartitionWorkflowDetailsAsync(newProperties, request.ModuleId, request.UserId, cancellationToken);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            // Return the results including the count and lists of created and skipped partitions
            return new ApiResponse<GenerateMissingPartitionResponseDto>
            {
                Success = true,
                Message = createdList.Count > 0 ? "GenerateMissingPartition_Success." : "GenerateMissingPartition_No_missing_found.",
                Items = new GenerateMissingPartitionResponseDto
                {
                    MainPropertyNo = mainPropertyNo,
                    MissingFoundCount = createdList.Count,
                    CreatedCount = createdList.Count,
                    CreatedList = createdList,
                    SkippedList = skippedList
                }
            };
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            _unitOfWork.DiscardChanges();
            throw;
        }
    }

    /// <summary>
    /// Helper method to construct a standardized error response.
    /// </summary>
    /// <param name="message">The error message.</param>
    /// <param name="request">The original request.</param>
    /// <returns>An error response DTO.</returns>
    private static ApiResponse<GenerateMissingPartitionResponseDto> ErrorResponse(string message, GenerateMissingPartitionRequestDto request)
    {
        return new ApiResponse<GenerateMissingPartitionResponseDto>
        {
            Success = false,
            Message = message,
            Items = new GenerateMissingPartitionResponseDto
            {
                MainPropertyNo = request.MainPropertyNo,
                MissingFoundCount = 0,
                CreatedCount = 0,
                CreatedList = new List<string>(),
                SkippedList = new List<string>()
            }
        };
    }

    /// <summary>
    /// Extracts the numeric portion from a partition string
    /// </summary>
    /// <param name="partitionNo">The partition number string.</param>
    /// <returns>The extracted integer value, or 0 if extraction fails.</returns>
    private static int ExtractPartitionNumber(string? partitionNo)
    {
        if (string.IsNullOrWhiteSpace(partitionNo))
            return 0;

        // Use regex to find the trailing digits
        var match = System.Text.RegularExpressions.Regex.Match(partitionNo.Trim(), @"(\d+)$");

        return match.Success && int.TryParse(match.Groups[1].Value, out var number) ? number : 0;
    }

    /// <summary>
    /// Extracts the alphabetical prefix from a partition string (e.g., extracts "P" from "P1").
    /// </summary>
    /// <param name="partitionNo">The partition number string.</param>
    /// <returns>The extracted prefix, or "" by default.</returns>
    private static string ExtractPartitionPrefix(string? partitionNo)
    {
        if (string.IsNullOrWhiteSpace(partitionNo))
            return "";

        // Use regex to separate the non-digit prefix from the trailing digits
        var match = System.Text.RegularExpressions.Regex.Match(partitionNo.Trim(), @"^(.*?)(\d+)$");

        return match.Success && !string.IsNullOrEmpty(match.Groups[1].Value) ? match.Groups[1].Value : "";
    }

    /// <summary>
    /// Creates a specified count of new sequential partition properties for a given main property,
    /// sequentially appending partition numbers after the highest existing partition index.
    /// Validates user, ward allocation, and main property existence before creating.
    /// </summary>
    /// <param name="request">The request containing WardId, MainPropertyNo, UserId, Nopartition count, and IsMainPropertyDataAttach.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A response containing details and generated UPIC IDs for all created partitions.</returns>
    public async Task<ApiResponse<CreateNewPartitionResponseDto>> CreateNewPartitionPropertysAsync(CreateNewPartitionRequestDto request, CancellationToken cancellationToken = default)
    {
        // Validate the requested Ward ID
        if (request.WardId <= 0)
            return CreateNewPartitionErrorResponse("CreateNewPartition_WardId_is_Invalid.", request);

        // Validate that the main property number is provided
        if (string.IsNullOrWhiteSpace(request.MainPropertyNo))
            return CreateNewPartitionErrorResponse("CreateNewPartition_MainPropertyNo_is_required.", request);

        // Validate the User ID making the request
        if (request.UserId <= 0)
            return CreateNewPartitionErrorResponse("CreateNewPartition_UserId_is_required.", request);

        const int MaxAllowedPartitionsPerRequest = 1000;

        // Validate that the requested number of partitions is greater than 0 and within upper bound limit
        if (request.Nopartition <= 0)
            return CreateNewPartitionErrorResponse("CreateNewPartition_Nopartition_must_be_greater_than_zero.", request);

        if (request.Nopartition > MaxAllowedPartitionsPerRequest)
            return CreateNewPartitionErrorResponse($"CreateNewPartition_Nopartition_exceeds_maximum_limit_of_{MaxAllowedPartitionsPerRequest}.", request);

        if (request.ModuleId.HasValue && request.ModuleId.Value <= 0)
            return CreateNewPartitionErrorResponse("CreateNewPartition_ModuleId_is_Invalid.", request);

        // Check if the user exists in the system
        var users = await _userRepository.GetAsync(
            x => x.Id == request.UserId && x.IsActive && !x.MarkedForDeletion, cancellationToken);
        var isUserExists = users.Any();

        if (!isUserExists)
            return CreateNewPartitionErrorResponse("CreateNewPartition_User_not_found.", request);

        // Check if the requested ward is actively allocated to the user
        var wardAllocations = await _wardAllocationRepository.GetAsync(
            x => x.UserId == request.UserId && 
                 x.WardId == request.WardId && 
                 x.IsActive &&
                 !x.MarkedForDeletion &&
                 (!request.ModuleId.HasValue || x.ModuleId == request.ModuleId.Value), 
            cancellationToken);
        var isWardAllocated = wardAllocations.Any();

        if (!isWardAllocated)
            return CreateNewPartitionErrorResponse("CreateNewPartition_Ward_not_allocated.", request);

        // Fetch the ward details to get the WardNo
        var ward = await _wardRepository.GetByIdAsync(request.WardId, cancellationToken);
        var wardNo = !string.IsNullOrWhiteSpace(ward?.WardNo) ? ward.WardNo : request.WardId.ToString();

        // Clean up the input property number
        var mainPropertyNo = request.MainPropertyNo.Trim();

        // Fetch the main property details to ensure it exists and is active
        var mainProperties = await _repository.GetAsync(x =>
                x.WardId == request.WardId &&
                x.PropertyNo == mainPropertyNo &&
                x.IsActive,
                cancellationToken);
        var mainProperty = mainProperties.FirstOrDefault();

        if (mainProperty == null)
            return CreateNewPartitionErrorResponse("CreateNewPartition_Main_property_not_found.", request);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Fetch all existing partition numbers for the given main property (including inactive to prevent unique index collisions)
            var existingPartitions = await _repository.GetQueryable()
                .Where(x =>
                    x.WardId == request.WardId &&
                    x.PropertyNo == mainProperty.PropertyNo &&
                    !string.IsNullOrWhiteSpace(x.PartitionNo))
                .Select(x => new
                {
                    x.Id,
                    x.PropertyNo,
                    x.PartitionNo,
                    x.UPICId
                })
                .ToListAsync(cancellationToken);

            var newProperties = new List<PropertyEntity>();

            // Identify the partition prefix from existing records 
            var firstPartition = existingPartitions.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.PartitionNo))?.PartitionNo;
            var partitionPrefix = ExtractPartitionPrefix(firstPartition);
            
            if (string.IsNullOrEmpty(partitionPrefix))
            {
                partitionPrefix = ""; 
            }

            // Determine the maximum partition number currently in the database
            var existingNumbers = existingPartitions
                .Select(x => ExtractPartitionNumber(x.PartitionNo))
                .Where(x => x > 0)
                .ToList();
                
            var maxIndex = existingNumbers.Count > 0 ? existingNumbers.Max() : 0;

            // Generate the next 'Nopartition' new partitions
            for (int i = 1; i <= request.Nopartition; i++)
            {
                var newIndex = maxIndex + i;
                var partitionNo = $"{partitionPrefix}{newIndex}";
                var upicId = UpicIdBuilderHelper.Generate(wardNo, mainPropertyNo, partitionNo);
                
                PropertyEntity newProperty;

                if (request.IsMainPropertyDataAttach)
                {
                    // Clone main property and copy all its details for new partition
                    newProperty = _mapper.Map<PropertyEntity>(mainProperty);

                    // Override cloned fields with specific values for the new partition
                    newProperty.PropertyNo = mainProperty.PropertyNo;
                    newProperty.UPICId = upicId;
                    newProperty.IsActive = true;
                    newProperty.PartitionNo = partitionNo;
                    newProperty.MarkedForDeletion = false;
                    newProperty.CreatedBy = request.UserId;
                    newProperty.Id = 0;
                    newProperty.UpdatedBy = null;
                    newProperty.PropertyAssessmentStatusId = mainProperty.PropertyAssessmentStatusId;
                }
                else
                {
                    // Create a new property entity for the new partition
                    newProperty = new PropertyEntity
                    {
                        WardId = mainProperty.WardId,
                        TaxZoneId = mainProperty.TaxZoneId,
                        PropertyNo = mainProperty.PropertyNo,
                        PropertySeqNo = mainProperty.PropertySeqNo,
                        PropertyAssessmentStatusId = mainProperty.PropertyAssessmentStatusId,
                        OwnerName = "धारक",
                        OwnerNameEnglish = "The Holder",
                        PartitionNo = partitionNo,
                        UPICId = upicId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        CreatedBy = request.UserId
                    };
                }

                newProperties.Add(newProperty);
            }

            // If there are new partitions to create, persist them to the database
            if (newProperties.Count > 0)
            {
                await _repository.AddRangeAsync(newProperties, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Persist workflow details for newly created partition properties
                await PersistPartitionWorkflowDetailsAsync(newProperties, request.ModuleId, request.UserId, cancellationToken);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            // Build the created list from saved entities.
            var createdList = newProperties.Select(p => new CreatedPartitionDetailDto
            {
                PropertyId = p.Id,
                PropertyNo = p.PropertyNo ?? string.Empty,
                PartitionNo = p.PartitionNo ?? string.Empty,
                UPICId = p.UPICId ?? string.Empty
            }).ToList();

            string responseMessage;
            if (createdList.Count > 0)
            {
                var firstCreatedPartition = createdList.First().PartitionNo;
                var lastCreatedPartition = createdList.Last().PartitionNo;

                responseMessage = $"Property no {mainPropertyNo} is Partition no {firstCreatedPartition} to {lastCreatedPartition} generated successfully";
            }
            else
            {
                responseMessage = "CreateNewPartition_No_new_partitions_created.";
            }

            // Return the results including the count and list of created partitions
            return new ApiResponse<CreateNewPartitionResponseDto>
            {
                Success = true,
                Message = responseMessage,
                Items = new CreateNewPartitionResponseDto
                {
                    MainPropertyNo = mainPropertyNo,
                    CreatedCount = createdList.Count,
                    CreatedList = createdList
                }
            };
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            _unitOfWork.DiscardChanges();
            throw;
        }
    }

    /// <summary>
    /// Helper method to construct a standardized error response for CreateNewPartition.
    /// </summary>
    /// <param name="message">The error message.</param>
    /// <param name="request">The original request.</param>
    /// <returns>An error response DTO.</returns>
    private static ApiResponse<CreateNewPartitionResponseDto> CreateNewPartitionErrorResponse(
        string message,
        CreateNewPartitionRequestDto request)
    {
        return new ApiResponse<CreateNewPartitionResponseDto>
        {
            Success = false,
            Message = message,
            Items = new CreateNewPartitionResponseDto
            {
                MainPropertyNo = request.MainPropertyNo,
                CreatedCount = 0,
                CreatedList = new List<CreatedPartitionDetailDto>()
            }
        };
    }

    /// <summary>
    /// Persists workflow details records in PTIS.PropertyWorkflowDetails for newly created partition properties.
    /// Resolves WorkflowStageId using WorkflowStageConstants.GeoSequencing (defaulting to 1).
    /// </summary>
    private async Task PersistPartitionWorkflowDetailsAsync(
        List<PropertyEntity> newProperties,
        int? moduleId,
        int userId,
        CancellationToken cancellationToken)
    {
        var workflowDetailsRepo = _workflowDetailsRepository ?? _serviceProvider?.GetService<IPropertyWorkflowDetailsRepository>();
        if (workflowDetailsRepo == null || newProperties.Count == 0) return;

        // Resolve GeoSequencing stage ID using WorkflowStageConstants.GeoSequencing
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
                    .FirstOrDefaultAsync(cancellationToken);

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

        var workflowEntries = new List<PropertyWorkflowDetailsEntity>();
        for (int i = 0; i < newProperties.Count; i++)
        {
            workflowEntries.Add(new PropertyWorkflowDetailsEntity
            {
                PropertyId = newProperties[i].Id,
                WorkflowStageId = workflowStageId,
                ModuleId = moduleId,
                CurrentStatus = true,
                IsActive = true,
                CreatedBy = userId,
                CreatedDate = DateTime.Now
            });
        }

        await workflowDetailsRepo.AddRangeAsync(workflowEntries, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
