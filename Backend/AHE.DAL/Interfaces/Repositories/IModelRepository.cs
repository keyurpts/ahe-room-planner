using System;
using System.Collections.Generic;
using System.Text;
using AHE.DAL.Entities;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IModelRepository
    {
        Task<List<Model>> GetAllAsync();

        Task<List<Model>> GetByCategoryIdAsync(Guid categoryId);

        Task<Model?> GetByIdAsync(Guid id);

        Task AddAsync(Model model);

        Task UpdateAsync(Model model);

        Task<List<Model>> GetByCategoryAndRegionAsync(
           Guid categoryId,
           Guid regionId);
    }
}
