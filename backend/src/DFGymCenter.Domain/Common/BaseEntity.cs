namespace DFGymCenter.Domain.Common;

/// <summary>
/// Lớp cơ sở (Base Class) cho tất cả các thực thể trong hệ thống.
/// Đảm bảo tính đóng gói (Encapsulation) và tái sử dụng mã nguồn.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
