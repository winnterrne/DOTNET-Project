using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class GymNews : BaseEntity
{
    public Guid? BranchId { get; set; }
    public Guid? CreatedBy { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = "NEWS";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
