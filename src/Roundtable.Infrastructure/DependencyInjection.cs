using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Roundtable.Application.Services;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;
using Roundtable.Infrastructure.Repositories;
using Roundtable.Infrastructure.Services;

namespace Roundtable.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=roundtable.db";
        if (!connectionString.Contains("Foreign Keys=", StringComparison.OrdinalIgnoreCase))
            connectionString = connectionString.TrimEnd(';') + ";Foreign Keys=True";

        services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

        services.AddScoped<ITeamRepository, TeamRepository>();
        services.AddScoped<IOrganisationRepository, OrganisationRepository>();
        services.AddScoped<IMeetingRepository, MeetingRepository>();
        services.AddScoped<IMeetingTopicRepository, MeetingTopicRepository>();
        services.AddScoped<ITopicMinuteNoteRepository, TopicMinuteNoteRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITeamUserRepository, TeamUserRepository>();

        services.AddScoped<IDemoSettingsService, DemoSettingsService>();
        services.AddScoped<ISeedService, SeedService>();
        services.AddScoped<IMeetingExternalPdfService, MeetingExternalPdfService>();

        return services;
    }
}
