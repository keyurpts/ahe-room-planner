using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class RegionRepository : IRegionRepository
    {
        private readonly AppDbContext _context;

        public RegionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Region?> GetByCodeAsync(string code)
        {
            return await _context.Regions
                .FirstOrDefaultAsync(r => r.Code == code);
        }

        public async Task<Region?> GetByIdAsync(Guid id)
        {
            return await _context.Regions
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<Region>> GetAllActiveAsync()
        {
            return await _context.Regions
                .Where(r => r.IsActive)
                .OrderBy(r => r.Name)
                .ToListAsync();
        }
    }
}
