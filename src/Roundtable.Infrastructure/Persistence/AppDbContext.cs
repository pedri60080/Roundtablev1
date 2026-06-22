using Microsoft.EntityFrameworkCore;
using Roundtable.Domain.Entities;

namespace Roundtable.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<Organisation> Organisations => Set<Organisation>();
    public DbSet<MeetingTopic> MeetingTopics => Set<MeetingTopic>();
    public DbSet<TopicMinuteNote> TopicMinuteNotes => Set<TopicMinuteNote>();
    public DbSet<User> Users => Set<User>();
    public DbSet<TeamUser> TeamUsers => Set<TeamUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Team>(e =>
        {
            e.ToTable("Teams");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(128);
            e.Property(x => x.Name).IsRequired().HasMaxLength(256);
            e.Property(x => x.Icon).IsRequired().HasMaxLength(64);
            e.Property(x => x.Abbreviation).IsRequired().HasMaxLength(32);
            e.HasIndex(x => x.Abbreviation).IsUnique();
            e.Property(x => x.MembersCanCreateMeetings).HasDefaultValue(false);
            e.Property(x => x.MembersCanCreateTopics).HasDefaultValue(false);
        });
        modelBuilder.Entity<Meeting>(e =>
        {
            e.ToTable("Meetings");
            e.HasKey(x => x.Id);
            e.Property(x => x.TeamId).IsRequired().HasMaxLength(128);
            e.Property(x => x.Status).IsRequired().HasMaxLength(32);
            e.Property(x => x.Title).HasMaxLength(256);
            e.Property(x => x.Notes).HasMaxLength(2000);
        });
        modelBuilder.Entity<Organisation>(e =>
        {
            e.ToTable("Organisations");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(256);
        });
        modelBuilder.Entity<MeetingTopic>(e =>
        {
            e.ToTable("MeetingTopics");
            e.HasKey(x => x.Id);
            e.Property(x => x.DisplayNumber).IsRequired();
            e.HasIndex(x => x.DisplayNumber).IsUnique();
            e.Property(x => x.Title).IsRequired().HasMaxLength(512);
            e.Property(x => x.Tags).HasMaxLength(500);
            e.Property(x => x.Notes).HasMaxLength(4000);
            e.Property(x => x.ReferenceDocumentsJson).HasMaxLength(2000);
            e.Property(x => x.CreatedByUserGuid).IsRequired().HasMaxLength(64);
            e.Property(x => x.CreatedByOrganisation).HasMaxLength(128);
            e.Property(x => x.IsDeleted).HasDefaultValue(false);
            e.Property(x => x.DeletedByOrganisation).HasMaxLength(128);
            e.HasOne<Meeting>().WithMany().HasForeignKey(x => x.MeetingId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Organisation>().WithMany().HasForeignKey(x => x.OrganisationId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TopicMinuteNote>(e =>
        {
            e.ToTable("TopicMinuteNotes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Body).IsRequired().HasMaxLength(4000);
            e.HasIndex(x => x.MeetingTopicId).IsUnique();
            e.HasOne<MeetingTopic>().WithMany().HasForeignKey(x => x.MeetingTopicId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.Guid);
            e.Property(x => x.Guid).HasMaxLength(64);
            e.Property(x => x.UserName).IsRequired().HasMaxLength(128);
            e.Property(x => x.DisplayName).HasMaxLength(128);
            e.Property(x => x.Organisation).HasMaxLength(128);
            e.Property(x => x.LastLoginAtUtc);
            e.HasIndex(x => x.UserName).IsUnique();
        });

        modelBuilder.Entity<TeamUser>(e =>
        {
            e.ToTable("TeamUsers");
            e.HasKey(x => new { x.TeamId, x.UserGuid });
            e.Property(x => x.TeamId).HasMaxLength(128);
            e.Property(x => x.UserGuid).HasMaxLength(64);
            e.HasOne<Team>().WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserGuid).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
