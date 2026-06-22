namespace Roundtable.Application.Dto;

public class DemoSettingsDto
{
    public string AppDisplayName { get; set; } = "";
    public bool IncludingMinutes { get; set; }
    public string? Team001CustomIconUrl { get; set; }
    public IReadOnlyList<string> OrganisationNames { get; set; } = Array.Empty<string>();
    public IReadOnlyList<DemoTeamNameDto> Teams { get; set; } = Array.Empty<DemoTeamNameDto>();
}

public class DemoTeamNameDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
}
