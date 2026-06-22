namespace Roundtable.Domain.Entities;

/// <summary>Team aggregate root.</summary>
public class Team
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public bool Authorized { get; set; } = true;
    public string Abbreviation { get; set; } = "";
    public bool IsMembersOnly { get; set; }
    public bool MembersCanCreateMeetings { get; set; }
    public bool MembersCanCreateTopics { get; set; }
}
