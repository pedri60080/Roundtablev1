namespace Roundtable.Domain.Entities;

public class User
{
    public string Guid { get; set; } = "";
    public string UserName { get; set; } = "";
    public string? DisplayName { get; set; }
    public string? Organisation { get; set; }

    /// <summary>Set when the user completes first-login onboarding (PUT /api/me/onboarding). Null means first visit.</summary>
    public DateTime? LastLoginAtUtc { get; set; }
}

