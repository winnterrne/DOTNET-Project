using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class MeasurementValue : BaseEntity
{
    public Guid MeasurementId { get; set; }
    public Guid MetricTypeId { get; set; }
    public decimal Value { get; set; }

    // Navigation properties
    public BodyMeasurement Measurement { get; set; } = null!;
    public MetricType MetricType { get; set; } = null!;
}
