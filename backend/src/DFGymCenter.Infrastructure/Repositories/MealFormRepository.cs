using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class MealFormRepository : GenericRepository<MealForm>, IMealFormRepository
{
    public MealFormRepository(AppDbContext context) : base(context)
    {
    }
}
