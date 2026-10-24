using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class TrainerConfiguration : IEntityTypeConfiguration<Trainer>
{
    public void Configure(EntityTypeBuilder<Trainer> builder)
    {
        builder.ToTable("Trainers");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.UserId)
            .HasColumnName("User_Id")
            .IsRequired();

        builder.HasIndex(t => t.UserId)
            .IsUnique();

        builder.Property(t => t.BranchId)
            .HasColumnName("Branch_Id")
            .IsRequired();

        builder.Property(t => t.Specialty)
            .HasMaxLength(255);

        builder.Property(t => t.ExperienceYears)
            .HasColumnName("Experience_Years")
            .HasDefaultValue(0);

        builder.Property(t => t.Bio)
            .HasMaxLength(1000);

        builder.HasOne(t => t.User)
            .WithOne(u => u.Trainer)
            .HasForeignKey<Trainer>(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Branch)
            .WithMany(b => b.Trainers)
            .HasForeignKey(t => t.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
