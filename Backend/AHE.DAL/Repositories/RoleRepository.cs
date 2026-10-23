using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RoleRepository> _logger;



        public RoleRepository(AppDbContext context, ILogger<RoleRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Role?> GetByNameAsync(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                _logger.LogWarning(
                    "Cannot retrieve role because the name is null or empty.");

                return null;
            }

            try
            {
                var role = await _context.Roles
                    .FirstOrDefaultAsync(r => r.Name == name);

                if (role == null)
                {
                    _logger.LogWarning(
                        "No role found with Name: {RoleName}.",
                        name);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved role with Name: {RoleName}.",
                    name);

                return role;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving role with Name: {RoleName}.",
                    name);

                throw;
            }
        }
    }
}
