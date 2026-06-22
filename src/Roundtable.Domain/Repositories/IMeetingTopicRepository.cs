using Roundtable.Domain.Entities;

namespace Roundtable.Domain.Repositories;

public interface IMeetingTopicRepository
{
    Task<IReadOnlyList<MeetingTopic>> ListByMeetingIdAsync(int meetingId, CancellationToken ct = default);
    Task<int> GetMaxDisplayNumberAsync(CancellationToken ct = default);
    Task<MeetingTopic?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(MeetingTopic topic, CancellationToken ct = default);
    void Remove(MeetingTopic topic);
    Task SaveAsync(CancellationToken ct = default);
}
