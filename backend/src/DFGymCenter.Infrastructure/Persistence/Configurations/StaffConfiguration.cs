using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.ToTable("Staff");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.UserId)
            .HasColumnName("User_Id")
            .IsRequired();

        builder.HasIndex(s => s.UserId)
            .IsUnique();

        builder.Property(s => s.BranchId)
            .HasColumnName("Branch_Id")
            .IsRequired();

        builder.Property(s => s.Position)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasOne(s => s.User)
            .WithOne(u => u.Staff)
            .HasForeignKey<Staff>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Branch)
            .WithMany(b => b.Staffs)
            .HasForeignKey(s => s.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
