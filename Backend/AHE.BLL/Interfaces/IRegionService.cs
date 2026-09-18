using AHE.BLL.DTOs.Regions;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IRegionService
    {
        Task<List<RegionResponse>> GetAllActiveAsync();
    }
}
