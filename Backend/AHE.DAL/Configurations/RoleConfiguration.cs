//using AHE.DAL.Entities;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.EntityFrameworkCore.Metadata.Builders;

//namespace AHE.DAL.Configurations;

//public class RoleConfiguration : IEntityTypeConfiguration<Role>
//{
//    public void Configure(EntityTypeBuilder<Role> builder)
//    {
//        builder.ToTable("roles");

//        // Primary Key
//        builder.HasKey(x => x.Id);

//        builder.Property(x => x.Id)
//            .ValueGeneratedOnAdd();

//        // Properties
//        builder.Property(x => x.Name)
//            .HasMaxLength(50)
//            .IsRequired();

//        builder.Property(x => x.Description)
//            .HasMaxLength(255);

//        builder.Property(x => x.CreatedAt)
//            .IsRequired();

//        builder.Property(x => x.UpdatedAt)
//            .IsRequired();

//        // Unique constraint
//        builder.HasIndex(x => x.Name)
//            .IsUnique();
//    }
//}


// ///////////////////////////////////////////////////////////////

using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AHE.DAL.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    // Fixed IDs for seeded roles
    public static readonly Guid AdminRoleId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    public static readonly Guid UserRoleId =
        Guid.Parse("22222222-2222-2222-2222-222222222222");

    // Fixed date for seed data
    private static readonly DateTime SeedDate =
        new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");

        // Primary Key
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(x => x.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(255);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        // Unique constraint
        builder.HasIndex(x => x.Name)
            .IsUnique();

        // Seed roles
        builder.HasData(
            new Role
            {
                Id = AdminRoleId,
                Name = "Admin",
                Description = "System administrator",
                CreatedAt = SeedDate,
                UpdatedAt = SeedDate
            },
            new Role
            {
                Id = UserRoleId,
                Name = "User",
                Description = "Standard application user",
                CreatedAt = SeedDate,
                UpdatedAt = SeedDate
            }
        );
    }
}