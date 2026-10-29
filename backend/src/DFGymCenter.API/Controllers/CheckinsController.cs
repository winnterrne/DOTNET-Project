using System.Security.Claims;
using DFGymCenter.Application.DTOs;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Update;

namespace DFGymCenter.API.Controllers;

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CheckinsController : ControllerBase
    {
        private readonly ICheckinService _checkinService;
        public CheckinsController(ICheckinService checkinService)
        {
            _checkinService = checkinService;
        }
        // Post: api/checkin/scan
        [HttpPost("scan")]
        public async Task<IActionResult> Scan([FromBody] CheckinScanRequest request, CancellationToken cancellationToken)
        {
            var result = await _checkinService.ScanAsync(request, cancellationToken);
            return Ok(result);
        }

        // Post: api/checkin/manual
        [HttpPost("manual")]
        public async Task<IActionResult> Manual([FromBody] ManualCheckinRequest request,CancellationToken cancellationToken)
        {
            var userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var currentUserId))
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var currentUserRole =
                User.FindFirstValue(ClaimTypes.Role) ?? "";

            var result = await _checkinService.ManualAsync(
                request,
                currentUserId,
                currentUserRole,
                cancellationToken);

            return Ok(result);
        }
        [HttpGet("occupancy/{branchId:guid}")]
        public async Task<IActionResult> GetOccupancyAsync(Guid branchId, CancellationToken cancellationToken)
        {
            var count = await _checkinService.GetOccupanyAsync(branchId, cancellationToken);
            return Ok(new
            {
                branchId,
                occupany = count
            });
        }

    }


