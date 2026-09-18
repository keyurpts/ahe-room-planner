using System;

namespace AHE.BLL.DTOs.Storage;

public class ThumbnailDownloadUrlResponse
{
    public Guid CategoryId { get; set; }

    public Guid ModelId { get; set; }

    public Guid TextureId { get; set; }

    public string BlobPath { get; set; } = null!;

    public string DownloadUrl { get; set; } = null!;

    public DateTimeOffset ExpiresAt { get; set; }
}
