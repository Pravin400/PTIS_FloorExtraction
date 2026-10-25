using System.IO.Compression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Enums;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.PropertyMedia;

/// <inheritdoc cref="IPropertyMediaDownloadService"/>
public class PropertyMediaDownloadService : IPropertyMediaDownloadService
{
    private readonly IRepository<PropertyPhotoEntity, int> _propertyPhotoRepository;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IPropertyMediaUploadService _uploadService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<PropertyMediaDownloadService> _logger;

    public PropertyMediaDownloadService(
        IRepository<PropertyPhotoEntity, int> propertyPhotoRepository,
        IRepository<PropertyEntity, int> propertyRepository,
        IPropertyMediaUploadService uploadService,
        IFileStorageService fileStorageService,
        ILogger<PropertyMediaDownloadService> logger)
    {
        _propertyPhotoRepository = propertyPhotoRepository;
        _propertyRepository = propertyRepository;
        _uploadService = uploadService;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    /// <summary>
    /// Resolves Category/Subtype into concrete PhotoTypeIds by reusing the EXISTING
    /// <see cref="IPropertyMediaUploadService.GetPropertySubTypesAsync"/> (no re-implementation of
    /// the Photo/Plan/Document derivation rule), then joins active, non-deleted, currently-latest
    /// PropertyPhoto rows with their active, non-deleted DocumentBinding/Document and owning
    /// Property - the same null-safety checks <c>PropertyPhotoService.GetLatestByPropertyIdAsync</c>
    /// already uses.
    /// </summary>
    public async Task<List<PropertyMediaMatchedFileDto>> GetMatchedFilesAsync(
        PropertyMediaCategory? category, int? photoTypeId,
        CancellationToken cancellationToken = default)
    {
        var photoTypeIds = photoTypeId.HasValue
            ? new List<int> { photoTypeId.Value }
            : (await _uploadService.GetPropertySubTypesAsync(category, cancellationToken)).Select(s => s.Id).ToList();

        if (photoTypeIds.Count == 0)
            return new List<PropertyMediaMatchedFileDto>();

        var photosQuery = _propertyPhotoRepository.GetQueryable()
            .AsNoTracking()
            .Include(p => p.PhotoType)
            .Include(p => p.DocumentBinding!).ThenInclude(db => db!.Document)
            .Where(p => p.IsActive && !p.MarkedForDeletion && p.IsLatest && photoTypeIds.Contains(p.PhotoTypeId));

        var propertiesQuery = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion);

        var query =
            from ph in photosQuery
            join prop in propertiesQuery on ph.PropertyId equals prop.Id
            where ph.DocumentBinding != null && ph.DocumentBinding.IsActive && !ph.DocumentBinding.MarkedForDeletion
               && ph.DocumentBinding.Document != null && ph.DocumentBinding.Document.IsActive && !ph.DocumentBinding.Document.MarkedForDeletion
            orderby prop.PropertyNo, ph.PhotoType!.DisplayOrder
            select new PropertyMediaMatchedFileDto
            {
                PropertyNo = prop.PropertyNo,
                PhotoTypeName = ph.PhotoType!.PhotoTypeName,
                FileName = ph.DocumentBinding!.Document!.OriginalFileName
            };

        return await query.ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<List<string>> GetPropertyNumbersAsync(
        PropertyMediaPropertyNumbersQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var propertiesQuery = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Include(p => p.Ward)
            .Where(p => p.IsActive && !p.MarkedForDeletion && !string.IsNullOrWhiteSpace(p.PropertyNo));

        // Filter by WardIds if provided
        var wardIds = parameters.WardIds?.Where(id => id > 0).Distinct().ToList();
        if (wardIds != null && wardIds.Count == 1)
        {
            var singleWardId = wardIds[0];
            propertiesQuery = propertiesQuery.Where(p => p.WardId == singleWardId);
        }
        else if (wardIds != null && wardIds.Count > 1)
        {
            propertiesQuery = propertiesQuery.Where(p => wardIds.Contains(p.WardId));
        }

        var propertyNumbers = await propertiesQuery
            .Select(p => p.PropertyNo!)
            .Distinct()
            .ToListAsync(cancellationToken);

        var sorted = propertyNumbers
            .OrderBy(pn => pn, PropertyRangeMatcher.Comparer)
            .ToList();

        if (!string.IsNullOrWhiteSpace(parameters.FromPropertyNo))
        {
            var from = parameters.FromPropertyNo.Trim();
            sorted = sorted.Where(pn => PropertyRangeMatcher.Compare(pn, from) >= 0).ToList();
        }

        return sorted;
    }

    /// <inheritdoc />
    public async Task<PropertyMediaZipDownloadResult> DownloadImagesZipAsync(
        PropertyMediaDownloadQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        // Guard: Category and PhotoTypeId are required
        if (!parameters.Category.HasValue)
            throw new ArgumentException("'Category' is required.", nameof(parameters));
        if (!parameters.PhotoTypeId.HasValue || parameters.PhotoTypeId.Value <= 0)
            throw new ArgumentException("'PhotoTypeId' is required.", nameof(parameters));

        // Optional WardIds filter
        var wardIds = parameters.WardIds?.Where(id => id > 0).Distinct().ToList() ?? new List<int>();

        var from = parameters.FromPropertyNo?.Trim();
        var to = parameters.ToPropertyNo?.Trim();

        // Validate range bounds: FromPropertyNo <= ToPropertyNo
        if (!string.IsNullOrWhiteSpace(from) && !string.IsNullOrWhiteSpace(to))
        {
            if (PropertyRangeMatcher.Compare(from, to) > 0)
            {
                throw new ArgumentException("'From Property No' cannot be greater than 'To Property No'.", nameof(parameters));
            }
        }

        // Resolve photoTypeIds
        var photoTypeIds = parameters.PhotoTypeId.HasValue && parameters.PhotoTypeId.Value > 0
            ? new List<int> { parameters.PhotoTypeId.Value }
            : (parameters.Category.HasValue
                ? (await _uploadService.GetPropertySubTypesAsync(parameters.Category.Value, cancellationToken)).Select(s => s.Id).ToList()
                : new List<int>());

        var photosQuery = _propertyPhotoRepository.GetQueryable()
            .AsNoTracking()
            .Include(p => p.PhotoType)
            .Include(p => p.DocumentBinding!).ThenInclude(db => db!.Document)
            .Where(p => p.IsActive && !p.MarkedForDeletion && p.IsLatest && p.PropertyId != null);

        if (photoTypeIds.Count > 0)
        {
            photosQuery = photosQuery.Where(p => photoTypeIds.Contains(p.PhotoTypeId));
        }

        var propertiesQuery = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Include(p => p.Ward)
            .Where(p => p.IsActive && !p.MarkedForDeletion && !string.IsNullOrWhiteSpace(p.PropertyNo));

        if (wardIds.Count == 1)
        {
            var singleWardId = wardIds[0];
            propertiesQuery = propertiesQuery.Where(p => p.WardId == singleWardId);
        }
        else if (wardIds.Count > 1)
        {
            propertiesQuery = propertiesQuery.Where(p => wardIds.Contains(p.WardId));
        }

        if (parameters.DivisionId.HasValue && parameters.DivisionId.Value > 0)
        {
            var divId = parameters.DivisionId.Value;
            propertiesQuery = propertiesQuery.Where(p => p.TaxZoneId == divId || (p.Ward != null && p.Ward.ZoneId == divId));
        }


        var query =
            from ph in photosQuery
            join prop in propertiesQuery on ph.PropertyId equals prop.Id
            where ph.DocumentBinding != null && ph.DocumentBinding.IsActive && !ph.DocumentBinding.MarkedForDeletion
               && ph.DocumentBinding.Document != null && ph.DocumentBinding.Document.IsActive && !ph.DocumentBinding.Document.MarkedForDeletion
               && ph.DocumentBinding.Document.IsLatestVersion
               && !string.IsNullOrWhiteSpace(ph.DocumentBinding.Document.StoragePath)
            select new PropertyImageDownloadItemDto
            {
                PropertyId = prop.Id,
                PropertyNo = prop.PropertyNo!,
                PartitionNo = prop.PartitionNo,
                PhotoTypeId = ph.PhotoTypeId,
                PhotoTypeName = ph.PhotoType != null ? ph.PhotoType.PhotoTypeName : "Photo",
                DocumentId = ph.DocumentBinding!.Document!.Id,
                DocumentGuid = ph.DocumentBinding!.Document!.DocumentGuid,
                OriginalFileName = ph.DocumentBinding!.Document!.OriginalFileName,
                FileName = ph.DocumentBinding!.Document!.FileName,
                StoragePath = ph.DocumentBinding!.Document!.StoragePath,
                StorageProvider = ph.DocumentBinding!.Document!.StorageProvider,
                MimeType = ph.DocumentBinding!.Document!.MimeType,
                FileSizeBytes = ph.DocumentBinding!.Document!.FileSizeBytes
            };

        var matchingImages = await query.ToListAsync(cancellationToken);

        // Natural alphanumeric range filtering
        if (!string.IsNullOrWhiteSpace(from))
        {
            matchingImages = matchingImages
                .Where(x => PropertyRangeMatcher.Compare(x.PropertyNo, from) >= 0)
                .ToList();
        }

        if (!string.IsNullOrWhiteSpace(to))
        {
            matchingImages = matchingImages
                .Where(x => PropertyRangeMatcher.Compare(x.PropertyNo, to) <= 0)
                .ToList();
        }

        if (matchingImages.Count == 0)
        {
            throw new InvalidOperationException("No active images found matching the selected criteria.");
        }

        matchingImages = matchingImages
            .OrderBy(x => x.PropertyNo, PropertyRangeMatcher.Comparer)
            .ThenBy(x => x.PhotoTypeName)
            .ToList();

        var tempZipPath = Path.Combine(Path.GetTempPath(), $"PropertyMedia_{Guid.NewGuid():N}.zip");
        FileStream? zipWriteStream = null;

        try
        {
            zipWriteStream = new FileStream(tempZipPath, FileMode.Create, FileAccess.Write, FileShare.None, 64 * 1024);
            int addedCount = 0;
            int skippedCount = 0;
            var usedEntryNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            using (var archive = new ZipArchive(zipWriteStream, ZipArchiveMode.Create, leaveOpen: true))
            {

                foreach (var item in matchingImages)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    Stream? sourceStream = null;
                    try
                    {
                        sourceStream = await _fileStorageService.ReadFileAsync(item.StoragePath, cancellationToken);
                        if (sourceStream is null)
                        {
                            _logger.LogWarning(
                                "[Download:FileNotFound] File not found on disk for Document {DocumentGuid} (Property {PropertyNo}). StoragePath={StoragePath}",
                                item.DocumentGuid, item.PropertyNo, item.StoragePath);
                            skippedCount++;
                            continue;
                        }

                        var propFolder = $"Property_{SanitizeFolderName(item.PropertyNo)}";
                        var rawFileName = !string.IsNullOrWhiteSpace(item.OriginalFileName)
                            ? Path.GetFileName(item.OriginalFileName)
                            : Path.GetFileName(item.FileName);

                        if (string.IsNullOrWhiteSpace(rawFileName))
                        {
                            rawFileName = $"{SanitizeFolderName(item.PhotoTypeName)}_{item.DocumentId}.jpg";
                        }

                        var cleanFileName = SanitizeFileName(rawFileName);
                        var entryName = $"{propFolder}/{cleanFileName}";

                        var counter = 1;
                        var nameWithoutExt = Path.GetFileNameWithoutExtension(cleanFileName);
                        var ext = Path.GetExtension(cleanFileName);

                        while (usedEntryNames.Contains(entryName))
                        {
                            entryName = $"{propFolder}/{nameWithoutExt}_{SanitizeFolderName(item.PhotoTypeName)}_{counter}{ext}";
                            counter++;
                        }

                        usedEntryNames.Add(entryName);

                        var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
                        await using var entryStream = entry.Open();
                        await sourceStream.CopyToAsync(entryStream, cancellationToken);
                        addedCount++;
                    }
                    catch (Exception ex)
                    {
                        skippedCount++;
                        _logger.LogWarning(ex,
                            "[Download:PackageError] Failed to package image for Document {DocumentGuid} (Property {PropertyNo}). StoragePath={StoragePath}. Error: {ErrorMessage}",
                            item.DocumentGuid, item.PropertyNo, item.StoragePath, ex.Message);
                    }
                    finally
                    {
                        if (sourceStream is not null)
                        {
                            await sourceStream.DisposeAsync();
                        }
                    }
                }
            }

            _logger.LogInformation(
                "[Download:ZipSummary] Matched={Matched}, Added={Added}, Skipped={Skipped}",
                matchingImages.Count, addedCount, skippedCount);

            // If not a single file could be read from storage, reject with a clear error.
            if (addedCount == 0)
            {
                await zipWriteStream.DisposeAsync();
                zipWriteStream = null;
                if (File.Exists(tempZipPath))
                    try { File.Delete(tempZipPath); } catch { /* ignore */ }

                throw new InvalidOperationException(
                    $"{matchingImages.Count} matching image record(s) were found in the database, " +
                    "but none of the physical files could be read from storage. " +
                    "Please verify that the file storage path is configured correctly in appsettings.json (FileStorage:BasePath) " +
                    "and that the files have been uploaded successfully.");
            }

            await zipWriteStream.FlushAsync(cancellationToken);
            await zipWriteStream.DisposeAsync();
            zipWriteStream = null;

            var readStream = new FileStream(tempZipPath, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, FileOptions.DeleteOnClose);
            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");

            return new PropertyMediaZipDownloadResult
            {
                ZipStream = readStream,
                FileName = $"Downloaded_Property_Images_{timestamp}.zip",
                TotalImagesCount = addedCount,
                TotalPropertiesCount = matchingImages
                    .Where(m => usedEntryNames.Any(e => e.StartsWith($"Property_{SanitizeFolderName(m.PropertyNo)}/", StringComparison.OrdinalIgnoreCase)))
                    .Select(m => m.PropertyNo)
                    .Distinct()
                    .Count()
            };
        }
        catch
        {
            if (zipWriteStream != null)
            {
                await zipWriteStream.DisposeAsync();
            }

            if (File.Exists(tempZipPath))
            {
                try { File.Delete(tempZipPath); } catch { /* ignore */ }
            }

            throw;
        }
    }

    private static string SanitizeFolderName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var clean = string.Concat(name.Select(c => invalid.Contains(c) ? '_' : c)).Trim();
        return string.IsNullOrWhiteSpace(clean) ? "Unknown" : clean;
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var clean = string.Concat(name.Select(c => invalid.Contains(c) ? '_' : c)).Trim();
        return string.IsNullOrWhiteSpace(clean) ? "image.jpg" : clean;
    }
}
