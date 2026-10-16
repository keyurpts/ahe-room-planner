using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories;

public class BenchtopColourRepository : IBenchtopColourRepository
{
    private readonly AppDbContext _context;

    public BenchtopColourRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<BenchtopColour>> GetByRegionIdAsync(Guid regionId)
    {
        return await _context.BenchtopColour
            .AsNoTracking()
            .Where(x => x.RegionId == regionId && x.DeletedAt == null)
            .OrderBy(x => x.BenchtopColourName)
            .ToListAsync();
    }

}
