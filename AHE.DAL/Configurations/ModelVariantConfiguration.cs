using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Configurations
{
    public class ModelVariantConfiguration
    : IEntityTypeConfiguration<ModelVariant>
    {
        public void Configure(EntityTypeBuilder<ModelVariant> builder)
        {
            builder.ToTable("model_variants");

            // Composite Primary Key
            builder.HasKey(x => new
            {
                x.ModelId,
                x.TextureId
            });

            // Model relationship
            builder.HasOne(x => x.Model)
                .WithMany(x => x.ModelTextures)
                .HasForeignKey(x => x.ModelId)
                .OnDelete(DeleteBehavior.Cascade);

            // Texture relationship
            builder.HasOne(x => x.Texture)
                .WithMany(x => x.ModelTextures)
                .HasForeignKey(x => x.TextureId)
                .OnDelete(DeleteBehavior.Cascade);

            // Optional indexes
            builder.HasIndex(x => x.TextureId);
        }
    }
}
