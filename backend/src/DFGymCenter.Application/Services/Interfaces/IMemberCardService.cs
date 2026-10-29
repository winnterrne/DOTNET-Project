using DFGymCenter.Application.DTOs;

namespace DFGymCenter.Application.Services.Interfaces;

public interface IMemberCardService
{
    Task<MemberCardDto> GetMyCardAsync(Guid currentUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MemberCardDto>> GetCardsAsync(
        Guid? memberId = null,
        string? search = null,
        string? status = null,
        CancellationToken cancellationToken = default);
    Task<MemberCardDto> IssueCardAsync(IssueCardRequest request, CancellationToken cancellationToken = default);
    Task<MemberCardDto> UpdateCardStatusAsync(
        Guid cardId,
        UpdateCardStatusRequest request,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);
}
