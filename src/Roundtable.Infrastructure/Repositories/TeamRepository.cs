using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;

namespace Roundtable.Infrastructure.Repositories;

public class TeamRepository : ITeamRepository
{
    private readonly AppDbContext _db;

    public TeamRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Team>> ListAsync(CancellationToken ct = default)
    {
        return await _db.Teams.OrderBy(t => t.Name).ToListAsync(ct);
    }

    public async Task<Team?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        return await _db.Teams.FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task AddAsync(Team team, CancellationToken ct = default)
    {
        _db.Teams.Add(team);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SaveAsync(Team team, CancellationToken ct = default)
    {
        _db.Teams.Update(team);
        await _db.SaveChangesAsync(ct);
    }
}
