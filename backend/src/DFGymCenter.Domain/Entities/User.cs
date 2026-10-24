using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class User : BaseEntity, IAuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.Member;
    public UserStatus Status { get; set; } = UserStatus.Active;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public Member? Member { get; set; }
    public Trainer? Trainer { get; set; }
    public Staff? Staff { get; set; }
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<GymRule> CreatedGymRules { get; set; } = new List<GymRule>();
    public ICollection<SystemSetting> UpdatedSystemSettings { get; set; } = new List<SystemSetting>();
}
