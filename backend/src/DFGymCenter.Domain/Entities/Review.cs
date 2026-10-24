using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class Review : BaseEntity
{
    public Guid MemberId { get; set; }
    public Guid? BookingId { get; set; }
    public Guid? TrainerId { get; set; }
    public Guid? ClassId { get; set; }
    public int Rating { get; set; } = 5;
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Member Member { get; set; } = null!;
    public Booking? Booking { get; set; }
    public Trainer? Trainer { get; set; }
    public GymClass? GymClass { get; set; }
}
