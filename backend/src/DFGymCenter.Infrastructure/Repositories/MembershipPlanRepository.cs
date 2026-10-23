using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class MembershipPlanRepository : GenericRepository<MembershipPlan>, IMembershipPlanRepository
{
    public MembershipPlanRepository(ApplicationDbContext context) : base(context)
    {
    }
}
