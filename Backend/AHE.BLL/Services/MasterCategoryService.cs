using AHE.BLL.DTOs.MasterCategories;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services;
public class MasterCategoryService : IMasterCategoryService
{
    private readonly IMasterCategoryRepository _masterCategoryRepository;
    private readonly ILogger<MasterCategoryService> _logger;

    public MasterCategoryService(
        IMasterCategoryRepository masterCategoryRepository,
        ILogger<MasterCategoryService> logger)
    {
        _masterCategoryRepository = masterCategoryRepository;
        _logger = logger;
    }

    public async Task<List<MasterCategoryResponse>> GetAllAsync()
    {
        try
        {
            var masterCategories =
                await _masterCategoryRepository.GetAllAsync();

            if (masterCategories is null || !masterCategories.Any())
            {
                return new List<MasterCategoryResponse>();
            }

            return masterCategories
                .Select(MapToResponse)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving master categories.");

            throw new InvalidOperationException(
                "An error occurred while retrieving master categories.",
                ex);
        }
    }

    public async Task<MasterCategoryResponse?> GetByIdAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Master category ID cannot be empty.",
                nameof(id));
        }

        try
        {
            var masterCategory =
                await _masterCategoryRepository.GetByIdAsync(id);

            if (masterCategory is null)
            {
                return null;
            }

            return MapToResponse(masterCategory);
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving master category with ID {MasterCategoryId}.",
                id);

            throw new InvalidOperationException(
                "An error occurred while retrieving the master category.",
                ex);
        }
    }

    public async Task<MasterCategoryResponse> CreateAsync(
        CreateMasterCategoryRequest request)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.MasterCategoryName))
        {
            throw new ArgumentException(
                "Master category name is required.",
                nameof(request.MasterCategoryName));
        }

        var categoryName = request.MasterCategoryName.Trim();

        try
        {
            var existingCategoryName =
                await _masterCategoryRepository
                    .GetByNameAsync(categoryName);

            if (existingCategoryName is not null)
            {
                throw new InvalidOperationException(
                    "Category name already exists.");
            }

            var now = DateTime.UtcNow;

            var masterCategory = new MasterCategory
            {
                Id = Guid.NewGuid(),

                MasterCategoryName = categoryName,

                Description = request.Description?.Trim(),

                IsActive = true,

                CreatedAt = now,

                UpdatedAt = now,

                DeletedAt = null
            };

            await _masterCategoryRepository
                .AddAsync(masterCategory);

            _logger.LogInformation(
                "Master category created successfully. CategoryId: {CategoryId}",
                masterCategory.Id);

            return MapToResponse(masterCategory);
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            // Preserve the duplicate category exception.
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating master category {CategoryName}.",
                categoryName);

            throw new InvalidOperationException(
                "An error occurred while creating the master category.",
                ex);
        }
    }

    public async Task<MasterCategoryResponse?> UpdateAsync(
        Guid id,
        UpdateMasterCategoryRequest request)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Master category ID cannot be empty.",
                nameof(id));
        }

        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.MasterCategoryName))
        {
            throw new ArgumentException(
                "Category name is required.",
                nameof(request.MasterCategoryName));
        }

        var categoryName = request.MasterCategoryName.Trim();

        try
        {
            var masterCategory =
                await _masterCategoryRepository.GetByIdAsync(id);

            if (masterCategory is null)
            {
                _logger.LogWarning(
                    "Master category with ID {MasterCategoryId} was not found.",
                    id);

                return null;
            }

            var existingMasterCategory =
                await _masterCategoryRepository
                    .GetByNameAsync(categoryName);

            if (existingMasterCategory is not null &&
                existingMasterCategory.Id != id)
            {
                throw new InvalidOperationException(
                    "Category name already exists.");
            }

            masterCategory.MasterCategoryName = categoryName;
            masterCategory.Description = request.Description?.Trim();
            masterCategory.UpdatedAt = DateTime.UtcNow;

            await _masterCategoryRepository
                .UpdateAsync(masterCategory);

            _logger.LogInformation(
                "Master category with ID {MasterCategoryId} updated successfully.",
                id);

            return MapToResponse(masterCategory);
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            // Preserve the duplicate-name business exception.
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating master category with ID {MasterCategoryId}.",
                id);

            throw new InvalidOperationException(
                "An error occurred while updating the master category.",
                ex);
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(
                "Master category ID cannot be empty.",
                nameof(id));
        }

        try
        {
            var masterCategory =
                await _masterCategoryRepository.GetByIdAsync(id);

            if (masterCategory is null)
            {
                _logger.LogWarning(
                    "Master category with ID {MasterCategoryId} was not found.",
                    id);

                return false;
            }

            if (!masterCategory.IsActive)
            {
                _logger.LogWarning(
                    "Master category with ID {MasterCategoryId} is already inactive.",
                    id);

                return false;
            }

            var now = DateTime.UtcNow;

            masterCategory.IsActive = false;
            masterCategory.DeletedAt = now;
            masterCategory.UpdatedAt = now;

            await _masterCategoryRepository.UpdateAsync(masterCategory);

            _logger.LogInformation(
                "Master category with ID {MasterCategoryId} was soft-deleted successfully.",
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
                "An error occurred while deleting master category with ID {MasterCategoryId}.",
                id);

            throw new InvalidOperationException(
                "An error occurred while deleting the master category.",
                ex);
        }
    }

    private static MasterCategoryResponse MapToResponse(
        MasterCategory masterCategory)
    {
        return new MasterCategoryResponse
        {
            Id = masterCategory.Id,
            MasterCategoryName = masterCategory.MasterCategoryName,
            Description = masterCategory.Description,
            IsActive = masterCategory.IsActive,
            CreatedAt = masterCategory.CreatedAt,
            UpdatedAt = masterCategory.UpdatedAt,
            Categories = (masterCategory.Category ?? Enumerable.Empty<Category>())
                .Where(cat => cat.IsActive && cat.DeletedAt == null)
                .OrderBy(cat => cat.CategoryName)
                .Select(cat => new DTOs.Categories.CategoryResponse
                {
                    Id = cat.Id,
                    CategoryName = cat.CategoryName,
                    Description = cat.Description,
                    MasterCategoryId = cat.MasterCategoryId,
                    IsActive = cat.IsActive,
                    CreatedAt = cat.CreatedAt,
                    UpdatedAt = cat.UpdatedAt
                }).ToList()
        };
    }
}
