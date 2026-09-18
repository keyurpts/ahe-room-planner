using AHE.BLL.DTOs.Storage;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IStorageService
    {
        Task<bool> TestConnectionAsync(
            CancellationToken cancellationToken = default);

        Task<string> UploadAsync(
            Stream stream,
            string fileName,
            string contentType,
            CancellationToken cancellationToken = default);

        Task<Stream?> DownloadAsync(
            string fileName,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            string fileName,
            CancellationToken cancellationToken = default);

        Task<ModelUploadUrlResponse> GenerateUploadUrlAsync(
            Guid modelId,
            CancellationToken cancellationToken = default);

        Task<ModelDownloadUrlResponse> GenerateDownloadUrlAsync(
            Guid modelId,
            CancellationToken cancellationToken = default);

        Task<VariantThumbnailUploadUrlResponse> GenerateThumbnailUploadUrlAsync(
            Guid modelId,
            Guid textureId,
            string? fileNameOrExtension = null,
            CancellationToken cancellationToken = default);

        Task<ThumbnailDownloadUrlResponse> GenerateThumbnailDownloadUrlAsync(
            Guid categoryId,
            Guid modelId,
            Guid textureId,
            CancellationToken cancellationToken = default);

        Task<string> UploadVariantThumbnailAsync(
            Guid modelId,
            Guid textureId,
            Stream stream,
            string fileName,
            string contentType,
            CancellationToken cancellationToken = default);

        Task<UploadUrlResponse> GenerateTextureUploadUrlAsync(
            Guid textureId,
            string textureName,
            CancellationToken cancellationToken = default);

        Task<TextureDownloadUrlResponse> GenerateTextureDownloadUrlAsync(
           Guid textureId);
    }
}
