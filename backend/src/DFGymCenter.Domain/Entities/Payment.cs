using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid MembershipId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = "CASH";
    public PaymentStatus Status { get; set; } = PaymentStatus.Completed;
    public string? GatewayTxnCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    // Navigation properties
    public Membership Membership { get; set; } = null!;
}
