using AHE.BLL.DTOs.Storage;
using AHE.BLL.Interfaces;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Entities;
using AHE.DAL.Repositories;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services
{
    public class StorageService : IStorageService
    {
        private readonly IBlobStorageRepository _blobStorageRepository;
        private readonly IModelRepository _modelRepository;
        private readonly ITextureRepository _textureRepository;
        private readonly int _sasExpiryMinutes;

        public StorageService(
            IBlobStorageRepository blobStorageRepository,
            IConfiguration configuration,
            IModelRepository modelRepository,
            ITextureRepository textureRepository)
        {
            _blobStorageRepository = blobStorageRepository;
            _modelRepository = modelRepository;
            _textureRepository = textureRepository;

            _sasExpiryMinutes =
            configuration.GetValue<int>(
                "AzureStorage:SasExpiryMinutes");

            if (_sasExpiryMinutes <= 0)
            {
                _sasExpiryMinutes = 15;
            }
        }

        public async Task<bool> TestConnectionAsync(
            CancellationToken cancellationToken = default)
        {
            return await _blobStorageRepository
                .TestConnectionAsync(cancellationToken);
        }

        public async Task<string> UploadAsync(
            Stream stream,
            string fileName,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (stream == null || stream.Length == 0)
                throw new ArgumentException("File cannot be empty.");

            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name is required.");

            return await _blobStorageRepository.UploadAsync(
                stream,
                fileName,
                contentType,
                cancellationToken);
        }

        public async Task<Stream?> DownloadAsync(
            string fileName,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name is required.");

            return await _blobStorageRepository.DownloadAsync(
                fileName,
                cancellationToken);
        }

        public async Task<bool> DeleteAsync(
            string fileName,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name is required.");

            return await _blobStorageRepository.DeleteAsync(
                fileName,
                cancellationToken);
        }

        public async Task<ModelUploadUrlResponse> GenerateUploadUrlAsync(
        Guid modelId,
        CancellationToken cancellationToken = default)
        {
            //var model =
            //    await _modelRepository.GetByIdAsync(
            //        modelId,
            //        cancellationToken);

            var model = await _modelRepository.GetByIdAsync(modelId);

            if (model == null)
            {
                throw new KeyNotFoundException(
                    $"Model with ID '{modelId}' was not found.");
            }

            if (!model.IsActive)
            {
                throw new InvalidOperationException(
                    "The model is not active.");
            }

            var blobPath = BuildModelPath(model);

            const string contentType = "model/gltf-binary";

            var expiresAt =
                DateTimeOffset.UtcNow.AddMinutes(
                    _sasExpiryMinutes);

            var uploadUrl =
                _blobStorageRepository.GenerateUploadSasUrl(
                    blobPath,
                    contentType,
                    _sasExpiryMinutes);

            // Store the path in PostgreSQL.
            model.ModelPath = blobPath;
            model.UpdatedAt = DateTime.UtcNow;

            await _modelRepository.UpdateAsync(
                model);

            return new ModelUploadUrlResponse
            {
                ModelId = model.Id,
                BlobPath = blobPath,
                UploadUrl = uploadUrl.ToString(),
                ExpiresAt = expiresAt
            };
        }

        public async Task<ModelDownloadUrlResponse> GenerateDownloadUrlAsync(
            Guid modelId,
            CancellationToken cancellationToken = default)
        {
            var model =
                await _modelRepository.GetByIdAsync(
                    modelId);

            if (model == null)
            {
                throw new KeyNotFoundException(
                    $"Model with ID '{modelId}' was not found.");
            }

            if (!model.IsActive)
            {
                throw new InvalidOperationException(
                    "The model is not active.");
            }

            if (string.IsNullOrWhiteSpace(model.ModelPath))
            {
                throw new InvalidOperationException(
                    "Model does not have an uploaded asset.");
            }

            var expiresAt =
                DateTimeOffset.UtcNow.AddMinutes(
                    _sasExpiryMinutes);

            var downloadUrl =
                _blobStorageRepository.GenerateDownloadSasUrl(
                    model.ModelPath,
                    _sasExpiryMinutes);

            return new ModelDownloadUrlResponse
            {
                ModelId = model.Id,
                BlobPath = model.ModelPath,
                DownloadUrl = downloadUrl.ToString(),
                ExpiresAt = expiresAt
            };
        }

        public async Task<VariantThumbnailUploadUrlResponse> GenerateThumbnailUploadUrlAsync(
            Guid modelId,
            Guid textureId,
            string? fileNameOrExtension = null,
            CancellationToken cancellationToken = default)
        {
            var model = await _modelRepository.GetByIdAsync(modelId);

            if (model == null)
            {
                throw new KeyNotFoundException(
                    $"Model with ID '{modelId}' was not found.");
            }

            if (!model.IsActive)
            {
                throw new InvalidOperationException(
                    "The model is not active.");
            }

            var variant = model.ModelTextures.FirstOrDefault(v => v.TextureId == textureId);

            if (variant == null)
            {
                throw new KeyNotFoundException(
                    $"Variant with Texture ID '{textureId}' for Model '{modelId}' was not found.");
            }

            var blobPath = BuildThumbnailPath(
                model.CategoryId,
                model.Id,
                textureId,
                fileNameOrExtension ?? variant.ThumbnailPath);

            var contentType = GetImageContentType(blobPath);

            var expiresAt =
                DateTimeOffset.UtcNow.AddMinutes(
                    _sasExpiryMinutes);

            var uploadUrl =
                _blobStorageRepository.GenerateUploadSasUrl(
                    blobPath,
                    contentType,
                    _sasExpiryMinutes);

            variant.ThumbnailPath = blobPath;
            model.UpdatedAt = DateTime.UtcNow;

            await _modelRepository.UpdateAsync(model);

            return new VariantThumbnailUploadUrlResponse
            {
                ModelId = model.Id,
                TextureId = textureId,
                BlobPath = blobPath,
                UploadUrl = uploadUrl.ToString(),
                ExpiresAt = expiresAt
            };
        }

        public async Task<ThumbnailDownloadUrlResponse> GenerateThumbnailDownloadUrlAsync(
            Guid categoryId,
            Guid modelId,
            Guid textureId,
            CancellationToken cancellationToken = default)
        {
            var model = await _modelRepository.GetByIdAsync(modelId);
            string blobPath;

            if (model != null)
            {
                var variant = model.ModelTextures?.FirstOrDefault(v => v.TextureId == textureId);
                if (variant != null && !string.IsNullOrWhiteSpace(variant.ThumbnailPath))
                {
                    blobPath = variant.ThumbnailPath;
                }
                else
                {
                    var catId = categoryId != Guid.Empty ? categoryId : model.CategoryId;
                    blobPath = BuildThumbnailPath(catId, modelId, textureId);
                }
            }
            else
            {
                blobPath = BuildThumbnailPath(categoryId, modelId, textureId);
            }

            var expiresAt =
                DateTimeOffset.UtcNow.AddMinutes(
                    _sasExpiryMinutes);

            var downloadUrl =
                _blobStorageRepository.GenerateDownloadSasUrl(
                    blobPath,
                    _sasExpiryMinutes);

            return new ThumbnailDownloadUrlResponse
            {
                CategoryId = categoryId != Guid.Empty ? categoryId : (model?.CategoryId ?? Guid.Empty),
                ModelId = modelId,
                TextureId = textureId,
                BlobPath = blobPath,
                DownloadUrl = downloadUrl.ToString(),
                ExpiresAt = expiresAt
            };
        }

        public async Task<string> UploadVariantThumbnailAsync(
            Guid modelId,
            Guid textureId,
            Stream stream,
            string fileName,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (stream == null || stream.Length == 0)
                throw new ArgumentException("File cannot be empty.");

            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name is required.");

            var model = await _modelRepository.GetByIdAsync(modelId);

            if (model == null)
            {
                throw new KeyNotFoundException(
                    $"Model with ID '{modelId}' was not found.");
            }

            var variant = model.ModelTextures.FirstOrDefault(v => v.TextureId == textureId);

            if (variant == null)
            {
                throw new KeyNotFoundException(
                    $"Variant with Texture ID '{textureId}' for Model '{modelId}' was not found.");
            }

            var blobPath = BuildThumbnailPath(
                model.CategoryId,
                model.Id,
                textureId,
                fileName);

            var blobUrl = await _blobStorageRepository.UploadAsync(
                stream,
                blobPath,
                contentType,
                cancellationToken);

            variant.ThumbnailPath = blobPath;
            model.UpdatedAt = DateTime.UtcNow;

            await _modelRepository.UpdateAsync(model);

            return blobUrl;
        }

        public static string BuildThumbnailPath(
            Guid categoryId,
            Guid modelId,
            Guid textureId,
            string? fileNameOrExtension = null)
        {
            var extension = "webp";

            if (!string.IsNullOrWhiteSpace(fileNameOrExtension))
            {
                var trimmed = fileNameOrExtension.Trim();
                var ext = Path.GetExtension(trimmed);

                if (!string.IsNullOrWhiteSpace(ext))
                {
                    extension = ext.TrimStart('.');
                }
                else if (!trimmed.Contains('.'))
                {
                    extension = trimmed.TrimStart('.');
                }
            }

            return $"thumbnails/{categoryId}/{modelId}/{textureId}/thumbnail.{extension}";
        }

        private static string GetImageContentType(string path)
        {
            var ext = Path.GetExtension(path).ToLowerInvariant();
            return ext switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                _ => "image/webp"
            };
        }

        private static string BuildModelPath(Model model)
        {
            var categoryId = model.CategoryId.ToString();
            var modelId = model.Id.ToString();

            var modelName =
                model.ModelName
                    .Trim()
                    .Replace("/", "_")
                    .Replace("\\", "_");

            return
                $"models/{categoryId}/{modelId}/{modelName}/model.glb";
        }

        public async Task<UploadUrlResponse> GenerateTextureUploadUrlAsync(
          Guid textureId,
          string textureName,
          CancellationToken cancellationToken = default)
        {
            var sanitizedName = textureName.Trim();

            var blobPath =
                $"textures/{sanitizedName}/textureImage";

            var uploadUrl =
                _blobStorageRepository.GenerateUploadSasUrl(
                    blobPath,
                    "image/*",
                    60);

            return new UploadUrlResponse
            {
                BlobPath = blobPath,
                UploadUrl = uploadUrl.ToString(),
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(60)
            };
        }

        public async Task<TextureDownloadUrlResponse> GenerateTextureDownloadUrlAsync(
           Guid textureId)
        {
            if (textureId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Texture ID is required.");
            }

            var texture =
                await _textureRepository.GetByIdAsync(textureId);

            if (texture == null)
            {
                throw new KeyNotFoundException(
                    "Texture not found.");
            }

            if (string.IsNullOrWhiteSpace(texture.TexturePath))
            {
                return new TextureDownloadUrlResponse
                {
                    TextureId = texture.Id,

                    TextureName = texture.TextureName,

                    DownloadUrl = null,
                };
            }

            var expiryMinutes = 60;

            Uri downloadUri =
                _blobStorageRepository.GenerateDownloadSasUrl(
                    texture.TexturePath,
                    expiryMinutes);

            return new TextureDownloadUrlResponse
            {
                TextureId = texture.Id,

                TextureName = texture.TextureName,

                DownloadUrl = downloadUri.ToString(),
            };
        }

    }
}

