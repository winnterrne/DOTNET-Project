using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Enums;
using DFGymCenter.Domain.Exceptions;
using DFGymCenter.Domain.Interfaces;

namespace DFGymCenter.Application.Services.Implementations;

public class MemberCardService : IMemberCardService
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "ACTIVE",
        "LOCKED",
        "LOST"
    };

    private readonly IMemberCardRepository _memberCardRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IAppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public MemberCardService(
        IMemberCardRepository memberCardRepository,
        IMemberRepository memberRepository,
        IUserRepository userRepository,
        INotificationRepository notificationRepository,
        IAppDbContext context,
        IUnitOfWork unitOfWork)
    {
        _memberCardRepository = memberCardRepository;
        _memberRepository = memberRepository;
        _userRepository = userRepository;
        _notificationRepository = notificationRepository;
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public async Task<MemberCardDto> GetMyCardAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var member = await _memberRepository.GetByUserIdAsync(currentUserId, cancellationToken);
        if (member == null)
        {
            var user = await _userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
                ?? throw new NotFoundException("Không tìm thấy thông tin người dùng.");

            member = new Member
            {
                UserId = user.Id,
                User = user,
                Gender = "male"
            };
            await _memberRepository.AddAsync(member, cancellationToken);

            var initialCode = await _memberCardRepository.GenerateUniqueRandomCardCodeAsync(cancellationToken);
            var initialCard = new MemberCard
            {
                MemberId = member.Id,
                CardCode = initialCode,
                Status = "ACTIVE",
                Member = member
            };
            member.MemberCards.Add(initialCard);
            await _memberCardRepository.AddAsync(initialCard, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else if (!member.MemberCards.Any())
        {
            var initialCode = await _memberCardRepository.GenerateUniqueRandomCardCodeAsync(cancellationToken);
            var initialCard = new MemberCard
            {
                MemberId = member.Id,
                CardCode = initialCode,
                Status = "ACTIVE",
                Member = member
            };
            member.MemberCards.Add(initialCard);
            await _memberCardRepository.AddAsync(initialCard, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var primaryCard = SelectPrimaryCard(member.MemberCards);
        return MapToDto(primaryCard, member);
    }

    public async Task<IReadOnlyList<MemberCardDto>> GetCardsAsync(
        Guid? memberId = null,
        string? search = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var cards = await _memberCardRepository.GetCardsWithMemberAsync(memberId, search, status, cancellationToken);
        return cards.Select(c => MapToDto(c, c.Member)).ToList();
    }

    public async Task<MemberCardDto> IssueCardAsync(IssueCardRequest request, CancellationToken cancellationToken = default)
    {
        if (request.MemberId == Guid.Empty)
        {
            throw new ValidationException("Vui lòng chọn hội viên (Member_Id) cần cấp thẻ.");
        }

        var member = await _memberRepository.GetByIdOrUserIdWithDetailsAsync(request.MemberId, cancellationToken);
        if (member == null)
        {
            throw new NotFoundException($"Không tìm thấy hồ sơ hội viên với mã: {request.MemberId}");
        }

        // Xác định trạng thái chuyển đổi cho thẻ cũ đang ACTIVE (LOCKED hoặc LOST)
        var oldStatusTarget = DetermineOldCardTargetStatus(request.PreviousCardStatus, request.Reason);

        foreach (var existingCard in member.MemberCards)
        {
            if (existingCard.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                existingCard.Status = oldStatusTarget;
                _memberCardRepository.Update(existingCard);
            }
            else if (oldStatusTarget == "LOST" && existingCard.Status.Equals("LOCKED", StringComparison.OrdinalIgnoreCase))
            {
                existingCard.Status = "LOST";
                _memberCardRepository.Update(existingCard);
            }
        }

        // Sinh Card_Code ngẫu nhiên, duy nhất, không đoán được
        var newCardCode = await _memberCardRepository.GenerateUniqueRandomCardCodeAsync(cancellationToken);

        var newCard = new MemberCard
        {
            MemberId = member.Id,
            CardCode = newCardCode,
            Status = "ACTIVE",
            Member = member
        };

        member.MemberCards.Add(newCard);
        await _memberCardRepository.AddAsync(newCard, cancellationToken);

        await _notificationRepository.AddAsync(new Notification
        {
            UserId = member.UserId,
            Type = "SUCCESS",
            Title = "Đã cấp thẻ hội viên mới",
            Content = $"Thẻ hội viên mới của bạn ({newCardCode}) đã được kích hoạt (ACTIVE). Các thẻ cũ đã được vô hiệu hóa.",
            RefType = "MEMBER_CARD",
            RefId = newCard.Id,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var refreshedMember = await _memberRepository.GetByIdOrUserIdWithDetailsAsync(member.Id, cancellationToken) ?? member;
        return MapToDto(newCard, refreshedMember);
    }

    public async Task<MemberCardDto> UpdateCardStatusAsync(
        Guid cardId,
        UpdateCardStatusRequest request,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            throw new ValidationException("Trạng thái thẻ (Status) không được để trống.");
        }

        var targetStatus = request.Status.Trim().ToUpperInvariant();
        if (!ValidStatuses.Contains(targetStatus))
        {
            throw new ValidationException("Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE, LOCKED hoặc LOST.");
        }

        var card = await _memberCardRepository.GetByIdWithDetailsAsync(cardId, cancellationToken);
        if (card == null)
        {
            // Hỗ trợ trường hợp truyền MemberId / UserId để thao tác trên thẻ hiện tại của hội viên
            var memberById = await _memberRepository.GetByIdOrUserIdWithDetailsAsync(cardId, cancellationToken);
            if (memberById != null && memberById.MemberCards.Any())
            {
                card = SelectPrimaryCard(memberById.MemberCards);
                card.Member = memberById;
            }
        }

        if (card == null)
        {
            throw new NotFoundException($"Không tìm thấy thẻ hội viên với mã: {cardId}");
        }

        var isStaffOrAdmin = currentUserRole.Equals("STAFF", StringComparison.OrdinalIgnoreCase)
            || currentUserRole.Equals("ADMIN", StringComparison.OrdinalIgnoreCase)
            || currentUserRole.Equals("RECEPTIONIST", StringComparison.OrdinalIgnoreCase);

        // Kiểm tra phân quyền: Hội viên chỉ được đặt LOST cho thẻ của chính mình
        if (!isStaffOrAdmin)
        {
            if (card.Member.UserId != currentUserId)
            {
                throw new ValidationException("Bạn không có quyền thay đổi trạng thái thẻ của hội viên khác.");
            }

            if (targetStatus != "LOST")
            {
                throw new ValidationException("Hội viên chỉ được phép báo mất thẻ (LOST) cho thẻ của mình. Vui lòng liên hệ Lễ tân nếu cần mở khóa hoặc cấp thẻ mới.");
            }
        }

        // Quy tắc State Machine: Thẻ đã LOST bị vô hiệu hóa vĩnh viễn, không thể mở khóa lại
        if (card.Status.Equals("LOST", StringComparison.OrdinalIgnoreCase) && targetStatus != "LOST")
        {
            throw new ValidationException("Thẻ đã báo mất (LOST) bị vô hiệu hóa vĩnh viễn và không thể kích hoạt lại. Vui lòng sử dụng chức năng Cấp thẻ mới.");
        }

        // Nếu Lễ tân mở khóa thẻ sang ACTIVE, đảm bảo các thẻ ACTIVE khác (nếu có) của hội viên này chuyển sang LOCKED
        if (targetStatus == "ACTIVE")
        {
            var memberCards = await _memberCardRepository.GetByMemberIdAsync(card.MemberId, cancellationToken);
            foreach (var other in memberCards.Where(c => c.Id != card.Id && c.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase)))
            {
                other.Status = "LOCKED";
                _memberCardRepository.Update(other);
            }
        }

        card.Status = targetStatus;
        _memberCardRepository.Update(card);

        var statusTitle = targetStatus switch
        {
            "LOST" => "Thẻ hội viên đã được báo mất (LOST)",
            "LOCKED" => "Thẻ hội viên đã bị tạm khóa (LOCKED)",
            _ => "Thẻ hội viên đã được kích hoạt lại (ACTIVE)"
        };

        var statusMessage = targetStatus switch
        {
            "LOST" => $"Thẻ {card.CardCode} đã được chuyển sang trạng thái LOST và vô hiệu hóa hoàn toàn. Vui lòng liên hệ quầy lễ tân để được cấp thẻ mới.",
            "LOCKED" => $"Thẻ {card.CardCode} đã bị khóa tạm thời (LOCKED).{(string.IsNullOrWhiteSpace(request.Reason) ? "" : $" Lý do: {request.Reason}")}",
            _ => $"Thẻ {card.CardCode} của bạn đã được mở khóa và hoạt động bình thường (ACTIVE)."
        };

        await _notificationRepository.AddAsync(new Notification
        {
            UserId = card.Member.UserId,
            Type = targetStatus == "ACTIVE" ? "SUCCESS" : "WARNING",
            Title = statusTitle,
            Content = statusMessage,
            RefType = "MEMBER_CARD",
            RefId = card.Id,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedMember = await _memberRepository.GetByIdOrUserIdWithDetailsAsync(card.MemberId, cancellationToken) ?? card.Member;
        return MapToDto(card, updatedMember);
    }

    private static string DetermineOldCardTargetStatus(string? previousCardStatus, string? reason)
    {
        if (!string.IsNullOrWhiteSpace(previousCardStatus))
        {
            var normalized = previousCardStatus.Trim().ToUpperInvariant();
            if (normalized == "LOST" || normalized == "LOCKED")
            {
                return normalized;
            }
        }

        if (!string.IsNullOrWhiteSpace(reason))
        {
            var r = reason.Trim().ToLowerInvariant();
            if (r.Contains("lost") || r.Contains("mất") || r.Contains("mat the"))
            {
                return "LOST";
            }
        }

        return "LOCKED";
    }

    private static MemberCard SelectPrimaryCard(ICollection<MemberCard> cards)
    {
        return cards.FirstOrDefault(c => c.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase))
            ?? cards.FirstOrDefault(c => c.Status.Equals("LOCKED", StringComparison.OrdinalIgnoreCase))
            ?? cards.First();
    }

    private static MemberCardDto MapToDto(MemberCard card, Member member)
    {
        var latestMembership = member.Memberships?
            .OrderByDescending(ms => ms.EndDate)
            .FirstOrDefault();

        var allCards = member.MemberCards?
            .OrderByDescending(c => c.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase))
            .ThenBy(c => c.Status)
            .Select(c => new MemberCardSummaryDto
            {
                Id = c.Id,
                MemberId = c.MemberId,
                CardCode = c.CardCode,
                Status = c.Status.ToUpperInvariant()
            })
            .ToList();

        return new MemberCardDto
        {
            Id = card.Id,
            MemberId = member.Id,
            UserId = member.UserId,
            CardCode = card.CardCode,
            Status = card.Status.ToUpperInvariant(),
            MemberName = member.User?.FullName ?? string.Empty,
            MemberEmail = member.User?.Email ?? string.Empty,
            MemberPhone = member.User?.Phone,
            UserStatus = member.User?.Status == UserStatus.Locked ? "LOCKED" : "ACTIVE",
            MemberCreatedAt = member.User?.CreatedAt ?? DateTime.UtcNow,
            CurrentPlanName = latestMembership?.Plan?.Name,
            MembershipStatus = latestMembership?.Status.ToString().ToUpperInvariant(),
            PlanStartDate = latestMembership?.StartDate,
            PlanEndDate = latestMembership?.EndDate,
            AllCards = allCards
        };
    }
}
