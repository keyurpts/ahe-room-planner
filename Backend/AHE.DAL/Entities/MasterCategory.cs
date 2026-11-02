using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Entities
{
    public class MasterCategory
    {
        public Guid Id { get; set; }

        public string MasterCategoryName { get; set; } = null!;

        public string? Description { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }


        // Navigation Properties

        public ICollection<Category> Category { get; set; }
            = new List<Category>();
    }
}
