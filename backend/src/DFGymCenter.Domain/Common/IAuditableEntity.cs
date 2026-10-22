namespace DFGymCenter.Domain.Common;

/// <summary>
/// Interface đánh dấu các thực thể cần lưu dấu vết thời gian tạo và chỉnh sửa (Audit Trail).
/// </summary>
public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
    string? CreatedBy { get; set; }
    string? UpdatedBy { get; set; }
}
