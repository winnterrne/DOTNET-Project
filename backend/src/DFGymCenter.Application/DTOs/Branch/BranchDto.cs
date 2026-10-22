namespace DFGymCenter.Application.DTOs.Branch;

/// <summary>
/// Data Transfer Object cho Chi nhánh phòng gym.
/// DTO ngăn cách dữ liệu Database khỏi Client, tránh Over-posting / Data Leakage.
/// </summary>
public record BranchDto(
    Guid Id,
    string Name,
    string District,
    string Address,
    string PhoneNumber,
    string OperatingHours,
    bool IsActive
);

public record CreateBranchDto(
    string Name,
    string District,
    string Address,
    string PhoneNumber,
    string OperatingHours
);
