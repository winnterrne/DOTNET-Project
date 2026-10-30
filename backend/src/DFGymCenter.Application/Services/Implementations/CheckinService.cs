using System.Data;
using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Enums;
using DFGymCenter.Domain.Exceptions;
using DFGymCenter.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Application.Services.Implementations;

public class CheckinService : ICheckinService
{
    private readonly IAppDbContext _context;
    private readonly ICheckinRepository _checkinRepository;
    private readonly IMemberCardRepository _cardRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CheckinService(IAppDbContext context, ICheckinRepository checkinRepository, IMemberCardRepository cardRepository, IUnitOfWork unitOfWork)
    {
        _context = context;
        _checkinRepository = checkinRepository;
        _cardRepository = cardRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CheckinDto> ScanAsync(CheckinScanRequest request, CancellationToken cancellationToken= default)
    {
        if(string.IsNullOrWhiteSpace(request.CardCode)) throw new ValidationException("Card code is required");

        var card = await _cardRepository.GetByCardCodeAsync(request.CardCode.Trim(), cancellationToken);

        if (card == null) throw new NotFoundException ("Member card not found");

        if(!string.Equals(card.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase)) throw new ValidationException("Member card is not active");

        var member = await _context.Members
            .Include(m => m.User)
            .FirstOrDefaultAsync(
                m => m.Id == card.MemberId, cancellationToken
            );

        if(member == null) throw new NotFoundException("Member profile not found");

        if(member.User.Status != UserStatus.Active) throw new ValidationException("Member account is locked");

        var now = DateTime.Now;
        // Bỏ qua các lượt quét trùng trong vòng 30s
        var recent = await _context.Checkins
            .Include(c => c.Member)
                .ThenInclude(m => m.User)
            .Where(c => 
                c.MemberId == member.Id &&
                c.BranchId == request.BranchId &&
                c.CheckInAt >= now.AddSeconds(-30))
            .OrderByDescending(c => c.CheckInAt)
            .FirstOrDefaultAsync(cancellationToken);
        
        if(recent != null) return ToDto(recent);
        // Nếu có đăng nhập rồi thì scan sẽ là checkout 
        var openCheckin = await _context.Checkins
            .Include(c => c.Member)
                .ThenInclude(m => m.User)
            .Where(c =>
                c.MemberId == member.Id &&
                c.BranchId == request.BranchId &&
                c.CheckOutAt == null)
            .OrderByDescending(c => c.CheckInAt)
            .FirstOrDefaultAsync(cancellationToken);
        
        if(openCheckin != null)
        {
            openCheckin.CheckOutAt = now;
            openCheckin.IsAutoCheckout = false;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ToDto(openCheckin);
        }
        await ValidateMembershipAsync(
            member.Id, request.BranchId, now, cancellationToken);
        var branchExist = await _context.Branches.AnyAsync(b => b.Id == request.BranchId, cancellationToken);
        if(!branchExist) throw new NotFoundException("Branch not found");
        var bookingId = await FindClassBookingAsync(member.Id, request.BranchId, now, cancellationToken);
        var checkin = new Checkin
        {
            MemberId = member.Id,
            BranchId = request.BranchId,
            CardId = card.Id,
            BookingId = bookingId,
            Method = CheckinMethod.QR,
            CheckInAt = now,
            IsAutoCheckout = false
        };
        await _checkinRepository.AddAsync(checkin, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        checkin.Member = member;
        return ToDto(checkin);
    }
    public async Task<CheckinDto> ManualAsync(ManualCheckinRequest request, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Staff)
            .FirstOrDefaultAsync(
                u => u.Id == currentUserId, cancellationToken
            );
        if(user == null) throw new NotFoundException("Không tìm thấy user");
        if(user.Role != UserRole.Staff && user.Role != UserRole.Admin) throw new ValidationException("Chỉ có staff hay admin mới có quyền ");
        if(user.Role == UserRole.Staff)
        {
            if(user.Staff == null || user.Staff.BranchId != request.BranchId)
            {
                throw new ValidationException("Staff quản lý checkin ở chi nhánh");
            }
        }
        var member = await _context.Members
            .Include(m => m.User)
            .FirstOrDefaultAsync(
                m => m.Id == request.MemberId, cancellationToken
            );
        if(member == null) throw new NotFoundException("Member k tìm thấy");
        if(member.User.Status != UserStatus.Active) throw new ValidationException("Tài khoản member bị khóa");
        var now = DateTime.Now;
        var openCheckin = await _context.Checkins
            .Include(c => c.Member)
                .ThenInclude(m => m.User)
            .Where(c =>
                c.MemberId == member.Id &&
                c.BranchId == request.BranchId &&
                c.CheckOutAt == null)
            .OrderByDescending(c => c.CheckInAt)
            .FirstOrDefaultAsync(cancellationToken);
        if(openCheckin != null)
        {
            openCheckin.CheckOutAt = now;
            openCheckin.IsAutoCheckout = false;
            openCheckin.Note = request.Note;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ToDto(openCheckin);
        }
        await ValidateMembershipAsync(member.Id, request.BranchId, now, cancellationToken);
        var branchExists = await _context.Branches
            .AnyAsync(b => b.Id == request.BranchId, cancellationToken);

        if (!branchExists)
            throw new NotFoundException("Branch not found.");

        var bookingId = await FindClassBookingAsync(
            member.Id, request.BranchId, now, cancellationToken);

        var checkin = new Checkin
        {
            MemberId = member.Id,
            BranchId = request.BranchId,
            RecordedBy = user.Staff?.Id,
            BookingId = bookingId,
            Method = CheckinMethod.Manual,
            Note = request.Note,
            CheckInAt = now,
            IsAutoCheckout = false
        };

        await _checkinRepository.AddAsync(checkin, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        checkin.Member = member;
        return ToDto(checkin);
    }

    public async Task<int> GetOccupanyAsync(Guid branchId, CancellationToken cancellationToken = default)
    {
        var branchExists = await _context.Branches
            .AnyAsync(b => b.Id == branchId, cancellationToken);
        if(!branchExists) throw new NotFoundException("Branch not found");
        return await _checkinRepository.CountOpenCheckinByBranchAsync(branchId, cancellationToken);
    }

    private async Task ValidateMembershipAsync(Guid memberId, Guid branchId, DateTime now, CancellationToken cancellationToken)
    {
        var today = now.Date;
        var memberships = await _context.Memberships
            .Include(m => m.Plan)
            .Where(m =>
                m.MemberId == memberId &&
                m.Status == MembershipStatus.Active &&
                m.StartDate <= today &&
                m.EndDate >= today &&
                m.Plan.PlanType == "MEMBERSHIP")
            .ToListAsync(cancellationToken);
            foreach (var membership in memberships)
        {
            var isFrozen = await _context.FreezeRequests
                .AnyAsync(f => 
                    f.MembershipId == membership.Id &&
                    f.Status == FreezeRequestStatus.Approved &&
                    f.FromDate <= today &&
                    f.ToDate >= today, cancellationToken);
            if(isFrozen) continue;
            var canAccessBranch = membership.Plan.IsAllBranches || 
                await _context.PlanBranches.AnyAsync(pb => 
                    pb.PlanId == membership.PlanId &&
                    pb.BranchId == branchId, cancellationToken);
            if(canAccessBranch) return;
            throw new ValidationException("Member does not have a valid membership for this branch today");
        }
    }
    private async Task<Guid?> FindClassBookingAsync(Guid memberId, Guid branchId, DateTime now, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.ClassSession)
                .ThenInclude(s => s!.GymClass)
            .Where(b =>
                b.MemberId == memberId &&
                b.Status == BookingStatus.Confirmed &&
                b.Type == BookingType.Class &&
                b.Checkin == null &&
                b.ClassSession != null &&
                b.ClassSession.GymClass.BranchId == branchId &&
                b.ClassSession.StartAt <= now &&
                b.ClassSession.EndAt >= now)
            .OrderBy(b => b.ClassSession!.StartAt)
            .FirstOrDefaultAsync(cancellationToken);

        return booking?.Id;
    } 
    // Hàm ToDto dùng để chọn và chuyển các thuộc tình cần về cho CheckinDto
    private static CheckinDto ToDto(Checkin checkin)
    {
        return new CheckinDto
        {
            Id = checkin.Id,
            MemberId = checkin.MemberId,
            MemberName = checkin.Member?.User?.FullName ?? string.Empty,
            BranchId = checkin.BranchId,
            CardId = checkin.CardId,
            BookingId = checkin.BookingId,
            Method = checkin.Method,
            CheckInAt = checkin.CheckInAt,
            CheckOutAt = checkin.CheckOutAt,
            IsAutoCheckout = checkin.IsAutoCheckout,
            Note = checkin.Note
        };
    }
}