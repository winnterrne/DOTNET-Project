using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class BodyMeasurement : BaseEntity
{
    public Guid MemberId { get; set; }
    public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
    public bool IsInitial { get; set; }
    public string? Note { get; set; }

    // Navigation properties
    public Member Member { get; set; } = null!;
    public ICollection<MeasurementValue> Values { get; set; } = new List<MeasurementValue>();
    public ICollection<NutritionPlan> NutritionPlans { get; set; } = new List<NutritionPlan>();
}
