using System.Security.Claims;
using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DFGymCenter.API.Controllers;

/// <summary>
/// Controller quản lý Thẻ hội viên (MemberCard), QR Code, Cấp thẻ mới và Khóa/Báo mất thẻ.
/// </summary>
[Route("api/member-cards")]
public class MemberCardsController : ApiControllerBase
{
    private readonly IMemberCardService _memberCardService;

    public MemberCardsController(IMemberCardService memberCardService)
    {
        _memberCardService = memberCardService;
    }

    /// <summary>
    /// Lấy thông tin thẻ hội viên hiện tại (kèm mã QR và lịch sử thẻ) của người dùng đang đăng nhập.
    /// GET /api/member-cards/me
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(MemberCardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MemberCardDto>> GetMyCard(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập để xem thông tin thẻ hội viên." });
        }

        var card = await _memberCardService.GetMyCardAsync(userId.Value, cancellationToken);
        return Ok(card);
    }

    /// <summary>
    /// Lễ tân / Admin tra cứu danh sách thẻ hội viên (lọc theo memberId, từ khóa tìm kiếm hoặc trạng thái).
    /// GET /api/member-cards?memberId=&search=&status=
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "STAFF,ADMIN,Staff,Admin")]
    [ProducesResponseType(typeof(IEnumerable<MemberCardDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MemberCardDto>>> GetMemberCards(
        [FromQuery] Guid? memberId,
        [FromQuery] string? search,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var cards = await _memberCardService.GetCardsAsync(memberId, search, status, cancellationToken);
        return Ok(cards);
    }

    /// <summary>
    /// Lễ tân / Admin cấp thẻ hội viên mới (sinh Card_Code ngẫu nhiên, duy nhất; tự động chuyển thẻ cũ sang LOCKED/LOST).
    /// POST /api/member-cards/issue
    /// </summary>
    [HttpPost("issue")]
    [Authorize(Roles = "STAFF,ADMIN,Staff,Admin")]
    [ProducesResponseType(typeof(MemberCardDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<MemberCardDto>> IssueCard(
        [FromBody] IssueCardRequest request,
        CancellationToken cancellationToken)
    {
        var issued = await _memberCardService.IssueCardAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, issued);
    }

    /// <summary>
    /// Cập nhật trạng thái thẻ (ACTIVE / LOCKED / LOST).
    /// Hội viên chỉ được đặt LOST cho thẻ của chính mình; Lễ tân/Admin được phép khóa/mở khóa cho mọi hội viên.
    /// PATCH /api/member-cards/{id}/status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize]
    [ProducesResponseType(typeof(MemberCardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MemberCardDto>> UpdateCardStatus(
        Guid id,
        [FromBody] UpdateCardStatusRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập để thực hiện thao tác này." });
        }

        var role = GetCurrentUserRole();
        var updated = await _memberCardService.UpdateCardStatusAsync(
            id,
            request,
            userId.Value,
            role,
            cancellationToken);

        return Ok(updated);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(userIdStr, out var id) ? id : null;
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role")
            ?? "MEMBER";
    }
}
