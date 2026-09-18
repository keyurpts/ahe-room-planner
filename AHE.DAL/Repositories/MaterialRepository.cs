using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AHE.DAL.Repositories;

public class MaterialRepository : IMaterialRepository
{
    private readonly AppDbContext _context;

    public MaterialRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Material> AddAsync(Material material)
    {
        await _context.Materials.AddAsync(material);

        await _context.SaveChangesAsync();

        return material;
    }

    public async Task<Material?> GetByIdAsync(Guid id)
    {
        return await _context.Materials
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<List<Material>> GetAllAsync()
    {
        return await _context.Materials
            .Where(x => x.DeletedAt == null)
            .OrderBy(x => x.MaterialName)
            .ToListAsync();
    }

    public async Task UpdateAsync(Material material)
    {
        _context.Materials.Update(material);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Material material)
    {
        _context.Materials.Remove(material);

        await _context.SaveChangesAsync();
    }
}