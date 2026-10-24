using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class GymRule : BaseEntity
{
    public Guid? BranchId { get; set; }
    public Guid? CreatedBy { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = "GENERAL";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Branch? Branch { get; set; }
    public User? Creator { get; set; }
}
