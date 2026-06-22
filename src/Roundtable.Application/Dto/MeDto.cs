namespace Roundtable.Application.Dto;

public class MeDto
{
    public string Guid { get; set; } = "";
    public string UserName { get; set; } = "";
    public string? DisplayName { get; set; }
    public string? Organisation { get; set; }
    public bool IsOnboarded { get; set; }

    /// <summary>Null until the user completes first-login onboarding.</summary>
    public DateTime? LastLoginAtUtc { get; set; }
}

