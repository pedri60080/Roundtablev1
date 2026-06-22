using Roundtable.Application.Dto;
using Roundtable.Domain.Repositories;

namespace Roundtable.Application.Services;

public class OrganisationService : IOrganisationService
{
    private readonly IOrganisationRepository _organisations;

    public OrganisationService(IOrganisationRepository organisations)
    {
        _organisations = organisations;
    }

    public async Task<IReadOnlyList<OrganisationDto>> ListAsync(CancellationToken ct = default)
    {
        var list = await _organisations.ListAsync(ct);
        return list.Select(o => new OrganisationDto { Id = o.Id, Name = o.Name }).ToList();
    }
}
