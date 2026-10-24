using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class WorkoutMeasurementConfiguration : IEntityTypeConfiguration<WorkoutMeasurement>
{
    public void Configure(EntityTypeBuilder<WorkoutMeasurement> builder)
    {
    }
}
