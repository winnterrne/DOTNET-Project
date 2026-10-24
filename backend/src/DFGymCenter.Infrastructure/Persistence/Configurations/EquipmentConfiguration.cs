using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
{
    public void Configure(EntityTypeBuilder<Equipment> builder)
    {
        builder.ToTable("Equipment");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.BranchId)
            .HasColumnName("Branch_Id")
            .IsRequired();

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(e => e.Type)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasOne(e => e.Branch)
            .WithMany(b => b.Equipments)
            .HasForeignKey(e => e.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
