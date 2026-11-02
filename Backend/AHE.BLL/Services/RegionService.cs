using AHE.BLL.DTOs.Regions;
using AHE.BLL.Interfaces;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services
{
    public class RegionService : IRegionService
    {
        private readonly IRegionRepository _regionRepository;
        private readonly ILogger<RegionService> _logger;

        public RegionService(
            IRegionRepository regionRepository,
            ILogger<RegionService> logger)
        {
            _regionRepository = regionRepository;
            _logger = logger;
        }


        public async Task<List<RegionResponse>> GetAllActiveAsync()
        {
            try
            {
                var regions =
                    await _regionRepository.GetAllActiveAsync();

                if (regions is null || !regions.Any())
                {
                    return new List<RegionResponse>();
                }

                return regions.Select(r => new RegionResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                    Code = r.Code,
                    Description = r.Description
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving active regions.");

                throw new InvalidOperationException(
                    "An error occurred while retrieving active regions.",
                    ex);
            }
        }
    }
}
