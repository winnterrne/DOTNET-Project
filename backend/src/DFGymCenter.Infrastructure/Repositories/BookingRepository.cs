using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class BookingRepository : GenericRepository<Booking>, IBookingRepository
{
    public BookingRepository(AppDbContext context) : base(context)
    {
    }
}
