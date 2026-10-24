using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class ClassSessionConfiguration : IEntityTypeConfiguration<ClassSession>
{
    public void Configure(EntityTypeBuilder<ClassSession> builder)
    {
        builder.ToTable("Class_Sessions");
        builder.HasKey(cs => cs.Id);

        builder.Property(cs => cs.ClassId)
            .HasColumnName("Class_Id")
            .IsRequired();

        builder.Property(cs => cs.TrainerId)
            .HasColumnName("Trainer_Id")
            .IsRequired();

        builder.Property(cs => cs.SessionDate)
            .HasColumnName("Session_Date")
            .IsRequired();

        builder.Property(cs => cs.StartAt)
            .HasColumnName("Start_At")
            .IsRequired();

        builder.Property(cs => cs.EndAt)
            .HasColumnName("End_At")
            .IsRequired();

        builder.Property(cs => cs.Status)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasOne(cs => cs.GymClass)
            .WithMany(c => c.Sessions)
            .HasForeignKey(cs => cs.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cs => cs.Trainer)
            .WithMany(t => t.ClassSessions)
            .HasForeignKey(cs => cs.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
