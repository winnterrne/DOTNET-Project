using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class EquipmentIssueLogConfiguration : IEntityTypeConfiguration<EquipmentIssueLog>
{
    public void Configure(EntityTypeBuilder<EquipmentIssueLog> builder)
    {
    }
}
