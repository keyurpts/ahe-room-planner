using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Storage
{
    public class TextureDownloadUrlResponse
    {
        public Guid TextureId { get; set; }

        public string TextureName { get; set; } = null!;

        public string? DownloadUrl { get; set; }
    }
}
