using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.DAL.Entities
{
    public class Texture
    {
        public Guid Id { get; set; }

        public string TextureName { get; set; } = null!;

        public string TexturePath { get; set; } = null!;

        public JsonDocument? TextureMetadata { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }


        // Navigation Property
        public ICollection<ModelVariant> ModelTextures { get; set; }
          = new List<ModelVariant>();
    }
}
