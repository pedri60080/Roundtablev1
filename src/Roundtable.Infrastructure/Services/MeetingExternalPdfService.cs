using System.Globalization;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Roundtable.Application.Services;
using Roundtable.Domain.Entities;
using Roundtable.Domain.Repositories;

namespace Roundtable.Infrastructure.Services;

public sealed class MeetingExternalPdfService : IMeetingExternalPdfService
{
    private static readonly CultureInfo PdfCulture = CultureInfo.GetCultureInfo("en-GB");

    private readonly IMeetingRepository _meetings;
    private readonly IMeetingTopicRepository _topics;
    private readonly ITopicMinuteNoteRepository _minuteNotes;

    static MeetingExternalPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public MeetingExternalPdfService(
        IMeetingRepository meetings,
        IMeetingTopicRepository topics,
        ITopicMinuteNoteRepository minuteNotes)
    {
        _meetings = meetings;
        _topics = topics;
        _minuteNotes = minuteNotes;
    }

    public async Task<byte[]?> BuildAsync(int meetingId, bool includeMinutes = true, CancellationToken ct = default)
    {
        var meeting = await _meetings.GetByIdAsync(meetingId, ct);
        if (meeting == null)
            return null;

        var topicList = await _topics.ListByMeetingIdAsync(meetingId, ct);
        var topicIds = topicList.Select(t => t.Id).ToList();
        IReadOnlyDictionary<int, TopicMinuteNote> noteByTopicId;
        if (includeMinutes)
        {
            var notes = await _minuteNotes.ListByTopicIdsAsync(topicIds, ct);
            noteByTopicId = notes.ToDictionary(n => n.MeetingTopicId);
        }
        else
        {
            noteByTopicId = new Dictionary<int, TopicMinuteNote>();
        }

        var dateStr = meeting.Date.ToString("D", PdfCulture);
        var statusLabel = string.Equals(meeting.Status, "archived", StringComparison.OrdinalIgnoreCase)
            ? "Archived"
            : "Active";

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10.5f).LineHeight(1.35f));

                page.Header().Element(c => DrawHeader(c, dateStr));

                page.Content().Column(column =>
                {
                    column.Spacing(10);

                    column.Item().Text($"Status: {statusLabel}").SemiBold().FontColor(Colors.Grey.Darken2);

                    if (!string.IsNullOrWhiteSpace(meeting.Title))
                    {
                        column.Item().Text("Meeting title").FontSize(9).FontColor(Colors.Grey.Medium);
                        column.Item().Text(meeting.Title.Trim()).SemiBold();
                    }

                    if (!string.IsNullOrWhiteSpace(meeting.Notes))
                    {
                        column.Item().PaddingTop(4).Text("Meeting notes").FontSize(9).FontColor(Colors.Grey.Medium);
                        column.Item().Text(meeting.Notes.Trim()).Italic();
                    }

                    column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    if (topicList.Count == 0)
                    {
                        column.Item().PaddingTop(12).Text("No topics in this meeting.").FontColor(Colors.Grey.Medium);
                    }
                    else
                    {
                        column.Item().PaddingTop(4).Text("Agenda").FontSize(14).SemiBold().FontColor(Colors.Blue.Darken3);

                        foreach (var topic in topicList)
                        {
                            column.Item().PaddingTop(6).Element(c => DrawTopicBlock(c, topic, noteByTopicId));
                        }
                    }

                    column.Item().PaddingTop(24).AlignCenter().Text("Generated with Roundtable")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Medium));
                    text.Span("Page ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

        return pdf.GeneratePdf();
    }

    private static void DrawHeader(IContainer container, string dateStr)
    {
        container.Background(Colors.Blue.Darken4).Padding(16).Column(col =>
        {
            col.Spacing(4);
            col.Item().Text("Meeting overview").FontSize(22).Bold().FontColor(Colors.White);
            col.Item().Text(dateStr).FontSize(11).FontColor(Colors.Grey.Lighten3);
        });
    }

    private static void DrawTopicBlock(IContainer container, MeetingTopic topic, IReadOnlyDictionary<int, TopicMinuteNote> noteByTopicId)
    {
        if (topic.IsDeleted)
        {
            var displayRef = topic.DisplayNumber > 0 ? $"# {topic.DisplayNumber}" : $"Topic {topic.Id}";
            var deletedAt = topic.DeletedAtUtc.HasValue
                ? topic.DeletedAtUtc.Value.ToString("D", PdfCulture)
                : "—";
            var byOrg = string.IsNullOrWhiteSpace(topic.DeletedByOrganisation) ? "—" : topic.DeletedByOrganisation.Trim();
            container.Border(1).BorderColor(Colors.Red.Medium).Background(Colors.Red.Lighten5).Padding(12).Text(
                    $"{displayRef} — DELETED by {byOrg} on {deletedAt}")
                .SemiBold().FontColor(Colors.Red.Darken3);
            return;
        }

        container.Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(14).Column(col =>
        {
            col.Spacing(8);

            var displayRef = topic.DisplayNumber > 0 ? $"# {topic.DisplayNumber}" : $"Topic {topic.Id}";
            col.Item().Row(row =>
            {
                row.AutoItem().Background(Colors.Blue.Medium).PaddingHorizontal(8).PaddingVertical(3)
                    .Text(displayRef).FontSize(8).Bold().FontColor(Colors.White);
                row.RelativeItem().PaddingLeft(8).Text(topic.Title).SemiBold().FontSize(13).FontColor(Colors.Blue.Darken4);
            });

            if (!string.IsNullOrWhiteSpace(topic.Tags))
            {
                var tags = topic.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(t => t.Length > 0).ToList();
                if (tags.Count > 0)
                {
                    col.Item().Row(row =>
                    {
                        row.AutoItem().Text("Tags: ").SemiBold().FontSize(9).FontColor(Colors.Grey.Darken2);
                        row.RelativeItem().Text(string.Join(" · ", tags)).FontSize(9).FontColor(Colors.Grey.Darken1);
                    });
                }
            }

            if (!string.IsNullOrWhiteSpace(topic.Notes))
            {
                col.Item().Text("Topic notes").FontSize(9).FontColor(Colors.Grey.Medium);
                col.Item().Text(topic.Notes.Trim());
            }

            var refs = ParseReferenceDocuments(topic.ReferenceDocumentsJson);
            if (refs.Count > 0)
            {
                col.Item().Text("References").FontSize(9).FontColor(Colors.Grey.Medium);
                foreach (var r in refs)
                    col.Item().Text($"• {r}").FontColor(Colors.Blue.Medium);
            }

            if (noteByTopicId.TryGetValue(topic.Id, out var minute))
            {
                col.Item().PaddingTop(4).Background(Colors.White).Padding(10).Column(inner =>
                {
                    inner.Spacing(4);
                    inner.Item().Row(r =>
                    {
                        r.AutoItem().Text("Minutes").SemiBold().FontSize(10);
                        var badge = minute.IsDraft ? "Draft" : "Final";
                        var bg = minute.IsDraft ? Colors.Orange.Medium : Colors.Green.Medium;
                        r.AutoItem().PaddingLeft(8).Background(bg).PaddingHorizontal(6).PaddingVertical(2)
                            .Text(badge).FontSize(7).Bold().FontColor(Colors.White);
                    });
                    inner.Item().Text(string.IsNullOrWhiteSpace(minute.Body) ? "—" : minute.Body.Trim());
                });
            }
        });
    }

    private static IReadOnlyList<string> ParseReferenceDocuments(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Array.Empty<string>();
        try
        {
            var arr = JsonSerializer.Deserialize<List<string>>(json);
            if (arr == null)
                return Array.Empty<string>();
            return arr.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }
}
