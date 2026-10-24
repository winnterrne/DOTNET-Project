using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class Trainer : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid BranchId { get; set; }
    public string? Specialty { get; set; }
    public int ExperienceYears { get; set; }
    public string? Bio { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public ICollection<GymClass> Classes { get; set; } = new List<GymClass>();
    public ICollection<ClassSession> ClassSessions { get; set; } = new List<ClassSession>();
    public ICollection<TrainerAvailability> Availabilities { get; set; } = new List<TrainerAvailability>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
