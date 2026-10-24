using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

public class SystemSetting : BaseEntity
{
    public Guid? BranchId { get; set; }
    public Guid? UpdatedBy { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string DataType { get; set; } = "STRING";
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Branch? Branch { get; set; }
    public User? Updater { get; set; }
}
