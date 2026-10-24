using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.ToTable("Members");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.UserId)
            .HasColumnName("User_Id")
            .IsRequired();

        builder.HasIndex(m => m.UserId)
            .IsUnique();

        builder.Property(m => m.Address)
            .HasMaxLength(255);

        builder.Property(m => m.Gender)
            .HasMaxLength(20);

        builder.HasOne(m => m.User)
            .WithOne(u => u.Member)
            .HasForeignKey<Member>(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
