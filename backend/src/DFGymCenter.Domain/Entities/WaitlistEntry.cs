using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class WaitlistEntry : BaseEntity
{
    public Guid ClassSessionId { get; set; }
    public Guid MemberId { get; set; }
    public int PriorityLevel { get; set; } = 1;
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "WAITING";

    // Navigation properties
    public ClassSession ClassSession { get; set; } = null!;
    public Member Member { get; set; } = null!;
}
