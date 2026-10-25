using System.Text;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.PropertyMedia;

/// <inheritdoc cref="IPropertyMediaFileMatchResolver"/>
public class PropertyMediaFileMatchResolver : IPropertyMediaFileMatchResolver
{
    private readonly IRepository<WardEntity, int> _wardRepo;
    private readonly IRepository<PropertyEntity, int> _propertyRepo;
    private readonly IRepository<PropertyCategoryEntity, int> _categoryRepo;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeRepo;
    private readonly IRepository<PropertyPhotoTypeEntity, int> _photoTypeRepo;

    public PropertyMediaFileMatchResolver(
        IRepository<WardEntity, int> wardRepo,
        IRepository<PropertyEntity, int> propertyRepo,
        IRepository<PropertyCategoryEntity, int> categoryRepo,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeRepo,
        IRepository<PropertyPhotoTypeEntity, int> photoTypeRepo)
    {
        _wardRepo = wardRepo;
        _propertyRepo = propertyRepo;
        _categoryRepo = categoryRepo;
        _propertyTypeRepo = propertyTypeRepo;
        _photoTypeRepo = photoTypeRepo;
    }

    /// <summary>
    /// WardNo/PropertyNo/PartitionNo can never match a real Ward/Property beyond this length -
    /// PTIS.WardMaster.WardNo and PTIS.PropertyMast.PropertyNo/PartitionNo are all
    /// HasMaxLength(10) (see ApplicationDbContext.cs). Rejecting longer segments here (as an
    /// invalid filename) avoids ever handing a doomed-to-fail lookup - or an oversized string
    /// that would overflow the audit table's own columns - further down the pipeline.
    /// </summary>

    /// <summary>
    /// Parses a Property Photo import filename of the form
    /// "{WardNo}-{PropertyNo}-{PartitionNo}-{Suffix}.ext" (4 segments) or
    /// "{WardNo}-{PropertyNo}-{Suffix}.ext" (3 segments for Individual properties without PartitionNo).
    /// </summary>
    public static bool TryParseFileName(
        string fileName,
        out string? wardNo,
        out string? propertyNo,
        out string? partitionNo,
        out string? suffix)
    {
        var nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
        var segments = nameWithoutExtension.Split('-');

        if (segments.Length == 4
            && segments.All(s => !string.IsNullOrWhiteSpace(s) && s.Length <= PropertyMediaConstants.MaxSegmentLength))
        {
            wardNo = segments[0];
            propertyNo = segments[1];
            partitionNo = segments[2];
            suffix = segments[3];
            return true;
        }

        if (segments.Length == 3
            && segments.All(s => !string.IsNullOrWhiteSpace(s) && s.Length <= PropertyMediaConstants.MaxSegmentLength))
        {
            wardNo = segments[0];
            propertyNo = segments[1];
            partitionNo = null;
            suffix = segments[2];
            return true;
        }

        wardNo = null;
        propertyNo = null;
        partitionNo = null;
        suffix = null;
        return false;
    }

    /// <summary>
    /// Returns the required filename suffix for standard property photo subtypes:
    /// Property Front Photo -> A, Property Side Photo -> B, Property Inside Photo -> C, Property Board Photo -> D.
    /// Returns null if the subtype does not enforce a specific suffix (e.g. Plan or other custom subtypes).
    /// </summary>
    public static string? GetRequiredSuffixForSubtype(string? photoTypeName, string? photoTypeCode = null)
    {
        if (!string.IsNullOrWhiteSpace(photoTypeName))
        {
            if (photoTypeName.Equals("Property Front Photo", StringComparison.OrdinalIgnoreCase) ||
                photoTypeName.Contains("Front", StringComparison.OrdinalIgnoreCase))
                return "A";

            if (photoTypeName.Equals("Property Inside Photo", StringComparison.OrdinalIgnoreCase) ||
                photoTypeName.Contains("Inside", StringComparison.OrdinalIgnoreCase))
                return "C";

            if (photoTypeName.Equals("Property Side Photo", StringComparison.OrdinalIgnoreCase) ||
                photoTypeName.Contains("Side", StringComparison.OrdinalIgnoreCase))
                return "B";

            if (photoTypeName.Equals("Property Board Photo", StringComparison.OrdinalIgnoreCase) ||
                photoTypeName.Contains("Board", StringComparison.OrdinalIgnoreCase))
                return "D";
        }

        if (!string.IsNullOrWhiteSpace(photoTypeCode))
        {
            if (photoTypeCode.Contains("FRONT", StringComparison.OrdinalIgnoreCase)) return "A";
            if (photoTypeCode.Contains("INSIDE", StringComparison.OrdinalIgnoreCase)) return "C";
            if (photoTypeCode.Contains("SIDE", StringComparison.OrdinalIgnoreCase)) return "B";
            if (photoTypeCode.Contains("BOARD", StringComparison.OrdinalIgnoreCase)) return "D";
        }

        return null;
    }

