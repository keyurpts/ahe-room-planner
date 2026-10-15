using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly AppDbContext _context;

        public ProjectRepository(AppDbContext context)
        {
            _context = context;
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
            string code;

            do
            {
                code = GenerateDesignCode();
            }
            while (await _context.Projects
                .AnyAsync(x => x.DesignCode == code));

            return code;
        }

        public async Task<Project?> GetByDesignCodeAsync(string designCode)
        {
            return await _context.Projects
                .FirstOrDefaultAsync(d => d.DesignCode == designCode);
        }


        public async Task<Project> CreateAsync(Project project)
        {
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            return project;
        }

        public async Task<IEnumerable<Project>> GetAllAsync()
        {
            return await _context.Projects
                .Where(p => p.DeletedAt == null)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Project>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Projects
                .Where(p => p.UserId == userId && p.DeletedAt == null)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task UpdateAsync(Project project)
        {
            _context.Projects.Update(project);

            await _context.SaveChangesAsync();
        }

        public async Task<Project?> GetByIdAsync(Guid id)
        {
            return await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id);
        }
    }
}
