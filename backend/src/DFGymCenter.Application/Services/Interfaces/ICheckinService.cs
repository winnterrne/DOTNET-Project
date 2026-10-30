using DFGymCenter.Application.DTOs;
using DFGymCenter.Domain.Entities;
namespace DFGymCenter.Application.Services.Interfaces;

public interface ICheckinService
{
    Task<CheckinDto> ScanAsync(CheckinScanRequest request, CancellationToken cancellationToken = default);
    Task<CheckinDto> ManualAsync(ManualCheckinRequest request, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<int> GetOccupanyAsync(Guid branchId, CancellationToken cancellationToken = default);
}