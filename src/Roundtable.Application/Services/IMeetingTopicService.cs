using Roundtable.Application.Dto;

namespace Roundtable.Application.Services;

public interface IMeetingTopicService
{
    Task<IReadOnlyList<MeetingTopicDto>> ListByMeetingIdAsync(int meetingId, CancellationToken ct = default);
    Task<IReadOnlyList<TopicWithMeetingDto>> ListByTeamIdAsync(string teamId, CancellationToken ct = default);
    Task<MeetingTopicDto> CreateAsync(int meetingId, CreateMeetingTopicRequest request, CancellationToken ct = default);
    Task<MeetingTopicDto> UpdateAsync(int meetingId, int topicId, UpdateMeetingTopicRequest request, CancellationToken ct = default);
    Task DeleteAsync(int meetingId, int topicId, CancellationToken ct = default);
    Task<MeetingTopicDto> UpsertMinuteNoteAsync(int meetingId, int topicId, UpsertTopicMinuteNoteRequest request, CancellationToken ct = default);
    Task<MeetingTopicDto> DeleteMinuteNoteAsync(int meetingId, int topicId, CancellationToken ct = default);
}

public class CreateMeetingTopicRequest
{
    public string Title { get; set; } = "";
    public string? Tags { get; set; }
    public string? Notes { get; set; }
    public List<string>? ReferenceDocuments { get; set; }
}

public class UpdateMeetingTopicRequest
{
    public string Title { get; set; } = "";
    public string? Tags { get; set; }
    public string? Notes { get; set; }
    public List<string>? ReferenceDocuments { get; set; }
}
