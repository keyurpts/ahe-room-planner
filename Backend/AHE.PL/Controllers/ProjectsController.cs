using AHE.BLL.DTOs.Projects;
using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AHE.PL.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(IProjectService projectService, ILogger<ProjectsController> logger)
    {
        _projectService = projectService;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateProject(
        [FromBody] CreateProjectRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !Guid.TryParse(userIdClaim.Value, out var userId) ||
            userId == Guid.Empty)
        {
            _logger.LogWarning(
                "Unable to create project because the authenticated user's ID claim is missing or invalid.");

            return Unauthorized();
        }

        try
        {
            var project =
                await _projectService.CreateProjectAsync(
                    userId,
                    request);

            return CreatedAtAction(
                nameof(CreateProject),
                new { id = project.Id },
                project);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating a project for user {UserId}.",
                userId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while creating the project."
                });
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProjectResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetAll()
    {
        try
        {
            var projects =
                await _projectService.GetAllAsync();

            return Ok(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving projects.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving projects."
                });
        }
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(IEnumerable<ProjectResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //[Authorize]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetMyProjects()
    {
        var userIdClaim =
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId) ||
            userId == Guid.Empty)
        {
            _logger.LogWarning(
                "Unable to retrieve projects because the authenticated user's ID claim is missing or invalid.");

            return Unauthorized();
        }

        try
        {
            var projects =
                await _projectService.GetMyProjectsAsync(userId);

            return Ok(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving projects for user {UserId}.",
                userId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while retrieving your projects."
                });
        }
    }

    [HttpPut("{projectId:guid}/2d-json")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateProject2DJson(
    Guid projectId,
    [FromBody] UpdateProject2DJsonRequest request)
    {
        if (projectId == Guid.Empty)
            return BadRequest("Project ID cannot be an empty GUID.");

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim =
            User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !Guid.TryParse(userIdClaim.Value, out var userId) ||
            userId == Guid.Empty)
        {
            _logger.LogWarning(
                "Unable to update project 2D JSON because the authenticated user's ID claim is missing or invalid.");

            return Unauthorized();
        }

        try
        {
            var project =
                await _projectService.UpdateProject2DJsonAsync(
                    projectId,
                    userId,
                    request);

            if (project == null)
            {
                _logger.LogWarning(
                    "Project {ProjectId} was not found or is not accessible to user {UserId}.",
                    projectId,
                    userId);

                return NotFound();
            }

            return Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating 2D JSON for project {ProjectId} and user {UserId}.",
                projectId,
                userId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while updating the project's 2D JSON data."
                });
        }
    }

    [HttpPut("{projectId:guid}/3d-json")]
    public async Task<IActionResult> UpdateProject3DJson(
    Guid projectId,
    [FromBody] UpdateProject3DJsonRequest request)
    {
        if (projectId == Guid.Empty)
            return BadRequest("Project ID cannot be an empty GUID.");

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim =
            User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !Guid.TryParse(userIdClaim.Value, out var userId) ||
            userId == Guid.Empty)
        {
            _logger.LogWarning(
                "Unable to update project 3D JSON because the authenticated user's ID claim is missing or invalid.");

            return Unauthorized();
        }

        try
        {
            var project =
                await _projectService.UpdateProject3DJsonAsync(
                    projectId,
                    userId,
                    request);

            if (project == null)
            {
                _logger.LogWarning(
                    "Project {ProjectId} was not found or is not accessible to user {UserId}.",
                    projectId,
                    userId);

                return NotFound();
            }

            return Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while updating 3D JSON for project {ProjectId} and user {UserId}.",
                projectId,
                userId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    Message = "An unexpected error occurred while updating the project's 3D JSON data."
                });
        }
    }

    [HttpGet("{designCode}")]
    public async Task<IActionResult> GetByDesignCode(string designCode)
    {
        if (string.IsNullOrWhiteSpace(designCode))
            return BadRequest("Design code is required.");

        try
        {
            var design =
                await _projectService.GetByDesignCodeAsync(designCode);

            if (design == null)
            {
                _logger.LogWarning(
                    "Design with code {DesignCode} was not found.",
                    designCode);

                return NotFound(new
                {
                    message = $"Design with code '{designCode}' was not found."
                });
            }

            return Ok(design);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving design with code {DesignCode}.",
                designCode);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "An unexpected error occurred while retrieving the design."
                });
        }
    }
}