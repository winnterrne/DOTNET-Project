using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class Staff : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid BranchId { get; set; }
    public string Position { get; set; } = "Receptionist";

    // Navigation properties
    public User User { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public ICollection<EquipmentIssue> HandledIssues { get; set; } = new List<EquipmentIssue>();
    public ICollection<EquipmentIssueLog> IssueLogs { get; set; } = new List<EquipmentIssueLog>();
    public ICollection<FreezeRequest> HandledFreezeRequests { get; set; } = new List<FreezeRequest>();
    public ICollection<Checkin> RecordedCheckins { get; set; } = new List<Checkin>();
}
