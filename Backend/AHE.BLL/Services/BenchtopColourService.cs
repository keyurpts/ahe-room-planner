using AHE.BLL.DTOs.BenchtopColour;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services;

public class BenchtopColourService : IBenchtopColourService
{
    private readonly IBenchtopColourRepository _benchtopColourRepository;


    public BenchtopColourService(
        IBenchtopColourRepository benchtopColourRepository)
    {
        _benchtopColourRepository = benchtopColourRepository;
    }

    public async Task<List<BenchtopColourResponse>> GetByRegionIdAsync(Guid regionId)
    {
        var benchtopColours = await _benchtopColourRepository.GetByRegionIdAsync(regionId);

        return benchtopColours
            .Select(MapToResponse)
            .ToList();
    }

    private static BenchtopColourResponse MapToResponse(
    BenchtopColour benchtopColour)
    {
        return new BenchtopColourResponse
        {
            Id = benchtopColour.Id,

            BenchtopColourName = benchtopColour.BenchtopColourName,

            AssetPath = benchtopColour.AssetPath,

            BenchtopColourMetadata = benchtopColour.BenchtopColourMetadata
        };
    }
}
