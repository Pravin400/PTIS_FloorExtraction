using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Master.ScreenFieldValidation;
using NtisPlatform.Application.Interfaces.Master;

namespace NtisPlatform.Api.Controllers.Master;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ScreenFieldValidationController : ControllerBase
{
    private readonly IScreenFieldValidationService _service;
    public ScreenFieldValidationController(IScreenFieldValidationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAsync([FromQuery] ScreenFieldValidationQueryParameters queryParameters, CancellationToken ct)
    => Ok(await _service.GetAllAsync(queryParameters, ct));
}
