namespace Roundtable.Application.Dto;

public class TeamUserAdminDto
{
    public string UserGuid { get; set; } = "";
    public string UserName { get; set; } = "";
    public string? DisplayName { get; set; }
    public string? Organisation { get; set; }

    public bool IsAdmin { get; set; }
    public bool IsMember { get; set; }
    public DateTime? MemberUntilUtc { get; set; }
}

