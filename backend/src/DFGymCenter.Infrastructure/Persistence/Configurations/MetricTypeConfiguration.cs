using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MetricTypeConfiguration : IEntityTypeConfiguration<MetricType>
{
    public void Configure(EntityTypeBuilder<MetricType> builder)
    {
        builder.ToTable("Metric_Types");
        builder.HasKey(mt => mt.Id);

        builder.Property(mt => mt.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(mt => mt.Code)
            .IsUnique();

        builder.Property(mt => mt.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(mt => mt.Unit)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(mt => mt.IsActive)
            .HasColumnName("Is_Active")
            .HasDefaultValue(true);
    }
}
