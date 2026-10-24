using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class GymClassRepository : GenericRepository<GymClass>, IGymClassRepository
{
    public GymClassRepository(AppDbContext context) : base(context)
    {
    }
}
