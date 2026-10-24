using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.MembershipId)
            .HasColumnName("Membership_Id")
            .IsRequired();

        builder.Property(p => p.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.Method)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(p => p.GatewayTxnCode)
            .HasColumnName("Gateway_Txn_Code")
            .HasMaxLength(150);

        builder.Property(p => p.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.Property(p => p.PaidAt)
            .HasColumnName("Paid_At");

        builder.HasOne(p => p.Membership)
            .WithMany(m => m.Payments)
            .HasForeignKey(p => p.MembershipId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
