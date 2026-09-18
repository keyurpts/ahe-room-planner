using AHE.BLL.DTOs.Categories;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;

namespace AHE.BLL.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(
        ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<List<CategoryResponse>> GetAllAsync()
    {
        var categories =
            await _categoryRepository.GetAllAsync();

        return categories.Select(c => new CategoryResponse
        {
            Id = c.Id,
            CategoryName = c.CategoryName,
            Description = c.Description,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        }).ToList();
    }

    public async Task<CategoryResponse?> GetByIdAsync(Guid id)
    {
        var category =
            await _categoryRepository.GetByIdAsync(id);

        if (category == null)
            return null;

        return MapToResponse(category);
    }

    public async Task<CategoryResponse> CreateAsync(
        CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CategoryName))
            throw new ArgumentException(
                "Category name is required.");

        var existingCategoryName =
            await _categoryRepository.GetByNameAsync(
                request.CategoryName.Trim());

        if (existingCategoryName != null)
            throw new InvalidOperationException(
                "Category name already exists.");

        var now = DateTime.UtcNow;

        var category = new Category
        {
            Id = Guid.NewGuid(),

            CategoryName = request.CategoryName.Trim(),

            Description = request.Description?.Trim(),

            IsActive = true,

            CreatedAt = now,

            UpdatedAt = now,

            DeletedAt = null
        };

        await _categoryRepository.AddAsync(category);

        return MapToResponse(category);
    }

    public async Task<CategoryResponse?> UpdateAsync(
        Guid id,
        UpdateCategoryRequest request)
    {
        var category =
            await _categoryRepository.GetByIdAsync(id);

        if (category == null)
            return null;

        if (string.IsNullOrWhiteSpace(request.CategoryName))
            throw new ArgumentException(
                "Category name is required.");

        var existingCategory =
            await _categoryRepository.GetByNameAsync(
                request.CategoryName.Trim());

        if (existingCategory != null &&
            existingCategory.Id != id)
        {
            throw new InvalidOperationException(
                "Category name already exists.");
        }

        category.CategoryName =
            request.CategoryName.Trim();

        category.Description =
            request.Description?.Trim();

        category.UpdatedAt = DateTime.UtcNow;

        await _categoryRepository.UpdateAsync(category);

        return MapToResponse(category);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var category =
            await _categoryRepository.GetByIdAsync(id);

        if (category == null)
            return false;

        category.IsActive = false;

        category.DeletedAt = DateTime.UtcNow;

        category.UpdatedAt = DateTime.UtcNow;

        await _categoryRepository.UpdateAsync(category);

        return true;
    }

    private static CategoryResponse MapToResponse(
        Category category)
    {
        return new CategoryResponse
        {
            Id = category.Id,
            CategoryName = category.CategoryName,
            Description = category.Description,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }
}