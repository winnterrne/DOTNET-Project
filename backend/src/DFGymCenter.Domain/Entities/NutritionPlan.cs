using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class NutritionPlan : BaseEntity
{
    public Guid MemberId { get; set; }
    public Guid? MeasurementId { get; set; }
    public string Goal { get; set; } = string.Empty;
    public string ActivityLevel { get; set; } = string.Empty;
    public string? DietaryNotes { get; set; }
    public int DailyCalories { get; set; }
    public int ProteinG { get; set; }
    public int CarbG { get; set; }
    public int FatG { get; set; }
    public string? MealSuggestion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Member Member { get; set; } = null!;
    public BodyMeasurement? Measurement { get; set; }
}
