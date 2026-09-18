using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Projects
{
    public class ProjectResponse
    {
        public Guid Id { get; set; }

        public string ProjectName { get; set; } = null!;

        public Guid UserId { get; set; }

        public Guid RegionId { get; set; }

        public string Status { get; set; } = null;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
