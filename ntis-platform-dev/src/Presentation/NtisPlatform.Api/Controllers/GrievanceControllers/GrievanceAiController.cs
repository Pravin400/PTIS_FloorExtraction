using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for citizen grievance AI vision analysis and automated description generation.
/// Pure HTTP endpoint delegating all validation, stream processing, and classification to IGeminiAiService.
/// </summary>
[ApiController]
[Route("api/grievance-ai")]
[AllowAnonymous]
public class GrievanceAiController : ControllerBase
{
    private readonly IGeminiAiService _geminiAiService;
    private readonly ILogger<GrievanceAiController> _logger;

    public GrievanceAiController(
        IGeminiAiService geminiAiService,
        ILogger<GrievanceAiController> logger)
    {
        _geminiAiService = geminiAiService;
        _logger = logger;
    }

    /// <summary>
    /// AI Vision Scan: analyzes grievance photo(s) in memory and automatically generates title, descriptions (English &amp; Marathi), department, and grievance type.
    /// Purely stateless and in-memory (no files stored on disk, no records inserted into DB).
    /// Supports single or multiple image uploads.
    /// </summary>
    /// <param name="photos">Uploaded grievance image file(s) (1 to 5 images)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpPost("scan-image")]
    [Consumes("multipart/form-data")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GrievanceAiAnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ScanImage(
        [MaxLength(5, ErrorMessage = "A maximum of 5 images can be uploaded.")]
        List<IFormFile>? photos,
        CancellationToken ct)
    {
        try
        {
            var files = (photos != null && photos.Count > 0)
                ? photos
                : (Request?.HasFormContentType == true ? Request.Form.Files.ToList() : null);

            var analysis = await _geminiAiService.ScanUploadedPhotosAsync(files, ct);
            if (analysis == null)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Gemini AI analysis could not be generated for the provided photo(s)." });
            }

            return Ok(analysis);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Refines raw citizen text, corrects spelling mistakes and grammar, and formats it into formal English and Marathi complaints with matching department and defect type.
    /// </summary>
    /// <param name="dto">Request containing citizen's rough description</param>
    /// <param name="ct">Cancellation token</param>
    [HttpPost("refine-description")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GrievanceAiAnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> RefineDescription([FromBody] RefineGrievanceDescriptionRequestDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _geminiAiService.RefineDescriptionAsync(dto?.RawDescription ?? string.Empty, ct);
            if (result == null)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Gemini AI description refinement service is currently unavailable. Please try again." });
            }

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
