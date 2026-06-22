using Microsoft.AspNetCore.Mvc;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;

namespace Roundtable.Backend.Controllers;

[ApiController]
[Route("api/demo-settings")]
public class DemoSettingsController : ControllerBase
{
    private readonly IDemoSettingsService _demoSettings;

    public DemoSettingsController(IDemoSettingsService demoSettings)
    {
        _demoSettings = demoSettings;
    }

    [HttpGet]
    public async Task<ActionResult<DemoSettingsDto>> Get(CancellationToken ct)
    {
        var dto = await _demoSettings.GetAsync(ct);
        return Ok(dto);
    }

    [HttpPut]
    public async Task<ActionResult<DemoSettingsDto>> Put([FromBody] UpdateDemoSettingsRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _demoSettings.UpdateAsync(request, ct);
            return Ok(dto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (IOException ex)
        {
            return StatusCode(500, new { error = $"Could not save demo settings: {ex.Message}" });
        }
    }

    [HttpGet("team-icon/{teamId}")]
    public ActionResult GetTeamIcon(string teamId)
    {
        try
        {
            var path = _demoSettings.GetCustomTeamIconPath(teamId);
            if (path == null)
                return NotFound();
            var contentType = _demoSettings.GetCustomTeamIconContentType(teamId) ?? "application/octet-stream";
            return PhysicalFile(path, contentType);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("team-icon/{teamId}")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult> UploadTeamIcon(string teamId, IFormFile? file, CancellationToken ct)
    {
        if (file == null || file.Length <= 0)
            return BadRequest(new { error = "Please choose an image file." });

        try
        {
            var contentType = ResolveTeamIconContentType(file);
            await using var stream = file.OpenReadStream();
            await _demoSettings.SaveCustomTeamIconAsync(teamId, stream, contentType, ct);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (IOException ex)
        {
            return StatusCode(500, new { error = $"Could not save team icon: {ex.Message}" });
        }
    }

    [HttpDelete("team-icon/{teamId}")]
    public async Task<ActionResult> DeleteTeamIcon(string teamId, CancellationToken ct)
    {
        try
        {
            var deleted = await _demoSettings.DeleteCustomTeamIconAsync(teamId, ct);
            if (!deleted)
                return NotFound();
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Map upload to a known MIME. Browsers often send wrong types for SVG (<c>text/plain</c>, <c>application/xml</c>,
    /// <c>application/octet-stream</c>) — always trust <c>.svg</c> extension first.
    /// </summary>
    private static string? ResolveTeamIconContentType(IFormFile file)
    {
        if (file.FileName.EndsWith(".svg", StringComparison.OrdinalIgnoreCase))
            return "image/svg+xml";

        var ct = file.ContentType;
        if (!string.IsNullOrWhiteSpace(ct) &&
            !string.Equals(ct, "application/octet-stream", StringComparison.OrdinalIgnoreCase))
            return ct;

        return string.IsNullOrWhiteSpace(ct) ? null : ct;
    }
}
