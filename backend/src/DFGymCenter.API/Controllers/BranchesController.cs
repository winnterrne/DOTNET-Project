using DFGymCenter.Application.DTOs.Branch;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DFGymCenter.API.Controllers;

/// <summary>
/// Controller quản lý Chi nhánh phòng gym.
/// Tuân thủ Clean Architecture: Controller chỉ tiếp nhận request, gọi Service và trả về DTO.
/// Tuyệt đối không chứa logic nghiệp vụ hay truy vấn database trực tiếp.
/// </summary>
public class BranchesController : ApiControllerBase
{
    private readonly IBranchService _branchService;

    public BranchesController(IBranchService branchService)
    {
        _branchService = branchService;
    }

    /// <summary>
    /// Lấy danh sách tất cả chi nhánh (Quận 1, Quận 7, Tân Bình...)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BranchDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BranchDto>>> GetBranches(CancellationToken cancellationToken)
    {
        var branches = await _branchService.GetAllBranchesAsync(cancellationToken);
        return Ok(branches);
    }

    /// <summary>
    /// Lấy chi tiết chi nhánh theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BranchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BranchDto>> GetBranchById(Guid id, CancellationToken cancellationToken)
    {
        var branch = await _branchService.GetBranchByIdAsync(id, cancellationToken);
        if (branch == null)
        {
            return NotFound(new { message = $"Không tìm thấy chi nhánh với mã: {id}" });
        }

        return Ok(branch);
    }

    /// <summary>
    /// Tạo mới một chi nhánh phòng tập
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BranchDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<BranchDto>> CreateBranch([FromBody] CreateBranchDto dto, CancellationToken cancellationToken)
    {
        var created = await _branchService.CreateBranchAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetBranchById), new { id = created.Id }, created);
    }
}
