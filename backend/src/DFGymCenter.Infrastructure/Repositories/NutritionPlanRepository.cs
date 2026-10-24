using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class NutritionPlanRepository : GenericRepository<NutritionPlan>, INutritionPlanRepository
{
    public NutritionPlanRepository(AppDbContext context) : base(context)
    {
    }
}

