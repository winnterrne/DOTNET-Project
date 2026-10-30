using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Infrastructure.Repositories;

public class CheckinRepository : GenericRepository<Checkin>, ICheckinRepository
{
    public CheckinRepository(AppDbContext context) : base(context)
    {
        
    }
    public async Task<Checkin?> GetOpenCheckinAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await _context.Checkins
            .Where(c => c.MemberId == memberId && c.CheckOutAt == null)
            .OrderByDescending(c => c.CheckInAt)
            .FirstOrDefaultAsync(cancellationToken);
    }
    public async Task<Checkin?> GetRecentCheckinAsync(Guid memberId, DateTime since, CancellationToken cancellationToken = default)
    {
        return await _context.Checkins
            .Where(c => c.MemberId == memberId && c.CheckInAt >= since)
            .OrderByDescending(c => c.CheckInAt)
            .FirstOrDefaultAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<Checkin>> GetOpenCheckinByBranchAsync(Guid branchId, CancellationToken cancellationToken = default)
    {
        return await _context.Checkins
            .AsNoTracking()
            .Include(c => c.Member)
                .ThenInclude(m => m.User)
            .Where(c => c.BranchId == branchId && c.CheckOutAt == null)
            .OrderBy(c => c.CheckInAt)
            .ToListAsync(cancellationToken);
    }
    public async Task<int> CountOpenCheckinByBranchAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await _context.Checkins.CountAsync(
            c => c.BranchId == brandId && c.CheckOutAt == null, cancellationToken
        );
    }
    
}
