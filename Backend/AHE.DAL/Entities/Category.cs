using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Entities
{
    public class Category
    {
        public Guid Id { get; set; }

        public string CategoryName { get; set; } = null!;

        public string? Description { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }


        // Navigation Properties

        public ICollection<Model> Models { get; set; }
            = new List<Model>();

        public ICollection<Material> Materials { get; set; }
            = new List<Material>();
    }
}
