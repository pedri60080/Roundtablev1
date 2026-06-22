using System.Text.Json;
using Roundtable.Application.Dto;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;

namespace Roundtable.Application.Services;

public class MeetingTopicService : IMeetingTopicService
{
    private const string DevUser123 = "user123";
    private const int MaxMinuteNoteLength = 4000;

    private readonly IMeetingTopicRepository _topics;
    private readonly IMeetingRepository _meetings;
    private readonly ITopicMinuteNoteRepository _minuteNotes;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IDemoSettingsService _demoSettings;

    public MeetingTopicService(
        IMeetingTopicRepository topics,
        IMeetingRepository meetings,
        ITopicMinuteNoteRepository minuteNotes,
        ICurrentUser currentUser,
        IUserRepository users,
        IDemoSettingsService demoSettings)
    {
        _topics = topics;
        _meetings = meetings;
        _minuteNotes = minuteNotes;
        _currentUser = currentUser;
        _users = users;
        _demoSettings = demoSettings;
    }

    public async Task<IReadOnlyList<MeetingTopicDto>> ListByMeetingIdAsync(int meetingId, CancellationToken ct = default)
    {
        var list = await _topics.ListByMeetingIdAsync(meetingId, ct);
        var userMap = await LoadUsersForTopicsAsync(list, ct);
        var (currentUserGuid, currentOrg) = await GetCurrentUserInfoAsync(ct);
        var dtos = list.Select(t => Map(t, currentUserGuid, currentOrg, userMap)).ToList();
        await ApplySharedMinuteNotesAsync(dtos, ct);
        return dtos;
    }

    public async Task<IReadOnlyList<TopicWithMeetingDto>> ListByTeamIdAsync(string teamId, CancellationToken ct = default)
    {
        var (currentUserGuid, currentOrg) = await GetCurrentUserInfoAsync(ct);
        var meetings = await _meetings.ListAsync(teamId, null, ct);
        var tuples = new List<(MeetingTopic T, DateTime Date)>();
        foreach (var meeting in meetings)
        {
            var topics = await _topics.ListByMeetingIdAsync(meeting.Id, ct);
            foreach (var t in topics)
                tuples.Add((t, meeting.Date));
        }

        var userMap = await LoadUsersForTopicsAsync(tuples.Select(x => x.T), ct);
        return tuples.Select(x => MapWithMeeting(x.T, x.Date, currentUserGuid, currentOrg, userMap)).ToList();
    }

