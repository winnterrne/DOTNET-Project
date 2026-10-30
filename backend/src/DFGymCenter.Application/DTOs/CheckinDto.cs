using DFGymCenter.Domain.Enums;

namespace DFGymCenter.Application.DTOs;

public class CheckinDto
{
    public Guid Id {get; set;}
    public Guid MemberId {get; set;}
    public string MemberName {get; set;} = string.Empty;
    public Guid BranchId {get; set;}
    public Guid? CardId {get; set;}
    public Guid? BookingId {get; set;}
    public CheckinMethod Method {get; set;}
    public DateTime CheckInAt {get; set;}
    public DateTime? CheckOutAt {get; set;}
    public bool IsAutoCheckout {get; set;}
    public string? Note {get; set;}
}

