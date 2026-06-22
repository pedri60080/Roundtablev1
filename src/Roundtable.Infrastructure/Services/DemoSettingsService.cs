using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Roundtable.Application.Dto;
using Roundtable.Application.Services;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;
using Roundtable.Infrastructure.Persistence;
using Roundtable.Infrastructure.Seed;

namespace Roundtable.Infrastructure.Services;

public class DemoSettingsService : IDemoSettingsService
{
    private const string Team001 = "team001";
    private const long MaxIconBytes = 5 * 1024 * 1024;
    private readonly IDemoSeedDataFilePath _seedDataFilePath;
    private readonly AppDbContext _db;
    private readonly ITeamRepository _teams;
    private readonly IOrganisationRepository _organisations;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        PropertyNameCaseInsensitive = true,
    };
    private static readonly Dictionary<string, string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/png"] = ".png",
        ["image/jpeg"] = ".jpg",
        ["image/webp"] = ".webp",
        ["image/svg+xml"] = ".svg",
        ["image/svg"] = ".svg", // some clients omit +xml
    };

    public DemoSettingsService(
        IDemoSeedDataFilePath seedDataFilePath,
        AppDbContext db,
        ITeamRepository teams,
        IOrganisationRepository organisations)
    {
        _seedDataFilePath = seedDataFilePath;
        _db = db;
        _teams = teams;
        _organisations = organisations;
    }

    private string GetFilePath() => _seedDataFilePath.FullPath;
    private string GetIconsDirectoryPath() => Path.Combine(Path.GetDirectoryName(GetFilePath()) ?? ".", "demo-team-icons");
    private string GetPublicIconUrl(string teamId) => $"/api/demo-settings/team-icon/{teamId}";

    public Task<DemoSettingsDto> GetAsync(CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        var file = ReadFile();
        var orgNames = GetMergedOrganisationSeedData().Select(o => o.Name).ToList();
        var teamDtos = GetMergedTeamSeedData()
            .Select(t => new DemoTeamNameDto { Id = t.Id, Name = t.Name })
            .ToList();
        return Task.FromResult(new DemoSettingsDto
        {
            AppDisplayName = string.IsNullOrWhiteSpace(file.AppDisplayName)
                ? "Roundtable"
                : file.AppDisplayName.Trim(),
            IncludingMinutes = file.IncludingMinutes ?? false,
            Team001CustomIconUrl = GetCustomTeamIconPublicUrl(Team001),
            OrganisationNames = orgNames,
            Teams = teamDtos,
        });
    }

    public async Task<DemoSettingsDto> UpdateAsync(UpdateDemoSettingsRequest request, CancellationToken ct = default)
    {
        ValidateRequest(request);

        var file = new DemoSeedDataFile
        {
            AppDisplayName = request.AppDisplayName.Trim(),
            IncludingMinutes = request.IncludingMinutes,
            OrganisationNames = request.OrganisationNames.Select(n => n.Trim()).ToList(),
            Teams = request.Teams.Select(t => new TeamNameEntryFile { Id = t.Id, Name = t.Name.Trim() }).ToList(),
        };

        var dir = Path.GetDirectoryName(GetFilePath());
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);

        var json = JsonSerializer.Serialize(file, JsonOptions);
        await File.WriteAllTextAsync(GetFilePath(), json, ct);

        await SyncDatabaseAsync(request, ct);

        return await GetAsync(ct);
    }

    public IReadOnlyList<Organisation> GetMergedOrganisationSeedData()
    {
        var file = ReadFile();
        var defaults = OrganisationsSeed.Data;
        var overrides = file.OrganisationNames;
        if (overrides == null || overrides.Count != defaults.Length)
            return defaults.ToArray();
        return defaults
            .Select((o, i) => new Organisation { Name = CoalesceName(overrides[i], o.Name) })
            .ToArray();
    }

    public IReadOnlyList<Team> GetMergedTeamSeedData()
    {
        var file = ReadFile();
        var defaults = TeamsSeed.Data;
        var nameById = file.Teams?.ToDictionary(x => x.Id, x => x.Name, StringComparer.Ordinal)
            ?? new Dictionary<string, string>(StringComparer.Ordinal);
        return defaults
            .Select(t =>
            {
                if (nameById.TryGetValue(t.Id, out var n) && !string.IsNullOrWhiteSpace(n))
                    return CloneTeam(t, n.Trim());
                return CloneTeam(t, t.Name);
            })
            .ToArray();
    }

    public string GetDevUserOrganisationName()
    {
        var merged = GetMergedOrganisationSeedData();
        if (merged.Count == 0)
            return OrganisationsSeed.Data[0].Name;
        return merged[0].Name;
    }

    public async Task SetDevUserOrganisationNameAsync(string organisationName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(organisationName))
            throw new ArgumentException("Organisation name is required.", nameof(organisationName));

        var newName = organisationName.Trim();
        var dto = await GetAsync(ct);
        if (dto.OrganisationNames.Count == 0)
            return;

        var oldName = dto.OrganisationNames[0];
        if (string.Equals(oldName, newName, StringComparison.Ordinal))
            return;

        var updatedOrgNames = dto.OrganisationNames.ToArray();
        updatedOrgNames[0] = newName;
        var request = new UpdateDemoSettingsRequest
        {
            AppDisplayName = dto.AppDisplayName,
            IncludingMinutes = dto.IncludingMinutes,
            OrganisationNames = updatedOrgNames,
            Teams = dto.Teams.Select(t => new DemoTeamNameDto { Id = t.Id, Name = t.Name }).ToArray(),
        };

        await UpdateAsync(request, ct);
    }

    public bool HasCustomTeamIcon(string teamId)
        => GetCustomTeamIconPath(teamId) != null;

    public string? GetCustomTeamIconPath(string teamId)
    {
        EnsureSupportedTeamId(teamId);
        var dir = GetIconsDirectoryPath();
        if (!Directory.Exists(dir))
            return null;

        foreach (var extension in AllowedContentTypes.Values.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var path = Path.Combine(dir, $"{teamId}{extension}");
            if (File.Exists(path))
                return path;
        }

        return null;
    }

    public string? GetCustomTeamIconContentType(string teamId)
    {
        var path = GetCustomTeamIconPath(teamId);
        if (path == null)
            return null;

        var extension = Path.GetExtension(path);
        foreach (var kvp in AllowedContentTypes)
        {
            if (string.Equals(kvp.Value, extension, StringComparison.OrdinalIgnoreCase))
                return kvp.Key;
        }

        return "application/octet-stream";
    }

    public string? GetCustomTeamIconPublicUrl(string teamId)
    {
        EnsureSupportedTeamId(teamId);
        return HasCustomTeamIcon(teamId) ? GetPublicIconUrl(teamId) : null;
    }

    public async Task SaveCustomTeamIconAsync(string teamId, Stream stream, string? contentType, CancellationToken ct = default)
    {
        EnsureSupportedTeamId(teamId);

        if (stream is null)
            throw new ArgumentException("Image stream is required.", nameof(stream));
        if (string.IsNullOrWhiteSpace(contentType) || !AllowedContentTypes.TryGetValue(contentType, out var extension))
            throw new ArgumentException("Only PNG, JPEG, WEBP, and SVG images are allowed.", nameof(contentType));

        var dir = GetIconsDirectoryPath();
        Directory.CreateDirectory(dir);

        var bytesWritten = 0L;
        var targetPath = Path.Combine(dir, $"{teamId}{extension}");
        await using var target = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None);
        var buffer = new byte[81920];
        while (true)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);
            if (read == 0)
                break;

            bytesWritten += read;
            if (bytesWritten > MaxIconBytes)
            {
                target.Close();
                File.Delete(targetPath);
                throw new ArgumentException("Image is too large. Maximum allowed size is 5 MB.");
            }

            await target.WriteAsync(buffer.AsMemory(0, read), ct);
        }

        foreach (var otherExtension in AllowedContentTypes.Values.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (string.Equals(otherExtension, extension, StringComparison.OrdinalIgnoreCase))
                continue;
            var otherPath = Path.Combine(dir, $"{teamId}{otherExtension}");
            if (File.Exists(otherPath))
                File.Delete(otherPath);
        }
    }

    public Task<bool> DeleteCustomTeamIconAsync(string teamId, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        EnsureSupportedTeamId(teamId);
        var existing = GetCustomTeamIconPath(teamId);
        if (existing == null)
            return Task.FromResult(false);

        File.Delete(existing);
        return Task.FromResult(true);
    }

    private DemoSeedDataFile ReadFile()
    {
        var path = GetFilePath();
        if (!File.Exists(path))
            return new DemoSeedDataFile();
        try
        {
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<DemoSeedDataFile>(json, JsonOptions) ?? new DemoSeedDataFile();
        }
        catch
        {
            return new DemoSeedDataFile();
        }
    }

    private static string CoalesceName(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static void EnsureSupportedTeamId(string teamId)
    {
        if (!string.Equals(teamId, Team001, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException($"Custom icon is only supported for {Team001}.", nameof(teamId));
    }

    private static Team CloneTeam(Team t, string name) => new()
    {
        Id = t.Id,
        Name = name,
        Icon = t.Icon,
        Authorized = t.Authorized,
        Abbreviation = t.Abbreviation,
        IsMembersOnly = t.IsMembersOnly,
        MembersCanCreateMeetings = t.MembersCanCreateMeetings,
        MembersCanCreateTopics = t.MembersCanCreateTopics,
    };

    private static void ValidateRequest(UpdateDemoSettingsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AppDisplayName))
            throw new ArgumentException("App display name is required.", nameof(request));

        if (request.OrganisationNames.Count != OrganisationsSeed.Data.Length)
            throw new ArgumentException(
                $"Expected exactly {OrganisationsSeed.Data.Length} organisation names.",
                nameof(request));

        if (request.OrganisationNames.Any(string.IsNullOrWhiteSpace))
            throw new ArgumentException("Organisation names cannot be empty.", nameof(request));

        var expectedTeamIds = TeamsSeed.Data.Select(t => t.Id).OrderBy(x => x, StringComparer.Ordinal).ToList();
        var gotIds = request.Teams.Select(t => t.Id).OrderBy(x => x, StringComparer.Ordinal).ToList();
        if (!expectedTeamIds.SequenceEqual(gotIds, StringComparer.Ordinal))
            throw new ArgumentException("Team list must include each team id exactly once.", nameof(request));

        if (request.Teams.Any(t => string.IsNullOrWhiteSpace(t.Name)))
            throw new ArgumentException("Team names cannot be empty.", nameof(request));
    }

    private async Task SyncDatabaseAsync(UpdateDemoSettingsRequest request, CancellationToken ct)
    {
        var dbOrgs = await _organisations.ListOrderedByIdAsync(ct);
        if (dbOrgs.Count == request.OrganisationNames.Count)
        {
            for (var i = 0; i < dbOrgs.Count; i++)
            {
                var oldName = dbOrgs[i].Name;
                var newName = request.OrganisationNames[i].Trim();
                if (string.Equals(oldName, newName, StringComparison.Ordinal))
                    continue;

                await CascadeOrganisationRenameAsync(oldName, newName, ct);
                dbOrgs[i].Name = newName;
                await _organisations.SaveAsync(dbOrgs[i], ct);
            }
        }

        var expectedTeamCount = TeamsSeed.Data.Length;
        var dbTeamCount = await _db.Teams.CountAsync(ct);
        if (dbTeamCount != expectedTeamCount)
            return;

        foreach (var t in request.Teams)
        {
            var team = await _teams.GetByIdAsync(t.Id, ct);
            if (team == null)
                continue;
            var newName = t.Name.Trim();
            if (string.Equals(team.Name, newName, StringComparison.Ordinal))
                continue;
            team.Name = newName;
            await _teams.SaveAsync(team, ct);
        }
    }

    private async Task CascadeOrganisationRenameAsync(string oldName, string newName, CancellationToken ct)
    {
        await _db.Users
            .Where(u => u.Organisation == oldName)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.Organisation, newName), ct);

        await _db.MeetingTopics
            .Where(m => m.CreatedByOrganisation == oldName)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.CreatedByOrganisation, newName), ct);

        await _db.MeetingTopics
            .Where(m => m.DeletedByOrganisation == oldName)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.DeletedByOrganisation, newName), ct);
    }

    private sealed class DemoSeedDataFile
    {
        public string? AppDisplayName { get; set; }
        public bool? IncludingMinutes { get; set; }
        public List<string>? OrganisationNames { get; set; }
        public List<TeamNameEntryFile>? Teams { get; set; }
    }

    private sealed class TeamNameEntryFile
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
    }
}
