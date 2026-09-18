using AHE.BLL.DTOs.Textures;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;

namespace AHE.BLL.Services;

public class TextureService : ITextureService
{
    private readonly ITextureRepository _textureRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStorageService _storageService;


    public TextureService(
        ITextureRepository textureRepository,
        ICategoryRepository categoryRepository,
        IStorageService storageService)
    {
        _textureRepository = textureRepository;
        _categoryRepository = categoryRepository;
        _storageService = storageService;
    }

    public async Task<TextureResponse> CreateAsync(
    CreateTextureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TextureName))
        {
            throw new ArgumentException(
                "Texture name is required.");
        }

        var now = DateTime.UtcNow;

        var textureName = request.TextureName.Trim();

        var texturePath = $"textures/{textureName}/";

        var texture = new Texture
        {
            Id = Guid.NewGuid(),

            TextureName = textureName,

            TexturePath = texturePath,

            TextureMetadata = request.TextureMetadata,

            IsActive = true,

            CreatedAt = now,

            UpdatedAt = now,

            DeletedAt = null
        };

        // 1. Save the texture record.
        var createdTexture =
            await _textureRepository.AddAsync(texture);

        // 2. Generate the signed upload URL.
        var uploadResponse =
            await _storageService.GenerateTextureUploadUrlAsync(
                createdTexture.Id,
                createdTexture.TextureName);

        // 3. Store the blob path in the database.
        createdTexture.TexturePath =
            uploadResponse.BlobPath;

        createdTexture.UpdatedAt = DateTime.UtcNow;

        await _textureRepository.UpdateAsync(createdTexture);

        // 4. Return the texture and upload details.
        var response = MapToResponse(createdTexture);

        response.UploadUrl = uploadResponse.UploadUrl;

        response.BlobPath = uploadResponse.BlobPath;

        response.ExpiresAt = uploadResponse.ExpiresAt;

        return response;
    }
    public async Task<List<TextureResponse>> GetAllAsync()
    {
        var textures =
            await _textureRepository.GetAllAsync();

        return textures
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<TextureResponse?> GetByIdAsync(Guid id)
    {
        var texture =
            await _textureRepository.GetByIdAsync(id);

        if (texture == null)
        {
            return null;
        }

        return MapToResponse(texture);
    }

    
    public async Task<TextureResponse?> UpdateAsync(
    Guid id,
    UpdateTextureRequest request)
    {
        var texture =
            await _textureRepository.GetByIdAsync(id);

        if (texture == null)
        {
            return null;
        }

        if (texture.DeletedAt != null)
        {
            throw new InvalidOperationException(
                "Cannot update a deleted texture.");
        }

        if (string.IsNullOrWhiteSpace(request.TextureName))
        {
            throw new ArgumentException(
                "Texture name is required.");
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

    public async Task<bool> DeleteAsync(Guid id)
    {
        var texture =
            await _textureRepository.GetByIdAsync(id);

        if (texture == null)
        {
            return false;
        }

        if (texture.DeletedAt != null)
        {
            return true;
        }

        texture.DeletedAt = DateTime.UtcNow;
        texture.IsActive = false;
        texture.UpdatedAt = DateTime.UtcNow;

        await _textureRepository.UpdateAsync(texture);

        return true;
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