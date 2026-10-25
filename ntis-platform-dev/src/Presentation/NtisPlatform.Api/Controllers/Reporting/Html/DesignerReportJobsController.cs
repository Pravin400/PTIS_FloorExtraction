using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces.HtmlReport;

namespace NtisPlatform.Api.Controllers.Reporting.Html;

[ApiController]
[Authorize]
[Route("api/designer-report-jobs")]
public sealed class DesignerReportJobsController(IHtmlReportService service) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<HtmlReportJobStatusDto>> GetAll([FromQuery] int take = 25, CancellationToken ct = default) =>
        service.GetMyJobsAsync(take, ct);

    [HttpPost]
    public async Task<ActionResult<CreateHtmlReportJobResult>> Create(CreateHtmlReportJobRequest request, CancellationToken ct)
    {
        var result = await service.CreateJobAsync(request, ct);
        return AcceptedAtAction(nameof(Get), new { jobId = result.JobId }, result);
    }

    [HttpGet("{jobId:guid}")]
    public async Task<ActionResult<HtmlReportJobStatusDto>> Get(Guid jobId, CancellationToken ct) =>
        await service.GetJobAsync(jobId, ct) is { } result ? Ok(result) : NotFound();

    [HttpPost("{jobId:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid jobId, CancellationToken ct) =>
        await service.CancelAsync(jobId, ct) ? Accepted() : NotFound();

    [HttpGet("{jobId:guid}/download")]
    public async Task<IActionResult> Download(Guid jobId, CancellationToken ct)
    {
        var result = await service.DownloadAsync(jobId, ct);
        return result is null ? NotFound() : File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }

    [HttpPost("render-direct")]
    public async Task<IActionResult> RenderDirect(CreateHtmlReportJobRequest request, CancellationToken ct)
    {
        var result = await service.RenderDirectAsync(request, ct);
        return result is null
            ? BadRequest("Failed to render report directly.")
            : File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }
}
