namespace DFGymCenter.Domain.Entities;

public class PlanBranch
{
    public Guid PlanId { get; set; }
    public Guid BranchId { get; set; }

    // Navigation properties
    public MembershipPlan Plan { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
}
