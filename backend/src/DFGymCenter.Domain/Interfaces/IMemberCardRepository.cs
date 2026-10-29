using DFGymCenter.Domain.Entities;

namespace DFGymCenter.Domain.Interfaces;

public interface IMemberCardRepository : IGenericRepository<MemberCard>
{
    Task<MemberCard?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<MemberCard?> GetByCardCodeAsync(string cardCode, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MemberCard>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MemberCard>> GetCardsWithMemberAsync(
        Guid? memberId = null,
        string? search = null,
        string? status = null,
        CancellationToken cancellationToken = default);
    Task<bool> CardCodeExistsAsync(string cardCode, CancellationToken cancellationToken = default);
    Task<string> GenerateUniqueRandomCardCodeAsync(CancellationToken cancellationToken = default);
}
