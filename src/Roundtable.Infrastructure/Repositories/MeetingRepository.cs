using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;

namespace Roundtable.Infrastructure.Repositories;

public class MeetingRepository : IMeetingRepository
{
    private readonly AppDbContext _db;

    public MeetingRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Meeting>> ListAsync(string? teamId = null, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Meetings.AsQueryable();
        if (!string.IsNullOrWhiteSpace(teamId))
            query = query.Where(m => m.TeamId == teamId.Trim());
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(m => m.Status == status.Trim().ToLowerInvariant());
        return await query.OrderByDescending(m => m.Date).ToListAsync(ct);
    }

    public async Task<Meeting?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Meetings.FirstOrDefaultAsync(m => m.Id == id, ct);
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken ct = default)
    {
        return await _db.Meetings.AnyAsync(m => m.Id == id, ct);
    }

    public async Task AddAsync(Meeting meeting, CancellationToken ct = default)
    {
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync(ct);
    }

    public void Remove(Meeting meeting)
    {
        _db.Meetings.Remove(meeting);
    }

    public async Task SaveAsync(CancellationToken ct = default)
    {
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<(int Id, string TeamId)>> ListIdsAndTeamIdsWithoutTopicsAsync(CancellationToken ct = default)
    {
        var withTopics = await _db.MeetingTopics.Select(t => t.MeetingId).Distinct().ToListAsync(ct);
        var items = await _db.Meetings
            .Where(m => !withTopics.Contains(m.Id))
            .Select(m => new { m.Id, m.TeamId })
            .ToListAsync(ct);
        return items.Select(x => (x.Id, x.TeamId)).ToList();
    }

    public async Task<IReadOnlyList<int>> ListMeetingIdsThatHaveTopicsAsync(CancellationToken ct = default)
    {
        return await _db.MeetingTopics.Select(t => t.MeetingId).Distinct().ToListAsync(ct);
    }
}
