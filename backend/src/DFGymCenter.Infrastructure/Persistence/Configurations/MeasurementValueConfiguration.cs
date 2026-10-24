using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MeasurementValueConfiguration : IEntityTypeConfiguration<MeasurementValue>
{
    public void Configure(EntityTypeBuilder<MeasurementValue> builder)
    {
        builder.ToTable("Measurement_Values");
        builder.HasKey(mv => mv.Id);

        builder.Property(mv => mv.MeasurementId)
            .HasColumnName("Measurement_Id")
            .IsRequired();

        builder.Property(mv => mv.MetricTypeId)
            .HasColumnName("Metric_Type_Id")
            .IsRequired();

        builder.Property(mv => mv.Value)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.HasOne(mv => mv.Measurement)
            .WithMany(bm => bm.Values)
            .HasForeignKey(mv => mv.MeasurementId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(mv => mv.MetricType)
            .WithMany(mt => mt.Values)
            .HasForeignKey(mv => mv.MetricTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
