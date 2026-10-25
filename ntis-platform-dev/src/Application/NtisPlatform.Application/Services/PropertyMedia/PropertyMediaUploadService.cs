using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Options;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Enums;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.PropertyMedia;

/// <inheritdoc cref="IPropertyMediaUploadService"/>
public class PropertyMediaUploadService : IPropertyMediaUploadService
{
    private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".pdf", ".wmf" };

    private readonly FileStorageOptions _fileStorageOptions;
    private readonly PropertyMediaDevToolsOptions? _devToolsOptions;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeRepository;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyPhotoTypeEntity, int> _propertyPhotoTypeRepository;
    private readonly IPropertyMediaFileMatchResolver _fileMatchResolver;

    public PropertyMediaUploadService(
        IOptions<FileStorageOptions> fileStorageOptions,
        IRepository<WardEntity, int> wardRepository,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeRepository,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyPhotoTypeEntity, int> propertyPhotoTypeRepository,
        IPropertyMediaFileMatchResolver fileMatchResolver,
        IOptions<PropertyMediaDevToolsOptions>? devToolsOptions = null)
    {
        _fileStorageOptions = fileStorageOptions.Value;
        _devToolsOptions = devToolsOptions?.Value;
        _wardRepository = wardRepository;
        _propertyTypeRepository = propertyTypeRepository;
        _propertyRepository = propertyRepository;
        _propertyPhotoTypeRepository = propertyPhotoTypeRepository;
        _fileMatchResolver = fileMatchResolver;
    }

    public Task<List<PropertyMediaDropdownOptionDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = Enum.GetValues<PropertyMediaCategory>()
            .Select(c => new PropertyMediaDropdownOptionDto { Id = (int)c, Name = c.ToString() })
            .ToList();

        return Task.FromResult(categories);
    }

    /// <summary>
    /// Dependent on Category: Photo -&gt; every active photo type EXCEPT plan types (Property
    /// Front/Side/Inside/Board, Society Place/Board/Sign Board, Wing Building/Place/Board/Sign
    /// Board, Amenity Photo); Plan -&gt; types whose PhotoTypeCode contains "PLAN" (e.g.
    /// PROPERTY_PLAN) - PhotoScope alone can't make this split since PROPERTY_PLAN shares the
    /// "PROPERTY" scope with the other Property photo types; Document -&gt; none yet, since no
    /// dedicated "document" scope exists in PTIS.PropertyPhotoType today; no category selected -&gt;
    /// no subtypes.
    /// </summary>
    public async Task<List<PropertyMediaDropdownOptionDto>> GetPropertySubTypesAsync(
        PropertyMediaCategory? category, CancellationToken cancellationToken = default)
    {
        var subTypesQuery = _propertyPhotoTypeRepository.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.IsActive);

        subTypesQuery = category switch
        {
            PropertyMediaCategory.Photo => subTypesQuery.Where(pt => !pt.PhotoTypeCode.ToUpper().Contains("PLAN")),
            PropertyMediaCategory.Plan => subTypesQuery.Where(pt => pt.PhotoTypeCode.ToUpper().Contains("PLAN")),
            PropertyMediaCategory.Document => subTypesQuery.Where(pt => pt.PhotoScope == "DOCUMENT"),
            _ => subTypesQuery.Where(pt => false)
        };

        return await subTypesQuery
            .OrderBy(pt => pt.DisplayOrder)
            .Select(pt => new PropertyMediaDropdownOptionDto { Id = pt.Id, Name = pt.PhotoTypeName })
            .ToListAsync(cancellationToken);
    }

    public Task<ServerImportPreviewResultDto> GetServerImportImagesAsync(
        int page, int pageSize, CancellationToken cancellationToken = default)
        => GetServerImportImagesAsync(null, page, pageSize, cancellationToken);

    public async Task<ServerImportPreviewResultDto> GetServerImportImagesAsync(
        int? photoTypeId, int page, int pageSize, CancellationToken cancellationToken = default)

    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 200) pageSize = 200;

        // If no photoTypeId is provided, or if the photo type is not one of the supported types
        // (Property Front/Side/Inside/Board Photo, or Property Plan), return an empty preview list.
        if (!photoTypeId.HasValue || photoTypeId.Value <= 0)
        {
            return new ServerImportPreviewResultDto
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = 0,
                TotalMatched = 0,
                TotalUnmatched = 0,
                Items = new List<ServerImportImageDto>()
            };
        }

        var photoType = await _propertyPhotoTypeRepository.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.Id == photoTypeId.Value)
            .Select(pt => new { pt.PhotoTypeCode, pt.PhotoTypeName })
            .FirstOrDefaultAsync(cancellationToken);

        if (photoType == null || !PropertyMediaFileMatchResolver.IsSupportedImportSubtype(photoType.PhotoTypeName, photoType.PhotoTypeCode))
        {
            return new ServerImportPreviewResultDto
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = 0,
                TotalMatched = 0,
                TotalUnmatched = 0,
                Items = new List<ServerImportImageDto>()
            };
        }

        bool isPlan = photoType.PhotoTypeCode.Contains("PLAN", StringComparison.OrdinalIgnoreCase);
        string? requiredSuffix = PropertyMediaFileMatchResolver.GetRequiredSuffixForSubtype(photoType.PhotoTypeName, photoType.PhotoTypeCode);

        var folder = GetImportFolder();

        IEnumerable<string> filePaths = Directory.EnumerateFiles(folder, "*", SearchOption.AllDirectories);
        if (isPlan == true)
        {
            filePaths = filePaths.Where(path => path.EndsWith(".wmf", StringComparison.OrdinalIgnoreCase)
                                             || Path.GetExtension(path).Equals(".wmf", StringComparison.OrdinalIgnoreCase));
        }
        else if (isPlan == false)
        {
            filePaths = filePaths.Where(path =>
            {
                var ext = Path.GetExtension(path);
                return !ext.Equals(".wmf", StringComparison.OrdinalIgnoreCase) && ImageExtensions.Contains(ext.ToLowerInvariant());
            });
        }
        else
        {
            filePaths = filePaths.Where(path => ImageExtensions.Contains(Path.GetExtension(path).ToLowerInvariant()));
        }

        // Subtype-based filtering: filter photos so only those matching the required suffix are displayed
        if (!string.IsNullOrWhiteSpace(requiredSuffix))
        {
            filePaths = filePaths.Where(path =>
            {
                var name = Path.GetFileName(path);
                return PropertyMediaFileMatchResolver.TryParseFileName(name, out _, out _, out _, out var suffix)
                       && string.Equals(suffix, requiredSuffix, StringComparison.OrdinalIgnoreCase);
            });
        }

        var fileNames = filePaths
            .Select(path => Path.GetFileName(path) ?? string.Empty)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Matched files first, then unmatched - pagination below is applied after this sort.
        var matches = (await _fileMatchResolver.ResolveAsync(fileNames, photoTypeId, cancellationToken))
            .OrderByDescending(m => m.IsMatched)
            .ThenBy(m => m.FileName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var totalCount = matches.Count;
        var totalMatched = matches.Count(m => m.IsMatched);

        var items = matches
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new ServerImportImageDto
            {
                FileName = m.FileName,
                Status = m.Status,
                IsMatched = m.IsMatched,
                PropertyDisplay = m.PropertyDisplay,
                SkipReason = m.SkipReason
            })
            .ToList();

        return new ServerImportPreviewResultDto
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalMatched = totalMatched,
            TotalUnmatched = totalCount - totalMatched,
            Items = items
        };
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

}
