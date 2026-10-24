using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class BodyMeasurementConfiguration : IEntityTypeConfiguration<BodyMeasurement>
{
    public void Configure(EntityTypeBuilder<BodyMeasurement> builder)
    {
        builder.ToTable("Body_Measurements");
        builder.HasKey(bm => bm.Id);

        builder.Property(bm => bm.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(bm => bm.MeasuredAt)
            .HasColumnName("Measured_At")
            .IsRequired();

        builder.Property(bm => bm.IsInitial)
            .HasColumnName("Is_Initial")
            .HasDefaultValue(false);

        builder.Property(bm => bm.Note)
            .HasMaxLength(500);

        builder.HasOne(bm => bm.Member)
            .WithMany(m => m.BodyMeasurements)
            .HasForeignKey(bm => bm.MemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
