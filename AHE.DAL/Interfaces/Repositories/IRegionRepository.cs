using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IRegionRepository
    {
        Task<Region?> GetByCodeAsync(string code);

        Task<Region?> GetByIdAsync(Guid id);

        Task<List<Region>> GetAllActiveAsync();
    }
}
