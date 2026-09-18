using AHE.BLL.DTOs.Projects;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepository;
        private readonly IUserRepository _userRepository;

        public ProjectService(
            IProjectRepository projectRepository,
            IUserRepository userRepository)
        {
            _projectRepository = projectRepository;
            _userRepository = userRepository;
        }

        public async Task<ProjectResponse> CreateProjectAsync(
            Guid userId,
            CreateProjectRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ProjectName))
            {
                throw new ArgumentException(
                    "Project name is required.");
            }

            if (request.Project2DJson == null)
            {
                throw new ArgumentException(
                    "Project2DJson is required.");
            }

            if (request.Project3DJson == null)
            {
                throw new ArgumentException(
                    "Project3DJson is required.");
            }

            // Get authenticated user
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
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

                CreatedAt = now,
                UpdatedAt = now,

                DeletedAt = null
            };

            var createdProject =
                await _projectRepository.CreateAsync(project);

            return new ProjectResponse
            {
                Id = createdProject.Id,

                ProjectName = createdProject.ProjectName,

                UserId = createdProject.UserId,

                RegionId = createdProject.RegionId,

                Status = createdProject.Status,

                CreatedAt = createdProject.CreatedAt,

                UpdatedAt = createdProject.UpdatedAt
            };
        }


        public async Task<IEnumerable<ProjectDto>> GetAllAsync()
        {
            var projects = await _projectRepository.GetAllAsync();

            return projects.Select(project => new ProjectDto
            {
                Id = project.Id,
                UserId = project.UserId,
                RegionId = project.RegionId,
                ProjectName = project.ProjectName,
                Project2DJson = project.Project2DJson,
                Project3DJson = project.Project3DJson,
                ProjectMetadata = project.ProjectMetadata,
                Status = project.Status,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt
            });
        }

        public async Task<IEnumerable<ProjectDto>> GetMyProjectsAsync(Guid userId)
        {
            var projects = await _projectRepository.GetByUserIdAsync(userId);

            return projects.Select(project => new ProjectDto
            {
                Id = project.Id,
                UserId = project.UserId,
                RegionId = project.RegionId,
                ProjectName = project.ProjectName,
                Project2DJson = project.Project2DJson,
                Project3DJson = project.Project3DJson,
                ProjectMetadata = project.ProjectMetadata,
                Status = project.Status,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt
            });
        }

        public async Task<ProjectResponse?> UpdateProject2DJsonAsync(
           Guid projectId,
           Guid userId,
           UpdateProject2DJsonRequest request)
        {
            if (request.Project2DJson == null)
            {
                throw new ArgumentException(
                    "Project2DJson is required.");
            }

            var project =
                await _projectRepository.GetByIdAsync(projectId);

            if (project == null)
            {
                return null;
            }

            // Make sure the project belongs to the authenticated user
            if (project.UserId != userId)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to update this project.");
            }

            // Make sure the project is not deleted
            if (project.DeletedAt != null)
            {
                throw new InvalidOperationException(
                    "Cannot update a deleted project.");
            }

            project.Project2DJson = request.Project2DJson;
            project.UpdatedAt = DateTime.UtcNow;

            await _projectRepository.UpdateAsync(project);

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

        public async Task<Project?> UpdateProject3DJsonAsync(
          Guid projectId,
          Guid userId,
          UpdateProject3DJsonRequest request)
        {
            var project = await _projectRepository.GetByIdAsync(projectId);

            if (project == null || project.UserId != userId)
            {
                return null;
            }

            project.Project3DJson = request.Project3DJson;

            await _projectRepository.UpdateAsync(project);

            return project;
        }
    }
}
