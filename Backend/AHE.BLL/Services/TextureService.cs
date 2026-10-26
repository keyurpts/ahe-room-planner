using AHE.BLL.DTOs.Textures;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AHE.BLL.Services;

public class TextureService : ITextureService
{
    private readonly ITextureRepository _textureRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStorageService _storageService;
    private readonly ILogger<TextureService> _logger;


    public TextureService(
        ITextureRepository textureRepository,
        ICategoryRepository categoryRepository,
        IStorageService storageService,
        ILogger<TextureService> logger)
    {
        _textureRepository = textureRepository;
        _categoryRepository = categoryRepository;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<TextureResponse> CreateAsync(
    CreateTextureRequest request)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.TextureName))
        {
            throw new ArgumentException(
                "Texture name is required.",
                nameof(request.TextureName));
        }

        var textureName = request.TextureName.Trim();

        try
        {
            var now = DateTime.UtcNow;

            var texture = new Texture
            {
                Id = Guid.NewGuid(),
                TextureName = textureName,

                TexturePath = request.HasTextureImage
                    ? $"textures/{textureName}/"
                    : null,

                TextureMetadata = request.TextureMetadata,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
                DeletedAt = null
            };

            // 1. Save the texture record.
            var createdTexture =
                await _textureRepository.AddAsync(texture);

            if (createdTexture is null)
            {
                throw new InvalidOperationException(
                    "The texture could not be created.");
            }

            // 2. Generate the upload URL if an image is required.
            if (request.HasTextureImage)
            {
                var uploadResponse =
                    await _storageService.GenerateTextureUploadUrlAsync(
                        createdTexture.Id,
                        createdTexture.TextureName);

                if (uploadResponse is null)
                {
                    throw new InvalidOperationException(
                        "Failed to generate the texture upload URL.");
                }

                // 3. Store the actual blob path.
                createdTexture.TexturePath =
                    uploadResponse.BlobPath;

                createdTexture.UpdatedAt = DateTime.UtcNow;

                await _textureRepository.UpdateAsync(createdTexture);

                // 4. Return upload details.
                var response = MapToResponse(createdTexture);

                response.UploadUrl = uploadResponse.UploadUrl;
                response.BlobPath = uploadResponse.BlobPath;
                response.ExpiresAt = uploadResponse.ExpiresAt;

                return response;
            }

            // Texture does not have an image.
            return MapToResponse(createdTexture);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating texture {TextureName}.",
                textureName);

            throw new InvalidOperationException(
                "An error occurred while creating the texture.",
                ex);
        }
    }


    public async Task<List<TextureResponse>> GetAllAsync()
    {
        try
        {
            var textures = await _textureRepository.GetAllAsync();

            if (textures is null)
            {
                return new List<TextureResponse>();
            }

            return textures
                .Select(MapToResponse)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving textures.");

            throw;
        }
    }

    public async Task<TextureResponse?> GetByIdAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Texture ID cannot be empty.",
                nameof(id));
        }

        try
        {
            var texture =
                await _textureRepository.GetByIdAsync(id);

            if (texture is null)
            {
                _logger.LogWarning(
                    "Texture with ID {TextureId} was not found.",
                    id);

                return null;
            }

            return MapToResponse(texture);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving texture with ID {TextureId}.",
                id);

            throw;
        }
    }


    public async Task<TextureResponse?> UpdateAsync(
    Guid id,
    UpdateTextureRequest request)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Texture ID cannot be empty.",
                nameof(id));
        }

        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.TextureName))
        {
            throw new ArgumentException(
                "Texture name is required.",
                nameof(request.TextureName));
        }

        try
        {
            var texture =
                await _textureRepository.GetByIdAsync(id);

        if (texture is null)
        {
            _logger.LogWarning(
                "Cannot update texture. Texture with ID {TextureId} was not found.",
                id);

            return null;
        }

        if (texture.DeletedAt is not null)
        {
            throw new InvalidOperationException(
                "Cannot update a deleted texture.");
        }

            texture.TextureName =
                request.TextureName.Trim();

            texture.TextureMetadata =
                request.TextureMetadata;

            texture.IsActive =
                request.IsActive;

            texture.UpdatedAt =
                DateTime.UtcNow;

            await _textureRepository.UpdateAsync(texture);

            return MapToResponse(texture);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating texture with ID {TextureId}.",
                id);

            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Texture ID cannot be empty.",
                nameof(id));
        }

        try
        {
            var texture =
                await _textureRepository.GetByIdAsync(id);

            if (texture is null)
            {
                _logger.LogWarning(
                    "Cannot delete texture. Texture with ID {TextureId} was not found.",
                    id);

                return false;
            }

            // Already deleted; treat as a successful operation.
            if (texture.DeletedAt is not null)
            {
                return true;
            }

            var now = DateTime.UtcNow;

            texture.DeletedAt = now;
            texture.IsActive = false;
            texture.UpdatedAt = now;

            await _textureRepository.UpdateAsync(texture);

            _logger.LogInformation(
                "Texture with ID {TextureId} was soft-deleted successfully.",
                id);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while deleting texture with ID {TextureId}.",
                id);

            throw new InvalidOperationException(
                $"An error occurred while deleting texture with ID '{id}'.",
                ex);
        }
    }

    public async Task<List<TextureResponse>> GetByRegionIdAsync(Guid regionId)
    {
        if (regionId == Guid.Empty)
        {
            throw new ArgumentException(
                "Region ID cannot be empty.",
                nameof(regionId));
        }

        try
        {
            var textures =
                await _textureRepository.GetByRegionIdAsync(regionId);

            if (textures is null)
            {
                _logger.LogWarning(
                    "No texture collection was returned for region ID {RegionId}.",
                    regionId);

                return new List<TextureResponse>();
            }

            return textures
                .Select(MapToResponse)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving textures for region ID {RegionId}.",
                regionId);

            throw new InvalidOperationException(
                $"An error occurred while retrieving textures for region ID '{regionId}'.",
                ex);
        }
    }

    private static TextureResponse MapToResponse(
    Texture texture)
    {
        return new TextureResponse
        {
            Id = texture.Id,

            TextureName = texture.TextureName,

            TexturePath = texture.TexturePath,

            TextureMetadata = texture.TextureMetadata,

            IsActive = texture.IsActive,

            CreatedAt = texture.CreatedAt,

            UpdatedAt = texture.UpdatedAt
        };
    }
}