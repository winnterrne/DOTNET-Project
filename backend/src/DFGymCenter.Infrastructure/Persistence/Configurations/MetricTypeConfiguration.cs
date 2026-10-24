using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MetricTypeConfiguration : IEntityTypeConfiguration<MetricType>
{
    public void Configure(EntityTypeBuilder<MetricType> builder)
    {
    }
}

