using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Materials
{
    public class CreateMaterialRequest
    {

        public string MaterialName { get; set; } = null!;

        public string? MaterialPath { get; set; }

        public string? ThumbnailPath { get; set; }

        public JsonDocument? MaterialMetadata { get; set; }
    }
}
