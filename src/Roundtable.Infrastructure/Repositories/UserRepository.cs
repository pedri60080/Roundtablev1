using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;

namespace Roundtable.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByUserNameAsync(string userName, CancellationToken ct = default)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.UserName == userName, ct);
    }

    public async Task<IReadOnlyList<User>> GetByGuidsAsync(IReadOnlyCollection<string> guids, CancellationToken ct = default)
    {
        if (guids == null || guids.Count == 0)
            return Array.Empty<User>();

        var distinct = guids.Where(g => !string.IsNullOrWhiteSpace(g)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (distinct.Count == 0)
            return Array.Empty<User>();

        return await _db.Users.Where(u => distinct.Contains(u.Guid)).ToListAsync(ct);
    }

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<User>> ListAsync(CancellationToken ct = default)
    {
        return await _db.Users.OrderBy(u => u.UserName).ToListAsync(ct);
    }
}

