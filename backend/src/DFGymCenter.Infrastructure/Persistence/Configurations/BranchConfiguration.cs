using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("Branches");
        builder.HasKey(b => b.Id);

        builder.Ignore(b => b.BranchName);
        builder.Ignore(b => b.Phone);

        builder.Property(b => b.Name)
            .HasColumnName("BranchName")
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(b => b.District)
            .HasMaxLength(50);

        builder.Property(b => b.Address)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(b => b.PhoneNumber)
            .HasColumnName("Phone")
            .HasMaxLength(20);

        builder.Property(b => b.OpenTime)
            .HasColumnName("Open_Time");

        builder.Property(b => b.CloseTime)
            .HasColumnName("Close_Time");

        builder.Property(b => b.OperatingHours)
            .HasMaxLength(50);

        builder.Property(b => b.Status)
            .HasMaxLength(30)
            .HasDefaultValue("ACTIVE");

        builder.Property(b => b.IsActive)
            .HasDefaultValue(true);

        builder.HasIndex(b => b.District);
    }
}
