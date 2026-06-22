using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganisationsController : ControllerBase
{
    private readonly IOrganisationService _organisationService;

    public OrganisationsController(IOrganisationService organisationService)
    {
        _organisationService = organisationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Application.Dto.OrganisationDto>>> List(CancellationToken ct)
    {
        var list = await _organisationService.ListAsync(ct);
        return Ok(list);
    }
}
