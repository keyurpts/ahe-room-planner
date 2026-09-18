using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Models
{
    public class ModelResponse
    {
        public Guid Id { get; set; }

        public string ModelId { get; set; } = null!;

        public Guid CategoryId { get; set; }

        public string ModelName { get; set; } = null!;

        public string? ModelPath { get; set; }

        public string? Description { get; set; }

        public JsonDocument? ModelMetadata { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public List<ModelVariantResponse> Variants { get; set; }
            = new();
    }
}
