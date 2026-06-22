using Roundtable.Application.Services;

namespace Roundtable.Backend.Services;

public sealed class DemoSeedDataFilePath : IDemoSeedDataFilePath
{
    public string FullPath { get; }

    public DemoSeedDataFilePath(string fullPath)
    {
        FullPath = fullPath;
    }
}
