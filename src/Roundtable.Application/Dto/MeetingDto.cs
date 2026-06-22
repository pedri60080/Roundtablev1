namespace Roundtable.Application.Dto;

public class MeetingDto
{
    public int Id { get; set; }
    public string TeamId { get; set; } = "";
    public DateTime Date { get; set; }
    public string Status { get; set; } = "";
    public string? Title { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
