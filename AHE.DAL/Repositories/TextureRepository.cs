using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AHE.DAL.Repositories;

public class TextureRepository : ITextureRepository
{
    private readonly AppDbContext _context;

    public TextureRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Texture> AddAsync(Texture texture)
    {
        await _context.Textures.AddAsync(texture);

        await _context.SaveChangesAsync();

        return texture;
    }

    public async Task<Texture?> GetByIdAsync(Guid id)
    {
        return await _context.Textures
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<List<Texture>> GetAllAsync()
    {
        return await _context.Textures
            .Where(x => x.DeletedAt == null)
            .OrderBy(x => x.TextureName)
            .ToListAsync();
    }

    public async Task UpdateAsync(Texture texture)
    {
        _context.Textures.Update(texture);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Texture texture)
    {
        _context.Textures.Remove(texture);

        await _context.SaveChangesAsync();
    }
}