    /// <summary>
    /// Checks whether the subtype is one of the implemented import subtypes:
    /// Property Front Photo, Property Side Photo, Property Inside Photo, Property Board Photo, or Property Plan.
    /// Returns false for any other subtype (such as Society, Wing, Amenity, etc.).
    /// </summary>
    public static bool IsSupportedImportSubtype(string? photoTypeName, string? photoTypeCode = null)
    {
        // Property Plan
        if (!string.IsNullOrWhiteSpace(photoTypeCode) && photoTypeCode.Contains("PLAN", StringComparison.OrdinalIgnoreCase))
            return true;
        if (!string.IsNullOrWhiteSpace(photoTypeName) && photoTypeName.Contains("Plan", StringComparison.OrdinalIgnoreCase))
            return true;

        // 4 standard property photo subtypes
        if (!string.IsNullOrWhiteSpace(photoTypeName))
        {
            var trimmedName = photoTypeName.Trim();
            if (trimmedName.Equals("Property Front Photo", StringComparison.OrdinalIgnoreCase) ||
                trimmedName.Equals("Property Side Photo", StringComparison.OrdinalIgnoreCase) ||
                trimmedName.Equals("Property Inside Photo", StringComparison.OrdinalIgnoreCase) ||
                trimmedName.Equals("Property Board Photo", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (!string.IsNullOrWhiteSpace(photoTypeCode))
        {
            var trimmedCode = photoTypeCode.Trim();
            if (trimmedCode.Equals("PROPERTY_FRONT", StringComparison.OrdinalIgnoreCase) ||
                trimmedCode.Equals("PROPERTY_SIDE", StringComparison.OrdinalIgnoreCase) ||
                trimmedCode.Equals("PROPERTY_INSIDE", StringComparison.OrdinalIgnoreCase) ||
                trimmedCode.Equals("PROPERTY_BOARD", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Validates whether a photo filename matches the suffix required by its subtype.
    /// Returns true if valid or if the subtype does not require a specific suffix.
    /// </summary>
    public static bool ValidatePhotoSuffix(
        string fileName, string? photoTypeName, string? photoTypeCode, out string? errorMessage)
    {
        errorMessage = null;
        var requiredSuffix = GetRequiredSuffixForSubtype(photoTypeName, photoTypeCode);
        if (string.IsNullOrWhiteSpace(requiredSuffix))
            return true; // No suffix restriction for this subtype

        var bareName = Path.GetFileName(fileName);
        if (!TryParseFileName(bareName, out _, out _, out _, out var suffix) || string.IsNullOrWhiteSpace(suffix))
        {
            errorMessage = $"Photo '{bareName}' does not match the required filename pattern or is missing a suffix. Subtype '{photoTypeName}' requires suffix '{requiredSuffix}'.";
            return false;
        }

        if (!string.Equals(suffix, requiredSuffix, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = $"Photo '{bareName}' with suffix '{suffix}' cannot be assigned to subtype '{photoTypeName}'. Subtype requires filename suffix '{requiredSuffix}'.";
            return false;
        }

        return true;
    }

    /// <summary>
    /// Parses a Property Plan import filename of the form
    /// "{WardNo}-{CategoryCode}-{PropertyNo}" or "{WardNo}-{CategoryCode}-{PropertyNo}-{PartType+Type}"
    /// (e.g. "DIMAJOR1-A-1-C10.wmf" or "DIMAJOR1-A-1.wmf").
    /// CategoryCode must be one of: A (Apartment), C (Individual), I (Industry), P (Plot), X (Other).
    /// </summary>
    public static bool TryParsePlanFileName(
        string fileName,
        out string? wardNo,
        out char categoryCode,
        out string? propertyNo,
        out string? partTypeAndType)
    {
        wardNo = null;
        categoryCode = default;
        propertyNo = null;
        partTypeAndType = null;

        var nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
        if (string.IsNullOrWhiteSpace(nameWithoutExtension))
            return false;

        var segments = nameWithoutExtension.Split('-');
        if (segments.Length != 3 && segments.Length != 4)
            return false;

        if (segments.Any(s => string.IsNullOrWhiteSpace(s) || s.Length > PropertyMediaConstants.MaxSegmentLength))
            return false;

        var cat = segments[1].Trim().ToUpperInvariant();
        if (cat.Length != 1 || !"ACIPX".Contains(cat[0]))
            return false;

        wardNo = segments[0].Trim();
        categoryCode = cat[0];
        propertyNo = segments[2].Trim();
        partTypeAndType = segments.Length == 4 ? segments[3].Trim() : null;
        return true;
    }

    /// <summary>
    /// Category code mapping according to the PTIS specification:
    /// Apartment -> A, Individual -> C, Industry -> I, Plot -> P, Other -> X.
    /// </summary>
    public static char GetCategoryCode(string? categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return 'X';
        if (categoryName.Contains("Apartment", StringComparison.OrdinalIgnoreCase)) return 'A';
        if (categoryName.Contains(PropertyMediaConstants.IndividualCategoryKeyword, StringComparison.OrdinalIgnoreCase)) return 'C';
        if (categoryName.Contains("Industry", StringComparison.OrdinalIgnoreCase)) return 'I';
        if (categoryName.Contains("Plot", StringComparison.OrdinalIgnoreCase)) return 'P';
        return 'X';
    }

    /// <summary>
    /// Generates a Plan filename from database values matching the exact SQL definition:
    /// {WardNo}-{CategoryCode}-{PropertyNo}[-{PartType}{Type}].wmf
    /// </summary>
    public static string GeneratePlanFileName(
        string wardNo,
        string? categoryName,
        string propertyNo,
        string? partitionNo,
        string? partType,
        string? type,
        string extension = ".wmf")
    {
        var catCode = GetCategoryCode(categoryName);
        var sb = new StringBuilder();
        sb.Append(wardNo);
        sb.Append('-');
        sb.Append(catCode);
        sb.Append('-');
        sb.Append(propertyNo);

        if (catCode == 'A'
            && !string.IsNullOrWhiteSpace(partitionNo)
            && partitionNo.Trim() != "-"
            && !string.IsNullOrWhiteSpace(partType))
        {
            sb.Append('-');
            sb.Append(partType.Trim());
            if (!string.IsNullOrWhiteSpace(type))
            {
                sb.Append(type.Trim());
            }
        }

        if (!extension.StartsWith('.'))
            extension = "." + extension;

        sb.Append(extension);
        return sb.ToString();
    }

    /// <inheritdoc />
    public Task<List<PropertyMediaFileMatchResult>> ResolveAsync(
        IReadOnlyList<string> fileNames, CancellationToken cancellationToken = default)
        => ResolveAsync(fileNames, null, cancellationToken);

    /// <inheritdoc />
    public async Task<List<PropertyMediaFileMatchResult>> ResolveAsync(
        IReadOnlyList<string> fileNames, int? photoTypeId, CancellationToken cancellationToken = default)
    {
        if (!photoTypeId.HasValue || photoTypeId.Value <= 0)
        {
            var planFiles = new List<string>();
            var photoFiles = new List<string>();

            foreach (var f in fileNames)
            {
                if (TryParsePlanFileName(f, out _, out _, out _, out _))
                    planFiles.Add(f);
                else
                    photoFiles.Add(f);
            }

            var planResults = planFiles.Count > 0
                ? await ResolvePlanAsync(planFiles, cancellationToken)
                : new List<PropertyMediaFileMatchResult>();

            var photoResults = photoFiles.Count > 0
                ? await ResolvePhotoAsync(photoFiles, null, cancellationToken)
                : new List<PropertyMediaFileMatchResult>();

            var lookup = planResults.Concat(photoResults).ToDictionary(r => r.FileName, StringComparer.OrdinalIgnoreCase);
            return fileNames.Select(f => lookup.TryGetValue(f, out var r) ? r : Classify(f, null, nameof(PropertyMediaJobDetailStatus.Invalid), nameof(PropertyMediaSkipReason.InvalidFileNameFormat))).ToList();
        }

        var photoType = await _photoTypeRepo.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.Id == photoTypeId.Value)
            .Select(pt => new { pt.PhotoTypeCode, pt.PhotoTypeName })
            .FirstOrDefaultAsync(cancellationToken);
        bool isPlan = photoType?.PhotoTypeCode != null && photoType.PhotoTypeCode.Contains("PLAN", StringComparison.OrdinalIgnoreCase);

        if (isPlan)
        {
            return await ResolvePlanAsync(fileNames, cancellationToken);
        }

        var requiredSuffix = GetRequiredSuffixForSubtype(photoType?.PhotoTypeName, photoType?.PhotoTypeCode);
        return await ResolvePhotoAsync(fileNames, requiredSuffix, cancellationToken);
    }

    private sealed record PhotoPropertyCandidate(
        int Id,
        int WardId,
        string? PropertyNo,
        string? PartitionNo,
        string? CategoryName,
        bool IsIndividual);

    /// <summary>
    /// Property Photo resolution logic (WardNo-PropertyNo-PartitionNo-Suffix or WardNo-PropertyNo-Suffix for Individual).
    /// </summary>
    private async Task<List<PropertyMediaFileMatchResult>> ResolvePhotoAsync(
        IReadOnlyList<string> fileNames, string? requiredSuffix, CancellationToken cancellationToken)
    {
        var results = new List<PropertyMediaFileMatchResult>(fileNames.Count);
        var parsed = new Dictionary<string, (string WardNo, string PropertyNo, string? PartitionNo, string Suffix)>(fileNames.Count);

        foreach (var fileName in fileNames)
        {
            if (TryParseFileName(fileName, out var wardNo, out var propertyNo, out var partitionNo, out var suffix))
            {
                if (!string.IsNullOrWhiteSpace(requiredSuffix) &&
                    !string.Equals(suffix, requiredSuffix, StringComparison.OrdinalIgnoreCase))
                {
                    results.Add(Classify(fileName, (wardNo!, propertyNo!, partitionNo, suffix!), nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.SuffixMismatch)));
                    continue;
                }

                parsed[fileName] = (wardNo!, propertyNo!, partitionNo, suffix!);
            }
            else
            {
                results.Add(Classify(fileName, null, nameof(PropertyMediaJobDetailStatus.Invalid), nameof(PropertyMediaSkipReason.InvalidFileNameFormat)));
            }
        }

        if (parsed.Count == 0)
            return results;

        // Batch-resolve Wards, then Properties within those Wards filtered by the requested PropertyNos
        // instead of pulling all properties of the whole ward into memory.
        var wardNos = parsed.Values.Select(p => p.WardNo).Distinct().ToList();
        var wardIdByNo = (await _wardRepo.GetQueryable().AsNoTracking()
                .Where(w => wardNos.Contains(w.WardNo) && w.IsActive)
                .Select(w => new { w.Id, w.WardNo })
                .ToListAsync(cancellationToken))
            .ToDictionary(w => w.WardNo, w => w.Id, StringComparer.OrdinalIgnoreCase);

        var wardIds = wardIdByNo.Values.Distinct().ToList();
        if (wardIds.Count == 0)
        {
            foreach (var (fileName, s) in parsed)
            {
                results.Add(Classify(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.WardNotFound)));
            }
            return results;
        }

        var propertyNos = parsed.Values.Select(p => p.PropertyNo).Distinct().ToList();

        // Chunk property numbers to safely stay well under SQL Server's 2,100 parameter limit and optimize query execution plans
        const int chunkSize = 500;
        var properties = new List<PhotoPropertyCandidate>();
        foreach (var chunk in propertyNos.Chunk(chunkSize))
        {
            var chunkList = chunk.ToList();
            var chunkQuery =
                from p in _propertyRepo.GetQueryable().AsNoTracking()
                where wardIds.Contains(p.WardId) && p.PropertyNo != null && chunkList.Contains(p.PropertyNo!) && p.IsActive && !p.MarkedForDeletion && !string.IsNullOrWhiteSpace(p.PropertyNo)
                join cat in _categoryRepo.GetQueryable().AsNoTracking() on p.CategoryId equals cat.Id into catJoin
                from cat in catJoin.DefaultIfEmpty()
                select new PhotoPropertyCandidate(
                    p.Id,
                    p.WardId,
                    p.PropertyNo,
                    p.PartitionNo,
                    cat != null ? cat.PropertyCategoryName : null,
                    (cat != null && cat.PropertyCategoryName != null && cat.PropertyCategoryName.Contains(PropertyMediaConstants.IndividualCategoryKeyword)) || p.CategoryId == PropertyMediaConstants.IndividualCategoryId
                );

            var chunkResults = await chunkQuery.ToListAsync(cancellationToken);
            properties.AddRange(chunkResults);
        }

        // Index candidates by (WardId, UpperPropertyNo) for O(1) in-memory lookups instead of O(N*M) linear scans
        var propertiesLookup = properties
            .Where(p => !string.IsNullOrWhiteSpace(p.PropertyNo))
            .ToLookup(p => (p.WardId, p.PropertyNo!.Trim().ToUpperInvariant()));

        foreach (var (fileName, s) in parsed)
        {
            if (!wardIdByNo.TryGetValue(s.WardNo, out var wardId))
            {
                results.Add(Classify(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.WardNotFound)));
                continue;
            }

            var candidates = propertiesLookup[(wardId, s.PropertyNo.Trim().ToUpperInvariant())].ToList();

            if (candidates.Count == 0)
            {
                results.Add(Classify(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.PropertyNotFound)));
                continue;
            }

            PhotoPropertyCandidate? matchedCandidate = null;

            if (string.IsNullOrWhiteSpace(s.PartitionNo) || s.PartitionNo == PropertyMediaConstants.PartitionDash)
            {
                // PartitionNo was not provided in the filename (or provided as "-"):
                // Business rule: PartitionNo is optional ONLY for the 'Individual' category.
                // For all other property categories (Apartment, Industry, Plot), PartitionNo is mandatory.
                //
                // Therefore, only match if an unpartitioned Individual category property exists.
                matchedCandidate = candidates.FirstOrDefault(p => p.IsIndividual && (string.IsNullOrWhiteSpace(p.PartitionNo) || p.PartitionNo == PropertyMediaConstants.PartitionDash));
            }
            else
            {
                // PartitionNo was provided in the filename (e.g. "AM10", "1", "A1"):
                // Must find an exact match on PartitionNo in the database.
                // If the specified PartitionNo does not exist under this property in the database,
                // it is not a match (must NOT fall back to an unpartitioned or general Individual property).
                matchedCandidate = candidates.FirstOrDefault(p =>
                    string.Equals(p.PartitionNo, s.PartitionNo, StringComparison.OrdinalIgnoreCase));
            }

            if (matchedCandidate == null)
            {
                results.Add(Classify(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.PropertyNotFound)));
                continue;
            }

            // For non-individual categories (Apartment, Industry, Plot), ensure PartitionNo is mandatory
            if (!matchedCandidate.IsIndividual && (string.IsNullOrWhiteSpace(s.PartitionNo) || s.PartitionNo == PropertyMediaConstants.PartitionDash))
            {
                results.Add(Classify(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.PropertyNotFound)));
                continue;
            }

            string? partNo = matchedCandidate.PartitionNo;
            results.Add(new PropertyMediaFileMatchResult
            {
                FileName = fileName,
                WardNo = s.WardNo,
                PropertyNo = s.PropertyNo,
                PartitionNo = s.PartitionNo ?? partNo ?? "-",
                Suffix = s.Suffix,
                Status = nameof(PropertyMediaJobDetailStatus.Matched),
                PropertyId = matchedCandidate.Id,
                PropertyDisplay = $"Ward {s.WardNo} - Property {s.PropertyNo}" + (string.IsNullOrWhiteSpace(partNo) || partNo == "-" ? string.Empty : $" - {partNo}")
            });
        }

        return results;
    }

    private sealed record PlanPropertyCandidate(
        int Id,
        int WardId,
        string? PropertyNo,
        string? PartitionNo,
        string? Type,
        string? CategoryName,
        string? PartType);

    /// <summary>
    /// Independent Property Plan resolution logic (WardNo-CategoryCode-PropertyNo[-PartType+Type]).
    /// </summary>
    private async Task<List<PropertyMediaFileMatchResult>> ResolvePlanAsync(
        IReadOnlyList<string> fileNames, CancellationToken cancellationToken)
    {
        var results = new List<PropertyMediaFileMatchResult>(fileNames.Count);
        var parsed = new Dictionary<string, (string WardNo, char CategoryCode, string PropertyNo, string? PartTypeAndType)>(fileNames.Count);

        foreach (var fileName in fileNames)
        {
            if (TryParsePlanFileName(fileName, out var wardNo, out var categoryCode, out var propertyNo, out var partTypeAndType))
                parsed[fileName] = (wardNo!, categoryCode, propertyNo!, partTypeAndType);
            else
                results.Add(Classify(fileName, null, nameof(PropertyMediaJobDetailStatus.Invalid), nameof(PropertyMediaSkipReason.InvalidFileNameFormat)));
        }

        if (parsed.Count == 0)
            return results;

        var wardNos = parsed.Values.Select(p => p.WardNo).Distinct().ToList();
        var wardIdByNo = (await _wardRepo.GetQueryable().AsNoTracking()
                .Where(w => wardNos.Contains(w.WardNo) && w.IsActive)
                .Select(w => new { w.Id, w.WardNo })
                .ToListAsync(cancellationToken))
            .ToDictionary(w => w.WardNo, w => w.Id, StringComparer.OrdinalIgnoreCase);

        var wardIds = wardIdByNo.Values.Distinct().ToList();
        if (wardIds.Count == 0)
        {
            foreach (var (fileName, s) in parsed)
            {
                results.Add(ClassifyPlan(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.WardNotFound)));
            }
            return results;
        }

        var propertyNos = parsed.Values.Select(p => p.PropertyNo).Distinct().ToList();

        // Chunk property numbers to safely stay well under SQL Server's 2,100 parameter limit and optimize query execution plans
        const int chunkSize = 500;
        var properties = new List<PlanPropertyCandidate>();
        foreach (var chunk in propertyNos.Chunk(chunkSize))
        {
            var chunkList = chunk.ToList();
            var chunkQuery =
                from p in _propertyRepo.GetQueryable().AsNoTracking()
                where wardIds.Contains(p.WardId) && p.PropertyNo != null && chunkList.Contains(p.PropertyNo!) && p.IsActive && !p.MarkedForDeletion && !string.IsNullOrWhiteSpace(p.PropertyNo)
                join cat in _categoryRepo.GetQueryable().AsNoTracking() on p.CategoryId equals cat.Id into catJoin
                from cat in catJoin.DefaultIfEmpty()
                join pt in _propertyTypeRepo.GetQueryable().AsNoTracking() on p.PropertyTypeId equals pt.Id into ptJoin
                from pt in ptJoin.DefaultIfEmpty()
                select new PlanPropertyCandidate(
                    p.Id,
                    p.WardId,
                    p.PropertyNo,
                    p.PartitionNo,
                    p.Type,
                    cat != null ? cat.PropertyCategoryName : null,
                    pt != null ? pt.PartType : null
                );

            var chunkResults = await chunkQuery.ToListAsync(cancellationToken);
            properties.AddRange(chunkResults);
        }

        // Index candidates by (WardId, UpperPropertyNo, CategoryCode) for O(1) in-memory lookups instead of O(N*M) linear scans
        var propertiesLookup = properties
            .Where(p => !string.IsNullOrWhiteSpace(p.PropertyNo))
            .ToLookup(p => (p.WardId, p.PropertyNo!.Trim().ToUpperInvariant(), GetCategoryCode(p.CategoryName)));

        foreach (var (fileName, s) in parsed)
        {
            if (!wardIdByNo.TryGetValue(s.WardNo, out var wardId))
            {
                results.Add(ClassifyPlan(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.WardNotFound)));
                continue;
            }

            var candidates = propertiesLookup[(wardId, s.PropertyNo.Trim().ToUpperInvariant(), s.CategoryCode)].ToList();

            if (candidates.Count == 0)
            {
                results.Add(ClassifyPlan(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.PropertyNotFound)));
                continue;
            }

