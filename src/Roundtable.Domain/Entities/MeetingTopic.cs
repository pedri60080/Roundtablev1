namespace Roundtable.Domain.Entities;

/// <summary>Meeting topic entity. Part of the Meeting aggregate.</summary>
public class MeetingTopic
{
    public int Id { get; set; }
    /// <summary>Global sequence for user-facing id <c># {DisplayNumber}</c>.</summary>
    public int DisplayNumber { get; set; }
    public int MeetingId { get; set; }
    public string Title { get; set; } = "";
    public string? Tags { get; set; }
    public string? Notes { get; set; }
    /// <summary>JSON array of reference document URLs or labels.</summary>
    public string? ReferenceDocumentsJson { get; set; }
    public int? OrganisationId { get; set; }
    public string CreatedByUserGuid { get; set; } = "";
    public string? CreatedByOrganisation { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    /// <summary>Organisation name of the user who deleted the topic (soft delete).</summary>
    public string? DeletedByOrganisation { get; set; }
}
