using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface ITextureRepository
    {
        Task<Texture> AddAsync(Texture texture);

        Task<Texture?> GetByIdAsync(Guid id);

        Task<List<Texture>> GetAllAsync();

        Task UpdateAsync(Texture texture);

        Task DeleteAsync(Texture texture);
    }
}
