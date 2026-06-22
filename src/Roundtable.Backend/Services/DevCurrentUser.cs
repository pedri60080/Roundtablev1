using Roundtable.Application.Services;

namespace Roundtable.Backend.Services;

public class DevCurrentUser : ICurrentUser
{
    private static readonly HashSet<string> AdminTeamIds = new(StringComparer.OrdinalIgnoreCase)
    {
        "team001",
        "team004",
        // Legacy ids kept for compatibility with older demo DBs.
        "inglorious-basterds",
        "magnificent-seven",
    };

    public string UserName => "user123";

    public bool IsAdminForTeam(string teamId) => AdminTeamIds.Contains(teamId);
}

