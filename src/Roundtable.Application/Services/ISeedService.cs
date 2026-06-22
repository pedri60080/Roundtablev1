using Roundtable.Application.Dto;

namespace Roundtable.Application.Services;

public interface ISeedService
{
    Task<SeedResultDto> RunAsync(CancellationToken ct = default);
    Task<SeedResultDto> ResetAsync(CancellationToken ct = default);
}
