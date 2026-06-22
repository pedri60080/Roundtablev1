using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;
    private readonly IMeetingTopicService _topicService;

    public TeamsController(ITeamService teamService, IMeetingTopicService topicService)
    {
        _teamService = teamService;
        _topicService = topicService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Application.Dto.TeamDto>>> List(CancellationToken ct)
    {
        var list = await _teamService.ListAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Application.Dto.TeamDto>> Get(string id, CancellationToken ct)
    {
        var team = await _teamService.GetByIdAsync(id, ct);
        if (team == null)
            return NotFound();
        return Ok(team);
    }

    [HttpGet("{id}/topics")]
    public async Task<ActionResult<List<TopicWithMeetingDto>>> GetTopics(string id, CancellationToken ct)
    {
        var list = await _topicService.ListByTeamIdAsync(id, ct);
        return Ok(list);
    }
}
