namespace Roundtable.Application.Dto;

public class TeamUsersAdminDto
{
    public string TeamId { get; set; } = "";
    public bool IsMembersOnly { get; set; }
    public bool MembersCanCreateMeetings { get; set; }
    public bool MembersCanCreateTopics { get; set; }
    public bool CanEdit { get; set; }
    public List<string> AdminUserNames { get; set; } = new();
    public List<TeamUserAdminDto> Users { get; set; } = new();
}

