using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Textures
{
    public class UpdateTextureRequest
    {
        public string TextureName { get; set; } = null!;

        public string TexturePath { get; set; } = null!;

        public string? ThumbnailPath { get; set; }

        public JsonDocument? TextureMetadata { get; set; }

        public bool IsActive { get; set; }
    }
}
