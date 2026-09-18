using AHE.BLL.DTOs.Textures;
using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TexturesController : ControllerBase
{
    private readonly ITextureService _textureService;

    public TexturesController(
        ITextureService textureService)
    {
        _textureService = textureService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateTextureRequest request)
    {
        var result =
            await _textureService.CreateAsync(request);

        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result =
            await _textureService.GetAllAsync();

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result =
            await _textureService.GetByIdAsync(id);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateTextureRequest request)
    {
        var result =
            await _textureService
                .UpdateAsync(id, request);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result =
            await _textureService.DeleteAsync(id);

        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}