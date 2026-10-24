using System.Security.Claims;
using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DFGymCenter.API.Controllers;

/// <summary>
/// Controller xử lý Đăng nhập, Đăng ký (MEMBER/TRAINER) và Đổi mật khẩu.
/// </summary>
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng nhập nhận JWT Token (chứa Role) và chặn tài khoản LOCKED.
    /// POST /api/auth/login
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Đăng ký tài khoản mới (chỉ cho phép MEMBER hoặc TRAINER; TRAINER bắt buộc có Branch_Id).
    /// POST /api/auth/register
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Đổi mật khẩu của người dùng đang đăng nhập.
    /// PUT /api/auth/change-password
    /// </summary>
    [HttpPut("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(new { message = "Token không hợp lệ hoặc đã hết hạn." });
        }

        await _authService.ChangePasswordAsync(userId, request, cancellationToken);
        return Ok(new { message = "Đổi mật khẩu thành công." });
    }
}
