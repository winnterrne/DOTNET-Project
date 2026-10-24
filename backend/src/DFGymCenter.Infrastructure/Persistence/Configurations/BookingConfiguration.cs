using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("Bookings");
        builder.HasKey(b => b.Id);

        builder.Property(b => b.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(b => b.MembershipId)
            .HasColumnName("Membership_Id")
            .IsRequired();

        builder.Property(b => b.Type)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(b => b.ClassSessionId)
            .HasColumnName("Class_Session_Id");

        builder.Property(b => b.AvailabilityId)
            .HasColumnName("Availability_Id");

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(b => b.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.Property(b => b.CancelledAt)
            .HasColumnName("Cancelled_At");

        builder.HasOne(b => b.Member)
            .WithMany(m => m.Bookings)
            .HasForeignKey(b => b.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Membership)
            .WithMany(ms => ms.Bookings)
            .HasForeignKey(b => b.MembershipId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.ClassSession)
            .WithMany(cs => cs.Bookings)
            .HasForeignKey(b => b.ClassSessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Availability)
            .WithMany(ta => ta.Bookings)
            .HasForeignKey(b => b.AvailabilityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
