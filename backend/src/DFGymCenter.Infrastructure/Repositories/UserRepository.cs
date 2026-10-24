using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Enums;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Infrastructure.Repositories;

public class UserRepository : GenericRepository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailOrUserNameAsync(string emailOrUserName, CancellationToken cancellationToken = default)
    {
        var normalized = emailOrUserName.Trim().ToLower();
        return await _context.Users
            .Include(u => u.Member)
                .ThenInclude(m => m!.MemberCards)
            .Include(u => u.Trainer)
                .ThenInclude(t => t!.Branch)
            .Include(u => u.Staff)
                .ThenInclude(s => s!.Branch)
            .FirstOrDefaultAsync(
                u => u.Email.ToLower() == normalized || u.UserName.ToLower() == normalized,
                cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return await _context.Users
            .Include(u => u.Member)
                .ThenInclude(m => m!.MemberCards)
            .Include(u => u.Trainer)
                .ThenInclude(t => t!.Branch)
            .Include(u => u.Staff)
                .ThenInclude(s => s!.Branch)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized, cancellationToken);
    }

    public async Task<User?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Member)
                .ThenInclude(m => m!.MemberCards)
            .Include(u => u.Trainer)
                .ThenInclude(t => t!.Branch)
            .Include(u => u.Staff)
                .ThenInclude(s => s!.Branch)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetAllWithDetailsAsync(string? role = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Users
            .AsNoTracking()
            .Include(u => u.Member)
                .ThenInclude(m => m!.MemberCards)
            .Include(u => u.Trainer)
                .ThenInclude(t => t!.Branch)
            .Include(u => u.Staff)
                .ThenInclude(s => s!.Branch)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role) && !role.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedRole = role.Trim().ToLower();
            if (normalizedRole == "receptionist" || normalizedRole == "staff")
            {
                query = query.Where(u => u.Role == UserRole.Staff);
            }
            else if (Enum.TryParse<UserRole>(role, true, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                u.UserName.ToLower().Contains(term) ||
                (u.Phone != null && u.Phone.Contains(term)) ||
                (u.Member != null && u.Member.MemberCards.Any(mc => mc.CardCode.ToLower().Contains(term))));
        }

        return await query
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return await _context.Users.AnyAsync(u => u.Email.ToLower() == normalized, cancellationToken);
    }

    public async Task<bool> UserNameExistsAsync(string userName, CancellationToken cancellationToken = default)
    {
        var normalized = userName.Trim().ToLower();
        return await _context.Users.AnyAsync(u => u.UserName.ToLower() == normalized, cancellationToken);
    }
}
