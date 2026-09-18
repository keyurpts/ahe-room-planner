using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Textures
{
    public class TextureResponse
    {
        public Guid Id { get; set; }

        public string TextureName { get; set; } = null!;

        public string TexturePath { get; set; } = null!;

        public string? ThumbnailPath { get; set; }

        public string? UploadUrl { get; set; }

        public string? BlobPath { get; set; }

        public DateTimeOffset? ExpiresAt { get; set; }

        public JsonDocument? TextureMetadata { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
