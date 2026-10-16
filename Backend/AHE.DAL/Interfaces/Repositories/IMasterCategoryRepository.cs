using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IMasterCategoryRepository
    {
        Task<List<MasterCategory>> GetAllAsync();

        Task<MasterCategory?> GetByIdAsync(Guid id);

        Task AddAsync(MasterCategory masterCategory);

        Task UpdateAsync(MasterCategory masterCategory);

        Task<MasterCategory?> GetByNameAsync(string categoryName);
    }
}
