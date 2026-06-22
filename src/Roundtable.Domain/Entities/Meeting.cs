namespace Roundtable.Domain.Entities;

/// <summary>Meeting aggregate root. Topics are child entities of this aggregate.</summary>
public class Meeting
{
    public int Id { get; set; }
    public string TeamId { get; set; } = "";
    public DateTime Date { get; set; }
    /// <summary>active | archived</summary>
    public string Status { get; set; } = "active";
    public string? Title { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
