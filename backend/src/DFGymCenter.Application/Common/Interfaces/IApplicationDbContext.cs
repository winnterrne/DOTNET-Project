using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Application.Common.Interfaces;

/// <summary>
/// Abstraction cho Database Context.
/// Tuân thủ nguyên lý Dependency Inversion (D trong SOLID):
/// Tầng Application chỉ phụ thuộc vào Interface này, không phụ thuộc trực tiếp vào DbContext ở Infrastructure.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Branch> Branches { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
