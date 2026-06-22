using Roundtable.Application.Dto;

namespace Roundtable.Application.Services;

public interface IOrganisationService
{
    Task<IReadOnlyList<OrganisationDto>> ListAsync(CancellationToken ct = default);
}
