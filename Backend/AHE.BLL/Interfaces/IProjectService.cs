using AHE.BLL.DTOs.Projects;
using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IProjectService
    {
        Task<ProjectResponse> CreateProjectAsync(
            Guid userId,
            CreateProjectRequest request);

        Task<IEnumerable<ProjectDto>> GetAllAsync();

        Task<IEnumerable<ProjectDto>> GetMyProjectsAsync(Guid userId);

        Task<ProjectResponse?> UpdateProject2DJsonAsync(
          Guid projectId,
          Guid userId,
          UpdateProject2DJsonRequest request);

        Task<Project?> UpdateProject3DJsonAsync(
          Guid projectId,
          Guid userId,
          UpdateProject3DJsonRequest request);
    }
}
