using Roundtable.Application.Dto;
using Roundtable.Domain.Entities;

namespace Roundtable.Application.Services;

public interface IDemoSettingsService
{
    Task<DemoSettingsDto> GetAsync(CancellationToken ct = default);
    Task<DemoSettingsDto> UpdateAsync(UpdateDemoSettingsRequest request, CancellationToken ct = default);
    bool HasCustomTeamIcon(string teamId);
    string? GetCustomTeamIconPath(string teamId);
    string? GetCustomTeamIconContentType(string teamId);
    string? GetCustomTeamIconPublicUrl(string teamId);
    Task SaveCustomTeamIconAsync(string teamId, Stream stream, string? contentType, CancellationToken ct = default);
    Task<bool> DeleteCustomTeamIconAsync(string teamId, CancellationToken ct = default);

    /// <summary>Merged organisation rows for seeding (C# defaults + JSON overrides).</summary>
    IReadOnlyList<Organisation> GetMergedOrganisationSeedData();

    /// <summary>Merged team rows for seeding (C# defaults + JSON overrides).</summary>
    IReadOnlyList<Team> GetMergedTeamSeedData();

    /// <summary>Organisation name at index 5 (dev user / user123); matches merged seed list order.</summary>
    string GetDevUserOrganisationName();

    /// <summary>Updates the default seeded organisation name used by dev user onboarding.</summary>
    Task SetDevUserOrganisationNameAsync(string organisationName, CancellationToken ct = default);
}
