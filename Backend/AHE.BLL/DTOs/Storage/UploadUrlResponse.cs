using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Storage
{
    public class UploadUrlResponse
    {
        public string BlobPath { get; set; } = null!;

        public string UploadUrl { get; set; } = null!;

        public DateTimeOffset ExpiresAt { get; set; }
    }
}
