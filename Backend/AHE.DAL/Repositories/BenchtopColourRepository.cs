using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories;

public class BenchtopColourRepository : IBenchtopColourRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<BenchtopColourRepository> _logger;

    public BenchtopColourRepository(AppDbContext context, ILogger<BenchtopColourRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<BenchtopColour>> GetByRegionIdAsync(Guid regionId)
    {
        if (regionId == Guid.Empty)
        {
            _logger.LogWarning(
                "Benchtop colour retrieval failed because the region ID is empty.");

            throw new ArgumentException(
                "Region ID cannot be empty.",
                nameof(regionId));
        }

        try
        {
            _logger.LogInformation(
                "Fetching benchtop colours for region ID {RegionId}.",
                regionId);

            var benchtopColours = await _context.BenchtopColour
                .AsNoTracking()
                .Where(x =>
                    x.DeletedAt == null &&
                    x.Regions.Any(r => r.Id == regionId))
                .OrderBy(x => x.BenchtopColourName)
                .ToListAsync();

            _logger.LogInformation(
                "Successfully retrieved {ColourCount} benchtop colours for region ID {RegionId}.",
                benchtopColours.Count,
                regionId);

            return benchtopColours;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while fetching benchtop colours for region ID {RegionId}.",
                regionId);

            throw;
        }
    }

}
