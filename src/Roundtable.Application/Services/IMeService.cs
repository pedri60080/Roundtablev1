using Roundtable.Application.Dto;

namespace Roundtable.Application.Services;

public interface IMeService
{
    Task<MeDto> GetAsync(CancellationToken ct = default);
    Task<MeDto> UpdateOnboardingAsync(UpdateOnboardingRequest request, CancellationToken ct = default);
}

