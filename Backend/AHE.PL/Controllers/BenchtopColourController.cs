using AHE.BLL.DTOs.BenchtopColour;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.PL.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class BenchtopColourController : ControllerBase
{
    private readonly IBenchtopColourService _benchtopColourService;
    private readonly ILogger<BenchtopColourController> _logger;

    public BenchtopColourController(
        IBenchtopColourService benchtopColourService, ILogger<BenchtopColourController> logger)
    {
        _benchtopColourService = benchtopColourService;
        _logger = logger;
    }

    [HttpGet("region/{regionId:guid}")]
    public async Task<IActionResult> GetByRegionId(Guid regionId)
    {
        if (regionId == Guid.Empty)
        {
            return BadRequest(new
            {
                Message = "Region ID cannot be empty."
            });
        }

        try
        {
            var benchtopColours =
                await _benchtopColourService.GetByRegionIdAsync(regionId);

            return Ok(benchtopColours);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid request while retrieving benchtop colours for region {RegionId}.",
                regionId);

            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving benchtop colours for region {RegionId}.",
                regionId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving benchtop colours."
                });
        }
    }
}