using Roundtable.Domain.Entities;

namespace Roundtable.Infrastructure.Seed;

public static class OrganisationsSeed
{
    public static readonly Organisation[] Data =
    {
        new() { Name = "Walt Disney Studios" },
        new() { Name = "Warner Bros. Pictures" },
        new() { Name = "Universal Pictures" },
        new() { Name = "Pixar Animation Studios" },
        new() { Name = "Sony Pictures" },
        new() { Name = "Nintendo" },
        new() { Name = "Electronic Arts" },
        new() { Name = "Ubisoft" },
        new() { Name = "Activision Blizzard" },
        new() { Name = "Square Enix" },
    };
}
