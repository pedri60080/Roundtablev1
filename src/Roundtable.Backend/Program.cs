using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Roundtable.Application;
using Roundtable.Application.Services;
using Roundtable.Infrastructure;
using Roundtable.Infrastructure.Persistence;
using Roundtable.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

var seedPath = builder.Configuration["DemoSeedData:FilePath"]
    ?? Path.Combine(builder.Environment.ContentRootPath, "App_Data", "DemoSeedData.json");
BootstrapDataDirectory(seedPath, builder.Environment.ContentRootPath);

builder.Services.AddSingleton<IDemoSeedDataFilePath>(_ => new DemoSeedDataFilePath(seedPath));

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<ICurrentUser, DevCurrentUser>();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                if (builder.Environment.IsDevelopment())
                {
                    var uri = new Uri(origin);
                    return string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase) || uri.Host == "127.0.0.1";
                }
                return true;
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var seed = scope.ServiceProvider.GetRequiredService<ISeedService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInit");

    await db.Database.EnsureCreatedAsync();

    if (!await IsDatabaseSchemaValidAsync(db))
    {
        logger.LogWarning("Database schema is missing or outdated; recreating and seeding.");
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
        db.ChangeTracker.Clear();
        await seed.RunAsync();
    }
    else if (!await db.Users.AnyAsync())
    {
        logger.LogInformation("Empty database detected; running initial seed.");
        await seed.RunAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseCors();
app.MapControllers();

app.MapGet("/api/config", () => Results.Ok(new { isDevelopment = app.Environment.IsDevelopment() }));

if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();

static async Task<bool> IsDatabaseSchemaValidAsync(AppDbContext db)
{
    try
    {
        await db.Teams.AsNoTracking().Take(1).ToListAsync();
        await db.Users.AsNoTracking().Take(1).ToListAsync();
        await db.Meetings.AsNoTracking().AnyAsync();
        await db.MeetingTopics.AsNoTracking().Take(1).ToListAsync();
        await db.TopicMinuteNotes.AsNoTracking().Take(1).ToListAsync();
        return true;
    }
    catch (SqliteException ex) when (
        ex.Message.Contains("no such table", StringComparison.OrdinalIgnoreCase) ||
        ex.Message.Contains("no such column", StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }
}

static void BootstrapDataDirectory(string seedPath, string contentRootPath)
{
    var dataDir = Path.GetDirectoryName(seedPath);
    if (string.IsNullOrEmpty(dataDir))
        return;

    Directory.CreateDirectory(dataDir);
    Directory.CreateDirectory(Path.Combine(dataDir, "demo-team-icons"));

    if (File.Exists(seedPath))
        return;

    var bundledSeed = Path.Combine(contentRootPath, "App_Data", "DemoSeedData.json");
    if (File.Exists(bundledSeed))
        File.Copy(bundledSeed, seedPath);
}
