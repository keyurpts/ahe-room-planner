using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Entities
{
    public class ModelVariant
    {
        public Guid Id { get; set; }

        public Guid ModelId { get; set; }

        public Guid TextureId { get; set; }

        public string SkuNumber { get; set; } = null!;

        public string? ThumbnailPath { get; set; }

        // Navigation properties
        public Model Model { get; set; } = null!;

        public Texture Texture { get; set; } = null!;

        public ICollection<ModelVariantRegion> ModelVariantRegions { get; set; }
          = new List<ModelVariantRegion>();

    }
}
