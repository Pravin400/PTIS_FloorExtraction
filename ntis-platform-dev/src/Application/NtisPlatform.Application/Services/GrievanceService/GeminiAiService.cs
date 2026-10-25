using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace NtisPlatform.Application.Services.GrievanceService;

/// <summary>
/// Service orchestrator for interacting with Google Gemini Vision API to classify and refine civic grievances.
/// Prompts are stored in Constants/GrievanceAiPrompts.cs and validations in Helpers/GrievanceAiValidationHelper.cs.
/// </summary>
public class GeminiAiService : IGeminiAiService
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".jfif"];
    private static readonly string[] AllowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/jfif"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB per file limit

    private static readonly object[] DefaultSafetySettings =
    [
        new { category = "HARM_CATEGORY_HARASSMENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
        new { category = "HARM_CATEGORY_HATE_SPEECH", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
        new { category = "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold = "BLOCK_LOW_AND_ABOVE" },
        new { category = "HARM_CATEGORY_DANGEROUS_CONTENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" }
    ];

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IRepository<GrievanceDepartmentMasterEntity, int> _departmentRepository;
    private readonly IRepository<GrievanceTypeMasterEntity, int> _typeRepository;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<GeminiAiService> _logger;

    public GeminiAiService(
        HttpClient httpClient,
        IConfiguration configuration,
        IRepository<GrievanceDepartmentMasterEntity, int> departmentRepository,
        IRepository<GrievanceTypeMasterEntity, int> typeRepository,
        IMemoryCache memoryCache,
        ILogger<GeminiAiService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _departmentRepository = departmentRepository;
        _typeRepository = typeRepository;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<GrievanceAiAnalysisDto?> ScanUploadedPhotosAsync(
        IEnumerable<IFormFile>? photos,
        CancellationToken cancellationToken = default)
    {
        var allFiles = photos?.Where(f => f != null && f.Length > 0).ToList() ?? [];

        if (allFiles.Count == 0)
        {
            throw new ArgumentException("At least one valid image file must be uploaded.");
        }

        if (allFiles.Count > 5)
        {
            throw new ArgumentException("A maximum of 5 images can be scanned at a time.");
        }

        var imagesToScan = new List<(byte[] ImageBytes, string MimeType)>();

        foreach (var file in allFiles)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var contentType = (file.ContentType ?? string.Empty).ToLowerInvariant();

            if (!AllowedExtensions.Contains(ext) && !AllowedMimeTypes.Contains(contentType))
            {
                throw new ArgumentException($"File '{file.FileName}' is not a supported image format. Allowed formats: JPG, JPEG, PNG, WEBP, JFIF.");
            }

            if (file.Length > MaxFileSize)
            {
                throw new ArgumentException($"File '{file.FileName}' exceeds the maximum allowed size of 10MB.");
            }

            using var ms = file.Length > 0 ? new MemoryStream((int)file.Length) : new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);
            var bytes = ms.ToArray();

            if (bytes.Length == 0) continue;

            var mimeType = AllowedMimeTypes.Contains(contentType) ? contentType : GetMimeType(file.FileName);
            imagesToScan.Add((bytes, mimeType));
        }

        if (imagesToScan.Count == 0)
        {
            throw new ArgumentException("Could not load any valid image content from uploaded file(s).");
        }

        return await ScanMultipleImagesAsync(imagesToScan, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<GrievanceAiAnalysisDto?> ScanImageAsync(
        byte[] imageBytes,
        string mimeType,
        CancellationToken cancellationToken = default)
    {
        if (imageBytes == null || imageBytes.Length == 0) return null;
        return await ScanMultipleImagesAsync([(imageBytes, mimeType)], cancellationToken);
    }

    /// <inheritdoc />
    public async Task<GrievanceAiAnalysisDto?> ScanMultipleImagesAsync(
        IEnumerable<(byte[] ImageBytes, string MimeType)> images,
        CancellationToken cancellationToken = default)
    {
        var validImages = images?.Where(img => img.ImageBytes != null && img.ImageBytes.Length > 0).ToList();
        if (validImages == null || validImages.Count == 0) return null;

        var apiKeys = GetConfiguredApiKeys();
        if (apiKeys.Count == 0)
        {
            _logger.LogWarning("Gemini API key is not configured or using default placeholder. Skipping AI vision scan.");
            return null;
        }

        var baseUrl = _configuration["Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com/v1beta/models/";
        var model = _configuration["Gemini:Model"] ?? "gemini-3.5-flash-lite";

        try
        {
            var (activeDepartments, deptPrompt) = await GetActiveDepartmentsCachedAsync(cancellationToken);
            var (activeTypes, typePrompt) = await GetActiveTypesCachedAsync(cancellationToken);
            var prompt = GrievanceAiPrompts.BuildMultiPhotoVisionPrompt(validImages.Count, deptPrompt, typePrompt);

            var contentParts = new List<object>();
            for (int i = 0; i < validImages.Count; i++)
            {
                var (imgBytes, imgMime) = validImages[i];
                var safeMime = string.IsNullOrWhiteSpace(imgMime) ? "image/jpeg" : imgMime;
                contentParts.Add(new { text = $"[Photo {i + 1} of {validImages.Count}]:" });
                contentParts.Add(new
                {
                    inlineData = new
                    {
                        mimeType = safeMime,
                        data = Convert.ToBase64String(imgBytes)
                    }
                });
            }
            contentParts.Add(new { text = prompt });

            var requestBody = new
            {
                contents = new[] { new { parts = contentParts.ToArray() } },
                safetySettings = DefaultSafetySettings,
                generationConfig = new { responseMimeType = "application/json", temperature = 0.0, maxOutputTokens = 1000 }
            };

            var utf8Bytes = JsonSerializer.SerializeToUtf8Bytes(requestBody);
            using var doc = await SendGeminiRequestWithFallbackAsync(baseUrl, model, utf8Bytes, "vision scan", cancellationToken);
            if (doc == null) return null;

            return PostProcessCandidateResponse(doc, "vision scan", model, isVisionScan: true, activeDepartments, activeTypes);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to scan image with Gemini AI Vision");
            return null;
        }
    }

    /// <inheritdoc />
    public async Task<GrievanceAiAnalysisDto?> RefineDescriptionAsync(
        string rawDescription,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawDescription) || rawDescription.Trim().Length < 3)
        {
            throw new ArgumentException("Please provide a valid description of at least 3 characters.");
        }

        var apiKeys = GetConfiguredApiKeys();
        if (apiKeys.Count == 0)
        {
            _logger.LogWarning("Gemini API key is not configured or using default placeholder. Skipping AI text refinement.");
            return null;
        }

        var baseUrl = _configuration["Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com/v1beta/models/";
        var model = _configuration["Gemini:Model"] ?? "gemini-3.5-flash-lite";

        try
        {
            var (activeDepartments, deptPrompt) = await GetActiveDepartmentsCachedAsync(cancellationToken);
            var (activeTypes, typePrompt) = await GetActiveTypesCachedAsync(cancellationToken);

            var safeRawText = rawDescription.Replace("\"", "\\\"").Replace("\r", " ").Replace("\n", " ");
            var prompt = GrievanceAiPrompts.BuildTextRefinementPrompt(safeRawText, deptPrompt, typePrompt);

            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                safetySettings = DefaultSafetySettings,
                generationConfig = new { responseMimeType = "application/json", temperature = 0.0, maxOutputTokens = 400 }
            };

            var utf8Bytes = JsonSerializer.SerializeToUtf8Bytes(requestBody);
            using var doc = await SendGeminiRequestWithFallbackAsync(baseUrl, model, utf8Bytes, "text refine", cancellationToken);
            if (doc == null) return null;

            return PostProcessCandidateResponse(doc, "text refine", model, isVisionScan: false, activeDepartments, activeTypes);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refine description with Gemini AI");
            return null;
        }
    }

    /// <summary>
    /// Processes and validates Gemini API JSON candidate response, applying relational validation, normalization, and safety rules.
    /// </summary>
    private GrievanceAiAnalysisDto? PostProcessCandidateResponse(
        JsonDocument doc,
        string operationName,
        string model,
        bool isVisionScan,
        List<DepartmentCacheItem> activeDepartments,
        List<TypeCacheItem> activeTypes)
    {
        var safetyBlock = GrievanceAiValidationHelper.CheckSafetyBlock(doc, operationName, _logger);
        if (safetyBlock != null) return safetyBlock;

        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            return null;
        }

        var candidate = candidates[0];
        if (!candidate.TryGetProperty("content", out var content) ||
            !content.TryGetProperty("parts", out var parts) ||
            parts.GetArrayLength() == 0 ||
            !parts[0].TryGetProperty("text", out var textElem))
        {
            return null;
        }

        var candidateText = textElem.GetString();
        if (string.IsNullOrWhiteSpace(candidateText)) return null;

        var analysisResult = GrievanceAiValidationHelper.ParseCandidateResponse(candidateText, operationName, _logger);
        if (analysisResult == null) return null;

        if (!analysisResult.IsValidCivicIssue || analysisResult.DepartmentId == null || analysisResult.GrievanceTypeId == null)
        {
            GrievanceAiValidationHelper.ApplyCivicRejectionFallback(analysisResult, isVisionScan);
            return analysisResult;
        }

        if (!GrievanceAiValidationHelper.ValidateAiResult(analysisResult, activeDepartments, activeTypes))
        {
            _logger.LogWarning("Gemini returned invalid department/type classification. DepartmentId: {DeptId}, TypeId: {TypeId}",
                analysisResult.DepartmentId, analysisResult.GrievanceTypeId);
            GrievanceAiValidationHelper.ApplyRelationalValidationFailure(analysisResult);
            return analysisResult;
        }

        GrievanceAiValidationHelper.NormalizeAiResult(analysisResult, activeDepartments, activeTypes);
        analysisResult.ModelUsed = model;
        analysisResult.IsValidCivicIssue = true;
        analysisResult.IsExplicitOrInappropriate = false;
        analysisResult.IsImageUnclear = false;
        GrievanceAiValidationHelper.NormalizeAccuracyPercentage(analysisResult);

        if (isVisionScan)
        {
            analysisResult.SuggestedDescription = GrievanceAiValidationHelper.CleanPhotoReferences(analysisResult.SuggestedDescription);
            analysisResult.SuggestedDescriptionLocal = GrievanceAiValidationHelper.CleanPhotoReferences(analysisResult.SuggestedDescriptionLocal);
            analysisResult.SuggestedTitle = GrievanceAiValidationHelper.CleanPhotoReferences(analysisResult.SuggestedTitle);
            analysisResult.SuggestedTitleLocal = GrievanceAiValidationHelper.CleanPhotoReferences(analysisResult.SuggestedTitleLocal);
        }
        else
        {
            analysisResult.SuggestedDescription = GrievanceAiValidationHelper.CleanRefinedDescription(analysisResult.SuggestedDescription);
            analysisResult.SuggestedDescriptionLocal = GrievanceAiValidationHelper.CleanRefinedDescription(analysisResult.SuggestedDescriptionLocal);
            analysisResult.SuggestedTitle = GrievanceAiValidationHelper.CleanRefinedDescription(analysisResult.SuggestedTitle);
            analysisResult.SuggestedTitleLocal = GrievanceAiValidationHelper.CleanRefinedDescription(analysisResult.SuggestedTitleLocal);
        }

        return analysisResult;
    }

    private async Task<(List<DepartmentCacheItem> Items, string FormattedPrompt)> GetActiveDepartmentsCachedAsync(CancellationToken cancellationToken)
    {
        const string cacheKey = "GrievanceAi_ActiveDepartments_V2";
        if (!_memoryCache.TryGetValue(cacheKey, out (List<DepartmentCacheItem> Items, string FormattedPrompt) cached))
        {
            var departments = await _departmentRepository
                .GetQueryable()
                .AsNoTracking()
                .Where(d => d.IsActive)
                .OrderBy(d => d.Id)
                .Select(d => new DepartmentCacheItem(d.Id, d.DepartmentName, d.DepartmentNameLocal))
                .ToListAsync(cancellationToken);

            cached = (departments, GrievanceAiPrompts.FormatActiveDepartments(departments));
            _memoryCache.Set(cacheKey, cached, new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(2)).SetSize(1));
        }
        return cached;
    }

    private async Task<(List<TypeCacheItem> Items, string FormattedPrompt)> GetActiveTypesCachedAsync(CancellationToken cancellationToken)
    {
        const string cacheKey = "GrievanceAi_ActiveTypes_V2";
        if (!_memoryCache.TryGetValue(cacheKey, out (List<TypeCacheItem> Items, string FormattedPrompt) cached))
        {
            var types = await _typeRepository
                .GetQueryable()
                .AsNoTracking()
                .Where(t => t.IsActive)
                .OrderBy(t => t.Id)
                .Select(t => new TypeCacheItem(t.Id, t.GrievanceDepartmentId, t.GrievanceType))
                .ToListAsync(cancellationToken);

            cached = (types, GrievanceAiPrompts.FormatActiveTypes(types));
            _memoryCache.Set(cacheKey, cached, new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(2)).SetSize(1));
        }
        return cached;
    }

    private List<string> GetConfiguredApiKeys()
    {
        var keys = new List<string>();
        var primaryKey = _configuration["Gemini:ApiKey"];
        var fallbackKey = _configuration["Gemini:FallbackApiKey"];

        if (!string.IsNullOrWhiteSpace(primaryKey) && primaryKey != "YOUR_GEMINI_API_KEY") keys.Add(primaryKey);
        if (!string.IsNullOrWhiteSpace(fallbackKey) && fallbackKey != "YOUR_GEMINI_FALLBACK_API_KEY" && !keys.Contains(fallbackKey)) keys.Add(fallbackKey);

        return keys;
    }

    private async Task<JsonDocument?> SendGeminiRequestWithFallbackAsync(
        string baseUrl,
        string model,
        byte[] utf8Bytes,
        string operationName,
        CancellationToken cancellationToken)
    {
        var keys = GetConfiguredApiKeys();
        for (int i = 0; i < keys.Count; i++)
        {
            var currentKey = keys[i];
            var isFallback = i > 0;
            var requestUrl = $"{baseUrl.TrimEnd('/')}/{model}:generateContent?key={currentKey}";

            try
            {
                using var byteContent = new ByteArrayContent(utf8Bytes);
                byteContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

                using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl) { Content = byteContent };
                var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                    return await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken);
                }

                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Gemini {KeyType} API key failed for {Operation} with status {StatusCode}: {ErrorBody}",
                    isFallback ? "fallback" : "primary", operationName, response.StatusCode, errorBody);

                if (i < keys.Count - 1)
                {
                    _logger.LogInformation("Instantly falling back to secondary Gemini API key for {Operation}...", operationName);
                }
            }
            catch (OperationCanceledException) { throw; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Exception occurred with Gemini {KeyType} API key for {Operation}.",
                    isFallback ? "fallback" : "primary", operationName);

                if (i < keys.Count - 1)
                {
                    _logger.LogInformation("Instantly falling back to secondary Gemini API key for {Operation} after exception...", operationName);
                }
            }
        }

        return null;
    }

    private static string GetMimeType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".jfif" => "image/jpeg",
            ".bmp" => "image/bmp",
            _ => "image/jpeg"
        };
    }
}
