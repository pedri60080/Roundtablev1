using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;

namespace Roundtable.Infrastructure.Repositories;

public class OrganisationRepository : IOrganisationRepository
{
    private readonly AppDbContext _db;

    public OrganisationRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Organisation>> ListAsync(CancellationToken ct = default)
    {
        return await _db.Organisations.OrderBy(o => o.Name).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Organisation>> ListOrderedByIdAsync(CancellationToken ct = default)
    {
        return await _db.Organisations.OrderBy(o => o.Id).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<int>> ListIdsAsync(CancellationToken ct = default)
    {
        return await _db.Organisations.OrderBy(o => o.Id).Select(o => o.Id).ToListAsync(ct);
    }

    public async Task AddAsync(Organisation organisation, CancellationToken ct = default)
    {
        _db.Organisations.Add(organisation);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SaveAsync(Organisation organisation, CancellationToken ct = default)
    {
        _db.Organisations.Update(organisation);
        await _db.SaveChangesAsync(ct);
    }
}
