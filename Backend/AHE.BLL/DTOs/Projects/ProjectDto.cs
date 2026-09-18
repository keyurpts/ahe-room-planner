using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Projects
{
    
     public class ProjectDto
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
     }
    
}
