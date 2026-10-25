using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Common;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.DTOs.PropertyCertificate;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Events;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Enums;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Application service for PropertyCertificate operations.
/// Delegates all file handling to DocumentApplicationService.
/// </summary>
public class PropertyCertificateApplicationService : IPropertyCertificateApplicationService
{
    private readonly IPropertyCertificateService _propertyCertificateService;
    private readonly IDocumentApplicationService _documentApplicationService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IModuleLookupService _moduleLookupService;
    private readonly IRepository<PropertyCertificateTypeMasterEntity, int> _certificateTypeRepository;
    private readonly IRepository<PropertyDetailsEntity, int> _propertyDetailsRepository;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<SocietyDetailsEntity, int> _societyRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsMastRepository;
    private readonly IRepository<WingEntity, int> _wingRepository;
    private readonly IPublisher _publisher;
    private readonly ILogger<PropertyCertificateApplicationService> _logger;
    private readonly IRetrospectiveTaxRefresher _retrospectiveTaxRefresher;
    private readonly ITaxRecalculationBackgroundService? _taxRecalculationBackgroundService;
    private readonly IRepository<PropertyCertificateEntity>? _propertyCertificateRepository;
    private readonly IRepository<DocumentBindingEntity>? _documentBindingRepository;
    private readonly IRepository<DocumentEntity>? _documentRepository;
    private readonly IServiceProvider? _serviceProvider;
    private readonly IDocumentService? _documentService;

    public PropertyCertificateApplicationService(
        IPropertyCertificateService propertyCertificateService,
        IDocumentApplicationService documentApplicationService,
        IUnitOfWork unitOfWork,
        IModuleLookupService moduleLookupService,
        IRepository<PropertyCertificateTypeMasterEntity, int> certificateTypeRepository,
        IRepository<PropertyDetailsEntity, int> propertyDetailsRepository,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<SocietyDetailsEntity, int> societyRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsMastRepository,
        IRepository<WingEntity, int> wingRepository,
        IPublisher publisher,
        ILogger<PropertyCertificateApplicationService> logger,
        IRetrospectiveTaxRefresher retrospectiveTaxRefresher,
        ITaxRecalculationBackgroundService? taxRecalculationBackgroundService = null,
        IRepository<PropertyCertificateEntity>? propertyCertificateRepository = null,
        IRepository<DocumentBindingEntity>? documentBindingRepository = null,
        IRepository<DocumentEntity>? documentRepository = null,
        IServiceProvider? serviceProvider = null,
        IDocumentService? documentService = null)
    {
        _propertyCertificateService = propertyCertificateService;
        _documentApplicationService = documentApplicationService;
        _unitOfWork = unitOfWork;
        _moduleLookupService = moduleLookupService;
        _certificateTypeRepository = certificateTypeRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _propertyRepository = propertyRepository;
        _societyRepository = societyRepository;
        _wingDetailsMastRepository = wingDetailsMastRepository;
        _wingRepository = wingRepository;
        _publisher = publisher;
        _logger = logger;
        _retrospectiveTaxRefresher = retrospectiveTaxRefresher;
        _taxRecalculationBackgroundService = taxRecalculationBackgroundService;
        _propertyCertificateRepository = propertyCertificateRepository;
        _documentBindingRepository = documentBindingRepository;
        _documentRepository = documentRepository;
        _serviceProvider = serviceProvider;
        _documentService = documentService;
    }

    public async Task<PropertyCertificateUploadResponseDto> UploadWithDocumentAsync(
        Stream fileStream,
        string originalFileName,
        string mimeType,
        long fileSizeBytes,
        int propertyId,
        int certificateTypeId,
        string? certificateNo,
        DateTime? issueDate,
        int uploadedBy,
        CancellationToken cancellationToken = default)
    {
        // Input validation using Guard clauses
        Guard.AgainstInvalidStream(fileStream, nameof(fileStream));
        Guard.AgainstNullOrWhiteSpace(originalFileName, nameof(originalFileName));
        Guard.AgainstExceedingLength(originalFileName, 255, nameof(originalFileName));
        Guard.AgainstNullOrWhiteSpace(mimeType, nameof(mimeType));
        Guard.AgainstNegativeOrZero(fileSizeBytes, nameof(fileSizeBytes));
        Guard.AgainstNegativeOrZero(propertyId, nameof(propertyId));
        Guard.AgainstNegativeOrZero(certificateTypeId, nameof(certificateTypeId));
        Guard.AgainstNegativeOrZero(uploadedBy, nameof(uploadedBy));

        // Optional field validation
        if (!string.IsNullOrWhiteSpace(certificateNo))
        {
            Guard.AgainstExceedingLength(certificateNo, 100, nameof(certificateNo));
        }

        if (issueDate.HasValue)
        {
            Guard.Against(issueDate.Value > DateTime.Now, "Issue date cannot be in the future.", nameof(issueDate));
        }

        _logger.LogInformation("Starting PropertyCertificate upload: {FileName}, PropertyId: {PropertyId}, CertificateTypeId: {CertificateTypeId}, User: {UserId}",
            originalFileName, propertyId, certificateTypeId, uploadedBy);

        // 1. Create PropertyCertificate first (without DocumentBinding)
        var propertyCertificateId = await _propertyCertificateService.CreateAsync(
            propertyId,
            certificateTypeId,
            certificateNo,
            issueDate,
            uploadedBy,
            cancellationToken);
        _logger.LogInformation("PropertyCertificate created: Id={PropertyCertificateId}",
            propertyCertificateId);

        try
        {
            // 2. Get DepartmentId and ModuleId from database
            var (departmentId, moduleId) = await GetDepartmentAndModuleIdsAsync(cancellationToken);

            // 3. Delegate file handling to DocumentApplicationService
            var uploadDto = new DocumentUploadDto
            {
                DepartmentId = departmentId,
                ModuleId = moduleId,
                ReferenceTableName = "PropertyCertificates",
                ReferenceTableId = propertyCertificateId,
                ReferencePropertyName = "Id",
                BindingPurpose = DocumentBindingPurpose.MainDocument.ToPurposeString(),
                IsPrimaryDocument = true,
                AuthDepartmentId = departmentId,
                AuthReferenceId = propertyId,
                DocumentType = DocumentType.Certificate.ToTypeString()
            };

            var docResponse = await _documentApplicationService.UploadDocumentAsync(
                fileStream,
                originalFileName,
                mimeType,
                fileSizeBytes,
                uploadDto,
                uploadedBy,
                cancellationToken);

            // 4. Update PropertyCertificate with DocumentBinding ID
            if (docResponse.DocumentBindingId.HasValue)
            {
                await _propertyCertificateService.UpdateDocumentBindingAsync(
                    propertyCertificateId,
                    docResponse.DocumentBindingId.Value,
                    uploadedBy,
                    cancellationToken);
            }

            _logger.LogInformation("PropertyCertificate upload completed successfully: PropertyCertificateId={PropertyCertificateId}, DocumentGuid={DocumentGuid}",
                propertyCertificateId, docResponse.DocumentGuid);

            return new PropertyCertificateUploadResponseDto
            {
                PropertyCertificateId = propertyCertificateId,
                DocumentGuid = docResponse.DocumentGuid,
                DocumentId = docResponse.DocumentId,
                DocumentBindingId = docResponse.DocumentBindingId ?? 0,
                PropertyId = propertyId,
                CertificateTypeId = certificateTypeId,
                CertificateNo = certificateNo,
                IssueDate = issueDate,
                FileName = originalFileName,
                FileSizeBytes = fileSizeBytes,
                StoragePath = docResponse.StoragePath ?? string.Empty
            };
        }
        catch
        {
            _logger.LogError("PropertyCertificate upload failed for Id={PropertyCertificateId}. Document service will handle cleanup.",
                propertyCertificateId);
            throw;
        }
    }



    // ── Private helpers ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Resolves the WingDetailId and parent SocietyDetailId for a given PropertyId.
    /// </summary>
    private async Task<(int? WingDetailId, int? SocietyDetailId)> ResolvePropertyWingAndSocietyIdsAsync(
        int propertyId,
        CancellationToken cancellationToken = default)
    {
        var properties = await _propertyRepository.GetAsync(
            p => p.Id == propertyId && !p.MarkedForDeletion,
            cancellationToken);
        var targetProperty = properties?.FirstOrDefault();

        int? wingDetailId = targetProperty?.WingDetailId;
        int? societyDetailId = null;

        if (wingDetailId.HasValue && wingDetailId.Value > 0)
        {
            var wings = await _wingDetailsMastRepository.GetAsync(
                w => w.Id == wingDetailId.Value && w.IsActive && !w.MarkedForDeletion,
                cancellationToken);
            societyDetailId = wings?.FirstOrDefault()?.SocietyDetailsMastId;
        }

        if (!societyDetailId.HasValue)
        {
            var societies = await _societyRepository.GetAsync(
                s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion,
                cancellationToken);
            societyDetailId = societies?.FirstOrDefault()?.Id;
        }

        return (wingDetailId, societyDetailId);
    }

    /// <summary>
    /// Gets the DepartmentId and ModuleId from the database dynamically.
    /// Finds the department that contains PropertyMast table and its primary module.
    /// No hardcoding - fully database-driven.
    /// </summary>
    private async Task<(int DepartmentId, int ModuleId)> GetDepartmentAndModuleIdsAsync(
        CancellationToken cancellationToken = default)
    {
        // Delegate to IModuleLookupService for table-driven module/department resolution
        return await _moduleLookupService.GetDepartmentAndModuleAsync("PTIS", "PROPERTY", cancellationToken);
    }

    public async Task<List<PropertyCertificateWithStatusDto>> GetCertificateTypesWithStatusAsync(
        int propertyId,
        CancellationToken cancellationToken = default,
        int? propertyDetailsId = null)
    {
        Guard.AgainstNegativeOrZero(propertyId, nameof(propertyId));

        // Get all active certificate types
        var allTypes = await _certificateTypeRepository.GetAsync(
            ct => ct.IsActive,
            cancellationToken);

        // Get existing certificates for this property (including inactive ones so status is accurate)
        var existingCertificates = await _propertyCertificateService.GetByPropertyIdIncludingInactiveAsync(
            propertyId,
            PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
            cancellationToken);

        // Scope to the requested certificate scope: floor (propertyDetailsId set) or
        // property-wise (propertyDetailsId null -> PropertyDetailsId IS NULL rows only).
        // A property can have multiple rows for the SAME certificate type (one per floor plus
        // one property-wise), so the lookup key must include PropertyDetailsId, not just the type.
        // EntityType is always "P" for both -- per CK_PropertyCertificates_EntityScope, 'F' is not
        // a valid EntityType; PropertyDetailsId NULL vs NOT NULL is what distinguishes them.
        // This also excludes Society/Wing-scoped rows (EntityType "S"/"W"): those are stored under a
        // representative unit's PropertyId with PropertyDetailsId == null too, so without this
        // check a unit that happens to be that representative would have its building's
        // Society/Wing certificate misreported as its own property-wise certificate.
        var scopedCertificates = existingCertificates
            .Where(c => c.PropertyDetailsId == propertyDetailsId && c.EntityType == "P")
            .ToList();

        var certificateLookup = scopedCertificates
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        // Resolve wing and society details for fallback inheritance (property/unit scope only)
        Dictionary<int, PropertyCertificateEntity> wingCertLookup = new();
        Dictionary<int, PropertyCertificateEntity> societyCertLookup = new();
        int? wingDetailId = null;
        int? societyDetailId = null;

        if (!propertyDetailsId.HasValue)
        {
            (wingDetailId, societyDetailId) = await ResolvePropertyWingAndSocietyIdsAsync(propertyId, cancellationToken);

            // Fetch wing-wise certificates if wing exists
            if (wingDetailId.HasValue && wingDetailId.Value > 0)
            {
                var wingCerts = await _propertyCertificateService.GetByWingDetailIdAsync(
                    wingDetailId.Value,
                    PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
                    cancellationToken);

                if (wingCerts != null)
                {
                    wingCertLookup = wingCerts
                        .Where(c => c.IsActive && !c.MarkedForDeletion)
                        .GroupBy(c => c.CertificateTypeId)
                        .ToDictionary(g => g.Key, g => g.First());
                }
            }

            // Fetch society-wise certificates if society exists
            if (societyDetailId.HasValue && societyDetailId.Value > 0)
            {
                var societyCerts = await _propertyCertificateService.GetBySocietyDetailIdAsync(
                    societyDetailId.Value,
                    PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
                    cancellationToken);

                if (societyCerts != null)
                {
                    societyCertLookup = societyCerts
                        .Where(c => c.IsActive && !c.MarkedForDeletion)
                        .GroupBy(c => c.CertificateTypeId)
                        .ToDictionary(g => g.Key, g => g.First());
                }
            }
        }

        // Build result combining all types with their status
        var result = allTypes.OrderBy(t => t.DisplayOrder).Select(type =>
        {
            var hasDirectCertificate = certificateLookup.TryGetValue(type.Id, out var directCertificate) && directCertificate != null;
            var isInherited = false;
            PropertyCertificateEntity? effectiveCert = null;

            if (hasDirectCertificate)
            {
                effectiveCert = directCertificate;
                isInherited = false;
            }
            else if (wingCertLookup.TryGetValue(type.Id, out var wingCert) && wingCert != null)
            {
                effectiveCert = wingCert;
                isInherited = true;
            }
            else if (societyCertLookup.TryGetValue(type.Id, out var societyCert) && societyCert != null)
            {
                effectiveCert = societyCert;
                isInherited = true;
            }

            var hasCertificate = effectiveCert != null;

            return new PropertyCertificateWithStatusDto
            {
                CertificateTypeId = type.Id,
                CertificateTypeName = type.CertificateTypeName,
                CertificateTypeCode = type.CertificateTypeCode,
                IsProtected = type.IsProtected,
                IsRequired = type.IsRequired,
                DisplayOrder = type.DisplayOrder,
                HasCertificate = hasCertificate,
                PropertyCertificateId = hasCertificate && effectiveCert != null ? effectiveCert.Id : null,
                IsActive = hasCertificate && effectiveCert != null && effectiveCert.IsActive,
                CertificateNo = hasCertificate && effectiveCert != null ? effectiveCert.CertificateNo : null,
                IssueDate = hasCertificate && effectiveCert != null ? effectiveCert.IssueDate : null,
                DocumentGuid = hasCertificate && effectiveCert != null ? NtisPlatform.Application.Common.DocumentBindingHelper.GetSafeDocumentGuid(effectiveCert.DocumentBinding) : null,
                FileName = hasCertificate && effectiveCert != null ? NtisPlatform.Application.Common.DocumentBindingHelper.GetSafeFileName(effectiveCert.DocumentBinding) : null,
                // Always the requested scope, not just the existing certificate's own value:
                // scopedCertificates is already filtered to c.PropertyDetailsId == propertyDetailsId
                // (line 207), so the two are identical whenever hasCertificate is true; using the
                // requested scope directly also correctly reports which floor/property scope this
                // row represents when hasCertificate is false (no certificate to read a value from
                // yet), which the frontend needs to know where to attach a new certificate.
                PropertyDetailsId = propertyDetailsId,
                EntityType = hasCertificate && effectiveCert != null ? effectiveCert.EntityType : null,
                SocietyDetailId = hasCertificate && effectiveCert != null ? (effectiveCert.SocietyDetailId ?? societyDetailId) : null,
                WingDetailId = hasCertificate && effectiveCert != null ? (effectiveCert.WingDetailId ?? (isInherited && effectiveCert.EntityType == "W" ? wingDetailId : null)) : null,
                IsInherited = isInherited
            };
        }).ToList();

        return result;
    }

