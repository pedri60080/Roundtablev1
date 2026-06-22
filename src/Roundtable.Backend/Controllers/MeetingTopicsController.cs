using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/meetings/{meetingId:int}/topics")]
public class MeetingTopicsController : ControllerBase
{
    private readonly IMeetingTopicService _topicService;

    public MeetingTopicsController(IMeetingTopicService topicService)
    {
        _topicService = topicService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MeetingTopicDto>>> List(int meetingId, CancellationToken ct)
    {
        var list = await _topicService.ListByMeetingIdAsync(meetingId, ct);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<MeetingTopicDto>> Create(int meetingId, [FromBody] CreateMeetingTopicRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _topicService.CreateAsync(meetingId, request, ct);
            return Created($"/api/meetings/{meetingId}/topics/{dto.Id}", dto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex) when (ex.ParamName == "request")
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{topicId:int}")]
    public async Task<ActionResult<MeetingTopicDto>> Update(int meetingId, int topicId, [FromBody] UpdateMeetingTopicRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _topicService.UpdateAsync(meetingId, topicId, request, ct);
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
        catch (ArgumentException ex) when (ex.ParamName == "request")
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{topicId:int}/minute-note")]
    public async Task<ActionResult<MeetingTopicDto>> UpsertMinuteNote(
        int meetingId,
        int topicId,
        [FromBody] UpsertTopicMinuteNoteRequest request,
        CancellationToken ct)
    {
        try
        {
            var dto = await _topicService.UpsertMinuteNoteAsync(meetingId, topicId, request, ct);
            return Ok(dto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex) when (ex.ParamName == "request")
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpDelete("{topicId:int}/minute-note")]
    public async Task<ActionResult<MeetingTopicDto>> DeleteMinuteNote(int meetingId, int topicId, CancellationToken ct)
    {
        try
        {
            var dto = await _topicService.DeleteMinuteNoteAsync(meetingId, topicId, ct);
            return Ok(dto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpDelete("{topicId:int}")]
    public async Task<IActionResult> Delete(int meetingId, int topicId, CancellationToken ct)
    {
        try
        {
            await _topicService.DeleteAsync(meetingId, topicId, ct);
            return NoContent();
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
