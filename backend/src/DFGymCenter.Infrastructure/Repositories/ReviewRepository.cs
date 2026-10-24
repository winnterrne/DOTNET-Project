using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class ReviewRepository : GenericRepository<Review>, IReviewRepository
{
    public ReviewRepository(AppDbContext context) : base(context)
    {
    }
}
