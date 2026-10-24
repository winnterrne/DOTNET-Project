using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class WorkoutMeasurementRepository : GenericRepository<WorkoutMeasurement>, IWorkoutMeasurementRepository
{
    public WorkoutMeasurementRepository(ApplicationDbContext context) : base(context)
    {
    }
}
