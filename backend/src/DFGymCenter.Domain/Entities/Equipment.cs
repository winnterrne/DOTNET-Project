using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class Equipment : BaseEntity
{
    public Guid BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Operational;

    // Navigation properties
    public Branch Branch { get; set; } = null!;
    public ICollection<EquipmentIssue> Issues { get; set; } = new List<EquipmentIssue>();
}
