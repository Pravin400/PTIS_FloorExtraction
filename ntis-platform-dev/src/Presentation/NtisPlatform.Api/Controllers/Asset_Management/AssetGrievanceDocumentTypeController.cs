using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocumentType;
using NtisPlatform.Application.Interfaces.Asset_Management;

namespace NtisPlatform.Api.Controllers.Asset_Management;

[ApiController]
[Route("api/master/asset-grievance-document-types")]
public class AssetGrievanceDocumentTypeController : ControllerBase
{
    private readonly IAssetGrievanceDocumentTypeService _service;
    private readonly ILogger<AssetGrievanceDocumentTypeController> _logger;

    public AssetGrievanceDocumentTypeController(
        IAssetGrievanceDocumentTypeService service,
        ILogger<AssetGrievanceDocumentTypeController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] AssetGrievanceDocumentTypeQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateAssetGrievanceDocumentTypeDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateAssetGrievanceDocumentTypeDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
