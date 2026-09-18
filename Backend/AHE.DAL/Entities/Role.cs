using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Entities
{
    public class Role
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
