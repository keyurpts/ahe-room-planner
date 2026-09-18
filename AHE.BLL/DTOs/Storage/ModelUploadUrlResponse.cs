using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Storage
{
    public class ModelUploadUrlResponse
    {
        public Guid ModelId { get; set; }

        public string BlobPath { get; set; } = null!;

        public string UploadUrl { get; set; } = null!;

        public DateTimeOffset ExpiresAt { get; set; }
    }
}
