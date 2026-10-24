namespace DFGymCenter.Application.DTOs;

public class MemberDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CardCode { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string UserStatus { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; }

    // Thông tin gói hội viên hiện tại (phục vụ Lễ tân tra cứu)
    public string? CurrentPlanName { get; set; }
    public string? MembershipStatus { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int RemainingSessions { get; set; }
}
