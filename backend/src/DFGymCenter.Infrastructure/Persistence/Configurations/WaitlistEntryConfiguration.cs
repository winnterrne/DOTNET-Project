using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class WaitlistEntryConfiguration : IEntityTypeConfiguration<WaitlistEntry>
{
    public void Configure(EntityTypeBuilder<WaitlistEntry> builder)
    {
        builder.ToTable("Waitlist_Entries");
        builder.HasKey(w => w.Id);

        builder.Property(w => w.ClassSessionId)
            .HasColumnName("Class_Session_Id")
            .IsRequired();

        builder.Property(w => w.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(w => w.PriorityLevel)
            .HasColumnName("Priority_Level");

        builder.Property(w => w.RegisteredAt)
            .HasColumnName("Registered_At")
            .IsRequired();

        builder.Property(w => w.Status)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasOne(w => w.ClassSession)
            .WithMany(cs => cs.WaitlistEntries)
            .HasForeignKey(w => w.ClassSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.Member)
            .WithMany(m => m.WaitlistEntries)
            .HasForeignKey(w => w.MemberId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
