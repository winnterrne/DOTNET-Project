using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class AssessmentNoteConfiguration : IEntityTypeConfiguration<AssessmentNote>
{
    public void Configure(EntityTypeBuilder<AssessmentNote> builder)
    {
    }
}
