using Microsoft.Extensions.DependencyInjection;
using Roundtable.Application.Services;

namespace Roundtable.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IOrganisationService, OrganisationService>();
        services.AddScoped<IMeetingService, MeetingService>();
        services.AddScoped<IMeetingTopicService, MeetingTopicService>();
        services.AddScoped<IMeService, MeService>();
        services.AddScoped<ITeamUserAdminService, TeamUserAdminService>();
        return services;
    }
}
