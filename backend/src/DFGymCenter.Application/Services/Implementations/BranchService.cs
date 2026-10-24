using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Application.DTOs.Branch;
using DFGymCenter.Application.Services.Interfaces;
using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Application.Services.Implementations;

/// <summary>
/// Triển khai nghiệp vụ cho Chi nhánh.
/// Tuân thủ quy tắc: Tầng Service đảm nhận Business Logic & truy xuất dữ liệu thông qua IApplicationDbContext.
/// </summary>
public class BranchService : IBranchService
{
    private readonly IAppDbContext _context;

    public BranchService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BranchDto>> GetAllBranchesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Branches
            .AsNoTracking()
            .Select(b => new BranchDto(
                b.Id,
                b.Name,
                b.District,
                b.Address,
                b.PhoneNumber,
                b.OperatingHours,
                b.IsActive
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<BranchDto?> GetBranchByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var branch = await _context.Branches
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (branch == null) return null;

        return new BranchDto(
            branch.Id,
            branch.Name,
            branch.District,
            branch.Address,
            branch.PhoneNumber,
            branch.OperatingHours,
            branch.IsActive
        );
    }

    public async Task<BranchDto> CreateBranchAsync(CreateBranchDto dto, CancellationToken cancellationToken = default)
    {
        var branch = new Branch
        {
            Name = dto.Name,
            District = dto.District,
            Address = dto.Address,
            PhoneNumber = dto.PhoneNumber,
            OperatingHours = dto.OperatingHours,
            IsActive = true
        };

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync(cancellationToken);

        return new BranchDto(
            branch.Id,
            branch.Name,
            branch.District,
            branch.Address,
            branch.PhoneNumber,
            branch.OperatingHours,
            branch.IsActive
        );
    }
}
