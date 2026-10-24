using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class Member : BaseEntity
{
    public Guid UserId { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<MemberCard> MemberCards { get; set; } = new List<MemberCard>();
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<WaitlistEntry> WaitlistEntries { get; set; } = new List<WaitlistEntry>();
    public ICollection<Checkin> Checkins { get; set; } = new List<Checkin>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<EquipmentIssue> ReportedIssues { get; set; } = new List<EquipmentIssue>();
    public ICollection<BodyMeasurement> BodyMeasurements { get; set; } = new List<BodyMeasurement>();
    public ICollection<NutritionPlan> NutritionPlans { get; set; } = new List<NutritionPlan>();
}
