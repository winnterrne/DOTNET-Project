using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MemberCardConfiguration : IEntityTypeConfiguration<MemberCard>
{
    public void Configure(EntityTypeBuilder<MemberCard> builder)
    {
    }
}
