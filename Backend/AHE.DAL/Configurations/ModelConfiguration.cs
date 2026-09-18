using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AHE.DAL.Configurations;

public class ModelConfiguration : IEntityTypeConfiguration<Model>
{
    public void Configure(EntityTypeBuilder<Model> builder)
    {
        builder.ToTable("models");

        // Primary Key
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(x => x.ModelName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.ModelPath)
            .IsRequired();

        // Description
        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.Property(x => x.ModelMetadata)
            .HasColumnType("jsonb");

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        builder.Property(x => x.DeletedAt);

        // Category relationship
        builder.HasOne(x => x.Category)
            .WithMany(x => x.Models)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index
        builder.HasIndex(x => x.CategoryId);
    }
}