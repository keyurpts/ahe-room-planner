using System;

namespace AHE.BLL.DTOs.Storage;

public class VariantThumbnailUploadUrlResponse
{
    public Guid ModelId { get; set; }

    public Guid TextureId { get; set; }

    public string BlobPath { get; set; } = null!;

    public string UploadUrl { get; set; } = null!;

    public DateTimeOffset ExpiresAt { get; set; }
}
