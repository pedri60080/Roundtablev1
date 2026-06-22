using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;

namespace Roundtable.Infrastructure.Repositories;

public class TopicMinuteNoteRepository : ITopicMinuteNoteRepository
{
    private readonly AppDbContext _db;

    public TopicMinuteNoteRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TopicMinuteNote>> ListByTopicIdsAsync(
        IReadOnlyCollection<int> topicIds,
        CancellationToken ct = default)
    {
        if (topicIds.Count == 0)
            return Array.Empty<TopicMinuteNote>();

        return await _db.TopicMinuteNotes
            .Where(n => topicIds.Contains(n.MeetingTopicId))
            .ToListAsync(ct);
    }

    public async Task<TopicMinuteNote?> GetByTopicIdAsync(int meetingTopicId, CancellationToken ct = default)
    {
        return await _db.TopicMinuteNotes
            .FirstOrDefaultAsync(n => n.MeetingTopicId == meetingTopicId, ct);
    }

    public async Task UpsertByTopicAsync(int meetingTopicId, string body, bool isDraft, CancellationToken ct = default)
    {
        var existing = await GetByTopicIdAsync(meetingTopicId, ct);
        if (existing == null)
        {
            _db.TopicMinuteNotes.Add(new TopicMinuteNote
            {
                MeetingTopicId = meetingTopicId,
                Body = body,
                IsDraft = isDraft,
            });
        }
        else
        {
            existing.Body = body;
            existing.IsDraft = isDraft;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteByTopicIdAsync(int meetingTopicId, CancellationToken ct = default)
    {
        var existing = await GetByTopicIdAsync(meetingTopicId, ct);
        if (existing == null)
            return;
        _db.TopicMinuteNotes.Remove(existing);
        await _db.SaveChangesAsync(ct);
    }
}
