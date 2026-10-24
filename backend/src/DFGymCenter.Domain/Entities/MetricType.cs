using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class MetricType : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<MeasurementValue> Values { get; set; } = new List<MeasurementValue>();
}
