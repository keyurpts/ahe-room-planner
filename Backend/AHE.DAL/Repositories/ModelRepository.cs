using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AHE.DAL.Repositories;

public class ModelRepository : IModelRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<ModelRepository> _logger;


    public ModelRepository(AppDbContext context, ILogger<ModelRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Model>> GetAllAsync()
    {
        try
        {
            _logger.LogInformation("Fetching active models.");

            var models = await _context.Models
                .Include(m => m.ModelTextures)
                    .ThenInclude(mv => mv.ModelVariantRegions)
                .Where(m =>
                    m.IsActive &&
                    m.DeletedAt == null)
                .OrderBy(m => m.ModelName)
                .ToListAsync();

            _logger.LogInformation(
                "Successfully retrieved {ModelCount} active models.",
                models.Count);

            return models;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while fetching active models.");

            throw;
        }
    }

    public async Task<List<Model>> GetByCategoryIdAsync(
        Guid categoryId)
    {
        if (categoryId == Guid.Empty)
        {
            _logger.LogWarning(
                "Master category lookup failed because the categoryId is empty.");

            throw new ArgumentNullException(nameof(categoryId));
        }

        try
        {
            _logger.LogInformation(
                "Fetching active models for category ID {CategoryId}.",
                categoryId);

            var models = await _context.Models
                .Include(m => m.ModelTextures)
                    .ThenInclude(mv => mv.ModelVariantRegions)
                .Where(m =>
                    m.CategoryId == categoryId &&
                    m.IsActive &&
                    m.DeletedAt == null)
                .OrderBy(m => m.ModelName)
                .ToListAsync();

            _logger.LogInformation(
                "Successfully retrieved {ModelCount} active models for category ID {CategoryId}.",
                models.Count,
                categoryId);

            return models;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while fetching active models for category ID {CategoryId}.",
                categoryId);

            throw;
        }
    }

    public async Task<Model?> GetByIdAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            _logger.LogWarning(
                "Model lookup failed because the model ID is null.");

            throw new ArgumentNullException(nameof(id));
        }

        try
        {
            _logger.LogInformation(
                "Fetching model with ID {ModelId}.",
                id);

            var model = await _context.Models
                .Include(m => m.ModelTextures)
                    .ThenInclude(mv => mv.ModelVariantRegions)
                .FirstOrDefaultAsync(m =>
                    m.Id == id &&
                    m.DeletedAt == null);

            if (model == null)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} was not found or has been deleted.",
                    id);

                return null;
            }

            _logger.LogInformation(
                "Successfully retrieved model with ID {ModelId}.",
                id);

            return model;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while fetching model with ID {ModelId}.",
                id);

            throw;
        }
    }

    public async Task AddAsync(Model model)
    {
        if (model == null)
        {
            _logger.LogWarning(
                "Model creation failed because the input model is null.");

            throw new ArgumentNullException(nameof(model));
        }

        try
        {
            _logger.LogInformation(
                "Creating model with name {ModelName}.",
                model.ModelName);

            await _context.Models.AddAsync(model);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Successfully created model with ID {ModelId} and name {ModelName}.",
                model.Id,
                model.ModelName);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating model with name {ModelName}.",
                model.ModelName);

            throw;
        }
    }

    public async Task UpdateAsync(Model model)
    {
        if (model == null)
        {
            _logger.LogWarning(
                "Model update failed because the input model is null.");

            throw new ArgumentNullException(nameof(model));
        }

        try
        {
            _logger.LogInformation(
                "Updating model with ID {ModelId}.",
                model.Id);

            _context.Models.Update(model);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Successfully updated model with ID {ModelId}.",
                model.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating model with ID {ModelId}.",
                model.Id);

            throw;
        }
    }

    public async Task<List<Model>> GetByCategoryAndRegionAsync(
    Guid categoryId,
    Guid regionId)
    {
        if (categoryId == Guid.Empty)
        {
            _logger.LogWarning(
                "Model retrieval failed because the category ID is empty.");

            throw new ArgumentException(
                "Category ID cannot be empty.",
                nameof(categoryId));
        }

        if (regionId == Guid.Empty)
        {
            _logger.LogWarning(
                "Model retrieval failed because the region ID is empty.");

            throw new ArgumentException(
                "Region ID cannot be empty.",
                nameof(regionId));
        }

        try
        {
            _logger.LogInformation(
                "Fetching active models for category ID {CategoryId} and region ID {RegionId}.",
                categoryId,
                regionId);

            var models = await _context.Models
                .Include(m => m.ModelTextures)
                    .ThenInclude(mv => mv.ModelVariantRegions)
                .Where(m =>
                    m.CategoryId == categoryId &&
                    m.IsActive &&
                    m.DeletedAt == null &&
                    m.ModelRegions.Any(mr =>
                        mr.RegionId == regionId &&
                        mr.IsActive))
                .OrderBy(m => m.ModelName)
                .ToListAsync();

            _logger.LogInformation(
                "Successfully retrieved {ModelCount} active models for category ID {CategoryId} and region ID {RegionId}.",
                models.Count,
                categoryId,
                regionId);

            return models;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while fetching models for category ID {CategoryId} and region ID {RegionId}.",
                categoryId,
                regionId);

            throw;
        }
    }
}