    public async Task<List<PropertyCertificateWithStatusDto>> GetSocietyOrWingCertificateTypesWithStatusAsync(
        int? societyDetailId,
        int? wingDetailId,
        CancellationToken cancellationToken = default)
    {
        if (!societyDetailId.HasValue && !wingDetailId.HasValue)
            throw new ArgumentException("Either societyDetailId or wingDetailId must be provided.");

        var isWing = wingDetailId.HasValue;
        var targetEntityType = isWing ? "W" : "S";

        // 1. Fetch all active master certificate types
        var allTypes = (await _certificateTypeRepository.GetAsync(
            t => t.IsActive,
            cancellationToken))
            .OrderBy(t => t.DisplayOrder)
            .ToList();

        // 2. Resolve repositories
        using var scope = _serviceProvider?.CreateScope();
        var sp = scope?.ServiceProvider;

        var certRepo = _propertyCertificateRepository ?? sp?.GetService<IRepository<PropertyCertificateEntity>>();
        var docBindingRepo = _documentBindingRepository ?? sp?.GetService<IRepository<DocumentBindingEntity>>();
        var docRepo = _documentRepository ?? sp?.GetService<IRepository<DocumentEntity>>();

        Dictionary<int, PropertyCertificateEntity> certLookup = new();
        Dictionary<int, DocumentBindingEntity> docBindings = new();
        Dictionary<int, DocumentEntity> docs = new();

        if (certRepo != null)
        {
            var certs = isWing
                ? await certRepo.GetAsync(c => c.EntityType == targetEntityType && c.WingDetailId == wingDetailId.Value && !c.MarkedForDeletion, cancellationToken)
                : await certRepo.GetAsync(c => c.EntityType == targetEntityType && c.SocietyDetailId == societyDetailId.Value && !c.MarkedForDeletion, cancellationToken);

            certLookup = certs
                .GroupBy(c => c.CertificateTypeId)
                .ToDictionary(g => g.Key, g => g.First());

            var bindingIds = certs.Where(c => c.DocumentBindingId.HasValue).Select(c => c.DocumentBindingId!.Value).Distinct().ToList();

            if (bindingIds.Any() && docBindingRepo != null)
            {
                var bindings = await docBindingRepo.GetAsync(b => bindingIds.Contains(b.Id), cancellationToken);
                docBindings = bindings.ToDictionary(b => b.Id);

                var docIds = bindings.Select(b => b.DocumentId).Distinct().ToList();
                if (docIds.Any() && docRepo != null)
                {
                    var docList = await docRepo.GetAsync(d => docIds.Contains(d.Id), cancellationToken);
                    docs = docList.ToDictionary(d => d.Id);
                }
            }
        }

        // 3. Build response combining all types with their status
        return allTypes.Select(type =>
        {
            var hasCert = certLookup.TryGetValue(type.Id, out var cert);
            DocumentBindingEntity? binding = null;
            DocumentEntity? doc = null;

            if (hasCert && cert?.DocumentBindingId.HasValue == true && docBindings.TryGetValue(cert.DocumentBindingId.Value, out binding))
            {
                docs.TryGetValue(binding.DocumentId, out doc);
            }

            return new PropertyCertificateWithStatusDto
            {
                CertificateTypeId = type.Id,
                CertificateTypeName = type.CertificateTypeName,
                CertificateTypeCode = type.CertificateTypeCode,
                IsProtected = type.IsProtected,
                IsRequired = type.IsRequired,
                DisplayOrder = type.DisplayOrder,
                HasCertificate = hasCert,
                PropertyCertificateId = hasCert && cert != null ? cert.Id : null,
                IsActive = hasCert && cert != null && cert.IsActive,
                CertificateNo = hasCert && cert != null ? cert.CertificateNo : null,
                IssueDate = hasCert && cert != null ? cert.IssueDate : null,
                DocumentGuid = doc?.DocumentGuid,
                FileName = doc?.FileName,
                PropertyDetailsId = null,
                EntityType = targetEntityType,
                SocietyDetailId = societyDetailId,
                WingDetailId = wingDetailId
            };
        }).ToList();
    }

    public async Task<PropertyCertificateUploadResponseDto> ReplaceDocumentAsync(
        int propertyCertificateId,
        Stream fileStream,
        string originalFileName,
        string mimeType,
        long fileSizeBytes,
        int uploadedBy,
        CancellationToken cancellationToken = default)
    {
        // Input validation
        Guard.AgainstNegativeOrZero(propertyCertificateId, nameof(propertyCertificateId));
        Guard.AgainstInvalidStream(fileStream, nameof(fileStream));
        Guard.AgainstNullOrWhiteSpace(originalFileName, nameof(originalFileName));
        Guard.AgainstNullOrWhiteSpace(mimeType, nameof(mimeType));
        Guard.AgainstNegativeOrZero(fileSizeBytes, nameof(fileSizeBytes));
        Guard.AgainstNegativeOrZero(uploadedBy, nameof(uploadedBy));

        _logger.LogInformation("Replacing document for PropertyCertificateId={Id}, NewFile={FileName}",
            propertyCertificateId, originalFileName);

        // Get existing certificate
        var certificate = await _propertyCertificateService.GetByIdAsync(
            propertyCertificateId,
            PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
            cancellationToken);

        if (certificate == null)
        {
            throw new InvalidOperationException($"PropertyCertificate with ID {propertyCertificateId} not found.");
        }

        var oldDocumentGuid = certificate.DocumentBinding?.Document?.DocumentGuid;

        try
        {
            // 1. Get DepartmentId and ModuleId from database
            var (departmentId, moduleId) = await GetDepartmentAndModuleIdsAsync(cancellationToken);

            // 2. Upload new file via DocumentApplicationService
            var uploadDto = new DocumentUploadDto
            {
                DepartmentId = departmentId,
                ModuleId = moduleId,
                ReferenceTableName = "PropertyCertificates",
                ReferenceTableId = propertyCertificateId,
                ReferencePropertyName = "Id",
                BindingPurpose = DocumentBindingPurpose.MainDocument.ToPurposeString(),
                IsPrimaryDocument = true,
                AuthDepartmentId = departmentId,
                AuthReferenceId = certificate.PropertyId ?? 0,
                DocumentType = DocumentType.Certificate.ToTypeString()
            };

            var docResponse = await _documentApplicationService.UploadDocumentAsync(
                fileStream,
                originalFileName,
                mimeType,
                fileSizeBytes,
                uploadDto,
                uploadedBy,
                cancellationToken);

            // 3. Update certificate with new binding
            if (docResponse.DocumentBindingId.HasValue)
            {
                await _propertyCertificateService.UpdateDocumentBindingAsync(
                    propertyCertificateId,
                    docResponse.DocumentBindingId.Value,
                    uploadedBy,
                    cancellationToken);
            }

            // 4. Soft-delete the old document (DocumentApplicationService handles file cleanup via DeleteDocumentAsync)
            if (oldDocumentGuid.HasValue)
            {
                await _documentApplicationService.DeleteDocumentAsync(oldDocumentGuid.Value, uploadedBy, cancellationToken);
            }

            _logger.LogInformation("PropertyCertificate document replaced: PropertyCertificateId={PropertyCertificateId}, OldDocumentGuid={OldDocumentGuid}, NewDocumentGuid={NewDocumentGuid}",
                propertyCertificateId, oldDocumentGuid, docResponse.DocumentGuid);

            return new PropertyCertificateUploadResponseDto
            {
                PropertyCertificateId = propertyCertificateId,
                DocumentGuid = docResponse.DocumentGuid,
                DocumentId = docResponse.DocumentId,
                DocumentBindingId = docResponse.DocumentBindingId ?? 0,
                PropertyId = certificate.PropertyId ?? 0,
                CertificateTypeId = certificate.CertificateTypeId,
                CertificateNo = certificate.CertificateNo,
                IssueDate = certificate.IssueDate,
                FileName = originalFileName,
                FileSizeBytes = fileSizeBytes,
                StoragePath = docResponse.StoragePath ?? string.Empty,
                PropertyDetailsId = certificate.PropertyDetailsId
            };
        }
        catch
        {
            _logger.LogError("PropertyCertificate document replacement failed for Id={PropertyCertificateId}. Document service will handle cleanup.",
                propertyCertificateId);
            throw;
        }
    }

