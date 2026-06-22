using Roundtable.Domain.Entities;

namespace Roundtable.Domain.Repositories;

public interface IMeetingRepository
{
    Task<IReadOnlyList<Meeting>> ListAsync(string? teamId = null, string? status = null, CancellationToken ct = default);
    Task<Meeting?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsAsync(int id, CancellationToken ct = default);
    Task AddAsync(Meeting meeting, CancellationToken ct = default);
    void Remove(Meeting meeting);
    Task SaveAsync(CancellationToken ct = default);
    Task<IReadOnlyList<(int Id, string TeamId)>> ListIdsAndTeamIdsWithoutTopicsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<int>> ListMeetingIdsThatHaveTopicsAsync(CancellationToken ct = default);
}
