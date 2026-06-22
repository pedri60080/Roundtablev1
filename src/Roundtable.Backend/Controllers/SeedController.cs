using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly ISeedService _seedService;

    public SeedController(ISeedService seedService)
    {
        _seedService = seedService;
    }

    [HttpPost]
    public async Task<ActionResult<Application.Dto.SeedResultDto>> Run(CancellationToken ct)
    {
        var result = await _seedService.RunAsync(ct);
        return Ok(result);
    }

    [HttpPost("reset")]
    public async Task<ActionResult<Application.Dto.SeedResultDto>> Reset(CancellationToken ct)
    {
        var result = await _seedService.ResetAsync(ct);
        return Ok(result);
    }
}