    public async Task<PropertyCertificateBulkSaveResponseDto> BulkSaveAllAsync(
        PropertyCertificateBulkSaveDto bulkDto,
        int userId,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(bulkDto.PropertyId, nameof(bulkDto.PropertyId));
        Guard.AgainstNegativeOrZero(userId, nameof(userId));

        _logger.LogInformation("Bulk saving {Count} certificates for PropertyId={PropertyId}, User={UserId}",
            bulkDto.Certificates.Count, bulkDto.PropertyId, userId);

        var response = new PropertyCertificateBulkSaveResponseDto
        {
            PropertyId = bulkDto.PropertyId,
            TotalProcessed = bulkDto.Certificates.Count
        };

        // Get existing certificates for this property (including inactive ones)
        // We need all certificates regardless of IsActive status to properly handle re-enabling.
        // Key on (CertificateTypeId, PropertyDetailsId): the same certificate type can have one
        // property-wise row (PropertyDetailsId NULL) plus one row per floor.
        var existingCertificates = await _propertyCertificateService.GetByPropertyIdIncludingInactiveAsync(
            bulkDto.PropertyId,
            PropertyCertificateIncludeOptions.None,
            cancellationToken);

        var existingLookup = existingCertificates
            .GroupBy(c => (c.CertificateTypeId, c.PropertyDetailsId))
            .ToDictionary(g => g.Key, g => g.First());

        // Looked up once so IsTaxable/CertificateTypeCode can be checked per certDto without a
        // query per row -- IsTaxable decides whether the ONE end-of-batch recalculation (see
        // recalculationNeeded) is warranted, exactly the same condition PropertyCertificateService.
        // ShouldRecalculateAsync checks per-row for the single-certificate save paths.
        // CertificateTypeCode feeds ValidateCcOcDateOrderAsync below.
        var certTypes = await _certificateTypeRepository.GetAsync(_ => true, cancellationToken);
        var isTaxableByTypeId = certTypes.ToDictionary(t => t.Id, t => t.IsTaxable);
        var typeCodeByTypeId = certTypes.ToDictionary(t => t.Id, t => t.CertificateTypeCode);

        // Reject the whole batch up front if it would leave an active OC dated earlier than an
        // active CC -- cheaper and safer than letting the tax engine silently resolve an invalid
        // CC/OC date order after the fact for data that should never have been savable in the
        // first place.
        ValidateCcOcDateOrder(bulkDto, typeCodeByTypeId, existingCertificates);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            // GO-LIVE BLOCKER fix: selecting multiple floors in one bulk save previously let EACH
            // certificate row publish its own PropertyCertificateChangedEvent inline (via
            // CreateAsync/UpdateAsync/ToggleEnabledAsync), so the tax engine ran once per floor
            // within the SAME request -- e.g. 3 floors meant 3 separate recalculation passes, each
            // re-querying and re-upserting the same property-aggregated PolicyTaxDetails/TransMast
            // rows for the SAME (PropertyId, PolicyCodeId/FinanceYearId, TaxId) slots, sometimes
            // colliding on PTIS.PolicyTaxDetails' and PTIS.TransMast's unique keys. Final
            // persistence is always property-wise, so there is no reason to recompute it mid-batch:
            // every CreateAsync/UpdateAsync/ToggleEnabledAsync call below suppresses its own
            // publish, and exactly ONE PropertyCertificateChangedEvent is published after every
            // certificate in this batch has been saved, reflecting the FINAL state of all selected
            // floors at once.
            var saveRecalculationNeeded = false;
            var deleteRecalculationNeeded = false;

            foreach (var certDto in bulkDto.Certificates)
            {
                try
                {
                    var lookupKey = (certDto.CertificateTypeId, certDto.PropertyDetailsId);
                    var exists = existingLookup.TryGetValue(lookupKey, out var existingCert);
                    var isTaxableType = isTaxableByTypeId.GetValueOrDefault(certDto.CertificateTypeId);

                    if (certDto.IsEnabled)
                    {
                        // User wants this certificate enabled
                        if (!exists)
                        {
                            // Create new certificate. PropertyCertificateEntity.Create already sets
                            // IsActive = true, so it's already enabled -- do NOT also call
                            // ToggleEnabledAsync here (it would be a same-state no-op that still
                            // counts as a second save-shaped change for no reason). This mirrors the
                            // "update existing" branch below, which only calls ToggleEnabledAsync
                            // when the enabled state is actually changing.
                            var newCertId = await _propertyCertificateService.CreateAsync(
                                bulkDto.PropertyId,
                                certDto.CertificateTypeId,
                                certDto.CertificateNumber,
                                certDto.CertificateDate,
                                userId,
                                cancellationToken,
                                certDto.PropertyDetailsId,
                                suppressRecalculation: true,
                                entityType: certDto.EntityType ?? "P",
                                societyDetailId: certDto.SocietyDetailId,
                                wingDetailId: certDto.WingDetailId);

                            response.EnabledCount++;
                            if (isTaxableType)
                            {
                                saveRecalculationNeeded = true;
                            }
                            _logger.LogDebug("Created new certificate (already enabled): TypeId={TypeId}, CertId={CertId}",
                                certDto.CertificateTypeId, newCertId);
                        }
                        else
                        {
                            // Update existing certificate (always call UpdateAsync to allow clearing values)
                            await _propertyCertificateService.UpdateAsync(
                                existingCert!.Id,
                                certDto.CertificateNumber,
                                certDto.CertificateDate,
                                userId,
                                cancellationToken,
                                suppressRecalculation: true);

                            // Enable if not already enabled
                            if (!existingCert!.IsActive)
                            {
                                await _propertyCertificateService.ToggleEnabledAsync(
                                    existingCert.Id,
                                    true,
                                    userId,
                                    cancellationToken,
                                    suppressRecalculation: true);
                            }

                            response.EnabledCount++;
                            if (isTaxableType)
                            {
                                saveRecalculationNeeded = true;
                            }
                            _logger.LogDebug("Updated and enabled existing certificate: CertId={CertId}",
                                existingCert.Id);
                        }
                    }
                    else
                    {
                        // User wants this certificate disabled
                        if (exists && existingCert != null && existingCert.IsActive)
                        {
                            // Disable existing certificate
                            await _propertyCertificateService.ToggleEnabledAsync(
                                existingCert.Id,
                                false,
                                userId,
                                cancellationToken,
                                suppressRecalculation: true);

                            response.DisabledCount++;
                            if (isTaxableType)
                            {
                                deleteRecalculationNeeded = true;
                            }
                            _logger.LogDebug("Disabled certificate: CertId={CertId}", existingCert.Id);
                        }
                        else
                        {
                            response.DisabledCount++;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to process certificate: TypeId={TypeId}",
                        certDto.CertificateTypeId);
                    response.Errors.Add($"Certificate Type {certDto.CertificateTypeId}: {ex.Message}");
                }
            }

            // Exactly one recalculation for the whole batch -- a save-shaped change
            // (enable/create/update) or a delete-shaped change (disable) either one is enough to
            // run the pipeline once, since it recomputes from the FINAL DB state of every
            // certificate regardless of which specific row changed.
            if (saveRecalculationNeeded || deleteRecalculationNeeded)
            {
                await _publisher.Publish(
                    new PropertyCertificateChangedEvent(bulkDto.PropertyId, userId), cancellationToken);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            // Get updated status for all certificates
            response.UpdatedCertificates = await GetCertificateTypesWithStatusAsync(
                bulkDto.PropertyId,
                cancellationToken);

            _logger.LogInformation("Bulk save completed: Enabled={Enabled}, Disabled={Disabled}, Errors={ErrorCount}",
                response.EnabledCount, response.DisabledCount, response.Errors.Count);

            return response;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task DeleteDocumentAsync(
        int propertyCertificateId,
        int deletedBy,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(propertyCertificateId, nameof(propertyCertificateId));
        Guard.AgainstNegativeOrZero(deletedBy, nameof(deletedBy));

        _logger.LogInformation("Deleting document for PropertyCertificateId={Id}, User={UserId}",
            propertyCertificateId, deletedBy);

        var certificate = await _propertyCertificateService.GetByIdAsync(
            propertyCertificateId,
            PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document | PropertyCertificateIncludeOptions.CertificateType,
            cancellationToken);

        if (certificate == null)
        {
            throw new InvalidOperationException($"PropertyCertificate with ID {propertyCertificateId} not found.");
        }

        if (certificate.DocumentBinding == null)
        {
            throw new InvalidOperationException($"PropertyCertificate with ID {propertyCertificateId} does not have an associated document.");
        }

        var documentGuid = certificate.DocumentBinding.Document?.DocumentGuid;

        try
        {
            // 1. Soft-delete the document and physical file via DocumentApplicationService
            if (documentGuid.HasValue)
            {
                await _documentApplicationService.DeleteDocumentAsync(documentGuid.Value, deletedBy, cancellationToken);
            }

            _logger.LogInformation("PropertyCertificate document deleted: PropertyCertificateId={PropertyCertificateId}, DocumentGuid={DocumentGuid}",
                propertyCertificateId, documentGuid);

            // Removing the document invalidates this certificate for tax purposes, so re-run the
            // certificate-change pipeline (RV refresh then Retrospective Tax Engine) -- but only
            // when the certificate type is IsTaxable (same gating as every other mutation path).
            if (certificate.CertificateType?.IsTaxable == true)
            {
                if (certificate.PropertyId.HasValue)
                {
                    await _publisher.Publish(
                        new PropertyCertificateChangedEvent(certificate.PropertyId.Value, deletedBy), cancellationToken);
                }
                else
                {
                    var memberPropertyIds = await ResolveMemberPropertyIdsAsync(
                        certificate.EntityType, certificate.SocietyDetailId, certificate.WingDetailId, cancellationToken);
                    foreach (var memberPropertyId in memberPropertyIds)
                    {
                        await _publisher.Publish(
                            new PropertyCertificateChangedEvent(memberPropertyId, deletedBy), cancellationToken);
                    }
                }
            }
        }
        catch
        {
            _logger.LogError("PropertyCertificate document deletion failed for Id={PropertyCertificateId}",
                propertyCertificateId);
            throw;
        }
    }

    public async Task DeleteCertificateByTypeAsync(
        int propertyId,
        int certificateTypeId,
        int? propertyDetailsId,
        int deletedBy,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(propertyId, nameof(propertyId));
        Guard.AgainstNegativeOrZero(certificateTypeId, nameof(certificateTypeId));
        Guard.AgainstNegativeOrZero(deletedBy, nameof(deletedBy));

        _logger.LogInformation(
            "Deleting PropertyCertificate metadata for PropertyId={PropertyId}, CertificateTypeId={CertificateTypeId}, " +
            "PropertyDetailsId={PropertyDetailsId}, User={UserId}",
            propertyId, certificateTypeId, propertyDetailsId, deletedBy);

        var existingCertificates = await _propertyCertificateService.GetByPropertyIdIncludingInactiveAsync(
            propertyId,
            PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
            cancellationToken);

        // EntityType is always "P" for property/floor scope (see GetCertificateTypesWithStatusAsync);
        // this also excludes Society/Wing-scoped rows (EntityType "S"/"W") sharing this PropertyId
        // with PropertyDetailsId == null.
        var match = existingCertificates.FirstOrDefault(c =>
            c.CertificateTypeId == certificateTypeId &&
            c.PropertyDetailsId == propertyDetailsId &&
            c.EntityType == "P" &&
            !c.MarkedForDeletion);

        if (match == null)
        {
            throw new PropertyCertificateNotFoundException(
                $"PropertyId={propertyId}, CertificateTypeId={certificateTypeId}, PropertyDetailsId={propertyDetailsId?.ToString() ?? "null"}");
        }

        // Deleting the metadata row must not leave an orphaned, still-active document behind --
        // cascade-clean the attached document (if any) first, the same unlink-then-soft-delete
        // steps DeleteDocumentAsync performs, but WITHOUT its own recalculation publish:
        // DeleteAsync below already publishes once, and publishing twice would re-run the
        // RV+Occupation Tax pipeline redundantly for the same property (the same double-execution
        // bug fixed earlier this session for certificate creation).
        if (match.DocumentBinding != null)
        {
            var documentGuid = match.DocumentBinding.Document?.DocumentGuid;

            if (documentGuid.HasValue)
            {
                await _documentApplicationService.DeleteDocumentAsync(documentGuid.Value, deletedBy, cancellationToken);
            }

            _logger.LogInformation(
                "PropertyCertificate document cascade-deleted ahead of metadata: PropertyCertificateId={PropertyCertificateId}, DocumentGuid={DocumentGuid}",
                match.Id, documentGuid);
        }

        // Delegates to IPropertyCertificateService.DeleteAsync, which soft-deletes the row and
        // (when the certificate type is IsTaxable) publishes PropertyCertificateChangedEvent to
        // re-run the RV-refresh-then-Occupation-Tax pipeline -- no
        // duplicated deletion behavior between the two lookup styles.
        await _propertyCertificateService.DeleteAsync(match.Id, deletedBy, cancellationToken);

        _logger.LogInformation(
            "PropertyCertificate metadata deleted: PropertyCertificateId={PropertyCertificateId} " +
            "(resolved from PropertyId={PropertyId}, CertificateTypeId={CertificateTypeId}, PropertyDetailsId={PropertyDetailsId})",
            match.Id, propertyId, certificateTypeId, propertyDetailsId);
    }

    public async Task<int> ReplaceCertificateByTypeAsync(
        int propertyId,
        int certificateTypeId,
        int? oldPropertyDetailsId,
        int? newPropertyDetailsId,
        string? newCertificateNo,
        DateTime? newIssueDate,
        int userId,
        CancellationToken cancellationToken = default,
        string entityType = "P",
        int? societyDetailId = null,
        int? wingDetailId = null)
    {
        Guard.AgainstNegativeOrZero(propertyId, nameof(propertyId));
        Guard.AgainstNegativeOrZero(certificateTypeId, nameof(certificateTypeId));
        Guard.AgainstNegativeOrZero(userId, nameof(userId));

        _logger.LogInformation(
            "Replacing PropertyCertificate for PropertyId={PropertyId}, CertificateTypeId={CertificateTypeId}, " +
            "OldPropertyDetailsId={OldPropertyDetailsId}, NewPropertyDetailsId={NewPropertyDetailsId}, User={UserId}",
            propertyId, certificateTypeId, oldPropertyDetailsId, newPropertyDetailsId, userId);

        var existingCertificates = await _propertyCertificateService.GetByPropertyIdIncludingInactiveAsync(
            propertyId,
            PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
            cancellationToken);

        // EntityType is always "P" for property/floor scope (see GetCertificateTypesWithStatusAsync);
        // this also excludes Society/Wing-scoped rows (EntityType "S"/"W") sharing this PropertyId
        // with PropertyDetailsId == null.
        var match = existingCertificates.FirstOrDefault(c =>
            c.CertificateTypeId == certificateTypeId &&
            c.PropertyDetailsId == oldPropertyDetailsId &&
            c.EntityType == "P" &&
            !c.MarkedForDeletion);

        if (match == null)
        {
            throw new PropertyCertificateNotFoundException(
                $"PropertyId={propertyId}, CertificateTypeId={certificateTypeId}, PropertyDetailsId={oldPropertyDetailsId?.ToString() ?? "null"}");
        }

        var certificateType = await _certificateTypeRepository.GetByIdAsync(certificateTypeId, cancellationToken);
        var isTaxableType = certificateType?.IsTaxable ?? false;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        int newCertificateId;
        try
        {
            // Cascade-clean any attached document ahead of the delete -- same as
            // DeleteCertificateByTypeAsync, so this never leaves an orphaned, still-active document.
            if (match.DocumentBinding != null)
            {
                var documentGuid = match.DocumentBinding.Document?.DocumentGuid;
                if (documentGuid.HasValue)
                {
                    await _documentApplicationService.DeleteDocumentAsync(documentGuid.Value, userId, cancellationToken);
                }
            }

            // Both suppressed -- see this method's own PropertyCertificateChangedEvent publish below,
            // which fires exactly once against the FINAL state (new certificate present), not the
            // momentarily-certificate-less intermediate state between these two calls.
            await _propertyCertificateService.DeleteAsync(match.Id, userId, cancellationToken, suppressRecalculation: true);

            newCertificateId = await _propertyCertificateService.CreateAsync(
                propertyId,
                certificateTypeId,
                newCertificateNo,
                newIssueDate,
                userId,
                cancellationToken,
                newPropertyDetailsId,
                suppressRecalculation: true,
                entityType: entityType,
                societyDetailId: societyDetailId,
                wingDetailId: wingDetailId);

            if (isTaxableType)
            {
                await _publisher.Publish(new PropertyCertificateChangedEvent(propertyId, userId), cancellationToken);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        _logger.LogInformation(
            "PropertyCertificate replaced: OldId={OldId} -> NewId={NewId} (PropertyId={PropertyId}, CertificateTypeId={CertificateTypeId})",
            match.Id, newCertificateId, propertyId, certificateTypeId);

        return newCertificateId;
    }

    public async Task<FloorCertificatesResponseDto> GetFloorCertificatesAsync(
        int propertyId,
        int? selectedPropertyDetailsId,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(propertyId, nameof(propertyId));

        var floors = await _propertyDetailsRepository.GetQueryable()
            .AsNoTracking()
            .Where(pd => pd.PropertyId == propertyId && pd.IsActive && !pd.MarkedForDeletion)
            .Include(pd => pd.Floor)
            .Include(pd => pd.SubFloor)
            .Include(pd => pd.ConstructionType)
            .Include(pd => pd.TypeOfUse)
            .Include(pd => pd.SubTypeOfUse)
            .ToListAsync(cancellationToken);

        if (selectedPropertyDetailsId.HasValue && !floors.Any(f => f.Id == selectedPropertyDetailsId.Value))
        {
            _logger.LogWarning(
                "GetFloorCertificatesAsync: selectedPropertyDetailsId {PropertyDetailsId} does not belong to property {PropertyId}; no floor will be marked selected.",
                selectedPropertyDetailsId, propertyId);
        }

        var response = new FloorCertificatesResponseDto
        {
            PropertyId = propertyId,
            SelectedPropertyDetailsId = selectedPropertyDetailsId
        };

        if (floors.Count == 0)
        {
            // No floors yet — still return property-wise certificates, empty floor list (not an exception).
            response.PropertyWiseCertificates = await GetCertificateTypesWithStatusAsync(
                propertyId, cancellationToken, propertyDetailsId: null);
            return response;
        }

        var allCertificates = await _propertyCertificateService.GetByPropertyIdAsync(
            propertyId,
            PropertyCertificateIncludeOptions.CertificateType,
            cancellationToken) ?? new List<PropertyCertificateEntity>();

        var propertyWiseCerts = allCertificates.Where(c => c.PropertyDetailsId == null).ToList();
        var floorWiseCerts = allCertificates
            .Where(c => c.PropertyDetailsId.HasValue)
            .GroupBy(c => c.PropertyDetailsId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Resolve wing and society details for fallback inheritance
        var (wingDetailId, societyDetailId) = await ResolvePropertyWingAndSocietyIdsAsync(propertyId, cancellationToken);

        List<PropertyCertificateEntity> wingWiseCerts = new();
        if (wingDetailId.HasValue && wingDetailId.Value > 0)
        {
            var wingResult = await _propertyCertificateService.GetByWingDetailIdAsync(
                wingDetailId.Value,
                PropertyCertificateIncludeOptions.CertificateType,
                cancellationToken);
            if (wingResult != null)
                wingWiseCerts = wingResult;
        }

        List<PropertyCertificateEntity> societyWiseCerts = new();
        if (societyDetailId.HasValue && societyDetailId.Value > 0)
        {
            var societyResult = await _propertyCertificateService.GetBySocietyDetailIdAsync(
                societyDetailId.Value,
                PropertyCertificateIncludeOptions.CertificateType,
                cancellationToken);
            if (societyResult != null)
                societyWiseCerts = societyResult;
        }

        response.PropertyWiseCertificates = await GetCertificateTypesWithStatusAsync(
            propertyId, cancellationToken, propertyDetailsId: null);

        var electricBillCodes = new[] { CertificateTypeCodes.ElectricBill };

        var allFloorDtos = floors.Select(floor =>
        {
            floorWiseCerts.TryGetValue(floor.Id, out var certsForFloor);
            certsForFloor ??= new List<PropertyCertificateEntity>();

            // Floor-wise certificate overrides property-wise for that specific floor/type;
            // property-wise certificate falls back to wing-wise then society-wise.
            var effectiveCc = ResolveEffectiveDate(certsForFloor, propertyWiseCerts, wingWiseCerts, societyWiseCerts, new[] { CertificateTypeCodes.CC }, "completion");
            var effectiveOc = ResolveEffectiveDate(certsForFloor, propertyWiseCerts, wingWiseCerts, societyWiseCerts, new[] { CertificateTypeCodes.OC }, "occupancy", "occupation");
            var effectiveElectricBill = ResolveEffectiveDate(certsForFloor, propertyWiseCerts, wingWiseCerts, societyWiseCerts, electricBillCodes, "electricity", "electric", "bill");

            var certificateApplicable = certsForFloor.Any(c => c.IsActive && !c.MarkedForDeletion)
                || propertyWiseCerts.Any(c => c.IsActive && !c.MarkedForDeletion)
                || wingWiseCerts.Any(c => c.IsActive && !c.MarkedForDeletion)
                || societyWiseCerts.Any(c => c.IsActive && !c.MarkedForDeletion);

            return new FloorCertificateDto
            {
                PropertyDetailsId = floor.Id,
                PropertyId = propertyId,
                FloorDescription = floor.Floor?.Description,
                SubFloorDescription = floor.SubFloor?.Description,
                ConstructionYear = floor.ConstructionYear,
                AssessmentYear = floor.AssessmentYear,
                ConstructionTypeDescription = floor.ConstructionType?.Description,
                TypeOfUseDescription = floor.TypeOfUse?.Description,
                SubTypeOfUseDescription = floor.SubTypeOfUse?.Description,
                CarpetAreaSqFeet = floor.CarpetAreaSqFeet,
                CarpetAreaSqMeter = floor.CarpetAreaSqMeter,
                BuiltupAreaSqFeet = floor.BuiltupAreaSqFeet,
                BuiltupAreaSqMeter = floor.BuiltupAreaSqMeter,
                IsSelected = selectedPropertyDetailsId.HasValue && floor.Id == selectedPropertyDetailsId.Value,
                CertificateApplicable = certificateApplicable,
                CcDate = effectiveCc?.IssueDate,
                OcDate = effectiveOc?.IssueDate,
                ElectricBillDate = effectiveElectricBill?.IssueDate,
                CcCertificateNo = effectiveCc?.CertificateNo,
                OcCertificateNo = effectiveOc?.CertificateNo,
                ElectricBillNo = effectiveElectricBill?.CertificateNo
            };
        }).ToList();

        // Split into the one selected floor (if any) and every other floor, rather than one flat
        // list the UI has to scan for IsSelected.
        response.SelectedFloor = allFloorDtos.FirstOrDefault(f => f.IsSelected);
        response.OtherFloors = allFloorDtos.Where(f => !f.IsSelected).ToList();

        return response;
    }

    /// <summary>
    /// Matches a certificate type against ANY of several codes (CC/OC/Electric Bill each have
    /// exactly one, from <see cref="CertificateTypeCodes"/>), preferring CertificateTypeCode when
    /// populated and falling back to the display-name heuristic when it isn't (older/seed data may
    /// not have codes backfilled yet) — mirrors the Retrospective Tax Engine's own evidence
    /// resolution so this endpoint and the tax engine never disagree about which certificate is
    /// CC/OC/Electric Bill.
    /// </summary>
    private static bool MatchesCertificateType(PropertyCertificateTypeMasterEntity type, IReadOnlyCollection<string> codes, params string[] nameContains)
    {
        if (!string.IsNullOrEmpty(type.CertificateTypeCode))
        {
            return codes.Any(c => string.Equals(type.CertificateTypeCode, c, StringComparison.OrdinalIgnoreCase));
        }

        var name = type.CertificateTypeName.ToLowerInvariant();
        return nameContains.Any(n => name.Contains(n, StringComparison.OrdinalIgnoreCase)) ||
            codes.Any(c => string.Equals(name, c, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Resolves the effective certificate for a given certificate-type code set on one floor:
    /// the floor-wise certificate if present (override), else property-wise, then wing-wise, then
    /// society-wise (fallback).
    /// </summary>
    private static PropertyCertificateEntity? ResolveEffectiveDate(
        List<PropertyCertificateEntity> floorWiseCerts,
        List<PropertyCertificateEntity> propertyWiseCerts,
        List<PropertyCertificateEntity> wingWiseCerts,
        List<PropertyCertificateEntity> societyWiseCerts,
        IReadOnlyCollection<string> certificateTypeCodes,
        params string[] nameContains)
    {
        bool Matches(PropertyCertificateEntity c) =>
            c.IsActive &&
            !c.MarkedForDeletion &&
            c.CertificateType != null &&
            MatchesCertificateType(c.CertificateType, certificateTypeCodes, nameContains);

        return floorWiseCerts.FirstOrDefault(Matches)
            ?? propertyWiseCerts.FirstOrDefault(Matches)
            ?? wingWiseCerts.FirstOrDefault(Matches)
            ?? societyWiseCerts.FirstOrDefault(Matches);
    }

    /// <summary>
    /// Saves/updates certificate metadata only. Document upload is NOT handled here — the client
    /// uploads the file separately via the Global Document endpoint (<c>POST /api/documents/upload</c>)
    /// with <c>ReferenceTableName=PropertyCertificates</c> and <c>ReferenceTableId=&lt;the id returned
    /// by this call&gt;</c>; <see cref="NtisPlatform.Infrastructure.Services.Handlers.PropertyCertificateDocumentBindingHandler"/>
    /// automatically links the resulting DocumentBindingId back onto this row afterwards.
    /// </summary>
    public async Task<SaveCertificateResponseDto> SaveCertificateAsync(
        SaveCertificateRequestDto request,
        int userId,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(request.CertificateTypeId, nameof(request.CertificateTypeId));
        Guard.AgainstNegativeOrZero(userId, nameof(userId));

        if (!string.IsNullOrWhiteSpace(request.DocumentGuid) &&
            (!Guid.TryParse(request.DocumentGuid, out var parsedGuid) || parsedGuid == Guid.Empty))
        {
            throw new ArgumentException("DocumentGuid must be a valid, non-empty GUID.", nameof(request.DocumentGuid));
        }

        // Floor scope resolves to "P" here too (see the else branch below) -- 'F' is not a
        // valid EntityType per CK_PropertyCertificates_EntityScope.
        string entityType = !string.IsNullOrWhiteSpace(request.EntityType)
            ? request.EntityType.Trim().ToUpperInvariant()
            : (request.CertificateScope == CertificateScope.Society ? "S" :
               request.CertificateScope == CertificateScope.Wing ? "W" : "P");

        if (entityType == "S" || request.CertificateScope == CertificateScope.Society)
        {
            entityType = "S";
            request.CertificateScope = CertificateScope.Society;
            request.WingDetailId = null;
            request.PropertyDetailsId = null;
            request.PropertyId = null;
            Guard.AgainstNegativeOrZero(request.SocietyDetailId ?? 0, nameof(request.SocietyDetailId));
        }
        else if (entityType == "W" || request.CertificateScope == CertificateScope.Wing)
        {
            entityType = "W";
            request.CertificateScope = CertificateScope.Wing;
            request.PropertyDetailsId = null;
            request.PropertyId = null;
            Guard.AgainstNegativeOrZero(request.SocietyDetailId ?? 0, nameof(request.SocietyDetailId));
            Guard.AgainstNegativeOrZero(request.WingDetailId ?? 0, nameof(request.WingDetailId));
        }
        else
        {
            // EntityType is always "P" here, for both Property and Floor scope -- per
            // CK_PropertyCertificates_EntityScope, 'F' is not a valid EntityType at all;
            // PropertyDetailsId NULL vs NOT NULL on a 'P' row is what distinguishes property-wise
            // from floor-wise (see PropertyCertificateEntity.ValidateEntityScope).
            entityType = "P";
            request.CertificateScope = request.PropertyDetailsId.HasValue
                ? CertificateScope.Floor
                : CertificateScope.Property;
            Guard.AgainstNegativeOrZero(request.PropertyId ?? 0, nameof(request.PropertyId));
        }

        var certificateType = await _certificateTypeRepository.GetByIdAsync(request.CertificateTypeId, cancellationToken);
        if (certificateType == null || !certificateType.IsActive)
        {
            throw new InvalidOperationException($"Certificate type {request.CertificateTypeId} was not found or is inactive.");
        }

        // Find the existing row for this exact (PropertyId, EntityType, SocietyDetailId, WingDetailId, PropertyDetailsId, CertificateTypeId) scope.
        // A Society/Wing-scoped row has no PropertyId to look up by, so it's resolved directly by
        // EntityType + SocietyDetailId/WingDetailId instead (same lookup GetSocietyOrWingCertificateTypesWithStatusAsync uses).
        var existingCertificates = (entityType == "S" || entityType == "W"
            ? await GetSocietyOrWingCertificatesRawAsync(entityType, request.SocietyDetailId, request.WingDetailId, cancellationToken)
            : await _propertyCertificateService.GetByPropertyIdIncludingInactiveAsync(
                request.PropertyId!.Value,
                PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
                cancellationToken)) ?? new List<PropertyCertificateEntity>();

        var existing = existingCertificates.FirstOrDefault(c =>
            c.CertificateTypeId == request.CertificateTypeId &&
            (c.EntityType ?? "P") == entityType &&
            c.SocietyDetailId == request.SocietyDetailId &&
            c.WingDetailId == request.WingDetailId &&
            c.PropertyDetailsId == request.PropertyDetailsId);

        // Validate CC/OC date order upfront against the final proposed state
        var certTypes = await _certificateTypeRepository.GetAsync(_ => true, cancellationToken);
        var typeCodeByTypeId = certTypes.ToDictionary(t => t.Id, t => t.CertificateTypeCode);
        var singleBulkDto = new PropertyCertificateBulkSaveDto
        {
            PropertyId = request.PropertyId ?? 0,
            Certificates = new List<PropertyCertificateItemDto>
            {
                new PropertyCertificateItemDto
                {
                    CertificateTypeId = request.CertificateTypeId,
                    IsEnabled = true,
                    CertificateNumber = request.CertificateNo,
                    CertificateDate = request.CertificateIssueDate,
                    PropertyCertificateId = existing?.Id,
                    PropertyDetailsId = request.PropertyDetailsId
                }
            }
        };
        ValidateCcOcDateOrder(singleBulkDto, typeCodeByTypeId, existingCertificates);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        int propertyCertificateId;

        try
        {
            if (existing == null)
            {
                // PropertyCertificateEntity.Create already sets IsActive = true -- do NOT also call
                // ToggleEnabledAsync here (see the identical fix and full rationale in
                // BulkSaveAllAsync's "create new certificate" branch above).
                propertyCertificateId = await _propertyCertificateService.CreateAsync(
                    request.PropertyId,
                    request.CertificateTypeId,
                    request.CertificateNo,
                    request.CertificateIssueDate,
                    userId,
                    cancellationToken,
                    request.PropertyDetailsId,
                    suppressRecalculation: true,
                    entityType: entityType,
                    societyDetailId: request.SocietyDetailId,
                    wingDetailId: request.WingDetailId);
            }
            else
            {
                propertyCertificateId = existing.Id;
                await _propertyCertificateService.UpdateAsync(
                    propertyCertificateId,
                    request.CertificateNo,
                    request.CertificateIssueDate,
                    userId,
                    cancellationToken,
                    suppressRecalculation: true);

                if (!existing.IsActive)
                {
                    await _propertyCertificateService.ToggleEnabledAsync(
                        propertyCertificateId,
                        true,
                        userId,
                        cancellationToken,
                        suppressRecalculation: true);
                }
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        DocumentBindingResult? boundDocument = null;
        if (!string.IsNullOrWhiteSpace(request.DocumentGuid))
        {
            boundDocument = await BindDocumentToCertificatesAsync(
                new List<int> { propertyCertificateId },
                request.DocumentGuid,
                request.SocietyDetailId,
                userId,
                cancellationToken);
        }

        // Property/Floor-scoped row recalculates its one PropertyId -- unchanged, fire-and-forget,
        // so the save response returns immediately. A Society/Wing-scoped row has no PropertyId of
        // its own, so every property currently under that society/wing needs recalculating instead;
        // business requires this save to report back how many succeeded and how many failed (in
        // plain language, not a raw error), so that path runs synchronously here instead of
        // publishing fire-and-forget events for the background queue to pick up later.
        PropertyTaxRecalculationSummaryDto? recalculationSummary = null;
        if (certificateType.IsTaxable)
        {
            if (request.PropertyId.HasValue)
            {
                await _publisher.Publish(
                    new PropertyCertificateChangedEvent(request.PropertyId.Value, userId), cancellationToken);
            }
            else
            {
                if (_taxRecalculationBackgroundService != null)
                {
                    // Enqueue to background worker and return HTTP response immediately
                    var jobId = await _taxRecalculationBackgroundService.EnqueueSocietyOrWingRecalculationAsync(
                        entityType, request.SocietyDetailId, request.WingDetailId, userId, request.CertificateTypeId, cancellationToken);

                    recalculationSummary = new PropertyTaxRecalculationSummaryDto
                    {
                        JobId = jobId,
                        TotalProperties = 0,
                        SucceededCount = 0,
                        FailedCount = 0
                    };
                }
                else
                {
                    var memberPropertyIds = await ResolveMemberPropertyIdsAsync(entityType, request.SocietyDetailId, request.WingDetailId, cancellationToken);
                    var summary = new PropertyTaxRecalculationSummaryDto { TotalProperties = memberPropertyIds.Count };

                    foreach (var memberPropertyId in memberPropertyIds)
                    {
                        try
                        {
                            // RV, then the retrospective engine, under the property's retrospective lock
                            await _retrospectiveTaxRefresher.RefreshAsync(memberPropertyId, userId, cancellationToken: cancellationToken);
                            summary.SucceededCount++;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex,
                                "Tax recalculation failed for PropertyId={PropertyId} after {EntityType}-scoped certificate save (SocietyDetailId={SocietyDetailId}, WingDetailId={WingDetailId}).",
                                memberPropertyId, entityType, request.SocietyDetailId, request.WingDetailId);
                            summary.FailedCount++;
                            summary.Failures.Add(new PropertyTaxRecalculationFailureDto
                            {
                                PropertyId = memberPropertyId,
                                Reason = "Tax could not be recalculated for this property. Please try again, or contact support if this keeps happening."
                            });
                        }
                    }

                    recalculationSummary = summary;
                }
            }
        }

        return new SaveCertificateResponseDto
        {
            PropertyCertificateId = propertyCertificateId,
            PropertyId = request.PropertyId ?? 0,
            PropertyDetailsId = request.PropertyDetailsId,
            CertificateScope = request.CertificateScope,
            CertificateTypeId = request.CertificateTypeId,
            CertificateNo = request.CertificateNo,
            CertificateIssueDate = request.CertificateIssueDate,
            DocumentGuid = boundDocument?.DocumentGuid ?? existing?.DocumentBinding?.Document?.DocumentGuid,
            DocumentBindingId = boundDocument?.BindingId ?? existing?.DocumentBindingId,
            TaxRecalculationTriggered = certificateType.IsTaxable,
            RecalculationSummary = recalculationSummary,
            EntityType = request.EntityType ?? existing?.EntityType,
            SocietyDetailId = request.SocietyDetailId ?? existing?.SocietyDetailId,
            WingDetailId = request.WingDetailId ?? existing?.WingDetailId
        };
    }

    /// <summary>
    /// Raw (untransformed) Society/Wing-scoped certificate rows for a given scope -- used to find
    /// an existing row to update/re-enable, since these rows have no PropertyId to look up by.
    /// Mirrors the repository resolution <see cref="GetSocietyOrWingCertificateTypesWithStatusAsync"/>
    /// already uses.
    /// </summary>
    private async Task<List<PropertyCertificateEntity>> GetSocietyOrWingCertificatesRawAsync(
        string entityType, int? societyDetailId, int? wingDetailId, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider?.CreateScope();
        var certRepo = _propertyCertificateRepository ?? scope?.ServiceProvider.GetService<IRepository<PropertyCertificateEntity>>();
        if (certRepo == null)
        {
            return new List<PropertyCertificateEntity>();
        }

        var certificates = entityType == "W"
            ? await certRepo.GetAsync(c => c.EntityType == "W" && c.WingDetailId == wingDetailId!.Value && !c.MarkedForDeletion, cancellationToken)
            : await certRepo.GetAsync(c => c.EntityType == "S" && c.SocietyDetailId == societyDetailId!.Value && !c.MarkedForDeletion, cancellationToken);

        return certificates.ToList();
    }

    /// <summary>
    /// Every active PropertyId currently under the given Society or Wing scope -- used to
    /// recalculate Retrospective Tax for every affected unit when a Society/Wing-scoped
    /// certificate (which has no PropertyId of its own) is saved. For a Society, this is the
    /// society's own representative property (SocietyDetailsMast.PropertyId, e.g. the "apartment
    /// society property" with no partition) plus every unit under each of its wings; for a Wing,
    /// it's every unit directly under that wing.
    /// </summary>
    private async Task<List<int>> ResolveMemberPropertyIdsAsync(
        string entityType, int? societyDetailId, int? wingDetailId, CancellationToken cancellationToken)
    {
        var memberIds = new HashSet<int>();

        if (entityType == "W")
        {
            if (!wingDetailId.HasValue) return memberIds.ToList();

            var wingUnitIds = await _propertyRepository.GetQueryable()
                .Where(p => p.WingDetailId == wingDetailId.Value && p.IsActive && !p.MarkedForDeletion)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);
            foreach (var id in wingUnitIds) memberIds.Add(id);
            return memberIds.ToList();
        }

        if (entityType == "S")
        {
            if (!societyDetailId.HasValue) return memberIds.ToList();

            var representativePropertyId = await _societyRepository.GetQueryable()
                .Where(s => s.Id == societyDetailId.Value)
                .Select(s => s.PropertyId)
                .FirstOrDefaultAsync(cancellationToken);
            if (representativePropertyId.HasValue) memberIds.Add(representativePropertyId.Value);

            var wingIds = await _wingDetailsMastRepository.GetQueryable()
                .Where(w => w.SocietyDetailsMastId == societyDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                .Select(w => w.Id)
                .ToListAsync(cancellationToken);

            if (wingIds.Count > 0)
            {
                var unitIds = await _propertyRepository.GetQueryable()
                    .Where(p => p.WingDetailId.HasValue && wingIds.Contains(p.WingDetailId.Value) && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => p.Id)
                    .ToListAsync(cancellationToken);
                foreach (var id in unitIds) memberIds.Add(id);
            }
        }

        return memberIds.ToList();
    }

    public async Task<CreateCertificateRecordResponseDto> CreateCertificateRecordAsync(
        CreateCertificateRecordRequestDto request,
        int userId,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(request.SocietyDetailId, nameof(request.SocietyDetailId));
        Guard.AgainstNegativeOrZero(request.CertificateTypeId, nameof(request.CertificateTypeId));
        Guard.AgainstNegativeOrZero(userId, nameof(userId));

        if (!string.IsNullOrWhiteSpace(request.DocumentGuid) &&
            (!Guid.TryParse(request.DocumentGuid, out var recordDocGuid) || recordDocGuid == Guid.Empty))
        {
            throw new ArgumentException("DocumentGuid must be a valid, non-empty GUID.", nameof(request.DocumentGuid));
        }

        if (!Enum.IsDefined(typeof(CertificateRecordLevel), request.Level))
        {
            throw new ArgumentException($"Invalid certificate record level: {request.Level}", nameof(request.Level));
        }

        var certificateType = await _certificateTypeRepository.GetByIdAsync(request.CertificateTypeId, cancellationToken);
        if (certificateType == null || !certificateType.IsActive)
        {
            throw new InvalidOperationException($"Certificate type {request.CertificateTypeId} was not found or is inactive.");
        }

        if (request.Level == CertificateRecordLevel.Apartment)
        {
            var saveResult = await SaveCertificateAsync(new SaveCertificateRequestDto
            {
                EntityType = "S",
                SocietyDetailId = request.SocietyDetailId,
                CertificateTypeId = request.CertificateTypeId,
                CertificateNo = request.CertificateNo,
                CertificateIssueDate = request.CertificateIssueDate
            }, userId, cancellationToken);

            var aptMemberIds = await ResolveMemberPropertyIdsAsync("S", request.SocietyDetailId, null, cancellationToken);
            var certIds = new List<int> { saveResult.PropertyCertificateId };

            await BindDocumentToCertificatesAsync(certIds, request.DocumentGuid, request.SocietyDetailId, userId, cancellationToken);

            return new CreateCertificateRecordResponseDto
            {
                EffectiveScope = "Society",
                PropertyCertificateIds = certIds,
                UnitCount = aptMemberIds.Count,
                TaxRecalculationTriggered = saveResult.TaxRecalculationTriggered,
                JobId = saveResult.RecalculationSummary?.JobId,
                RecalculationSummary = saveResult.RecalculationSummary
            };
        }


        if (request.Level == CertificateRecordLevel.Wing)
        {
            if (!request.WingDetailId.HasValue || request.WingDetailId.Value <= 0)
            {
                throw new ArgumentException("WingDetailId is required for Wing level certificate records.", nameof(request.WingDetailId));
            }

            var wing = await _wingDetailsMastRepository.GetByIdAsync(request.WingDetailId.Value, cancellationToken);
            if (wing == null || wing.SocietyDetailsMastId != request.SocietyDetailId)
            {
                throw new ArgumentException($"Wing {request.WingDetailId.Value} does not belong to Society {request.SocietyDetailId}.", nameof(request.WingDetailId));
            }

            var wingMemberIds = await ResolveMemberPropertyIdsAsync("W", request.SocietyDetailId, request.WingDetailId, cancellationToken);

            var saveResult = await SaveCertificateAsync(new SaveCertificateRequestDto
            {
                EntityType = "W",
                SocietyDetailId = request.SocietyDetailId,
                WingDetailId = request.WingDetailId,
                CertificateTypeId = request.CertificateTypeId,
                CertificateNo = request.CertificateNo,
                CertificateIssueDate = request.CertificateIssueDate
            }, userId, cancellationToken);

            var certIds = new List<int> { saveResult.PropertyCertificateId };

            await BindDocumentToCertificatesAsync(certIds, request.DocumentGuid, request.SocietyDetailId, userId, cancellationToken);

            return new CreateCertificateRecordResponseDto
            {
                EffectiveScope = "Wing",
                PropertyCertificateIds = certIds,
                UnitCount = wingMemberIds.Count,
                TaxRecalculationTriggered = saveResult.TaxRecalculationTriggered,
                JobId = saveResult.RecalculationSummary?.JobId,
                RecalculationSummary = saveResult.RecalculationSummary
            };
        }

        // Unit level.
        if (request.UnitPropertyIds == null || request.UnitPropertyIds.Count == 0)
        {
            throw new ArgumentException("UnitPropertyIds is required and must contain at least one PropertyId for Unit level certificate records.", nameof(request.UnitPropertyIds));
        }

        if (request.UnitPropertyIds.Any(id => id <= 0))
        {
            throw new ArgumentException("All UnitPropertyIds must be greater than 0.", nameof(request.UnitPropertyIds));
        }

        var selectedUnitIds = request.UnitPropertyIds.Distinct().ToList();

        // Validate that all selected unit IDs belong to the target Society
        var allSocietyMemberIds = await ResolveMemberPropertyIdsAsync("S", request.SocietyDetailId, null, cancellationToken);
        var societyMemberIdSet = new HashSet<int>(allSocietyMemberIds);
        if (societyMemberIdSet.Count > 0)
        {
            var unknownSocietyUnitIds = selectedUnitIds.Where(id => !societyMemberIdSet.Contains(id)).ToList();
            if (unknownSocietyUnitIds.Count > 0)
            {
                throw new ArgumentException(
                    $"The following PropertyIds are not units under SocietyDetailId {request.SocietyDetailId}: {string.Join(", ", unknownSocietyUnitIds)}.",
                    nameof(request.UnitPropertyIds));
            }
        }

        // Check if every unit under a specific wing was selected -- collapses to Wing level
        if (request.WingDetailId.HasValue && request.WingDetailId.Value > 0)
        {
            var wing = await _wingDetailsMastRepository.GetByIdAsync(request.WingDetailId.Value, cancellationToken);
            if (wing == null || wing.SocietyDetailsMastId != request.SocietyDetailId)
            {
                throw new ArgumentException($"Wing {request.WingDetailId.Value} does not belong to Society {request.SocietyDetailId}.", nameof(request.WingDetailId));
            }

            var wingMemberIds = await ResolveMemberPropertyIdsAsync("W", request.SocietyDetailId, request.WingDetailId, cancellationToken);
            var wingMemberIdSet = new HashSet<int>(wingMemberIds);
            if (wingMemberIdSet.Count > 0)
            {
                var unknownWingUnitIds = selectedUnitIds.Where(id => !wingMemberIdSet.Contains(id)).ToList();
                if (unknownWingUnitIds.Count > 0)
                {
                    throw new ArgumentException(
                        $"The following PropertyIds are not units under WingDetailId {request.WingDetailId}: {string.Join(", ", unknownWingUnitIds)}.",
                        nameof(request.UnitPropertyIds));
                }
            }

            if (wingMemberIds.Count > 0 && selectedUnitIds.Count == wingMemberIds.Count && selectedUnitIds.All(id => wingMemberIdSet.Contains(id)))
            {
                var saveResult = await SaveCertificateAsync(new SaveCertificateRequestDto
                {
                    EntityType = "W",
                    SocietyDetailId = request.SocietyDetailId,
                    WingDetailId = request.WingDetailId,
                    CertificateTypeId = request.CertificateTypeId,
                    CertificateNo = request.CertificateNo,
                    CertificateIssueDate = request.CertificateIssueDate
                }, userId, cancellationToken);

                var certIds = new List<int> { saveResult.PropertyCertificateId };

                await BindDocumentToCertificatesAsync(certIds, request.DocumentGuid, request.SocietyDetailId, userId, cancellationToken);

                return new CreateCertificateRecordResponseDto
                {
                    EffectiveScope = "Wing",
                    PropertyCertificateIds = certIds,
                    UnitCount = wingMemberIds.Count,
                    TaxRecalculationTriggered = saveResult.TaxRecalculationTriggered,
                    JobId = saveResult.RecalculationSummary?.JobId,
                    RecalculationSummary = saveResult.RecalculationSummary
                };
            }
        }

        // Partial selection / Unit-level individual rows -- each unit carries its own resolved WingDetailId
        var createdIds = new List<int>();
        var taxRecalculationTriggered = false;
        foreach (var unitPropertyId in selectedUnitIds)
        {
            var (unitWingDetailId, unitSocietyDetailId) = await ResolvePropertyWingAndSocietyIdsAsync(unitPropertyId, cancellationToken);
            var effectiveWingId = unitWingDetailId ?? request.WingDetailId;
            var effectiveSocietyId = unitSocietyDetailId ?? request.SocietyDetailId;

            var saveResult = await SaveCertificateAsync(new SaveCertificateRequestDto
            {
                EntityType = "P",
                PropertyId = unitPropertyId,
                SocietyDetailId = effectiveSocietyId,
                WingDetailId = effectiveWingId,
                CertificateTypeId = request.CertificateTypeId,
                CertificateNo = request.CertificateNo,
                CertificateIssueDate = request.CertificateIssueDate
            }, userId, cancellationToken);

            createdIds.Add(saveResult.PropertyCertificateId);
            taxRecalculationTriggered = taxRecalculationTriggered || saveResult.TaxRecalculationTriggered;
        }

        await BindDocumentToCertificatesAsync(createdIds, request.DocumentGuid, request.SocietyDetailId, userId, cancellationToken);

        return new CreateCertificateRecordResponseDto
        {
            EffectiveScope = "Unit",
            PropertyCertificateIds = createdIds,
            UnitCount = selectedUnitIds.Count,
            TaxRecalculationTriggered = taxRecalculationTriggered
        };
    }

    public async Task<DeleteCertificateRecordResponseDto> DeleteCertificateRecordAsync(
        DeleteCertificateRecordRequestDto request,
        int userId,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(request.SocietyDetailId, nameof(request.SocietyDetailId));
        Guard.AgainstNegativeOrZero(request.CertificateTypeId, nameof(request.CertificateTypeId));
        Guard.AgainstNegativeOrZero(userId, nameof(userId));

        if (!Enum.IsDefined(typeof(CertificateRecordLevel), request.Level))
        {
            throw new ArgumentException($"Invalid certificate record level: {request.Level}", nameof(request.Level));
        }

        var certificateType = await _certificateTypeRepository.GetByIdAsync(request.CertificateTypeId, cancellationToken);
        if (certificateType == null || !certificateType.IsActive)
        {
            throw new InvalidOperationException($"Certificate type {request.CertificateTypeId} was not found or is inactive.");
        }

        using var scope = _serviceProvider?.CreateScope();
        var sp = scope?.ServiceProvider;
        var certRepo = _propertyCertificateRepository ?? sp?.GetService<IRepository<PropertyCertificateEntity>>();
        var docBindingRepo = _documentBindingRepository ?? sp?.GetService<IRepository<DocumentBindingEntity>>();
        var docRepo = _documentRepository ?? sp?.GetService<IRepository<DocumentEntity>>();

        if (certRepo == null)
        {
            throw new InvalidOperationException("PropertyCertificateRepository is not available.");
        }

        var isTaxable = certificateType.IsTaxable;
        var deletedCertIds = new List<int>();
        var affectedPropertyIds = new List<int>();
        string effectiveScope;
        PropertyTaxRecalculationSummaryDto? recalculationSummary = null;
        string? backgroundJobId = null;

        var matchingCerts = new List<PropertyCertificateEntity>();

        switch (request.Level)
        {
            case CertificateRecordLevel.Apartment:
            {
                effectiveScope = "Society";

                var certs = await certRepo.GetAsync(
                    c => c.EntityType == "S" && c.SocietyDetailId == request.SocietyDetailId && c.CertificateTypeId == request.CertificateTypeId && !c.MarkedForDeletion,
                    cancellationToken);
                matchingCerts.AddRange(certs);

                var aptMemberIds = await ResolveMemberPropertyIdsAsync("S", request.SocietyDetailId, null, cancellationToken);
                affectedPropertyIds.AddRange(aptMemberIds);
                break;
            }

            case CertificateRecordLevel.Wing:
            {
                effectiveScope = "Wing";
                if (!request.WingDetailId.HasValue || request.WingDetailId.Value <= 0)
                {
                    throw new ArgumentException("WingDetailId is required for Wing level certificate record deletion.", nameof(request.WingDetailId));
                }

                var wing = await _wingDetailsMastRepository.GetByIdAsync(request.WingDetailId.Value, cancellationToken);
                if (wing == null || wing.SocietyDetailsMastId != request.SocietyDetailId)
                {
                    throw new ArgumentException($"Wing {request.WingDetailId.Value} does not belong to Society {request.SocietyDetailId}.", nameof(request.WingDetailId));
                }

                var certs = await certRepo.GetAsync(
                    c => c.EntityType == "W" && c.WingDetailId == request.WingDetailId.Value &&
                         (c.SocietyDetailId == null || c.SocietyDetailId == request.SocietyDetailId) &&
                         c.CertificateTypeId == request.CertificateTypeId && !c.MarkedForDeletion,
                    cancellationToken);
                matchingCerts.AddRange(certs);

                var wingMemberIds = await ResolveMemberPropertyIdsAsync("W", request.SocietyDetailId, request.WingDetailId, cancellationToken);
                affectedPropertyIds.AddRange(wingMemberIds);
                break;
            }

            case CertificateRecordLevel.Unit:
            {
                effectiveScope = "Unit";
                if (request.UnitPropertyIds == null || request.UnitPropertyIds.Count == 0)
                {
                    throw new ArgumentException("UnitPropertyIds is required and must contain at least one PropertyId for Unit level certificate record deletion.", nameof(request.UnitPropertyIds));
                }
                if (request.UnitPropertyIds.Any(id => id <= 0))
                {
                    throw new ArgumentException("All UnitPropertyIds must be greater than 0.", nameof(request.UnitPropertyIds));
                }

                var selectedUnitIds = request.UnitPropertyIds.Distinct().ToList();

                if (request.WingDetailId.HasValue && request.WingDetailId.Value > 0)
                {
                    var wing = await _wingDetailsMastRepository.GetByIdAsync(request.WingDetailId.Value, cancellationToken);
                    if (wing == null || wing.SocietyDetailsMastId != request.SocietyDetailId)
                    {
                        throw new ArgumentException($"Wing {request.WingDetailId.Value} does not belong to Society {request.SocietyDetailId}.", nameof(request.WingDetailId));
                    }
                }

                // Hierarchy validation: every selected unit must belong to the requested Society (and Wing if supplied)
                var units = await _propertyRepository.GetQueryable()
                    .Where(p => selectedUnitIds.Contains(p.Id) && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => new { p.Id, p.WingDetailId })
                    .ToListAsync(cancellationToken);

                if (units.Count != selectedUnitIds.Count)
                {
                    var missingIds = selectedUnitIds.Except(units.Select(u => u.Id)).ToList();
                    throw new ArgumentException($"The following PropertyIds do not exist or are inactive: {string.Join(", ", missingIds)}", nameof(request.UnitPropertyIds));
                }

                if (request.WingDetailId.HasValue && request.WingDetailId.Value > 0)
                {
                    var nonMatchingWing = units.Where(u => u.WingDetailId != request.WingDetailId.Value).Select(u => u.Id).ToList();
                    if (nonMatchingWing.Count > 0)
                    {
                        throw new ArgumentException($"Properties [{string.Join(", ", nonMatchingWing)}] do not belong to Wing {request.WingDetailId.Value}.", nameof(request.UnitPropertyIds));
                    }
                }
                else
                {
                    var societyWingIds = await _wingDetailsMastRepository.GetQueryable()
                        .Where(w => w.SocietyDetailsMastId == request.SocietyDetailId && w.IsActive && !w.MarkedForDeletion)
                        .Select(w => w.Id)
                        .ToListAsync(cancellationToken);

                    var repPropId = await _societyRepository.GetQueryable()
                        .Where(s => s.Id == request.SocietyDetailId)
                        .Select(s => s.PropertyId)
                        .FirstOrDefaultAsync(cancellationToken);

                    var invalidUnits = units.Where(u =>
                        !(u.WingDetailId.HasValue && societyWingIds.Contains(u.WingDetailId.Value)) &&
                        !(repPropId.HasValue && u.Id == repPropId.Value)
                    ).Select(u => u.Id).ToList();

                    if (invalidUnits.Count > 0)
                    {
                        throw new ArgumentException($"Properties [{string.Join(", ", invalidUnits)}] do not belong to Society {request.SocietyDetailId}.", nameof(request.UnitPropertyIds));
                    }
                }

                var certs = await certRepo.GetQueryable()
                    .Where(c => (c.EntityType == "P" || c.EntityType == null || c.EntityType == "")
                                && c.PropertyId.HasValue
                                && selectedUnitIds.Contains(c.PropertyId.Value)
                                && c.CertificateTypeId == request.CertificateTypeId
                                && !c.MarkedForDeletion)
                    .ToListAsync(cancellationToken);

                matchingCerts.AddRange(certs);

                foreach (var cert in certs)
                {
                    if (cert.PropertyId.HasValue && !affectedPropertyIds.Contains(cert.PropertyId.Value))
                    {
                        affectedPropertyIds.Add(cert.PropertyId.Value);
                    }
                }

                // Also check: if every unit of the wing was selected, also soft delete any Wing-scoped certificate for that wing
                if (request.WingDetailId.HasValue && request.WingDetailId.Value > 0)
                {
                    var wingMemberIds = await ResolveMemberPropertyIdsAsync("W", request.SocietyDetailId, request.WingDetailId, cancellationToken);
                    if (wingMemberIds.Count > 0 && selectedUnitIds.Count >= wingMemberIds.Count && wingMemberIds.All(id => selectedUnitIds.Contains(id)))
                    {
                        var wingCerts = await certRepo.GetAsync(
                            c => c.EntityType == "W" && c.WingDetailId == request.WingDetailId.Value &&
                                 (c.SocietyDetailId == null || c.SocietyDetailId == request.SocietyDetailId) &&
                                 c.CertificateTypeId == request.CertificateTypeId && !c.MarkedForDeletion,
                            cancellationToken);
                        matchingCerts.AddRange(wingCerts);

                        // The wing row covered EVERY unit under the wing (a unit's evidence can be that row alone), so
                        // removing it changes the tax of all of them -- not only of the units that also had a row of their
                        // own. Without this, a unit covered by the wing row only kept its retrospective demand after the
                        // wing certificate was deleted.
                        if (wingCerts.Any())
                        {
                            foreach (var memberId in wingMemberIds)
                            {
                                if (!affectedPropertyIds.Contains(memberId))
                                {
                                    affectedPropertyIds.Add(memberId);
                                }
                            }
                        }
                    }
                }
                break;
            }

            default:
                throw new ArgumentException($"Unsupported certificate record level: {request.Level}", nameof(request.Level));
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var currentDate = DateTime.Now;

            foreach (var cert in matchingCerts)
            {
                // 1. Soft-delete PropertyCertificate
                cert.MarkForDeletion();
                cert.UpdatedBy = userId;
                cert.UpdatedDate = currentDate;

                deletedCertIds.Add(cert.Id);
            }

            // 2. Clean up attached DocumentBinding and Document if present
            if (docBindingRepo != null)
            {
                var bindingIdsToDelete = matchingCerts
                    .Where(c => c.DocumentBindingId.HasValue)
                    .Select(c => c.DocumentBindingId!.Value)
                    .Distinct()
                    .ToList();

                if (bindingIdsToDelete.Count > 0)
                {
                    var bindingsToDelete = await docBindingRepo.GetQueryable()
                        .Where(b => bindingIdsToDelete.Contains(b.Id) && b.IsActive && !b.MarkedForDeletion)
                        .ToListAsync(cancellationToken);

                    foreach (var b in bindingsToDelete)
                    {
                        b.MarkForDeletion();
                        b.UpdatedBy = userId;
                        b.UpdatedDate = currentDate;
                    }

                    var docIdsToCheck = bindingsToDelete.Select(b => b.DocumentId).Distinct().ToList();
                    var allDeletedBindingIds = bindingsToDelete.Select(b => b.Id).ToHashSet();

                    if (docRepo != null && docIdsToCheck.Count > 0)
                    {
                        var documentsToSoftDelete = new List<int>();
                        foreach (var docId in docIdsToCheck)
                        {
                            // Check if any other active document binding still uses this document excluding all bindings being deleted
                            var hasOtherActiveBindings = await docBindingRepo.GetQueryable().AsNoTracking()
                                .AnyAsync(b => b.DocumentId == docId &&
                                               !allDeletedBindingIds.Contains(b.Id) &&
                                               b.IsActive && !b.MarkedForDeletion, cancellationToken);

                            if (!hasOtherActiveBindings)
                            {
                                documentsToSoftDelete.Add(docId);
                            }
                        }

                        if (documentsToSoftDelete.Count > 0)
                        {
                            var docs = await docRepo.GetQueryable()
                                .Where(d => documentsToSoftDelete.Contains(d.Id) && d.IsActive && !d.MarkedForDeletion)
                                .ToListAsync(cancellationToken);

                            foreach (var doc in docs)
                            {
                                doc.MarkForDeletion(userId);
                                doc.UpdatedBy = userId;
                                doc.UpdatedDate = currentDate;
                            }
                        }
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        // Trigger tax recalculation ONLY if the certificate type is taxable AND at least one certificate was deleted
        if (isTaxable && deletedCertIds.Count > 0)
        {
            if (request.Level == CertificateRecordLevel.Apartment || request.Level == CertificateRecordLevel.Wing)
            {
                var targetEntityType = request.Level == CertificateRecordLevel.Apartment ? "S" : "W";
                var targetSocId = request.SocietyDetailId;
                var targetWingId = request.Level == CertificateRecordLevel.Wing ? request.WingDetailId : null;

                if (_taxRecalculationBackgroundService != null)
                {
                    backgroundJobId = await _taxRecalculationBackgroundService.EnqueueSocietyOrWingRecalculationAsync(
                        targetEntityType, targetSocId, targetWingId, userId, request.CertificateTypeId, cancellationToken);

                    recalculationSummary = new PropertyTaxRecalculationSummaryDto
                    {
                        JobId = backgroundJobId,
                        TotalProperties = affectedPropertyIds.Count,
                        SucceededCount = 0,
                        FailedCount = 0
                    };
                }
                else
                {
                    var summary = new PropertyTaxRecalculationSummaryDto { TotalProperties = affectedPropertyIds.Count };
                    foreach (var propId in affectedPropertyIds)
                    {
                        try
                        {
                            // RV, then the retrospective engine, under the property's retrospective lock
                            await _retrospectiveTaxRefresher.RefreshAsync(propId, userId, cancellationToken: cancellationToken);
                            summary.SucceededCount++;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Tax recalculation failed for PropertyId={PropertyId} after certificate record deletion.", propId);
                            summary.FailedCount++;
                        }
                    }
                    recalculationSummary = summary;
                }
            }
            else
            {
                // Unit level: publish PropertyCertificateChangedEvent for each affected unit
                foreach (var propId in affectedPropertyIds)
                {
                    await _publisher.Publish(new PropertyCertificateChangedEvent(propId, userId), cancellationToken);
                }
            }
        }

        _logger.LogInformation(
            "DeleteCertificateRecordAsync completed: Scope={Scope}, DeletedCount={Count}, TaxRecalculationTriggered={TaxTriggered}, JobId={JobId}",
            effectiveScope, deletedCertIds.Count, isTaxable && deletedCertIds.Count > 0 && affectedPropertyIds.Count > 0, backgroundJobId);

        return new DeleteCertificateRecordResponseDto
        {
            EffectiveScope = effectiveScope,
            DeletedPropertyCertificateIds = deletedCertIds,
            DeletedCount = deletedCertIds.Count,
            TaxRecalculationTriggered = isTaxable && deletedCertIds.Count > 0 && affectedPropertyIds.Count > 0,
            JobId = backgroundJobId,
            RecalculationSummary = recalculationSummary
        };
    }

    private sealed record DocumentBindingResult(int BindingId, Guid DocumentGuid);

    private async Task<DocumentBindingResult?> BindDocumentToCertificatesAsync(
        List<int> propertyCertificateIds,
        string? documentGuidString,
        int? societyDetailId,
        int userId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(documentGuidString) ||
            !Guid.TryParse(documentGuidString, out var docGuid) ||
            docGuid == Guid.Empty ||
            propertyCertificateIds == null ||
            propertyCertificateIds.Count == 0)
        {
            return null;
        }

        var doc = await _documentApplicationService.GetDocumentAsync(docGuid, cancellationToken);
        if (doc == null)
        {
            _logger.LogWarning("BindDocumentToCertificatesAsync: DocumentGuid {DocumentGuid} not found in Documents table.", docGuid);
            return null;
        }

        var (departmentId, moduleId) = await GetDepartmentAndModuleIdsAsync(cancellationToken);

        using var scope = _serviceProvider?.CreateScope();
        var docService = _documentService ?? scope?.ServiceProvider.GetService<IDocumentService>();
        var bindingRepo = _documentBindingRepository ?? scope?.ServiceProvider.GetService<IRepository<DocumentBindingEntity, int>>();

        DocumentBindingResult? lastBound = null;

        foreach (var certId in propertyCertificateIds)
        {
            try
            {
                int bindingId;
                if (docService != null)
                {
                    bindingId = await docService.CreateDocumentBindingAsync(
                        documentId: doc.Id,
                        departmentId: departmentId,
                        moduleId: moduleId,
                        referenceTableName: "PropertyCertificates",
                        referenceTableId: certId,
                        referenceTableIdGuid: null,
                        referencePropertyName: "DocumentBindingId",
                        bindingPurpose: DocumentBindingPurpose.MainDocument.ToPurposeString(),
                        isPrimaryDocument: true,
                        authDepartmentId: departmentId,
                        authReferenceId: societyDetailId,
                        createdBy: userId,
                        cancellationToken: cancellationToken);
                }
                else if (bindingRepo != null)
                {
                    var binding = DocumentBindingEntity.CreateWithIntReference(
                        documentId: doc.Id,
                        departmentId: departmentId,
                        moduleId: moduleId,
                        referenceTableName: "PropertyCertificates",
                        referenceTableId: certId,
                        referencePropertyName: "DocumentBindingId",
                        bindingPurpose: DocumentBindingPurpose.MainDocument.ToPurposeString());
                    binding.IsPrimaryDocument = true;
                    binding.CreatedBy = userId;
                    binding.CreatedDate = DateTime.Now;
                    await bindingRepo.AddAsync(binding, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    bindingId = binding.Id;
                }
                else
                {
                    _logger.LogError("BindDocumentToCertificatesAsync: Neither IDocumentService nor DocumentBindingRepository available.");
                    continue;
                }

                await _propertyCertificateService.UpdateDocumentBindingAsync(
                    certId,
                    bindingId,
                    userId,
                    cancellationToken);

                lastBound = new DocumentBindingResult(bindingId, doc.DocumentGuid);

                _logger.LogInformation(
                    "BindDocumentToCertificatesAsync: Successfully bound Document {DocumentId} (BindingId={BindingId}) to PropertyCertificate {CertId}",
                    doc.Id, bindingId, certId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "BindDocumentToCertificatesAsync: Failed to bind Document {DocumentId} to PropertyCertificate {CertId}",
                    doc.Id, certId);
            }
        }

        return lastBound;
    }

    /// <summary>
    /// Validates that an active Occupancy Certificate (OC) date is not earlier than an active
    /// Completion Certificate (CC) date for the property, based on CertificateTypeCode -- applied
    /// to the FINAL state a bulk save would produce (existing certificates the batch doesn't touch,
    /// overlaid with what this batch enables/disables/dates), not just the incoming DTOs in
    /// isolation. Only CC and OC participate; Electric Bill has no configured date-order rule.
    /// </summary>
    private static void ValidateCcOcDateOrder(
        PropertyCertificateBulkSaveDto bulkDto,
        Dictionary<int, string> typeCodeById,
        List<PropertyCertificateEntity> existingCertificates)
    {
        DateTime? ccDate = null;
        DateTime? ocDate = null;

        foreach (var cert in existingCertificates)
        {
            if (!cert.IsActive || cert.MarkedForDeletion) continue;
            var code = typeCodeById.GetValueOrDefault(cert.CertificateTypeId);
            if (string.Equals(code, "CC", StringComparison.OrdinalIgnoreCase))
            {
                ccDate = cert.IssueDate;
            }
            else if (string.Equals(code, "OC", StringComparison.OrdinalIgnoreCase))
            {
                ocDate = cert.IssueDate;
            }
        }

        foreach (var certDto in bulkDto.Certificates)
        {
            var code = typeCodeById.GetValueOrDefault(certDto.CertificateTypeId);
            if (certDto.IsEnabled)
            {
                if (string.Equals(code, "CC", StringComparison.OrdinalIgnoreCase))
                {
                    ccDate = certDto.CertificateDate;
                }
                else if (string.Equals(code, "OC", StringComparison.OrdinalIgnoreCase))
                {
                    ocDate = certDto.CertificateDate;
                }
            }
            else
            {
                if (string.Equals(code, "CC", StringComparison.OrdinalIgnoreCase))
                {
                    ccDate = null;
                }
                else if (string.Equals(code, "OC", StringComparison.OrdinalIgnoreCase))
                {
                    ocDate = null;
                }
            }
        }

        if (ccDate.HasValue && ocDate.HasValue && ocDate.Value.Date < ccDate.Value.Date)
        {
            throw new InvalidOperationException(
                $"Occupancy Certificate (OC) date ({ocDate.Value:dd-MM-yyyy}) cannot be earlier than Completion Certificate (CC) date ({ccDate.Value:dd-MM-yyyy}).");
        }
    }

    public async Task<List<object>> GetCertificateTypeMasterAsync(CancellationToken cancellationToken = default)
    {
        var types = await _certificateTypeRepository.GetQueryable()
            .AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .Select(t => new
            {
                certificateTypeId = t.Id,
                certificateTypeCode = t.CertificateTypeCode,
                certificateTypeName = t.CertificateTypeName,
                description = t.Description,
                displayOrder = t.DisplayOrder,
                badgeCode = t.CertificateTypeCode != null && t.CertificateTypeCode.Length >= 2 ? t.CertificateTypeCode.Substring(0, 2).ToUpper() : "DOC"
            })
            .ToListAsync(cancellationToken);

        return types.Cast<object>().ToList();
    }

    public async Task<List<PropertyWingLookupDto>> GetWingsByPropertyAsync(int propertyId, int? societyId = null, CancellationToken cancellationToken = default)
    {
        var wingMap = new Dictionary<int, (int wingDetailId, string wingName, int? societyDetailId)>();

        var wingDetailsQuery = _wingDetailsMastRepository.GetQueryable().AsNoTracking()
            .Where(wd => wd.IsActive && !wd.MarkedForDeletion);

        var wingQuery = _wingRepository.GetQueryable().AsNoTracking()
            .Where(wm => wm.IsActive);

        var societyQuery = _societyRepository.GetQueryable().AsNoTracking()
            .Where(s => s.IsActive && !s.MarkedForDeletion);

        var propertyQuery = _propertyRepository.GetQueryable().AsNoTracking()
            .Where(pm => pm.IsActive && !pm.MarkedForDeletion);

        // Path 0 (PRIMARY & DIRECT):
        // Resolve the canonical SocietyDetailsMastId first, then query wings only by that ID.
        // Precedence: explicit societyId > propertyId resolved via SocietyDetailsMast.PropertyId.
        // This avoids cross-domain comparison where propertyId could be treated as SocietyDetailsMastId.
        int? resolvedSocietyId = null;

        if (societyId.HasValue && societyId.Value > 0)
        {
            // Explicit societyId takes absolute precedence — validate it exists and is active
            var societyExists = await societyQuery.AnyAsync(s => s.Id == societyId.Value, cancellationToken);
            if (societyExists)
            {
                resolvedSocietyId = societyId.Value;
            }
        }

        if (!resolvedSocietyId.HasValue && propertyId > 0)
        {
            // Resolve society from PropertyMast.Id via SocietyDetailsMast.PropertyId
            resolvedSocietyId = await societyQuery
                .Where(s => s.PropertyId == propertyId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (resolvedSocietyId.HasValue)
        {
            var directSocietyWings = await (
                from wd in wingDetailsQuery
                where wd.SocietyDetailsMastId == resolvedSocietyId.Value
                join wm in wingQuery on wd.WingMasterId equals wm.Id into wmJoin
                from wm in wmJoin.DefaultIfEmpty()
                select new
                {
                    WingDetailId = wd.Id,
                    WingName = wd.WingName ?? (wm != null ? wm.WingNo : null),
                    WingNo = wm != null ? wm.WingNo : null,
                    SocietyDetailId = (int?)wd.SocietyDetailsMastId
                })
                .ToListAsync(cancellationToken);

            foreach (var w in directSocietyWings)
            {
                var name = w.WingName ?? w.WingNo;
                if (!string.IsNullOrWhiteSpace(name) && !wingMap.ContainsKey(w.WingDetailId))
                {
                    wingMap[w.WingDetailId] = (w.WingDetailId, name, w.SocietyDetailId ?? resolvedSocietyId);
                }
            }

            // If exact society wings exist for this property, return them directly to avoid mixing with unrelated properties
            if (wingMap.Count > 0)
            {
                return wingMap.Values
                    .OrderBy(w => w.wingDetailId)
                    .Select(w => new PropertyWingLookupDto
                    {
                        WingDetailId = w.wingDetailId,
                        WingName = w.wingName,
                        SocietyDetailId = w.societyDetailId
                    })
                    .ToList();
            }
        }

        // Fallback paths (1-3): No society was resolved directly — use the property's ward/property-no to find wings
        var targetProperty = await _propertyRepository.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);

        if (targetProperty != null)
        {
            var targetWardId = targetProperty.WardId;
            var targetPropertyNo = targetProperty.PropertyNo ?? string.Empty;
            var cleanPropertyNo = targetPropertyNo.Contains('/') ? targetPropertyNo.Split('/')[0].Trim() : targetPropertyNo.Trim();

            // Path 1: Target property's own WingDetailId -> find parent society -> find all society wings
            if (targetProperty.WingDetailId.HasValue)
            {
                var targetWing = await wingDetailsQuery
                    .FirstOrDefaultAsync(wd => wd.Id == targetProperty.WingDetailId.Value, cancellationToken);

                if (targetWing != null && targetWing.SocietyDetailsMastId > 0)
                {
                    var societyWings = await (
                        from wd in wingDetailsQuery
                        where wd.SocietyDetailsMastId == targetWing.SocietyDetailsMastId
                        join wm in wingQuery on wd.WingMasterId equals wm.Id into wmJoin
                        from wm in wmJoin.DefaultIfEmpty()
                        select new
                        {
                            WingDetailId = wd.Id,
                            WingName = wd.WingName ?? (wm != null ? wm.WingNo : null),
                            WingNo = wm != null ? wm.WingNo : null,
                            SocietyDetailId = (int?)wd.SocietyDetailsMastId
                        })
                        .ToListAsync(cancellationToken);

                    foreach (var w in societyWings)
                    {
                        var name = w.WingName ?? w.WingNo;
                        if (!string.IsNullOrWhiteSpace(name) && !wingMap.ContainsKey(w.WingDetailId))
                        {
                            wingMap[w.WingDetailId] = (w.WingDetailId, name, w.SocietyDetailId ?? targetWing.SocietyDetailsMastId);
                        }
                    }

                    if (wingMap.Count > 0)
                    {
                        return wingMap.Values
                            .OrderBy(w => w.wingDetailId)
                            .Select(w => new PropertyWingLookupDto
                            {
                                WingDetailId = w.wingDetailId,
                                WingName = w.wingName,
                                SocietyDetailId = w.societyDetailId
                            })
                            .ToList();
                    }
                }
            }

            // Path 2: Sibling properties sharing WardId + PropertyNo (exact or prefix) with WingDetailId
            var wingsFromProperties = await (
                from pm in propertyQuery
                where pm.WardId == targetWardId &&
                      (pm.PropertyNo == targetPropertyNo || pm.PropertyNo == cleanPropertyNo || (pm.PropertyNo != null && pm.PropertyNo.StartsWith(cleanPropertyNo))) &&
                      pm.WingDetailId.HasValue
                join wd in wingDetailsQuery on pm.WingDetailId!.Value equals wd.Id
                join wm in wingQuery on wd.WingMasterId equals wm.Id into wmJoin
                from wm in wmJoin.DefaultIfEmpty()
                select new
                {
                    WingDetailId = wd.Id,
                    WingName = wd.WingName ?? (wm != null ? wm.WingNo : null),
                    WingNo = wm != null ? wm.WingNo : null,
                    SocietyDetailId = (int?)wd.SocietyDetailsMastId
                })
                .ToListAsync(cancellationToken);

            foreach (var w in wingsFromProperties)
            {
                var name = w.WingName ?? w.WingNo;
                if (!string.IsNullOrWhiteSpace(name) && !wingMap.ContainsKey(w.WingDetailId))
                {
                    wingMap[w.WingDetailId] = (w.WingDetailId, name, w.SocietyDetailId);
                }
            }

            // Path 3: SocietyDetailsMast linked to target property or sibling properties
            var wingsFromSociety = await (
                from s in societyQuery
                join sp in propertyQuery on s.PropertyId equals sp.Id
                where sp.WardId == targetWardId && (sp.PropertyNo == targetPropertyNo || sp.PropertyNo == cleanPropertyNo || (sp.PropertyNo != null && sp.PropertyNo.StartsWith(cleanPropertyNo)))
                join wd in wingDetailsQuery on s.Id equals wd.SocietyDetailsMastId
                join wm in wingQuery on wd.WingMasterId equals wm.Id into wmJoin
                from wm in wmJoin.DefaultIfEmpty()
                select new
                {
                    WingDetailId = wd.Id,
                    WingName = wd.WingName ?? (wm != null ? wm.WingNo : null),
                    WingNo = wm != null ? wm.WingNo : null,
                    SocietyDetailId = (int?)s.Id
                })
                .ToListAsync(cancellationToken);

            foreach (var w in wingsFromSociety)
            {
                var name = w.WingName ?? w.WingNo;
                if (!string.IsNullOrWhiteSpace(name) && !wingMap.ContainsKey(w.WingDetailId))
                {
                    wingMap[w.WingDetailId] = (w.WingDetailId, name, w.SocietyDetailId);
                }
            }
        }

        return wingMap.Values
            .OrderBy(w => w.wingDetailId)
            .Select(w => new PropertyWingLookupDto
            {
                WingDetailId = w.wingDetailId,
                WingName = w.wingName,
                SocietyDetailId = w.societyDetailId
            })
            .ToList();
    }

    public async Task<List<object>> GetUnitsByPropertyAsync(int propertyId, int? wingDetailId = null, CancellationToken cancellationToken = default)
    {
        var propertyDetailsQuery = _propertyDetailsRepository.GetQueryable()
            .AsNoTracking()
            .Where(pd => pd.IsActive && !pd.MarkedForDeletion);

        var propertyQuery = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion);

        var wingDetailsQuery = _wingDetailsMastRepository.GetQueryable()
            .AsNoTracking()
            .Where(wd => wd.IsActive && !wd.MarkedForDeletion);

        var wingQuery = _wingRepository.GetQueryable()
            .AsNoTracking()
            .Where(wm => wm.IsActive);

        // 1. If wingDetailId is specified, fetch all units linked to that wingDetailId via PropertyMast
        if (wingDetailId.HasValue && wingDetailId.Value > 0)
        {
            var properties = await (
                from pm in propertyQuery
                where pm.WingDetailId == wingDetailId.Value
                join wd in wingDetailsQuery on pm.WingDetailId.Value equals wd.Id into wdJoin
                from wd in wdJoin.DefaultIfEmpty()
                join wm in wingQuery on wd.WingMasterId equals wm.Id into wmJoin
                from wm in wmJoin.DefaultIfEmpty()
                select new
                {
                    PropertyId = pm.Id,
                    PartitionNo = pm.PartitionNo ?? pm.PropertyNo,
                    FlatOrShopNo = pm.FlatOrShopNo,
                    Type = pm.Type,
                    WingDetailId = pm.WingDetailId ?? 0,
                    WingName = wd != null ? (wd.WingName ?? (wm != null ? wm.WingNo : null)) : null,
                    WingNo = wm != null ? wm.WingNo : null
                }
            ).ToListAsync(cancellationToken);

            if (properties.Count > 0)
            {
                var propIds = properties.Select(p => p.PropertyId).ToList();
                var details = await propertyDetailsQuery
                    .Where(pd => propIds.Contains(pd.PropertyId))
                    .Include(pd => pd.Floor)
                    .Include(pd => pd.TypeOfUse)
                    .ToListAsync(cancellationToken);

                await ResolveMissingFloorAndUseDescriptionsAsync(details, cancellationToken);

                var detailsByPropId = details
                    .GroupBy(pd => pd.PropertyId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var unitProperties = properties.Where(u =>
                {
                    var hasDetails = detailsByPropId.TryGetValue(u.PropertyId, out var pds) && pds.Count > 0;
                    if (hasDetails) return true;

                    var hasFlatOrType = !string.IsNullOrWhiteSpace(u.FlatOrShopNo) || !string.IsNullOrWhiteSpace(u.Type);
                    if (hasFlatOrType) return true;

                    var isWingOrSocietyContainer = string.IsNullOrWhiteSpace(u.PartitionNo)
                        || string.Equals(u.PartitionNo, u.WingNo, StringComparison.OrdinalIgnoreCase)
                        || string.Equals(u.PartitionNo, u.WingName, StringComparison.OrdinalIgnoreCase);

                    return !isWingOrSocietyContainer;
                }).ToList();

                var sorted = unitProperties
                    .OrderBy(u => System.Text.RegularExpressions.Regex.Replace(u.PartitionNo ?? string.Empty, @"\d+", m => m.Value.PadLeft(10, '0')), StringComparer.OrdinalIgnoreCase)
                    .ThenBy(u => u.PropertyId)
                    .ToList();

                return sorted.Select(u =>
                {
                    var pds = detailsByPropId.TryGetValue(u.PropertyId, out var list) ? list : new List<PropertyDetailsEntity>();
                    return MapUnitResponse(u.PropertyId, u.PartitionNo, u.WingDetailId, u.WingName, pds);
                }).ToList();
            }
        }

        // 2. Fallback: query target property and its siblings sharing WardId + PropertyNo
        var targetProperty = await propertyQuery.FirstOrDefaultAsync(p => p.Id == propertyId, cancellationToken);
        if (targetProperty != null)
        {
            var targetWardId = targetProperty.WardId;
            var targetPropertyNo = targetProperty.PropertyNo ?? string.Empty;
            var cleanPropertyNo = targetPropertyNo.Contains('/') ? targetPropertyNo.Split('/')[0].Trim() : targetPropertyNo.Trim();

            var siblingProperties = await (
                from pm in propertyQuery
                where pm.WardId == targetWardId &&
                      (pm.PropertyNo == targetPropertyNo || pm.PropertyNo == cleanPropertyNo ||
                       (pm.PropertyNo != null && (pm.PropertyNo.StartsWith(cleanPropertyNo + "/") || pm.PropertyNo.StartsWith(cleanPropertyNo + "-"))))
                join wd in wingDetailsQuery on pm.WingDetailId equals wd.Id into wdJoin
                from wd in wdJoin.DefaultIfEmpty()
                join wm in wingQuery on wd.WingMasterId equals wm.Id into wmJoin
                from wm in wmJoin.DefaultIfEmpty()
                select new
                {
                    PropertyId = pm.Id,
                    PartitionNo = pm.PartitionNo ?? pm.PropertyNo,
                    FlatOrShopNo = pm.FlatOrShopNo,
                    Type = pm.Type,
                    WingDetailId = pm.WingDetailId ?? 0,
                    WingName = wd != null ? (wd.WingName ?? (wm != null ? wm.WingNo : null)) : null,
                    WingNo = wm != null ? wm.WingNo : null
                }
            ).ToListAsync(cancellationToken);

            if (siblingProperties.Count > 0)
            {
                var propIds = siblingProperties.Select(p => p.PropertyId).ToList();
                var details = await propertyDetailsQuery
                    .Where(pd => propIds.Contains(pd.PropertyId))
                    .Include(pd => pd.Floor)
                    .Include(pd => pd.TypeOfUse)
                    .ToListAsync(cancellationToken);

                await ResolveMissingFloorAndUseDescriptionsAsync(details, cancellationToken);

                var detailsByPropId = details
                    .GroupBy(pd => pd.PropertyId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var unitProperties = siblingProperties.Where(u =>
                {
                    var hasDetails = detailsByPropId.TryGetValue(u.PropertyId, out var pds) && pds.Count > 0;
                    if (hasDetails) return true;

                    var hasFlatOrType = !string.IsNullOrWhiteSpace(u.FlatOrShopNo) || !string.IsNullOrWhiteSpace(u.Type);
                    if (hasFlatOrType) return true;

                    var isWingOrSocietyContainer = string.IsNullOrWhiteSpace(u.PartitionNo)
                        || string.Equals(u.PartitionNo, u.WingNo, StringComparison.OrdinalIgnoreCase)
                        || string.Equals(u.PartitionNo, u.WingName, StringComparison.OrdinalIgnoreCase);

                    return !isWingOrSocietyContainer;
                }).ToList();

                if (unitProperties.Count == 0 && siblingProperties.Any(p => p.PropertyId == propertyId))
                {
                    unitProperties = siblingProperties.Where(p => p.PropertyId == propertyId).ToList();
                }

                var sorted = unitProperties
                    .OrderBy(u => System.Text.RegularExpressions.Regex.Replace(u.PartitionNo ?? string.Empty, @"\d+", m => m.Value.PadLeft(10, '0')), StringComparer.OrdinalIgnoreCase)
                    .ThenBy(u => u.PropertyId)
                    .ToList();

                return sorted.Select(u =>
                {
                    var pds = detailsByPropId.TryGetValue(u.PropertyId, out var list) ? list : new List<PropertyDetailsEntity>();
                    return MapUnitResponse(u.PropertyId, u.PartitionNo, u.WingDetailId, u.WingName, pds);
                }).ToList();
            }
        }

        // 3. Final Fallback: Direct PropertyDetails for target propertyId
        var targetProp = await propertyQuery.FirstOrDefaultAsync(p => p.Id == propertyId, cancellationToken);
        var targetWingDetailId = targetProp?.WingDetailId ?? 0;
        string? targetWingName = null;
        if (targetWingDetailId > 0)
        {
            targetWingName = await (
                from wd in wingDetailsQuery
                where wd.Id == targetWingDetailId
                join wm in wingQuery on wd.WingMasterId equals wm.Id into wmJoin
                from wm in wmJoin.DefaultIfEmpty()
                select wd.WingName ?? (wm != null ? wm.WingNo : null)
            ).FirstOrDefaultAsync(cancellationToken);
        }

        var floors = await propertyDetailsQuery
            .Where(pd => pd.PropertyId == propertyId)
            .Include(pd => pd.Floor)
            .Include(pd => pd.TypeOfUse)
            .ToListAsync(cancellationToken);

        if (floors.Count > 0)
        {
            await ResolveMissingFloorAndUseDescriptionsAsync(floors, cancellationToken);
            var unitNumber = targetProp?.PartitionNo ?? targetProp?.PropertyNo;
            return new List<object>
            {
                MapUnitResponse(propertyId, unitNumber, targetWingDetailId, targetWingName, floors)
            };
        }

        return new List<object>();
    }

    private async Task ResolveMissingFloorAndUseDescriptionsAsync(List<PropertyDetailsEntity> details, CancellationToken cancellationToken)
    {
        var missingFloorIds = details
            .Where(d => (d.Floor == null || string.IsNullOrWhiteSpace(d.Floor.Description)) && d.FloorId.HasValue && d.FloorId.Value > 0)
            .Select(d => d.FloorId!.Value)
            .Distinct()
            .ToList();

        var missingUseIds = details
            .Where(d => (d.TypeOfUse == null || string.IsNullOrWhiteSpace(d.TypeOfUse.Description)) && d.TypeOfUseId > 0)
            .Select(d => d.TypeOfUseId)
            .Distinct()
            .ToList();

        if (missingFloorIds.Count == 0 && missingUseIds.Count == 0)
            return;

        using var scope = _serviceProvider?.CreateScope();
        var sp = scope?.ServiceProvider;
        if (sp == null)
            return;

        if (missingFloorIds.Count > 0)
        {
            var floorRepo = sp.GetService<IRepository<FloorEntity, int>>();
            if (floorRepo != null)
            {
                var floorMap = await floorRepo.GetQueryable().AsNoTracking()
                    .Where(f => missingFloorIds.Contains(f.Id))
                    .ToDictionaryAsync(f => f.Id, f => f.Description, cancellationToken);

                foreach (var d in details)
                {
                    if ((d.Floor == null || string.IsNullOrWhiteSpace(d.Floor.Description)) &&
                        d.FloorId.HasValue &&
                        floorMap.TryGetValue(d.FloorId.Value, out var floorDesc) &&
                        !string.IsNullOrWhiteSpace(floorDesc))
                    {
                        d.Floor ??= new FloorEntity { Id = d.FloorId.Value };
                        d.Floor.Description = floorDesc;
                    }
                }
            }
        }

        if (missingUseIds.Count > 0)
        {
            var useRepo = sp.GetService<IRepository<TypeOfUseEntity, int>>();
            if (useRepo != null)
            {
                var useMap = await useRepo.GetQueryable().AsNoTracking()
                    .Where(u => missingUseIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.Description, cancellationToken);

                foreach (var d in details)
                {
                    if ((d.TypeOfUse == null || string.IsNullOrWhiteSpace(d.TypeOfUse.Description)) &&
                        useMap.TryGetValue(d.TypeOfUseId, out var useDesc) &&
                        !string.IsNullOrWhiteSpace(useDesc))
                    {
                        d.TypeOfUse ??= new TypeOfUseEntity { Id = d.TypeOfUseId };
                        d.TypeOfUse.Description = useDesc;
                    }
                }
            }
        }
    }

    private static object MapUnitResponse(
        int propertyId,
        string? unitNo,
        int wingDetailId,
        string? wingName,
        List<PropertyDetailsEntity> pds)
    {
        var pdIds = pds.Select(pd => pd.Id).Distinct().ToList();
        var firstPd = pds.FirstOrDefault();

        return new
        {
            propertyId,
            propertyDetailsId = pdIds,
            unitNo = unitNo ?? string.Empty,
            wingDetailId,
            wingName = wingName ?? string.Empty,
            constructionYear = pds.Select(pd => pd.ConstructionYear).FirstOrDefault(y => !string.IsNullOrWhiteSpace(y)) ?? firstPd?.ConstructionYear ?? string.Empty,
            floorId = firstPd?.FloorId,
            floorName = firstPd?.Floor?.Description ?? string.Empty,
            useId = firstPd?.TypeOfUseId,
            useName = firstPd?.TypeOfUse?.Description ?? string.Empty,
            isSelected = false,
            floors = pds.Select(pd => new
            {
                propertyDetailsId = pd.Id,
                floorId = pd.FloorId,
                floorName = pd.Floor?.Description ?? string.Empty,
                useId = pd.TypeOfUseId,
                useName = pd.TypeOfUse?.Description ?? string.Empty,
                constructionYear = pd.ConstructionYear ?? string.Empty
            }).ToList()
        };
    }

    public async Task<(List<object> Items, int TotalCount)> GetUnitsByPropertyPagedAsync(
        int propertyId,
        int? wingDetailId = null,
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var allUnits = await GetUnitsByPropertyAsync(propertyId, wingDetailId, cancellationToken);
        var totalCount = allUnits.Count;
        var safePage = Math.Max(1, pageNumber);
        var safeSize = Math.Max(1, pageSize);

        var pagedItems = allUnits
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToList();

        return (pagedItems, totalCount);
    }

    public async Task<List<PropertyCertificateDto>> GetByPropertyIdAsync(
        int propertyId,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(propertyId, nameof(propertyId));

        using var scope = _serviceProvider?.CreateScope();
        var sp = scope?.ServiceProvider;

        var certRepo = _propertyCertificateRepository ?? sp?.GetService<IRepository<PropertyCertificateEntity>>();
        var docBindingRepo = _documentBindingRepository ?? sp?.GetService<IRepository<DocumentBindingEntity>>();
        var docRepo = _documentRepository ?? sp?.GetService<IRepository<DocumentEntity>>();

        var certTypes = (await _certificateTypeRepository.GetAsync(
            pctm => pctm.IsActive,
            cancellationToken))
            .OrderBy(pctm => pctm.Id)
            .ToList();

        List<PropertyCertificateEntity> certificates = new();
        if (certRepo != null)
        {
            certificates = await certRepo.GetQueryable().AsNoTracking()
                .Where(x => x.PropertyId == propertyId && x.IsActive && !x.MarkedForDeletion)
                .ToListAsync(cancellationToken);
        }
        else
        {
            certificates = await _propertyCertificateService.GetByPropertyIdAsync(
                propertyId,
                PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
                cancellationToken);
        }

        var certLookup = certificates
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        // Resolve wing and society details for fallback inheritance
        var (wingDetailId, societyDetailId) = await ResolvePropertyWingAndSocietyIdsAsync(propertyId, cancellationToken);

        List<PropertyCertificateEntity> wingCertificates = new();
        if (wingDetailId.HasValue && wingDetailId.Value > 0)
        {
            if (certRepo != null)
            {
                wingCertificates = await certRepo.GetQueryable().AsNoTracking()
                    .Where(x => x.EntityType == "W" && x.WingDetailId == wingDetailId.Value && x.IsActive && !x.MarkedForDeletion)
                    .ToListAsync(cancellationToken);
            }
            else
            {
                wingCertificates = await _propertyCertificateService.GetByWingDetailIdAsync(
                    wingDetailId.Value,
                    PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
                    cancellationToken);
            }
        }

        var wingCertLookup = wingCertificates
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        List<PropertyCertificateEntity> societyCertificates = new();
        if (societyDetailId.HasValue && societyDetailId.Value > 0)
        {
            if (certRepo != null)
            {
                societyCertificates = await certRepo.GetQueryable().AsNoTracking()
                    .Where(x => x.EntityType == "S" && x.SocietyDetailId == societyDetailId.Value && x.IsActive && !x.MarkedForDeletion)
                    .ToListAsync(cancellationToken);
            }
            else
            {
                societyCertificates = await _propertyCertificateService.GetBySocietyDetailIdAsync(
                    societyDetailId.Value,
                    PropertyCertificateIncludeOptions.DocumentBinding | PropertyCertificateIncludeOptions.Document,
                    cancellationToken);
            }
        }

        var societyCertLookup = societyCertificates
            .GroupBy(c => c.CertificateTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        var allCandidateCerts = certificates
            .Concat(wingCertificates)
            .Concat(societyCertificates)
            .ToList();

        var bindingIds = allCandidateCerts
            .Where(c => c.DocumentBindingId.HasValue)
            .Select(c => c.DocumentBindingId!.Value)
            .Distinct()
            .ToList();

        Dictionary<int, DocumentBindingEntity> docBindings = new();
        Dictionary<int, DocumentEntity> docs = new();

        if (bindingIds.Count > 0 && docBindingRepo != null)
        {
            var bindings = await docBindingRepo.GetQueryable().AsNoTracking()
                .Where(b => bindingIds.Contains(b.Id) && b.IsActive && !b.MarkedForDeletion)
                .ToListAsync(cancellationToken);

            docBindings = bindings.ToDictionary(b => b.Id);

            var docIds = bindings.Select(b => b.DocumentId).Distinct().ToList();
            if (docIds.Count > 0 && docRepo != null)
            {
                var docList = await docRepo.GetQueryable().AsNoTracking()
                    .Where(d => docIds.Contains(d.Id) && d.IsActive && !d.MarkedForDeletion)
                    .ToListAsync(cancellationToken);

                docs = docList.ToDictionary(d => d.Id);
            }
        }

        var result = new List<PropertyCertificateDto>();

        foreach (var pctm in certTypes)
        {
            var pc = certLookup.GetValueOrDefault(pctm.Id)
                     ?? wingCertLookup.GetValueOrDefault(pctm.Id)
                     ?? societyCertLookup.GetValueOrDefault(pctm.Id);

            var hasCert = pc != null;
            DocumentBindingEntity? db = null;
            DocumentEntity? d = null;

            if (hasCert && pc!.DocumentBindingId.HasValue && docBindings.TryGetValue(pc.DocumentBindingId.Value, out var binding))
            {
                db = binding;
                docs.TryGetValue(binding.DocumentId, out d);
            }

            result.Add(new PropertyCertificateDto
            {
                Id = pc != null ? pc.Id : 0,
                PropertyId = pc != null && pc.PropertyId.HasValue ? pc.PropertyId.Value : propertyId,
                WingDetailId = pc != null ? (pc.WingDetailId ?? (pc.EntityType == "W" ? wingDetailId : null)) : null,
                SocietyDetailId = pc != null ? (pc.SocietyDetailId ?? societyDetailId) : null,
                CertificateTypeId = pctm.Id,
                CertificateTypeName = pctm.CertificateTypeName,
                CertificateTypeCode = pctm.CertificateTypeCode,
                CertificateNo = pc?.CertificateNo,
                IssueDate = pc?.IssueDate,
                PropertyDetailsId = pc?.PropertyDetailsId,
                EntityType = pc?.EntityType ?? "P",
                DocumentBindingId = pc?.DocumentBindingId,
                DocumentId = db?.DocumentId ?? (pc?.DocumentBinding?.DocumentId),
                DocumentGuid = d?.DocumentGuid ?? (pc?.DocumentBinding?.Document?.DocumentGuid)
            });
        }

        return result;
    }

    public async Task<bool> DeleteByDocumentIdAsync(
        int documentId,
        int deletedBy,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(documentId, nameof(documentId));
        Guard.AgainstNegativeOrZero(deletedBy, nameof(deletedBy));

        using var scope = _serviceProvider?.CreateScope();
        var sp = scope?.ServiceProvider;

        var certRepo = _propertyCertificateRepository ?? sp?.GetService<IRepository<PropertyCertificateEntity>>();
        var docBindingRepo = _documentBindingRepository ?? sp?.GetService<IRepository<DocumentBindingEntity>>();
        var docRepo = _documentRepository ?? sp?.GetService<IRepository<DocumentEntity>>();

        if (docBindingRepo == null || certRepo == null || docRepo == null)
        {
            return false;
        }

        var documentBindings = await docBindingRepo.GetQueryable().AsNoTracking()
            .Where(x =>
                x.DocumentId == documentId &&
                (x.ReferenceTableName == "PropertyCertificate" || 
                 x.ReferenceTableName == "PropertyCertificates") &&
                x.IsActive &&
                !x.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        if (documentBindings.Count == 0)
        {
            return false;
        }

        var certIds = documentBindings.Select(b => b.ReferenceTableId).Distinct().ToList();

        var propertyCertificates = await certRepo.GetQueryable()
            .Where(x =>
                certIds.Contains(x.Id) &&
                x.IsActive &&
                !x.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        if (propertyCertificates.Count == 0)
        {
            return false;
        }

        var documentExists = await docRepo.GetQueryable().AsNoTracking()
            .AnyAsync(x =>
                x.Id == documentId &&
                x.IsActive &&
                !x.MarkedForDeletion,
                cancellationToken);

        if (!documentExists)
        {
            return false;
        }

        var currentDate = DateTime.Now;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            foreach (var cert in propertyCertificates)
            {
                cert.MarkForDeletion();
                cert.UpdatedBy = deletedBy;
                cert.UpdatedDate = currentDate;
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var bindingIds = documentBindings.Select(b => b.Id).ToList();
            var bindingUpdated = await docBindingRepo.GetQueryable()
                .Where(x =>
                    bindingIds.Contains(x.Id) &&
                    x.IsActive &&
                    !x.MarkedForDeletion)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.MarkedForDeletion, true)
                    .SetProperty(x => x.IsActive, false)
                    .SetProperty(x => x.UpdatedBy, deletedBy)
                    .SetProperty(x => x.UpdatedDate, currentDate),
                    cancellationToken);

            if (bindingUpdated == 0)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return false;
            }

            var documentUpdated = await docRepo.GetQueryable()
                .Where(x =>
                    x.Id == documentId &&
                    x.IsActive &&
                    !x.MarkedForDeletion)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.MarkedForDeletion, true)
                    .SetProperty(x => x.IsActive, false)
                    .SetProperty(x => x.UpdatedBy, deletedBy)
                    .SetProperty(x => x.UpdatedDate, currentDate),
                    cancellationToken);

            if (documentUpdated == 0)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return false;
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            foreach (var cert in propertyCertificates)
            {
                if (cert.PropertyId.HasValue)
                {
                    var isTaxable = await _certificateTypeRepository.GetQueryable().AsNoTracking()
                        .Where(t => t.Id == cert.CertificateTypeId)
                        .Select(t => t.IsTaxable)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (isTaxable)
                    {
                        await _publisher.Publish(
                            new PropertyCertificateChangedEvent(cert.PropertyId.Value, deletedBy),
                            cancellationToken);
                    }
                }
            }

            return true;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }
}
