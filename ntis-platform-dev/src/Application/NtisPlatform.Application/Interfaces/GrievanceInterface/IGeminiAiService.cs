using Microsoft.AspNetCore.Http;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service for interacting with Google Gemini Vision API to classify grievance images
/// </summary>
public interface IGeminiAiService
{
    /// <summary>
    /// Validates and scans uploaded grievance photos (1 to 5 images), reading bytes in memory and classifying with Gemini Vision
    /// </summary>
    Task<GrievanceAiAnalysisDto?> ScanUploadedPhotosAsync(
        IEnumerable<IFormFile>? photos,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Scans a raw image byte payload and maps it to the 65 active municipal departments and defect types
    /// </summary>
    Task<GrievanceAiAnalysisDto?> ScanImageAsync(
        byte[] imageBytes,
        string mimeType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Scans multiple raw image byte payloads together in a single prompt and maps them to the 65 active municipal departments and defect types
    /// </summary>
    Task<GrievanceAiAnalysisDto?> ScanMultipleImagesAsync(
        IEnumerable<(byte[] ImageBytes, string MimeType)> images,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Refines raw citizen-written text, fixes spelling and grammar, and formats it into formal English &amp; Marathi complaints with matching department and grievance type.
    /// </summary>
    Task<GrievanceAiAnalysisDto?> RefineDescriptionAsync(
        string rawDescription,
        CancellationToken cancellationToken = default);
}
