using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Projects
{
    public class CreateProjectRequest
    {
        public string ProjectName { get; set; } = null!;

        public JsonDocument? Project2DJson { get; set; }

        public JsonDocument? Project3DJson { get; set; }

        public JsonDocument? ProjectMetadata { get; set; }
    }
}
