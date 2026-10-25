using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace NtisPlatform.Application.Helpers;

/// <summary>
/// Domain validation guardrails, safety verification, and normalization helper for AI grievance analysis.
/// Kept separate from services to adhere to Clean Architecture standards.
/// </summary>
public static class GrievanceAiValidationHelper
{
    private static readonly string[] PhotoReferencePrefixes = new[]
    {
        "The image shows that ", "The image shows ",
        "The photo shows that ", "The photo shows ",
        "The picture shows that ", "The picture shows ",
        "This image shows that ", "This image shows ",
        "This photo shows that ", "This photo shows ",
        "In this image, ", "In this photo, ", "In the picture, ",
        "The image depicts ", "The photo depicts ", "This image displays ",
        "This is an image of ", "This is a photo of ",
        "या फोटोमध्ये ", "या प्रतिमेत "
    };

    private static readonly string[] ThirdPersonRefinedPrefixes = new[]
    {
        "The citizen is reporting issues related to ",
        "The citizen is reporting issues regarding ",
        "The citizen is reporting issues of ",
        "The citizen is reporting problems related to ",
        "The citizen is reporting a problem with ",
        "The citizen is reporting an issue with ",
        "The citizen is reporting that there is ",
        "The citizen is reporting that ",
        "The citizen is reporting ",
        "The citizen reports issues related to ",
        "The citizen reports issues regarding ",
        "The citizen reports that there is ",
        "The citizen reports that ",
        "The citizen reports ",
        "The citizen states that there is ",
        "The citizen states that ",
        "The citizen states ",
        "The resident is reporting issues related to ",
        "The resident is reporting that ",
        "The resident is reporting ",
        "The resident reports that ",
        "The resident reports ",
        "The resident states that ",
        "The resident states ",
        "The user is reporting that ",
        "The user is reporting ",
        "The user reports that ",
        "The user reports ",
        "The complainant is reporting that ",
        "The complainant is reporting ",
        "The complainant reports that ",
        "The complainant reports ",
        "The complainant states that ",
        "The complainant states ",
        "This complaint is regarding ",
        "This complaint is about ",
        "नागरिक या भागात तक्रार करत आहेत की ",
        "नागरिक या भागात तक्रार करत आहेत, ",
        "नागरिक या भागात तक्रार करत आहेत ",
        "नागरिक या भागात ",
        "नागरिक तक्रार करत आहेत की ",
        "नागरिक तक्रार करत आहेत, ",
        "नागरिक तक्रार करत आहेत. ",
        "नागरिक तक्रार करत आहेत ",
        "नागरिकांची अशी तक्रार आहे की ",
        "नागरिकांचे म्हणणे आहे की "
    };

    /// <summary>
    /// Checks for Google Gemini safety blocks at both prompt feedback and candidate finishReason levels.
    /// Returns a populated rejection DTO if blocked, or null if clear.
    /// </summary>
    public static GrievanceAiAnalysisDto? CheckSafetyBlock(JsonDocument doc, string operationName, ILogger? logger = null)
    {
        // 1. Prompt-level safety filter block
        if (doc.RootElement.TryGetProperty("promptFeedback", out var feedback) &&
            feedback.TryGetProperty("blockReason", out var blockReasonElem))
        {
            var blockReason = blockReasonElem.GetString();
            logger?.LogWarning("Gemini blocked {Operation} due to policy: {BlockReason}", operationName, blockReason);
            return new GrievanceAiAnalysisDto
            {
                IsValidCivicIssue = false,
                IsExplicitOrInappropriate = true,
                RejectionReason = "Uploaded image violates safety policies (inappropriate or explicit content).",
                RejectionReasonLocal = "अपलोड केलेल्या फोटोमध्ये आक्षेपार्ह किंवा संवेदनशील सामग्री आढळल्यामुळे ही तक्रार स्वीकारली जाऊ शकत नाही.",
                AccuracyPercentage = 0.0
            };
        }

        // 2. Candidate-level safety filter block
        if (doc.RootElement.TryGetProperty("candidates", out var candidates) &&
            candidates.GetArrayLength() > 0)
        {
            var candidate = candidates[0];
            if (candidate.TryGetProperty("finishReason", out var finishReasonElem) &&
                finishReasonElem.GetString() == "SAFETY")
            {
                logger?.LogWarning("Gemini candidate blocked by native Safety filter during {Operation}.", operationName);
                return new GrievanceAiAnalysisDto
                {
                    IsValidCivicIssue = false,
                    IsExplicitOrInappropriate = true,
                    RejectionReason = "Uploaded image violates safety policies (inappropriate or explicit content).",
                    RejectionReasonLocal = "अपलोड केलेल्या फोटोमध्ये आक्षेपार्ह किंवा संवेदनशील सामग्री आढळल्यामुळे ही तक्रार स्वीकारली जाऊ शकत नाही.",
                    AccuracyPercentage = 0.0
                };
            }
        }

        return null;
    }

