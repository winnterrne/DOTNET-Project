using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.UserId)
            .HasColumnName("User_Id")
            .IsRequired();

        builder.Property(n => n.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Content)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(n => n.IsRead)
            .HasColumnName("Is_Read")
            .HasDefaultValue(false);

        builder.Property(n => n.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.Property(n => n.RefType)
            .HasColumnName("Ref_Type")
            .HasMaxLength(50);

        builder.Property(n => n.RefId)
            .HasColumnName("Ref_Id");

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
