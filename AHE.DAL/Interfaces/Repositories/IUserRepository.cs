using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string emailNormalized);

        Task AddAsync(User user);

        Task<User?> GetByIdAsync(Guid id);

    }
}
