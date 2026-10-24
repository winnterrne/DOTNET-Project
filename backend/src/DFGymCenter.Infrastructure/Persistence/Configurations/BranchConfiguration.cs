using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

/// <summary>
/// Cấu hình Fluent API cho thực thể Branch.
/// Tách biệt hoàn toàn cấu trúc Database ra khỏi Domain Model.
/// </summary>
public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        // Tên bảng
        builder.ToTable("Branches");

        // Khóa chính
        builder.HasKey(b => b.Id);

        // Thuộc tính
        builder.Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(b => b.District)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(b => b.Address)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(b => b.PhoneNumber)
            .HasMaxLength(20);

        builder.Property(b => b.OperatingHours)
            .HasMaxLength(50);

        builder.Property(b => b.IsActive)
            .HasDefaultValue(true);

        // Index hỗ trợ tìm kiếm nhanh theo quận
        builder.HasIndex(b => b.District);
    }
}

