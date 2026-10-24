using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class GymClassConfiguration : IEntityTypeConfiguration<GymClass>
{
    public void Configure(EntityTypeBuilder<GymClass> builder)
    {
        builder.ToTable("Classes");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.BranchId)
            .HasColumnName("Branch_Id")
            .IsRequired();

        builder.Property(c => c.TrainerId)
            .HasColumnName("Trainer_Id")
            .IsRequired();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Room)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Capacity)
            .IsRequired();

        builder.Property(c => c.DayOfWeek)
            .HasColumnName("Day_Of_Week")
            .IsRequired();

        builder.Property(c => c.StartTime)
            .HasColumnName("Start_Time")
            .IsRequired();

        builder.Property(c => c.EndTime)
            .HasColumnName("End_Time")
            .IsRequired();

        builder.HasOne(c => c.Branch)
            .WithMany(b => b.Classes)
            .HasForeignKey(c => c.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Trainer)
            .WithMany(t => t.Classes)
            .HasForeignKey(c => c.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
