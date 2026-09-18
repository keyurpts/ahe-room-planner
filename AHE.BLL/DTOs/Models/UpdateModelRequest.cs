using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Models
{
    public class UpdateModelRequest
    {
        public Guid CategoryId { get; set; }

        public string ModelName { get; set; } = null!;

        public string ModelPath { get; set; } = null!;

        public string? ModelThumbnailPath { get; set; }

        public JsonDocument? ModelMetadata { get; set; }
    }
}