    /// <summary>
    /// Parses the raw JSON text from Gemini candidate response into GrievanceAiAnalysisDto.
    /// </summary>
    public static GrievanceAiAnalysisDto? ParseCandidateResponse(string candidateText, string operationName, ILogger? logger = null)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<GrievanceAiAnalysisDto>(candidateText, options);
        }
        catch (JsonException ex)
        {
            logger?.LogWarning(ex, "Gemini returned invalid JSON for {Operation}: {Text}", operationName, candidateText);
            return null;
        }
    }

    /// <summary>
    /// Performs lightweight local validation of the AI classification.
    /// Strictly 0 AI tokens — validates using cached department and type records.
    /// </summary>
    public static bool ValidateAiResult(
        GrievanceAiAnalysisDto? result,
        List<DepartmentCacheItem> departments,
        List<TypeCacheItem> types)
    {
        if (result == null) return false;

        if (!result.DepartmentId.HasValue || !result.GrievanceTypeId.HasValue)
            return false;

        if (result.AccuracyPercentage is < 0 or > 100)
            return false;

        var department = departments.FirstOrDefault(d => d.Id == result.DepartmentId.Value);
        if (department == null) return false;

        var grievanceType = types.FirstOrDefault(t => t.Id == result.GrievanceTypeId.Value);
        if (grievanceType == null) return false;

        // Enforce foreign key relationship: selected grievance type MUST belong to the selected department
        return grievanceType.GrievanceDepartmentId == department.Id;
    }

    /// <summary>
    /// Applies fallback rejection reasons if the analysis result is non-civic or missing classifications.
    /// </summary>
    public static void ApplyCivicRejectionFallback(GrievanceAiAnalysisDto analysisResult, bool isVisionScan)
    {
        analysisResult.IsValidCivicIssue = false;
        analysisResult.AccuracyPercentage = 0;

        if (string.IsNullOrWhiteSpace(analysisResult.RejectionReason))
        {
            if (isVisionScan)
            {
                analysisResult.RejectionReason = "The submitted photo(s) do not appear to show a valid municipal civic complaint. Please upload clear photos of the civic issue.";
                analysisResult.RejectionReasonLocal = "अपलोड केलेले फोटो वैध नागरी समस्येचे दिसत नाहीत. कृपया नागरी समस्येचे स्पष्ट फोटो अपलोड करा.";
            }
            else
            {
                analysisResult.RejectionReason = "The submitted text does not appear to describe a valid municipal civic complaint.";
                analysisResult.RejectionReasonLocal = "सादर केलेला मजकूर वैध नागरी समस्येचा दिसत नाही.";
            }
        }
    }

    /// <summary>
    /// Applies rejection reasons when local relational validation fails.
    /// </summary>
    public static void ApplyRelationalValidationFailure(GrievanceAiAnalysisDto analysisResult)
    {
        analysisResult.IsValidCivicIssue = false;
        analysisResult.AccuracyPercentage = 0;
        analysisResult.RejectionReason = "The submitted complaint could not be assigned to a valid department and grievance type. Please try again.";
        analysisResult.RejectionReasonLocal = "सादर केलेली तक्रार योग्य विभाग आणि तक्रारीच्या प्रकाराशी निश्चितपणे जोडता आली नाही. कृपया पुन्हा प्रयत्न करा.";
    }

    /// <summary>
    /// Replaces AI-generated master names with authoritative database values.
    /// </summary>
    public static void NormalizeAiResult(
        GrievanceAiAnalysisDto result,
        List<DepartmentCacheItem> departments,
        List<TypeCacheItem> types)
    {
        if (!result.DepartmentId.HasValue || !result.GrievanceTypeId.HasValue) return;

        var department = departments.FirstOrDefault(d => d.Id == result.DepartmentId.Value);
        var grievanceType = types.FirstOrDefault(t => t.Id == result.GrievanceTypeId.Value);

        if (department != null)
        {
            result.DepartmentName = department.DepartmentName;
            result.DepartmentNameLocal = department.DepartmentNameLocal;
        }

        if (grievanceType != null)
        {
            result.GrievanceTypeName = grievanceType.GrievanceType;
        }
    }

    /// <summary>
    /// Cleans accidental photo-referencing phrases from generated text.
    /// </summary>
    public static string? CleanPhotoReferences(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        var trimmed = text.Trim();

        foreach (var prefix in PhotoReferencePrefixes)
        {
            if (trimmed.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                trimmed = trimmed.Substring(prefix.Length).Trim();
                if (trimmed.Length > 0 && char.IsLower(trimmed[0]))
                {
                    trimmed = char.ToUpper(trimmed[0]) + trimmed.Substring(1);
                }
                break;
            }
        }
        return trimmed;
    }

    /// <summary>
    /// Cleans accidental third-person AI-generated phrasing (such as 'The citizen is reporting...') from refined text.
    /// Ensures natural citizen tone.
    /// </summary>
    public static string? CleanRefinedDescription(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        var trimmed = text.Trim();

        foreach (var prefix in ThirdPersonRefinedPrefixes)
        {
            if (trimmed.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                trimmed = trimmed.Substring(prefix.Length).Trim();
                if (trimmed.Length > 0 && char.IsLower(trimmed[0]))
                {
                    trimmed = char.ToUpper(trimmed[0]) + trimmed.Substring(1);
                }
                break;
            }
        }
        return trimmed;
    }

    /// <summary>
    /// Normalizes accuracy percentage (supports both decimal 0.95 and whole number 95).
    /// </summary>
    public static void NormalizeAccuracyPercentage(GrievanceAiAnalysisDto result)
    {
        if (result.AccuracyPercentage.HasValue)
        {
            result.AccuracyPercentage = result.AccuracyPercentage.Value <= 1.0
                ? Math.Round(result.AccuracyPercentage.Value * 100, 1)
                : Math.Round(result.AccuracyPercentage.Value, 1);
        }
    }
}
