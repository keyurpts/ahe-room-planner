using AHE.BLL.DTOs.Models;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<ModelService> _logger;

    public ModelService(
        IModelRepository modelRepository,
        ICategoryRepository categoryRepository,
        IRegionRepository regionRepository,
        IUserRepository userRepository,
        ITextureRepository textureRepository,
        ILogger<ModelService> logger)
    {
        _modelRepository = modelRepository;
        _categoryRepository = categoryRepository;
        _regionRepository = regionRepository;
        _userRepository = userRepository;
        _textureRepository = textureRepository;
        _logger = logger;
    }

    public async Task<List<ModelResponse>> GetAllAsync()
    {
        try
        {
            var models = await _modelRepository.GetAllAsync();

            if (models is null || !models.Any())
            {
                return new List<ModelResponse>();
            }

            return models
                .Select(MapToResponse)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving models.");

            throw new InvalidOperationException(
                "An error occurred while retrieving models.",
                ex);
        }
    }

    public async Task<List<ModelResponse>> GetByCategoryIdAsync(
        Guid categoryId)
    {
        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Category ID cannot be empty.",
                nameof(categoryId));
        }

        try
        {
            var models =
                await _modelRepository
                    .GetByCategoryIdAsync(categoryId);

            if (models is null || !models.Any())
            {
                return new List<ModelResponse>();
            }

            return models
                .Select(MapToResponse)
                .ToList();
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving models for category {CategoryId}.",
                categoryId);

            throw new InvalidOperationException(
                "An error occurred while retrieving models by category.",
                ex);
        }
    }

    public async Task<ModelResponse?> GetByIdAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Model ID cannot be empty.",
                nameof(id));
        }

        try
        {
            var model = await _modelRepository.GetByIdAsync(id);

            if (model is null)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} was not found.",
                    id);

                return null;
            }

            return MapToResponse(model);
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving model with ID {ModelId}.",
                id);

            throw new InvalidOperationException(
                "An error occurred while retrieving the model.",
                ex);
        }
    }

    public async Task<ModelResponse> CreateAsync(
        CreateModelRequest request)
    {
        // -----------------------------
        // Validate Request
        // -----------------------------
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.CategoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Category ID is required.",
                nameof(request.CategoryId));
        }

        if (string.IsNullOrWhiteSpace(request.ModelName))
        {
            throw new ArgumentException(
                "Model name is required.",
                nameof(request.ModelName));
        }

        if (request.Variants is null ||
            request.Variants.Count == 0)
        {
            throw new ArgumentException(
                "At least one variant is required.",
                nameof(request.Variants));
        }

        // Validate variant fields before database access.
        foreach (var variantRequest in request.Variants)
        {
            if (variantRequest.TextureId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Texture ID is required for each variant.");
            }

            if (string.IsNullOrWhiteSpace(variantRequest.SkuNumber))
            {
                throw new ArgumentException(
                    "SKU number is required for each variant.");
            }

            if (variantRequest.Regions is null ||
                variantRequest.Regions.Count == 0)
            {
                throw new ArgumentException(
                    $"At least one region is required for variant with SKU '{variantRequest.SkuNumber}'.");
            }

            if (variantRequest.Regions.Any(
                    r => r.RegionId == Guid.Empty))
            {
                throw new ArgumentException(
                    $"Region ID is required for each region in variant with SKU '{variantRequest.SkuNumber}'.");
            }

            if (variantRequest.Regions.Any(
                    r => string.IsNullOrWhiteSpace(r.ItemNumber)))
            {
                throw new ArgumentException(
                    $"Item number is required for each region in variant with SKU '{variantRequest.SkuNumber}'.");
            }

            if (variantRequest.Regions.Any(r => r.Price < 0))
            {
                throw new ArgumentException(
                    $"Price cannot be negative for variant with SKU '{variantRequest.SkuNumber}'.");
            }

            var duplicateRegions = variantRequest.Regions
                .GroupBy(r => r.RegionId)
                .Any(g => g.Count() > 1);

            if (duplicateRegions)
            {
                throw new ArgumentException(
                    $"Duplicate regions are not allowed in variant with SKU '{variantRequest.SkuNumber}'.");
            }
        }

        var duplicateTextures = request.Variants
            .GroupBy(v => v.TextureId)
            .Any(g => g.Count() > 1);

        if (duplicateTextures)
        {
            throw new ArgumentException(
                "Duplicate textures are not allowed across variants.");
        }

        try
        {
            // -----------------------------
            // Verify Category
            // -----------------------------
            var category =
                await _categoryRepository.GetByIdAsync(
                    request.CategoryId);

            if (category is null)
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
            // Validate Textures
            // -----------------------------
            foreach (var variantRequest in request.Variants)
            {
                var texture =
                    await _textureRepository.GetByIdAsync(
                        variantRequest.TextureId);

                if (texture is null)
                {
                    throw new InvalidOperationException(
                        $"Texture '{variantRequest.TextureId}' not found.");
                }

                if (!texture.IsActive ||
                    texture.DeletedAt is not null)
                {
                    throw new InvalidOperationException(
                        $"Texture '{variantRequest.TextureId}' is inactive or deleted.");
                }

                // -----------------------------
                // Validate Regions
                // -----------------------------
                foreach (var regionRequest in variantRequest.Regions)
                {
                    var region =
                        await _regionRepository.GetByIdAsync(
                            regionRequest.RegionId);

                    if (region is null)
                    {
                        throw new InvalidOperationException(
                            $"Region '{regionRequest.RegionId}' not found.");
                    }

                    if (!region.IsActive)
                        // || region.DeletedAt is not null
                    {
                        throw new InvalidOperationException(
                            $"Region '{regionRequest.RegionId}' is inactive or deleted.");
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

                ModelPath = string.IsNullOrWhiteSpace(
                    request.ModelPath)
                        ? "pending"
                        : request.ModelPath.Trim(),

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
                var thumbnailPath =
                    string.IsNullOrWhiteSpace(
                        variantRequest.ThumbnailPath)
                        ? StorageService.BuildThumbnailPath(
                            model.CategoryId,
                            model.Id,
                            variantRequest.TextureId)
                        : variantRequest.ThumbnailPath.StartsWith(
                            "thumbnails/",
                            StringComparison.OrdinalIgnoreCase)
                            ? variantRequest.ThumbnailPath.Trim()
                            : StorageService.BuildThumbnailPath(
                                model.CategoryId,
                                model.Id,
                                variantRequest.TextureId,
                                variantRequest.ThumbnailPath.Trim());

                var variant = new ModelVariant
                {
                    Id = Guid.NewGuid(),
                    ModelId = model.Id,
                    TextureId = variantRequest.TextureId,
                    SkuNumber = variantRequest.SkuNumber.Trim(),
                    ThumbnailPath = thumbnailPath
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

            _logger.LogInformation(
                "Model created successfully. ModelId: {ModelId}, CategoryId: {CategoryId}, VariantCount: {VariantCount}.",
                model.Id,
                model.CategoryId,
                model.ModelTextures.Count);

            return MapToResponse(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating model for category {CategoryId}.",
                request.CategoryId);

            // Preserve the original exception type and stack trace.
            throw;
        }
    }

    public async Task<ModelResponse?> UpdateAsync(
        Guid id,
        UpdateModelRequest request)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Model ID cannot be empty.",
                nameof(id));
        }

        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.ModelName))
        {
            throw new ArgumentException(
                "Model name is required.",
                nameof(request.ModelName));
        }

        if (string.IsNullOrWhiteSpace(request.ModelPath))
        {
            throw new ArgumentException(
                "Model path is required.",
                nameof(request.ModelPath));
        }

        if (request.CategoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Category ID cannot be empty.",
                nameof(request.CategoryId));
        }

        try
        {
            var model = await _modelRepository.GetByIdAsync(id);

            if (model is null)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} was not found.",
                    id);

                return null;
            }

            // Verify category
            var category = await _categoryRepository
                .GetByIdAsync(request.CategoryId);

            if (category is null)
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

            _logger.LogInformation(
                "Model with ID {ModelId} updated successfully.",
                id);

            return MapToResponse(model);
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            // Preserve expected business validation exceptions.
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating model with ID {ModelId}.",
                id);

            throw new InvalidOperationException(
                "An error occurred while updating the model.",
                ex);
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Model ID cannot be empty.",
                nameof(id));
        }

        try
        {
            var model = await _modelRepository.GetByIdAsync(id);

            if (model is null)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} was not found.",
                    id);

                return false;
            }

            if (!model.IsActive)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} is already inactive.",
                    id);

                return false;
            }

            var now = DateTime.UtcNow;

            model.IsActive = false;
            model.DeletedAt = now;
            model.UpdatedAt = now;

            await _modelRepository.UpdateAsync(model);

            _logger.LogInformation(
                "Model with ID {ModelId} was soft-deleted successfully.",
                id);

            return true;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while deleting model with ID {ModelId}.",
                id);

            throw new InvalidOperationException(
                "An error occurred while deleting the model.",
                ex);
        }
    }

    public async Task<List<ModelResponse>> GetByCategoryForUserAsync(
        Guid userId,
        Guid categoryId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException(
                "User ID cannot be empty.",
                nameof(userId));
        }

        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Category ID cannot be empty.",
                nameof(categoryId));
        }

        try
        {
            // Get logged-in user
            var user = await _userRepository.GetByIdAsync(userId);

            if (user is null)
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

            if (category is null)
            {
                throw new KeyNotFoundException("Category not found.");
            }

            if (!category.IsActive)
            {
                throw new KeyNotFoundException("Category is inactive.");
            }

            // Get models for category and user's region
            var models =
                await _modelRepository
                    .GetByCategoryAndRegionAsync(
                        categoryId,
                        user.RegionId);

            if (models is null || !models.Any())
            {
                return new List<ModelResponse>();
            }

            return models
                .Select(MapToResponse)
                .ToList();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogError(
                ex,
                "Cannot find category {CategoryId}.",
                categoryId);

            throw;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            // Preserve expected validation exceptions.
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving models for user {UserId} and category {CategoryId}.",
                userId,
                categoryId);

            throw new InvalidOperationException(
                "An error occurred while retrieving models for the user.",
                ex);
        }
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