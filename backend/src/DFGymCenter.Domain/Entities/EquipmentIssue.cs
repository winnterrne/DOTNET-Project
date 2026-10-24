using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class EquipmentIssue : BaseEntity
{
    public Guid EquipmentId { get; set; }
    public Guid ReportedBy { get; set; }
    public Guid? HandledBy { get; set; }
    public string Description { get; set; } = string.Empty;
    public IssueStatus Status { get; set; } = IssueStatus.Open;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Equipment Equipment { get; set; } = null!;
    public Member Reporter { get; set; } = null!;
    public Staff? Handler { get; set; }
    public ICollection<EquipmentIssueLog> Logs { get; set; } = new List<EquipmentIssueLog>();
}
