using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class Booking : BaseEntity
{
    public Guid MemberId { get; set; }
    public Guid MembershipId { get; set; }
    public BookingType Type { get; set; } = BookingType.Class;
    public Guid? ClassSessionId { get; set; }
    public Guid? AvailabilityId { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }

    // Navigation properties
    public Member Member { get; set; } = null!;
    public Membership Membership { get; set; } = null!;
    public ClassSession? ClassSession { get; set; }
    public TrainerAvailability? Availability { get; set; }
    public Checkin? Checkin { get; set; }
    public Review? Review { get; set; }
}
