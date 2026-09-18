using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Textures
{
    public class CreateTextureRequest
    {
        public string TextureName { get; set; } = null!;

        public bool HasTextureImage { get; set; }

        public JsonDocument? TextureMetadata { get; set; }
    }
}
