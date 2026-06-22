namespace Roundtable.Application.Dto;

public class UpsertTopicMinuteNoteRequest
{
    public string? Body { get; set; }
    public bool IsDraft { get; set; } = true;
}
