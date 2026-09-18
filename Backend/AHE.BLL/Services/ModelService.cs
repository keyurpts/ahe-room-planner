using AHE.BLL.DTOs.Models;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AHE.BLL.Services;

public class ModelService : IModelService
{
    private readonly IModelRepository _modelRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IRegionRepository _regionRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITextureRepository _textureRepository;

    public ModelService(
        IModelRepository modelRepository,
        ICategoryRepository categoryRepository,
        IRegionRepository regionRepository,
        IUserRepository userRepository,
        ITextureRepository textureRepository)
    {
        _modelRepository = modelRepository;
        _categoryRepository = categoryRepository;
        _regionRepository = regionRepository;
        _userRepository = userRepository;
        _textureRepository = textureRepository;
    }

    public async Task<List<ModelResponse>> GetAllAsync()
    {
        var models =
            await _modelRepository.GetAllAsync();

        return models
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<ModelResponse>> GetByCategoryIdAsync(
        Guid categoryId)
    {
        var models =
            await _modelRepository
                .GetByCategoryIdAsync(categoryId);

        return models
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<ModelResponse?> GetByIdAsync(Guid id)
    {
        var model =
            await _modelRepository.GetByIdAsync(id);

        return model == null
            ? null
            : MapToResponse(model);
    }

    public async Task<ModelResponse> CreateAsync(
        CreateModelRequest request)
    {
        if (request.CategoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Category ID is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ModelName))
        {
            throw new ArgumentException(
                "Model name is required.");
        }

        if (request.Variants == null || request.Variants.Count == 0)
        {
            throw new ArgumentException(
                "At least one variant is required.");
        }

        // Verify Category
        var category =
            await _categoryRepository
                .GetByIdAsync(request.CategoryId);

        if (category == null)
        {
            throw new InvalidOperationException(
                "Category not found.");
        }

        if (!category.IsActive)
        {
            throw new InvalidOperationException(
                "Category is inactive.");
        }

        // -----------------------------
        // Validate Variants
        // -----------------------------
        var duplicateTexture =
            request.Variants
                .GroupBy(v => v.TextureId)
                .Any(g => g.Count() > 1);

        if (duplicateTexture)
        {
            throw new ArgumentException(
                "Duplicate textures are not allowed across variants.");
        }

        foreach (var variantRequest in request.Variants)
        {
            if (variantRequest.TextureId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Texture ID is required for each variant.");
            }

            var texture =
                await _textureRepository
                    .GetByIdAsync(variantRequest.TextureId);

            if (texture == null)
            {
                throw new InvalidOperationException(
                    $"Texture '{variantRequest.TextureId}' not found.");
            }

            if (!texture.IsActive)
            {
                throw new InvalidOperationException(
                    $"Texture '{variantRequest.TextureId}' is inactive.");
            }

            if (string.IsNullOrWhiteSpace(variantRequest.SkuNumber))
            {
                throw new ArgumentException(
                    "SKU number is required for each variant.");
            }

            if (variantRequest.Regions == null || variantRequest.Regions.Count == 0)
            {
                throw new ArgumentException(
                    $"At least one region is required for variant with SKU '{variantRequest.SkuNumber}'.");
            }

            var duplicateRegion =
                variantRequest.Regions
                    .GroupBy(r => r.RegionId)
                    .Any(g => g.Count() > 1);

            if (duplicateRegion)
            {
                throw new ArgumentException(
                    $"Duplicate regions are not allowed in variant with SKU '{variantRequest.SkuNumber}'.");
            }

            foreach (var regionRequest in variantRequest.Regions)
            {
                if (regionRequest.RegionId == Guid.Empty)
                {
                    throw new ArgumentException(
                        "Region ID is required.");
                }

                var region =
                    await _regionRepository
                        .GetByIdAsync(regionRequest.RegionId);

                if (region == null)
                {
                    throw new InvalidOperationException(
                        $"Region '{regionRequest.RegionId}' not found.");
                }

                if (!region.IsActive)
                {
                    throw new InvalidOperationException(
                        $"Region '{regionRequest.RegionId}' is inactive.");
                }

                if (string.IsNullOrWhiteSpace(regionRequest.ItemNumber))
                {
                    throw new ArgumentException(
                        $"Item number is required for region '{region.Name}' in variant with SKU '{variantRequest.SkuNumber}'.");
                }

                if (regionRequest.Price < 0)
                {
                    throw new ArgumentException(
                        "Price cannot be negative.");
                }
            }
        }

        // -----------------------------
        // Create Model
        // -----------------------------
        var now = DateTime.UtcNow;

        var model = new Model
        {
            Id = Guid.NewGuid(),
            CategoryId = request.CategoryId,
            ModelName = request.ModelName.Trim(),
            ModelPath = string.IsNullOrWhiteSpace(request.ModelPath) ? "pending" : request.ModelPath.Trim(),
            Description = request.Description?.Trim(),
            ModelMetadata = request.ModelMetadata,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            DeletedAt = null
        };

        // -----------------------------
        // Add Variants and Regional Configs
        // -----------------------------
        foreach (var variantRequest in request.Variants)
        {
            var variant = new ModelVariant
            {
                Id = Guid.NewGuid(),
                ModelId = model.Id,
                TextureId = variantRequest.TextureId,
                SkuNumber = variantRequest.SkuNumber.Trim(),
                ThumbnailPath = string.IsNullOrWhiteSpace(variantRequest.ThumbnailPath)
                    ? StorageService.BuildThumbnailPath(model.CategoryId, model.Id, variantRequest.TextureId)
                    : (variantRequest.ThumbnailPath.StartsWith("thumbnails/")
                        ? variantRequest.ThumbnailPath.Trim()
                        : StorageService.BuildThumbnailPath(model.CategoryId, model.Id, variantRequest.TextureId, variantRequest.ThumbnailPath.Trim()))
            };

            foreach (var regionRequest in variantRequest.Regions)
            {
                var variantRegion = new ModelVariantRegion
                {
                    Id = Guid.NewGuid(),
                    ModelId = model.Id,
                    TextureId = variantRequest.TextureId,
                    RegionId = regionRequest.RegionId,
                    ItemNumber = regionRequest.ItemNumber.Trim(),
                    Price = regionRequest.Price,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                variant.ModelVariantRegions.Add(variantRegion);
                model.ModelRegions.Add(variantRegion);
            }

            model.ModelTextures.Add(variant);
        }

        // -----------------------------
        // Save
        // -----------------------------
        await _modelRepository.AddAsync(model);

        return MapToResponse(model);
    }

    public async Task<ModelResponse?> UpdateAsync(
        Guid id,
        UpdateModelRequest request)
    {
        var model =
            await _modelRepository.GetByIdAsync(id);

        if (model == null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(request.ModelName))
        {
            throw new ArgumentException(
                "Model name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ModelPath))
        {
            throw new ArgumentException(
                "Model path is required.");
        }

        // Verify Category
        var category =
            await _categoryRepository
                .GetByIdAsync(request.CategoryId);

        if (category == null)
        {
            throw new InvalidOperationException(
                "Category not found.");
        }

        if (!category.IsActive)
        {
            throw new InvalidOperationException(
                "Category is inactive.");
        }

        model.CategoryId = request.CategoryId;
        model.ModelName = request.ModelName.Trim();
        model.ModelPath = request.ModelPath.Trim();
        model.ModelMetadata = request.ModelMetadata;
        model.UpdatedAt = DateTime.UtcNow;

        await _modelRepository.UpdateAsync(model);

        return MapToResponse(model);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var model =
            await _modelRepository.GetByIdAsync(id);

        if (model == null)
        {
            return false;
        }

        model.IsActive = false;
        model.DeletedAt = DateTime.UtcNow;
        model.UpdatedAt = DateTime.UtcNow;

        await _modelRepository.UpdateAsync(model);

        return true;
    }

    public async Task<List<ModelResponse>> GetByCategoryForUserAsync(
        Guid userId,
        Guid categoryId)
    {
        // Get logged-in user
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            throw new InvalidOperationException(
                "User not found.");
        }

        if (!user.IsActive)
        {
            throw new InvalidOperationException(
                "User is inactive.");
        }

        // Verify category
        var category =
            await _categoryRepository.GetByIdAsync(categoryId);

        if (category == null)
        {
            throw new InvalidOperationException(
                "Category not found.");
        }

        if (!category.IsActive)
        {
            throw new InvalidOperationException(
                "Category is inactive.");
        }

        // Get models for category + user's region
        var models =
            await _modelRepository
                .GetByCategoryAndRegionAsync(
                    categoryId,
                    user.RegionId);

        return models
            .Select(MapToResponse)
            .ToList();
    }

    private static ModelResponse MapToResponse(Model model)
    {
        return new ModelResponse
        {
            Id = model.Id,
            CategoryId = model.CategoryId,
            ModelName = model.ModelName,
            ModelPath = model.ModelPath,
            Description = model.Description,
            ModelMetadata = model.ModelMetadata,
            IsActive = model.IsActive,
            CreatedAt = model.CreatedAt,
            UpdatedAt = model.UpdatedAt,
            Variants = model.ModelTextures?.Select(v => new ModelVariantResponse
            {
                ModelId = v.ModelId,
                TextureId = v.TextureId,
                SkuNumber = v.SkuNumber,
                ThumbnailPath = v.ThumbnailPath,
                Regions = v.ModelVariantRegions?.Select(r => new ModelVariantRegionResponse
                {
                    RegionId = r.RegionId,
                    ItemNumber = r.ItemNumber,
                    Price = r.Price
                }).ToList() ?? new List<ModelVariantRegionResponse>()
            }).ToList() ?? new List<ModelVariantResponse>()
        };
    }
}