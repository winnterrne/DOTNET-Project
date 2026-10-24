using System.Security.Claims;
using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DFGymCenter.API.Controllers;

/// <summary>
/// Controller quản lý Hồ sơ cá nhân (/api/users/me) và Quản trị tài khoản Admin (/api/users).
/// </summary>
[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public UsersController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Lấy thông tin hồ sơ cá nhân của người dùng hiện tại.
    /// GET /api/users/me
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserDto>> GetMe(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập để xem hồ sơ cá nhân." });
        }

        var profile = await _authService.GetMyProfileAsync(userId.Value, cancellationToken);
        return Ok(profile);
    }

    /// <summary>
    /// Cập nhật hồ sơ cá nhân của người dùng hiện tại.
    /// PUT /api/users/me
    /// </summary>
    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserDto>> UpdateMe([FromBody] UpdateMemberProfileRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập để cập nhật hồ sơ." });
        }

        var updated = await _authService.UpdateMyProfileAsync(userId.Value, request, cancellationToken);
        return Ok(updated);
    }

    /// <summary>
    /// Lấy danh sách tài khoản toàn hệ thống (dành cho Admin).
    /// GET /api/users
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN,Admin")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers(
        [FromQuery] string? role,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var users = await _authService.GetAllUsersAsync(role, search, cancellationToken);
        return Ok(users);
    }

    /// <summary>
    /// Tạo tài khoản Nhân viên / HLV mới kèm Branch_Id (dành cho Admin).
    /// POST /api/users/staff
    /// </summary>
    [HttpPost("staff")]
    [Authorize(Roles = "ADMIN,Admin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<UserDto>> CreateStaff([FromBody] CreateStaffRequest request, CancellationToken cancellationToken)
    {
        var created = await _authService.CreateStaffAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    /// <summary>
    /// Khóa / Mở khóa tài khoản người dùng (ACTIVE / LOCKED) dành cho Admin.
    /// PATCH /api/users/{id}/status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "ADMIN,Admin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserDto>> UpdateUserStatus(
        Guid id,
        [FromBody] UpdateUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var updated = await _authService.UpdateUserStatusAsync(id, request, currentUserId, cancellationToken);
        return Ok(updated);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(userIdStr, out var id) ? id : null;
    }
}
