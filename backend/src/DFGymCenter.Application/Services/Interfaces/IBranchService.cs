using DFGymCenter.Application.DTOs.Branch;

namespace DFGymCenter.Application.Services.Interfaces;

public interface IBranchService
{
    Task<IEnumerable<BranchDto>> GetAllBranchesAsync(CancellationToken cancellationToken = default);
    Task<BranchDto?> GetBranchByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BranchDto> CreateBranchAsync(CreateBranchDto dto, CancellationToken cancellationToken = default);
}
