namespace DFGymCenter.Domain.Enums;

public enum BookingType
{
    Class = 1,
    PersonalTrainer = 2
}

public enum BookingStatus
{
    Pending = 1,
    Confirmed = 2,
    Cancelled = 3,
    Attended = 4,
    NoShow = 5
}

public enum MembershipStatus
{
    Active = 1,
    Expired = 2,
    Frozen = 3,
    Pending = 4,
    Cancelled = 5
}

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Refunded = 4
}

public enum FreezeRequestStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

public enum CheckinMethod
{
    Card = 1,
    QR = 2,
    Manual = 3,
    Facial = 4
}

public enum EquipmentStatus
{
    Operational = 1,
    UnderMaintenance = 2,
    Broken = 3,
    Decommissioned = 4
}

public enum IssueStatus
{
    Open = 1,
    Investigating = 2,
    Fixed = 3,
    Closed = 4
}
