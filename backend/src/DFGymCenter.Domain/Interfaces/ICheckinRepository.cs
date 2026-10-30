using DFGymCenter.Domain.Entities;

namespace DFGymCenter.Domain.Interfaces;

public interface ICheckinRepository : IGenericRepository<Checkin>
{
    Task<Checkin?> GetOpenCheckinAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<Checkin?> GetRecentCheckinAsync(Guid memberId, DateTime since, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Checkin>> GetOpenCheckinByBranchAsync(Guid branchId, CancellationToken cancellationToken = default);
    Task<int> CountOpenCheckinByBranchAsync(Guid brandId, CancellationToken cancellationToken = default);
}
