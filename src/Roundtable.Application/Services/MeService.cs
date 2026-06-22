using Roundtable.Application.Dto;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;

namespace Roundtable.Application.Services;

public class MeService : IMeService
{
    private const string DevUser123 = "user123";

    /// <summary>Must match <c>UsersSeed</c> / <c>TeamUsersSeed</c> so first-run seed FKs resolve after onboarding.</summary>
    private const string DevUser123Guid = "11111111-1111-1111-1111-111111111111";

    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IDemoSettingsService _demoSettings;
    private readonly ITeamRepository _teams;
    private readonly ISeedService _seedService;

    public MeService(
        ICurrentUser currentUser,
        IUserRepository users,
        IDemoSettingsService demoSettings,
        ITeamRepository teams,
        ISeedService seedService)
    {
        _currentUser = currentUser;
        _users = users;
        _demoSettings = demoSettings;
        _teams = teams;
        _seedService = seedService;
    }

    public async Task<MeDto> GetAsync(CancellationToken ct = default)
    {
        var userName = _currentUser.UserName;
        var user = await _users.GetByUserNameAsync(userName, ct);
        if (user == null)
        {
            user = new User
            {
                Guid = NewUserGuid(userName),
                UserName = userName,
            };
            await _users.AddAsync(user, ct);
        }

        return Map(user);
    }

    public async Task<MeDto> UpdateOnboardingAsync(UpdateOnboardingRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            throw new ArgumentException("Display name is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.Organisation))
            throw new ArgumentException("Organisation is required.", nameof(request));

        var userName = _currentUser.UserName;
        var user = await _users.GetByUserNameAsync(userName, ct);
        if (user == null)
        {
            user = new User
            {
                Guid = NewUserGuid(userName),
                UserName = userName,
            };
            await _users.AddAsync(user, ct);
        }

        user.DisplayName = request.DisplayName.Trim();
        if (userName == DevUser123)
        {
            var organisation = request.Organisation.Trim();
            await _demoSettings.SetDevUserOrganisationNameAsync(organisation, ct);
            user.Organisation = _demoSettings.GetDevUserOrganisationName();
        }
        else
        {
            user.Organisation = request.Organisation.Trim();
        }
        user.LastLoginAtUtc = DateTime.UtcNow;
        await _users.UpdateAsync(user, ct);

        // First-run flow: after onboarding on an empty DB, seed demo data.
        if (userName == DevUser123)
        {
            var hasAnyTeams = (await _teams.ListAsync(ct)).Count > 0;
            if (!hasAnyTeams)
                await _seedService.RunAsync(ct);
        }

        return Map(user);
    }

    private MeDto Map(User u)
    {
        // Dev user: always expose the first organisation name from demo settings once any org was stored.
        string? organisation = u.Organisation;
        if (u.UserName == DevUser123 && !string.IsNullOrWhiteSpace(u.Organisation))
            organisation = _demoSettings.GetDevUserOrganisationName();

        return new MeDto
        {
            Guid = u.Guid,
            UserName = u.UserName,
            DisplayName = u.DisplayName,
            Organisation = organisation,
            IsOnboarded = !string.IsNullOrWhiteSpace(u.DisplayName) && !string.IsNullOrWhiteSpace(u.Organisation),
            LastLoginAtUtc = u.LastLoginAtUtc,
        };
    }

    private static string NewUserGuid(string userName) =>
        string.Equals(userName, DevUser123, StringComparison.OrdinalIgnoreCase)
            ? DevUser123Guid
            : System.Guid.NewGuid().ToString();
}

