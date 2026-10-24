using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Domain.Entities;

public class Checkin : BaseEntity
{
    public Guid MemberId { get; set; }
    public Guid BranchId { get; set; }
    public Guid? CardId { get; set; }
    public Guid? BookingId { get; set; }
    public Guid? RecordedBy { get; set; }
    public CheckinMethod Method { get; set; } = CheckinMethod.QR;
    public string? Note { get; set; }
    public DateTime CheckInAt { get; set; } = DateTime.UtcNow;
    public DateTime? CheckOutAt { get; set; }
    public bool IsAutoCheckout { get; set; }

    // Navigation properties
    public Member Member { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public MemberCard? Card { get; set; }
    public Booking? Booking { get; set; }
    public Staff? Recorder { get; set; }
}
