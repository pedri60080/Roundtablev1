using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;

namespace Roundtable.Infrastructure.Repositories;

public class MeetingTopicRepository : IMeetingTopicRepository
{
    private readonly AppDbContext _db;

    public MeetingTopicRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MeetingTopic>> ListByMeetingIdAsync(int meetingId, CancellationToken ct = default)
    {
        return await _db.MeetingTopics
            .Where(t => t.MeetingId == meetingId)
            .OrderBy(t => t.Id)
            .ToListAsync(ct);
    }

    public async Task<int> GetMaxDisplayNumberAsync(CancellationToken ct = default)
    {
        if (!await _db.MeetingTopics.AnyAsync(ct))
            return 0;
        return await _db.MeetingTopics.MaxAsync(t => t.DisplayNumber, ct);
    }

    public async Task<MeetingTopic?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.MeetingTopics.FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task AddAsync(MeetingTopic topic, CancellationToken ct = default)
    {
        _db.MeetingTopics.Add(topic);
        await _db.SaveChangesAsync(ct);
    }

    public void Remove(MeetingTopic topic)
    {
        _db.MeetingTopics.Remove(topic);
    }

    public async Task SaveAsync(CancellationToken ct = default)
    {
        await _db.SaveChangesAsync(ct);
    }
}
