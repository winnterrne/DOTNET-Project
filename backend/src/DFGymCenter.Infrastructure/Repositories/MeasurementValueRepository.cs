using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class MeasurementValueRepository : GenericRepository<MeasurementValue>, IMeasurementValueRepository
{
    public MeasurementValueRepository(ApplicationDbContext context) : base(context)
    {
    }
}
