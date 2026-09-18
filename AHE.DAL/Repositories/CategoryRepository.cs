using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly AppDbContext _context;

        public CategoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Category>> GetAllAsync()
        {
            return await _context.Categories
                .Where(c => c.IsActive && c.DeletedAt == null)
                .OrderBy(c => c.CategoryName)
                .ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(Guid id)
        {
            return await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.DeletedAt == null);
        }

        public async Task<Category?> GetByNameAsync(
            string categoryName)
        {
            return await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.CategoryName == categoryName &&
                    c.DeletedAt == null);
        }

        public async Task AddAsync(Category category)
        {
            await _context.Categories.AddAsync(category);

            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Category category)
        {
            _context.Categories.Update(category);

            await _context.SaveChangesAsync();
        }
    }
}
