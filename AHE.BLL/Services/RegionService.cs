using AHE.BLL.DTOs.Regions;
using AHE.BLL.Interfaces;
using AHE.DAL.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services
{
    public class RegionService : IRegionService
    {
        private readonly IRegionRepository _regionRepository;

        public RegionService(
            IRegionRepository regionRepository)
        {
            _regionRepository = regionRepository;
        }


        public async Task<List<RegionResponse>> GetAllActiveAsync()
        {
            var regions =
                await _regionRepository.GetAllActiveAsync();

            return regions.Select(r => new RegionResponse
            {
                Id = r.Id,
                Name = r.Name,
                Code = r.Code,
                Description = r.Description
            }).ToList();
        }
    }
}
