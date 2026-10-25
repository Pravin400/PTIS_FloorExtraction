using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.DeleteFlat;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class DeleteFlatService : IDeleteFlatService
{
    private readonly ILogger<DeleteFlatService> _logger;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteFlatService(
        ILogger<DeleteFlatService> logger,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsRepository,
        IUnitOfWork unit)
    {
        _logger = logger;
        _unitOfWork = unit;
        _propertyRepository = propertyRepository;
        _wingDetailsRepository = wingDetailsRepository;
    }

    public async Task<DeleteFlatResponseDto> SoftDeleteFlatAsync(DeleteFlatRequestDto requestDto, int currentUserId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("SoftDelete request. FilterType: {FilterType}, FilterValue: {FilterValue}, CurrentUserId: {CurrentUserId}", requestDto.FilterType, requestDto.FilterValue, currentUserId);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            DeleteFlatResponseDto response;

            if (string.Equals(requestDto.FilterType, FilterTypeConstants.PropertyWise, StringComparison.OrdinalIgnoreCase))
            {
                response = await SoftDeletePropertyWiseAsync(requestDto.FilterValue, currentUserId, cancellationToken);
            }
            else if (string.Equals(requestDto.FilterType, FilterTypeConstants.WingWise, StringComparison.OrdinalIgnoreCase))
            {
                response = await SoftDeleteWingWiseAsync(requestDto.FilterValue, currentUserId, cancellationToken);
            }
            else if (string.Equals(requestDto.FilterType, FilterTypeConstants.SocietyWise, StringComparison.OrdinalIgnoreCase))
            {
                response = await SoftDeleteSocietyWiseAsync(requestDto.FilterValue, currentUserId, cancellationToken);
            }
            else
            {
                throw new ValidationException("filterType", $"Filter type '{requestDto.FilterType}' is not supported.", OperationType.Delete);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            return response;
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            _logger.LogError(ex, "Error deleting properties. FilterType: {FilterType}, FilterValue: {FilterValue}, CurrentUserId: {CurrentUserId}", requestDto.FilterType, requestDto.FilterValue, currentUserId);
            throw;
        }
    }

    private async Task<DeleteFlatResponseDto> SoftDeletePropertyWiseAsync(int propertyId, int currentUserId, CancellationToken cancellationToken)
    {
        var property = await GetBasePropertyQuery()
            .Where(p => p.Id == propertyId)
            .Select(p => new { p.Id, p.WingDetailId, p.PartitionNo })
            .FirstOrDefaultAsync(cancellationToken);

        if (property == null)
        {
            throw new ValidationException("Property", "The requested active Flat was not found or is not eligible for deletion.", OperationType.Delete);
        }

        if (property.WingDetailId == null || property.WingDetailId <= 0)
        {
            throw new ValidationException("Property", "This property does not belong to any wing and cannot be deleted.", OperationType.Delete);
        }

        var wingFlats = await GetBasePropertyQuery()
            .Where(p => p.WingDetailId == property.WingDetailId)
            .Select(p => new { p.Id, p.PartitionNo })
            .ToListAsync(cancellationToken);

        var lastFlat = wingFlats
           .Where(p => !string.IsNullOrWhiteSpace(p.PartitionNo))
           .OrderByDescending(p => p.PartitionNo!.Any(char.IsDigit)
            ? Convert.ToInt32(new string(p.PartitionNo!.Where(char.IsDigit).ToArray())) : 0)
           .ThenByDescending(p => p.Id)
           .FirstOrDefault();

        if (lastFlat == null || property.Id != lastFlat.Id)
        {
            throw new ValidationException("Property", $"Property {property.PartitionNo} cannot be deleted because it is not the last property in the wing.", OperationType.Delete);
        }

        var propertiesQuery = GetBasePropertyQuery().Where(p => p.Id == propertyId && p.WingDetailId == property.WingDetailId);
        return await ExecuteSoftDeleteAsync(propertiesQuery, FilterTypeConstants.PropertyWise, propertyId, currentUserId, cancellationToken);
    }

    private async Task<DeleteFlatResponseDto> SoftDeleteWingWiseAsync(int wingDetailId, int currentUserId, CancellationToken cancellationToken)
    {
        var wingExists = await _wingDetailsRepository.GetQueryable()
            .AnyAsync(w => w.Id == wingDetailId && w.IsActive && !w.MarkedForDeletion, cancellationToken);

        if (!wingExists)
        {
            throw new ValidationException(FilterTypeConstants.WingWise, "Wing not found or is inactive.", OperationType.Delete);
        }

        var propertiesQuery = GetBasePropertyQuery().Where(p => p.WingDetailId == wingDetailId);
        return await ExecuteSoftDeleteAsync(propertiesQuery, FilterTypeConstants.WingWise, wingDetailId, currentUserId, cancellationToken);
    }

    private async Task<DeleteFlatResponseDto> SoftDeleteSocietyWiseAsync(int societyDetailId, int currentUserId, CancellationToken cancellationToken)
    {
        var wingDetailIds = await _wingDetailsRepository.GetQueryable()
            .Where(w => w.SocietyDetailsMastId == societyDetailId && w.IsActive && !w.MarkedForDeletion)
            .Select(w => w.Id)
            .ToListAsync(cancellationToken);

        if (!wingDetailIds.Any())
        {
            throw new ValidationException(FilterTypeConstants.SocietyWise, "Society not found or has no active wings.", OperationType.Delete);
        }

        var propertiesQuery = GetBasePropertyQuery()
            .Where(p => p.WingDetailId.HasValue && wingDetailIds.Contains(p.WingDetailId.Value));

        return await ExecuteSoftDeleteAsync(propertiesQuery, FilterTypeConstants.SocietyWise, societyDetailId, currentUserId, cancellationToken);
    }

    private IQueryable<PropertyEntity> GetBasePropertyQuery()
    {
        return _propertyRepository.GetQueryable()
            .Where(p => p.IsActive && !p.MarkedForDeletion &&
               !string.IsNullOrWhiteSpace(p.PartitionNo) &&
                p.PartitionNo.Trim() != "-" &&
                p.PropertyTypeMaster != null &&
                p.PropertyTypeMaster.PartType != PropertyPartTypes.Amenity);
    }

    private async Task<DeleteFlatResponseDto> ExecuteSoftDeleteAsync(IQueryable<PropertyEntity> propertiesQuery, string filterType, int filterValue, int currentUserId, CancellationToken cancellationToken)
    {
        var status = await propertiesQuery.AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                SurveyVerified = g.Any(p =>
                    p.WorkflowHistory.Any(workflow =>
                        workflow.IsActive &&
                        workflow.PropertySurveyVisits.Any(visit =>
                            visit.IsActive &&
                            visit.InternalSurveyVerified == true))),

                SubmissionComplete = g.Any(p =>
                    p.PropertyDetails.Any(detail =>
                        detail.IsActive &&
                        !detail.MarkedForDeletion &&
                        (detail.CarpetAreaSqMeter ?? 0) > 0 &&
                        (detail.BuiltupAreaSqMeter ?? 0) > 0))
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (status != null && status.SurveyVerified)
        {
            throw new ValidationException("Survey", "Properties cannot be deleted because internal survey is verified.", OperationType.Delete);
        }

        if (status != null && status.SubmissionComplete)
        {
            throw new ValidationException("Submission", "Properties cannot be deleted because submission is completed.", OperationType.Delete);
        }

        var affectedPropertyIds = await propertiesQuery
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        if (!affectedPropertyIds.Any())
        {
            throw new ValidationException(filterType, $"{filterType} flat not found", OperationType.Delete);
        }

        var currentDate = DateTime.Now;

        // 1. PropertyMastDetails - bulk soft delete
        await propertiesQuery
            .SelectMany(p => p.PropertyMastDetails)
            .Where(d => d.IsActive && !d.MarkedForDeletion)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(d => d.IsActive, false)
                    .SetProperty(d => d.MarkedForDeletion, true)
                    .SetProperty(d => d.MarkedForDeletionDate, currentDate)
                    .SetProperty(d => d.UpdatedBy, currentUserId)
                    .SetProperty(d => d.UpdatedDate, currentDate),
                cancellationToken);

        // 2. PropertyDetails - bulk soft delete
        await propertiesQuery
            .SelectMany(p => p.PropertyDetails)
            .Where(d => d.IsActive && !d.MarkedForDeletion)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(d => d.IsActive, false)
                    .SetProperty(d => d.MarkedForDeletion, true)
                    .SetProperty(d => d.MarkedForDeletionDate, currentDate)
                    .SetProperty(d => d.UpdatedBy, currentUserId)
                    .SetProperty(d => d.UpdatedDate, currentDate),
                cancellationToken);

        // 3. PropertySurveyVisits - bulk soft delete
        await propertiesQuery
            .SelectMany(p => p.WorkflowHistory)
            .SelectMany(w => w.PropertySurveyVisits)
            .Where(v => v.IsActive)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(v => v.IsActive, false)
                    .SetProperty(v => v.UpdatedBy, currentUserId)
                    .SetProperty(v => v.UpdatedDate, currentDate),
                cancellationToken);

        // 4. WorkflowHistory - bulk soft delete
        await propertiesQuery
            .SelectMany(p => p.WorkflowHistory)
            .Where(x => x.IsActive)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.IsActive, false)
                    .SetProperty(x => x.UpdatedBy, currentUserId)
                    .SetProperty(x => x.UpdatedDate, currentDate),
                cancellationToken);

        // 5. PropertyMast - bulk soft delete
        await propertiesQuery
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(p => p.IsActive, false)
                    .SetProperty(p => p.MarkedForDeletion, true)
                    .SetProperty(p => p.MarkedForDeletionDate, currentDate)
                    .SetProperty(p => p.UpdatedBy, currentUserId)
                    .SetProperty(p => p.UpdatedDate, currentDate),
                cancellationToken);

        var message = affectedPropertyIds.Count == 1 ? "1 Flat deleted successfully." : $"{affectedPropertyIds.Count} Flats deleted successfully.";

        return new DeleteFlatResponseDto
        {
            Success = true,
            Message = message,
            FilterType = filterType,
            FilterValue = filterValue,
            DeletedCount = affectedPropertyIds.Count,
            AffectedPropertyIds = affectedPropertyIds
        };
    }
}
