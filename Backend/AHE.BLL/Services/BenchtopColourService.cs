using AHE.BLL.DTOs.BenchtopColour;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services;

public class BenchtopColourService : IBenchtopColourService
{
    private readonly IBenchtopColourRepository _benchtopColourRepository;
    private readonly ILogger<BenchtopColourService> _logger;


    public BenchtopColourService(
        IBenchtopColourRepository benchtopColourRepository,
        ILogger<BenchtopColourService> logger)
    {
        _benchtopColourRepository = benchtopColourRepository;
        _logger = logger;
    }

    public async Task<List<BenchtopColourResponse>> GetByRegionIdAsync(Guid regionId)
    {
        if (regionId == Guid.Empty)
        {
            throw new ArgumentException(
                "Region ID cannot be empty.",
                nameof(regionId));
        }

        try
        {
            var benchtopColours =
                await _benchtopColourRepository
                    .GetByRegionIdAsync(regionId);

            if (benchtopColours is null || !benchtopColours.Any())
            {
                return new List<BenchtopColourResponse>();
            }

            return benchtopColours
                .Select(MapToResponse)
                .ToList();
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error retrieving benchtop colours for region {RegionId}.",
                regionId);

            throw new InvalidOperationException(
                "An error occurred while retrieving benchtop colours.",
                ex);
        }
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
