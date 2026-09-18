using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AHE.DAL.Configurations;

public class RegionConfiguration : IEntityTypeConfiguration<Region>
{
    // Fixed IDs for seeded regions
    public static readonly Guid AustraliaRegionId =
        Guid.Parse("33333333-3333-3333-3333-333333333333");

    public static readonly Guid PhilippinesRegionId =
        Guid.Parse("44444444-4444-4444-4444-444444444444");

    public static readonly Guid NewZealandRegionId =
        Guid.Parse("55555555-5555-5555-5555-555555555555");

    // Fixed date for seed data
    private static readonly DateTime SeedDate =
        new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public void Configure(EntityTypeBuilder<Region> builder)
    {
        builder.ToTable("regions");

        // Primary Key
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Code)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(255);

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        // Unique constraints
        builder.HasIndex(x => x.Name)
            .IsUnique();

        builder.HasIndex(x => x.Code)
            .IsUnique();

        // Seed regions
        builder.HasData(
            new Region
            {
                Id = AustraliaRegionId,
                Name = "Australia",
                Code = "AUS",
                Description = "Australia region",
                IsActive = true,
                CreatedAt = SeedDate,
                UpdatedAt = SeedDate
            },
            new Region
            {
                Id = PhilippinesRegionId,
                Name = "Philippines",
                Code = "PHL",
                Description = "Philippines region",
                IsActive = true,
                CreatedAt = SeedDate,
                UpdatedAt = SeedDate
            },
            new Region
            {
                Id = NewZealandRegionId,
                Name = "New Zealand",
                Code = "NZL",
                Description = "New Zealand region",
                IsActive = true,
                CreatedAt = SeedDate,
                UpdatedAt = SeedDate
            }
        );
    }
}