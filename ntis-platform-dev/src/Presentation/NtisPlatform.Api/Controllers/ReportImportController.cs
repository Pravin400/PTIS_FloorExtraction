using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NtisPlatform.Application.DTOs.ReportImport;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ReportImportController : ControllerBase
{
    private readonly IUniversalReportImportService _importService;
    private readonly ILogger<ReportImportController> _logger;

    public ReportImportController(
        IUniversalReportImportService importService,
        ILogger<ReportImportController> logger)
    {
        _importService = importService;
        _logger = logger;
    }

    /// <summary>
    /// Universal PDF / Crystal Reports (.rpt) report importer.
    /// Converts uploaded document into a unified report design JSON.
    /// </summary>
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("fileupload")]
    [ProducesResponseType(typeof(ReportImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ReportImportResultDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ReportImportResultDto), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ImportReport([FromForm] ReportImportFormDto form, CancellationToken ct)
    {
        var file = form.File;
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ReportImportResultDto
            {
                Success = false,
                Warnings = new List<string> { "Please provide a valid .rpt or .pdf report file." }
            });
        }

        try
        {
            var result = await _importService.ImportReportAsync(file, ct);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error importing report file {FileName}", file.FileName);
            return StatusCode(StatusCodes.Status500InternalServerError, new ReportImportResultDto
            {
                Success = false,
                Warnings = new List<string> { $"An unexpected error occurred: {ex.Message}" }
            });
        }
    }
}
