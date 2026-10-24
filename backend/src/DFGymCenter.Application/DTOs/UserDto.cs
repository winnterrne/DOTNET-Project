namespace DFGymCenter.Application.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE";
    public bool Locked => Status.Equals("LOCKED", StringComparison.OrdinalIgnoreCase);
    public DateTime CreatedAt { get; set; }

    // Thông tin liên kết Member / Trainer / Staff
    public Guid? MemberId { get; set; }
    public string? CardCode { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }

    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string? Position { get; set; }
    public string? Specialty { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Bio { get; set; }
}
