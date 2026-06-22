namespace Roundtable.Domain.Entities;

/// <summary>Shared minute notes for a meeting topic (one row per topic; separate from agenda Notes).</summary>
public class TopicMinuteNote
{
    public int Id { get; set; }
    public int MeetingTopicId { get; set; }
    public string Body { get; set; } = "";
    public bool IsDraft { get; set; } = true;
}
