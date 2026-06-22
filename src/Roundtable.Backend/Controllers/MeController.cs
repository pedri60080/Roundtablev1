using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly IMeService _me;

    public MeController(IMeService me)
    {
        _me = me;
    }

    [HttpGet]
    public async Task<ActionResult<MeDto>> Get(CancellationToken ct)
    {
        var dto = await _me.GetAsync(ct);
        return Ok(dto);
    }

    [HttpPut("onboarding")]
    public async Task<ActionResult<MeDto>> UpdateOnboarding([FromBody] UpdateOnboardingRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _me.UpdateOnboardingAsync(request, ct);
            return Ok(dto);
        }
        catch (ArgumentException ex) when (ex.ParamName == "request")
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

