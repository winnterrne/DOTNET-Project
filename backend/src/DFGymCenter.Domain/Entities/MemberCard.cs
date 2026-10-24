using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class MemberCard : BaseEntity
{
    public Guid MemberId { get; set; }
    public string CardCode { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE";

    // Navigation properties
    public Member Member { get; set; } = null!;
    public ICollection<Checkin> Checkins { get; set; } = new List<Checkin>();
}
