using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class ClassSession : BaseEntity
{
    public Guid ClassId { get; set; }
    public Guid TrainerId { get; set; }
    public DateTime SessionDate { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public string Status { get; set; } = "SCHEDULED";

    // Navigation properties
    public GymClass GymClass { get; set; } = null!;
    public Trainer Trainer { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<WaitlistEntry> WaitlistEntries { get; set; } = new List<WaitlistEntry>();
}
