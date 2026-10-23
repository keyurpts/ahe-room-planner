using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AHE.DAL.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<UserRepository> _logger;


    public UserRepository(AppDbContext context, ILogger<UserRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<User?> GetByEmailAsync(string emailNormalized)
    {
        if (string.IsNullOrWhiteSpace(emailNormalized))
        {
            _logger.LogWarning(
                "Cannot retrieve user because the normalized email is null or empty.");

            return null;
        }

        try
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(
                    u => u.EmailNormalized == emailNormalized);

            if (user == null)
            {
                _logger.LogWarning(
                    "No user found with the provided normalized email.");

                return null;
            }

            _logger.LogInformation(
                "Successfully retrieved user with the provided normalized email.");

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving a user by normalized email.");

            throw;
        }
    }

    public async Task AddAsync(User user)
    {
        if (user == null)
        {
            _logger.LogWarning(
                "Cannot create user because the input user is null.");

            throw new ArgumentNullException(nameof(user));
        }

        try
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "User created successfully with Id: {UserId}.",
                user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while creating the user with Id: {UserId}.",
                user.Id);

            throw;
        }
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        if (id == Guid.Empty)
        {
            _logger.LogWarning(
                "Cannot retrieve user because the ID is empty.");

            return null;
        }

        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                _logger.LogWarning(
                    "No user found with Id: {UserId}.",
                    id);

                return null;
            }

            _logger.LogInformation(
                "Successfully retrieved user with Id: {UserId}.",
                id);

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An error occurred while retrieving user with Id: {UserId}.",
                id);

            throw;
        }
    }
}