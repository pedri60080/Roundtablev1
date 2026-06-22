using Roundtable.Domain.Entities;

namespace Roundtable.Infrastructure.Seed;

public static class UsersSeed
{
    /// <summary>Seed user for first organisation topics (shown as Created by).</summary>
    public const string EwoutUserGuid = "f0e0f0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0";

    /// <summary>Second first-org seed author so not every topic shows the same name.</summary>
    public const string NintendoAltUserGuid = "f1e1f1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1";

    public static readonly User[] Data =
    {
        new()
        {
            Guid = EwoutUserGuid,
            UserName = "ewout",
            DisplayName = "Ewout",
            Organisation = OrganisationsSeed.Data[0].Name,
        },
        new()
        {
            Guid = NintendoAltUserGuid,
            UserName = "nintendo-demo",
            DisplayName = "Alex",
            Organisation = OrganisationsSeed.Data[0].Name,
        },
        new()
        {
            Guid = "11111111-1111-1111-1111-111111111111",
            UserName = "user123",
            DisplayName = "Demo",
            Organisation = OrganisationsSeed.Data[0].Name,
        },
        new()
        {
            Guid = "22222222-2222-2222-2222-222222222222",
            UserName = "user124",
            DisplayName = "Alice",
            Organisation = "Acme Corp",
        },
        new()
        {
            Guid = "33333333-3333-3333-3333-333333333333",
            UserName = "user125",
            DisplayName = "Bob",
            Organisation = "Contoso",
        },
        new()
        {
            Guid = "44444444-4444-4444-4444-444444444444",
            UserName = "user126",
            DisplayName = "Charlie",
            Organisation = "Globex",
        },
        new()
        {
            Guid = "55555555-5555-5555-5555-555555555555",
            UserName = "user127",
            DisplayName = "Dana",
            Organisation = "Initech",
        },
        new()
        {
            Guid = "66666666-6666-6666-6666-666666666666",
            UserName = "user128",
            DisplayName = "Eve",
            Organisation = "Umbrella",
        },
        new()
        {
            Guid = "77777777-7777-7777-7777-777777777777",
            UserName = "user129",
            DisplayName = "Frank",
            Organisation = "Wayne Enterprises",
        },
        new()
        {
            Guid = "88888888-8888-8888-8888-888888888888",
            UserName = "user130",
            DisplayName = "Grace",
            Organisation = "Stark Industries",
        },
        new()
        {
            Guid = "99999999-9999-9999-9999-999999999999",
            UserName = "user131",
            DisplayName = "Heidi",
            Organisation = "Hooli",
        },
        new()
        {
            Guid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            UserName = "user132",
            DisplayName = "Ivan",
            Organisation = "Cyberdyne",
        },
        new()
        {
            Guid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            UserName = "user133",
            DisplayName = "Judy",
            Organisation = "Wonka Industries",
        },
        new()
        {
            Guid = "cccccccc-cccc-cccc-cccc-cccccccccccc",
            UserName = "user134",
            DisplayName = "Mallory",
            Organisation = "Aperture Science",
        },
    };
}

