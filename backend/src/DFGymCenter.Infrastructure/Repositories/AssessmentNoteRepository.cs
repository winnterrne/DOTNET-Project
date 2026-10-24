using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;

namespace DFGymCenter.Infrastructure.Repositories;

public class AssessmentNoteRepository : GenericRepository<AssessmentNote>, IAssessmentNoteRepository
{
    public AssessmentNoteRepository(ApplicationDbContext context) : base(context)
    {
    }
}
