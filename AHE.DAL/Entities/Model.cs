using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.DAL.Entities
{
    public class Model
    {
        public Guid Id { get; set; }

        public Guid CategoryId { get; set; }

        public string ModelName { get; set; } = null!;

        public string ModelPath { get; set; } = null!;

        public string? Description { get; set; }

        public JsonDocument? ModelMetadata { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }


        // Navigation Property

        public Category Category { get; set; } = null!;

        public ICollection<ModelVariantRegion> ModelRegions { get; set; }
          = new List<ModelVariantRegion>();

        public ICollection<ModelVariant> ModelTextures { get; set; }
          = new List<ModelVariant>();
    }
}
