using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class EquipmentIssueConfiguration : IEntityTypeConfiguration<EquipmentIssue>
{
    public void Configure(EntityTypeBuilder<EquipmentIssue> builder)
    {
    }
}
