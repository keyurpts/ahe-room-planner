using AHE.BLL.DTOs.Textures;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.PL.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class TexturesController : ControllerBase
{
    private readonly ITextureService _textureService;
    private readonly ILogger<TexturesController> _logger;

    public TexturesController(
        ITextureService textureService,
        ILogger<TexturesController> logger)
    {
        _textureService = textureService;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(TextureResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        CreateTextureRequest request)
    {
        try
        {
            var result = await _textureService.CreateAsync(request);

            return StatusCode(
                StatusCodes.Status201Created,
                result);
        }
        catch (ArgumentNullException ex)
        {
            _logger.LogWarning(
                ex,
                "Texture creation failed because the request was null.");

            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid request while creating a texture.");

            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating the texture.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An error occurred while creating the texture."
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An unexpected error occurred while creating the texture.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred."
                });
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<TextureResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var result = await _textureService.GetAllAsync();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An unexpected error occurred while retrieving textures.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving textures."
                });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var result = await _textureService.GetByIdAsync(id);

            if (result is null)
            {
                return NotFound(new
                {
                    Message = $"Texture with ID '{id}' was not found."
                });
            }

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid texture ID supplied: {TextureId}.",
                id);

            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An unexpected error occurred while retrieving texture {TextureId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving the texture."
                });
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TextureResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateTextureRequest request)
    {
        try
        {
            var result = await _textureService.UpdateAsync(id, request);

            if (result is null)
            {
                return NotFound(new
                {
                    Message = $"Texture with ID '{id}' was not found."
                });
            }

            return Ok(result);
        }
        catch (ArgumentNullException ex)
        {
            _logger.LogWarning(
                ex,
                "Texture update failed because the request was null.");

            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid input while updating texture {TextureId}.",
                id);

            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(
                ex,
                "Texture {TextureId} cannot be updated due to its current state.",
                id);

            return Conflict(new
            {
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An unexpected error occurred while updating texture {TextureId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while updating the texture."
                });
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _textureService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    Message = $"Texture with ID '{id}' was not found."
                });
            }

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid texture ID supplied for deletion: {TextureId}.",
                id);

            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An unexpected error occurred while deleting texture {TextureId}.",
                id);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while deleting the texture."
                });
        }
    }

    [HttpGet("region/{regionId:guid}")]
    public async Task<ActionResult<List<Texture>>> GetByRegionId(Guid regionId)
    {
        try
        {
            var result =
                await _textureService.GetByRegionIdAsync(regionId);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid region ID supplied: {RegionId}.",
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
                "An unexpected error occurred while retrieving textures for region {RegionId}.",
                regionId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving textures for the region."
                });
        }
    }
}