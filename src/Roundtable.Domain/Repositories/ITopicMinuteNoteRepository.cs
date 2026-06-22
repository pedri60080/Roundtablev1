using Roundtable.Domain.Entities;

namespace Roundtable.Domain.Repositories;

public interface ITopicMinuteNoteRepository
{
    Task<IReadOnlyList<TopicMinuteNote>> ListByTopicIdsAsync(IReadOnlyCollection<int> topicIds, CancellationToken ct = default);

    Task<TopicMinuteNote?> GetByTopicIdAsync(int meetingTopicId, CancellationToken ct = default);

    Task UpsertByTopicAsync(int meetingTopicId, string body, bool isDraft, CancellationToken ct = default);

    Task DeleteByTopicIdAsync(int meetingTopicId, CancellationToken ct = default);
}
