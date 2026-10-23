using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class RegionRepository : IRegionRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RegionRepository> _logger;


        public RegionRepository(AppDbContext context, ILogger<RegionRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Region?> GetByCodeAsync(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                _logger.LogWarning(
                    "Cannot retrieve region because the code is null or empty.");

                return null;
            }

            try
            {
                var region = await _context.Regions
                    .FirstOrDefaultAsync(r => r.Code == code);

                if (region == null)
                {
                    _logger.LogWarning(
                        "No region found with Code: {RegionCode}.",
                        code);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved region with Code: {RegionCode}.",
                    code);

                return region;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving region with Code: {RegionCode}.",
                    code);

                throw;
            }
        }

        public async Task<Region?> GetByIdAsync(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning(
                    "Cannot retrieve region because the ID is empty.");

                return null;
            }

            try
            {
                var region = await _context.Regions
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (region == null)
                {
                    _logger.LogWarning(
                        "No region found with Id: {RegionId}.",
                        id);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved region with Id: {RegionId}.",
                    id);

                return region;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving region with Id: {RegionId}.",
                    id);

                throw;
            }
        }

        public async Task<List<Region>> GetAllActiveAsync()
        {
            try
            {
                var regions = await _context.Regions
                    .Where(r => r.IsActive)
                    .OrderBy(r => r.Name)
                    .ToListAsync();

                _logger.LogInformation(
                    "Successfully retrieved {RegionCount} active regions.",
                    regions.Count);

                return regions;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving active regions.");

                throw;
            }
        }
    }
}
