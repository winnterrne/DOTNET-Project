using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class GymClass : BaseEntity
{
    public Guid BranchId { get; set; }
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public int Capacity { get; set; } = 20;
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    // Navigation properties
    public Branch Branch { get; set; } = null!;
    public Trainer Trainer { get; set; } = null!;
    public ICollection<ClassSession> Sessions { get; set; } = new List<ClassSession>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
