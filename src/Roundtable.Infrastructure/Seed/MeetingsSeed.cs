using Roundtable.Domain.Entities;

namespace Roundtable.Infrastructure.Seed;

public static class MeetingsSeed
{
    private static readonly DateTime RefDate = new(2026, 3, 16, 12, 0, 0, DateTimeKind.Utc);

    public static List<Meeting> Generate()
    {
        var list = new List<Meeting>();
        var createdAt = DateTime.UtcNow;

        foreach (var team in TeamsSeed.Data)
        {
            var dates = GetMeetingDatesForTeam(team.Id);
            var ordered = dates.OrderByDescending(d => d).ToList();
            for (int i = 0; i < ordered.Count; i++)
            {
                var date = ordered[i];
                var status = i < ordered.Count * 0.3 ? "active" : "archived";
                list.Add(new Meeting
                {
                    TeamId = team.Id,
                    Date = date,
                    Status = status,
                    CreatedAtUtc = createdAt,
                });
            }
        }

        return list;
    }

    private static List<DateTime> GetMeetingDatesForTeam(string teamId)
    {
        var dates = new List<DateTime>();
        var end = RefDate.Date;

        switch (teamId)
        {
            case "team001":
                for (var d = end; d >= end.AddDays(-42); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                        dates.Add(d);
                }
                break;
            case "team002":
                for (var d = end; d >= end.AddDays(-84); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek == DayOfWeek.Monday || d.DayOfWeek == DayOfWeek.Thursday)
                        dates.Add(d);
                }
                break;
            case "team003":
                for (var d = end; d >= end.AddDays(-98); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek == DayOfWeek.Monday)
                        dates.Add(d);
                }
                break;
            case "team004":
                for (var d = end; d >= end.AddDays(-84); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek == DayOfWeek.Wednesday)
                        dates.Add(d);
                }
                break;
            case "team005":
                for (var d = end; d >= end.AddDays(-70); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek == DayOfWeek.Tuesday || d.DayOfWeek == DayOfWeek.Friday)
                        dates.Add(d);
                }
                break;
            case "team006":
                for (int m = 0; m <= 8; m++)
                {
                    var monthStart = end.AddMonths(-m);
                    var first = new DateTime(monthStart.Year, monthStart.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    for (int i = 0; i < 7; i++)
                    {
                        var d = first.AddDays(i);
                        if (d <= end && d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                        {
                            dates.Add(d);
                            break;
                        }
                    }
                }
                break;
            case "team007":
                for (var d = end; d >= end.AddDays(-21); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                        dates.Add(d);
                }
                break;
            case "team008":
                for (var d = end; d >= end.AddDays(-70); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek == DayOfWeek.Friday)
                        dates.Add(d);
                }
                break;
            case "team009":
                for (int m = 0; m <= 6; m++)
                {
                    var month = end.AddMonths(-m);
                    var d = new DateTime(month.Year, month.Month, 15, 0, 0, 0, DateTimeKind.Utc);
                    if (d.DayOfWeek == DayOfWeek.Saturday) d = d.AddDays(-1);
                    if (d.DayOfWeek == DayOfWeek.Sunday) d = d.AddDays(1);
                    if (d <= end) dates.Add(d);
                }
                break;
            case "team010":
                for (var d = end; d >= end.AddDays(-56); d = d.AddDays(-1))
                {
                    if (d.DayOfWeek == DayOfWeek.Monday || d.DayOfWeek == DayOfWeek.Friday)
                        dates.Add(d);
                }
                break;
        }

        return dates.Distinct().ToList();
    }
}
