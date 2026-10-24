using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class BodyMeasurementRepository : GenericRepository<BodyMeasurement>, IBodyMeasurementRepository
{
    public BodyMeasurementRepository(ApplicationDbContext context) : base(context)
    {
    }
}
