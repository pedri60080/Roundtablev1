namespace Roundtable.Application.Dto;

public class TeamDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public bool Authorized { get; set; }
    public string Access { get; set; } = "ReadOnly";
    public bool IsMembersOnly { get; set; }
    public bool MembersCanCreateMeetings { get; set; }
    public bool MembersCanCreateTopics { get; set; }
}
