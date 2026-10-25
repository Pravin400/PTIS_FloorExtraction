using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Section129;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Section 129A Single-Assessment Screen API — thin HTTP adapter.
/// Business logic lives in <c>Section129Service</c>;
/// exception-to-HTTP mapping is handled by <c>PropertyApiExceptionFilter</c>.
/// </summary>
public partial class PropertyController
{
    /// <summary>
    /// Resolves a property by "Old Gram Panchayat Number" (PropertyMastOld.OldPropertyNo) and
    /// returns its header + year-wise Section 129A schedule. Accepts a comma-separated list of old
    /// GP numbers (an officer may paste more than one for a merged property), matching if ANY of
    /// them corresponds to a mapped old row.
    /// </summary>
    /// <response code="200">Returns the Section 129A header + schedule</response>
    /// <response code="404">No property found for the given Old Gram Panchayat Number(s)</response>
    /// <response code="409">The given Old Gram Panchayat Number(s) are mapped to more than one property</response>
    [HttpGet("section129a-search-by-old-gp-no")]
    [ProducesResponseType(typeof(ApiResponse<Section129ScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SearchSection129AByOldGpNo([FromQuery] string oldGpNo, CancellationToken ct)
    {
        var result = await _section129Service.SearchByOldGpNoAsync(oldGpNo, ct);

        if (result.Status == Section129OldGpNoSearchStatus.Ambiguous)
        {
            _logger.LogWarning("Old Gram Panchayat Number '{OldGpNo}' is mapped to more than one property", oldGpNo);
            return Conflict(new ApiResponse<Section129ScheduleDto>
            {
                Success = false,
                Message = $"This Old Gram Panchayat Number '{oldGpNo}' is mapped to more than one property. Please search by UPIC or Ward + Property No instead."
            });
        }

        if (result.Status == Section129OldGpNoSearchStatus.NotMapped)
        {
            _logger.LogWarning("Old Gram Panchayat Number '{OldGpNo}' exists but is not mapped to any current property", oldGpNo);
            return NotFound(new ApiResponse<Section129ScheduleDto>
            {
                Success = false,
                Message = $"No property is mapped for Old Gram Panchayat Number '{oldGpNo}'"
            });
        }

        if (result.Schedule == null)
        {
            _logger.LogWarning("No property found for Old Gram Panchayat Number '{OldGpNo}'", oldGpNo);
            return NotFound(new ApiResponse<Section129ScheduleDto>
            {
                Success = false,
                Message = $"No property found for Old Gram Panchayat Number '{oldGpNo}'"
            });
        }

        return Ok(new ApiResponse<Section129ScheduleDto>
        {
            Success = true,
            Message = "Record fetched successfully",
            Items = result.Schedule
        });
    }

    /// <summary>
    /// Every active property/partition in PropertyMast for a ward — used to build the
    /// single-assessment screen's combined "Property No" dropdown once a Ward is picked. Queried
    /// directly from PropertyMast (not a search/assessment-grid endpoint) so properties with no
    /// PropertyDetails row yet (not assessed/applied) still appear.
    /// </summary>
    /// <response code="200">Returns the ward's property/partition list</response>
    [HttpGet("section129a-ward-properties")]
    [ProducesResponseType(typeof(ApiResponse<List<Section129WardPropertyOptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSection129AWardProperties([FromQuery] int wardId, CancellationToken ct)
    {
        var items = await _section129Service.GetWardPropertiesAsync(wardId, ct);
        return Ok(new ApiResponse<List<Section129WardPropertyOptionDto>>
        {
            Success = true,
            Message = "Record fetched successfully",
            Items = items
        });
    }

    /// <summary>
    /// Returns the header fields + year-wise Section 129A schedule for a property.
    /// </summary>
    /// <response code="200">Returns the Section 129A header + schedule</response>
    /// <response code="404">Property not found</response>
    [HttpGet("{propertyId}/section129a-schedule")]
    [ProducesResponseType(typeof(ApiResponse<Section129ScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSection129ASchedule(int propertyId, CancellationToken ct)
    {
        var result = await _section129Service.GetScheduleAsync(propertyId, ct);

        if (result == null)
        {
            _logger.LogWarning("Property ID {PropertyId} not found for Section 129A schedule", propertyId);
            return NotFound(new ApiResponse<Section129ScheduleDto>
            {
                Success = false,
                Message = $"Property ID {propertyId} not found"
            });
        }

        return Ok(new ApiResponse<Section129ScheduleDto>
        {
            Success = true,
            Message = "Record fetched successfully",
            Items = result
        });
    }

    /// <summary>
    /// Records the officer's Section 129A "Apply" action and synchronously recalculates the
    /// schedule from the property's start year (or the last year already on file) through the
    /// current finance year.
    /// </summary>
    /// <response code="200">Returns the refreshed Section 129A header + schedule</response>
    /// <response code="404">Property not found</response>
    [HttpPost("{propertyId}/section129a-apply")]
    [ProducesResponseType(typeof(ApiResponse<Section129ScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApplySection129A(int propertyId, [FromBody] Section129ApplyRequestDto request, CancellationToken ct)
    {
        var result = await _section129Service.ApplyAsync(propertyId, request, ct);

        if (result == null)
        {
            _logger.LogWarning("Property ID {PropertyId} not found for Section 129A apply", propertyId);
            return NotFound(new ApiResponse<Section129ScheduleDto>
            {
                Success = false,
                Message = $"Property ID {propertyId} not found"
            });
        }

        return Ok(new ApiResponse<Section129ScheduleDto>
        {
            Success = true,
            Message = "Section 129A applied successfully",
            Items = result
        });
    }

    /// <summary>
    /// Synchronously recalculates the Section 129A schedule for a property from its start year
    /// (or last year on file) through the current finance year. The optional body carries the
    /// officer's current Property-Change-Check facts and OC-Date basis checkbox, persisted before
    /// recalculating; flipping the OC-Date basis wipes and rebuilds the whole schedule.
    /// </summary>
    /// <response code="200">Returns the refreshed Section 129A header + schedule</response>
    /// <response code="404">Property not found</response>
    [HttpPost("{propertyId}/section129a-recalculate")]
    [ProducesResponseType(typeof(ApiResponse<Section129ScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecalculateSection129A(
        int propertyId,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] Section129RecalculateRequestDto? request,
        CancellationToken ct)
    {
        var result = await _section129Service.RecalculateAsync(propertyId, request, ct);

        if (result == null)
        {
            _logger.LogWarning("Property ID {PropertyId} not found for Section 129A recalculation", propertyId);
            return NotFound(new ApiResponse<Section129ScheduleDto>
            {
                Success = false,
                Message = $"Property ID {propertyId} not found"
            });
        }

        return Ok(new ApiResponse<Section129ScheduleDto>
        {
            Success = true,
            Message = "Section 129A schedule recalculated successfully",
            Items = result
        });
    }

    /// <summary>
    /// Downloads the Section 129A year-wise schedule as CSV — same columns/format the
    /// single-assessment screen's "Export CSV" button produces.
    /// </summary>
    /// <response code="200">Returns the CSV file</response>
    /// <response code="404">Property not found</response>
    [HttpGet("{propertyId}/section129a-schedule/export-csv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportSection129AScheduleCsv(int propertyId, CancellationToken ct)
    {
        var csv = await _section129Service.GetScheduleCsvAsync(propertyId, ct);

        if (csv == null)
        {
            _logger.LogWarning("Property ID {PropertyId} not found for Section 129A CSV export", propertyId);
            return NotFound(new ApiResponse<string>
            {
                Success = false,
                Message = $"Property ID {propertyId} not found"
            });
        }

        var bytes = new byte[] { 0xEF, 0xBB, 0xBF }.Concat(System.Text.Encoding.UTF8.GetBytes(csv)).ToArray();
        return File(bytes, "text/csv", "Section_129A_General_Tax_Schedule.csv");
    }

    /// <summary>
    /// Downloads the Section 129A year-wise schedule as an A4-landscape PDF — server-side
    /// generation via PdfSharp/MigraDoc (MIT-licensed).
    /// </summary>
    /// <response code="200">Returns the PDF file</response>
    /// <response code="404">Property not found</response>
    [HttpGet("{propertyId}/section129a-schedule/export-pdf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportSection129ASchedulePdf(int propertyId, CancellationToken ct)
    {
        var bytes = await _section129Service.GetSchedulePdfAsync(propertyId, ct);

        if (bytes == null)
        {
            _logger.LogWarning("Property ID {PropertyId} not found for Section 129A PDF export", propertyId);
            return NotFound(new ApiResponse<string>
            {
                Success = false,
                Message = $"Property ID {propertyId} not found"
            });
        }

        return File(bytes, "application/pdf", "Section_129A_General_Tax_Schedule.pdf");
    }
}
