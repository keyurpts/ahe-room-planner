using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class BenchtopColourConfiguration
    : IEntityTypeConfiguration<BenchtopColour>
{
    public void Configure(EntityTypeBuilder<BenchtopColour> builder)
    {
        builder.ToTable("BenchtopColours");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedNever();

        builder.Property(x => x.BenchtopColourName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.AssetPath)
            .IsRequired(false);

        builder.Property(x => x.BenchtopColourMetadata)
            .HasColumnType("jsonb");

        builder.Property(x => x.IsActive)
            .HasDefaultValue(true);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        builder.Property(x => x.DeletedAt)
            .IsRequired(false);

        // Region Relationship (Many-to-Many)
        builder.HasMany(x => x.Regions)
            .WithMany(x => x.BenchtopColours)
            .UsingEntity<Dictionary<string, object>>(
                "benchtop_colour_regions",
                right => right
                    .HasOne<Region>()
                    .WithMany()
                    .HasForeignKey("RegionId")
                    .OnDelete(DeleteBehavior.Restrict),
                left => left
                    .HasOne<BenchtopColour>()
                    .WithMany()
                    .HasForeignKey("BenchtopColourId")
                    .OnDelete(DeleteBehavior.Cascade),
                join =>
                {
                    join.ToTable("benchtop_colour_regions");
                    join.HasKey("BenchtopColourId", "RegionId");
                });
    }
}