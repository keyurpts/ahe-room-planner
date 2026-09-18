using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AHE.DAL.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");

        // Primary Key
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(x => x.ProjectName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.Project2DJson)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(x => x.Project3DJson)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(x => x.ProjectMetadata)
            .HasColumnType("jsonb");

        builder.Property(x => x.Status)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        builder.Property(x => x.DeletedAt);

        // User relationship
        builder.HasOne(x => x.User)
            .WithMany(x => x.Projects)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Region relationship
        builder.HasOne(x => x.Region)
            .WithMany(x => x.Projects)
            .HasForeignKey(x => x.RegionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.UserId);

        builder.HasIndex(x => x.RegionId);
    }
}