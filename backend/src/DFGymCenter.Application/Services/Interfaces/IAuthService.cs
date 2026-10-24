using DFGymCenter.Application.DTOs;

namespace DFGymCenter.Application.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> GetMyProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateMyProfileAsync(Guid userId, UpdateMemberProfileRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserDto>> GetAllUsersAsync(string? role = null, string? search = null, CancellationToken cancellationToken = default);
    Task<UserDto> CreateStaffAsync(CreateStaffRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateUserStatusAsync(Guid targetUserId, UpdateUserStatusRequest request, Guid? currentUserId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MemberDto>> SearchMembersAsync(string? search = null, CancellationToken cancellationToken = default);
}
