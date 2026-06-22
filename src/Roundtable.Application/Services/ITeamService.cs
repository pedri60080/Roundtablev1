using Roundtable.Application.Dto;

namespace Roundtable.Application.Services;

public interface ITeamService
{
    Task<IReadOnlyList<TeamDto>> ListAsync(CancellationToken ct = default);
    Task<TeamDto?> GetByIdAsync(string id, CancellationToken ct = default);
}
