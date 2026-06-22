using Roundtable.Application.Dto;
using Roundtable.Domain.Repositories;

namespace Roundtable.Application.Services;

public class TeamUserAdminService : ITeamUserAdminService
{
    private readonly ICurrentUser _currentUser;
    private readonly ITeamRepository _teams;
    private readonly IUserRepository _users;
    private readonly ITeamUserRepository _teamUsers;

    public TeamUserAdminService(
        ICurrentUser currentUser,
        ITeamRepository teams,
        IUserRepository users,
        ITeamUserRepository teamUsers)
    {
        _currentUser = currentUser;
        _teams = teams;
        _users = users;
        _teamUsers = teamUsers;
    }

    public async Task<TeamUsersAdminDto> GetUsersAsync(string teamId, CancellationToken ct = default)
    {
        var team = await _teams.GetByIdAsync(teamId, ct) ?? throw new KeyNotFoundException($"Team {teamId} not found.");
        var canEdit = _currentUser.IsAdminForTeam(teamId);
        var users = await _users.ListAsync(ct);
        var memberships = await _teamUsers.ListByTeamIdAsync(teamId, ct);
        var membershipByUserGuid = memberships.ToDictionary(m => m.UserGuid, StringComparer.OrdinalIgnoreCase);

        return new TeamUsersAdminDto
        {
            TeamId = teamId,
            IsMembersOnly = team.IsMembersOnly,
            MembersCanCreateMeetings = team.MembersCanCreateMeetings,
            MembersCanCreateTopics = team.MembersCanCreateTopics,
            CanEdit = canEdit,
            AdminUserNames = new List<string> { _currentUser.UserName },
            Users = users.Select(u =>
            {
                var m = membershipByUserGuid.GetValueOrDefault(u.Guid);
                return new TeamUserAdminDto
                {
                    UserGuid = u.Guid,
                    UserName = u.UserName,
                    DisplayName = u.DisplayName,
                    Organisation = u.Organisation,
                    IsAdmin = canEdit && string.Equals(u.UserName, _currentUser.UserName, StringComparison.OrdinalIgnoreCase),
                    IsMember = m?.IsMember ?? false,
                    MemberUntilUtc = m?.MemberUntilUtc,
                };
            }).ToList(),
        };
    }

    public async Task<TeamUserAdminDto> SetMembershipAsync(string teamId, string userGuid, SetTeamUserMembershipRequest request, CancellationToken ct = default)
    {
        EnsureAdmin(teamId);
        _ = await _teams.GetByIdAsync(teamId, ct) ?? throw new KeyNotFoundException($"Team {teamId} not found.");

        var user = (await _users.ListAsync(ct)).FirstOrDefault(u => string.Equals(u.Guid, userGuid, StringComparison.OrdinalIgnoreCase));
        if (user == null)
            throw new KeyNotFoundException($"User {userGuid} not found.");

        var now = DateTime.UtcNow.Date;
        var membership = await _teamUsers.GetAsync(teamId, userGuid, ct);
        if (membership == null)
        {
            membership = new Domain.Entities.TeamUser { TeamId = teamId, UserGuid = userGuid };
        }

        membership.IsMember = request.IsMember;
        membership.MemberUntilUtc = request.IsMember ? now.AddMonths(6) : null;
        await _teamUsers.UpsertAsync(membership, ct);

        return new TeamUserAdminDto
        {
            UserGuid = user.Guid,
            UserName = user.UserName,
            DisplayName = user.DisplayName,
            Organisation = user.Organisation,
            IsMember = membership.IsMember,
            MemberUntilUtc = membership.MemberUntilUtc,
        };
    }

    public async Task<TeamUserAdminDto> RenewMembershipAsync(string teamId, string userGuid, CancellationToken ct = default)
    {
        EnsureAdmin(teamId);
        _ = await _teams.GetByIdAsync(teamId, ct) ?? throw new KeyNotFoundException($"Team {teamId} not found.");

        var user = (await _users.ListAsync(ct)).FirstOrDefault(u => string.Equals(u.Guid, userGuid, StringComparison.OrdinalIgnoreCase));
        if (user == null)
            throw new KeyNotFoundException($"User {userGuid} not found.");

        var membership = await _teamUsers.GetAsync(teamId, userGuid, ct) ?? new Domain.Entities.TeamUser { TeamId = teamId, UserGuid = userGuid };
        membership.IsMember = true;
        membership.MemberUntilUtc = DateTime.UtcNow.Date.AddMonths(6);
        await _teamUsers.UpsertAsync(membership, ct);

        return new TeamUserAdminDto
        {
            UserGuid = user.Guid,
            UserName = user.UserName,
            DisplayName = user.DisplayName,
            Organisation = user.Organisation,
            IsMember = membership.IsMember,
            MemberUntilUtc = membership.MemberUntilUtc,
        };
    }

    public async Task<TeamDto> SetMembersOnlyAsync(string teamId, bool isMembersOnly, CancellationToken ct = default)
    {
        EnsureAdmin(teamId);
        var team = await _teams.GetByIdAsync(teamId, ct) ?? throw new KeyNotFoundException($"Team {teamId} not found.");
        team.IsMembersOnly = isMembersOnly;
        await _teams.SaveAsync(team, ct);

        return new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Icon = team.Icon,
            Authorized = team.Authorized,
            IsMembersOnly = team.IsMembersOnly,
            MembersCanCreateMeetings = team.MembersCanCreateMeetings,
            Access = "Admin",
        };
    }

    public async Task<TeamDto> SetMembersCanCreateMeetingsAsync(string teamId, bool enabled, CancellationToken ct = default)
    {
        EnsureAdmin(teamId);
        var team = await _teams.GetByIdAsync(teamId, ct) ?? throw new KeyNotFoundException($"Team {teamId} not found.");
        team.MembersCanCreateMeetings = enabled;
        await _teams.SaveAsync(team, ct);

        return new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Icon = team.Icon,
            Authorized = team.Authorized,
            IsMembersOnly = team.IsMembersOnly,
            MembersCanCreateMeetings = team.MembersCanCreateMeetings,
            MembersCanCreateTopics = team.MembersCanCreateTopics,
            Access = "Admin",
        };
    }

    public async Task<TeamDto> SetMembersCanCreateTopicsAsync(string teamId, bool enabled, CancellationToken ct = default)
    {
        EnsureAdmin(teamId);
        var team = await _teams.GetByIdAsync(teamId, ct) ?? throw new KeyNotFoundException($"Team {teamId} not found.");
        team.MembersCanCreateTopics = enabled;
        await _teams.SaveAsync(team, ct);

        return new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Icon = team.Icon,
            Authorized = team.Authorized,
            IsMembersOnly = team.IsMembersOnly,
            MembersCanCreateMeetings = team.MembersCanCreateMeetings,
            MembersCanCreateTopics = team.MembersCanCreateTopics,
            Access = "Admin",
        };
    }

    private void EnsureAdmin(string teamId)
    {
        if (!_currentUser.IsAdminForTeam(teamId))
            throw new UnauthorizedAccessException("Admin access required.");
    }
}

