namespace Roundtable.Domain.Entities;

public class TeamUser
{
    public string TeamId { get; set; } = "";
    public string UserGuid { get; set; } = "";

    public bool IsMember { get; set; }
    public DateTime? MemberUntilUtc { get; set; }
}

