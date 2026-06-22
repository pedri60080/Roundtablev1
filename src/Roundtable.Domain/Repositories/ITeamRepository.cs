using Roundtable.Domain.Entities;

namespace Roundtable.Domain.Repositories;

public interface ITeamRepository
{
    Task<IReadOnlyList<Team>> ListAsync(CancellationToken ct = default);
    Task<Team?> GetByIdAsync(string id, CancellationToken ct = default);
    Task AddAsync(Team team, CancellationToken ct = default);
    Task SaveAsync(Team team, CancellationToken ct = default);
}
