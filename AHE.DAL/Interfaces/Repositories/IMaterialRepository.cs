using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IMaterialRepository
    {
        Task<Material> AddAsync(Material material);

        Task<Material?> GetByIdAsync(Guid id);

        Task<List<Material>> GetAllAsync();

        Task UpdateAsync(Material material);

        Task DeleteAsync(Material material);
    }
}
