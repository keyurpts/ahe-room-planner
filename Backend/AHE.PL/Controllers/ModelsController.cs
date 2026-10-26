using AHE.BLL.DTOs.Models;
using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AHE.PL.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class ModelsController : ControllerBase
{
    private readonly IModelService _modelService;
    private readonly ILogger<ModelsController> _logger;

    public ModelsController(IModelService modelService, ILogger<ModelsController> logger)
    {
        _modelService = modelService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ModelResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var models =
                await _modelService.GetAllAsync();

            return Ok(models);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving models.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving models."
                });
        }
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ModelResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest("Model ID cannot be an empty GUID.");

        try
        {
            var model =
                await _modelService.GetByIdAsync(id);

            if (model == null)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} was not found.",
                    id);

                return NotFound();
            }

            return Ok(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving model with ID {ModelId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving the model."
                });
        }
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

    // this API currently requires authorization so that the models for only those category belonging to the users region are returned
    [HttpGet("category/{categoryId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCategory(
    Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            return BadRequest("Category ID cannot be an empty GUID.");

        var userIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdClaim, out var userId) ||
            userId == Guid.Empty)
        {
            _logger.LogWarning(
                "Unable to retrieve models because the authenticated user's ID claim is missing or invalid.");

            return Unauthorized();
        }

        try
        {
            var result =
                await _modelService.GetByCategoryForUserAsync(
                    userId,
                    categoryId);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving models for user {UserId} and category {CategoryId}.",
                userId,
                categoryId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving models."
                });
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(ModelResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateModelRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var model =
                await _modelService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = model.Id },
                model);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating a model.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while creating the model."
                });
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ModelResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateModelRequest request)
    {
        if (id == Guid.Empty)
            return BadRequest("Model ID cannot be an empty GUID.");

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var model =
                await _modelService.UpdateAsync(
                    id,
                    request);

            if (model == null)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} was not found for update.",
                    id);

                return NotFound();
            }

            return Ok(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating model with ID {ModelId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while updating the model."
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
            return BadRequest("Model ID cannot be an empty GUID.");

        try
        {
            var deleted =
                await _modelService.DeleteAsync(id);

            if (!deleted)
            {
                _logger.LogWarning(
                    "Model with ID {ModelId} was not found for deletion.",
                    id);

                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while deleting model with ID {ModelId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while deleting the model."
                });
        }
    }
}