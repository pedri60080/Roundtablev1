using Roundtable.Domain.Entities;

namespace Roundtable.Infrastructure.Seed;

public static class TeamsSeed
{
    public static readonly Team[] Data =
    {
        new() { Id = "team001", Name = "Inglorious Basterds", Icon = "military_tech", Authorized = true, Abbreviation = "IB", IsMembersOnly = true, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
        new() { Id = "team002", Name = "The Dirty Dozen", Icon = "groups", Authorized = true, Abbreviation = "DD", IsMembersOnly = false, MembersCanCreateMeetings = true, MembersCanCreateTopics = true },
        new() { Id = "team003", Name = "The Daltons", Icon = "train", Authorized = true, Abbreviation = "DAL", IsMembersOnly = false, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
        new() { Id = "team004", Name = "The Magnificent Seven", Icon = "star", Authorized = true, Abbreviation = "MS", IsMembersOnly = false, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
        new() { Id = "team005", Name = "The A-Team", Icon = "directions_car", Authorized = true, Abbreviation = "AT", IsMembersOnly = false, MembersCanCreateMeetings = false, MembersCanCreateTopics = true },
        new() { Id = "team006", Name = "Ocean's Eleven", Icon = "casino", Authorized = true, Abbreviation = "OE", IsMembersOnly = false, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
        new() { Id = "team007", Name = "The Expendables", Icon = "sports_martial_arts", Authorized = true, Abbreviation = "EXP", IsMembersOnly = false, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
        new() { Id = "team008", Name = "The Losers", Icon = "group_off", Authorized = false, Abbreviation = "LOS", IsMembersOnly = false, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
        new() { Id = "team009", Name = "Suicide Squad", Icon = "warning", Authorized = false, Abbreviation = "SS", IsMembersOnly = true, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
        new() { Id = "team010", Name = "The League of Extraordinary Gentlemen", Icon = "auto_stories", Authorized = false, Abbreviation = "LOEG", IsMembersOnly = false, MembersCanCreateMeetings = false, MembersCanCreateTopics = false },
    };
}
