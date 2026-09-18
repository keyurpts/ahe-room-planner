using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.DAL.Entities
{
    public class Material
    {
        public Guid Id { get; set; }

        public string MaterialName { get; set; } = null!;

        public string? MaterialPath { get; set; }

        public string? ThumbnailPath { get; set; }

        public JsonDocument? MaterialMetadata { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }


        // Navigation Property

        public Category Category { get; set; } = null!;
    }
}
