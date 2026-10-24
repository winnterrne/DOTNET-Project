using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class FreezeRequestConfiguration : IEntityTypeConfiguration<FreezeRequest>
{
    public void Configure(EntityTypeBuilder<FreezeRequest> builder)
    {
        builder.ToTable("Freeze_Requests");
        builder.HasKey(fr => fr.Id);

        builder.Property(fr => fr.MembershipId)
            .HasColumnName("Membership_Id")
            .IsRequired();

        builder.Property(fr => fr.HandledBy)
            .HasColumnName("Handled_By");

        builder.Property(fr => fr.FromDate)
            .HasColumnName("From_Date")
            .IsRequired();

        builder.Property(fr => fr.ToDate)
            .HasColumnName("To_Date")
            .IsRequired();

        builder.Property(fr => fr.Days)
            .IsRequired();

        builder.Property(fr => fr.Reason)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(fr => fr.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(fr => fr.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.HasOne(fr => fr.Membership)
            .WithMany(m => m.FreezeRequests)
            .HasForeignKey(fr => fr.MembershipId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(fr => fr.Handler)
            .WithMany(s => s.HandledFreezeRequests)
            .HasForeignKey(fr => fr.HandledBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
