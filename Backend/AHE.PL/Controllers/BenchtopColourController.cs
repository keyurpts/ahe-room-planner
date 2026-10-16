using AHE.BLL.DTOs.BenchtopColour;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class BenchtopColourController : ControllerBase
{
    private readonly IBenchtopColourService _benchtopColourService;

    public BenchtopColourController(
        IBenchtopColourService benchtopColourService)
    {
        _benchtopColourService = benchtopColourService;
    }

    [HttpGet("region/{regionId:guid}")]
    public async Task<IActionResult> GetByRegionId(Guid regionId)
    {
        var benchtopColours = await _benchtopColourService.GetByRegionIdAsync(regionId);

        return Ok(benchtopColours);
    }
}