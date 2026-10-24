using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MemberCardConfiguration : IEntityTypeConfiguration<MemberCard>
{
    public void Configure(EntityTypeBuilder<MemberCard> builder)
    {
        builder.ToTable("Member_Cards");
        builder.HasKey(mc => mc.Id);

        builder.Property(mc => mc.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(mc => mc.CardCode)
            .HasColumnName("Card_Code")
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(mc => mc.CardCode)
            .IsUnique();

        builder.Property(mc => mc.Status)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("ACTIVE");

        builder.HasOne(mc => mc.Member)
            .WithMany(m => m.MemberCards)
            .HasForeignKey(mc => mc.MemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
