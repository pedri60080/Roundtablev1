using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Roundtable.Application;
using Roundtable.Application.Services;
using Roundtable.Infrastructure;
using Roundtable.Infrastructure.Persistence;
using Roundtable.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IDemoSeedDataFilePath>(_ =>
    new DemoSeedDataFilePath(
        Path.Combine(builder.Environment.ContentRootPath, "App_Data", "DemoSeedData.json")));

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

// SQLite: create tables when the file is new. If the file exists but has no tables,
// EnsureCreated does nothing—then recreate the file, create schema, and seed.
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var seed = scope.ServiceProvider.GetRequiredService<ISeedService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInit");

    await db.Database.EnsureCreatedAsync();

    try
    {
        await db.Users.AsNoTracking().AnyAsync();
    }
    catch (SqliteException ex) when (ex.Message.Contains("no such table", StringComparison.OrdinalIgnoreCase))
    {
        logger.LogWarning(ex, "SQLite database had no tables; recreating and seeding.");
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
        await seed.RunAsync();
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.MapControllers();

app.MapGet("/api/config", () => Results.Ok(new { isDevelopment = app.Environment.IsDevelopment() }));

app.Run();
