using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/teams/{teamId}/users")]
public class TeamUsersAdminController : ControllerBase
{
    private readonly ITeamUserAdminService _admin;

    public TeamUsersAdminController(ITeamUserAdminService admin)
    {
        _admin = admin;
    }

    [HttpGet]
    public async Task<ActionResult<TeamUsersAdminDto>> GetUsers(string teamId, CancellationToken ct)
    {
        try
        {
            var dto = await _admin.GetUsersAsync(teamId, ct);
            return Ok(dto);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{userGuid}")]
    public async Task<ActionResult<TeamUserAdminDto>> SetMembership(string teamId, string userGuid, [FromBody] SetTeamUserMembershipRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _admin.SetMembershipAsync(teamId, userGuid, request, ct);
            return Ok(dto);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{userGuid}/renew")]
    public async Task<ActionResult<TeamUserAdminDto>> RenewMembership(string teamId, string userGuid, CancellationToken ct)
    {
        try
        {
            var dto = await _admin.RenewMembershipAsync(teamId, userGuid, ct);
            return Ok(dto);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("/api/teams/{teamId}/members-only")]
    public async Task<ActionResult<TeamDto>> SetMembersOnly(string teamId, [FromBody] SetMembersOnlyRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _admin.SetMembersOnlyAsync(teamId, request.IsMembersOnly, ct);
            return Ok(dto);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("/api/teams/{teamId}/members-can-create-meetings")]
    public async Task<ActionResult<TeamDto>> SetMembersCanCreateMeetings(string teamId, [FromBody] SetEnabledRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _admin.SetMembersCanCreateMeetingsAsync(teamId, request.Enabled, ct);
            return Ok(dto);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("/api/teams/{teamId}/members-can-create-topics")]
    public async Task<ActionResult<TeamDto>> SetMembersCanCreateTopics(string teamId, [FromBody] SetEnabledRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _admin.SetMembersCanCreateTopicsAsync(teamId, request.Enabled, ct);
            return Ok(dto);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}

public class SetMembersOnlyRequest
{
    public bool IsMembersOnly { get; set; }
}

public class SetEnabledRequest
{
    public bool Enabled { get; set; }
}

