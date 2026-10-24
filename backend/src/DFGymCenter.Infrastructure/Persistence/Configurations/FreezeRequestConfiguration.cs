using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class FreezeRequestConfiguration : IEntityTypeConfiguration<FreezeRequest>
{
    public void Configure(EntityTypeBuilder<FreezeRequest> builder)
    {
    }
}
