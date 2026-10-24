using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class CheckinConfiguration : IEntityTypeConfiguration<Checkin>
{
    public void Configure(EntityTypeBuilder<Checkin> builder)
    {
        builder.ToTable("Checkins");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(c => c.BranchId)
            .HasColumnName("Branch_Id")
            .IsRequired();

        builder.Property(c => c.CardId)
            .HasColumnName("Card_Id");

        builder.Property(c => c.BookingId)
            .HasColumnName("Booking_Id");

        builder.Property(c => c.RecordedBy)
            .HasColumnName("Recorded_By");

        builder.Property(c => c.Method)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(c => c.Note)
            .HasMaxLength(500);

        builder.Property(c => c.CheckInAt)
            .HasColumnName("Check_In_At")
            .IsRequired();

        builder.Property(c => c.CheckOutAt)
            .HasColumnName("Check_Out_At");

        builder.Property(c => c.IsAutoCheckout)
            .HasColumnName("Is_Auto_Checkout")
            .HasDefaultValue(false);

        builder.HasOne(c => c.Member)
            .WithMany(m => m.Checkins)
            .HasForeignKey(c => c.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Branch)
            .WithMany(b => b.Checkins)
            .HasForeignKey(c => c.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Card)
            .WithMany(mc => mc.Checkins)
            .HasForeignKey(c => c.CardId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(c => c.Booking)
            .WithOne(b => b.Checkin)
            .HasForeignKey<Checkin>(c => c.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(c => c.Recorder)
            .WithMany(s => s.RecordedCheckins)
            .HasForeignKey(c => c.RecordedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
