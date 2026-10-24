using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MeasurementValueConfiguration : IEntityTypeConfiguration<MeasurementValue>
{
    public void Configure(EntityTypeBuilder<MeasurementValue> builder)
    {
    }
}
