using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProjectRepository> _logger;


        public ProjectRepository(AppDbContext context, ILogger<ProjectRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        private static string GenerateDesignCode()
        {
            const string letters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            const string numbers = "0123456789";
            const string chars = letters + numbers;

            char[] code = new char[6];

            // Guarantee at least one letter and one number.
            code[0] = letters[RandomNumberGenerator.GetInt32(letters.Length)];
            code[1] = numbers[RandomNumberGenerator.GetInt32(numbers.Length)];

            // Fill the remaining characters randomly.
            for (int i = 2; i < code.Length; i++)
            {
                code[i] = chars[RandomNumberGenerator.GetInt32(chars.Length)];
            }

            // Randomize the positions of the characters.
            for (int i = code.Length - 1; i > 0; i--)
            {
                int j = RandomNumberGenerator.GetInt32(i + 1);
                (code[i], code[j]) = (code[j], code[i]);
            }

            return new string(code);
        }

        public async Task<string> GenerateUniqueDesignCodeAsync()
        {
            try
            {
                string code;

                do
                {
                    code = GenerateDesignCode();
                }
                while (await _context.Projects
                    .AnyAsync(x => x.DesignCode == code));

                return code;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<Project?> GetByDesignCodeAsync(string designCode)
        {
            if (string.IsNullOrWhiteSpace(designCode))
            {
                _logger.LogWarning(
                    "Cannot retrieve project because DesignCode is null or empty.");

                return null;
            }

            try
            {
                return await _context.Projects
                    .FirstOrDefaultAsync(d => d.DesignCode == designCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving the project with DesignCode: {DesignCode}",
                    designCode);

                throw;
            }
        }


        public async Task<Project> CreateAsync(Project project)
        {
            if (project == null)
            {
                _logger.LogWarning(
                    "Cannot create project because the input project is null.");

                throw new ArgumentNullException(nameof(project));
            }

            try
            {
                await _context.Projects.AddAsync(project);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Project created successfully with DesignCode: {DesignCode}",
                    project.DesignCode);

                return project;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while creating the project with DesignCode: {DesignCode}",
                    project.DesignCode);

                throw;
            }
        }

        public async Task<IEnumerable<Project>> GetAllAsync()
        {
            try
            {
                var projects = await _context.Projects
                    .Where(p => p.DeletedAt == null)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation(
                    "Successfully retrieved {ProjectCount} active projects.",
                    projects.Count);

                return projects;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving active projects.");

                throw;
            }
        }

        public async Task<IEnumerable<Project>> GetByUserIdAsync(Guid userId)
        {
            if (userId == Guid.Empty)
            {
                _logger.LogWarning(
                    "Fetching user by id failed because the userId is empty.");

                throw new ArgumentNullException(nameof(userId));
            }

            try
            {
                var projects = await _context.Projects
                    .Where(p => p.UserId == userId && p.DeletedAt == null)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation(
                    "Successfully retrieved {ProjectCount} active projects for UserId: {UserId}.",
                    projects.Count,
                    userId);

                return projects;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving active projects for UserId: {UserId}.",
                    userId);

                throw;
            }
        }

        public async Task UpdateAsync(Project project)
        {
            if (project == null)
            {
                _logger.LogWarning(
                    "Cannot update project because the input project is null.");

                throw new ArgumentNullException(nameof(project));
            }

            try
            {
                _context.Projects.Update(project);

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Project updated successfully with DesignCode: {DesignCode}",
                    project.DesignCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while updating the project with DesignCode: {DesignCode}",
                    project.DesignCode);

                throw;
            }
        }

        public async Task<Project?> GetByIdAsync(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning(
                    "Cannot retrieve project because the project ID is null.");

                throw new ArgumentNullException(nameof(id));
            }

            try
            {
                var project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    _logger.LogWarning(
                        "No project found with Id: {ProjectId}.",
                        id);

                    return null;
                }

                _logger.LogInformation(
                    "Successfully retrieved project with Id: {ProjectId}.",
                    id);

                return project;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while retrieving project with Id: {ProjectId}.",
                    id);

                throw;
            }
        }
    }
}
