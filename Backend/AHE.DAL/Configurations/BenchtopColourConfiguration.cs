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

        // Region Relationship (One-to-Many)
        builder.HasOne(x => x.Region)
            .WithMany(x => x.BenchtopColours)
            .HasForeignKey(x => x.RegionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.RegionId);
    }
}