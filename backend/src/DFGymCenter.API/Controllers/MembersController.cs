using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DFGymCenter.API.Controllers;

/// <summary>
/// Controller phục vụ Lễ tân / Admin tìm kiếm và tra cứu thông tin Hội viên.
/// </summary>
[Route("api/members")]
public class MembersController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public MembersController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Lễ tân tìm kiếm hội viên theo tên, SĐT, email hoặc mã thẻ.
    /// GET /api/members?search=
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "STAFF,ADMIN,TRAINER,Staff,Admin,Trainer")]
    [ProducesResponseType(typeof(IEnumerable<MemberDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MemberDto>>> SearchMembers(
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var members = await _authService.SearchMembersAsync(search, cancellationToken);
        return Ok(members);
    }
}
