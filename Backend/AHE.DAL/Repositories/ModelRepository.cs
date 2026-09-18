using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AHE.DAL.Repositories;

public class ModelRepository : IModelRepository
{
    private readonly AppDbContext _context;

    public ModelRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Model>> GetAllAsync()
    {
        return await _context.Models
            .Include(m => m.ModelTextures)
                .ThenInclude(mv => mv.ModelVariantRegions)
            .Where(m =>
                m.IsActive &&
                m.DeletedAt == null)
            .OrderBy(m => m.ModelName)
            .ToListAsync();
    }

    public async Task<List<Model>> GetByCategoryIdAsync(
        Guid categoryId)
    {
        return await _context.Models
            .Include(m => m.ModelTextures)
                .ThenInclude(mv => mv.ModelVariantRegions)
            .Where(m =>
                m.CategoryId == categoryId &&
                m.IsActive &&
                m.DeletedAt == null)
            .OrderBy(m => m.ModelName)
            .ToListAsync();
    }

    public async Task<Model?> GetByIdAsync(Guid id)
    {
        return await _context.Models
            .Include(m => m.ModelTextures)
                .ThenInclude(mv => mv.ModelVariantRegions)
            .FirstOrDefaultAsync(m =>
                m.Id == id &&
                m.DeletedAt == null);
    }

    public async Task AddAsync(Model model)
    {
        await _context.Models.AddAsync(model);

        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Model model)
    {
        _context.Models.Update(model);

        await _context.SaveChangesAsync();
    }

    public async Task<List<Model>> GetByCategoryAndRegionAsync(
    Guid categoryId,
    Guid regionId)
    {
        return await _context.Models
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
    }
}
