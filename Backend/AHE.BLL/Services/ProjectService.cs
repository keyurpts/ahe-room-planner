using AHE.BLL.DTOs.Projects;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace AHE.BLL.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ProjectService> _logger;

        public ProjectService(
            IProjectRepository projectRepository,
            IUserRepository userRepository,
            ILogger<ProjectService> logger)
        {
            _projectRepository = projectRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<ProjectResponse> CreateProjectAsync(
            Guid userId,
            CreateProjectRequest request)
        {
            if (userId == Guid.Empty)
            {
                throw new ArgumentException(
                    "User ID cannot be empty.",
                    nameof(userId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.ProjectName))
            {
                throw new ArgumentException(
                    "Project name is required.",
                    nameof(request.ProjectName));
            }

            if (request.Project2DJson is null)
            {
                throw new ArgumentException(
                    "Project2DJson is required.",
                    nameof(request.Project2DJson));
            }

            if (request.Project3DJson is null)
            {
                throw new ArgumentException(
                    "Project3DJson is required.",
                    nameof(request.Project3DJson));
            }

            try
            {
                // Get authenticated user
                var user = await _userRepository.GetByIdAsync(userId);

                if (user is null)
                {
                    throw new InvalidOperationException(
                        "User not found.");
                }

                if (!user.IsActive)
                {
                    throw new InvalidOperationException(
                        "User is inactive.");
                }

                var now = DateTime.UtcNow;

                var designCode =
                    await _projectRepository
                        .GenerateUniqueDesignCodeAsync();

                var project = new Project
                {
                    Id = Guid.NewGuid(),

                    ProjectName = request.ProjectName.Trim(),

                    UserId = user.Id,

                    // Project inherits the user's region
                    RegionId = user.RegionId,

                    Project2DJson = request.Project2DJson,

                    Project3DJson = request.Project3DJson,

                    ProjectMetadata = request.ProjectMetadata,

                    Status = "Active",

                    DesignCode = designCode,

                    CreatedAt = now,

                    UpdatedAt = now,

                    DeletedAt = null
                };

                var createdProject =
                    await _projectRepository.CreateAsync(project);

                if (createdProject is null)
                {
                    throw new InvalidOperationException(
                        "Project creation failed.");
                }

                _logger.LogInformation(
                    "Project {ProjectId} created successfully for user {UserId}.",
                    createdProject.Id,
                    userId);

                return new ProjectResponse
                {
                    Id = createdProject.Id,

                    ProjectName = createdProject.ProjectName,

                    UserId = createdProject.UserId,

                    RegionId = createdProject.RegionId,

                    Status = createdProject.Status,

                    CreatedAt = createdProject.CreatedAt,

                    UpdatedAt = createdProject.UpdatedAt,

                    DesignCode = createdProject.DesignCode
                };
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (InvalidOperationException)
            {
                // Preserve expected validation and business exceptions.
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while creating a project for user {UserId}.",
                    userId);

                throw new InvalidOperationException(
                    "An error occurred while creating the project.",
                    ex);
            }
        }

        public async Task<ProjectDto?> GetByDesignCodeAsync(string designCode)
        {
            if (string.IsNullOrWhiteSpace(designCode))
            {
                throw new ArgumentException(
                    "Design code is required.",
                    nameof(designCode));
            }

            try
            {
                var createdProject =
                    await _projectRepository
                        .GetByDesignCodeAsync(designCode.Trim());

                if (createdProject is null)
                {
                    _logger.LogWarning(
                        "Project with design code {DesignCode} was not found.",
                        designCode);

                    return null;
                }

                return new ProjectDto
                {
                    Id = createdProject.Id,

                    ProjectName = createdProject.ProjectName,

                    UserId = createdProject.UserId,

                    RegionId = createdProject.RegionId,

                    Status = createdProject.Status,

                    CreatedAt = createdProject.CreatedAt,

                    UpdatedAt = createdProject.UpdatedAt,

                    DesignCode = createdProject.DesignCode,

                    Project2DJson = createdProject.Project2DJson,

                    Project3DJson = createdProject.Project3DJson
                };
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving project with design code {DesignCode}.",
                    designCode);

                throw new InvalidOperationException(
                    "An error occurred while retrieving the project.",
                    ex);
            }
        }


        public async Task<IEnumerable<ProjectDto>> GetAllAsync()
        {
            try
            {
                var projects = await _projectRepository.GetAllAsync();

                if (projects is null || !projects.Any())
                {
                    return new List<ProjectDto>();
                }

                return projects.Select(project => new ProjectDto
                {
                    Id = project.Id,
                    UserId = project.UserId,
                    RegionId = project.RegionId,
                    ProjectName = project.ProjectName,
                    DesignCode = project.DesignCode,
                    Project2DJson = project.Project2DJson,
                    Project3DJson = project.Project3DJson,
                    ProjectMetadata = project.ProjectMetadata,
                    Status = project.Status,
                    CreatedAt = project.CreatedAt,
                    UpdatedAt = project.UpdatedAt
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving all projects.");

                throw new InvalidOperationException(
                    "An error occurred while retrieving projects.",
                    ex);
            }
        }

        
        public async Task<ProjectResponse?> UpdateProject2DJsonAsync(
           Guid projectId,
           Guid userId,
           UpdateProject2DJsonRequest request)
        {
            if (projectId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Project ID cannot be empty.",
                    nameof(projectId));
            }

            if (userId == Guid.Empty)
            {
                throw new ArgumentException(
                    "User ID cannot be empty.",
                    nameof(userId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (request.Project2DJson is null)
            {
                throw new ArgumentException(
                    "Project2DJson is required.",
                    nameof(request.Project2DJson));
            }

            try
            {
                var project =
                    await _projectRepository.GetByIdAsync(projectId);

                if (project is null)
                {
                    _logger.LogWarning(
                        "Project with ID {ProjectId} was not found.",
                        projectId);

                    return null;
                }


                // Verify that the project is not deleted
                if (project.DeletedAt is not null)
                {
                    throw new InvalidOperationException(
                        "Cannot update a deleted project.");
                }

                project.Project2DJson = request.Project2DJson;
                project.UpdatedAt = DateTime.UtcNow;

                await _projectRepository.UpdateAsync(project);

                _logger.LogInformation(
                    "Project {ProjectId} 2D data updated successfully.",
                    projectId);

                return new ProjectResponse
                {
                    Id = project.Id,
                    ProjectName = project.ProjectName,
                    UserId = project.UserId,
                    RegionId = project.RegionId,
                    Status = project.Status,
                    CreatedAt = project.CreatedAt,
                    UpdatedAt = project.UpdatedAt
                };
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while updating 2D data for project {ProjectId}.",
                    projectId);

                throw new InvalidOperationException(
                    "An error occurred while updating the project.",
                    ex);
            }
        }

        public async Task<Project?> UpdateProject3DJsonAsync(
          Guid projectId,
          Guid userId,
          UpdateProject3DJsonRequest request)
        {
            if (projectId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Project ID cannot be empty.",
                    nameof(projectId));
            }

            if (userId == Guid.Empty)
            {
                throw new ArgumentException(
                    "User ID cannot be empty.",
                    nameof(userId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (request.Project3DJson is null)
            {
                throw new ArgumentException(
                    "Project3DJson is required.",
                    nameof(request.Project3DJson));
            }

            try
            {
                var project =
                    await _projectRepository.GetByIdAsync(projectId);

                if (project is null)
                {
                    _logger.LogWarning(
                        "Project with ID {ProjectId} was not found.",
                        projectId);

                    return null;
                }


                // Prevent updates to soft-deleted projects
                if (project.DeletedAt is not null)
                {
                    _logger.LogWarning(
                        "Attempted to update deleted project {ProjectId}.",
                        projectId);

                    throw new InvalidOperationException(
                        "Cannot update a deleted project.");
                }

                project.Project3DJson = request.Project3DJson;
                project.UpdatedAt = DateTime.UtcNow;

                await _projectRepository.UpdateAsync(project);

                _logger.LogInformation(
                    "Project {ProjectId} 3D data updated successfully.",
                    projectId);

                return project;
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while updating 3D data for project {ProjectId}.",
                    projectId);

                throw new InvalidOperationException(
                    "An error occurred while updating the project.",
                    ex);
            }
        }
    }
}
