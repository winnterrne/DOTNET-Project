using DFGymCenter.Domain.Entities;

namespace DFGymCenter.Domain.Interfaces;

public interface IMemberRepository : IGenericRepository<Member>
{
    Task<Member?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Member?> GetByIdOrUserIdWithDetailsAsync(Guid idOrUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Member>> SearchMembersAsync(string? search = null, CancellationToken cancellationToken = default);
    Task<string> GenerateNextCardCodeAsync(CancellationToken cancellationToken = default);
}
