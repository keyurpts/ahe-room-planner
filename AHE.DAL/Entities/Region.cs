using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Entities
{
    public class Region
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string Code { get; set; } = null!;

        public string? Description { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation
        public ICollection<User> Users { get; set; } = new List<User>();

        public ICollection<Project> Projects { get; set; } = new List<Project>();

        public ICollection<ModelVariantRegion> ModelVariantRegions { get; set; }
          = new List<ModelVariantRegion>();
    }
}
