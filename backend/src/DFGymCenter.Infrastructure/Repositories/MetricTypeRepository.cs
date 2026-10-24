using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class MetricTypeRepository : GenericRepository<MetricType>, IMetricTypeRepository
{
    public MetricTypeRepository(AppDbContext context) : base(context)
    {
    }
}

