using Roundtable.Application.Dto;

namespace Roundtable.Application.Services;

public interface IMeetingService
{
    Task<IReadOnlyList<MeetingDto>> ListAsync(string? teamId = null, string? status = null, CancellationToken ct = default);
    Task<MeetingDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<MeetingDto> CreateAsync(CreateMeetingRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<MeetingDto?> UpdateStatusAsync(int id, string status, CancellationToken ct = default);
}

public class CreateMeetingRequest
{
    public string TeamId { get; set; } = "";
    public DateTime Date { get; set; }
    public string? Status { get; set; }
    public string? Title { get; set; }
    public string? Notes { get; set; }
}
