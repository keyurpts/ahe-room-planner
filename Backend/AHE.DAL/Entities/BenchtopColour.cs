using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.DAL.Entities
{
    public class BenchtopColour
    {
        public Guid Id { get; set; }

        public string BenchtopColourName { get; set; } = null!;

        public string? AssetPath { get; set; }

        public JsonDocument? BenchtopColourMetadata { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        // Navigation Property (Many-to-Many)
        public ICollection<Region> Regions { get; set; } = new List<Region>();
    }
}
