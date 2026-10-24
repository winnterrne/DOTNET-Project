using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = "INFO";
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? RefType { get; set; }
    public Guid? RefId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}
