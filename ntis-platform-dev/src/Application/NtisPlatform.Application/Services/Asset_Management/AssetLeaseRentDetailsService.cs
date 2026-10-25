using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Common;
using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Application.Interfaces;
using System.Reflection;
using System.Security.Cryptography;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetLeaseRentDetailsService :
    BaseCommonCrudService<AssetLeaseRentDetailsEntity, AssetLeaseRentDetailsDto, CreateAssetLeaseRentDetailsDto, UpdateAssetLeaseRentDetailsDto, AssetLeaseRentDetailsQueryParameters, int>,
    IAssetLeaseRentDetailsService
{
    private readonly IRepository<AssetMasterEntity, int> _assetRepository;
    private readonly IRepository<AssetRoomWiseSubmissionDetailsEntity, int> _roomWiseRepository;
    private readonly IRepository<LeaseRentRegistrationHistoryEntity, int> _historyRepository;
    private readonly IRepository<ModuleMasterEntity, int> _moduleRepository;
    private readonly IRepository<DocumentEntity, int> _documentRepository;
    private readonly IRepository<DocumentBindingEntity, int> _documentBindingRepository;
    private readonly IRepository<InventoryAssetDetailEntity, int> _inventoryAssetDetailRepository;
    private readonly IRepository<UserRoleAllocationEntity, int> _userRoleAllocationRepository;
    private readonly IUserAccessRepository _userAccessRepository;
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IDocumentService _documentService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IRepository<AssetPhotoEntity, int> _assetPhotoRepository;
    private readonly ILogger<AssetLeaseRentDetailsService> _logger;
    private readonly int _bufferSizeBytes;
    private readonly long _maxFileSizeBytes;

    public AssetLeaseRentDetailsService(
        IRepository<AssetLeaseRentDetailsEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<AssetMasterEntity, int> assetRepository,
        IRepository<AssetRoomWiseSubmissionDetailsEntity, int> roomWiseRepository,
        IRepository<LeaseRentRegistrationHistoryEntity, int> historyRepository,
        IRepository<ModuleMasterEntity, int> moduleRepository,
        IRepository<DocumentEntity, int> documentRepository,
        IRepository<DocumentBindingEntity, int> documentBindingRepository,
        IRepository<InventoryAssetDetailEntity, int> inventoryAssetDetailRepository,
        IRepository<UserRoleAllocationEntity, int> userRoleAllocationRepository,
        IUserAccessRepository userAccessRepository,
        IReferenceValidationService referenceValidator,
        IDocumentService documentService,
        IFileStorageService fileStorageService,
        IRepository<AssetPhotoEntity, int> assetPhotoRepository,
        IConfiguration configuration,
        ILogger<AssetLeaseRentDetailsService> logger)
        : base(repository, unitOfWork, mapper)
    {
        _assetRepository = assetRepository;
        _roomWiseRepository = roomWiseRepository;
        _historyRepository = historyRepository;
        _moduleRepository = moduleRepository;
        _documentRepository = documentRepository;
        _documentBindingRepository = documentBindingRepository;
        _inventoryAssetDetailRepository = inventoryAssetDetailRepository;
        _userRoleAllocationRepository = userRoleAllocationRepository;
        _userAccessRepository = userAccessRepository;
        _referenceValidator = referenceValidator;
        _documentService = documentService;
        _fileStorageService = fileStorageService;
        _assetPhotoRepository = assetPhotoRepository;
        _logger = logger;
        _bufferSizeBytes = configuration.GetValue<int>("FileStorage:BufferSizeBytes", 81920);
        _maxFileSizeBytes = configuration.GetValue<long>("FileStorage:MaxFileSizeBytes", 104857600);
    }

    /// <summary>
    /// Override to use ProjectTo so EF generates a proper JOIN to ApplicationTypeMaster
    /// (and other navigation properties) instead of the base class which only loads the
    /// flat entity without any includes.
    /// </summary>
    public override async Task<AssetLeaseRentDetailsDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        // Soft-deleted/inactive leases must be unreachable by ID, the same way DELETE and
        // GetAllAsync already treat them — otherwise a lease's tenant PII (Aadhaar/PAN/address)
        // stays fetchable by anyone who still has the id after the record is "deleted".
        var dto = await _repository.GetQueryable().AsNoTracking()
            .Where(x => x.Id == id && x.IsActive && !x.MarkedForDeletion)
            .ProjectTo<AssetLeaseRentDetailsDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (dto == null)
        {
            // Same fallback GetEnrichedAsync/CreateAsync/UpdateAsync use: ProjectTo can return
            // nothing depending on provider/navigation-mapping quirks even though the row exists.
            var entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity == null || !entity.IsActive || entity.MarkedForDeletion)
                return null;
            dto = _mapper.Map<AssetLeaseRentDetailsDto>(entity);
        }

        await EnrichUnitAreaAsync(dto, cancellationToken);
        await EnrichAssetPhotoAndNameAsync(dto, cancellationToken);
        return dto;
    }

    /// <summary>
    /// The lease row's TotalAreaSqFt is only populated when a unit is registered through the
    /// sub-unit create flow; units registered via manage-renters leave it null. In that case the
    /// unit's real area lives in AMS.RoomWiseSubmissionDetails (per-room, keyed by the unit's
    /// AssetId). Sum the active rooms so the drawer's "Unit Area (sq.mt)" shows a value instead of "-".
    /// </summary>
    private async Task EnrichUnitAreaAsync(AssetLeaseRentDetailsDto? dto, CancellationToken cancellationToken)
    {
        if (dto == null || (dto.TotalAreaSqFt.HasValue && dto.TotalAreaSqFt.Value != 0m))
            return;

        // TotalAreaSqFt is a square-FOOT field; prefer the room rows' own square-foot columns and
        // only fall back to converting the square-metre columns (1 sq.mt = 1/0.092903 sq.ft) when
        // no square-foot value was recorded — summing square metres straight into a square-foot
        // field under-reported the fallback area by roughly 10.76x.
        var areaSqFt = await _roomWiseRepository.GetQueryable().AsNoTracking()
            .Where(r => r.AssetId == dto.AssetId && r.IsActive && !r.MarkedForDeletion)
            .SumAsync(r => (r.TotalAreaSqFeet ?? r.AreaSqFeet)
                ?? ((r.TotalAreaSqMtr ?? r.AreaSqMtr) / 0.092903d)
                ?? 0d, cancellationToken);

        if (areaSqFt > 0d)
            dto.TotalAreaSqFt = (decimal)areaSqFt;
    }

    private async Task EnrichAssetPhotoAndNameAsync(AssetLeaseRentDetailsDto? dto, CancellationToken cancellationToken)
    {
        if (dto == null)
            return;

        // Fetch AssetData
        var assetData = await _assetRepository.GetQueryable().AsNoTracking()
            .Where(a => a.Id == dto.AssetId)
            .Select(a => new { a.AssetName, a.ParentAssetId })
            .FirstOrDefaultAsync(cancellationToken);

        if (assetData != null)
        {
            if (string.IsNullOrEmpty(dto.AssetName) && !string.IsNullOrEmpty(assetData.AssetName))
                dto.AssetName = assetData.AssetName;

            dto.ParentAssetId = assetData.ParentAssetId;

            if (assetData.ParentAssetId.HasValue)
            {
                var parentAsset = await _assetRepository.GetQueryable().AsNoTracking()
                    .Where(a => a.Id == assetData.ParentAssetId.Value)
                    .Select(a => a.AssetName)
                    .FirstOrDefaultAsync(cancellationToken);

                dto.ParentAssetName = parentAsset;
            }
        }

        // Fetch primary asset photo guid - only the current, active, non-deleted photo/binding/document.
        var photo = await _assetPhotoRepository.GetQueryable().AsNoTracking()
            .Where(p => p.AssetId == dto.AssetId && p.DocumentBindingId != null
                && p.IsLatest && p.IsActive && !p.MarkedForDeletion
                && p.DocumentBinding != null && p.DocumentBinding.IsActive && !p.DocumentBinding.MarkedForDeletion
                && p.DocumentBinding.Document != null && p.DocumentBinding.Document.IsActive && !p.DocumentBinding.Document.MarkedForDeletion)
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.Id)
            .Select(p => (Guid?)p.DocumentBinding!.Document!.DocumentGuid)
            .FirstOrDefaultAsync(cancellationToken);

        dto.AssetPhotoGuid = photo;
    }

    public override async Task<AssetLeaseRentDetailsDto> CreateAsync(CreateAssetLeaseRentDetailsDto createDto, CancellationToken cancellationToken = default)
    {
        if (createDto == null)
            throw new ArgumentNullException(nameof(createDto));

        var entity = _mapper.Map<AssetLeaseRentDetailsEntity>(createDto);

        var validationResult = await ValidateForCreateAsync(entity, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.ToDictionary();
            var errorMessage = $"Validation failed: {string.Join(", ", errors.Select(e => $"{e.Key}={string.Join(";", e.Value)}"))}";
            throw new NtisPlatform.Application.Exceptions.ValidationException(
                errorMessage,
                errors,
                NtisPlatform.Application.Enums.OperationType.Create);
        }

        entity.WorkflowStatus = StatusPending;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _repository.AddAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return await GetEnrichedAsync(entity.Id, cancellationToken) ?? _mapper.Map<AssetLeaseRentDetailsDto>(entity);
    }

    /// <summary>
    /// Shallow clone via MemberwiseClone, taken BEFORE mapping so ValidateForDeactivationAsync can
    /// compare old vs new state. Mirrors the pattern BaseCommonCrudService.UpdateAsync uses (its
    /// own clone helper is private, so this override needs its own copy).
    /// </summary>
    private static AssetLeaseRentDetailsEntity CloneForValidation(AssetLeaseRentDetailsEntity entity)
    {
        var cloneMethod = typeof(AssetLeaseRentDetailsEntity).GetMethod("MemberwiseClone", BindingFlags.Instance | BindingFlags.NonPublic)!;
        return (AssetLeaseRentDetailsEntity)cloneMethod.Invoke(entity, null)!;
    }

    private static void ThrowIfDeactivationInvalid(ValidationResult validationResult)
    {
        if (validationResult.IsValid)
            return;

        var errors = validationResult.ToDictionary();
        var errorMessage = $"Validation failed: {string.Join(", ", errors.Select(e => $"{e.Key}={string.Join(";", e.Value)}"))}";
        throw new NtisPlatform.Application.Exceptions.ValidationException(
            errorMessage,
            errors,
            NtisPlatform.Application.Enums.OperationType.Update);
    }

    public override async Task<AssetLeaseRentDetailsDto?> UpdateAsync(int id, UpdateAssetLeaseRentDetailsDto updateDto, CancellationToken cancellationToken = default)
    {
        // A soft-deleted (MarkedForDeletion) lease is not editable — otherwise a PUT could rewrite
        // its tenant data or flip IsActive back to true while it stays queued for hard delete.
        // A lease that was only deactivated through PUT (IsActive=false, not marked) stays
        // editable so it can be reactivated.
        var entity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id && !x.MarkedForDeletion, cancellationToken);

        // ExecuteUpdate only special-cases a null result as "not found" (200 with Success=false);
        // any thrown exception it doesn't recognize (KeyNotFoundException included) falls through
        // to its generic catch and becomes a 500. Return null so the real not-found response fires.
        if (entity == null)
            return null;

        // Shallow clone BEFORE mapping so the deactivation guard below can compare old vs new IsActive.
        var currentEntitySnapshot = CloneForValidation(entity);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Create history snapshot of current entity values BEFORE updating
            var history = new LeaseRentRegistrationHistoryEntity
            {
                LeaseRentRegistrationId = entity.Id,
                AssetId = entity.AssetId,
                Remarks = "Lease details updated",
                PerformedBy = updateDto.UpdatedBy ?? 0,
                PerformedDate = DateTime.UtcNow,
                IsActive = true,
                CreatedBy = updateDto.UpdatedBy,
                CreatedDate = DateTime.UtcNow,

                // Snapshot properties
                Snap_GrievanceNo = entity.Id.ToString(),
                Snap_ShopNo = entity.ShopNo,
                Snap_ShopName = entity.ShopName,
                Snap_TenantName = entity.TenantName,
                Snap_TenantMobile = entity.TenantMobile,
                Snap_TenantEmail = entity.TenantEmail,
                Snap_TenantType = entity.TenantType,
                Snap_TenantAadhaarNo = entity.TenantAadhaarNo,
                Snap_TenantPanCardNo = entity.TenantPanCardNo,
                Snap_TenantAddress = entity.TenantAddress,
                Snap_GSTNo = entity.GSTNo,
                Snap_TotalAreaSqFt = entity.TotalAreaSqFt,
                Snap_ApplicationType = string.Empty,
                Snap_LeaseType = entity.LeaseType,
                Snap_LeaseStartDate = entity.LeaseStartDate,
                Snap_LeaseEndDate = entity.LeaseEndDate,
                Snap_Duration = entity.Duration,
                Snap_RentAmount = entity.RentAmount,
                Snap_SecurityDeposit = entity.SecurityDeposit,
                Snap_DepositType = entity.DepositType,
                Snap_PaymentFrequency = entity.PaymentFrequency,
                Snap_AgreementId = entity.AgreementId,
                Snap_IncrementFrequency = entity.IncrementFrequency,
                Snap_IncrementType = entity.IncrementType,
                Snap_IncrementValue = entity.IncrementValue,
                Snap_IncrementMethod = entity.IncrementMethod,
                Snap_Reason = entity.Reason,
                Snap_WorkflowStatus = entity.WorkflowStatus,
                Snap_RejectionReason = entity.RejectionReason,
                Snap_IsRejection = entity.IsRejection,
                Snap_IsVerified = entity.IsVerified,
                Snap_IsApproved = entity.IsApproved,
                Snap_IsActive = entity.IsActive
            };

            await _historyRepository.AddAsync(history, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Apply updates from updateDto to entity
            _mapper.Map(updateDto, entity);
            // Belt-and-suspenders alongside the mapping profile's WorkflowStatus.Ignore(): only the
            // guarded workflow-transition endpoints may change status. Re-assert the pre-update
            // value here so this can never regress even if the mapping profile changes.
            entity.WorkflowStatus = currentEntitySnapshot.WorkflowStatus;
            entity.UpdatedDate = DateTime.UtcNow;
            entity.UpdatedBy = updateDto.UpdatedBy;

            // AssetId is mutable through this update. Re-run the same active-asset check CreateAsync
            // enforces so an inactive or nonexistent target asset is rejected as a 400 here instead
            // of either silently succeeding or hitting the DB FK constraint and surfacing as a 500.
            var assetValidationResult = await ValidateForCreateAsync(entity, cancellationToken);
            ThrowIfDeactivationInvalid(assetValidationResult);

            // Validate AFTER mapping so IsActive:true->false transitions get reference-checked,
            // same guard DeleteAsync already enforces via ValidateForDeleteAsync.
            var validationResult = await ValidateForDeactivationAsync(id, currentEntitySnapshot, entity, cancellationToken);
            ThrowIfDeactivationInvalid(validationResult);

            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // A workflow transition changed WorkflowStatus (a concurrency token) between this
            // request's read and write. ExecuteUpdate turns anything but a ValidationException into
            // a 500, so surface the lost race as a 400 — the same outcome the transitions give.
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new NtisPlatform.Application.Exceptions.ValidationException(
                nameof(entity.WorkflowStatus),
                "LeaseRent_ConcurrentModification",
                NtisPlatform.Application.Enums.OperationType.Update);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        // Return the same enriched DTO shape as GetById and the workflow-transition responses
        // (ParentAssetName, AssetPhotoGuid, unit-area fallback), not a raw ProjectTo result.
        return await GetEnrichedAsync(id, cancellationToken) ?? _mapper.Map<AssetLeaseRentDetailsDto>(entity);
    }

    public async Task<AssetLeaseRentDetailsDto?> UpdateAndSendToVerificationAsync(
        int id,
        UpdateAssetLeaseRentDetailsDto updateDto,
        int userId,
        CancellationToken cancellationToken = default)
    {
        // Same active-only rule as every other workflow transition (see GetActiveForWorkflowAsync).
        var entity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id && x.IsActive && !x.MarkedForDeletion, cancellationToken);

        if (entity == null)
            return null;

        var currentEntitySnapshot = CloneForValidation(entity);

        _mapper.Map(updateDto, entity);
        entity.WorkflowStatus = StatusPending;
        // Restarting the workflow must clear markers from whatever state it was previously in —
        // otherwise resending an Approved/Rejected row back to Pending leaves IsApproved/
        // IsRejection (etc.) true, and the API reports a Pending row that's also "approved".
        entity.IsVerified = false;
        entity.VerifiedBy = null;
        entity.VerifiedDate = null;
        entity.IsApproved = false;
        entity.ApprovedBy = null;
        entity.ApprovedDate = null;
        entity.IsRejection = false;
        entity.RejectionBy = null;
        entity.RejectionDate = null;
        entity.RejectionReason = null;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = userId;

        // This DTO can carry a different AssetId than the lease currently has — the controller
        // authorizes the caller against that target asset's department before this is ever called,
        // but the target must still be a real, active asset (same check CreateAsync/UpdateAsync
        // enforce), or a caller could reassign the lease onto an inactive/nonexistent asset.
        var assetValidationResult = await ValidateForCreateAsync(entity, cancellationToken);
        ThrowIfDeactivationInvalid(assetValidationResult);

        var validationResult = await ValidateForDeactivationAsync(id, currentEntitySnapshot, entity, cancellationToken);
        ThrowIfDeactivationInvalid(validationResult);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Snapshot of PRIOR values (from before mapping, same as UpdateAsync's history write) —
            // otherwise edits saved through send-for-verification never show up in
            // GetPreviousTenantHistoryAsync, unlike edits saved through the ordinary PUT.
            var history = new LeaseRentRegistrationHistoryEntity
            {
                LeaseRentRegistrationId = currentEntitySnapshot.Id,
                AssetId = currentEntitySnapshot.AssetId,
                Remarks = "Lease details updated",
                PerformedBy = userId,
                PerformedDate = DateTime.UtcNow,
                IsActive = true,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,

                Snap_GrievanceNo = currentEntitySnapshot.Id.ToString(),
                Snap_ShopNo = currentEntitySnapshot.ShopNo,
                Snap_ShopName = currentEntitySnapshot.ShopName,
                Snap_TenantName = currentEntitySnapshot.TenantName,
                Snap_TenantMobile = currentEntitySnapshot.TenantMobile,
                Snap_TenantEmail = currentEntitySnapshot.TenantEmail,
                Snap_TenantType = currentEntitySnapshot.TenantType,
                Snap_TenantAadhaarNo = currentEntitySnapshot.TenantAadhaarNo,
                Snap_TenantPanCardNo = currentEntitySnapshot.TenantPanCardNo,
                Snap_TenantAddress = currentEntitySnapshot.TenantAddress,
                Snap_GSTNo = currentEntitySnapshot.GSTNo,
                Snap_TotalAreaSqFt = currentEntitySnapshot.TotalAreaSqFt,
                Snap_ApplicationType = string.Empty,
                Snap_LeaseType = currentEntitySnapshot.LeaseType,
                Snap_LeaseStartDate = currentEntitySnapshot.LeaseStartDate,
                Snap_LeaseEndDate = currentEntitySnapshot.LeaseEndDate,
                Snap_Duration = currentEntitySnapshot.Duration,
                Snap_RentAmount = currentEntitySnapshot.RentAmount,
                Snap_SecurityDeposit = currentEntitySnapshot.SecurityDeposit,
                Snap_DepositType = currentEntitySnapshot.DepositType,
                Snap_PaymentFrequency = currentEntitySnapshot.PaymentFrequency,
                Snap_AgreementId = currentEntitySnapshot.AgreementId,
                Snap_IncrementFrequency = currentEntitySnapshot.IncrementFrequency,
                Snap_IncrementType = currentEntitySnapshot.IncrementType,
                Snap_IncrementValue = currentEntitySnapshot.IncrementValue,
                Snap_IncrementMethod = currentEntitySnapshot.IncrementMethod,
                Snap_Reason = currentEntitySnapshot.Reason,
                Snap_WorkflowStatus = currentEntitySnapshot.WorkflowStatus,
                Snap_RejectionReason = currentEntitySnapshot.RejectionReason,
                Snap_IsRejection = currentEntitySnapshot.IsRejection,
                Snap_IsVerified = currentEntitySnapshot.IsVerified,
                Snap_IsApproved = currentEntitySnapshot.IsApproved,
                Snap_IsActive = currentEntitySnapshot.IsActive
            };

            await _historyRepository.AddAsync(history, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Same translation SaveTransitionAsync applies: another request changed WorkflowStatus
            // between this request's read and write, so this restart no longer applies.
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new InvalidOperationException($"LeaseRent_InvalidTransition:Concurrent->{StatusPending}");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return await GetEnrichedAsync(id, cancellationToken) ?? _mapper.Map<AssetLeaseRentDetailsDto>(entity);
    }

    public override Task<PagedResult<AssetLeaseRentDetailsDto>> GetAllAsync(
        AssetLeaseRentDetailsQueryParameters qp,
        CancellationToken cancellationToken = default)
        => GetAllInternalAsync(qp, cancellationToken);

    private async Task<PagedResult<AssetLeaseRentDetailsDto>> GetAllInternalAsync(
        AssetLeaseRentDetailsQueryParameters qp,
        CancellationToken cancellationToken)
    {
        // Base query: common source for both items and stats.
        // Lease/rent registrations are attached to whichever asset the user
        // selects (top-level or sub-unit), so we must NOT restrict to
        // ParentAssetId.HasValue — that excluded every top-level asset and
        // hid all of their registrations.
        // Inventory units (furniture, computers, vehicles) get their own AssetMaster child row
        // purely to carry an AMS.InventoryAssetDetail row — checked directly here (rather than
        // trusting AssetCategory.IsMovable alone) so they can never surface as an "unregistered
        // leasable sub-unit" or via a stray lease record; only real sub-units remain.
        var baseQuery = from asset in _assetRepository.GetQueryable().AsNoTracking()
                        where !asset.MarkedForDeletion
                            && (asset.AssetCategory == null || !asset.AssetCategory.IsMovable)
                            && !_inventoryAssetDetailRepository.GetQueryable()
                                .Any(inv => inv.AssetId == asset.Id && !inv.MarkedForDeletion)
                        join leaseRent in _repository.GetQueryable()
                                .AsNoTracking()
                                .Where(x => !x.MarkedForDeletion)
                            on asset.Id equals leaseRent.AssetId into leaseRentGroup
                        from leaseRent in leaseRentGroup
                            .OrderByDescending(x => x.CreatedDate)
                            .Take(1)
                            .DefaultIfEmpty()
                        select new
                        {
                            Asset = asset,
                            LeaseRent = leaseRent
                        };

        // The registration landing lists BOTH real lease/rent registrations and unregistered
        // leasable sub-units (shops). Unregistered sub-units have a null LeaseRent and are
        // projected with WorkflowStatus = "Registered", so the UI can offer a "+" to start a new
        // registration for them. Workflow-scoped tabs (Verification/Approval/Reverted) pass a
        // WorkflowStatus and are narrowed to real lease records below.
        var query = baseQuery.Where(x =>
            x.LeaseRent != null
            || (x.Asset.ParentAssetId != null && x.Asset.IsActive));

        if (qp.AssetCategoryId.HasValue)
            query = query.Where(x => x.Asset.AssetCategoryId == qp.AssetCategoryId.Value);

        if (qp.AssetTypeId.HasValue)
            query = query.Where(x => x.Asset.AssetTypeId == qp.AssetTypeId.Value);

        if (qp.ZoneId.HasValue)
        {
            query = query.Where(x => 
                (x.Asset.Details != null && x.Asset.Details.ZoneId == qp.ZoneId.Value) ||
                (x.Asset.ParentAsset != null && x.Asset.ParentAsset.Details != null && x.Asset.ParentAsset.Details.ZoneId == qp.ZoneId.Value)
            );
        }

        if (qp.WardId.HasValue)
        {
            query = query.Where(x => 
                (x.Asset.Details != null && x.Asset.Details.WardId == qp.WardId.Value) ||
                (x.Asset.ParentAsset != null && x.Asset.ParentAsset.Details != null && x.Asset.ParentAsset.Details.WardId == qp.WardId.Value)
            );
        }

        if (qp.ParentAssetId.HasValue)
            query = query.Where(x => x.Asset.ParentAssetId == qp.ParentAssetId.Value);

        if (qp.AssetId.HasValue)
            query = query.Where(x => x.Asset.Id == qp.AssetId.Value);

        if (qp.IsActive.HasValue)
        {
            query = query.Where(x =>
                (x.LeaseRent != null ? x.LeaseRent.IsActive : x.Asset.IsActive) == qp.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(qp.WorkflowStatus))
        {
            var workflowStatus = qp.WorkflowStatus.Trim().ToLower();

            // "registered" is the placeholder status for leasable sub-units with no lease record
            // yet; every other status matches a real lease/rent registration.
            query = workflowStatus == "registered"
                ? query.Where(x => x.LeaseRent == null)
                : query.Where(x =>
                    x.LeaseRent != null &&
                    x.LeaseRent.WorkflowStatus != null &&
                    x.LeaseRent.WorkflowStatus.ToLower() == workflowStatus);
        }

        if (!string.IsNullOrWhiteSpace(qp.SearchTerm))
        {
            var term = qp.SearchTerm.Trim();

            query = query.Where(x =>
                x.Asset.AssetNo.Contains(term) ||
                x.Asset.AssetName.Contains(term) ||
                (x.Asset.ParentAsset != null && x.Asset.ParentAsset.AssetName.Contains(term)) ||
                (
                    x.LeaseRent != null &&
                    (
                        x.LeaseRent.TenantName.Contains(term) ||
                        x.LeaseRent.TenantMobile.Contains(term) ||
                        (
                            x.LeaseRent.ShopName != null &&
                            x.LeaseRent.ShopName.Contains(term)
                        ) ||
                        (
                            x.LeaseRent.ShopNo != null &&
                            x.LeaseRent.ShopNo.Contains(term)
                        )
                    )
                ));
        }

        if (!string.IsNullOrWhiteSpace(qp.TenantName))
        {
            query = query.Where(x =>
                x.LeaseRent != null &&
                x.LeaseRent.TenantName.Contains(qp.TenantName));
        }

        if (!string.IsNullOrWhiteSpace(qp.TenantMobile))
        {
            query = query.Where(x =>
                x.LeaseRent != null &&
                x.LeaseRent.TenantMobile.Contains(qp.TenantMobile));
        }

        if (!string.IsNullOrWhiteSpace(qp.ShopName))
        {
            query = query.Where(x =>
                x.LeaseRent != null &&
                x.LeaseRent.ShopName != null &&
                x.LeaseRent.ShopName.Contains(qp.ShopName));
        }

        if (!string.IsNullOrWhiteSpace(qp.ShopNo))
        {
            query = query.Where(x =>
                x.LeaseRent != null &&
                x.LeaseRent.ShopNo != null &&
                x.LeaseRent.ShopNo.Contains(qp.ShopNo));
        }

        if (!string.IsNullOrWhiteSpace(qp.AssetNo))
        {
            query = query.Where(x =>
                x.Asset.AssetNo.Contains(qp.AssetNo));
        }

        // Apply Date Range filters
        if (qp.FromDate.HasValue)
        {
            query = query.Where(x =>
                x.LeaseRent != null &&
                x.LeaseRent.LeaseStartDate >= qp.FromDate.Value);
        }

        if (qp.ToDate.HasValue)
        {
            query = query.Where(x =>
                x.LeaseRent != null &&
                x.LeaseRent.LeaseEndDate.HasValue &&
                x.LeaseRent.LeaseEndDate.Value <= qp.ToDate.Value);
        }

        var total = await query.CountAsync(cancellationToken);

        var descending = string.Equals(qp.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);

        query = string.IsNullOrWhiteSpace(qp.SortBy)
            ? query.OrderByDescending(x => x.LeaseRent != null
                ? (x.LeaseRent.UpdatedDate ?? x.LeaseRent.CreatedDate)
                : (x.Asset.UpdatedDate ?? x.Asset.CreatedDate))
            : qp.SortBy.Trim().ToLowerInvariant() switch
            {
                "tenantname" => descending
                    ? query.OrderByDescending(x => x.LeaseRent != null ? x.LeaseRent.TenantName : null)
                    : query.OrderBy(x => x.LeaseRent != null ? x.LeaseRent.TenantName : null),
                "tenantmobile" => descending
                    ? query.OrderByDescending(x => x.LeaseRent != null ? x.LeaseRent.TenantMobile : null)
                    : query.OrderBy(x => x.LeaseRent != null ? x.LeaseRent.TenantMobile : null),
                "shopname" => descending
                    ? query.OrderByDescending(x => x.LeaseRent != null ? x.LeaseRent.ShopName : null)
                    : query.OrderBy(x => x.LeaseRent != null ? x.LeaseRent.ShopName : null),
                "shopno" => descending
                    ? query.OrderByDescending(x => x.LeaseRent != null ? x.LeaseRent.ShopNo : null)
                    : query.OrderBy(x => x.LeaseRent != null ? x.LeaseRent.ShopNo : null),
                _ => throw new NtisPlatform.Application.Exceptions.FilterValidationException(
                    "SortBy", $"Field '{qp.SortBy}' is not sortable. Allowed fields: TenantName, TenantMobile, ShopName, ShopNo")
            };

        var pageNumber = qp.PageSize == -1 ? 1 : qp.PageNumber;
        var pageSize = qp.PageSize == -1 ? Math.Max(total, 1) : qp.PageSize;

        var items = await query
            .Skip(qp.PageSize == -1 ? 0 : (pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AssetLeaseRentDetailsDto
            {
                Id = x.LeaseRent != null ? x.LeaseRent.Id : 0,

                ParentAssetId = x.Asset.ParentAssetId,

                AssetId = x.Asset.Id,

                FloorDetailsId = x.LeaseRent != null ? x.LeaseRent.FloorDetailsId : null,

                ShopNo = x.LeaseRent != null ? x.LeaseRent.ShopNo : x.Asset.AssetNo,
                ShopName = x.LeaseRent != null ? x.LeaseRent.ShopName : x.Asset.AssetName,
                ShopRegionalName = x.LeaseRent != null ? x.LeaseRent.ShopRegionalName : null,

                TenantName = x.LeaseRent != null ? x.LeaseRent.TenantName : string.Empty,
                TenantRegionalName = x.LeaseRent != null ? x.LeaseRent.TenantRegionalName : null,
                TenantMobile = x.LeaseRent != null ? x.LeaseRent.TenantMobile : string.Empty,
                TenantEmail = x.LeaseRent != null ? x.LeaseRent.TenantEmail : null,
                TenantType = x.LeaseRent != null ? x.LeaseRent.TenantType : "-",
                TenantAadhaarNo = x.LeaseRent != null ? x.LeaseRent.TenantAadhaarNo : null,
                TenantPanCardNo = x.LeaseRent != null ? x.LeaseRent.TenantPanCardNo : null,
                TenantAddress = x.LeaseRent != null ? x.LeaseRent.TenantAddress : null,
                GSTNo = x.LeaseRent != null ? x.LeaseRent.GSTNo : null,

                TotalAreaSqFt = x.LeaseRent != null ? x.LeaseRent.TotalAreaSqFt : null,

                ApplicationTypeId = x.LeaseRent != null ? x.LeaseRent.ApplicationTypeId : null,

                LeaseType = x.LeaseRent != null ? x.LeaseRent.LeaseType : "-",

                LeaseStartDate = x.LeaseRent != null
                    ? x.LeaseRent.LeaseStartDate
                    : (x.Asset.CreatedDate ?? DateTime.UtcNow),

                LeaseEndDate = x.LeaseRent != null ? x.LeaseRent.LeaseEndDate : null,
                Duration = x.LeaseRent != null ? x.LeaseRent.Duration : null,

                RentAmount = x.LeaseRent != null ? x.LeaseRent.RentAmount : null,
                // Mirror RentAmount into the legacy MonthlyRent field the UI reads for display.
                MonthlyRent = x.LeaseRent != null ? (x.LeaseRent.RentAmount ?? 0m) : 0m,

                SecurityDeposit = x.LeaseRent != null ? x.LeaseRent.SecurityDeposit : 0m,
                DepositType = x.LeaseRent != null ? x.LeaseRent.DepositType : null,
                PaymentFrequency = x.LeaseRent != null ? x.LeaseRent.PaymentFrequency : "-",
                AdvanceBalance = x.LeaseRent != null ? x.LeaseRent.AdvanceBalance : 0m,

                AgreementId = x.LeaseRent != null ? x.LeaseRent.AgreementId : null,

                IncrementFrequency = x.LeaseRent != null ? x.LeaseRent.IncrementFrequency : null,
                IncrementType = x.LeaseRent != null ? x.LeaseRent.IncrementType : null,
                IncrementValue = x.LeaseRent != null ? x.LeaseRent.IncrementValue : null,
                IncrementMethod = x.LeaseRent != null ? x.LeaseRent.IncrementMethod : null,

                Reason = x.LeaseRent != null ? x.LeaseRent.Reason : null,

                WorkflowStatus = x.LeaseRent != null
                    ? x.LeaseRent.WorkflowStatus
                    : "Registered",

                RejectionReason = x.LeaseRent != null ? x.LeaseRent.RejectionReason : null,
                IsRejection = x.LeaseRent != null && x.LeaseRent.IsRejection,
                RejectionBy = x.LeaseRent != null ? x.LeaseRent.RejectionBy : null,
                RejectionDate = x.LeaseRent != null ? x.LeaseRent.RejectionDate : null,

                IsVerified = x.LeaseRent != null && x.LeaseRent.IsVerified,
                VerifiedBy = x.LeaseRent != null ? x.LeaseRent.VerifiedBy : null,
                VerifiedDate = x.LeaseRent != null ? x.LeaseRent.VerifiedDate : null,

                IsApproved = x.LeaseRent != null && x.LeaseRent.IsApproved,
                ApprovedBy = x.LeaseRent != null ? x.LeaseRent.ApprovedBy : null,
                ApprovedDate = x.LeaseRent != null ? x.LeaseRent.ApprovedDate : null,

                LeaseDurationDisplay = null,
                RentAmountDisplay = null,
                AssetNo = x.Asset.AssetNo,
                AssetName = x.Asset.AssetName,
                AssetCategoryName = x.Asset.AssetCategory != null ? x.Asset.AssetCategory.CategoryName : null,
                ParentAssetName = x.Asset.ParentAsset != null ? x.Asset.ParentAsset.AssetName : null,
                AssetPhotoGuid = _assetPhotoRepository.GetQueryable()
                    .Where(p => p.AssetId == x.Asset.Id && p.DocumentBindingId != null
                        && p.IsLatest && p.IsActive && !p.MarkedForDeletion
                        && p.DocumentBinding != null && p.DocumentBinding.IsActive && !p.DocumentBinding.MarkedForDeletion
                        && p.DocumentBinding.Document != null && p.DocumentBinding.Document.IsActive && !p.DocumentBinding.Document.MarkedForDeletion)
                    .OrderBy(p => p.DisplayOrder)
                    .ThenBy(p => p.Id)
                    .Select(p => (Guid?)p.DocumentBinding!.Document!.DocumentGuid)
                    .FirstOrDefault(),
                Names = new AssetLeaseRentDetailsNamesDto
                {
                    AssetNo = x.Asset.AssetNo,
                    AssetName = x.Asset.AssetName,
                    AssetCategoryName = x.Asset.AssetCategory != null ? x.Asset.AssetCategory.CategoryName : null,
                    ApplicationTypeName = null,
                    FloorDescription = null
                },
                IsActive = x.LeaseRent != null ? x.LeaseRent.IsActive : x.Asset.IsActive,
                CreatedDate = x.LeaseRent != null ? x.LeaseRent.CreatedDate : x.Asset.CreatedDate,
                UpdatedDate = x.LeaseRent != null ? x.LeaseRent.UpdatedDate : x.Asset.UpdatedDate
            })
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            var amt = item.RentAmount ?? item.MonthlyRent;

            item.RentAmountDisplay = $"₹ {amt:N0} ({item.PaymentFrequency})";

            if (item.LeaseEndDate.HasValue)
            {
                var start = item.LeaseStartDate;
                var end = item.LeaseEndDate.Value;

                var totalDays = (end - start).Days + 1;

                int years = end.Year - start.Year;
                int months = end.Month - start.Month;

                if (end.Day < start.Day)
                {
                    months--;
                }

                if (months < 0)
                {
                    years--;
                    months += 12;
                }

                var durationStr = string.Empty;

                if (years > 0)
                    durationStr += $"{years} year{(years > 1 ? "s" : "")} ";

                if (months > 0)
                    durationStr += $"{months} month{(months > 1 ? "s" : "")}";

                durationStr = durationStr.Trim();

                item.LeaseDurationDisplay = string.IsNullOrEmpty(durationStr)
                    ? $"{totalDays} days"
                    : $"{durationStr} ({totalDays} days)";
            }
            else if (item.Duration.HasValue)
            {
                int durationMonths = item.Duration.Value;
                int years = durationMonths / 12;
                int months = durationMonths % 12;

                var durationStr = string.Empty;

                if (years > 0)
                    durationStr += $"{years} year{(years > 1 ? "s" : "")} ";

                if (months > 0)
                    durationStr += $"{months} month{(months > 1 ? "s" : "")}";

                item.LeaseDurationDisplay = durationStr.Trim();
            }
        }

        // Stats are calculated from baseQuery, so query params do not affect stats
        var statsCounts = await baseQuery
            .Where(x => x.LeaseRent != null)
            .Select(x => x.LeaseRent!)
            .GroupBy(x => x.WorkflowStatus)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        int GetCount(string status) =>
            statsCounts.FirstOrDefault(c =>
                string.Equals(
                    c.Status,
                    status,
                    StringComparison.OrdinalIgnoreCase
                )
            )?.Count ?? 0;

        var stats = new LeaseStatsDto
        {
            TotalApproved = GetCount(StatusApproved),
            TotalVerified = GetCount(StatusVerified),
            VerificationPending = GetCount(StatusPending),
            ApprovalPending = GetCount(StatusVerified),
            TotalRejected = GetCount(StatusRejected)
        };

        return new AssetLeaseRentDetailsPagedResult(
            items,
            total,
            pageNumber,
            pageSize,
            stats
        );
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetLeaseRentDetailsEntity entity, CancellationToken cancellationToken = default)
    {
        var assetExists = await _assetRepository.GetQueryable().AsNoTracking()
            .AnyAsync(a => a.Id == entity.AssetId && a.IsActive, cancellationToken);
        if (!assetExists)
            return ValidationResult.Failure(nameof(entity.AssetId), "AssetLeaseRentDetails_Asset_NotFound");

        return ValidationResult.Success();
    }

    /// <summary>
    /// Not invoked by the custom <see cref="UpdateAsync"/> override above (which manages its own
    /// history-snapshot transaction and never calls this hook) — kept for BaseCommonCrudService
    /// contract parity and in case a future refactor routes UpdateAsync back through it. The
    /// out-of-scope check that actually gates Update lives inline in the override itself.
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetLeaseRentDetailsEntity currentEntity, AssetLeaseRentDetailsEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetLeaseRentDetailsEntity>(id, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetLeaseRentDetailsEntity entity, CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<AssetLeaseRentDetailsEntity>(id, cancellationToken);
    }

    private const string StatusPending = "Pending";
    private const string StatusVerified = "Verified";
    private const string StatusApproved = "Approved";
    private const string StatusRejected = "Rejected";

    public Task<AssetLeaseRentDetailsDto?> SendToVerificationAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
        => TransitionAsync(id, StatusPending, StatusPending, remarks, userId, e => { }, cancellationToken);

    public Task<AssetLeaseRentDetailsDto?> VerifyAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
        => TransitionAsync(id, StatusPending, StatusVerified, remarks, userId,
            e => { e.IsVerified = true; e.VerifiedBy = userId; e.VerifiedDate = DateTime.UtcNow; }, cancellationToken);

    public async Task<AssetLeaseRentDetailsDto?> ApproveAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await GetActiveForWorkflowAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus != StatusVerified)
            throw new InvalidOperationException($"LeaseRent_InvalidTransition:{entity.WorkflowStatus}->{StatusApproved}");

        entity.IsApproved = true;
        entity.ApprovedBy = userId;
        entity.ApprovedDate = DateTime.UtcNow;
        entity.Reason = remarks;
        entity.WorkflowStatus = StatusApproved;
        entity.UpdatedBy = userId;

        await SaveTransitionAsync(entity, StatusApproved, cancellationToken);

        return await GetEnrichedAsync(id, cancellationToken);
    }

    public async Task<AssetLeaseRentDetailsDto?> RejectAsync(int id, string reason, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await GetActiveForWorkflowAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus != StatusPending && entity.WorkflowStatus != StatusVerified)
            throw new InvalidOperationException($"LeaseRent_InvalidTransition:{entity.WorkflowStatus}->{StatusRejected}");

        entity.RejectionReason = reason;
        entity.IsRejection = true;
        entity.RejectionBy = userId;
        entity.RejectionDate = DateTime.UtcNow;
        entity.WorkflowStatus = StatusRejected;
        entity.UpdatedBy = userId;

        await SaveTransitionAsync(entity, StatusRejected, cancellationToken);

        return await GetEnrichedAsync(id, cancellationToken);
    }

    private const string StatusReverted = "Reverted";

    public async Task<AssetLeaseRentDetailsDto?> RevertToRegistrationAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
    {
        var entity = await GetActiveForWorkflowAsync(id, cancellationToken);
        if (entity == null)
            return null;

        string from = entity.WorkflowStatus;
        string to;

        if (from == StatusVerified)
        {
            to = StatusPending;
            entity.IsVerified = false;
            entity.VerifiedBy = null;
            entity.VerifiedDate = null;
        }
        else if (from == StatusPending)
        {
            to = StatusReverted;
            entity.IsVerified = false;
            entity.VerifiedBy = null;
            entity.VerifiedDate = null;
        }
        else
        {
            throw new InvalidOperationException($"LeaseRent_InvalidTransition:{from}->{StatusReverted}");
        }

        entity.WorkflowStatus = to;
        entity.Reason = remarks;
        entity.UpdatedBy = userId;

        await SaveTransitionAsync(entity, to, cancellationToken);

        return await GetEnrichedAsync(id, cancellationToken);
    }

    public Task<AssetLeaseRentDetailsDto?> RevertToVerificationAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default)
        => TransitionAsync(id, StatusApproved, StatusVerified, remarks, userId,
            e => { e.IsApproved = false; e.ApprovedBy = null; e.ApprovedDate = null; }, cancellationToken);

    /// <summary>
    /// Atomically transitions the row from <paramref name="expectedFrom"/> to <paramref name="to"/>.
    /// WorkflowStatus is configured as an EF Core concurrency token (see
    /// ApplicationDbContext.OnModelCreating), so the generated UPDATE's WHERE clause includes the
    /// status value this method just read — if another request already changed it, SaveChangesAsync
    /// throws DbUpdateConcurrencyException instead of silently overwriting that other transition.
    /// </summary>
    private async Task<AssetLeaseRentDetailsDto?> TransitionAsync(
        int id, string expectedFrom, string to, string? remarks, int userId,
        Action<AssetLeaseRentDetailsEntity> mutate, CancellationToken cancellationToken)
    {
        var entity = await GetActiveForWorkflowAsync(id, cancellationToken);
        if (entity == null)
            return null;

        if (entity.WorkflowStatus != expectedFrom)
            throw new InvalidOperationException($"LeaseRent_InvalidTransition:{entity.WorkflowStatus}->{to}");

        mutate(entity);
        entity.Reason = remarks;
        entity.WorkflowStatus = to;
        entity.UpdatedBy = userId;

        await SaveTransitionAsync(entity, to, cancellationToken);

        return await GetEnrichedAsync(id, cancellationToken);
    }

    /// <summary>
    /// Loads a lease for a workflow transition. Inactive or soft-deleted (MarkedForDeletion) rows
    /// come back as null — the same rule GetByIdAsync applies — so a deleted lease can't be
    /// verified/approved/rejected/reverted, or have its tenant data returned in the transition
    /// response. Callers already map null to 404.
    /// </summary>
    private async Task<AssetLeaseRentDetailsEntity?> GetActiveForWorkflowAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        return entity == null || !entity.IsActive || entity.MarkedForDeletion ? null : entity;
    }

    private async Task SaveTransitionAsync(AssetLeaseRentDetailsEntity entity, string to, CancellationToken cancellationToken)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another request already changed WorkflowStatus between our read and write — the
            // transition this call was authorized for no longer applies.
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new InvalidOperationException($"LeaseRent_InvalidTransition:Concurrent->{to}");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    private async Task<AssetLeaseRentDetailsDto?> GetEnrichedAsync(int id, CancellationToken cancellationToken)
    {
        var dto = await _repository.GetQueryable().AsNoTracking()
            .Where(x => x.Id == id)
            .ProjectTo<AssetLeaseRentDetailsDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (dto == null)
        {
            // Same fallback CreateAsync/UpdateAsync/UpdateAndSendToVerificationAsync already use:
            // ProjectTo can return nothing depending on provider/navigation-mapping quirks even
            // though the row exists, so fall back to a plain in-memory map of the loaded entity.
            var entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity == null)
                return null;
            dto = _mapper.Map<AssetLeaseRentDetailsDto>(entity);
        }

        await EnrichUnitAreaAsync(dto, cancellationToken);
        await EnrichAssetPhotoAndNameAsync(dto, cancellationToken);
        return dto;
    }

    /// <summary>
    /// Returns all history snapshots stored for the given AssetLeaseRentDetails registration ID,
    /// mapped to the Previous Tenant History DTO so the UI "Previous Tenant Information" tab
    /// can show real audit data instead of static values.
    /// Ordered newest-first by PerformedDate.
    /// </summary>
    public async Task<List<AssetLeaseRentPreviousTenantHistoryDto>> GetPreviousTenantHistoryAsync(
        int leaseRentRegistrationId, CancellationToken cancellationToken = default)
    {
        return await _historyRepository.GetQueryable().AsNoTracking()
            .Where(h => h.LeaseRentRegistrationId == leaseRentRegistrationId)
            .OrderByDescending(h => h.PerformedDate)
            .Select(h => new AssetLeaseRentPreviousTenantHistoryDto
            {
                Id                  = h.Id,
                ActionType          = "Updated",
                ActionLabel         = h.Remarks ?? "Lease details updated",
                PerformedDate       = h.PerformedDate,
                FromStatus          = null,
                ToStatus            = h.Snap_WorkflowStatus,
                Remarks             = h.Remarks,

                // Tenant snapshot
                TenantName          = h.Snap_TenantName,
                TenantMobile        = h.Snap_TenantMobile,
                TenantEmail         = h.Snap_TenantEmail,
                TenantType          = h.Snap_TenantType,
                TenantAadhaarNo     = h.Snap_TenantAadhaarNo,
                TenantPanCardNo     = h.Snap_TenantPanCardNo,
                TenantAddress       = h.Snap_TenantAddress,

                // Previous tenant snapshot
                PreviousTenantName  = h.Snap_PreviousTenantName,
                PreviousTenantMobile = h.Snap_PreviousTenantMobile,

                // Lease snapshot
                LeaseType           = h.Snap_LeaseType,
                ShopNo              = h.Snap_ShopNo,
                Floor               = h.Snap_Floor,
                ShopName            = h.Snap_ShopName,
                OldLeaseStartDate   = h.Snap_OldLeaseStartDate,
                OldLeaseEndDate     = h.Snap_OldLeaseEndDate,
                LeaseStartDate      = h.Snap_LeaseStartDate,
                LeaseEndDate        = h.Snap_LeaseEndDate,
                TerminationDate     = h.Snap_TerminationDate,

                // Financial snapshot
                // Both history writers only populate Snap_RentAmount (the current rent column),
                // never the legacy Snap_MonthlyRent — reading Snap_MonthlyRent alone always
                // returned 0 for every row this module writes.
                PreviousMonthlyRent = h.Snap_PreviousMonthlyRent,
                MonthlyRent         = h.Snap_RentAmount ?? h.Snap_MonthlyRent,
                SecurityDeposit     = h.Snap_SecurityDeposit,
                PaymentFrequency    = h.Snap_PaymentFrequency,

                // Status snapshot
                WorkflowStatus      = h.Snap_WorkflowStatus,
                RentStatus          = h.Snap_RentStatus,
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Uploads a document for AssetLeaseRentDetails.
    /// Documents are stored in Core.Document and linked via Core.DocumentBinding.
    /// </summary>
    public async Task<AssetLeaseRentDetailsDocumentUploadResponseDto> UploadDocumentAsync(
        Stream fileStream,
        string originalFileName,
        string mimeType,
        long fileSizeBytes,
        int assetLeaseRentDetailsId,
        int moduleId,
        string? documentType,
        string? documentTitle,
        string? remarks,
        bool isPrimaryDocument,
        string? bindingPurpose,
        int uploadedBy,
        CancellationToken cancellationToken = default)
    {
        // Validate required parameters
        Guard.AgainstInvalidStream(fileStream, nameof(fileStream));
        Guard.AgainstNullOrWhiteSpace(originalFileName, nameof(originalFileName));
        Guard.AgainstNullOrWhiteSpace(mimeType, nameof(mimeType));
        Guard.AgainstNegativeOrZero(fileSizeBytes, nameof(fileSizeBytes));
        Guard.AgainstOutOfRange(fileSizeBytes, 1, _maxFileSizeBytes, nameof(fileSizeBytes));
        Guard.AgainstNegativeOrZero(assetLeaseRentDetailsId, nameof(assetLeaseRentDetailsId));
        Guard.AgainstNegativeOrZero(moduleId, nameof(moduleId));
        Guard.AgainstNegativeOrZero(uploadedBy, nameof(uploadedBy));

        // Validate AssetLeaseRentDetails exists
        var leaseRentDetails = await _repository.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == assetLeaseRentDetailsId && x.IsActive, cancellationToken);

        if (leaseRentDetails == null)
        {
            throw new ArgumentException("LeaseRent_Asset_NotFound", nameof(assetLeaseRentDetailsId));
        }

        // Defense in depth: the controller already checks this before opening the upload stream,
        // but this guard protects the write path itself for any other caller of this service.
        if (!await CanUserAccessLeaseAsync(assetLeaseRentDetailsId, uploadedBy, cancellationToken))
        {
            throw new UnauthorizedAccessException("User is not authorized to upload documents for this lease.");
        }

        // Validate module exists
        var module = await _moduleRepository.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == moduleId && x.IsActive, cancellationToken);

        if (module == null || string.IsNullOrWhiteSpace(module.ModuleCode))
        {
            throw new ArgumentException($"Module with id {moduleId} was not found.", nameof(moduleId));
        }

        _logger.LogInformation(
            "Starting document upload for AssetLeaseRentDetails: {FileName}, LeaseRentDetailsId: {LeaseRentDetailsId}, ModuleId: {ModuleId}, User: {UserId}",
            originalFileName,
            assetLeaseRentDetailsId,
            moduleId,
            uploadedBy);

        var fileExtension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var tempFilePath = Path.GetTempFileName();
        string? storagePath = null;
        var transactionStarted = false;
        var committed = false;

        try
        {
            // Save file to temp location and calculate checksum
            await using var tempFileStream = new FileStream(
                tempFilePath,
                FileMode.Create,
                FileAccess.ReadWrite,
                FileShare.None,
                _bufferSizeBytes,
                FileOptions.Asynchronous | FileOptions.SequentialScan);

            using var sha256 = SHA256.Create();
            var buffer = new byte[_bufferSizeBytes];
            int bytesRead;
            long actualFileSizeBytes = 0;

            // The caller-reported fileSizeBytes is only used for the cheap upfront Guard check
            // above; a mismatched or spoofed value could otherwise let a stream larger than
            // FileStorage:MaxFileSizeBytes get written to disk. Count real bytes as they're
            // streamed and abort before writing more than the configured limit.
            while ((bytesRead = await fileStream.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)) > 0)
            {
                actualFileSizeBytes += bytesRead;
                if (actualFileSizeBytes > _maxFileSizeBytes)
                {
                    throw new ArgumentException(
                        $"File exceeds the maximum allowed size of {_maxFileSizeBytes} bytes.", nameof(fileSizeBytes));
                }

                await tempFileStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
            }

            sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
            var checksumSha256 = Convert.ToHexString(sha256.Hash!).ToLowerInvariant();

            // Move file to permanent storage
            tempFileStream.Position = 0;
            storagePath = await _fileStorageService.SaveFileAsync(tempFileStream, originalFileName, cancellationToken);

            // Begin transaction for database operations
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            transactionStarted = true;

            // Build document title if not provided
            var finalDocumentTitle = !string.IsNullOrWhiteSpace(documentTitle)
                ? documentTitle.Trim()
                : "AssetLeaseRentDetails Document";

            // Create CORE.Document record
            var (documentId, documentGuid) = await _documentService.CreateDocumentAsync(
                uploadedBy,
                null, // ownerUserId
                Path.GetFileName(storagePath),
                originalFileName,
                fileExtension,
                mimeType,
                actualFileSizeBytes,
                storagePath,
                null, // thumbnailPath
                checksumSha256,
                string.IsNullOrWhiteSpace(documentType) ? DocumentType.Proof.ToTypeString() : documentType,
                cancellationToken);

            // IDocumentService.CreateDocumentAsync has no title parameter, so persist the caller's
            // title directly onto the CORE.Document row it just created (same DbContext/UnitOfWork,
            // still inside this method's transaction) — otherwise the title callers supply is
            // silently discarded and GetDocumentsByAssetLeaseRentDetailsIdAsync can never return it.
            var createdDocument = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
            if (createdDocument != null)
            {
                createdDocument.DocumentTitle = finalDocumentTitle;
                await _documentRepository.UpdateAsync(createdDocument, cancellationToken);
            }

            // Create CORE.DocumentBinding to link Document to AssetLeaseRentDetails
            // ReferenceTableName = "AssetLeaseRentDetails", ReferenceTableId = assetLeaseRentDetailsId
            var documentBindingId = await _documentService.CreateDocumentBindingAsync(
                documentId: documentId,
                departmentId: module.DepartmentId,
                moduleId: moduleId,
                referenceTableName: "AssetLeaseRentDetails",
                referenceTableId: assetLeaseRentDetailsId,
                referenceTableIdGuid: null,
                referencePropertyName: "Id",
                bindingPurpose: string.IsNullOrWhiteSpace(bindingPurpose)
                    ? DocumentBindingPurpose.SupportingDocument.ToPurposeString()
                    : bindingPurpose.Trim(),
                isPrimaryDocument: isPrimaryDocument,
                authDepartmentId: module.DepartmentId,
                authReferenceId: leaseRentDetails.AssetId, // link to Asset
                createdBy: uploadedBy,
                cancellationToken: cancellationToken);

            // IDocumentService.CreateDocumentBindingAsync has no notes/remarks parameter, so
            // persist the caller's remarks directly onto the binding it just created — same
            // reasoning as the DocumentTitle write-back above.
            if (!string.IsNullOrWhiteSpace(remarks))
            {
                var createdBinding = await _documentBindingRepository.GetByIdAsync(documentBindingId, cancellationToken);
                if (createdBinding != null)
                {
                    createdBinding.Notes = remarks.Trim();
                    await _documentBindingRepository.UpdateAsync(createdBinding, cancellationToken);
                }
            }

            // CORE.Document + CORE.DocumentBinding (created above) are the actual source of truth
            // for this flow — GetDocumentsByAssetLeaseRentDetailsIdAsync and GetDocumentFileAsync
            // both read through the binding, not AMS.AssetDocument. AMS.AssetDocument requires a
            // real DocumentDefinitionId FK that this ad-hoc upload path has no legitimate value for
            // (no lease-rent-specific definition exists), so it's intentionally not written here
            // rather than guessing at a definition ID that may not exist in every deployment.
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            committed = true;

            _logger.LogInformation(
                "Successfully uploaded document for AssetLeaseRentDetails. DocumentGuid: {DocumentGuid}, LeaseRentDetailsId: {LeaseRentDetailsId}",
                documentGuid,
                assetLeaseRentDetailsId);

            return new AssetLeaseRentDetailsDocumentUploadResponseDto
            {
                DocumentGuid = documentGuid,
                DocumentId = documentId,
                DocumentBindingId = documentBindingId,
                FileName = originalFileName,
                FileSizeBytes = actualFileSizeBytes,
                StoragePath = storagePath
            };
        }
        finally
        {
            // Cleanup on failure
            if (transactionStarted && !committed)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            }

            if (!committed && !string.IsNullOrWhiteSpace(storagePath))
            {
                await _fileStorageService.DeleteFileAsync(storagePath, cancellationToken);
            }

            if (File.Exists(tempFilePath))
            {
                File.Delete(tempFilePath);
            }
        }
    }

    /// <summary>
    /// Department-scoped access check for a lease's sensitive data — documents (filenames,
    /// uploaders, sizes) and tenant history (Aadhaar/PAN/address/financials): same rules as
    /// <see cref="CanUserAccessAssetAsync"/>, applied to the lease's Asset. A non-existent lease is
    /// treated as accessible here (nothing to disclose); the callers naturally return 404 or an
    /// empty list for a non-existent id.
    /// </summary>
    public async Task<bool> CanUserAccessLeaseAsync(
        int assetLeaseRentDetailsId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var assetId = await _repository.GetQueryable().AsNoTracking()
            .Where(x => x.Id == assetLeaseRentDetailsId)
            .Select(x => (int?)x.AssetId)
            .FirstOrDefaultAsync(cancellationToken);

        // No lease to check against — the callers that use this (documents/history) naturally
        // return an empty list for a non-existent id, so there's nothing left to protect here.
        if (assetId == null)
            return true;

        return await CanUserAccessAssetAsync(assetId.Value, userId, cancellationToken);
    }

    /// <summary>
    /// Department-scoped access check for an asset directly — used wherever a caller can name an
    /// AssetId themselves (Create's target asset, Update/SendForVerification's mutable AssetId),
    /// not just an existing lease's current asset. The caller must have an active
    /// UserRoleAllocation row for the asset's department. Fails closed: an asset with no
    /// DepartmentId has no owner to authorize against, so it is NOT open to every authenticated
    /// user — the only exception is the explicit cross-department one, an active "Admin" role
    /// allocation (IUserAccessRepository.IsAdminAsync, the same definition login uses).
    /// A non-existent asset is treated as accessible here — ValidateForCreateAsync is what
    /// actually rejects a nonexistent/inactive AssetId with a proper 400, so this check doesn't
    /// need to duplicate that as a 403 first.
    /// </summary>
    public async Task<bool> CanUserAccessAssetAsync(
        int assetId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var asset = await _assetRepository.GetQueryable().AsNoTracking()
            .Where(a => a.Id == assetId)
            .Select(a => new { a.DepartmentId })
            .FirstOrDefaultAsync(cancellationToken);

        if (asset == null)
            return true;

        if (asset.DepartmentId != null &&
            await _userRoleAllocationRepository.GetQueryable().AsNoTracking()
                .AnyAsync(x => x.UserId == userId && x.DepartmentId == asset.DepartmentId.Value && x.IsActive, cancellationToken))
            return true;

        return await _userAccessRepository.IsAdminAsync(userId, cancellationToken);
    }

    /// <summary>
    /// Gets all documents for a specific AssetLeaseRentDetails record.
    /// </summary>
    public async Task<List<AssetLeaseRentDetailsDocumentDto>> GetDocumentsByAssetLeaseRentDetailsIdAsync(
        int assetLeaseRentDetailsId,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(assetLeaseRentDetailsId, nameof(assetLeaseRentDetailsId));

        var documents = await (
            from binding in _documentBindingRepository.GetQueryable().AsNoTracking()
            join doc in _documentRepository.GetQueryable().AsNoTracking()
                on binding.DocumentId equals doc.Id
            where binding.ReferenceTableName == "AssetLeaseRentDetails"
                && binding.ReferenceTableId == assetLeaseRentDetailsId
                && binding.IsActive
                && !binding.MarkedForDeletion
                && doc.IsActive
                && !doc.MarkedForDeletion
            orderby binding.IsPrimaryDocument descending, doc.CreatedDate descending
            select new AssetLeaseRentDetailsDocumentDto
            {
                DocumentId = doc.Id,
                DocumentGuid = doc.DocumentGuid,
                DocumentBindingId = binding.Id,
                FileName = doc.FileName ?? string.Empty,
                OriginalFileName = doc.OriginalFileName ?? string.Empty,
                FileExtension = doc.FileExtension ?? string.Empty,
                MimeType = doc.MimeType ?? string.Empty,
                FileSizeBytes = doc.FileSizeBytes,
                DocumentType = doc.DocumentType,
                DocumentTitle = doc.DocumentTitle,
                Remarks = binding.Notes,
                IsPrimaryDocument = binding.IsPrimaryDocument,
                BindingPurpose = binding.BindingPurpose,
                UploadedBy = doc.UploadedByUserId,
                CreatedDate = doc.CreatedDate ?? DateTime.MinValue,
                DownloadCount = doc.DownloadCount
            })
            .ToListAsync(cancellationToken);

        return documents;
    }

    /// <summary>
    /// Gets a document file stream for download.
    /// </summary>
    public async Task<(Stream? FileStream, string FileName, string MimeType)> GetDocumentFileAsync(
        int assetLeaseRentDetailsId,
        Guid documentGuid,
        int userId,
        CancellationToken cancellationToken = default)
    {
        // Require the document to actually be bound to the caller-supplied lease record — closes
        // the IDOR gap where any authenticated user who merely obtains a document GUID (documents
        // aren't otherwise access-scoped per user in this module) could download an unrelated
        // lease's document.
        var document = await (
            from binding in _documentBindingRepository.GetQueryable().AsNoTracking()
            join doc in _documentRepository.GetQueryable().AsNoTracking()
                on binding.DocumentId equals doc.Id
            where binding.ReferenceTableName == "AssetLeaseRentDetails"
                && binding.ReferenceTableId == assetLeaseRentDetailsId
                && binding.IsActive
                && !binding.MarkedForDeletion
                && doc.DocumentGuid == documentGuid
                && doc.IsActive
                && !doc.MarkedForDeletion
            select new
            {
                doc.StoragePath,
                doc.FileName,
                doc.OriginalFileName,
                doc.MimeType
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (document == null || string.IsNullOrWhiteSpace(document.StoragePath))
        {
            return (null, string.Empty, string.Empty);
        }

        var fileStream = await _fileStorageService.ReadFileAsync(document.StoragePath, cancellationToken);
        if (fileStream == null)
        {
            return (null, string.Empty, string.Empty);
        }

        var downloadName = !string.IsNullOrWhiteSpace(document.OriginalFileName)
            ? document.OriginalFileName
            : !string.IsNullOrWhiteSpace(document.FileName)
            ? document.FileName
            : "document";

        await _documentService.IncrementDownloadCountAsync(documentGuid, userId, cancellationToken);

        return (fileStream, downloadName, document.MimeType ?? "application/octet-stream");
    }
}