            PlanPropertyCandidate? matchedCandidate = null;
            if (!string.IsNullOrWhiteSpace(s.PartTypeAndType))
            {
                // Match apartment partitions with PartType + Type
                matchedCandidate = candidates.FirstOrDefault(p =>
                    s.CategoryCode == 'A'
                    && !string.IsNullOrWhiteSpace(p.PartitionNo) && p.PartitionNo != "-"
                    && !string.IsNullOrWhiteSpace(p.PartType)
                    && string.Equals($"{p.PartType}{p.Type}", s.PartTypeAndType, StringComparison.OrdinalIgnoreCase));

                // Fallback: match without partition constraint if PartType+Type still matches
                if (matchedCandidate == null)
                {
                    matchedCandidate = candidates.FirstOrDefault(p =>
                        !string.IsNullOrWhiteSpace(p.PartType)
                        && string.Equals($"{p.PartType}{p.Type}", s.PartTypeAndType, StringComparison.OrdinalIgnoreCase));
                }
            }
            else
            {
                // 3 segments (Ward-Category-PropertyNo): prefer parent/non-partitioned or first matching
                matchedCandidate = candidates.FirstOrDefault(p => string.IsNullOrWhiteSpace(p.PartitionNo) || p.PartitionNo == "-")
                    ?? candidates.First();
            }

