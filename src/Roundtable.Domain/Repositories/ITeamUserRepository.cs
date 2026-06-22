using Roundtable.Domain.Entities;

namespace Roundtable.Domain.Repositories;

public interface ITeamUserRepository
{
    Task<IReadOnlyList<TeamUser>> ListByUserGuidAsync(string userGuid, CancellationToken ct = default);
    Task<IReadOnlyList<TeamUser>> ListByTeamIdAsync(string teamId, CancellationToken ct = default);
    Task<TeamUser?> GetAsync(string teamId, string userGuid, CancellationToken ct = default);
    Task UpsertAsync(TeamUser teamUser, CancellationToken ct = default);
}

