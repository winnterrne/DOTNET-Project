using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Enums;
using DFGymCenter.Domain.Exceptions;
using DFGymCenter.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Application.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IAppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;

    public AuthService(
        IUserRepository userRepository,
        IMemberRepository memberRepository,
        IBranchRepository branchRepository,
        IAppDbContext context,
        IUnitOfWork unitOfWork,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _memberRepository = memberRepository;
        _branchRepository = branchRepository;
        _context = context;
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationException("Vui lòng nhập đầy đủ Email/Tên đăng nhập và mật khẩu.");
        }

        var user = await _userRepository.GetByEmailOrUserNameAsync(request.Email, cancellationToken);
        if (user == null || !_tokenService.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new ValidationException("Email hoặc mật khẩu không chính xác.");
        }

        // Chặn đăng nhập nếu tài khoản đang bị khóa (LOCKED)
        if (user.Status == UserStatus.Locked)
        {
            throw new ValidationException("Tài khoản của bạn đã bị khóa (LOCKED). Vui lòng liên hệ quản trị viên.");
        }

        var (token, expiresAt) = _tokenService.GenerateJwtToken(user);

        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = MapToUserDto(user)
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ValidationException("Email là bắt buộc.");

        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ValidationException("Họ và tên là bắt buộc.");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new ValidationException("Mật khẩu phải có ít nhất 6 ký tự.");

        // Chỉ cho phép đăng ký MEMBER hoặc TRAINER
        var roleNormalized = (request.Role ?? "MEMBER").Trim().ToUpperInvariant();
        if (roleNormalized != "MEMBER" && roleNormalized != "TRAINER")
        {
            throw new ValidationException("Chỉ cho phép tự đăng ký tài khoản với vai trò MEMBER hoặc TRAINER.");
        }

        var targetRole = roleNormalized == "TRAINER" ? UserRole.Trainer : UserRole.Member;

        // Nếu đăng ký TRAINER thì bắt buộc phải có Branch_Id hợp lệ
        if (targetRole == UserRole.Trainer)
        {
            if (!request.BranchId.HasValue || request.BranchId.Value == Guid.Empty)
            {
                throw new ValidationException("Đăng ký Huấn luyện viên (TRAINER) bắt buộc phải chọn Chi nhánh (Branch_Id).");
            }

            var branch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (branch == null)
            {
                throw new NotFoundException($"Không tìm thấy chi nhánh với mã: {request.BranchId.Value}");
            }
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _userRepository.EmailExistsAsync(email, cancellationToken))
        {
            throw new ValidationException("Email này đã được sử dụng trong hệ thống.");
        }

        var userName = !string.IsNullOrWhiteSpace(request.UserName)
            ? request.UserName.Trim()
            : email.Split('@')[0];

        if (await _userRepository.UserNameExistsAsync(userName, cancellationToken))
        {
            userName = $"{userName}_{Guid.NewGuid().ToString("N")[..4]}";
        }

        var user = new User
        {
            Email = email,
            UserName = userName,
            FullName = request.FullName.Trim(),
            PasswordHash = _tokenService.HashPassword(request.Password),
            Phone = request.Phone?.Trim(),
            Role = targetRole,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user, cancellationToken);

        if (targetRole == UserRole.Member)
        {
            var cardCode = await _memberRepository.GenerateNextCardCodeAsync(cancellationToken);
            var member = new Member
            {
                UserId = user.Id,
                Address = request.Address?.Trim(),
                DateOfBirth = request.DateOfBirth,
                Gender = request.Gender ?? "male"
            };

            var memberCard = new MemberCard
            {
                MemberId = member.Id,
                CardCode = cardCode,
                Status = "ACTIVE"
            };

            member.MemberCards.Add(memberCard);
            user.Member = member;

            await _memberRepository.AddAsync(member, cancellationToken);
            await _context.MemberCards.AddAsync(memberCard, cancellationToken);
        }
        else if (targetRole == UserRole.Trainer)
        {
            var trainer = new Trainer
            {
                UserId = user.Id,
                BranchId = request.BranchId!.Value,
                Specialty = request.Specialty?.Trim() ?? "Gym, Fitness",
                ExperienceYears = request.ExperienceYears,
                Bio = request.Bio?.Trim()
            };

            user.Trainer = trainer;
            await _context.Trainers.AddAsync(trainer, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var createdUser = await _userRepository.GetByIdWithDetailsAsync(user.Id, cancellationToken) ?? user;
        var (token, expiresAt) = _tokenService.GenerateJwtToken(createdUser);

        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = MapToUserDto(createdUser)
        };
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ValidationException("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.");
        }

        if (request.NewPassword.Length < 6)
        {
            throw new ValidationException("Mật khẩu mới phải có ít nhất 6 ký tự.");
        }

        if (!string.IsNullOrEmpty(request.ConfirmPassword) && request.NewPassword != request.ConfirmPassword)
        {
            throw new ValidationException("Xác nhận mật khẩu mới không khớp.");
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("Không tìm thấy thông tin người dùng.");

        if (!_tokenService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new ValidationException("Mật khẩu hiện tại không chính xác.");
        }

        user.PasswordHash = _tokenService.HashPassword(request.NewPassword);
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserDto> GetMyProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ người dùng.");

        return MapToUserDto(user);
    }

    public async Task<UserDto> UpdateMyProfileAsync(Guid userId, UpdateMemberProfileRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ValidationException("Họ và tên không được để trống.");
        }

        var user = await _userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new NotFoundException("Không tìm thấy hồ sơ người dùng.");

        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone?.Trim();

        if (user.Role == UserRole.Member)
        {
            if (user.Member == null)
            {
                var cardCode = await _memberRepository.GenerateNextCardCodeAsync(cancellationToken);
                user.Member = new Member
                {
                    UserId = user.Id,
                    Address = request.Address?.Trim(),
                    DateOfBirth = request.DateOfBirth,
                    Gender = request.Gender
                };
                await _memberRepository.AddAsync(user.Member, cancellationToken);
                await _context.MemberCards.AddAsync(new MemberCard
                {
                    MemberId = user.Member.Id,
                    CardCode = cardCode,
                    Status = "ACTIVE"
                }, cancellationToken);
            }
            else
            {
                if (request.Address != null) user.Member.Address = request.Address.Trim();
                if (request.DateOfBirth.HasValue) user.Member.DateOfBirth = request.DateOfBirth;
                if (!string.IsNullOrWhiteSpace(request.Gender)) user.Member.Gender = request.Gender.Trim();
            }
        }
        else if (user.Role == UserRole.Trainer && user.Trainer != null)
        {
            if (request.Specialty != null) user.Trainer.Specialty = request.Specialty.Trim();
            if (request.ExperienceYears.HasValue) user.Trainer.ExperienceYears = request.ExperienceYears.Value;
            if (request.Bio != null) user.Trainer.Bio = request.Bio.Trim();
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MapToUserDto(user);
    }

    public async Task<IReadOnlyList<UserDto>> GetAllUsersAsync(string? role = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllWithDetailsAsync(role, search, cancellationToken);
        return users.Select(MapToUserDto).ToList();
    }

    public async Task<UserDto> CreateStaffAsync(CreateStaffRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ValidationException("Họ và tên và Email là bắt buộc.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _userRepository.EmailExistsAsync(email, cancellationToken))
        {
            throw new ValidationException("Email này đã tồn tại trong hệ thống.");
        }

        var roleNormalized = (request.Role ?? "STAFF").Trim().ToUpperInvariant();
        var targetRole = roleNormalized switch
        {
            "TRAINER" => UserRole.Trainer,
            "ADMIN" => UserRole.Admin,
            _ => UserRole.Staff
        };

        if (targetRole == UserRole.Staff || targetRole == UserRole.Trainer)
        {
            if (!request.BranchId.HasValue || request.BranchId.Value == Guid.Empty)
            {
                throw new ValidationException("Tạo tài khoản Lễ tân (STAFF) hoặc Huấn luyện viên (TRAINER) bắt buộc phải có Branch_Id.");
            }

            var branch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (branch == null)
            {
                throw new NotFoundException($"Không tìm thấy chi nhánh với mã: {request.BranchId.Value}");
            }
        }

        var userName = !string.IsNullOrWhiteSpace(request.UserName)
            ? request.UserName.Trim()
            : email.Split('@')[0];

        if (await _userRepository.UserNameExistsAsync(userName, cancellationToken))
        {
            userName = $"{userName}_{Guid.NewGuid().ToString("N")[..4]}";
        }

        var rawPassword = string.IsNullOrWhiteSpace(request.Password) ? "123456" : request.Password;

        var user = new User
        {
            Email = email,
            UserName = userName,
            FullName = request.FullName.Trim(),
            PasswordHash = _tokenService.HashPassword(rawPassword),
            Phone = request.Phone?.Trim(),
            Role = targetRole,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user, cancellationToken);

        if (targetRole == UserRole.Staff)
        {
            var staff = new Staff
            {
                UserId = user.Id,
                BranchId = request.BranchId!.Value,
                Position = string.IsNullOrWhiteSpace(request.Position) ? "Receptionist" : request.Position.Trim()
            };
            user.Staff = staff;
            await _context.Staff.AddAsync(staff, cancellationToken);
        }
        else if (targetRole == UserRole.Trainer)
        {
            var trainer = new Trainer
            {
                UserId = user.Id,
                BranchId = request.BranchId!.Value,
                Specialty = request.Specialty?.Trim() ?? "Gym, HIIT, Cardio",
                ExperienceYears = request.ExperienceYears,
                Bio = request.Bio?.Trim() ?? "Huấn luyện viên chuyên môn cao tại DFGymCenter"
            };
            user.Trainer = trainer;
            await _context.Trainers.AddAsync(trainer, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _userRepository.GetByIdWithDetailsAsync(user.Id, cancellationToken) ?? user;
        return MapToUserDto(created);
    }

    public async Task<UserDto> UpdateUserStatusAsync(Guid targetUserId, UpdateUserStatusRequest request, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        if (currentUserId.HasValue && currentUserId.Value == targetUserId)
        {
            throw new ValidationException("Không thể tự khóa tài khoản của chính mình.");
        }

        var user = await _userRepository.GetByIdWithDetailsAsync(targetUserId, cancellationToken)
            ?? throw new NotFoundException($"Không tìm thấy tài khoản với mã: {targetUserId}");

        if (request.Locked.HasValue)
        {
            user.Status = request.Locked.Value ? UserStatus.Locked : UserStatus.Active;
        }
        else if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var normalized = request.Status.Trim().ToUpperInvariant();
            if (normalized == "LOCKED")
                user.Status = UserStatus.Locked;
            else if (normalized == "ACTIVE")
                user.Status = UserStatus.Active;
            else
                throw new ValidationException("Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc LOCKED.");
        }
        else
        {
            // Toggle nếu không truyền cụ thể
            user.Status = user.Status == UserStatus.Locked ? UserStatus.Active : UserStatus.Locked;
        }

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToUserDto(user);
    }

    public async Task<IReadOnlyList<MemberDto>> SearchMembersAsync(string? search = null, CancellationToken cancellationToken = default)
    {
        var members = await _memberRepository.SearchMembersAsync(search, cancellationToken);
        return members.Select(m =>
        {
            var latestMembership = m.Memberships
                .OrderByDescending(ms => ms.EndDate)
                .FirstOrDefault();

            var primaryCard = m.MemberCards.FirstOrDefault(c => c.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase))
                ?? m.MemberCards.FirstOrDefault();

            return new MemberDto
            {
                Id = m.Id,
                UserId = m.UserId,
                FullName = m.User.FullName,
                Email = m.User.Email,
                Phone = m.User.Phone,
                CardId = primaryCard?.Id,
                CardCode = primaryCard?.CardCode,
                CardStatus = primaryCard?.Status,
                Address = m.Address,
                DateOfBirth = m.DateOfBirth,
                Gender = m.Gender,
                UserStatus = m.User.Status == UserStatus.Locked ? "LOCKED" : "ACTIVE",
                CreatedAt = m.User.CreatedAt,
                CurrentPlanName = latestMembership?.Plan?.Name,
                MembershipStatus = latestMembership?.Status.ToString().ToUpperInvariant(),
                StartDate = latestMembership?.StartDate,
                EndDate = latestMembership?.EndDate,
                RemainingSessions = m.Memberships
                    .Where(ms => ms.Status == MembershipStatus.Active)
                    .Sum(ms => ms.RemainingSessions)
            };
        }).ToList();
    }

    private static UserDto MapToUserDto(User user)
    {
        var roleStr = user.Role switch
        {
            UserRole.Admin => "admin",
            UserRole.Staff => "receptionist",
            UserRole.Trainer => "trainer",
            _ => "member"
        };

        var primaryCard = user.Member?.MemberCards.FirstOrDefault(c => c.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase))
            ?? user.Member?.MemberCards.FirstOrDefault();
        var branchId = user.Staff?.BranchId ?? user.Trainer?.BranchId;
        var branchName = user.Staff?.Branch?.Name ?? user.Trainer?.Branch?.Name;

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            UserName = user.UserName,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = roleStr,
            Status = user.Status == UserStatus.Locked ? "LOCKED" : "ACTIVE",
            CreatedAt = user.CreatedAt,
            MemberId = user.Member?.Id,
            CardId = primaryCard?.Id,
            CardCode = primaryCard?.CardCode,
            CardStatus = primaryCard?.Status,
            Address = user.Member?.Address,
            DateOfBirth = user.Member?.DateOfBirth,
            Gender = user.Member?.Gender,
            BranchId = branchId,
            BranchName = branchName,
            Position = user.Staff?.Position,
            Specialty = user.Trainer?.Specialty,
            ExperienceYears = user.Trainer?.ExperienceYears,
            Bio = user.Trainer?.Bio
        };
    }
}
