using Roundtable.Domain.Entities;

namespace Roundtable.Infrastructure.Seed;

public static class TeamUsersSeed
{
    private static readonly DateTime TodayUtc = DateTime.UtcNow.Date;

    public static readonly TeamUser[] Data =
    {
        new() { TeamId = "team001", UserGuid = UsersSeed.EwoutUserGuid, IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(8) },

        // user123: member of Dirty Dozen + Losers (admin for 2 teams is hardcoded elsewhere)
        new() { TeamId = "team002", UserGuid = "11111111-1111-1111-1111-111111111111", IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(6) },
        new() { TeamId = "team008", UserGuid = "11111111-1111-1111-1111-111111111111", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(14) },

        // Some additional memberships for demo purposes
        new() { TeamId = "team001", UserGuid = "22222222-2222-2222-2222-222222222222", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(-3) },    // expired (red)
        new() { TeamId = "team001", UserGuid = "33333333-3333-3333-3333-333333333333", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(45) },
        // Make Inglorious Basterds have 9 members (for demo/settings UI)
        new() { TeamId = "team001", UserGuid = "44444444-4444-4444-4444-444444444444", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(10) },    // expiring soon (orange)
        new() { TeamId = "team001", UserGuid = "55555555-5555-5555-5555-555555555555", IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(1) },
        new() { TeamId = "team001", UserGuid = "66666666-6666-6666-6666-666666666666", IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(2) },
        new() { TeamId = "team001", UserGuid = "77777777-7777-7777-7777-777777777777", IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(6) },
        new() { TeamId = "team001", UserGuid = "88888888-8888-8888-8888-888888888888", IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(3) },
        new() { TeamId = "team001", UserGuid = "99999999-9999-9999-9999-999999999999", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(90) },
        new() { TeamId = "team001", UserGuid = "cccccccc-cccc-cccc-cccc-cccccccccccc", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(20) },    // expiring soon (orange)
        new() { TeamId = "team004", UserGuid = "44444444-4444-4444-4444-444444444444", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(1) },        // almost expiring
        new() { TeamId = "team006", UserGuid = "55555555-5555-5555-5555-555555555555", IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(2) },
        new() { TeamId = "team006", UserGuid = "66666666-6666-6666-6666-666666666666", IsMember = true, MemberUntilUtc = TodayUtc.AddMonths(6) },
        new() { TeamId = "team005", UserGuid = "77777777-7777-7777-7777-777777777777", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(120) },
        new() { TeamId = "team003", UserGuid = "88888888-8888-8888-8888-888888888888", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(7) },                // almost expiring
        new() { TeamId = "team009", UserGuid = "99999999-9999-9999-9999-999999999999", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(180) },

        // Expired memberships (for demo/testing)
        new() { TeamId = "team006", UserGuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(-3) },
        new() { TeamId = "team005", UserGuid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", IsMember = true, MemberUntilUtc = TodayUtc.AddDays(-30) },
    };
}

