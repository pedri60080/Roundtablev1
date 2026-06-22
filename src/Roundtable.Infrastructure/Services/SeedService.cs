using Microsoft.EntityFrameworkCore;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;
using Roundtable.Infrastructure.Persistence;
using Roundtable.Infrastructure.Seed;

namespace Roundtable.Infrastructure.Services;

public class SeedService : ISeedService
{
    private readonly AppDbContext _db;
    private readonly IDemoSettingsService _demoSettings;

    public SeedService(AppDbContext db, IDemoSettingsService demoSettings)
    {
        _db = db;
        _demoSettings = demoSettings;
    }

    public async Task<SeedResultDto> RunAsync(CancellationToken ct = default)
    {
        var mergedTeams = _demoSettings.GetMergedTeamSeedData();
        var mergedOrgs = _demoSettings.GetMergedOrganisationSeedData();

        var existingTeamIds = await _db.Teams.Select(t => t.Id).ToListAsync(ct);
        var teamsToAdd = mergedTeams.Where(t => !existingTeamIds.Contains(t.Id)).ToList();
        foreach (var team in teamsToAdd)
            _db.Teams.Add(team);

        var existingOrgNames = await _db.Organisations.Select(o => o.Name).ToListAsync(ct);
        var orgsToAdd = mergedOrgs.Where(o => !existingOrgNames.Contains(o.Name)).ToList();
        foreach (var org in orgsToAdd)
            _db.Organisations.Add(org);

        var existingUserNames = await _db.Users.Select(u => u.UserName).ToListAsync(ct);
        var usersToAdd = UsersSeed.Data.Where(u => !existingUserNames.Contains(u.UserName)).ToList();
        foreach (var user in usersToAdd)
            _db.Users.Add(user);

        await _db.SaveChangesAsync(ct);

        var existingTeamUsers = await _db.TeamUsers.Select(tu => new { tu.TeamId, tu.UserGuid }).ToListAsync(ct);
        var existingTeamUserSet = existingTeamUsers.Select(x => (x.TeamId, x.UserGuid)).ToHashSet();
        var teamUsersToAdd = TeamUsersSeed.Data.Where(tu => !existingTeamUserSet.Contains((tu.TeamId, tu.UserGuid))).ToList();
        foreach (var tu in teamUsersToAdd)
            _db.TeamUsers.Add(tu);

        await _db.SaveChangesAsync(ct);

        var existingMeetings = await _db.Meetings.Select(m => new { m.TeamId, m.Date }).ToListAsync(ct);
        var existingSet = existingMeetings.Select(m => (m.TeamId, Date: m.Date.Date)).ToHashSet();
        var meetingsToAdd = MeetingsSeed.Generate().Where(m => !existingSet.Contains((m.TeamId, m.Date.Date))).ToList();
        foreach (var m in meetingsToAdd)
        {
            m.Date = DateTime.SpecifyKind(m.Date.Date, DateTimeKind.Utc);
            _db.Meetings.Add(m);
        }

        await _db.SaveChangesAsync(ct);

        var meetingIdsWithTopics = await _db.MeetingTopics.Select(t => t.MeetingId).Distinct().ToListAsync(ct);
        var meetingsWithoutTopics = await _db.Meetings
            .Where(m => !meetingIdsWithTopics.Contains(m.Id))
            .OrderBy(m => m.Date)
            .ThenBy(m => m.Id)
            .Select(m => new { m.Id, m.TeamId })
            .ToListAsync(ct);
        var organisations = await _db.Organisations
            .OrderBy(o => o.Id)
            .Select(o => new { o.Id, o.Name })
            .ToListAsync(ct);
        var organisationIds = organisations.Select(o => o.Id).ToList();
        var organisationNames = organisations.Select(o => o.Name).ToList();
        var maxDisplay = await _db.MeetingTopics.AnyAsync(ct)
            ? await _db.MeetingTopics.MaxAsync(t => t.DisplayNumber, ct)
            : 0;
        var topicsToAdd = MeetingTopicsSeed.Generate(
            meetingsWithoutTopics.Select(m => (m.Id, m.TeamId)).ToList(),
            organisationIds,
            organisationNames,
            maxDisplay);
        foreach (var t in topicsToAdd)
            _db.MeetingTopics.Add(t);
        await _db.SaveChangesAsync(ct);

        return new SeedResultDto
        {
            TeamsAdded = teamsToAdd.Count,
            OrganisationsAdded = orgsToAdd.Count,
            MeetingsAdded = meetingsToAdd.Count,
            TopicsAdded = topicsToAdd.Count,
            UsersAdded = usersToAdd.Count,
            TeamUsersAdded = teamUsersToAdd.Count,
        };
    }

    public async Task<SeedResultDto> ResetAsync(CancellationToken ct = default)
    {
        await _db.Database.EnsureDeletedAsync(ct);
        await _db.Database.EnsureCreatedAsync(ct);

        return await RunAsync(ct);
    }
}
