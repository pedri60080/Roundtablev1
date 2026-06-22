using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _meetingService;
    private readonly IMeetingExternalPdfService _meetingExternalPdfService;

    public MeetingsController(IMeetingService meetingService, IMeetingExternalPdfService meetingExternalPdfService)
    {
        _meetingService = meetingService;
        _meetingExternalPdfService = meetingExternalPdfService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MeetingDto>>> List([FromQuery] string? teamId, [FromQuery] string? status, CancellationToken ct)
    {
        var list = await _meetingService.ListAsync(teamId, status, ct);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<MeetingDto>> Create([FromBody] CreateMeetingRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.TeamId))
            return BadRequest(new { error = "TeamId is required." });
        if (request.Date == default)
            return BadRequest(new { error = "Date is required." });

        var dto = await _meetingService.CreateAsync(request, ct);
        return Created($"/api/meetings/{dto.Id}", dto);
    }

    [HttpGet("{id:int}/export/pdf")]
    public async Task<IActionResult> ExportPdf(int id, CancellationToken ct, [FromQuery] bool includeMinutes = true)
    {
        var meeting = await _meetingService.GetByIdAsync(id, ct);
        if (meeting == null)
            return NotFound();

        var bytes = await _meetingExternalPdfService.BuildAsync(id, includeMinutes, ct);
        if (bytes == null)
            return NotFound();

        var fileName = $"meeting-{meeting.Date:yyyy-MM-dd}.pdf";
        return File(bytes, "application/pdf", fileName);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id, CancellationToken ct)
    {
        try
        {
            if (!await _meetingService.DeleteAsync(id, ct))
                return NotFound();
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<MeetingDto>> UpdateStatus(int id, [FromBody] UpdateMeetingStatusRequest request, CancellationToken ct)
    {
        var dto = await _meetingService.UpdateStatusAsync(id, request.Status, ct);
        if (dto == null)
            return NotFound();
        return Ok(dto);
    }

    public class UpdateMeetingStatusRequest
    {
        public string Status { get; set; } = "";
    }
}
