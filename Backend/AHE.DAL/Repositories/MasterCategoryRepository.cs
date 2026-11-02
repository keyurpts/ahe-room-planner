using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class MasterCategoryRepository : IMasterCategoryRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<MasterCategoryRepository> _logger;


        public MasterCategoryRepository(AppDbContext context, ILogger<MasterCategoryRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<MasterCategory>> GetAllAsync()
        {
            try
            {
                _logger.LogInformation("Fetching active master categories.");

                var masterCategories = await _context.MasterCategories
                    .AsNoTracking()
                    .Include(c => c.Category)
                    .Where(c => c.IsActive && c.DeletedAt == null)
                    .OrderBy(c => c.MasterCategoryName)
                    .ToListAsync();

                _logger.LogInformation(
                    "Successfully retrieved {MasterCategoryCount} active master categories.",
                    masterCategories.Count);

                return masterCategories;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while fetching active master categories.");

                throw;
            }
        }

        public async Task<MasterCategory?> GetByIdAsync(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning(
                    "Master category lookup failed because the ID is empty.");

                throw new ArgumentNullException(nameof(id));
            }

            try
            {
                _logger.LogInformation(
                    "Fetching master category with ID {MasterCategoryId}.",
                    id);

                var masterCategory = await _context.MasterCategories
                    .Include(c => c.Category)
                    .FirstOrDefaultAsync(c =>
                        c.Id == id &&
                        c.DeletedAt == null);

                if (masterCategory == null)
                {
                    _logger.LogWarning(
                        "Master category with ID {MasterCategoryId} was not found or has been deleted.",
                        id);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved master category with ID {MasterCategoryId}.",
                    id);

                return masterCategory;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while fetching master category with ID {MasterCategoryId}.",
                    id);

                throw;
            }
        }

        public async Task AddAsync(MasterCategory masterCategory)
        {
            if (masterCategory == null)
            {
                _logger.LogWarning(
                    "Master category creation failed because the input is null.");

                throw new ArgumentNullException(nameof(masterCategory));
            }

            try
            {
                _logger.LogInformation(
                    "Creating master category with name {MasterCategoryName}.",
                    masterCategory.MasterCategoryName);

                await _context.MasterCategories.AddAsync(masterCategory);

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Successfully created master category with ID {MasterCategoryId}.",
                    masterCategory.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while creating master category with name {MasterCategoryName}.",
                    masterCategory.MasterCategoryName);

                throw;
            }
        }

        public async Task UpdateAsync(MasterCategory masterCategory)
        {
            if (masterCategory == null)
            {
                _logger.LogWarning(
                    "Master category update failed because the input is null.");

                throw new ArgumentNullException(nameof(masterCategory));
            }

            try
            {
                _logger.LogInformation(
                    "Updating master category with ID {MasterCategoryId}.",
                    masterCategory.Id);

                _context.MasterCategories.Update(masterCategory);

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Successfully updated master category with ID {MasterCategoryId}.",
                    masterCategory.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while updating master category with ID {MasterCategoryId}.",
                    masterCategory.Id);

                throw;
            }
        }

        public async Task<MasterCategory?> GetByNameAsync(
            string masterCategoryName)
        {
            if (string.IsNullOrWhiteSpace(masterCategoryName))
            {
                _logger.LogWarning(
                    "Master category lookup failed because the name is null or empty.");

                throw new ArgumentException(
                    "Master category name cannot be null or empty.",
                    nameof(masterCategoryName));
            }

            try
            {
                _logger.LogInformation(
                    "Fetching master category with name {MasterCategoryName}.",
                    masterCategoryName);

                var masterCategory = await _context.MasterCategories
                    .FirstOrDefaultAsync(c =>
                        c.MasterCategoryName == masterCategoryName &&
                        c.DeletedAt == null);

                if (masterCategory == null)
                {
                    _logger.LogWarning(
                        "Master category with name {MasterCategoryName} was not found or has been deleted.",
                        masterCategoryName);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved master category with name {MasterCategoryName}.",
                    masterCategoryName);

                return masterCategory;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while fetching master category with name {MasterCategoryName}.",
                    masterCategoryName);

                throw;
            }
        }
    }
}
