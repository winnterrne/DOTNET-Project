using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class CheckinRepository : GenericRepository<Checkin>, ICheckinRepository
{
    public CheckinRepository(ApplicationDbContext context) : base(context)
    {
    }
}
