using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Collections.Generic;

namespace AHE.DAL.Configurations;

public class TextureConfiguration
    : IEntityTypeConfiguration<Texture>
{
    public void Configure(EntityTypeBuilder<Texture> builder)
    {
        builder.ToTable("textures");

        // Primary Key
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(x => x.TextureName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.TexturePath)
            .IsRequired(false);

        builder.Property(x => x.TextureMetadata)
            .HasColumnType("jsonb");

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        builder.Property(x => x.DeletedAt);

        // Region Relationship (One-to-Many)
        builder.HasMany(x => x.Regions)
            .WithMany(x => x.Textures)
            .UsingEntity<Dictionary<string, object>>(
                "texture_regions",
                right => right
                    .HasOne<Region>()
                    .WithMany()
                    .HasForeignKey("RegionId")
                    .OnDelete(DeleteBehavior.Restrict),
                left => left
                    .HasOne<Texture>()
                    .WithMany()
                    .HasForeignKey("TextureId")
                    .OnDelete(DeleteBehavior.Cascade),
                join =>
                {
                    join.ToTable("texture_regions");
                    join.HasKey("TextureId", "RegionId");
                });

    }
}