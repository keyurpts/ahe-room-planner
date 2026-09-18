using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

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
    }
}