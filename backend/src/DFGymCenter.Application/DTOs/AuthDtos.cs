namespace DFGymCenter.Application.DTOs;

public class AuthDtos
{
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }

    /// <summary>
    /// Chỉ cho phép MEMBER hoặc TRAINER (TRAINER bắt buộc có BranchId).
    /// </summary>
    public string Role { get; set; } = "MEMBER";

    public Guid? BranchId { get; set; }
    public Guid? Branch_Id
    {
        get => BranchId;
        set { if (value.HasValue) BranchId = value; }
    }

    // Thông tin bổ sung cho Member
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }

    // Thông tin bổ sung cho Trainer
    public string? Specialty { get; set; }
    public int ExperienceYears { get; set; }
    public string? Bio { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = null!;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string? ConfirmPassword { get; set; }
}

public class UpdateMemberProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Specialty { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Bio { get; set; }
}

public class CreateStaffRequest
{
    public string Email { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = "STAFF";
    public Guid? BranchId { get; set; }
    public Guid? Branch_Id
    {
        get => BranchId;
        set { if (value.HasValue) BranchId = value; }
    }
    public string Position { get; set; } = "Receptionist";
    public string? Specialty { get; set; }
    public int ExperienceYears { get; set; } = 1;
    public string? Bio { get; set; }
}

public class UpdateUserStatusRequest
{
    public string? Status { get; set; }
    public bool? Locked { get; set; }
}
