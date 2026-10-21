using AHE.BLL.DTOs.MasterCategories;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services;
public class MasterCategoryService : IMasterCategoryService
{
    private readonly IMasterCategoryRepository _masterCategoryRepository;

    public MasterCategoryService(
        IMasterCategoryRepository masterCategoryRepository)
    {
        _masterCategoryRepository = masterCategoryRepository;
    }

    public async Task<List<MasterCategoryResponse>> GetAllAsync()
    {
        var masterCategories =
            await _masterCategoryRepository.GetAllAsync();

        return masterCategories.Select(MapToResponse).ToList();
    }

    public async Task<MasterCategoryResponse?> GetByIdAsync(Guid id)
    {
        var masterCategory =
            await _masterCategoryRepository.GetByIdAsync(id);

        if (masterCategory == null)
            return null;

        return MapToResponse(masterCategory);
    }

    public async Task<MasterCategoryResponse> CreateAsync(
        CreateMasterCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.MasterCategoryName))
            throw new ArgumentException(
                "Master Category name is required.");

        var existingCategoryName =
            await _masterCategoryRepository.GetByNameAsync(
                request.MasterCategoryName.Trim());

        if (existingCategoryName != null)
            throw new InvalidOperationException(
                "Category name already exists.");

        var now = DateTime.UtcNow;

        var masterCategory = new MasterCategory
        {
            Id = Guid.NewGuid(),

            MasterCategoryName = request.MasterCategoryName.Trim(),

            Description = request.Description?.Trim(),

            IsActive = true,

            CreatedAt = now,

            UpdatedAt = now,

            DeletedAt = null
        };

        await _masterCategoryRepository.AddAsync(masterCategory);

        return MapToResponse(masterCategory);
    }

    public async Task<MasterCategoryResponse?> UpdateAsync(
        Guid id,
        UpdateMasterCategoryRequest request)
    {
        var masterCategory =
            await _masterCategoryRepository.GetByIdAsync(id);

        if (masterCategory == null)
            return null;

        if (string.IsNullOrWhiteSpace(request.MasterCategoryName))
            throw new ArgumentException(
                "Category name is required.");

        var existingMasterCategory =
            await _masterCategoryRepository.GetByNameAsync(
                request.MasterCategoryName.Trim());

        if (existingMasterCategory != null &&
            existingMasterCategory.Id != id)
        {
            throw new InvalidOperationException(
                "Category name already exists.");
        }

        masterCategory.MasterCategoryName =
            request.MasterCategoryName.Trim();

        masterCategory.Description =
            request.Description?.Trim();

        masterCategory.UpdatedAt = DateTime.UtcNow;

        await _masterCategoryRepository.UpdateAsync(masterCategory);

        return MapToResponse(masterCategory);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var masterCategory =
            await _masterCategoryRepository.GetByIdAsync(id);

        if (masterCategory == null)
            return false;

        masterCategory.IsActive = false;

        masterCategory.DeletedAt = DateTime.UtcNow;

        masterCategory.UpdatedAt = DateTime.UtcNow;

        await _masterCategoryRepository.UpdateAsync(masterCategory);

        return true;
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
