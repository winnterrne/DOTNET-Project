using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class StaffRepository : GenericRepository<Staff>, IStaffRepository
{
    public StaffRepository(AppDbContext context) : base(context)
    {
    }
}
