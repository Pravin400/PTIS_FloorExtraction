using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.DeleteFlat;

namespace NtisPlatform.Api.Controllers;

public partial class ApartmentQCController
{
    [Authorize]
    [HttpDelete("delete-flat")]
    public async Task<IActionResult> SoftDeleteFlatAsync([FromQuery] DeleteFlatRequestDto requestDto, CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _deleteFlatService.SoftDeleteFlatAsync(requestDto, currentUserId, ct);
        return Ok(result);
    }
}
