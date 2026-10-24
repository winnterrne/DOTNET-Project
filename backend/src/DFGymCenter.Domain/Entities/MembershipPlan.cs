using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class MembershipPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public decimal Price { get; set; }
    public int PriorityLevel { get; set; } = 1;
    public int MaxBookingsPerMonth { get; set; }
    public int MaxFreezeTimes { get; set; }
    public int MaxFreezeDays { get; set; }
    public bool IsAllBranches { get; set; }
    public string PlanType { get; set; } = "MEMBERSHIP";
    public int PtSessions { get; set; }

    // Navigation properties
    public ICollection<PlanBranch> PlanBranches { get; set; } = new List<PlanBranch>();
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
}
