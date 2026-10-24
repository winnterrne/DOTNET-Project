using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class GymNewsConfiguration : IEntityTypeConfiguration<GymNews>
{
    public void Configure(EntityTypeBuilder<GymNews> builder)
    {
    }
}
