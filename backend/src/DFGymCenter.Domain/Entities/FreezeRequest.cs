using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class FreezeRequest : BaseEntity
{
    public Guid MembershipId { get; set; }
    public Guid? HandledBy { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int Days { get; set; }
    public string Reason { get; set; } = string.Empty;
    public FreezeRequestStatus Status { get; set; } = FreezeRequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Membership Membership { get; set; } = null!;
    public Staff? Handler { get; set; }
}
