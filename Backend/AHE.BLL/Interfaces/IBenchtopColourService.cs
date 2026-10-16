using AHE.BLL.DTOs.BenchtopColour;
using AHE.BLL.DTOs.Textures;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IBenchtopColourService
    {
      
        Task<List<BenchtopColourResponse>> GetByRegionIdAsync(Guid regionId);
    }
}
