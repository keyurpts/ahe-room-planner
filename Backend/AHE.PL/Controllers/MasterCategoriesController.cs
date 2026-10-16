using AHE.BLL.DTOs.MasterCategories;
using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AHE.PL.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class MasterCategoriesController : ControllerBase
{
    private readonly IMasterCategoryService _masterCategoryService;

    public MasterCategoriesController(
        IMasterCategoryService masterCategoryService)
    {
        _masterCategoryService = masterCategoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var masterCategories =
            await _masterCategoryService.GetAllAsync();

        return Ok(masterCategories);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var masterCategory =
            await _masterCategoryService.GetByIdAsync(id);

        if (masterCategory == null)
            return NotFound();

        return Ok(masterCategory);
    }

    [HttpPost]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateMasterCategoryRequest request)
    {
        var masterCategory =
            await _masterCategoryService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = masterCategory.Id },
            masterCategory);
    }

    [HttpPut("{id:guid}")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateMasterCategoryRequest request)
    {
        var masterCategory =
            await _masterCategoryService.UpdateAsync(id, request);

        if (masterCategory == null)
            return NotFound();

        return Ok(masterCategory);
    }

    [HttpDelete("{id:guid}")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted =
            await _masterCategoryService.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}