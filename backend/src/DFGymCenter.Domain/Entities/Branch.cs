using DFGymCenter.Domain.Common;

namespace DFGymCenter.Domain.Entities;

/// <summary>
/// Thực thể Chi nhánh phòng gym (Branch).
/// Tương thích với cả ERD (BranchName, Phone, Open_time, Close_time, Status) và BranchService hiện có.
/// </summary>
public class Branch : BaseEntity, IAuditableEntity
{
    private string _name = string.Empty;
    private string _phoneNumber = string.Empty;

    public string Name
    {
        get => _name;
        set => _name = value;
    }

    public string BranchName
    {
        get => _name;
        set => _name = value;
    }

    public string District { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public string PhoneNumber
    {
        get => _phoneNumber;
        set => _phoneNumber = value;
    }

    public string Phone
    {
        get => _phoneNumber;
        set => _phoneNumber = value;
    }

    public TimeSpan OpenTime { get; set; } = new TimeSpan(5, 30, 0);
    public TimeSpan CloseTime { get; set; } = new TimeSpan(22, 0, 0);
    public string OperatingHours { get; set; } = "05:30 - 22:00";
    public string Status { get; set; } = "ACTIVE";
    public bool IsActive { get; set; } = true;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<Trainer> Trainers { get; set; } = new List<Trainer>();
    public ICollection<Staff> Staffs { get; set; } = new List<Staff>();
    public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
    public ICollection<PlanBranch> PlanBranches { get; set; } = new List<PlanBranch>();
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<GymClass> Classes { get; set; } = new List<GymClass>();
    public ICollection<Checkin> Checkins { get; set; } = new List<Checkin>();
    public ICollection<GymRule> GymRules { get; set; } = new List<GymRule>();
    public ICollection<SystemSetting> SystemSettings { get; set; } = new List<SystemSetting>();
}
