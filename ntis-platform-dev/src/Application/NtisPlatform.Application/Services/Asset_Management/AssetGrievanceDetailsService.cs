using System.Text.Json;
using System.Text.Encodings.Web;
using System.Linq;
using System.Collections.Generic;
using NtisPlatform.Application.Exceptions;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDetails;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocument;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetGrievanceDetailsService :
    BaseCommonCrudService<
        AssetGrievanceDetailsEntity,
        AssetGrievanceDetailsDto,
        CreateAssetGrievanceDetailsDto,
        UpdateAssetGrievanceDetailsDto,
        AssetGrievanceDetailsQueryParameters,
        int>,
    IAssetGrievanceDetailsService
{
    private readonly IAssetGrievanceDocumentApplicationService _documentService;
    private readonly IDocumentApplicationService _globalDocumentService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<AssetPhotoEntity, int> _assetPhotoRepository;
    private readonly IRepository<AssetMasterEntity, int> _assetMasterRepository;
    private readonly IRepository<AssetGrievanceCategoryEntity, int> _categoryRepository;
    private readonly IRepository<AssetGrievanceCorrectionDetailEntity, int> _correctionDetailRepository;
    private readonly IRepository<AssetGrievanceActionHistoryEntity, int> _actionHistoryRepository;
    private readonly IRepository<AssetGrievanceDocumentEntity, int> _grievanceDocumentRepository;
    private readonly IRepository<AssetGrievanceMediaCorrectionEntity, int> _mediaCorrectionRepository;
    private readonly IRepository<GrievanceWorkflowStageMasterEntity, int> _stageRepository;
    private readonly IEnumerable<IAssetGrievanceCorrectionApplier> _correctionAppliers;
    private readonly IEnumerable<IAssetGrievanceMediaCorrectionApplier> _mediaCorrectionAppliers;
    private readonly ILogger<AssetGrievanceDetailsService> _logger;

    private const string StatusRaised = "Raised";
    private const string StatusCorrectionDone = "CorrectionDone";
    private const string StatusSentBack = "SentBack";
    private const string StatusVerified = "Verified";
    private const string StatusResolved = "Resolved";
    private const string StatusRejected = "Rejected";
    private const string StatusClosed = "Closed";
    private const string StatusReopened = "Reopened";

    private const string ActionCreated = "Created";
    private const string ActionSubmitCorrection = "SubmitCorrection";
    private const string ActionVerified = "Verified";
    private const string ActionForwarded = "Forwarded";
    private const string ActionSentBack = "SentBack";
    private const string ActionApproved = "Approved";
    private const string ActionRejected = "Rejected";
    private const string ActionClosed = "Closed";
    private const string ActionReopened = "Reopened";

    private static readonly JsonSerializerOptions UnicodeJsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public AssetGrievanceDetailsService(
        IRepository<AssetGrievanceDetailsEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IAssetGrievanceDocumentApplicationService documentService,
        IDocumentApplicationService globalDocumentService,
        ICurrentUserService currentUserService,
        IRepository<AssetPhotoEntity, int> assetPhotoRepository,
        IRepository<AssetMasterEntity, int> assetMasterRepository,
        IRepository<AssetGrievanceCategoryEntity, int> categoryRepository,
        IRepository<AssetGrievanceCorrectionDetailEntity, int> correctionDetailRepository,
        IRepository<AssetGrievanceActionHistoryEntity, int> actionHistoryRepository,
        IRepository<AssetGrievanceDocumentEntity, int> grievanceDocumentRepository,
        IRepository<AssetGrievanceMediaCorrectionEntity, int> mediaCorrectionRepository,
        IRepository<GrievanceWorkflowStageMasterEntity, int> stageRepository,
        IEnumerable<IAssetGrievanceCorrectionApplier> correctionAppliers,
        IEnumerable<IAssetGrievanceMediaCorrectionApplier> mediaCorrectionAppliers,
        ILogger<AssetGrievanceDetailsService> logger)
        : base(repository, unitOfWork, mapper)
    {
        _documentService = documentService;
        _globalDocumentService = globalDocumentService;
        _currentUserService = currentUserService;
        _assetPhotoRepository = assetPhotoRepository;
        _assetMasterRepository = assetMasterRepository;
        _categoryRepository = categoryRepository;
        _correctionDetailRepository = correctionDetailRepository;
        _actionHistoryRepository = actionHistoryRepository;
        _grievanceDocumentRepository = grievanceDocumentRepository;
        _mediaCorrectionRepository = mediaCorrectionRepository;
        _stageRepository = stageRepository;
        _correctionAppliers = correctionAppliers;
        _mediaCorrectionAppliers = mediaCorrectionAppliers;
        _logger = logger;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetGrievanceDetailsEntity entity, CancellationToken cancellationToken = default)
    {
        var duplicateNo = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.GrievanceNo == entity.GrievanceNo, cancellationToken);
        if (duplicateNo)
            return ValidationResult.Failure(nameof(entity.GrievanceNo), "A grievance with this Grievance Number already exists.");

        var activeStatuses = new[] { StatusResolved, StatusRejected, StatusClosed };

        // Check if an active/in-process grievance already exists for this AssetId
        var duplicateActiveAsset = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x =>
                x.AssetId == entity.AssetId &&
                !activeStatuses.Contains(x.WorkflowStatus),
                cancellationToken);
        if (duplicateActiveAsset)
            return ValidationResult.Failure(nameof(entity.AssetId), "A grievance ticket is already active for this selected asset. Please resolve or close the existing ticket before raising a new one.");

        // If a specific child record (TargetRecordId) is also provided, check if that record already has an active ticket
        if (entity.TargetRecordId.HasValue && !string.IsNullOrWhiteSpace(entity.TargetTableName))
        {
            var duplicateActiveChild = await _repository.GetQueryable().AsNoTracking()
                .AnyAsync(x =>
                    x.TargetTableName == entity.TargetTableName &&
                    x.TargetRecordId == entity.TargetRecordId &&
                    !activeStatuses.Contains(x.WorkflowStatus),
                    cancellationToken);
            if (duplicateActiveChild)
                return ValidationResult.Failure(nameof(entity.TargetRecordId), "A grievance ticket is already active for this selected asset/shop. Please resolve or close the existing ticket before raising a new one.");
        }

        return ValidationResult.Success();
    }

    private async Task<int?> ResolveDepartmentIdForAssetAsync(int assetId, CancellationToken cancellationToken)
        => await _assetMasterRepository.GetQueryable().AsNoTracking()
            .Where(a => a.Id == assetId)
            .Select(a => a.DepartmentId ?? a.ParentAsset!.DepartmentId)
            .FirstOrDefaultAsync(cancellationToken);

    /// <summary>
    /// The grievance list for <paramref name="currentUserId"/>. Per-user scoping is not applied yet: this
    /// returns the same as GetAllAsync. A user's scope is stored by the Asset User Allocation API in
    /// [AMS].[UserOwningDepartmentAllocation] (one row per owning department) and [AMS].[UserZoneAllocation]
    /// (one row per allocated ward); filtering on it belongs in the query itself (like
    /// AssetLeaseRentDetailsService.GetAllInternalAsync), not after paging.
    /// </summary>
    public async Task<PagedResult<AssetGrievanceDetailsDto>> GetAllForUserAsync(AssetGrievanceDetailsQueryParameters qp, int currentUserId, CancellationToken cancellationToken = default)
    {
        return await GetAllAsync(qp, cancellationToken);
    }

    /// <summary>Queue counts. Not scoped to <paramref name="currentUserId"/> yet (see GetAllForUserAsync).</summary>
    public async Task<AssetGrievanceDashboardStatsDto> GetDashboardStatsAsync(int currentUserId, CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking().Where(g => g.IsActive);
        var counts = await query
            .GroupBy(g => g.WorkflowStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);

        int CountFor(params string[] statuses) => statuses.Sum(s => counts.GetValueOrDefault(s));

        return new AssetGrievanceDashboardStatsDto
        {
            TotalApplications = counts.Values.Sum(),
            CorrectionPending = CountFor(StatusRaised, StatusSentBack),
            VerificationPending = CountFor(StatusCorrectionDone),
            ApprovalPending = CountFor(StatusVerified),
            ApprovalDone = CountFor(StatusResolved),
            Rejected = CountFor(StatusRejected),
            Closed = CountFor(StatusClosed),
        };
    }

    /// <summary>One grievance. Not scoped to <paramref name="currentUserId"/> yet (see GetAllForUserAsync).</summary>
    public async Task<AssetGrievanceDetailsDto?> GetByIdForUserAsync(int id, int currentUserId, CancellationToken cancellationToken = default)
    {
        return await GetByIdAsync(id, cancellationToken);
    }

    public override async Task<AssetGrievanceDetailsDto> CreateAsync(CreateAssetGrievanceDetailsDto createDto, CancellationToken cancellationToken = default)
    {
        // WorkflowStatus isn't a field on CreateAssetGrievanceDetailsDto at all — AssetGrievanceDetailsEntity
        // defaults it to Raised, so every grievance starts its life there with no way for a caller
        // to override it.

        // A freshly created ticket must always start active — CreateBaseDtos.IsActive has no
        // default (bool defaults to false), so a caller that omits the field entirely would
        // otherwise create an inactive row that GetByIdAsync treats as not-found.
        createDto.IsActive = true;

        // CreateForCitizenAsync stamps RaisedByChannel/RaisedByUserId before calling this method;
        // any other (employee-driven) caller defaults here. These two defaults are independent —
        // a caller can legitimately send RaisedByChannel="COUNCIL_EMPLOYEE" explicitly while still
        // expecting RaisedByUserId to default to the authenticated caller.
        if (string.IsNullOrWhiteSpace(createDto.RaisedByChannel))
        {
            createDto.RaisedByChannel = "COUNCIL_EMPLOYEE";
        }
        if (createDto.RaisedByChannel != "CITIZEN_PORTAL")
        {
            createDto.RaisedByUserId ??= _currentUserService.GetCurrentUserId();
        }

        if (string.IsNullOrWhiteSpace(createDto.GrievanceNo))
        {
            createDto.GrievanceNo = await GenerateGrievanceNoAsync(createDto.GrievanceTypeId, cancellationToken);
        }

        // Dynamically resolve TargetTableName from GrievanceCategoryMaster if not explicitly provided
        if (string.IsNullOrWhiteSpace(createDto.TargetTableName) && createDto.GrievanceTypeId > 0)
        {
            var category = await _categoryRepository.GetByIdAsync(createDto.GrievanceTypeId, cancellationToken);
            if (category != null && !string.IsNullOrWhiteSpace(category.TargetTableName))
            {
                createDto.TargetTableName = category.TargetTableName;
            }
        }

        List<AssetGrievanceDocumentItemDto>? docMetadata = null;
        if (!string.IsNullOrWhiteSpace(createDto.DocumentMetadataJson))
        {
            docMetadata = new List<AssetGrievanceDocumentItemDto>();
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var trimmed = createDto.DocumentMetadataJson.Trim();
                if (trimmed.StartsWith("["))
                {
                    docMetadata = JsonSerializer.Deserialize<List<AssetGrievanceDocumentItemDto>>(trimmed, options) ?? new List<AssetGrievanceDocumentItemDto>();
                }
                else if (trimmed.StartsWith("{"))
                {
                    var single = JsonSerializer.Deserialize<AssetGrievanceDocumentItemDto>(trimmed, options);
                    if (single != null)
                    {
                        docMetadata.Add(single);
                    }
                }
            }
            catch (JsonException)
            {
                throw new ValidationException(
                    "Document metadata JSON is invalid.",
                    new Dictionary<string, string> { ["DocumentMetadataJson"] = "Provide valid JSON array or object for document metadata." },
                    NtisPlatform.Application.Enums.OperationType.Create);
            }
        }

        var result = await base.CreateAsync(createDto, cancellationToken);

        int initialUserId = _currentUserService.GetCurrentUserId() == 0 ? (createDto.RaisedByUserId ?? 1) : _currentUserService.GetCurrentUserId();
        var initialHistory = new AssetGrievanceActionHistoryEntity
        {
            GrievanceDetailsId = result.Id,
            CycleNo = 1,
            Action = ActionCreated,
            PreviousWorkflowStatus = "New",
            NewWorkflowStatus = StatusRaised,
            ActionBy = initialUserId,
            ActionDate = DateTime.UtcNow,
            Remarks = !string.IsNullOrWhiteSpace(createDto.Description) ? createDto.Description : "Grievance ticket created",
            IsActive = true,
            CreatedBy = initialUserId,
            CreatedDate = DateTime.UtcNow
        };
        await _actionHistoryRepository.AddAsync(initialHistory, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (createDto.AssignedToUserId.HasValue)
        {
            var createdEntity = await _repository.GetByIdAsync(result.Id, cancellationToken);
            if (createdEntity != null)
            {
                createdEntity.AssignedToUserId = createDto.AssignedToUserId.Value;
                await _repository.UpdateAsync(createdEntity, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                result.AssignedToUserId = createDto.AssignedToUserId;
            }
        }

        if (createDto.DocumentFiles != null && createDto.DocumentFiles.Count > 0)
        {
            if (docMetadata == null || !docMetadata.Any())
            {
                docMetadata = createDto.DocumentFiles
                    .Where(f => f != null && f.Length > 0)
                    .Select(f => new AssetGrievanceDocumentItemDto
                    {
                        DocumentTypeId = 1,
                        Remarks = f.FileName
                    })
                    .ToList();
            }
        }

        if (docMetadata != null && docMetadata.Any())
        {
            var bulkSaveDto = new AssetGrievanceDocumentBulkSaveDto
            {
                GrievanceDetailsId = result.Id,
                Documents = docMetadata
            };

            int userId = _currentUserService.GetCurrentUserId() == 0 ? 1 : _currentUserService.GetCurrentUserId();
            var savedDocsResponse = await _documentService.BulkSaveAsync(bulkSaveDto, cancellationToken);
            
            if (savedDocsResponse.Errors.Any())
            {
                throw new ValidationException(
                    "Failed to save document metadata.",
                    new Dictionary<string, string> { ["Documents"] = string.Join(" | ", savedDocsResponse.Errors) },
                    NtisPlatform.Application.Enums.OperationType.Create);
            }

            if (createDto.DocumentFiles != null && createDto.DocumentFiles.Count > 0)
            {
                for (var i = 0; i < createDto.DocumentFiles.Count; i++)
                {
                    var file = createDto.DocumentFiles[i];
                    if (file == null || file.Length <= 0)
                        continue;

                    var meta = docMetadata.ElementAtOrDefault(i);
                    var registeredSlot = (meta != null
                        ? savedDocsResponse.SavedDocuments.FirstOrDefault(x => x.DocumentTypeId == meta.DocumentTypeId && (!x.DocumentBindingId.HasValue || x.DocumentBindingId == 0))
                        : null)
                        ?? savedDocsResponse.SavedDocuments.ElementAtOrDefault(i)
                        ?? savedDocsResponse.SavedDocuments.FirstOrDefault();

                    if (registeredSlot == null)
                        continue;

                    await using var fileStream = file.OpenReadStream();
                    var docUploadResult = await _globalDocumentService.UploadDocumentAsync(
                        fileStream,
                        file.FileName,
                        file.ContentType,
                        file.Length,
                        new NtisPlatform.Application.DTOs.Document.DocumentUploadDto
                        {
                            ReferenceTableName = "AssetGrievanceDocument",
                            ReferenceTableId = registeredSlot.Id,
                            DepartmentId = createDto.DepartmentId ?? 3,
                            ModuleId = createDto.ModuleId ?? 1004,
                            DocumentType = meta?.DocumentTypeId.ToString() ?? "1",
                            BindingPurpose = meta?.Remarks ?? file.FileName
                        },
                        userId,
                        cancellationToken);

                    if (docUploadResult != null && docUploadResult.DocumentBindingId.HasValue)
                    {
                        var grievanceDocEntity = await _grievanceDocumentRepository.GetByIdAsync(registeredSlot.Id, cancellationToken);
                        if (grievanceDocEntity != null)
                        {
                            grievanceDocEntity.DocumentBindingId = docUploadResult.DocumentBindingId.Value;
                            await _grievanceDocumentRepository.UpdateAsync(grievanceDocEntity, cancellationToken);
                            await _unitOfWork.SaveChangesAsync(cancellationToken);
                        }
                    }
                }
            }
        }

        result.Documents = await _documentService.GetDocumentsByGrievanceIdAsync(result.Id, cancellationToken);
        await PopulateAssetDetailsAsync(new List<AssetGrievanceDetailsDto> { result }, cancellationToken);
        await PopulateGrievanceCategoryNameAsync(result, cancellationToken);
        return result;
    }

    public override async Task<AssetGrievanceDetailsDto?> UpdateAsync(int id, UpdateAssetGrievanceDetailsDto updateDto, CancellationToken cancellationToken = default)
    {
        // Parse JSON metadata if provided via multipart/form-data
        List<AssetGrievanceDocumentItemDto>? docMetadata = null;
        if (!string.IsNullOrWhiteSpace(updateDto.DocumentMetadataJson))
        {
            docMetadata = new List<AssetGrievanceDocumentItemDto>();
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var trimmed = updateDto.DocumentMetadataJson.Trim();
                if (trimmed.StartsWith("["))
                {
                    docMetadata = JsonSerializer.Deserialize<List<AssetGrievanceDocumentItemDto>>(trimmed, options) ?? new List<AssetGrievanceDocumentItemDto>();
                }
                else if (trimmed.StartsWith("{"))
                {
                    var single = JsonSerializer.Deserialize<AssetGrievanceDocumentItemDto>(trimmed, options);
                    if (single != null)
                    {
                        docMetadata.Add(single);
                    }
                }
            }
            catch (JsonException)
            {
                throw new ValidationException(
                    "Document metadata JSON is invalid.",
                    new Dictionary<string, string>
                    {
                        ["DocumentMetadataJson"] = "Provide valid JSON array or object for document metadata."
                    },
                    NtisPlatform.Application.Enums.OperationType.Update);
            }
        }

        var result = await base.UpdateAsync(id, updateDto, cancellationToken);

        if (updateDto.DocumentFiles != null && updateDto.DocumentFiles.Count > 0)
        {
            if (docMetadata == null || !docMetadata.Any())
            {
                docMetadata = updateDto.DocumentFiles
                    .Where(f => f != null && f.Length > 0)
                    .Select(f => new AssetGrievanceDocumentItemDto
                    {
                        DocumentTypeId = 1,
                        Remarks = f.FileName
                    })
                    .ToList();
            }
        }

        if (docMetadata != null && docMetadata.Any())
        {
            var bulkSaveDto = new AssetGrievanceDocumentBulkSaveDto
            {
                GrievanceDetailsId = id,
                Documents = docMetadata
            };

            int userId = _currentUserService.GetCurrentUserId() == 0 ? 1 : _currentUserService.GetCurrentUserId();
            var savedDocsResponse = await _documentService.BulkSaveAsync(bulkSaveDto, cancellationToken);
            
            if (savedDocsResponse.Errors.Any())
            {
                throw new ValidationException(
                    "Failed to save document metadata.",
                    new Dictionary<string, string> { ["Documents"] = string.Join(" | ", savedDocsResponse.Errors) },
                    NtisPlatform.Application.Enums.OperationType.Update);
            }

            if (updateDto.DocumentFiles != null && updateDto.DocumentFiles.Count > 0)
            {
                for (var i = 0; i < updateDto.DocumentFiles.Count; i++)
                {
                    var file = updateDto.DocumentFiles[i];
                    if (file == null || file.Length <= 0)
                        continue;

                    var meta = docMetadata.ElementAtOrDefault(i);
                    var registeredSlot = (meta != null
                        ? savedDocsResponse.SavedDocuments.FirstOrDefault(x => x.DocumentTypeId == meta.DocumentTypeId && (!x.DocumentBindingId.HasValue || x.DocumentBindingId == 0))
                        : null)
                        ?? savedDocsResponse.SavedDocuments.ElementAtOrDefault(i)
                        ?? savedDocsResponse.SavedDocuments.FirstOrDefault();

                    if (registeredSlot == null)
                        continue;

                    await using var fileStream = file.OpenReadStream();
                    var docUploadResult = await _globalDocumentService.UploadDocumentAsync(
                        fileStream,
                        file.FileName,
                        file.ContentType,
                        file.Length,
                        new NtisPlatform.Application.DTOs.Document.DocumentUploadDto
                        {
                            ReferenceTableName = "AssetGrievanceDocument",
                            ReferenceTableId = registeredSlot.Id,
                            DepartmentId = updateDto.DepartmentId ?? 3,
                            ModuleId = updateDto.ModuleId ?? 1004,
                            DocumentType = meta?.DocumentTypeId.ToString() ?? "1",
                            BindingPurpose = meta?.Remarks ?? file.FileName
                        },
                        userId,
                        cancellationToken);

                    if (docUploadResult != null && docUploadResult.DocumentBindingId.HasValue)
                    {
                        var grievanceDocEntity = await _grievanceDocumentRepository.GetByIdAsync(registeredSlot.Id, cancellationToken);
                        if (grievanceDocEntity != null)
                        {
                            grievanceDocEntity.DocumentBindingId = docUploadResult.DocumentBindingId.Value;
                            await _grievanceDocumentRepository.UpdateAsync(grievanceDocEntity, cancellationToken);
                            await _unitOfWork.SaveChangesAsync(cancellationToken);
                        }
                    }
                }
            }
        }

        if (result != null)
        {
            result.Documents = await _documentService.GetDocumentsByGrievanceIdAsync(result.Id, cancellationToken);
            await PopulateAssetDetailsAsync(new List<AssetGrievanceDetailsDto> { result }, cancellationToken);
            await PopulateGrievanceCategoryNameAsync(result, cancellationToken);
        }
        return result;
    }

    public override async Task<PagedResult<AssetGrievanceDetailsDto>> GetAllAsync(AssetGrievanceDetailsQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var result = await base.GetAllAsync(queryParameters, cancellationToken);
        if (result.Items.Any())
        {
            await PopulateAssetDetailsAsync(result.Items.ToList(), cancellationToken);
            await PopulateDocumentsForListAsync(result.Items.ToList(), cancellationToken);
        }
        return result;
    }

    public override async Task<AssetGrievanceDetailsDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dto = await base.GetByIdAsync(id, cancellationToken);
        if (dto != null && !dto.IsActive)
        {
            return null;
        }
        
        if (dto != null)
        {
            dto.Documents = await _documentService.GetDocumentsByGrievanceIdAsync(dto.Id, cancellationToken);
            await PopulateAssetDetailsAsync(new List<AssetGrievanceDetailsDto> { dto }, cancellationToken);
            await PopulateGrievanceCategoryNameAsync(dto, cancellationToken);
        }
        return dto;
    }

    private async Task PopulateAssetDetailsAsync(List<AssetGrievanceDetailsDto> dtos, CancellationToken cancellationToken)
    {
        var assetIds = dtos.Select(d => d.AssetId).Distinct().ToList();
        
        var assetPhotos = await _assetPhotoRepository.GetQueryable()
            .AsNoTracking()
            .Include(p => p.DocumentBinding)
                .ThenInclude(db => db != null ? db.Document : null)
            .Where(p => assetIds.Contains(p.AssetId) 
                        && p.IsLatest 
                        && p.IsActive 
                        && !p.MarkedForDeletion
                        && (p.Remarks == "Asset Image" || p.Remarks == "Asset Photo")
                        && p.DocumentBindingId != null
                        && p.DocumentBinding != null 
                        && p.DocumentBinding.Document != null 
                        && p.DocumentBinding.Document.IsActive 
                        && !p.DocumentBinding.Document.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        var assetLookup = await GetAssetLookupAsync(assetIds, cancellationToken);

        foreach (var dto in dtos)
        {
            var photo = assetPhotos.FirstOrDefault(p => p.AssetId == dto.AssetId);
            if (photo?.DocumentBinding?.Document != null)
            {
                dto.AssetImageGuid = photo.DocumentBinding.Document.DocumentGuid;
            }

            if (assetLookup.TryGetValue(dto.AssetId, out var asset))
            {
                dto.AssetNo = asset.AssetNo;
                dto.AssetName = asset.AssetName;
            }
        }
    }

    private async Task PopulateDocumentsForListAsync(List<AssetGrievanceDetailsDto> dtos, CancellationToken cancellationToken)
    {
        var grievanceIds = dtos.Select(d => d.Id).Distinct().ToList();
        var allDocs = await _grievanceDocumentRepository.GetQueryable()
            .AsNoTracking()
            .Include(d => d.DocumentType)
            .Where(d => grievanceIds.Contains(d.GrievanceDetailsId) && d.IsActive)
            .ToListAsync(cancellationToken);

        var docMap = allDocs.GroupBy(d => d.GrievanceDetailsId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var dto in dtos)
        {
            if (docMap.TryGetValue(dto.Id, out var docs))
            {
                dto.Documents = _mapper.Map<List<AssetGrievanceDocumentResponseDto>>(docs);
            }
            else
            {
                dto.Documents = new List<AssetGrievanceDocumentResponseDto>();
            }
        }
    }

    /// <summary>
    /// base.CreateAsync/UpdateAsync/GetByIdAsync all map a single in-memory entity via AutoMapper
    /// without eager-loading AssetGrievanceCategory (unlike GetAllAsync's ProjectTo, which
    /// auto-joins it), so the category-name resolver sees a null navigation property — look it up
    /// explicitly instead.
    /// </summary>
    private async Task PopulateGrievanceCategoryNameAsync(AssetGrievanceDetailsDto dto, CancellationToken cancellationToken)
    {
        dto.GrievanceCategoryName = await _categoryRepository.GetQueryable()
            .AsNoTracking()
            .Where(c => c.Id == dto.GrievanceTypeId)
            .Select(c => c.GrievanceTypeName)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>AssetNo/AssetName are always looked up from AssetMaster, never stored on AssetGrievanceDetails.</summary>
    private async Task<Dictionary<int, (string AssetNo, string AssetName)>> GetAssetLookupAsync(IEnumerable<int> assetIds, CancellationToken cancellationToken)
    {
        var ids = assetIds.Distinct().ToList();
        var assetMasters = await _assetMasterRepository.GetQueryable()
            .AsNoTracking()
            .Where(a => ids.Contains(a.Id))
            .Select(a => new { a.Id, a.AssetNo, a.AssetName })
            .ToListAsync(cancellationToken);

        return assetMasters.ToDictionary(a => a.Id, a => (a.AssetNo, a.AssetName));
    }

    /// <summary>
    /// Builds the next GrievanceNo using the grievance's category CodeFormat (e.g.
    /// "GRV/AMS/{YYYY}/{SEQ:6}"): {YYYY} -> current year, {SEQ:N} -> zero-padded (N digits)
    /// sequence, plus one. The sequence is scoped GLOBALLY per year, not per category — every
    /// seeded category shares the identical CodeFormat, and GrievanceNo has a global uniqueness
    /// constraint, so a per-category count would (and did, when tested live) let two categories
    /// generate the same number for the same year and collide on that constraint.
    /// Not concurrency-safe under parallel creates in the same year (count-then-format) — matches
    /// the characteristic of the previous day-scoped implementation, not a regression.
    /// </summary>
    private async Task<string> GenerateGrievanceNoAsync(int grievanceTypeId, CancellationToken cancellationToken = default)
    {
        var codeFormat = await _categoryRepository.GetQueryable().AsNoTracking()
            .Where(c => c.Id == grievanceTypeId)
            .Select(c => c.CodeFormat)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException($"GrievanceCategoryMaster {grievanceTypeId} not found");

        var year = DateTime.Now.Year;
        var yearStart = new DateTime(year, 1, 1);
        var yearEnd = yearStart.AddYears(1);

        var countThisYear = await _repository.GetQueryable()
            .Where(g => g.CreatedDate >= yearStart && g.CreatedDate < yearEnd)
            .CountAsync(cancellationToken);

        return ApplyCodeFormat(codeFormat, year, countThisYear + 1);
    }

    private static string ApplyCodeFormat(string format, int year, int sequence)
    {
        var result = format.Replace("{YYYY}", year.ToString(System.Globalization.CultureInfo.InvariantCulture));
        result = System.Text.RegularExpressions.Regex.Replace(result, @"\{SEQ:(\d+)\}", m =>
            sequence.ToString(new string('0', int.Parse(m.Groups[1].Value)), System.Globalization.CultureInfo.InvariantCulture));
        return result;
    }

    // ------------------------------------------------------------------
    // Workflow: Correction -> Verification -> Approval, with SentBack and Reopen loops.
    // ------------------------------------------------------------------

    private async Task<int?> GetCycleActionByAsync(int grievanceId, int cycleNo, string action, CancellationToken cancellationToken)
        => await _actionHistoryRepository.GetQueryable().AsNoTracking()
            .Where(x => x.GrievanceDetailsId == grievanceId && x.CycleNo == cycleNo && x.Action == action)
            .OrderByDescending(x => x.ActionDate)
            .Select(x => (int?)x.ActionBy)
            .FirstOrDefaultAsync(cancellationToken);

    private async Task<int?> GetActiveCorrectionProposerAsync(int grievanceId, CancellationToken cancellationToken)
        => await _correctionDetailRepository.GetQueryable().AsNoTracking()
            .Where(x => x.GrievanceDetailsId == grievanceId && x.IsActive)
            .OrderByDescending(x => x.ProposedDate)
            .Select(x => (int?)x.ProposedBy)
            .FirstOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Applies a status transition to an already-loaded entity, writes the matching
    /// GrievanceActionHistory row (tagged with the cycle number as it was BEFORE <paramref name="mutate"/>
    /// runs, so a SentBack/Reopen that increments CurrentCycleNo still logs against the cycle that
    /// was just closed out), and commits both in one transaction.
    /// </summary>
    private async Task<AssetGrievanceDetailsDto?> ApplyTransitionAsync(
        AssetGrievanceDetailsEntity entity, string to, string actionName, string? remarks, int userId,
        Action<AssetGrievanceDetailsEntity>? mutate, CancellationToken cancellationToken)
    {
        var cycleNoForHistory = entity.CurrentCycleNo;
        var previousStatus = entity.WorkflowStatus;

        mutate?.Invoke(entity);
        entity.WorkflowStatus = to;
        entity.UpdatedBy = userId;
        entity.UpdatedDate = DateTime.UtcNow;

        var history = new AssetGrievanceActionHistoryEntity
        {
            GrievanceDetailsId = entity.Id,
            CycleNo = cycleNoForHistory,
            Action = actionName,
            PreviousWorkflowStatus = previousStatus,
            NewWorkflowStatus = to,
            ActionBy = userId,
            ActionDate = DateTime.UtcNow,
            Remarks = remarks,
            IsActive = true,
            CreatedBy = userId,
            CreatedDate = DateTime.UtcNow
        };

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _repository.UpdateAsync(entity, cancellationToken);
            await _actionHistoryRepository.AddAsync(history, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<AssetGrievanceDetailsDto?> SubmitCorrectionAsync(int id, SubmitAssetGrievanceCorrectionDto dto, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus != StatusRaised && entity.WorkflowStatus != StatusSentBack && !string.Equals(entity.WorkflowStatus, "CorrectionPending", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Grievance_InvalidTransition:{entity.WorkflowStatus}->{StatusCorrectionDone}");

        // Ward access check bypassed for decoupled grievance

        // var verifierId = await GetCycleActionByAsync(id, entity.CurrentCycleNo, ActionVerified, cancellationToken);
        // var approverId = await GetCycleActionByAsync(id, entity.CurrentCycleNo, ActionApproved, cancellationToken);
        // if (userId == verifierId || userId == approverId)
        //     throw new InvalidOperationException("Grievance_RoleSeparation_Violation");

        var targetTableName = dto.TargetTableName ?? entity.TargetTableName;
        if (string.IsNullOrWhiteSpace(targetTableName))
        {
            throw new ValidationException(
                "A target table name is required to submit a correction.",
                new Dictionary<string, string> { [nameof(dto.TargetTableName)] = "Grievance_TargetTableName_Required" },
                NtisPlatform.Application.Enums.OperationType.Update);
        }

        var applier = _correctionAppliers.FirstOrDefault(a => a.CanApply(targetTableName))
            ?? throw new InvalidOperationException($"Grievance_UnsupportedTarget:{targetTableName}");

        var recordId = dto.RecordId ?? entity.TargetRecordId;
        if (!recordId.HasValue)
            throw new ValidationException(
                "A target record id is required to submit a correction.",
                new Dictionary<string, string> { [nameof(dto.RecordId)] = "Grievance_RecordId_Required" },
                NtisPlatform.Application.Enums.OperationType.Update);

        // Mirrors ValidateForCreateAsync's check: only one active grievance may target a given row
        // at a time (enforced by IX_GrievanceDetails_ActiveTarget). Checking here — not just on
        // Create — matters because this is also where a ticket's TargetTableName/TargetRecordId can
        // change; without this, a collision surfaces as a raw unhandled DB constraint violation
        // (500) instead of a clean validation error.
        var activeStatuses = new[] { StatusResolved, StatusRejected, StatusClosed };
        var collidesWithAnotherActiveTicket = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x =>
                x.Id != id &&
                x.TargetTableName == targetTableName &&
                x.TargetRecordId == recordId &&
                !activeStatuses.Contains(x.WorkflowStatus),
                cancellationToken);
        if (collidesWithAnotherActiveTicket)
            throw new ValidationException(
                "Another active grievance already targets this record.",
                new Dictionary<string, string> { [nameof(dto.RecordId)] = "Grievance_ActiveGrievance_AlreadyExists" },
                NtisPlatform.Application.Enums.OperationType.Update);

        var beforeSnapshot = await applier.ReadSnapshotAsync(recordId.Value, cancellationToken)
            ?? throw new KeyNotFoundException($"{targetTableName} record {recordId} not found");

        var afterData = new Dictionary<string, string>(beforeSnapshot);
        foreach (var (fieldName, newValue) in dto.FieldValues)
        {
            afterData[fieldName] = newValue;
        }

        var correctionDetail = new AssetGrievanceCorrectionDetailEntity
        {
            GrievanceDetailsId = id,
            TargetTableName = targetTableName,
            RecordId = recordId,
            BeforeData = JsonSerializer.Serialize(beforeSnapshot, UnicodeJsonOptions),
            AfterData = JsonSerializer.Serialize(afterData, UnicodeJsonOptions),
            ProposedBy = userId,
            ProposedDate = DateTime.UtcNow,
            IsApplied = false,
            IsActive = true,
            CreatedBy = userId,
            CreatedDate = DateTime.UtcNow
        };

        var history = new AssetGrievanceActionHistoryEntity
        {
            GrievanceDetailsId = id,
            CycleNo = entity.CurrentCycleNo,
            Action = ActionSubmitCorrection,
            PreviousWorkflowStatus = entity.WorkflowStatus,
            NewWorkflowStatus = StatusCorrectionDone,
            ActionBy = userId,
            ActionDate = DateTime.UtcNow,
            Remarks = !string.IsNullOrWhiteSpace(dto.Remarks) ? dto.Remarks : "Correction proposed",
            IsActive = true,
            CreatedBy = userId,
            CreatedDate = DateTime.UtcNow
        };

        entity.WorkflowStatus = StatusCorrectionDone;
        entity.TargetTableName = dto.TargetTableName;
        entity.TargetRecordId = recordId;
        entity.UpdatedBy = userId;
        entity.UpdatedDate = DateTime.UtcNow;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _correctionDetailRepository.AddAsync(correctionDetail, cancellationToken);
            await _actionHistoryRepository.AddAsync(history, cancellationToken);
            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    private async Task<List<GrievanceWorkflowStageMasterEntity>> GetStagesForGrievanceAsync(
        AssetGrievanceDetailsEntity entity,
        int? requestedUlbTypeId,
        CancellationToken cancellationToken)
    {
        var query = _stageRepository.GetQueryable().AsNoTracking()
            .Where(s => s.IsActive && !s.MarkedForDeletion);

        if (requestedUlbTypeId.HasValue && requestedUlbTypeId.Value > 0)
        {
            var filtered = await query
                .Where(s => s.UlbTypeId == requestedUlbTypeId.Value)
                .OrderBy(s => s.StageOrder)
                .ToListAsync(cancellationToken);
            if (filtered.Count > 0)
                return filtered;
        }

        var allStages = await query.OrderBy(s => s.StageOrder).ToListAsync(cancellationToken);
        if (allStages.Count == 0)
            return new List<GrievanceWorkflowStageMasterEntity>();

        // 1. Try matching UlbTypeId where any stage matches current ticket's WorkflowStatus
        var matchedUlbType = allStages
            .Where(s => string.Equals(s.Status, entity.WorkflowStatus, StringComparison.OrdinalIgnoreCase))
            .Select(s => s.UlbTypeId)
            .FirstOrDefault();

        if (matchedUlbType > 0)
        {
            return allStages.Where(s => s.UlbTypeId == matchedUlbType).OrderBy(s => s.StageOrder).ToList();
        }

        // 2. Default to first available UlbTypeId
        var firstUlbType = allStages.Select(s => s.UlbTypeId).FirstOrDefault();
        return allStages.Where(s => s.UlbTypeId == firstUlbType).OrderBy(s => s.StageOrder).ToList();
    }

    public async Task<AssetGrievanceDetailsDto?> VerifyAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus == StatusResolved || entity.WorkflowStatus == StatusClosed || entity.WorkflowStatus == StatusRejected)
            throw new InvalidOperationException($"Grievance_InvalidTransition:{entity.WorkflowStatus}->{StatusVerified}");

        // Ward access check bypassed for decoupled grievance

        var stages = await GetStagesForGrievanceAsync(entity, null, cancellationToken);
        string nextStatus = StatusVerified;

        if (stages.Count > 0)
        {
            var currentStage = stages.FirstOrDefault(s => string.Equals(s.Status, entity.WorkflowStatus, StringComparison.OrdinalIgnoreCase))
                ?? stages.FirstOrDefault(s => string.Equals(s.StageCode, entity.WorkflowStatus, StringComparison.OrdinalIgnoreCase));

            if (currentStage == null)
            {
                if (string.Equals(entity.WorkflowStatus, StatusCorrectionDone, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(entity.WorkflowStatus, StatusRaised, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(entity.WorkflowStatus, "CorrectionPending", StringComparison.OrdinalIgnoreCase))
                {
                    currentStage = stages.OrderBy(s => s.StageOrder).FirstOrDefault();
                }
            }

            var nextStage = currentStage != null
                ? stages.Where(s => s.StageOrder > currentStage.StageOrder).OrderBy(s => s.StageOrder).FirstOrDefault()
                : stages.OrderBy(s => s.StageOrder).Skip(1).FirstOrDefault();

            if (nextStage != null && !string.IsNullOrWhiteSpace(nextStage.Status))
            {
                nextStatus = nextStage.Status;
            }
            else
            {
                var finalStage = stages.OrderByDescending(s => s.StageOrder).FirstOrDefault();
                nextStatus = finalStage?.Status ?? StatusVerified;
            }
        }

        return await ApplyTransitionAsync(entity, nextStatus, ActionVerified, remarks, userId, mutate: null, cancellationToken);
    }

    public async Task<AssetGrievanceDetailsDto?> ForwardAsync(int id, AssetGrievanceWorkflowActionDto? dto, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus == StatusResolved || entity.WorkflowStatus == StatusClosed || entity.WorkflowStatus == StatusRejected)
            throw new InvalidOperationException($"Grievance_CannotForwardTerminalStatus:{entity.WorkflowStatus}");

        // Ward access check bypassed for decoupled grievance

        var stages = await GetStagesForGrievanceAsync(entity, dto?.UlbTypeId, cancellationToken);
        GrievanceWorkflowStageMasterEntity? nextStage = null;

        if (dto?.NextStageId is > 0)
        {
            var targetStageId = dto.NextStageId.Value;
            nextStage = stages.FirstOrDefault(s => s.Id == targetStageId)
                ?? await _stageRepository.GetByIdAsync(targetStageId, cancellationToken);
        }
        else if (stages.Count > 0)
        {
            var currentStage = stages.FirstOrDefault(s => string.Equals(s.Status, entity.WorkflowStatus, StringComparison.OrdinalIgnoreCase))
                ?? stages.FirstOrDefault(s => string.Equals(s.StageCode, entity.WorkflowStatus, StringComparison.OrdinalIgnoreCase));

            if (currentStage == null)
            {
                if (string.Equals(entity.WorkflowStatus, StatusCorrectionDone, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(entity.WorkflowStatus, StatusRaised, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(entity.WorkflowStatus, "CorrectionPending", StringComparison.OrdinalIgnoreCase))
                {
                    currentStage = stages.OrderBy(s => s.StageOrder).FirstOrDefault();
                }
            }

            if (currentStage != null)
            {
                nextStage = stages.Where(s => s.StageOrder > currentStage.StageOrder).OrderBy(s => s.StageOrder).FirstOrDefault();
            }
            else
            {
                nextStage = stages.OrderBy(s => s.StageOrder).Skip(1).FirstOrDefault();
            }
        }

        // Check if ticket is at the final approval stage (no more intermediate stages, or target is final approval)
        var lastStage = stages.OrderByDescending(s => s.StageOrder).FirstOrDefault();
        bool isAtOrPastFinalStage = (nextStage == null && (entity.WorkflowStatus == StatusVerified || (lastStage != null && string.Equals(entity.WorkflowStatus, lastStage.Status, StringComparison.OrdinalIgnoreCase))))
            || (nextStage != null && string.Equals(nextStage.StageCode, "FINAL_APPROVAL", StringComparison.OrdinalIgnoreCase) && string.Equals(entity.WorkflowStatus, nextStage.Status, StringComparison.OrdinalIgnoreCase));

        if (isAtOrPastFinalStage)
        {
            // Reached end of dynamic stages -> Execute final approval and apply changes
            return await ApproveAsync(id, dto?.Remarks, userId, cancellationToken);
        }

        string targetStatus = nextStage?.Status ?? StatusVerified;

        // Stage access check bypassed for decoupled grievance

        return await ApplyTransitionAsync(entity, targetStatus, ActionForwarded, dto?.Remarks, userId, mutate: null, cancellationToken);
    }

    public async Task<AssetGrievanceDetailsDto?> SendBackAsync(int id, string reason, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus == StatusResolved || entity.WorkflowStatus == StatusClosed || entity.WorkflowStatus == StatusRejected || entity.WorkflowStatus == StatusRaised || entity.WorkflowStatus == StatusSentBack)
            throw new InvalidOperationException($"Grievance_InvalidTransition:{entity.WorkflowStatus}->{StatusSentBack}");

        // Ward access check bypassed for decoupled grievance

        var staleRows = await _correctionDetailRepository.GetQueryable()
            .Where(x => x.GrievanceDetailsId == id && x.IsActive)
            .ToListAsync(cancellationToken);
        var staleMediaRows = await _mediaCorrectionRepository.GetQueryable()
            .Where(x => x.GrievanceId == id && x.IsActive && !x.IsApplied)
            .ToListAsync(cancellationToken);

        var result = await ApplyTransitionAsync(entity, StatusSentBack, ActionSentBack, reason, userId,
            mutate: e => e.CurrentCycleNo += 1,
            cancellationToken);

        // Superseded, not deleted — a fresh correction is submitted for the new cycle.
        if (staleRows.Count > 0 || staleMediaRows.Count > 0)
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                foreach (var row in staleRows)
                {
                    row.IsActive = false;
                    row.UpdatedBy = userId;
                    row.UpdatedDate = DateTime.UtcNow;
                    await _correctionDetailRepository.UpdateAsync(row, cancellationToken);
                }
                foreach (var row in staleMediaRows)
                {
                    row.IsActive = false;
                    row.UpdatedBy = userId;
                    row.UpdatedDate = DateTime.UtcNow;
                    await _mediaCorrectionRepository.UpdateAsync(row, cancellationToken);
                }
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }

        return result;
    }

    public async Task<AssetGrievanceDetailsDto?> ApproveAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus == StatusResolved || entity.WorkflowStatus == StatusClosed || entity.WorkflowStatus == StatusRejected)
            throw new InvalidOperationException($"Grievance_InvalidTransition:{entity.WorkflowStatus}->{StatusResolved}");

        // Ward access check bypassed for decoupled grievance

        // var proposedBy = await GetActiveCorrectionProposerAsync(id, cancellationToken);
        // var verifierId = await GetCycleActionByAsync(id, entity.CurrentCycleNo, ActionVerified, cancellationToken);
        // if ((proposedBy.HasValue && proposedBy.Value == userId) || (verifierId.HasValue && verifierId.Value == userId))
        //     throw new InvalidOperationException("Grievance_RoleSeparation_Violation");

        var pendingRows = await _correctionDetailRepository.GetQueryable()
            .Where(x => x.GrievanceDetailsId == id && x.IsActive && !x.IsApplied)
            .ToListAsync(cancellationToken);
        var pendingMediaRows = await _mediaCorrectionRepository.GetQueryable()
            .Where(x => x.GrievanceId == id && x.IsActive && !x.IsApplied)
            .ToListAsync(cancellationToken);

        var cycleNoForHistory = entity.CurrentCycleNo;
        var previousStatus = entity.WorkflowStatus;
        entity.WorkflowStatus = StatusResolved;
        entity.UpdatedBy = userId;
        entity.UpdatedDate = DateTime.UtcNow;

        var history = new AssetGrievanceActionHistoryEntity
        {
            GrievanceDetailsId = id,
            CycleNo = cycleNoForHistory,
            Action = ActionApproved,
            PreviousWorkflowStatus = previousStatus,
            NewWorkflowStatus = StatusResolved,
            ActionBy = userId,
            ActionDate = DateTime.UtcNow,
            Remarks = remarks,
            IsActive = true,
            CreatedBy = userId,
            CreatedDate = DateTime.UtcNow
        };

        var followUps = new List<(IAssetGrievanceCorrectionApplier Applier, int RecordId)>();

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var row in pendingRows)
            {
                if (string.IsNullOrWhiteSpace(row.TargetTableName))
                    continue;

                var applier = _correctionAppliers.FirstOrDefault(a => a.CanApply(row.TargetTableName))
                    ?? throw new InvalidOperationException($"Grievance_UnsupportedTarget:{row.TargetTableName}");

                if (!row.RecordId.HasValue)
                    continue; // INSERT-type corrections aren't supported by any applier yet.

                // AfterData is the full merged snapshot (unchanged fields included), not a delta —
                // every applier treats every field as an absolute set, so this is behaviorally
                // identical to passing just the changed subset.
                var fieldValues = JsonSerializer.Deserialize<Dictionary<string, string>>(row.AfterData)
                    ?? new Dictionary<string, string>();

                await applier.ApplyAsync(row.RecordId.Value, fieldValues, cancellationToken);
                followUps.Add((applier, row.RecordId.Value));

                row.IsApplied = true;
                row.AppliedDate = DateTime.UtcNow;
                row.UpdatedBy = userId;
                row.UpdatedDate = DateTime.UtcNow;
                await _correctionDetailRepository.UpdateAsync(row, cancellationToken);
            }

            foreach (var row in pendingMediaRows)
            {
                var mediaApplier = _mediaCorrectionAppliers.FirstOrDefault(a => a.CanApply(row.TargetMediaType))
                    ?? throw new InvalidOperationException($"GrievanceMedia_UnsupportedType:{row.TargetMediaType}");

                await mediaApplier.ApplyAsync(row, entity.AssetId, userId, cancellationToken);

                row.IsApproved = true;
                row.IsApplied = true;
                row.AppliedDate = DateTime.UtcNow;
                row.UpdatedBy = userId;
                row.UpdatedDate = DateTime.UtcNow;
                await _mediaCorrectionRepository.UpdateAsync(row, cancellationToken);
            }

            await _repository.UpdateAsync(entity, cancellationToken);
            await _actionHistoryRepository.AddAsync(history, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        // Run only after the transaction above has committed — a follow-up (e.g. capital-value
        // recalculation) may open its own transaction, which would fail if attempted while the
        // approval's transaction is still open. Best-effort: a failure here must not undo or fail an
        // approval that has already been committed and recorded in GrievanceActionHistory.
        foreach (var (applier, recordId) in followUps)
        {
            try
            {
                await applier.RunPostApplyFollowUpAsync(recordId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Post-apply follow-up failed for AssetGrievanceDetails {GrievanceId}, record {RecordId}", id, recordId);
            }
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AssetGrievanceDetailsDto?> RejectAsync(int id, string reason, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus == StatusResolved || entity.WorkflowStatus == StatusClosed || entity.WorkflowStatus == StatusRejected)
            throw new InvalidOperationException($"Grievance_InvalidTransition:{entity.WorkflowStatus}->{StatusRejected}");

        // Ward access check bypassed for decoupled grievance

        return await ApplyTransitionAsync(entity, StatusRejected, ActionRejected, reason, userId, mutate: null, cancellationToken);
    }

    public async Task<AssetGrievanceDetailsDto?> CloseAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus != StatusResolved && entity.WorkflowStatus != StatusRejected)
            throw new InvalidOperationException($"Grievance_InvalidTransition:{entity.WorkflowStatus}->{StatusClosed}");

        return await ApplyTransitionAsync(entity, StatusClosed, ActionClosed, remarks, userId, mutate: null, cancellationToken);
    }

    public async Task<AssetGrievanceDetailsDto?> ReopenAsync(int id, string reason, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus != StatusClosed && entity.WorkflowStatus != StatusResolved && entity.WorkflowStatus != StatusRejected)
            throw new InvalidOperationException($"Grievance_InvalidTransition:{entity.WorkflowStatus}->{StatusRaised}");

        return await ApplyTransitionAsync(entity, StatusRaised, ActionReopened, reason, userId,
            mutate: e => e.CurrentCycleNo += 1,
            cancellationToken);
    }

    public async Task<List<AssetGrievanceActionHistoryDto>> GetActionHistoryAsync(int id, CancellationToken cancellationToken = default)
        => await _actionHistoryRepository.GetQueryable().AsNoTracking()
            .Where(x => x.GrievanceDetailsId == id)
            .OrderByDescending(x => x.CycleNo).ThenByDescending(x => x.ActionDate)
            .ProjectTo<AssetGrievanceActionHistoryDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

    public async Task<List<AssetGrievanceCorrectionDetailDto>> GetCorrectionDetailsAsync(int id, CancellationToken cancellationToken = default)
        => await _correctionDetailRepository.GetQueryable().AsNoTracking()
            .Where(x => x.GrievanceDetailsId == id)
            .OrderByDescending(x => x.ProposedDate)
            .ProjectTo<AssetGrievanceCorrectionDetailDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

    /// <summary>
    /// Hard-removes every GrievanceCorrectionDetail / GrievanceActionHistory / AssetGrievanceDocument
    /// row for this ticket (across every cycle, including superseded ones), so the subsequent purge
    /// of the AssetGrievanceDetails row itself doesn't hit their Restrict FKs. Evidence-document files
    /// themselves are not destroyed — their DocumentBinding is only deactivated (soft-marked), same
    /// as every other document-deletion path in this codebase, so the existing retention pipeline
    /// handles the actual file cleanup on its own schedule. Idempotent: safe to call more than once.
    /// </summary>
    public async Task PurgeChildrenAsync(int id, CancellationToken cancellationToken = default)
    {
        var correctionRows = await _correctionDetailRepository.GetQueryable()
            .Where(x => x.GrievanceDetailsId == id)
            .ToListAsync(cancellationToken);
        var historyRows = await _actionHistoryRepository.GetQueryable()
            .Where(x => x.GrievanceDetailsId == id)
            .ToListAsync(cancellationToken);
        var documentRows = await _grievanceDocumentRepository.GetQueryable()
            .Where(x => x.GrievanceDetailsId == id)
            .ToListAsync(cancellationToken);
        var mediaCorrectionRows = await _mediaCorrectionRepository.GetQueryable()
            .Where(x => x.GrievanceId == id)
            .ToListAsync(cancellationToken);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var row in correctionRows)
                await _correctionDetailRepository.HardDeleteAsync(row, cancellationToken);
            foreach (var row in historyRows)
                await _actionHistoryRepository.HardDeleteAsync(row, cancellationToken);
            foreach (var row in documentRows)
                await _grievanceDocumentRepository.HardDeleteAsync(row, cancellationToken);
            foreach (var row in mediaCorrectionRows)
                await _mediaCorrectionRepository.HardDeleteAsync(row, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        foreach (var row in documentRows.Where(d => d.DocumentBindingId.HasValue))
        {
            try
            {
                await _globalDocumentService.DeactivateDocumentBindingAsync(row.DocumentBindingId!.Value, _currentUserService.GetCurrentUserId(), cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deactivate DocumentBinding {DocumentBindingId} while purging AssetGrievanceDetails {GrievanceId}", row.DocumentBindingId, id);
            }
        }
    }

    // ------------------------------------------------------------------
    // Media corrections (photos/documents) — dedicated table, replaces the old
    // "AMS.AssetPhoto via SubmitCorrectionAsync FieldValues" special case. Proposals ride along
    // whatever correction cycle is in flight; they don't drive WorkflowStatus themselves and are
    // applied automatically inside ApproveAsync's transaction (see ApproveAsync above).
    // ------------------------------------------------------------------

    private static readonly string[] ValidTargetMediaTypes = { "PHOTO", "DOCUMENT" };
    private static readonly string[] ValidMediaActionTypes = { "ADD", "REPLACE", "DELETE" };

    public async Task<AssetGrievanceMediaCorrectionDto> SubmitMediaCorrectionAsync(int id, SubmitAssetGrievanceMediaCorrectionDto dto, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"AssetGrievanceDetails {id} not found");

        // Media corrections don't drive WorkflowStatus themselves (unlike SubmitCorrectionAsync,
        // which transitions to CorrectionDone) — they're only valid to propose during the same
        // cycle states a field correction could be submitted in.
        if (entity.WorkflowStatus != StatusRaised && entity.WorkflowStatus != StatusSentBack && entity.WorkflowStatus != StatusCorrectionDone)
            throw new InvalidOperationException($"Grievance_InvalidState:{entity.WorkflowStatus}");

        // var verifierId = await GetCycleActionByAsync(id, entity.CurrentCycleNo, ActionVerified, cancellationToken);
        // var approverId = await GetCycleActionByAsync(id, entity.CurrentCycleNo, ActionApproved, cancellationToken);
        // if (userId == verifierId || userId == approverId)
        //     throw new InvalidOperationException("Grievance_RoleSeparation_Violation");

        var targetMediaType = dto.TargetMediaType?.ToUpperInvariant() ?? string.Empty;
        if (!ValidTargetMediaTypes.Contains(targetMediaType))
            throw new ValidationException(
                "Invalid target media type.",
                new Dictionary<string, string> { [nameof(dto.TargetMediaType)] = "GrievanceMedia_TargetMediaType_Invalid" },
                NtisPlatform.Application.Enums.OperationType.Create);

        var actionType = dto.ActionType?.ToUpperInvariant() ?? string.Empty;
        if (!ValidMediaActionTypes.Contains(actionType))
            throw new ValidationException(
                "Invalid action type.",
                new Dictionary<string, string> { [nameof(dto.ActionType)] = "GrievanceMedia_ActionType_Invalid" },
                NtisPlatform.Application.Enums.OperationType.Create);

        var row = _mapper.Map<AssetGrievanceMediaCorrectionEntity>(dto);
        row.GrievanceId = id;
        row.TargetMediaType = targetMediaType;
        row.ActionType = actionType;
        row.IsApproved = false;
        row.IsApplied = false;
        row.IsActive = true;
        row.CreatedBy = userId;
        row.CreatedDate = DateTime.UtcNow;

        await _mediaCorrectionRepository.AddAsync(row, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<AssetGrievanceMediaCorrectionDto>(row);
    }

    public async Task<List<AssetGrievanceMediaCorrectionDto>> GetMediaCorrectionsAsync(int id, CancellationToken cancellationToken = default)
        => await _mediaCorrectionRepository.GetQueryable().AsNoTracking()
            .Where(x => x.GrievanceId == id)
            .OrderByDescending(x => x.CreatedDate)
            .ProjectTo<AssetGrievanceMediaCorrectionDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

    public async Task<bool> WithdrawMediaCorrectionAsync(int id, int mediaCorrectionId, int userId, CancellationToken cancellationToken = default)
    {
        var row = await _mediaCorrectionRepository.GetByIdAsync(mediaCorrectionId, cancellationToken);
        if (row == null || row.GrievanceId != id)
            return false;
        if (row.IsApplied)
            throw new InvalidOperationException("GrievanceMedia_AlreadyApplied");

        row.IsActive = false;
        row.UpdatedBy = userId;
        row.UpdatedDate = DateTime.UtcNow;
        await _mediaCorrectionRepository.UpdateAsync(row, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    // ------------------------------------------------------------------
    // Citizen portal surface — scoped by ApplicantMobile (citizens have no CORE.UserMaster row;
    // see CitizenPortalController's mobileNo-claim JWT), never by RaisedByUserId.
    // ------------------------------------------------------------------

    public async Task<AssetCitizenGrievanceDto> CreateForCitizenAsync(CreateAssetGrievanceDetailsDto dto, string mobileNo, CancellationToken cancellationToken = default)
    {
        dto.ApplicantMobile = mobileNo;
        dto.RaisedByChannel = "CITIZEN_PORTAL";
        dto.RaisedByUserId = 0; // citizens have no CORE.UserMaster row — 0 marks "the applicant"

        var created = await CreateAsync(dto, cancellationToken);
        return _mapper.Map<AssetCitizenGrievanceDto>(created);
    }

    public async Task<PagedResult<AssetCitizenGrievanceDto>> GetAllForCitizenAsync(AssetGrievanceDetailsQueryParameters qp, string mobileNo, CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking()
            .Where(x => x.ApplicantMobile == mobileNo);

        if (!string.IsNullOrWhiteSpace(qp.WorkflowStatus))
            query = query.Where(x => x.WorkflowStatus == qp.WorkflowStatus);

        var total = await query.CountAsync(cancellationToken);
        var pageNumber = qp.PageSize == -1 ? 1 : qp.PageNumber;
        var pageSize = qp.PageSize == -1 ? Math.Max(total, 1) : qp.PageSize;

        var items = await query
            .OrderByDescending(x => x.CreatedDate)
            .Skip(qp.PageSize == -1 ? 0 : (pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<AssetCitizenGrievanceDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        var lookup = await GetAssetLookupAsync(items.Select(i => i.AssetId), cancellationToken);
        foreach (var item in items)
        {
            if (lookup.TryGetValue(item.AssetId, out var asset))
            {
                item.AssetNo = asset.AssetNo;
                item.AssetName = asset.AssetName;
            }
        }

        return new PagedResult<AssetCitizenGrievanceDto>(items, total, pageNumber, pageSize);
    }

    public async Task<AssetCitizenGrievanceDto?> GetByIdForCitizenAsync(int id, string mobileNo, CancellationToken cancellationToken = default)
    {
        var dto = await _repository.GetQueryable().AsNoTracking()
            .Where(x => x.Id == id && x.ApplicantMobile == mobileNo)
            .ProjectTo<AssetCitizenGrievanceDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);
        if (dto == null)
            return null;

        var lookup = await GetAssetLookupAsync(new[] { dto.AssetId }, cancellationToken);
        if (lookup.TryGetValue(dto.AssetId, out var asset))
        {
            dto.AssetNo = asset.AssetNo;
            dto.AssetName = asset.AssetName;
        }

        dto.Documents = await _documentService.GetDocumentsByGrievanceIdAsync(dto.Id, cancellationToken);
        return dto;
    }

    public async Task<AssetCitizenGrievanceDto?> CloseForCitizenAsync(int id, string? remarks, string mobileNo, CancellationToken cancellationToken = default)
    {
        var owns = await _repository.GetQueryable().AsNoTracking().AnyAsync(x => x.Id == id && x.ApplicantMobile == mobileNo, cancellationToken);
        if (!owns)
            return null;

        // Citizens act on their own ticket; there's no separate CORE.UserMaster id to record as
        // ActionBy, so 0 marks "the applicant" in GrievanceActionHistory.
        var updated = await CloseAsync(id, remarks, userId: 0, cancellationToken);
        return updated == null ? null : _mapper.Map<AssetCitizenGrievanceDto>(updated);
    }

    public async Task<AssetCitizenGrievanceDto?> ReopenForCitizenAsync(int id, string reason, string mobileNo, CancellationToken cancellationToken = default)
    {
        var owns = await _repository.GetQueryable().AsNoTracking().AnyAsync(x => x.Id == id && x.ApplicantMobile == mobileNo, cancellationToken);
        if (!owns)
            return null;

        var updated = await ReopenAsync(id, reason, userId: 0, cancellationToken);
        return updated == null ? null : _mapper.Map<AssetCitizenGrievanceDto>(updated);
    }
}
