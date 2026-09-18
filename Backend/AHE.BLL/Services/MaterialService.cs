using AHE.BLL.DTOs.Materials;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;

namespace AHE.BLL.Services;

public class MaterialService : IMaterialService
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryRepository _categoryRepository;

    public MaterialService(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<MaterialResponse> CreateAsync(
        CreateMaterialRequest request)
    {
        
        if (string.IsNullOrWhiteSpace(request.MaterialName))
        {
            throw new ArgumentException(
                "Material name is required.");
        }

        var now = DateTime.UtcNow;

        var material = new Material
        {
            Id = Guid.NewGuid(),

            MaterialName =
                request.MaterialName.Trim(),

            MaterialPath =
                request.MaterialPath?.Trim(),

            ThumbnailPath =
                request.ThumbnailPath?.Trim(),

            MaterialMetadata =
                request.MaterialMetadata,

            IsActive = true,

            CreatedAt = now,

            UpdatedAt = now,

            DeletedAt = null
        };

        var createdMaterial =
            await _materialRepository
                .AddAsync(material);

        return MapToResponse(createdMaterial);
    }

    public async Task<List<MaterialResponse>> GetAllAsync()
    {
        var materials =
            await _materialRepository.GetAllAsync();

        return materials
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<MaterialResponse?> GetByIdAsync(
        Guid id)
    {
        var material =
            await _materialRepository.GetByIdAsync(id);

        if (material == null)
        {
            return null;
        }

        return MapToResponse(material);
    }

    public async Task<MaterialResponse?> UpdateAsync(
        Guid id,
        UpdateMaterialRequest request)
    {
        var material =
            await _materialRepository.GetByIdAsync(id);

        if (material == null)
        {
            return null;
        }

        if (material.DeletedAt != null)
        {
            throw new InvalidOperationException(
                "Cannot update a deleted material.");
        }

        if (string.IsNullOrWhiteSpace(request.MaterialName))
        {
            throw new ArgumentException(
                "Material name is required.");
        }

        material.MaterialName =
            request.MaterialName.Trim();

        material.MaterialPath =
            request.MaterialPath?.Trim();

        material.ThumbnailPath =
            request.ThumbnailPath?.Trim();

        material.MaterialMetadata =
            request.MaterialMetadata;

        material.IsActive =
            request.IsActive;

        material.UpdatedAt =
            DateTime.UtcNow;

        await _materialRepository
            .UpdateAsync(material);

        return MapToResponse(material);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var material =
            await _materialRepository.GetByIdAsync(id);

        if (material == null)
        {
            return false;
        }

        if (material.DeletedAt != null)
        {
            return true;
        }

        // Soft delete
        material.DeletedAt = DateTime.UtcNow;

        material.IsActive = false;

        material.UpdatedAt = DateTime.UtcNow;

        await _materialRepository
            .UpdateAsync(material);

        return true;
    }

    private static MaterialResponse MapToResponse(
        Material material)
    {
        return new MaterialResponse
        {
            Id = material.Id,

            MaterialName = material.MaterialName,

            MaterialPath = material.MaterialPath,

            ThumbnailPath = material.ThumbnailPath,

            MaterialMetadata =
                material.MaterialMetadata,

            IsActive = material.IsActive,

            CreatedAt = material.CreatedAt,

            UpdatedAt = material.UpdatedAt
        };
    }
}