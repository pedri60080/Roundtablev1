using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;

namespace Roundtable.Infrastructure.Repositories;

public class TeamUserRepository : ITeamUserRepository
{
    private readonly AppDbContext _db;

    public TeamUserRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TeamUser>> ListByUserGuidAsync(string userGuid, CancellationToken ct = default)
    {
        return await _db.TeamUsers.Where(tu => tu.UserGuid == userGuid).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<TeamUser>> ListByTeamIdAsync(string teamId, CancellationToken ct = default)
    {
        return await _db.TeamUsers.Where(tu => tu.TeamId == teamId).ToListAsync(ct);
    }

    public async Task<TeamUser?> GetAsync(string teamId, string userGuid, CancellationToken ct = default)
    {
        return await _db.TeamUsers.FirstOrDefaultAsync(tu => tu.TeamId == teamId && tu.UserGuid == userGuid, ct);
    }

    public async Task UpsertAsync(TeamUser teamUser, CancellationToken ct = default)
    {
        var existing = await GetAsync(teamUser.TeamId, teamUser.UserGuid, ct);
        if (existing == null)
        {
            _db.TeamUsers.Add(teamUser);
        }
        else
        {
            existing.IsMember = teamUser.IsMember;
            existing.MemberUntilUtc = teamUser.MemberUntilUtc;
            _db.TeamUsers.Update(existing);
        }

        await _db.SaveChangesAsync(ct);
    }
}

