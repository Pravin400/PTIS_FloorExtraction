using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using NtisPlatform.Core.Enums;

namespace NtisPlatform.Application.DTOs.PropertyMedia;

/// <summary>One row of the "Choose What to Download" Excel/PDF report - a single matched file.</summary>
public class PropertyMediaMatchedFileDto
{
    public string? PropertyNo { get; set; }
    public string PhotoTypeName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

/// <summary>
/// Query parameters for fetching distinct property numbers applicable to the selected Ward(s)
/// and optional From Property No.
/// </summary>
public class PropertyMediaPropertyNumbersQueryParameters
{
    /// <summary>
    /// Multiple Ward IDs to filter properties when multiple wards are selected.
    /// Supports repeated query parameters (?wardIds=89&amp;wardIds=90) or comma-separated string (?wardIds=89,90).
    /// </summary>
    [ModelBinder(typeof(CommaSeparatedIntModelBinder))]
    public List<int>? WardIds { get; set; }

    /// <summary>Optional lower bound of property number range (From Property No).</summary>
    public string? FromPropertyNo { get; set; }
}

/// <summary>
/// Model binder for integer collections passed via query string.
/// Supports repeated query parameters (?wardIds=1&amp;wardIds=2),
/// comma-separated strings (?wardIds=1,2), array indexing (?wardIds[0]=1),
/// and singular fallback (?wardId=1,2).
/// </summary>
public class CommaSeparatedIntModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var modelName = bindingContext.ModelName;
        var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);

        if (valueProviderResult == ValueProviderResult.None)
        {
            if (modelName.EndsWith("WardIds", StringComparison.OrdinalIgnoreCase) ||
                modelName.EndsWith("WardId", StringComparison.OrdinalIgnoreCase))
            {
                valueProviderResult = bindingContext.ValueProvider.GetValue("wardIds");
                if (valueProviderResult == ValueProviderResult.None)
                {
                    valueProviderResult = bindingContext.ValueProvider.GetValue("wardId");
                }
                if (valueProviderResult == ValueProviderResult.None)
                {
                    valueProviderResult = bindingContext.ValueProvider.GetValue("WardIds");
                }
                if (valueProviderResult == ValueProviderResult.None)
                {
                    valueProviderResult = bindingContext.ValueProvider.GetValue("WardId");
                }
            }
        }

        if (valueProviderResult == ValueProviderResult.None)
        {
            return Task.CompletedTask;
        }

        var resultList = new List<int>();
        foreach (var val in valueProviderResult.Values)
        {
            if (string.IsNullOrWhiteSpace(val)) continue;
            var parts = val.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var part in parts)
            {
                if (!int.TryParse(part, out var parsedInt) || parsedInt <= 0)
                {
                    bindingContext.ModelState.TryAddModelError(modelName, $"'{part}' is not a valid ID.");
                    continue;
                }

                if (!resultList.Contains(parsedInt))
                {
                    resultList.Add(parsedInt);
                }
            }
        }

        bindingContext.Result = ModelBindingResult.Success(resultList);
        return Task.CompletedTask;
    }
}

/// <summary>
/// Model binder for nullable integer that gracefully handles comma-separated strings
/// (e.g. "89,90") without failing validation, extracting the first integer value.
/// </summary>
public class FlexibleNullableIntModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var modelName = bindingContext.ModelName;
        var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);

        if (valueProviderResult == ValueProviderResult.None || string.IsNullOrWhiteSpace(valueProviderResult.FirstValue))
        {
            return Task.CompletedTask;
        }

        var firstVal = valueProviderResult.FirstValue;
        if (int.TryParse(firstVal, out var singleInt))
        {
            bindingContext.Result = ModelBindingResult.Success(singleInt);
            return Task.CompletedTask;
        }

        var firstPart = firstVal.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        if (int.TryParse(firstPart, out var firstInt))
        {
            bindingContext.Result = ModelBindingResult.Success(firstInt);
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}

/// <summary>
/// Query parameters for downloading original images matching Category, PhotoSubType,
/// and optional Division, Ward(s), and From/To PropertyNo range into a single ZIP file.
/// Category and PhotoTypeId are required.
/// DivisionId, WardIds, FromPropertyNo, and ToPropertyNo are optional filters.
/// </summary>
public class PropertyMediaDownloadQueryParameters
{
    /// <summary>Media category: Photo (1), Plan (2), or Document (3). Required.</summary>
    [Required]
    public PropertyMediaCategory? Category { get; set; }

    /// <summary>The specific photo sub-type ID within the selected Category. Required.</summary>
    [Required]
    public int? PhotoTypeId { get; set; }

    /// <summary>Optional Division (Zone) ID to filter properties.</summary>
    public int? DivisionId { get; set; }

    /// <summary>
    /// Multiple Ward IDs to filter properties.
    /// Supports comma-separated IDs (e.g. "89,90"), array of IDs, or repeated parameters (?wardIds=89&amp;wardIds=90).
    /// </summary>
    [ModelBinder(typeof(CommaSeparatedIntModelBinder))]
    public List<int>? WardIds { get; set; }

    /// <summary>Optional: lower bound of property number range (inclusive).</summary>
    public string? FromPropertyNo { get; set; }

    /// <summary>Optional: upper bound of property number range (inclusive).</summary>
    public string? ToPropertyNo { get; set; }
}

/// <summary>
/// Internal DTO representing an original image file to be packed into the download ZIP.
/// </summary>
public class PropertyImageDownloadItemDto
{
    public int PropertyId { get; set; }
    public string PropertyNo { get; set; } = string.Empty;
    public string? PartitionNo { get; set; }
    public int PhotoTypeId { get; set; }
    public string PhotoTypeName { get; set; } = string.Empty;
    public int DocumentId { get; set; }
    public Guid DocumentGuid { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string StorageProvider { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}

/// <summary>
/// Result of generating the bulk image download ZIP file.
/// </summary>
public class PropertyMediaZipDownloadResult : IAsyncDisposable, IDisposable
{
    public Stream ZipStream { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public int TotalImagesCount { get; set; }
    public int TotalPropertiesCount { get; set; }

    public void Dispose()
    {
        ZipStream?.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        if (ZipStream != null)
        {
            await ZipStream.DisposeAsync();
        }
    }
}
