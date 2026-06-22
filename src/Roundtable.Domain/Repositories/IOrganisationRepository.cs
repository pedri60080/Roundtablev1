using Roundtable.Domain.Entities;

namespace Roundtable.Domain.Repositories;

public interface IOrganisationRepository
{
    Task<IReadOnlyList<Organisation>> ListAsync(CancellationToken ct = default);
    /// <summary>Insertion / id order (matches seed array order after reset).</summary>
    Task<IReadOnlyList<Organisation>> ListOrderedByIdAsync(CancellationToken ct = default);
    Task<IReadOnlyList<int>> ListIdsAsync(CancellationToken ct = default);
    Task AddAsync(Organisation organisation, CancellationToken ct = default);
    Task SaveAsync(Organisation organisation, CancellationToken ct = default);
}
