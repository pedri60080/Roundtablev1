namespace Roundtable.Application.Services;

/// <summary>Absolute path to <c>DemoSeedData.json</c> (typically under Backend <c>App_Data</c>).</summary>
public interface IDemoSeedDataFilePath
{
    string FullPath { get; }
}
