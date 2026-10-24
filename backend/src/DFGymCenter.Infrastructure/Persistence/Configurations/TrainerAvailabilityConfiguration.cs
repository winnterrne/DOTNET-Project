using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class TrainerAvailabilityConfiguration : IEntityTypeConfiguration<TrainerAvailability>
{
    public void Configure(EntityTypeBuilder<TrainerAvailability> builder)
    {
        builder.ToTable("Trainer_Availabilities");
        builder.HasKey(ta => ta.Id);

        builder.Property(ta => ta.TrainerId)
            .HasColumnName("Trainer_Id")
            .IsRequired();

        builder.Property(ta => ta.StartAt)
            .HasColumnName("Start_At")
            .IsRequired();

        builder.Property(ta => ta.EndAt)
            .HasColumnName("End_At")
            .IsRequired();

        builder.Property(ta => ta.IsBooked)
            .HasColumnName("Is_Booked")
            .HasDefaultValue(false);

        builder.HasOne(ta => ta.Trainer)
            .WithMany(t => t.Availabilities)
            .HasForeignKey(ta => ta.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
