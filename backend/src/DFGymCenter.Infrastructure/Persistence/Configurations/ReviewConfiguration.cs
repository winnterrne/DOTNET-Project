using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(r => r.BookingId)
            .HasColumnName("Booking_Id");

        builder.Property(r => r.TrainerId)
            .HasColumnName("Trainer_Id");

        builder.Property(r => r.ClassId)
            .HasColumnName("Class_Id");

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(1000);

        builder.Property(r => r.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.HasOne(r => r.Member)
            .WithMany(m => m.Reviews)
            .HasForeignKey(r => r.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Booking)
            .WithOne(b => b.Review)
            .HasForeignKey<Review>(r => r.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(r => r.Trainer)
            .WithMany(t => t.Reviews)
            .HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(r => r.GymClass)
            .WithMany(c => c.Reviews)
            .HasForeignKey(r => r.ClassId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
