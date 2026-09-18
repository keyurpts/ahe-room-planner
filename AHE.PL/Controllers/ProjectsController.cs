using AHE.BLL.DTOs.Projects;
using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AHE.PL.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject(
        [FromBody] CreateProjectRequest request)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized();
        }

        var project =
            await _projectService.CreateProjectAsync(
                userId,
                request);

        return CreatedAtAction(
            nameof(CreateProject),
            new { id = project.Id },
            project);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetAll()
    {
        var projects = await _projectService.GetAllAsync();

        return Ok(projects);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetMyProjects()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var projects = await _projectService.GetMyProjectsAsync(userId);

        return Ok(projects);
    }

    [HttpPut("{projectId:guid}/2d-json")]
    public async Task<IActionResult> UpdateProject2DJson(
    Guid projectId,
    [FromBody] UpdateProject2DJsonRequest request)
    {
        var userIdClaim =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized();
        }

        var project =
            await _projectService.UpdateProject2DJsonAsync(
                projectId,
                userId,
                request);

        if (project == null)
        {
            return NotFound();
        }

        return Ok(project);
    }

    [HttpPut("{projectId:guid}/3d-json")]
    public async Task<IActionResult> UpdateProject3DJson(
    Guid projectId,
    [FromBody] UpdateProject3DJsonRequest request)
    {
        var userIdClaim =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized();
        }

        var project =
            await _projectService.UpdateProject3DJsonAsync(
                projectId,
                userId,
                request);

        if (project == null)
        {
            return NotFound();
        }

        return Ok(project);
    }
}