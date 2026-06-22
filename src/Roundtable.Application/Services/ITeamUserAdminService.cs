using Roundtable.Application.Dto;

namespace Roundtable.Application.Services;

public interface ITeamUserAdminService
{
    Task<TeamUsersAdminDto> GetUsersAsync(string teamId, CancellationToken ct = default);
    Task<TeamUserAdminDto> SetMembershipAsync(string teamId, string userGuid, SetTeamUserMembershipRequest request, CancellationToken ct = default);
    Task<TeamUserAdminDto> RenewMembershipAsync(string teamId, string userGuid, CancellationToken ct = default);
    Task<TeamDto> SetMembersOnlyAsync(string teamId, bool isMembersOnly, CancellationToken ct = default);
    Task<TeamDto> SetMembersCanCreateMeetingsAsync(string teamId, bool enabled, CancellationToken ct = default);
    Task<TeamDto> SetMembersCanCreateTopicsAsync(string teamId, bool enabled, CancellationToken ct = default);
}

