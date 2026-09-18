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

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "File is required."
            });
        }

        await using var stream = file.OpenReadStream();

        var blobUrl =
            await _storageService.UploadAsync(
                stream,
                file.FileName,
                file.ContentType,
                cancellationToken);

        return Ok(new
        {
            success = true,
            fileName = file.FileName,
            url = blobUrl
        });
    }

    [HttpGet("{*fileName}")]
    public async Task<IActionResult> Download(
        string fileName,
        CancellationToken cancellationToken)
    {
        var stream =
            await _storageService.DownloadAsync(
                fileName,
                cancellationToken);

        if (stream == null)
        {
            return NotFound(new
            {
                message = "File not found."
            });
        }

        return File(
            stream,
            "application/octet-stream",
            Path.GetFileName(fileName));
    }

    [HttpDelete("{*fileName}")]
    public async Task<IActionResult> Delete(
        string fileName,
        CancellationToken cancellationToken)
    {
        var deleted =
            await _storageService.DeleteAsync(
                fileName,
                cancellationToken);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "File not found."
            });
        }

        return Ok(new
        {
            success = true,
            message = "File deleted successfully."
        });
    }

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

    [HttpPost("{modelId:guid}/textures/{textureId:guid}/thumbnail")]
    public async Task<IActionResult> UploadVariantThumbnail(
        Guid modelId,
        Guid textureId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "File is required."
            });
        }

        await using var stream = file.OpenReadStream();

        var blobUrl =
            await _storageService.UploadVariantThumbnailAsync(
                modelId,
                textureId,
                stream,
                file.FileName,
                file.ContentType,
                cancellationToken);

        return Ok(new
        {
            success = true,
            fileName = file.FileName,
            url = blobUrl
        });
    }

    [HttpGet("thumbnails/{categoryId:guid}/{modelId:guid}/{textureId:guid}/download-url")]
    [HttpGet("{categoryId:guid}/{modelId:guid}/{textureId:guid}/download-url")]
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

    [HttpGet("{modelId:guid}/textures/{textureId:guid}/download-url")]
    public async Task<IActionResult> GetVariantThumbnailDownloadUrlByModel(
        Guid modelId,
        Guid textureId,
        [FromQuery] Guid? categoryId,
        CancellationToken cancellationToken)
    {
        var result =
            await _storageService.GenerateThumbnailDownloadUrlAsync(
                categoryId ?? Guid.Empty,
                modelId,
                textureId,
                cancellationToken);

        return Ok(result);
    }

    [HttpGet("{textureId}/texture/download-url")]
    public async Task<IActionResult> GetTextureDownloadUrl(Guid textureId)
    {
        var response =
            await _storageService.GenerateTextureDownloadUrlAsync(textureId);

        return Ok(response);
    }
}
