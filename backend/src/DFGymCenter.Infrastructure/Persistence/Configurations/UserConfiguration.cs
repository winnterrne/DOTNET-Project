using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.UserName)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(u => u.UserName)
            .IsUnique();

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(u => u.PasswordHash)
            .HasColumnName("Password_Hash")
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(u => u.Phone)
            .HasMaxLength(20);

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(u => u.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(UserStatus.Active)
            .IsRequired();

        builder.Property(u => u.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();
    }
}
