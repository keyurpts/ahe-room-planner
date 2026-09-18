using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AHE.DAL.Configurations
{
    public class ModelVariantRegionConfiguration
        : IEntityTypeConfiguration<ModelVariantRegion>
    {
        public void Configure(EntityTypeBuilder<ModelVariantRegion> builder)
        {
            builder.ToTable("model_variant_regions");

            // Primary Key
            builder.HasKey(x => x.Id);

            // Item Number
            builder.Property(x => x.ItemNumber)
                .HasMaxLength(100)
                .IsRequired();

            // Price
            builder.Property(x => x.Price)
                .HasPrecision(18, 2)
                .IsRequired();

            // Status
            builder.Property(x => x.IsActive)
                .IsRequired();

            // Dates
            builder.Property(x => x.CreatedAt)
                .IsRequired();

            builder.Property(x => x.UpdatedAt)
                .IsRequired();

            // -----------------------------------------
            // ModelVariant -> ModelVariantRegions
            // -----------------------------------------
            builder.HasOne(x => x.ModelVariant)
                .WithMany(x => x.ModelVariantRegions)
                .HasForeignKey(x => new
                {
                    x.ModelId,
                    x.TextureId
                })
                .HasPrincipalKey(x => new
                {
                    x.ModelId,
                    x.TextureId
                })
                .OnDelete(DeleteBehavior.Cascade);

            // -----------------------------------------
            // Region -> ModelVariantRegions
            // -----------------------------------------
            builder.HasOne(x => x.Region)
                .WithMany(x => x.ModelVariantRegions)
                .HasForeignKey(x => x.RegionId)
                .OnDelete(DeleteBehavior.Restrict);

            // -----------------------------------------
            // A Model + Texture can only exist
            // once per Region
            // -----------------------------------------
            builder.HasIndex(x => new
            {
                x.ModelId,
                x.TextureId,
                x.RegionId
            })
            .IsUnique();

            // -----------------------------------------
            // ItemNumber unique inside a Region
            // -----------------------------------------
            builder.HasIndex(x => new
            {
                x.RegionId,
                x.ItemNumber
            })
            .IsUnique();
        }
    }
}