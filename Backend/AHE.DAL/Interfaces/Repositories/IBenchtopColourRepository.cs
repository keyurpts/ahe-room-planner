using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IBenchtopColourRepository
    {
        Task<List<BenchtopColour>> GetByRegionIdAsync(Guid regionId);
    }
}
