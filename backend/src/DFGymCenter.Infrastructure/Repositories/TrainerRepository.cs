using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class TrainerRepository : GenericRepository<Trainer>, ITrainerRepository
{
    public TrainerRepository(AppDbContext context) : base(context)
    {
    }
}
