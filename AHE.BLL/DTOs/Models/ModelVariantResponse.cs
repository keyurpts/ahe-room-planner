using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Models
{
    public class ModelVariantResponse
    {
        public Guid ModelId { get; set; }

        public Guid TextureId { get; set; }

        public string SkuNumber { get; set; } = null!;

        public string? ThumbnailPath { get; set; }

        public List<ModelVariantRegionResponse> Regions { get; set; }
            = new();
    }
}
