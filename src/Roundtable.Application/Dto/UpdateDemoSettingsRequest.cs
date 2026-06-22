namespace Roundtable.Application.Dto;

public class UpdateDemoSettingsRequest
{
    public string AppDisplayName { get; set; } = "";
    public bool IncludingMinutes { get; set; }
    public IReadOnlyList<string> OrganisationNames { get; set; } = Array.Empty<string>();
    public IReadOnlyList<DemoTeamNameDto> Teams { get; set; } = Array.Empty<DemoTeamNameDto>();
}
