using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IProjectRepository
    {
        Task<Project> CreateAsync(Project project);

        Task<IEnumerable<Project>> GetAllAsync();

        Task<IEnumerable<Project>> GetByUserIdAsync(Guid userId);

        Task UpdateAsync(Project project);

        Task<Project?> GetByIdAsync(Guid id);
    }
}