    public async Task<MeetingTopicDto> CreateAsync(int meetingId, CreateMeetingTopicRequest request, CancellationToken ct = default)
    {
        if (!await _meetings.ExistsAsync(meetingId, ct))
            throw new KeyNotFoundException($"Meeting {meetingId} not found.");
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request));

        var (currentUserGuid, currentOrg) = await GetCurrentUserInfoAsync(ct);
        if (string.IsNullOrWhiteSpace(currentUserGuid))
            throw new InvalidOperationException("Current user not found.");

        var nextDisplay = await _topics.GetMaxDisplayNumberAsync(ct) + 1;
        var topic = new MeetingTopic
        {
            DisplayNumber = nextDisplay,
            MeetingId = meetingId,
            Title = request.Title.Trim(),
            Tags = request.Tags?.Trim(),
            Notes = request.Notes?.Trim(),
            ReferenceDocumentsJson = request.ReferenceDocuments != null && request.ReferenceDocuments.Count > 0
                ? JsonSerializer.Serialize(request.ReferenceDocuments)
                : null,
            OrganisationId = null,
            CreatedByUserGuid = currentUserGuid,
            CreatedByOrganisation = currentOrg,
        };
        await _topics.AddAsync(topic, ct);
        var userMap = await LoadUsersForTopicsAsync(new[] { topic }, ct);
        return Map(topic, currentUserGuid, currentOrg, userMap);
    }

    public async Task<MeetingTopicDto> UpdateAsync(int meetingId, int topicId, UpdateMeetingTopicRequest request, CancellationToken ct = default)
    {
        if (!await _meetings.ExistsAsync(meetingId, ct))
            throw new KeyNotFoundException($"Meeting {meetingId} not found.");

        var topic = await _topics.GetByIdAsync(topicId, ct) ?? throw new KeyNotFoundException($"Topic {topicId} not found.");
        if (topic.MeetingId != meetingId)
            throw new KeyNotFoundException($"Topic {topicId} not found in meeting {meetingId}.");
        if (topic.IsDeleted)
            throw new KeyNotFoundException($"Topic {topicId} not found.");

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request));

        var meeting = await _meetings.GetByIdAsync(meetingId, ct) ?? throw new KeyNotFoundException($"Meeting {meetingId} not found.");
        var (currentUserGuid, currentOrg) = await GetCurrentUserInfoAsync(ct);
        EnsureCanMutate(meeting.TeamId, topic, currentOrg);

        topic.Title = request.Title.Trim();
        topic.Tags = request.Tags?.Trim();
        topic.Notes = request.Notes?.Trim();
        topic.ReferenceDocumentsJson = request.ReferenceDocuments != null && request.ReferenceDocuments.Count > 0
            ? JsonSerializer.Serialize(request.ReferenceDocuments)
            : null;

        await _topics.SaveAsync(ct);
        var userMap = await LoadUsersForTopicsAsync(new[] { topic }, ct);
        return Map(topic, currentUserGuid, currentOrg, userMap);
    }

    public async Task DeleteAsync(int meetingId, int topicId, CancellationToken ct = default)
    {
        if (!await _meetings.ExistsAsync(meetingId, ct))
            throw new KeyNotFoundException($"Meeting {meetingId} not found.");

        var topic = await _topics.GetByIdAsync(topicId, ct) ?? throw new KeyNotFoundException($"Topic {topicId} not found.");
        if (topic.MeetingId != meetingId)
            throw new KeyNotFoundException($"Topic {topicId} not found in meeting {meetingId}.");
        if (topic.IsDeleted)
            throw new KeyNotFoundException($"Topic {topicId} not found.");

        var meeting = await _meetings.GetByIdAsync(meetingId, ct) ?? throw new KeyNotFoundException($"Meeting {meetingId} not found.");
        var (_, currentOrg) = await GetCurrentUserInfoAsync(ct);
        if (string.Equals(meeting.Status, "archived", StringComparison.OrdinalIgnoreCase))
        {
            if (!CanMutate(topic, currentOrg))
                throw new UnauthorizedAccessException(
                    "You can only delete topics from archived meetings that were created by your organisation.");
        }
        else
        {
            EnsureCanMutate(meeting.TeamId, topic, currentOrg);
        }

        await _minuteNotes.DeleteByTopicIdAsync(topicId, ct);

        if (string.Equals(meeting.Status, "archived", StringComparison.OrdinalIgnoreCase))
        {
            topic.IsDeleted = true;
            topic.DeletedAtUtc = DateTime.UtcNow;
            topic.DeletedByOrganisation = currentOrg;
            topic.Title = "";
            topic.Tags = null;
            topic.Notes = null;
            topic.ReferenceDocumentsJson = null;
            topic.CreatedByOrganisation = null;
            await _topics.SaveAsync(ct);
        }
        else
        {
            _topics.Remove(topic);
            await _topics.SaveAsync(ct);
        }
    }

    public async Task<MeetingTopicDto> UpsertMinuteNoteAsync(
        int meetingId,
        int topicId,
        UpsertTopicMinuteNoteRequest request,
        CancellationToken ct = default)
    {
        if (!await _meetings.ExistsAsync(meetingId, ct))
            throw new KeyNotFoundException($"Meeting {meetingId} not found.");

        var topic = await _topics.GetByIdAsync(topicId, ct) ?? throw new KeyNotFoundException($"Topic {topicId} not found.");
        if (topic.MeetingId != meetingId)
            throw new KeyNotFoundException($"Topic {topicId} not found in meeting {meetingId}.");
        if (topic.IsDeleted)
            throw new KeyNotFoundException($"Topic {topicId} not found.");

        var (currentUserGuid, currentOrg) = await GetCurrentUserInfoAsync(ct);
        if (string.IsNullOrWhiteSpace(currentUserGuid))
            throw new InvalidOperationException("Current user not found.");

        var body = request.Body ?? "";
        if (body.Length > MaxMinuteNoteLength)
            throw new ArgumentException($"Body must be at most {MaxMinuteNoteLength} characters.", nameof(request));

        await _minuteNotes.UpsertByTopicAsync(topicId, body, request.IsDraft, ct);

        var userMap = await LoadUsersForTopicsAsync(new[] { topic }, ct);
        var dto = Map(topic, currentUserGuid, currentOrg, userMap);
        var saved = await _minuteNotes.GetByTopicIdAsync(topicId, ct);
        if (saved != null)
        {
            dto.MinuteNoteBody = saved.Body;
            dto.MinuteNoteIsDraft = saved.IsDraft;
        }

        return dto;
    }

    public async Task<MeetingTopicDto> DeleteMinuteNoteAsync(int meetingId, int topicId, CancellationToken ct = default)
    {
        if (!await _meetings.ExistsAsync(meetingId, ct))
            throw new KeyNotFoundException($"Meeting {meetingId} not found.");

        var topic = await _topics.GetByIdAsync(topicId, ct) ?? throw new KeyNotFoundException($"Topic {topicId} not found.");
        if (topic.MeetingId != meetingId)
            throw new KeyNotFoundException($"Topic {topicId} not found in meeting {meetingId}.");
        if (topic.IsDeleted)
            throw new KeyNotFoundException($"Topic {topicId} not found.");

        var (currentUserGuid, currentOrg) = await GetCurrentUserInfoAsync(ct);
        if (string.IsNullOrWhiteSpace(currentUserGuid))
            throw new InvalidOperationException("Current user not found.");

        await _minuteNotes.DeleteByTopicIdAsync(topicId, ct);

        var userMap = await LoadUsersForTopicsAsync(new[] { topic }, ct);
        var dto = Map(topic, currentUserGuid, currentOrg, userMap);
        dto.MinuteNoteBody = null;
        dto.MinuteNoteIsDraft = null;
        return dto;
    }

    private async Task ApplySharedMinuteNotesAsync(List<MeetingTopicDto> dtos, CancellationToken ct)
    {
        if (dtos.Count == 0)
            return;

        var topicIds = dtos.Select(d => d.Id).ToList();
        var notes = await _minuteNotes.ListByTopicIdsAsync(topicIds, ct);
        var byTopicId = notes.ToDictionary(n => n.MeetingTopicId);
        foreach (var d in dtos)
        {
            if (!byTopicId.TryGetValue(d.Id, out var n))
                continue;
            d.MinuteNoteBody = n.Body;
            d.MinuteNoteIsDraft = n.IsDraft;
        }
    }

    private async Task<IReadOnlyDictionary<string, User>> LoadUsersForTopicsAsync(
        IEnumerable<MeetingTopic> topics,
        CancellationToken ct)
    {
        var guids = topics
            .Select(t => t.CreatedByUserGuid)
            .Where(g => !string.IsNullOrWhiteSpace(g))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (guids.Count == 0)
            return new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);

        var users = await _users.GetByGuidsAsync(guids, ct);
        return users.ToDictionary(u => u.Guid, StringComparer.OrdinalIgnoreCase);
    }

    private static string? CreatorNickname(User? user)
    {
        if (user == null)
            return null;
        if (!string.IsNullOrWhiteSpace(user.DisplayName))
            return user.DisplayName.Trim();
        if (!string.IsNullOrWhiteSpace(user.UserName))
            return user.UserName.Trim();
        return null;
    }

    private static string? ResolveCreatorNickname(MeetingTopic t, IReadOnlyDictionary<string, User> usersByGuid)
    {
        if (string.IsNullOrWhiteSpace(t.CreatedByUserGuid))
            return null;
        return usersByGuid.TryGetValue(t.CreatedByUserGuid, out var u) ? CreatorNickname(u) : null;
    }

    private MeetingTopicDto Map(
        MeetingTopic t,
        string currentUserGuid,
        string? currentOrg,
        IReadOnlyDictionary<string, User> usersByGuid)
    {
        if (t.IsDeleted)
        {
            return new MeetingTopicDto
            {
                Id = t.Id,
                DisplayId = FormatDisplayId(t.DisplayNumber),
                MeetingId = t.MeetingId,
                Title = "",
                Tags = null,
                Notes = null,
                ReferenceDocumentsJson = null,
                OrganisationId = null,
                CreatedByOrganisation = null,
                CreatedByNickname = null,
                CanEdit = false,
                CanDelete = false,
                IsDeleted = true,
                DeletedAtUtc = t.DeletedAtUtc,
                DeletedByOrganisation = t.DeletedByOrganisation,
                MinuteNoteBody = null,
                MinuteNoteIsDraft = null,
            };
        }

        var can = CanMutate(t, currentOrg);
        return new MeetingTopicDto
        {
            Id = t.Id,
            DisplayId = FormatDisplayId(t.DisplayNumber),
            MeetingId = t.MeetingId,
            Title = t.Title,
            Tags = t.Tags,
            Notes = t.Notes,
            ReferenceDocumentsJson = t.ReferenceDocumentsJson,
            OrganisationId = t.OrganisationId,
            CreatedByOrganisation = t.CreatedByOrganisation,
            CreatedByNickname = ResolveCreatorNickname(t, usersByGuid),
            CanEdit = can,
            CanDelete = can,
            IsDeleted = false,
            DeletedAtUtc = null,
            DeletedByOrganisation = null,
        };
    }

    private TopicWithMeetingDto MapWithMeeting(
        MeetingTopic t,
        DateTime meetingDate,
        string currentUserGuid,
        string? currentOrg,
        IReadOnlyDictionary<string, User> usersByGuid)
    {
        var baseDto = Map(t, currentUserGuid, currentOrg, usersByGuid);
        return new TopicWithMeetingDto
        {
            MeetingDate = meetingDate,
            Id = baseDto.Id,
            DisplayId = baseDto.DisplayId,
            MeetingId = baseDto.MeetingId,
            Title = baseDto.Title,
            Tags = baseDto.Tags,
            Notes = baseDto.Notes,
            ReferenceDocumentsJson = baseDto.ReferenceDocumentsJson,
            OrganisationId = baseDto.OrganisationId,
            CreatedByOrganisation = baseDto.CreatedByOrganisation,
            CreatedByNickname = baseDto.CreatedByNickname,
            CanEdit = baseDto.CanEdit,
            CanDelete = baseDto.CanDelete,
            MinuteNoteBody = baseDto.MinuteNoteBody,
            MinuteNoteIsDraft = baseDto.MinuteNoteIsDraft,
            IsDeleted = baseDto.IsDeleted,
            DeletedAtUtc = baseDto.DeletedAtUtc,
            DeletedByOrganisation = baseDto.DeletedByOrganisation,
        };
    }

    private bool CanMutate(MeetingTopic t, string? currentOrg)
    {
        if (t.IsDeleted)
            return false;
        var effectiveCurrentOrg = ResolveEffectiveCurrentOrganisation(currentOrg);
        if (string.IsNullOrWhiteSpace(effectiveCurrentOrg))
            return false;
        if (string.IsNullOrWhiteSpace(t.CreatedByOrganisation))
            return false;
        return string.Equals(effectiveCurrentOrg, t.CreatedByOrganisation, StringComparison.OrdinalIgnoreCase);
    }

    private string? ResolveEffectiveCurrentOrganisation(string? currentOrg)
    {
        if (string.Equals(_currentUser.UserName, DevUser123, StringComparison.Ordinal))
            return _demoSettings.GetDevUserOrganisationName();
        return currentOrg;
    }

    private void EnsureCanMutate(string teamId, MeetingTopic topic, string? currentOrg)
    {
        if (_currentUser.IsAdminForTeam(teamId))
            return;

        if (!CanMutate(topic, currentOrg))
            throw new UnauthorizedAccessException("You can only modify topics created by users from your organisation.");
    }

    private async Task<(string UserGuid, string? Organisation)> GetCurrentUserInfoAsync(CancellationToken ct)
    {
        var user = await _users.GetByUserNameAsync(_currentUser.UserName, ct);
        return user == null ? ("", null) : (user.Guid, user.Organisation);
    }

    private static string FormatDisplayId(int displayNumber) => $"# {displayNumber}";
}
