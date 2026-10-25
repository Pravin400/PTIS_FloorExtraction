using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.DTOs.PropertyPhoto;
using NtisPlatform.Application.DTOs.PropertyTaxOperations;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Options;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.PropertyMedia;

/// <inheritdoc cref="IPropertyMediaOperationsService"/>
public class PropertyMediaOperationsService : IPropertyMediaOperationsService
{
    private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".pdf", ".wmf" };

    private static readonly Dictionary<string, string> MimeTypesByExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".bmp"] = "image/bmp",
        [".webp"] = "image/webp",
        [".pdf"] = "application/pdf",
        [".wmf"] = "image/x-wmf"
    };

    private readonly IRepository<PropertyMediaJobEntity, int> _jobRepo;
    private readonly IRepository<PropertyMediaJobDetailEntity, int> _jobDetailRepo;
    private readonly IRepository<PropertyPhotoTypeEntity, int> _photoTypeRepo;
    private readonly IRepository<PropertyPhotoEntity, int> _propertyPhotoRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly FileStorageOptions _fileStorageOptions;
    private readonly PropertyMediaDevToolsOptions? _devToolsOptions;
    private readonly IPropertyPhotoApplicationService _propertyPhotoApplicationService;
    private readonly IPropertyMediaFileMatchResolver _fileMatchResolver;
    private readonly FileValidationHelper _fileValidationHelper;
    private readonly IPropertyMediaBrowseSessionStorage _sessionStorage;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PropertyMediaOperationsService> _logger;
    private readonly IMemoryCache _memoryCache;

    private sealed class BrowseUploadSession
    {
        public string PreviewId { get; set; } = string.Empty;
        public int PhotoTypeId { get; set; }
        public string? Remarks { get; set; }
        public OperationContext Context { get; set; } = null!;
        public string JobFolder { get; set; } = string.Empty;
        public List<PropertyMediaJobDetailEntity> Details { get; set; } = new();
        public List<ServerImportImageDto> Dtos { get; set; } = new();
    }

    public PropertyMediaOperationsService(
        IRepository<PropertyMediaJobEntity, int> jobRepo,
        IRepository<PropertyMediaJobDetailEntity, int> jobDetailRepo,
        IRepository<PropertyPhotoTypeEntity, int> photoTypeRepo,
        IRepository<PropertyPhotoEntity, int> propertyPhotoRepo,
        IUnitOfWork unitOfWork,
        IOptions<FileStorageOptions> fileStorageOptions,
        IPropertyPhotoApplicationService propertyPhotoApplicationService,
        IPropertyMediaFileMatchResolver fileMatchResolver,
        FileValidationHelper fileValidationHelper,
        IPropertyMediaBrowseSessionStorage sessionStorage,
        IConfiguration configuration,
        ILogger<PropertyMediaOperationsService> logger,
        IMemoryCache memoryCache,
        IOptions<PropertyMediaDevToolsOptions>? devToolsOptions = null)
    {
        _jobRepo = jobRepo;
        _jobDetailRepo = jobDetailRepo;
        _photoTypeRepo = photoTypeRepo;
        _propertyPhotoRepo = propertyPhotoRepo;
        _unitOfWork = unitOfWork;
        _fileStorageOptions = fileStorageOptions.Value;
        _devToolsOptions = devToolsOptions?.Value;
        _propertyPhotoApplicationService = propertyPhotoApplicationService;
        _fileMatchResolver = fileMatchResolver;
        _fileValidationHelper = fileValidationHelper;
        _sessionStorage = sessionStorage;
        _configuration = configuration;
        _logger = logger;
        _memoryCache = memoryCache;
    }

    // ---------------------------------------------------------------- Browse-upload preview (user-picked files)

    /// <summary>
    /// Preview step for files the user picked via Browse: resolves the SAME Ward+Property match
    /// (<see cref="IPropertyMediaFileMatchResolver"/>) the folder-scan flow uses for every
    /// selected file, saves every file to disk under that job's preview folder
    /// (<see cref="IPropertyMediaBrowseSessionStorage"/>). Nothing is queued for the Worker yet;
    /// call <see cref="ExecuteBrowsedUploadAsync"/> with the returned PreviewId to do that.
    /// </summary>
    public async Task<PropertyMediaBrowsePreviewResultDto> PreviewBrowsedFilesAsync(
        IReadOnlyList<IFormFile> files, int photoTypeId, string? remarks,
        OperationContext context, CancellationToken cancellationToken = default)
    {
        var photoType = await _photoTypeRepo.GetQueryable()
            .FirstOrDefaultAsync(pt => pt.Id == photoTypeId && pt.IsActive, cancellationToken);
        if (photoType is null)
            throw new ArgumentException($"PhotoTypeId {photoTypeId} is not a valid active photo type.", nameof(photoTypeId));

        if (!PropertyMediaFileMatchResolver.IsSupportedImportSubtype(photoType.PhotoTypeName, photoType.PhotoTypeCode))
        {
            var emptyPreviewId = Guid.NewGuid().ToString();
            var emptySession = new BrowseUploadSession
            {
                PreviewId = emptyPreviewId,
                PhotoTypeId = photoTypeId,
                Remarks = remarks,
                Context = context,
                JobFolder = string.Empty,
                Details = new List<PropertyMediaJobDetailEntity>(),
                Dtos = new List<ServerImportImageDto>()
            };

            _memoryCache.Set(
                $"BrowseUploadSession_{emptyPreviewId}",
                emptySession,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2),
                    Size = 1
                });

            return new PropertyMediaBrowsePreviewResultDto
            {
                PreviewId = emptyPreviewId,
                TotalCount = 0,
                TotalMatched = 0,
                TotalUnmatched = 0,
                Items = new List<ServerImportImageDto>()
            };
        }

        var matches = await _fileMatchResolver.ResolveAsync(files.Select(f => f.FileName).ToList(), photoTypeId, cancellationToken);
        var matchByFileName = matches.ToDictionary(m => m.FileName, StringComparer.OrdinalIgnoreCase);

        var previewId = Guid.NewGuid().ToString();

        var itemsToSave = new List<(int Index, Stream Stream, string FileName)>(files.Count);
        var details = new List<PropertyMediaJobDetailEntity>(files.Count);
        var previewDtos = new List<ServerImportImageDto>(files.Count);

        try
        {
            for (var i = 0; i < files.Count; i++)
            {
                var file = files[i];
                itemsToSave.Add((i, file.OpenReadStream(), file.FileName));

                var relativeFileName = $"{i}/{file.FileName}";

                if (!_fileValidationHelper.IsValidFileType(file.ContentType, file.FileName))
                {
                    details.Add(new PropertyMediaJobDetailEntity
                    {
                        FileName = relativeFileName,
                        Status = nameof(PropertyMediaJobDetailStatus.Invalid),
                        Message = _fileValidationHelper.GetInvalidFileTypeMessage(),
                        CreatedBy = context.ActingUserId,
                        CreatedDate = DateTime.Now,
                        IsActive = true
                    });

                    previewDtos.Add(new ServerImportImageDto
                    {
                        FileName = file.FileName,
                        Status = nameof(PropertyMediaJobDetailStatus.Invalid),
                        IsMatched = false,
                        PropertyDisplay = null,
                        SkipReason = nameof(PropertyMediaSkipReason.InvalidFileNameFormat)
                    });
                    continue;
                }

                var match = matchByFileName[file.FileName];
                details.Add(BuildDetailEntityFromMatch(0, relativeFileName, match, context));

                previewDtos.Add(new ServerImportImageDto
                {
                    FileName = file.FileName,
                    Status = match.Status,
                    IsMatched = match.IsMatched,
                    PropertyDisplay = match.PropertyDisplay,
                    SkipReason = match.SkipReason
                });
            }

            var jobFolder = await _sessionStorage.SaveJobFilesAsync(previewId, itemsToSave, cancellationToken);

            var orderedDtos = previewDtos.OrderByDescending(r => r.IsMatched).ToList();

            var session = new BrowseUploadSession
            {
                PreviewId = previewId,
                PhotoTypeId = photoTypeId,
                Remarks = remarks,
                Context = context,
                JobFolder = jobFolder,
                Details = details,
                Dtos = orderedDtos
            };

            _memoryCache.Set(
                $"BrowseUploadSession_{previewId}",
                session,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2),
                    Size = 1
                });

            try
            {
                var sessionJsonPath = Path.Combine(jobFolder, "session.json");
                await File.WriteAllTextAsync(sessionJsonPath, JsonSerializer.Serialize(session), cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to persist browse upload session metadata to disk for {PreviewId}", previewId);
            }

            return new PropertyMediaBrowsePreviewResultDto
            {
                PreviewId = previewId,
                TotalCount = orderedDtos.Count,
                TotalMatched = orderedDtos.Count(r => r.IsMatched),
                TotalUnmatched = orderedDtos.Count(r => !r.IsMatched),
                Items = orderedDtos
            };
        }
        finally
        {
            foreach (var (_, stream, _) in itemsToSave)
            {
                await stream.DisposeAsync();
            }
        }
    }

    /// <summary>
    /// Re-fetches a browse-upload job's match-preview list for display (e.g. GET-based
    /// re-display/paging after the initial <see cref="PreviewBrowsedFilesAsync"/> call) - reads
    /// straight from the <c>PropertyMediaJobDetail</c> rows already persisted for
    /// <paramref name="jobId"/>, no filesystem/session lookup involved. Returns null if
    /// <paramref name="jobId"/> doesn't resolve to an existing browse-upload job.
    /// </summary>
    public Task<PropertyMediaBrowsePreviewResultDto?> GetBrowsedPreviewAsync(
        int jobId, int page, int pageSize, CancellationToken cancellationToken = default)
        => GetBrowsedPreviewAsync(jobId.ToString(), page, pageSize, cancellationToken);

    public async Task<PropertyMediaBrowsePreviewResultDto?> GetBrowsedPreviewAsync(
        string previewId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var session = await GetSessionAsync(previewId, cancellationToken);
        if (session is not null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 200) pageSize = 200;

            var pagedSessionItems = session.Dtos
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PropertyMediaBrowsePreviewResultDto
            {
                PreviewId = previewId,
                Page = page,
                PageSize = pageSize,
                TotalCount = session.Dtos.Count,
                TotalMatched = session.Dtos.Count(r => r.IsMatched),
                TotalUnmatched = session.Dtos.Count(r => !r.IsMatched),
                Items = pagedSessionItems
            };
        }

        if (!int.TryParse(previewId, out var dbJobId))
            return null;

        var jobExists = await _jobRepo.GetQueryable()
            .AnyAsync(j => j.Id == dbJobId
                && j.Operation == nameof(PropertyMediaJobOperation.BulkImportBrowsedFiles)
                && !j.MarkedForDeletion, cancellationToken);
        if (!jobExists)
            return null;

        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 200) pageSize = 200;

        var allDetails = await _jobDetailRepo.GetQueryable()
            .AsNoTracking()
            .Where(d => d.JobId == dbJobId && !d.MarkedForDeletion)
            .OrderBy(d => d.Id)
            .ToListAsync(cancellationToken);

        // Matched files first, then the rest - same ordering convention used elsewhere. LINQ's
        // OrderByDescending is stable, so ties keep their Id order from the query above.
        var orderedResults = allDetails
            .Select(d =>
            {
                var isMatched = d.Status == nameof(PropertyMediaJobDetailStatus.Pending) || d.Status == nameof(PropertyMediaJobDetailStatus.Matched);
                var displayStatus = isMatched ? nameof(PropertyMediaJobDetailStatus.Matched) : d.Status;
                return new ServerImportImageDto
                {
                    FileName = Path.GetFileName(d.FileName),
                    Status = displayStatus,
                    IsMatched = isMatched,
                    PropertyDisplay = isMatched ? $"Ward {d.WardNo} - Property {d.PropertyNo} - {d.PartitionNo}" : null,
                    SkipReason = d.SkipReason
                };
            })
            .OrderByDescending(r => r.IsMatched)
            .ToList();

        var pagedItems = orderedResults
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PropertyMediaBrowsePreviewResultDto
        {
            PreviewId = previewId,
            Page = page,
            PageSize = pageSize,
            TotalCount = orderedResults.Count,
            TotalMatched = orderedResults.Count(r => r.IsMatched),
            TotalUnmatched = orderedResults.Count(r => !r.IsMatched),
            Items = pagedItems
        };
    }

    /// <summary>
    /// Builds a persisted detail row for one resolved match: <see cref="PropertyMediaJobDetailStatus.Pending"/>
    /// (matched, awaiting confirmation - the same status a queued-and-ready local-folder file
    /// already gets) if matched, otherwise the resolver's own NoMatch/Invalid status/message -
    /// identical mapping <see cref="ProcessDetailAsync"/> already uses for the same
    /// <see cref="PropertyMediaFileMatchResult"/> shape.
    /// </summary>
    private static PropertyMediaJobDetailEntity BuildDetailEntityFromMatch(
        int jobId, string relativeFileName, PropertyMediaFileMatchResult match, OperationContext context)
    {
        var entity = new PropertyMediaJobDetailEntity
        {
            JobId = jobId,
            FileName = relativeFileName,
            WardNo = match.WardNo,
            PropertyNo = match.PropertyNo,
            PartitionNo = match.PartitionNo,
            Suffix = match.Suffix,
            CreatedBy = context.ActingUserId,
            CreatedDate = DateTime.Now,
            IsActive = true
        };

        if (match.IsMatched)
        {
            entity.PropertyId = match.PropertyId!.Value;
            entity.Status = nameof(PropertyMediaJobDetailStatus.Pending);
            entity.Message = "Matched - ready to upload.";
            return entity;
        }

        entity.Status = match.Status;
        entity.SkipReason = match.SkipReason;
        entity.Message = match.SkipReason switch
        {
            nameof(PropertyMediaSkipReason.InvalidFileNameFormat) => "Filename does not match the required {WardNo}-{PropertyNo}-{PartitionNo}-{Suffix} pattern.",
            nameof(PropertyMediaSkipReason.WardNotFound) => $"No active ward found with WardNo '{match.WardNo}'.",
            nameof(PropertyMediaSkipReason.PropertyNotFound) => $"No active property found for Ward '{match.WardNo}', PropertyNo '{match.PropertyNo}', PartitionNo '{match.PartitionNo}'.",
            nameof(PropertyMediaSkipReason.SuffixMismatch) => $"Filename suffix '{match.Suffix}' does not match the required suffix for the selected photo type.",
            _ => "Could not be matched to an active property."
        };
        return entity;
    }

    /// <summary>
    /// Maps a persisted <c>PropertyMediaJobDetail</c> row to its display DTO: entity
    /// Status=Pending (matched, awaiting confirmation or awaiting the Worker) displays as
    /// "Matched" - everything else (NoMatch/Invalid/Skipped/Failed/already-uploaded Matched)
    /// passes through unchanged. FileName strips the "{index}/" prefix back off for display.
    /// </summary>
    private static PropertyMediaJobDetailDto MapDetailEntityToDto(PropertyMediaJobDetailEntity entity)
    {
        var displayStatus = entity.Status == nameof(PropertyMediaJobDetailStatus.Pending)
            ? nameof(PropertyMediaJobDetailStatus.Matched)
            : entity.Status;

        return new PropertyMediaJobDetailDto
        {
            Id = entity.Id,
            FileName = Path.GetFileName(entity.FileName),
            WardNo = entity.WardNo,
            PropertyNo = entity.PropertyNo,
            PartitionNo = entity.PartitionNo,
            Suffix = entity.Suffix,
            PropertyId = entity.PropertyId,
            PropertyPhotoId = entity.PropertyPhotoId,
            Status = displayStatus,
            IsMatched = displayStatus == nameof(PropertyMediaJobDetailStatus.Matched),
            SkipReason = entity.SkipReason,
            Message = entity.Message,
            ExecutionStartTime = entity.ExecutionStartTime,
            ExecutionEndTime = entity.ExecutionEndTime
        };
    }

    // ---------------------------------------------------------------- Execute (queue the job)

    public async Task<ExecuteMediaJobResponseDto> BulkUploadAsync(
        ExecuteMediaJobRequestDto request, OperationContext context, CancellationToken cancellationToken = default)
    {
        var photoType = await _photoTypeRepo.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(pt => pt.Id == request.PhotoTypeId && pt.IsActive, cancellationToken);
        if (photoType is null)
            throw new ArgumentException($"PhotoTypeId {request.PhotoTypeId} is not a valid active photo type.", nameof(request));

        bool isPlan = photoType.PhotoTypeCode.Contains("PLAN", StringComparison.OrdinalIgnoreCase);
        var requiredSuffix = PropertyMediaFileMatchResolver.GetRequiredSuffixForSubtype(photoType.PhotoTypeName, photoType.PhotoTypeCode);

        var folder = GetImportFolder();

        List<string> fileNames;
        if (request.SelectedFiles != null && request.SelectedFiles.Count > 0)
        {
            // Explicitly selected files - validate every single file against the required subtype suffix
            foreach (var selectedFile in request.SelectedFiles)
            {
                if (!PropertyMediaFileMatchResolver.ValidatePhotoSuffix(selectedFile, photoType.PhotoTypeName, photoType.PhotoTypeCode, out var validationError))
                {
                    throw new ArgumentException(validationError, nameof(request));
                }
            }

            fileNames = request.SelectedFiles
                .Select(path => Path.GetFileName(path) ?? string.Empty)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        else
        {
            IEnumerable<string> filePaths = Directory.EnumerateFiles(folder, "*", SearchOption.AllDirectories);
            if (isPlan)
            {
                filePaths = filePaths.Where(path => path.EndsWith(".wmf", StringComparison.OrdinalIgnoreCase)
                                                 || Path.GetExtension(path).Equals(".wmf", StringComparison.OrdinalIgnoreCase));
            }
            else
            {
                filePaths = filePaths.Where(path =>
                {
                    var ext = Path.GetExtension(path);
                    return !ext.Equals(".wmf", StringComparison.OrdinalIgnoreCase) && ImageExtensions.Contains(ext.ToLowerInvariant());
                });
            }

            // Subtype-based filtering matching preview: only include files matching the required suffix
            if (!string.IsNullOrWhiteSpace(requiredSuffix))
            {
                filePaths = filePaths.Where(path =>
                {
                    var name = Path.GetFileName(path);
                    return PropertyMediaFileMatchResolver.TryParseFileName(name, out _, out _, out _, out var suffix)
                           && string.Equals(suffix, requiredSuffix, StringComparison.OrdinalIgnoreCase);
                });
            }

            fileNames = filePaths
                .Select(path => Path.GetFileName(path) ?? string.Empty)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        if (fileNames.Count == 0)
        {
            var suffixMsg = !string.IsNullOrWhiteSpace(requiredSuffix)
                ? $" matching required suffix '{requiredSuffix}' for subtype '{photoType.PhotoTypeName}'"
                : string.Empty;
            throw new InvalidOperationException($"No importable files{suffixMsg} were found in the configured storage folder.");
        }

        return await CreateAndQueueJobAsync(folder, fileNames, request.PhotoTypeId, request.Remarks, context, cancellationToken);
    }

    /// <summary>
    /// Browse-upload counterpart to <see cref="BulkUploadAsync"/>: confirms a browse-upload job
    /// (from <see cref="PreviewBrowsedFilesAsync"/>) and queues EVERY currently-Matched(=Pending)
    /// detail row in it - the same "upload everything matched, no manual selection" convenience
    /// <see cref="BulkUploadAsync"/> already gives Server-bulk-upload. The job itself then flips
    /// to Pending - the exact same final step <see cref="CreateAndQueueJobAsync"/> already does
    /// for Server-bulk-upload - so the Worker picks it up identically. Returns null if
    /// <paramref name="jobId"/> doesn't resolve to an existing browse-upload job, and throws if it
    /// isn't currently AwaitingConfirmation (e.g. already executed) or has no Matched files.
    /// </summary>
    public Task<ExecuteMediaJobResponseDto?> ExecuteBrowsedUploadAsync(
        int jobId, OperationContext context, CancellationToken cancellationToken = default)
        => ExecuteBrowsedUploadAsync(jobId.ToString(), context, cancellationToken);

    private static readonly ConcurrentDictionary<string, byte> _activeExecutionClaims = new();

    public async Task<ExecuteMediaJobResponseDto?> ExecuteBrowsedUploadAsync(
        string previewId, OperationContext context, CancellationToken cancellationToken = default)
    {
        if (!_activeExecutionClaims.TryAdd(previewId, 0))
        {
            _logger.LogWarning("Concurrent execute request rejected for preview {PreviewId}", previewId);
            return null;
        }

        try
        {
            var session = await GetSessionAsync(previewId, cancellationToken);
            if (session is not null)
            {
                // Atomically claim by removing from cache and disk immediately so concurrent calls cannot duplicate it
                _memoryCache.Remove($"BrowseUploadSession_{previewId}");
                try
                {
                    var sessionJsonPath = Path.Combine(session.JobFolder, "session.json");
                    if (File.Exists(sessionJsonPath))
                    {
                        File.Delete(sessionJsonPath);
                    }
                }
                catch { }

                var confirmedDetails = session.Details
                    .Where(d => d.Status == nameof(PropertyMediaJobDetailStatus.Pending))
                    .ToList();

                if (confirmedDetails.Count == 0)
                    throw new InvalidOperationException("No matched files are available to upload for this job.");

                var job = new PropertyMediaJobEntity
                {
                    JobCode = $"PMJ-BRW-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8]}",
                    Operation = nameof(PropertyMediaJobOperation.BulkImportBrowsedFiles),
                    PhotoTypeId = session.PhotoTypeId,
                    SourceBatchKey = session.PreviewId,
                    StartTime = DateTime.Now,
                    Status = nameof(PropertyMediaJobStatus.Pending),
                    Remarks = string.IsNullOrWhiteSpace(session.Remarks) ? "Records are still pending to be processed" : session.Remarks,
                    RecordsSelected = confirmedDetails.Count,
                    CreatedBy = context.ActingUserId,
                    CreatedDate = DateTime.Now,
                    IsActive = true
                };

                await _unitOfWork.BeginTransactionAsync(cancellationToken);
                try
                {
                    await _jobRepo.AddAsync(job, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);

                    job.JobCode = $"PMJ-BRW-{DateTime.Now:yyyyMMdd}-{job.Id:D4}";
                    job.UpdatedBy = context.ActingUserId;
                    job.UpdatedDate = DateTime.Now;
                    await _jobRepo.UpdateAsync(job, cancellationToken);

                    foreach (var detail in session.Details)
                    {
                        detail.Id = 0;
                        detail.JobId = job.Id;
                        detail.CreatedBy = context.ActingUserId;
                        detail.CreatedDate = DateTime.Now;
                    }

                    await _jobDetailRepo.AddRangeAsync(session.Details, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    await _unitOfWork.CommitTransactionAsync(cancellationToken);
                }
                catch
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    throw;
                }

                return new ExecuteMediaJobResponseDto
                {
                    JobId = job.Id,
                    JobCode = job.JobCode,
                    RecordsSelected = job.RecordsSelected,
                    Status = job.Status
                };
            }
        }
        finally
        {
            _activeExecutionClaims.TryRemove(previewId, out _);
        }

        if (!int.TryParse(previewId, out var jobId))
            return null;

        var existingJob = await _jobRepo.GetQueryable()
            .FirstOrDefaultAsync(j => j.Id == jobId
                && j.Operation == nameof(PropertyMediaJobOperation.BulkImportBrowsedFiles)
                && !j.MarkedForDeletion, cancellationToken);
        if (existingJob is null)
            return null;

        // If the job is already active, queued, or completed, return safely without resetting status or counters
        if (existingJob.Status == nameof(PropertyMediaJobStatus.Running) ||
            existingJob.Status == nameof(PropertyMediaJobStatus.Pending) ||
            existingJob.Status == nameof(PropertyMediaJobStatus.Completed))
        {
            return new ExecuteMediaJobResponseDto
            {
                JobId = existingJob.Id,
                JobCode = existingJob.JobCode,
                RecordsSelected = existingJob.RecordsSelected,
                Status = existingJob.Status
            };
        }

        var dbConfirmedDetails = await _jobDetailRepo.GetQueryable()
            .Where(d => d.JobId == jobId && !d.MarkedForDeletion && d.Status == nameof(PropertyMediaJobDetailStatus.Pending))
            .ToListAsync(cancellationToken);

        if (dbConfirmedDetails.Count == 0)
            throw new InvalidOperationException("No matched files are available to upload for this job.");

        existingJob.RecordsSelected = dbConfirmedDetails.Count;
        existingJob.Remarks ??= "Records are still pending to be processed";
        existingJob.Status = nameof(PropertyMediaJobStatus.Pending);
        existingJob.UpdatedBy = context.ActingUserId;
        existingJob.UpdatedDate = DateTime.Now;
        await _jobRepo.UpdateAsync(existingJob, cancellationToken);
        await SaveChangesWithConcurrencyRetryAsync(cancellationToken);

        return new ExecuteMediaJobResponseDto
        {
            JobId = existingJob.Id,
            JobCode = existingJob.JobCode,
            RecordsSelected = existingJob.RecordsSelected,
            Status = existingJob.Status
        };
    }

    /// <summary>
    /// Shared by <see cref="BulkUploadAsync"/> and <see cref="ExecuteBrowsedUploadAsync"/>:
    /// resolves the same Ward+Property match against <paramref name="fileNames"/> (so only files
    /// that are actually Matched are ever queued) and inserts a fully-assembled <c>Pending</c>
    /// <c>PropertyMediaJob</c> row referencing <paramref name="folder"/> as its SourceFolder.
    /// </summary>
    private async Task<ExecuteMediaJobResponseDto> CreateAndQueueJobAsync(
        string folder, List<string> fileNames, int photoTypeId, string? remarks,
        OperationContext context, CancellationToken cancellationToken)
    {
        var photoType = await _photoTypeRepo.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(pt => pt.Id == photoTypeId, cancellationToken);

        if (photoType != null)
        {
            foreach (var fileName in fileNames)
            {
                if (!PropertyMediaFileMatchResolver.ValidatePhotoSuffix(fileName, photoType.PhotoTypeName, photoType.PhotoTypeCode, out var validationError))
                {
                    throw new ArgumentException(validationError, nameof(fileNames));
                }
            }
        }

        var matches = await _fileMatchResolver.ResolveAsync(fileNames, photoTypeId, cancellationToken);
        var matchedResults = matches.Where(m => m.IsMatched).ToList();

        if (matchedResults.Count == 0)
            throw new InvalidOperationException("No files in the Server import folder currently match an active property.");

        var job = new PropertyMediaJobEntity
        {
            JobCode = $"PMJ-IMP-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8]}",
            Operation = nameof(PropertyMediaJobOperation.BulkImportLocalFolder),
            PhotoTypeId = photoTypeId,
            SourceBatchKey = folder.Length <= 200
                ? folder
                : throw new ArgumentException("The import folder path exceeds 200 characters. Use a shorter path.", nameof(folder)),
            StartTime = DateTime.Now,
            Status = nameof(PropertyMediaJobStatus.Pending),
            Remarks = string.IsNullOrWhiteSpace(remarks) ? "Records are still pending to be processed" : remarks,
            RecordsSelected = matchedResults.Count,
            CreatedBy = context.ActingUserId,
            CreatedDate = DateTime.Now,
            IsActive = true
        };

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _jobRepo.AddAsync(job, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Update JobCode using the generated job.Id (Identity column)
            job.JobCode = $"PMJ-IMP-{DateTime.Now:yyyyMMdd}-{job.Id:D4}";
            job.UpdatedBy = context.ActingUserId;
            job.UpdatedDate = DateTime.Now;
            await _jobRepo.UpdateAsync(job, cancellationToken);

            var details = matchedResults.Select(m => new PropertyMediaJobDetailEntity
            {
                JobId = job.Id,
                FileName = m.FileName,
                WardNo = m.WardNo,
                PropertyNo = m.PropertyNo,
                PartitionNo = m.PartitionNo,
                Suffix = m.Suffix,
                PropertyId = m.PropertyId,
                Status = nameof(PropertyMediaJobDetailStatus.Pending),
                CreatedBy = context.ActingUserId,
                CreatedDate = DateTime.Now,
                IsActive = true
            }).ToList();

            await _jobDetailRepo.AddRangeAsync(details, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return new ExecuteMediaJobResponseDto
        {
            JobId = job.Id,
            JobCode = job.JobCode,
            RecordsSelected = job.RecordsSelected,
            Status = job.Status
        };
    }

    // ---------------------------------------------------------------- Process (called by the Worker)

    public async Task ProcessJobAsync(int jobId, CancellationToken cancellationToken = default)
    {
        var job = await _jobRepo.GetQueryable()
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.MarkedForDeletion, cancellationToken);
        if (job is null)
        {
            _logger.LogError("ProcessJobAsync: PropertyMediaJob {JobId} not found.", jobId);
            return;
        }

        var sourceFolder = job.Operation == nameof(PropertyMediaJobOperation.BulkImportBrowsedFiles)
            ? _sessionStorage.GetJobFolder(job.SourceBatchKey ?? job.Id.ToString())
            : (!string.IsNullOrWhiteSpace(job.SourceBatchKey)
                ? job.SourceBatchKey
                : GetImportFolder());

        var isEmpty = string.IsNullOrWhiteSpace(sourceFolder);
        var folderExists = Directory.Exists(sourceFolder);

        if (isEmpty || !folderExists)
        {
            job.Status = nameof(PropertyMediaJobStatus.Failed);
            job.ErrorMessage = "Source folder is no longer available.";
            job.CompleteTime = DateTime.Now;
            job.UpdatedDate = DateTime.Now;
            await _jobRepo.UpdateAsync(job, cancellationToken);
            await SaveChangesWithConcurrencyRetryAsync(cancellationToken);
            return;
        }

        var files = Directory.EnumerateFiles(sourceFolder, "*", SearchOption.AllDirectories)
            .Where(path => ImageExtensions.Contains(Path.GetExtension(path).ToLowerInvariant()))
            .OrderBy(path => Path.GetFileName(path), StringComparer.OrdinalIgnoreCase)
            .ToList();

        var pathByFileName = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var pathByRelativePath = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var path in files)
        {
            var name = Path.GetFileName(path);
            if (!pathByFileName.ContainsKey(name))
                pathByFileName[name] = path;

            var relativePath = Path.GetRelativePath(sourceFolder, path).Replace(Path.DirectorySeparatorChar, '/');
            pathByRelativePath[relativePath] = path;
        }

        var details = await _jobDetailRepo.GetQueryable()
            .Where(d => d.JobId == job.Id && !d.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        if (!details.Any())
        {
            details = files.Select(path => new PropertyMediaJobDetailEntity
            {
                JobId = job.Id,
                FileName = Path.GetFileName(path),
                Status = nameof(PropertyMediaJobDetailStatus.Pending),
                CreatedBy = job.CreatedBy.GetValueOrDefault(),
                CreatedDate = DateTime.Now,
                IsActive = true
            }).ToList();

            await _jobDetailRepo.AddRangeAsync(details, cancellationToken);
            await SaveChangesWithConcurrencyRetryAsync(cancellationToken);
        }

        // Batch-resolve matches for all pending details in 1 single database query upfront
        // eliminating N+1 duplicate database lookups in the loop
        var pendingFiles = details
            .Where(d => d.Status != nameof(PropertyMediaJobDetailStatus.Matched))
            .Select(d => Path.GetFileName(d.FileName))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var matchesByFileName = new Dictionary<string, PropertyMediaFileMatchResult>(StringComparer.OrdinalIgnoreCase);
        if (pendingFiles.Count > 0)
        {
            var batchMatches = await _fileMatchResolver.ResolveAsync(pendingFiles, job.PhotoTypeId, cancellationToken);
            foreach (var m in batchMatches)
            {
                matchesByFileName[m.FileName] = m;
            }
        }

        int matchedCount = details.Count(d => d.Status == nameof(PropertyMediaJobDetailStatus.Matched));
        int failedCount = details.Count(d => d.Status == nameof(PropertyMediaJobDetailStatus.Failed));
        int noMatchCount = details.Count(d => d.Status == nameof(PropertyMediaJobDetailStatus.NoMatch)
            || d.Status == nameof(PropertyMediaJobDetailStatus.Invalid));

        var photoType = await _photoTypeRepo.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.Id == job.PhotoTypeId)
            .Select(pt => pt.PhotoTypeName)
            .FirstOrDefaultAsync(cancellationToken);

        var photoRemarks = !string.IsNullOrWhiteSpace(photoType)
            ? photoType
            : $"Bulk import ({job.JobCode})";

        for (int i = 0; i < details.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var detail = details[i];

            if (detail.Status == nameof(PropertyMediaJobDetailStatus.Matched)
                || detail.Status != nameof(PropertyMediaJobDetailStatus.Pending))
            {
                continue;
            }

            detail.ExecutionStartTime = DateTime.Now;

            try
            {
                await ProcessDetailAsync(job, detail, pathByFileName, pathByRelativePath, matchesByFileName, photoRemarks, cancellationToken);
            }
            catch (Exception ex)
            {
                // Discard only uncommitted changes from this failed file operation
                _unitOfWork.DiscardChanges();
                detail.Status = nameof(PropertyMediaJobDetailStatus.Failed);
                detail.Message = SanitizeErrorMessage(ex);
                _logger.LogWarning(ex,
                    "Property Media import failed for FileName={FileName}, JobCode={JobCode}", detail.FileName, job.JobCode);
            }

            detail.ExecutionEndTime = DateTime.Now;
            detail.UpdatedBy = job.CreatedBy.GetValueOrDefault();
            detail.UpdatedDate = DateTime.Now;
            await _jobDetailRepo.UpdateAsync(detail, cancellationToken);

            if (detail.Status == nameof(PropertyMediaJobDetailStatus.Matched))
                matchedCount++;
            else if (detail.Status == nameof(PropertyMediaJobDetailStatus.Failed))
                failedCount++;
            else if (detail.Status == nameof(PropertyMediaJobDetailStatus.NoMatch) || detail.Status == nameof(PropertyMediaJobDetailStatus.Invalid))
                noMatchCount++;

            job.MatchedCount = matchedCount;
            job.FailedCount = failedCount;
            job.SkippedCount = 0;
            job.NoMatchCount = noMatchCount;
            job.RecordsProcessed = matchedCount + failedCount + noMatchCount;
            job.UpdatedDate = DateTime.Now;
            await _jobRepo.UpdateAsync(job, cancellationToken);

            // Isolate each file transaction: save immediately so preceding successes are never lost or discarded
            await SaveChangesWithConcurrencyRetryAsync(cancellationToken);
        }

        job.Status = nameof(PropertyMediaJobStatus.Completed);
        job.Remarks = "All files processed";
        job.CompleteTime = DateTime.Now;
        job.UpdatedDate = DateTime.Now;
        await _jobRepo.UpdateAsync(job, cancellationToken);
        await SaveChangesWithConcurrencyRetryAsync(cancellationToken);
    }

    /// <summary>
    /// Saves pending changes, self-healing a single optimistic-concurrency conflict instead of
    /// letting it kill the whole job.
    /// </summary>
    private async Task SaveChangesWithConcurrencyRetryAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict saving Property Media job progress; refreshing and retrying once.");

            foreach (var entry in ex.Entries)
            {
                var databaseValues = await entry.GetDatabaseValuesAsync(cancellationToken);
                if (databaseValues is null)
                {
                    entry.State = EntityState.Detached;
                    continue;
                }

                entry.OriginalValues.SetValues(databaseValues);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task ProcessDetailAsync(
        PropertyMediaJobEntity job,
        PropertyMediaJobDetailEntity detail,
        IReadOnlyDictionary<string, string> pathByFileName,
        IReadOnlyDictionary<string, string> pathByRelativePath,
        IReadOnlyDictionary<string, PropertyMediaFileMatchResult> matchesByFileName,
        string? photoRemarks,
        CancellationToken cancellationToken)
    {
        var bareFileName = Path.GetFileName(detail.FileName);

        if (!matchesByFileName.TryGetValue(bareFileName, out var match))
        {
            match = (await _fileMatchResolver.ResolveAsync(new[] { bareFileName }, job.PhotoTypeId, cancellationToken)).Single();
        }

        detail.WardNo = match.WardNo;
        detail.PropertyNo = match.PropertyNo;
        detail.PartitionNo = match.PartitionNo;
        detail.Suffix = match.Suffix;

        if (!match.IsMatched)
        {
            detail.Status = match.Status;
            detail.SkipReason = match.SkipReason;
            detail.Message = match.SkipReason switch
            {
                nameof(PropertyMediaSkipReason.InvalidFileNameFormat) => "Filename does not match the required {WardNo}-{PropertyNo}-{PartitionNo}-{Suffix} pattern.",
                nameof(PropertyMediaSkipReason.WardNotFound) => $"No active ward found with WardNo '{match.WardNo}'.",
                nameof(PropertyMediaSkipReason.PropertyNotFound) => $"No active property found for Ward '{match.WardNo}', PropertyNo '{match.PropertyNo}', PartitionNo '{match.PartitionNo}'.",
                nameof(PropertyMediaSkipReason.SuffixMismatch) => $"Filename suffix '{match.Suffix}' does not match the required suffix for the selected photo type.",
                _ => "Could not be matched to an active property."
            };
            return;
        }

        var propertyId = match.PropertyId!.Value;
        detail.PropertyId = propertyId;

        if ((!pathByRelativePath.TryGetValue(detail.FileName, out var fullPath)
                && !pathByFileName.TryGetValue(bareFileName, out fullPath))
            || !File.Exists(fullPath))
        {
            detail.Status = nameof(PropertyMediaJobDetailStatus.Failed);
            detail.Message = "Source file no longer exists in the import folder.";
            return;
        }

        var extension = Path.GetExtension(fullPath).ToLowerInvariant();
        var mimeType = MimeTypesByExtension.TryGetValue(extension, out var mt) ? mt : "application/octet-stream";
        var fileSizeBytes = new FileInfo(fullPath).Length;
        var uploadFileName = bareFileName;
        var remarks = !string.IsNullOrWhiteSpace(photoRemarks)
            ? photoRemarks
            : (await _photoTypeRepo.GetQueryable()
                .AsNoTracking()
                .Where(pt => pt.Id == job.PhotoTypeId)
                .Select(pt => pt.PhotoTypeName)
                .FirstOrDefaultAsync(cancellationToken)) ?? $"Bulk import ({job.JobCode})";

        Stream uploadStream;

        if (extension.Equals(".wmf", StringComparison.OrdinalIgnoreCase))
        {
            if (!OperatingSystem.IsWindows())
            {
                detail.Status = nameof(PropertyMediaJobDetailStatus.Failed);
                detail.Message = "WMF conversion is only supported on Windows server environments.";
                return;
            }

            var converted = ConvertWmfToPng(fullPath);
            if (converted is null)
            {
                detail.Status = nameof(PropertyMediaJobDetailStatus.Failed);
                detail.Message = "Failed to convert WMF image to PNG image for web display.";
                return;
            }

            uploadStream = converted;
            uploadFileName = Path.ChangeExtension(bareFileName, ".png");
            mimeType = "image/png";
            fileSizeBytes = converted.Length;
        }
        else
        {
            uploadStream = File.OpenRead(fullPath);
        }

        PropertyPhotoUploadResponseDto response;
        string message;
        await using (uploadStream)
        {
            (response, message) = await UploadOrReplacePhotoAsync(
                uploadStream, uploadFileName, mimeType, fileSizeBytes, propertyId, job.PhotoTypeId,
                remarks, job.CreatedBy.GetValueOrDefault(), cancellationToken);
        }

        detail.Message = message;
        detail.PropertyPhotoId = response.PropertyPhotoId;
        detail.Status = nameof(PropertyMediaJobDetailStatus.Matched);

        if (job.Operation == nameof(PropertyMediaJobOperation.BulkImportLocalFolder) && File.Exists(fullPath))
        {
            try
            {
                File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete processed file {FilePath} from import folder after upload.", fullPath);
            }
        }
    }

    /// <summary>
    /// A property keeps at most one CURRENT photo per PhotoType under the bulk-import flow: if
    /// one already exists, replace it (supersede old, upload new) instead of adding another row
    /// alongside it. Used only by <see cref="ProcessDetailAsync"/> - the browse-upload preview
    /// step no longer uploads directly, it only matches and stores files for a later BulkUpload.
    /// </summary>
    private async Task<(PropertyPhotoUploadResponseDto Response, string Message)> UploadOrReplacePhotoAsync(
        Stream fileStream, string fileName, string mimeType, long fileSizeBytes,
        int propertyId, int photoTypeId, string? remarks, int uploadedBy, CancellationToken cancellationToken)
    {
        var existingPhoto = await _propertyPhotoRepo.GetQueryable()
            .Where(p => p.PropertyId == propertyId
                && p.PhotoTypeId == photoTypeId
                && p.IsLatest
                && p.IsActive
                && !p.MarkedForDeletion)
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingPhoto is not null)
        {
            // Self-healing: if an earlier interrupted run left a half-created photo row without DocumentBindingId,
            // mark it deleted so a fresh, complete photo and document upload takes place cleanly.
            if (!existingPhoto.DocumentBindingId.HasValue || existingPhoto.DocumentBindingId.Value == 0)
            {
                var photoIdToClean = existingPhoto.Id;
                try
                {
                    existingPhoto.MarkForDeletion();
                    existingPhoto.UpdatedBy = uploadedBy;
                    existingPhoto.UpdatedDate = DateTime.Now;
                    await _propertyPhotoRepo.UpdateAsync(existingPhoto, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    existingPhoto = null; // Proceed to fresh upload
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to clean up incomplete PropertyPhoto ID={Id}", photoIdToClean);
                }
            }
            else
            {
                var response = await _propertyPhotoApplicationService.ReplacePhotoAsync(
                    existingPhoto.Id, fileStream, fileName, mimeType, fileSizeBytes, remarks,
                    uploadedBy, cancellationToken);
                return (response, $"Replaced existing photo (PropertyPhotoId={existingPhoto.Id}).");
            }
        }

        var uploaded = await _propertyPhotoApplicationService.UploadPhotoAsync(
            fileStream, fileName, mimeType, fileSizeBytes, propertyId, photoTypeId,
            displayOrder: null, remarks, uploadedBy, cancellationToken);
        return (uploaded, "Uploaded successfully.");
    }

    private static string Truncate(string value, int max) =>
        string.IsNullOrEmpty(value) || value.Length <= max ? value : value[..max];

    private static string SanitizeErrorMessage(Exception ex)
    {
        if (ex is ArgumentException or InvalidOperationException or FileNotFoundException)
        {
            return Truncate(ex.Message, 500);
        }

        return "An internal error occurred while processing this file. Technical details have been logged for support.";
    }

    [System.Runtime.Versioning.SupportedOSPlatform("windows")]
    private static MemoryStream? ConvertWmfToPng(string filePath)
    {
        try
        {
            using var metafile = new System.Drawing.Imaging.Metafile(filePath);
            int sourceWidth = metafile.Width > 0 ? metafile.Width : 2000;
            int sourceHeight = metafile.Height > 0 ? metafile.Height : 2000;
            double scale = Math.Min(1d, 4096d / Math.Max(sourceWidth, sourceHeight));
            int width = Math.Max(1, (int)Math.Round(sourceWidth * scale));
            int height = Math.Max(1, (int)Math.Round(sourceHeight * scale));

            using var bitmap = new System.Drawing.Bitmap(width, height);
            using (var g = System.Drawing.Graphics.FromImage(bitmap))
            {
                g.Clear(System.Drawing.Color.White);
                g.DrawImage(metafile, 0, 0, width, height);
            }

            var ms = new MemoryStream();
            bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
            ms.Position = 0;
            return ms;
        }
        catch
        {
            return null;
        }
    }

    private string GetImportFolder()
    {
        const string targetFolderName = "PropertyPhotoPlanImage";

        // 1. Configured LocalImportFolder (from appsettings or environment variable)
        if (!string.IsNullOrWhiteSpace(_devToolsOptions?.LocalImportFolder) && Directory.Exists(_devToolsOptions.LocalImportFolder))
        {
            return Path.GetFullPath(_devToolsOptions.LocalImportFolder);
        }

        // 2. Current working directory
        var currentDir = Directory.GetCurrentDirectory();
        var primaryFolder = Path.Combine(currentDir, targetFolderName);
        if (Directory.Exists(primaryFolder))
            return Path.GetFullPath(primaryFolder);

        // 3. Application base directory (where binaries are executed)
        var baseDirFolder = Path.Combine(AppContext.BaseDirectory, targetFolderName);
        if (Directory.Exists(baseDirFolder))
            return Path.GetFullPath(baseDirFolder);

        // 4. Search parent directories and sibling projects (handles IIS virtual directories, worker/api subfolders)
        var parentDir = new DirectoryInfo(currentDir);
        for (int i = 0; i < 4 && parentDir != null; i++)
        {
            var candidate = Path.Combine(parentDir.FullName, targetFolderName);
            if (Directory.Exists(candidate))
                return candidate;

            var apiCandidate = Path.Combine(parentDir.FullName, "NtisPlatform.Api", targetFolderName);
            if (Directory.Exists(apiCandidate))
                return apiCandidate;

            parentDir = parentDir.Parent;
        }

        // 5. Configured FileStorage BasePath
        if (!string.IsNullOrWhiteSpace(_fileStorageOptions.BasePath))
        {
            var baseDir = Path.IsPathRooted(_fileStorageOptions.BasePath)
                ? _fileStorageOptions.BasePath
                : Path.GetFullPath(Path.Combine(currentDir, _fileStorageOptions.BasePath));

            var subFolder = Path.Combine(baseDir, targetFolderName);
            if (Directory.Exists(subFolder))
                return subFolder;
        }

        // 6. Dynamic fallback: auto-create in current directory
        if (!Directory.Exists(primaryFolder))
            Directory.CreateDirectory(primaryFolder);

        return primaryFolder;
    }


    private string GetSessionFolder(string previewId) => _sessionStorage.GetJobFolder(previewId);

    private async Task<BrowseUploadSession?> TryLoadSessionFromDiskAsync(string previewId, CancellationToken cancellationToken)
    {
        try
        {
            var sessionFolder = GetSessionFolder(previewId);
            var sessionJsonPath = Path.Combine(sessionFolder, "session.json");
            if (File.Exists(sessionJsonPath))
            {
                var json = await File.ReadAllTextAsync(sessionJsonPath, cancellationToken);
                return JsonSerializer.Deserialize<BrowseUploadSession>(json);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load browse upload session from disk for preview {PreviewId}", previewId);
        }
        return null;
    }

    private async Task<BrowseUploadSession?> GetSessionAsync(string previewId, CancellationToken cancellationToken)
    {
        if (_memoryCache.TryGetValue<BrowseUploadSession>($"BrowseUploadSession_{previewId}", out var cachedSession) && cachedSession is not null)
        {
            return cachedSession;
        }

        var diskSession = await TryLoadSessionFromDiskAsync(previewId, cancellationToken);
        if (diskSession is not null)
        {
            _memoryCache.Set(
                $"BrowseUploadSession_{previewId}",
                diskSession,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2),
                    Size = 1
                });
        }

        return diskSession;
    }

    public async Task<ExecuteMediaJobResponseDto?> GetJobStatusAsync(int jobId, CancellationToken cancellationToken = default)
    {
        return await _jobRepo.GetQueryable()
            .AsNoTracking()
            .Where(j => j.Id == jobId && !j.MarkedForDeletion)
            .Select(j => new ExecuteMediaJobResponseDto
            {
                JobId = j.Id,
                JobCode = j.JobCode,
                Status = j.Status,
                RecordsSelected = j.RecordsSelected
            })
            .FirstOrDefaultAsync(cancellationToken);
    }
}
