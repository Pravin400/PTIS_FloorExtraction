using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocument;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetGrievanceDocumentApplicationService : IAssetGrievanceDocumentApplicationService
{
    private readonly IRepository<AssetGrievanceDocumentEntity, int> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly NtisPlatform.Application.Interfaces.ICurrentUserService _currentUserService;

    public AssetGrievanceDocumentApplicationService(
        IRepository<AssetGrievanceDocumentEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        NtisPlatform.Application.Interfaces.ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _currentUserService = currentUserService;
    }

    public async Task<AssetGrievanceDocumentBulkSaveResponseDto> BulkSaveAsync(AssetGrievanceDocumentBulkSaveDto request, CancellationToken cancellationToken = default)
    {
        var response = new AssetGrievanceDocumentBulkSaveResponseDto
        {
            GrievanceDetailsId = request.GrievanceDetailsId
        };

        foreach (var doc in request.Documents)
        {
            try
            {
                AssetGrievanceDocumentEntity entity;

                if (doc.Id.HasValue && doc.Id.Value > 0)
                {
                    entity = await _repository.GetByIdAsync(doc.Id.Value, cancellationToken)
                             ?? throw new KeyNotFoundException($"AssetGrievanceDocument with ID {doc.Id.Value} not found.");

                    if (entity.GrievanceDetailsId != request.GrievanceDetailsId || entity.DocumentTypeId != doc.DocumentTypeId)
                    {
                        throw new ArgumentException("Document ID does not match the supplied grievance/document type.", nameof(doc.Id));
                    }

                    entity.DisplayOrder = doc.DisplayOrder;
                    entity.Remarks = doc.Remarks;
                    entity.UpdatedDate = DateTime.UtcNow;
                    entity.UpdatedBy = _currentUserService.GetCurrentUserId() > 0 ? _currentUserService.GetCurrentUserId() : 1;
                    entity.IsActive = doc.IsEnabled;
                    if (!doc.IsEnabled)
                    {
                        entity.MarkedForDeletion = true;
                    }
                    
                    await _repository.UpdateAsync(entity, cancellationToken);
                }
                else
                {
                    if (!doc.IsEnabled) continue; // Skip creating disabled slots
                    
                    entity = new AssetGrievanceDocumentEntity
                    {
                        GrievanceDetailsId = request.GrievanceDetailsId,
                        DocumentTypeId = doc.DocumentTypeId,
                        DisplayOrder = doc.DisplayOrder,
                        Remarks = doc.Remarks,
                        IsLatest = true,
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow,
                        CreatedBy = _currentUserService.GetCurrentUserId() > 0 ? _currentUserService.GetCurrentUserId() : 1
                    };

                    await _repository.AddAsync(entity, cancellationToken);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                
                // Fetch the entity with includes to map it properly
                var query = _repository.GetQueryable()
                    .Include(x => x.DocumentType)
                    .Include(x => x.DocumentBinding)
                        .ThenInclude(db => db != null ? db.Document : null)
                    .Where(x => x.Id == entity.Id);
                var fullEntity = await query.FirstOrDefaultAsync(cancellationToken);

                if (doc.IsEnabled)
                    response.EnabledCount++;
                else
                    response.DisabledCount++;

                if (fullEntity != null)
                {
                    response.SavedDocuments.Add(_mapper.Map<AssetGrievanceDocumentResponseDto>(fullEntity));
                }
                response.TotalProcessed++;
            }
            catch (Exception ex)
            {
                response.Errors.Add($"Error saving document slot: {ex.Message}");
            }
        }

        return response;
    }

    public async Task<List<AssetGrievanceDocumentResponseDto>> GetDocumentsByGrievanceIdAsync(int grievanceDetailsId, CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable()
            .Include(x => x.DocumentType)
            .Include(x => x.DocumentBinding)
                .ThenInclude(db => db != null ? db.Document : null)
            .Where(x => x.GrievanceDetailsId == grievanceDetailsId && x.IsActive && !x.MarkedForDeletion);

        var entities = await query.ToListAsync(cancellationToken);
        
        return _mapper.Map<List<AssetGrievanceDocumentResponseDto>>(entities);
    }
}
