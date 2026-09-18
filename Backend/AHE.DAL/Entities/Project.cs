using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.DAL.Entities
{
    public class Project
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public Guid RegionId { get; set; }

        public string ProjectName { get; set; } = null!;

        public JsonDocument Project2DJson { get; set; } = null!;

        public JsonDocument Project3DJson { get; set; } = null!;

        public JsonDocument? ProjectMetadata { get; set; }

        public string Status { get; set; } = null!;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;

        public Region Region { get; set; } = null!;
    }
}
