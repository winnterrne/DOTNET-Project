using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Infrastructure.Repositories;

public class MemberRepository : GenericRepository<Member>, IMemberRepository
{
    public MemberRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Member?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Members
            .Include(m => m.User)
            .Include(m => m.MemberCards)
            .Include(m => m.Memberships)
                .ThenInclude(ms => ms.Plan)
            .FirstOrDefaultAsync(m => m.UserId == userId, cancellationToken);
    }

    public async Task<IReadOnlyList<Member>> SearchMembersAsync(string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Members
            .AsNoTracking()
            .Include(m => m.User)
            .Include(m => m.MemberCards)
            .Include(m => m.Memberships)
                .ThenInclude(ms => ms.Plan)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(m =>
                m.User.FullName.ToLower().Contains(term) ||
                m.User.Email.ToLower().Contains(term) ||
                (m.User.Phone != null && m.User.Phone.Contains(term)) ||
                m.MemberCards.Any(mc => mc.CardCode.ToLower().Contains(term)));
        }

        return await query
            .OrderByDescending(m => m.User.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GenerateNextCardCodeAsync(CancellationToken cancellationToken = default)
    {
        var count = await _context.MemberCards.CountAsync(cancellationToken);
        var nextNum = 1001 + count;
        var candidate = $"DF-{nextNum}";
        while (await _context.MemberCards.AnyAsync(mc => mc.CardCode == candidate, cancellationToken))
        {
            nextNum++;
            candidate = $"DF-{nextNum}";
        }
        return candidate;
    }
}
