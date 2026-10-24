using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class PlanBranchConfiguration : IEntityTypeConfiguration<PlanBranch>
{
    public void Configure(EntityTypeBuilder<PlanBranch> builder)
    {
    }
}
