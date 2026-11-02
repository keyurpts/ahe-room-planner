using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AHE.DAL.Repositories;

public class TextureRepository : ITextureRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<TextureRepository> _logger;


    public TextureRepository(AppDbContext context, ILogger<TextureRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Texture> AddAsync(Texture texture)
    {
        if (texture == null)
        {
            _logger.LogWarning(
                "Cannot create texture because the input texture is null.");

            throw new ArgumentNullException(nameof(texture));
        }

        try
        {
            await _context.Textures.AddAsync(texture);
            
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Texture created successfully with Id: {TextureId}.",
                texture.Id);

            return texture;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating the texture with Id: {TextureId}.",
                texture.Id);

            throw;
        }
    }

    public async Task<Texture?> GetByIdAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            _logger.LogWarning(
                "Cannot retrieve texture because the ID is empty.");

            return null;
        }

        try
        {
            var texture = await _context.Textures
                .FirstOrDefaultAsync(x => x.Id == id);

            if (texture == null)
            {
                _logger.LogWarning(
                    "No texture found with Id: {TextureId}.",
                    id);

                return null;
            }

            _logger.LogInformation(
                "Successfully retrieved texture with Id: {TextureId}.",
                id);

            return texture;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving texture with Id: {TextureId}.",
                id);

            throw;
        }
    }

    public async Task<List<Texture>> GetAllAsync()
    {
        try
        {
            var textures = await _context.Textures
            .Where(x => x.DeletedAt == null)
            .OrderBy(x => x.TextureName)
            .ToListAsync();

            _logger.LogInformation(
                "Successfully retrieved textures ");

            return textures;
        }
        catch(Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving textures.");

            throw;

        }
        
    }

    public async Task UpdateAsync(Texture texture)
    {
        if (texture == null)
        {
            _logger.LogWarning(
                "Cannot update texture because the texture is null.");
        }

        try
        {
            _context.Textures.Update(texture);

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Successfully updated texture" );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating texture" );

            throw;
        }
    }

    public async Task DeleteAsync(Texture texture)
    {
        if (texture == null)
        {
            _logger.LogWarning(
                "Cannot delete texture because the input texture is null.");

            throw new ArgumentNullException(nameof(texture));
        }

        try
        {
            _context.Textures.Remove(texture);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Texture deleted successfully with Id: {TextureId}.",
                texture.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while deleting the texture with Id: {TextureId}.",
                texture.Id);

            throw;
        }
    }

    public async Task<List<Texture>> GetByRegionIdAsync(Guid regionId)
    {
        if (regionId == Guid.Empty)
        {
            _logger.LogWarning(
                "Cannot retrieve textures because the RegionId is empty.");

            throw new ArgumentNullException(nameof(regionId));
        }

        try
        {
            var textures = await _context.Textures
                .Where(x => x.DeletedAt == null &&
                            x.Regions.Any(r => r.Id == regionId))
                .OrderBy(x => x.TextureName)
                .ToListAsync();

            _logger.LogInformation(
                "Successfully retrieved {TextureCount} active textures for RegionId: {RegionId}.",
                textures.Count,
                regionId);

            return textures;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving textures for RegionId: {RegionId}.",
                regionId);

            throw;
        }
    }
}