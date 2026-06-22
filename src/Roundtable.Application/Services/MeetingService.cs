using Roundtable.Application.Dto;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;

namespace Roundtable.Application.Services;

public class MeetingService : IMeetingService
{
    private readonly IMeetingRepository _meetings;
    private readonly IMeetingTopicRepository _topics;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;

    public MeetingService(
        IMeetingRepository meetings,
        IMeetingTopicRepository topics,
        ICurrentUser currentUser,
        IUserRepository users)
    {
        _meetings = meetings;
        _topics = topics;
        _currentUser = currentUser;
        _users = users;
    }

    public async Task<IReadOnlyList<MeetingDto>> ListAsync(string? teamId = null, string? status = null, CancellationToken ct = default)
    {
        var list = await _meetings.ListAsync(teamId, status, ct);
        return list.Select(Map).ToList();
    }

    public async Task<MeetingDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var meeting = await _meetings.GetByIdAsync(id, ct);
        return meeting == null ? null : Map(meeting);
    }

    public async Task<MeetingDto> CreateAsync(CreateMeetingRequest request, CancellationToken ct = default)
    {
        var status = string.Equals(request.Status, "archived", StringComparison.OrdinalIgnoreCase) ? "archived" : "active";
        var meeting = new Meeting
        {
            TeamId = request.TeamId.Trim(),
            Date = request.Date.Kind == DateTimeKind.Utc ? request.Date : DateTime.SpecifyKind(request.Date, DateTimeKind.Utc),
            Status = status,
            Title = request.Title?.Trim(),
            Notes = request.Notes?.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
        };
        await _meetings.AddAsync(meeting, ct);
        return Map(meeting);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var meeting = await _meetings.GetByIdAsync(id, ct);
        if (meeting == null)
            return false;

        var user = await _users.GetByUserNameAsync(_currentUser.UserName, ct);
        var currentOrg = user?.Organisation;
        if (string.IsNullOrWhiteSpace(currentOrg))
            throw new UnauthorizedAccessException("You must complete onboarding (organisation) before deleting meetings.");

        var topics = await _topics.ListByMeetingIdAsync(id, ct);
        var hasOtherOrgTopics = topics.Any(t =>
            string.IsNullOrWhiteSpace(t.CreatedByOrganisation) ||
            !string.Equals(t.CreatedByOrganisation, currentOrg, StringComparison.OrdinalIgnoreCase));
        if (hasOtherOrgTopics)
            throw new UnauthorizedAccessException("This meeting contains topics from other organisations and cannot be deleted.");

        _meetings.Remove(meeting);
        await _meetings.SaveAsync(ct);
        return true;
    }

    public async Task<MeetingDto?> UpdateStatusAsync(int id, string status, CancellationToken ct = default)
    {
        var meeting = await _meetings.GetByIdAsync(id, ct);
        if (meeting == null)
            return null;
        var normalized = string.Equals(status, "archived", StringComparison.OrdinalIgnoreCase) ? "archived" : "active";
        meeting.Status = normalized;
        await _meetings.SaveAsync(ct);
        return Map(meeting);
    }

    private static MeetingDto Map(Meeting m) => new()
    {
        Id = m.Id,
        TeamId = m.TeamId,
        Date = m.Date,
        Status = m.Status,
        Title = m.Title,
        Notes = m.Notes,
        CreatedAtUtc = m.CreatedAtUtc,
    };
}
