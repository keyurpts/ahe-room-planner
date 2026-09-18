using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface ICategoryRepository
    {
        Task<List<Category>> GetAllAsync();

        Task<Category?> GetByIdAsync(Guid id);

        Task<Category?> GetByNameAsync(string categoryName);

        Task AddAsync(Category category);

        Task UpdateAsync(Category category);
    }
}
