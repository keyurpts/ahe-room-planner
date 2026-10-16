using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class MasterCategoryRepository : IMasterCategoryRepository
    {
        private readonly AppDbContext _context;

        public MasterCategoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MasterCategory>> GetAllAsync()
        {
            return await _context.MasterCategories
                .AsNoTracking()
                .Where(c => c.IsActive && c.DeletedAt == null)
                .OrderBy(c => c.MasterCategoryName)
                .ToListAsync();
        }

        public async Task<MasterCategory?> GetByIdAsync(Guid id)
        {
            return await _context.MasterCategories
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.DeletedAt == null);
        }

        public async Task AddAsync(MasterCategory masterCategory)
        {
            await _context.MasterCategories.AddAsync(masterCategory);

            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(MasterCategory masterCategory)
        {
            _context.MasterCategories.Update(masterCategory);

            await _context.SaveChangesAsync();
        }

        public async Task<MasterCategory?> GetByNameAsync(
            string masterCategoryName)
        {
            return await _context.MasterCategories
                .FirstOrDefaultAsync(c =>
                    c.MasterCategoryName == masterCategoryName &&
                    c.DeletedAt == null);
        }
    }
}
