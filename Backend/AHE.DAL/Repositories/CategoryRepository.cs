using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CategoryRepository> _logger;


        public CategoryRepository(AppDbContext context, ILogger<CategoryRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Category>> GetAllAsync()
        {
            try
            {
                var categories = await _context.Categories
                    .Where(c => c.IsActive && c.DeletedAt == null)
                    .OrderBy(c => c.CategoryName)
                    .ToListAsync();

                _logger.LogInformation(
                    "Successfully retrieved {CategoryCount} active categories.",
                    categories.Count);

                return categories;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving active categories.");

                throw;
            }
        }

        public async Task<List<Category>> GetByMasterCategoryAsync()
        {
            try
            {
                _logger.LogInformation("Fetching active categories.");

                var categories = await _context.Categories
                    .Where(c => c.IsActive && c.DeletedAt == null)
                    .OrderBy(c => c.CategoryName)
                    .ToListAsync();

                _logger.LogInformation(
                    "Successfully retrieved {CategoryCount} active categories.",
                    categories.Count);

                return categories;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while fetching active categories.");

                throw;
            }
        }

        public async Task<Category?> GetByIdAsync(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning(
                    "Category lookup failed because the category ID is empty.");

                throw new ArgumentNullException(nameof(id), "Category ID cannot be empty.");
            }

            try
            {
                _logger.LogInformation(
                    "Fetching category with ID {CategoryId}.", id);

                var category = await _context.Categories
                    .FirstOrDefaultAsync(c =>
                        c.Id == id &&
                        c.DeletedAt == null);

                if (category == null)
                {
                    _logger.LogWarning(
                        "Category with ID {CategoryId} was not found or has been deleted.",
                        id);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved category with ID {CategoryId}.", id);

                return category;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while fetching category with ID {CategoryId}.",
                    id);

                throw;
            }
        }

        public async Task<Category?> GetByNameAsync(
            string categoryName)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
            {
                _logger.LogWarning(
                    "Category lookup failed because the category name is null or empty.");

                throw new ArgumentException(
                    "Category name cannot be null or empty.",
                    nameof(categoryName));
            }

            try
            {
                _logger.LogInformation(
                    "Fetching category with name {CategoryName}.",
                    categoryName);

                var category = await _context.Categories
                    .FirstOrDefaultAsync(c =>
                        c.CategoryName == categoryName &&
                        c.DeletedAt == null);

                if (category == null)
                {
                    _logger.LogWarning(
                        "Category with name {CategoryName} was not found or has been deleted.",
                        categoryName);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved category with name {CategoryName}.",
                    categoryName);

                return category;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while fetching category with name {CategoryName}.",
                    categoryName);

                throw;
            }
        }

        public async Task AddAsync(Category category)
        {
            if (category == null)
            {
                _logger.LogWarning(
                    "Category creation failed because the input category is null.");

                throw new ArgumentNullException(nameof(category));
            }

            try
            {
                _logger.LogInformation(
                    "Creating category with name {CategoryName}.",
                    category.CategoryName);

                await _context.Categories.AddAsync(category);

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Successfully created category with ID {CategoryId} and name {CategoryName}.",
                    category.Id,
                    category.CategoryName);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while creating category with name {CategoryName}.",
                    category.CategoryName);

                throw;
            }
        }

        public async Task UpdateAsync(Category category)
        {
            if (category == null)
            {
                _logger.LogWarning(
                    "Category update failed because the input category is null.");

                throw new ArgumentNullException(nameof(category));
            }

            try
            {
                _logger.LogInformation(
                    "Updating category with ID {CategoryId}.",
                    category.Id);

                _context.Categories.Update(category);

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Successfully updated category with ID {CategoryId}.",
                    category.Id);

            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while updating category with ID {CategoryId}.",
                    category.Id);

                throw;
            }
        }
    }
}
