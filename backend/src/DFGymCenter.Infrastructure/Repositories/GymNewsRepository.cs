using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class GymNewsRepository : GenericRepository<GymNews>, IGymNewsRepository
{
    public GymNewsRepository(ApplicationDbContext context) : base(context)
    {
    }
}
