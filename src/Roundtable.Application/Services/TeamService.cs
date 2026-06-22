using Roundtable.Application.Dto;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using System.Text.RegularExpressions;

namespace Roundtable.Application.Services;

public class TeamService : ITeamService
{
    private const string DevUser123 = "user123";
    private const string DevUser123Guid = "11111111-1111-1111-1111-111111111111";
    private static readonly Regex TeamIdPattern = new("^team\\d{3}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly ITeamRepository _teams;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly ITeamUserRepository _teamUsers;
    private readonly IDemoSettingsService _demoSettings;

    public TeamService(
        ITeamRepository teams,
        ICurrentUser currentUser,
        IUserRepository users,
        ITeamUserRepository teamUsers,
        IDemoSettingsService demoSettings)
    {
        _teams = teams;
        _currentUser = currentUser;
        _users = users;
        _teamUsers = teamUsers;
        _demoSettings = demoSettings;
    }

    public async Task<IReadOnlyList<TeamDto>> ListAsync(CancellationToken ct = default)
    {
        var list = (await _teams.ListAsync(ct))
            .Where(t => IsCanonicalTeamId(t.Id))
            .ToList();

        var user = await EnsureCurrentUserAsync(ct);
        var memberships = await GetMembershipsForCurrentUserAsync(user, ct);
        var activeMemberTeamIds = memberships
            .Where(m => m.IsMember && m.MemberUntilUtc.HasValue && m.MemberUntilUtc.Value >= DateTime.UtcNow)
            .Select(m => m.TeamId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return list.Select(t => Map(t, activeMemberTeamIds)).ToList();
    }

    public async Task<TeamDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!IsCanonicalTeamId(id))
            return null;

        var team = await _teams.GetByIdAsync(id, ct);
        if (team == null)
            return null;

        var user = await EnsureCurrentUserAsync(ct);
        var memberships = await GetMembershipsForCurrentUserAsync(user, ct);
        var activeMemberTeamIds = memberships
            .Where(m => m.IsMember && m.MemberUntilUtc.HasValue && m.MemberUntilUtc.Value >= DateTime.UtcNow)
            .Select(m => m.TeamId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return Map(team, activeMemberTeamIds);
    }

    private TeamDto Map(Domain.Entities.Team t, HashSet<string> activeMemberTeamIds) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Icon = ResolveIcon(t),
        Authorized = t.Authorized,
        IsMembersOnly = t.IsMembersOnly,
        MembersCanCreateMeetings = t.MembersCanCreateMeetings,
        MembersCanCreateTopics = t.MembersCanCreateTopics,
        Access = GetAccess(t, activeMemberTeamIds),
    };

    private string ResolveIcon(Domain.Entities.Team team)
    {
        if (!string.Equals(team.Id, "team001", StringComparison.OrdinalIgnoreCase))
            return team.Icon;

        return _demoSettings.GetCustomTeamIconPublicUrl(team.Id) ?? team.Icon;
    }

    private string GetAccess(Domain.Entities.Team t, HashSet<string> activeMemberTeamIds)
    {
        if (_currentUser.IsAdminForTeam(t.Id))
            return "Admin";

        if (activeMemberTeamIds.Contains(t.Id))
            return "Member";

        if (t.IsMembersOnly)
            return "MembersOnlyNoAccess";

        return "ReadOnly";
    }

    private async Task<User> EnsureCurrentUserAsync(CancellationToken ct)
    {
        var userName = _currentUser.UserName;
        var user = await _users.GetByUserNameAsync(userName, ct);
        if (user != null)
            return user;

        user = new User
        {
            Guid = System.Guid.NewGuid().ToString(),
            UserName = userName,
        };
        await _users.AddAsync(user, ct);
        return user;
    }

    private async Task<IReadOnlyList<TeamUser>> GetMembershipsForCurrentUserAsync(User user, CancellationToken ct)
    {
        var direct = await _teamUsers.ListByUserGuidAsync(user.Guid, ct);
        if (!string.Equals(_currentUser.UserName, DevUser123, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(user.Guid, DevUser123Guid, StringComparison.OrdinalIgnoreCase))
            return direct;

        var seeded = await _teamUsers.ListByUserGuidAsync(DevUser123Guid, ct);
        if (seeded.Count == 0)
            return direct;

        return direct
            .Concat(seeded)
            .GroupBy(m => m.TeamId, StringComparer.OrdinalIgnoreCase)
            .Select(g => g
                .OrderByDescending(x => x.IsMember)
                .ThenByDescending(x => x.MemberUntilUtc ?? DateTime.MinValue)
                .First())
            .ToList();
    }

    private static bool IsCanonicalTeamId(string? id) =>
        !string.IsNullOrWhiteSpace(id) && TeamIdPattern.IsMatch(id);
}
