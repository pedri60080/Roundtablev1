namespace Roundtable.Application.Services;

public interface IMeetingExternalPdfService
{
    /// <summary>Builds a PDF for external sharing (no user or organisation details). Returns null if the meeting does not exist.</summary>
    Task<byte[]?> BuildAsync(int meetingId, bool includeMinutes = true, CancellationToken ct = default);
}
