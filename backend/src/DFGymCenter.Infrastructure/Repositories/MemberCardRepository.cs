using System.Security.Cryptography;
using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Infrastructure.Repositories;

public class MemberCardRepository : GenericRepository<MemberCard>, IMemberCardRepository
{
    private const string CardAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    public MemberCardRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<MemberCard?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.MemberCards
            .Include(mc => mc.Member)
                .ThenInclude(m => m.User)
            .Include(mc => mc.Member)
                .ThenInclude(m => m.Memberships)
                    .ThenInclude(ms => ms.Plan)
            .FirstOrDefaultAsync(mc => mc.Id == id, cancellationToken);
    }

    public async Task<MemberCard?> GetByCardCodeAsync(string cardCode, CancellationToken cancellationToken = default)
    {
        var normalized = cardCode.Trim().ToUpperInvariant();
        return await _context.MemberCards
            .Include(mc => mc.Member)
                .ThenInclude(m => m.User)
            .Include(mc => mc.Member)
                .ThenInclude(m => m.Memberships)
                    .ThenInclude(ms => ms.Plan)
            .FirstOrDefaultAsync(mc => mc.CardCode.ToUpper() == normalized, cancellationToken);
    }

    public async Task<IReadOnlyList<MemberCard>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await _context.MemberCards
            .Include(mc => mc.Member)
                .ThenInclude(m => m.User)
            .Include(mc => mc.Member)
                .ThenInclude(m => m.Memberships)
                    .ThenInclude(ms => ms.Plan)
            .Where(mc => mc.MemberId == memberId || mc.Member.UserId == memberId)
            .OrderByDescending(mc => mc.Status == "ACTIVE")
            .ThenBy(mc => mc.Status)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MemberCard>> GetCardsWithMemberAsync(
        Guid? memberId = null,
        string? search = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.MemberCards
            .AsNoTracking()
            .Include(mc => mc.Member)
                .ThenInclude(m => m.User)
            .Include(mc => mc.Member)
                .ThenInclude(m => m.Memberships)
                    .ThenInclude(ms => ms.Plan)
            .AsQueryable();

        if (memberId.HasValue && memberId.Value != Guid.Empty)
        {
            var mid = memberId.Value;
            query = query.Where(mc => mc.MemberId == mid || mc.Member.UserId == mid);
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            query = query.Where(mc => mc.Status.ToUpper() == normalizedStatus);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(mc =>
                mc.CardCode.ToLower().Contains(term) ||
                mc.Member.User.FullName.ToLower().Contains(term) ||
                mc.Member.User.Email.ToLower().Contains(term) ||
                (mc.Member.User.Phone != null && mc.Member.User.Phone.Contains(term)));
        }

        return await query
            .OrderByDescending(mc => mc.Status == "ACTIVE")
            .ThenByDescending(mc => mc.Member.User.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> CardCodeExistsAsync(string cardCode, CancellationToken cancellationToken = default)
    {
        var normalized = cardCode.Trim().ToUpperInvariant();
        return await _context.MemberCards.AnyAsync(mc => mc.CardCode.ToUpper() == normalized, cancellationToken);
    }

    public async Task<string> GenerateUniqueRandomCardCodeAsync(CancellationToken cancellationToken = default)
    {
        string candidate;
        do
        {
            candidate = GenerateCryptographicCardCode();
        } while (await CardCodeExistsAsync(candidate, cancellationToken));

        return candidate;
    }

    public static string GenerateCryptographicCardCode()
    {
        Span<byte> randomBytes = stackalloc byte[8];
        RandomNumberGenerator.Fill(randomBytes);

        Span<char> chars = stackalloc char[9];
        for (int i = 0; i < 4; i++)
        {
            chars[i] = CardAlphabet[randomBytes[i] % CardAlphabet.Length];
        }
        chars[4] = '-';
        for (int i = 0; i < 4; i++)
        {
            chars[5 + i] = CardAlphabet[randomBytes[4 + i] % CardAlphabet.Length];
        }

        return $"DF-{new string(chars)}";
    }
}
