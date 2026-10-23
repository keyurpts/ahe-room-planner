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
    private readonly ILogger<MasterCategoriesController> _logger;

    public MasterCategoriesController(
        IMasterCategoryService masterCategoryService, ILogger<MasterCategoriesController> logger)
    {
        _masterCategoryService = masterCategoryService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MasterCategoryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var masterCategories =
                await _masterCategoryService.GetAllAsync();

            return Ok(masterCategories);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving master categories.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving master categories."
                });
        }
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MasterCategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest("Master category ID cannot be an empty GUID.");

        try
        {
            var masterCategory =
                await _masterCategoryService.GetByIdAsync(id);

            if (masterCategory == null)
            {
                _logger.LogWarning(
                    "Master category with ID {MasterCategoryId} was not found.",
                    id);

                return NotFound();
            }

            return Ok(masterCategory);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving master category with ID {MasterCategoryId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving the master category."
                });
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(MasterCategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateMasterCategoryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var masterCategory =
                await _masterCategoryService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = masterCategory.Id },
                masterCategory);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating a master category.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while creating the master category."
                });
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MasterCategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateMasterCategoryRequest request)
    {
        if (id == Guid.Empty)
            return BadRequest("Master category ID cannot be an empty GUID.");

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var masterCategory =
                await _masterCategoryService.UpdateAsync(id, request);

            if (masterCategory == null)
            {
                _logger.LogWarning(
                    "Master category with ID {MasterCategoryId} was not found for update.",
                    id);

                return NotFound();
            }

            return Ok(masterCategory);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating master category with ID {MasterCategoryId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while updating the master category."
                });
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest("Master category ID cannot be an empty GUID.");

        try
        {
            var deleted =
                await _masterCategoryService.DeleteAsync(id);

            if (!deleted)
            {
                _logger.LogWarning(
                    "Master category with ID {MasterCategoryId} was not found for deletion.",
                    id);

                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while deleting master category with ID {MasterCategoryId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while deleting the master category."
                });
        }
    }
}