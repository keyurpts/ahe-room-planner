using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Entities
{
    public class ModelVariantRegion
    {
        public Guid Id { get; set; }

        public Guid ModelId { get; set; }

        public Guid TextureId { get; set; }

        public Guid RegionId { get; set; }

        public string ItemNumber { get; set; } = null!;

        public decimal Price { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public ModelVariant ModelVariant { get; set; } = null!;

        public Region Region { get; set; } = null!;
    }
}
