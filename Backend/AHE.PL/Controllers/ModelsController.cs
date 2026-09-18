using AHE.BLL.DTOs.Models;
using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AHE.PL.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModelsController : ControllerBase
{
    private readonly IModelService _modelService;

    public ModelsController(IModelService modelService)
    {
        _modelService = modelService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var models =
            await _modelService.GetAllAsync();

        return Ok(models);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var model =
            await _modelService.GetByIdAsync(id);

        if (model == null)
        {
            return NotFound();
        }

        return Ok(model);
    }

    //[HttpGet("category/{categoryId:guid}")]
    //public async Task<IActionResult> GetByCategory(
    //    Guid categoryId)
    //{
    //    var models =
    //        await _modelService
    //            .GetByCategoryIdAsync(categoryId);

    //    return Ok(models);
    //}

    [HttpGet("category/{categoryId:guid}")]
    public async Task<IActionResult> GetByCategory(
    Guid categoryId)
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var result =
            await _modelService
                .GetByCategoryForUserAsync(
                    userId,
                    categoryId);

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateModelRequest request)
    {
        var model =
            await _modelService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = model.Id },
            model);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateModelRequest request)
    {
        var model =
            await _modelService.UpdateAsync(
                id,
                request);

        if (model == null)
        {
            return NotFound();
        }

        return Ok(model);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted =
            await _modelService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}