            if (matchedCandidate == null)
            {
                results.Add(ClassifyPlan(fileName, s, nameof(PropertyMediaJobDetailStatus.NoMatch), nameof(PropertyMediaSkipReason.PropertyNotFound)));
                continue;
            }

            string? partNo = matchedCandidate.PartitionNo;
            results.Add(new PropertyMediaFileMatchResult
            {
                FileName = fileName,
                WardNo = s.WardNo,
                PropertyNo = s.PropertyNo,
                PartitionNo = partNo ?? "-",
                Suffix = s.PartTypeAndType,
                Status = nameof(PropertyMediaJobDetailStatus.Matched),
                PropertyId = matchedCandidate.Id,
                PropertyDisplay = $"Ward {s.WardNo} - Property {s.PropertyNo}"
                    + (!string.IsNullOrWhiteSpace(partNo) && partNo != "-" ? $" - {partNo}" : "")
                    + (!string.IsNullOrWhiteSpace(s.PartTypeAndType) ? $" ({s.PartTypeAndType})" : "")
            });
        }

        return results;
    }

    private static PropertyMediaFileMatchResult ClassifyPlan(
        string fileName,
        (string WardNo, char CategoryCode, string PropertyNo, string? PartTypeAndType)? segments,
        string status,
        string skipReason) => new()
        {
            FileName = fileName,
            WardNo = segments?.WardNo,
            PropertyNo = segments?.PropertyNo,
            PartitionNo = null,
            Suffix = segments?.PartTypeAndType,
            Status = status,
            SkipReason = skipReason
        };

    private static PropertyMediaFileMatchResult Classify(
        string fileName,
        (string WardNo, string PropertyNo, string PartitionNo, string Suffix)? segments,
        string status,
        string skipReason) => new()
        {
            FileName = fileName,
            WardNo = segments?.WardNo,
            PropertyNo = segments?.PropertyNo,
            PartitionNo = segments?.PartitionNo,
            Suffix = segments?.Suffix,
            Status = status,
            SkipReason = skipReason
        };
}
