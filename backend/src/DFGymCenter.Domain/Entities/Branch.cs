using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

/// <summary>
/// Thực thể Chi nhánh phòng gym (Branch).
/// Chú ý: Không dùng Data Annotations ([Key], [Column], [Required]) ở tầng Domain 
/// để giữ Domain độc lập (POCO - Plain Old CLR Object). Việc cấu hình DB sẽ dùng Fluent API ở tầng Infrastructure.
/// </summary>
public class Branch : BaseEntity, IAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty; // e.g. Quận 1, Quận 7, Tân Bình
    public string Address { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string OperatingHours { get; set; } = "05:30 - 22:00";
    public bool IsActive { get; set; } = true;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
