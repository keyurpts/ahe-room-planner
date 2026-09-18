using AHE.BLL.Interfaces;
using AHE.BLL.Services;
using Microsoft.AspNetCore.Mvc;

namespace AHE.PL.Controllers;

[ApiController]
[Route("api/storage")]
public class StorageController : ControllerBase
{
    private readonly IStorageService _storageService;

    public StorageController(IStorageService storageService)
    {
        _storageService = storageService;
    }

    // test storage service connection
    [HttpGet("test-connection")]
    public async Task<IActionResult> TestConnection(
        CancellationToken cancellationToken)
    {
        var connected =
            await _storageService.TestConnectionAsync(
                cancellationToken);

        return Ok(new
        {
            success = connected,
            message = connected
                ? "Successfully connected to Azure Blob Storage."
                : "Unable to connect to Azure Blob Storage."
        });
    }

    // upload model
    [HttpGet("{modelId:guid}/upload-url")]
    public async Task<IActionResult> GetUploadUrl(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result =
            await _storageService.GenerateUploadUrlAsync(
                modelId,
                cancellationToken);

        return Ok(result);
    }

    // download model
    [HttpGet("{modelId:guid}/download-url")]
    public async Task<IActionResult> GetDownloadUrl(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result =
            await _storageService.GenerateDownloadUrlAsync(
                modelId,
                cancellationToken);

        return Ok(result);
    }

    //download texture
    [HttpGet("{textureId}/texture/download-url")]
    public async Task<IActionResult> GetTextureDownloadUrl(Guid textureId)
    {
        var response =
            await _storageService.GenerateTextureDownloadUrlAsync(textureId);

        return Ok(response);
    }

    // TO DO : upload texture 

    // download thumbnail
    [HttpGet("thumbnails/{categoryId:guid}/{modelId:guid}/{textureId:guid}/download-url")]
    public async Task<IActionResult> GetVariantThumbnailDownloadUrl(
        Guid categoryId,
        Guid modelId,
        Guid textureId,
        CancellationToken cancellationToken)
    {
        var result =
            await _storageService.GenerateThumbnailDownloadUrlAsync(
                categoryId,
                modelId,
                textureId,
                cancellationToken);

        return Ok(result);
    }

    // upload thumbnail
    [HttpGet("{modelId:guid}/textures/{textureId:guid}/upload-url")]
    public async Task<IActionResult> GetVariantThumbnailUploadUrl(
        Guid modelId,
        Guid textureId,
        [FromQuery] string? extension,
        CancellationToken cancellationToken)
    {
        var result =
            await _storageService.GenerateThumbnailUploadUrlAsync(
                modelId,
                textureId,
                extension,
                cancellationToken);

        return Ok(result);
    }
}
