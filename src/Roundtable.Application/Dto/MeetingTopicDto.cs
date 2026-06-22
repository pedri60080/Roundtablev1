namespace Roundtable.Application.Dto;

public class MeetingTopicDto
{
    public int Id { get; set; }
    /// <summary>User-facing id, format <c># </c>&lt;n&gt; (e.g. <c># 123</c>).</summary>
    public string DisplayId { get; set; } = "";
    public int MeetingId { get; set; }
    public string Title { get; set; } = "";
    public string? Tags { get; set; }
    public string? Notes { get; set; }
    public string? ReferenceDocumentsJson { get; set; }
    public int? OrganisationId { get; set; }
    public string? CreatedByOrganisation { get; set; }
    /// <summary>Display name of the user who created the topic (not included in PDF export).</summary>
    public string? CreatedByNickname { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }

    /// <summary>Shared minute note text for this topic, if any.</summary>
    public string? MinuteNoteBody { get; set; }

    /// <summary>Whether the minute note is still draft; null if no note row.</summary>
    public bool? MinuteNoteIsDraft { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedByOrganisation { get; set; }
}
