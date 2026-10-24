using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class Membership : BaseEntity
{
    public Guid MemberId { get; set; }
    public Guid PlanId { get; set; }
    public Guid? RenewedFromId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int RemainingSessions { get; set; }
    public MembershipStatus Status { get; set; } = MembershipStatus.Active;
    public Guid? BranchId { get; set; }

    // Navigation properties
    public Member Member { get; set; } = null!;
    public MembershipPlan Plan { get; set; } = null!;
    public Membership? RenewedFrom { get; set; }
    public Branch? Branch { get; set; }
    public ICollection<Membership> Renewals { get; set; } = new List<Membership>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<FreezeRequest> FreezeRequests { get; set; } = new List<FreezeRequest>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
