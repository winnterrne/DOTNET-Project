namespace DFGymCenter.Application.DTOs;
public class ManualCheckinRequest
{
    public Guid MemberId {get; set;}
    public Guid BranchId {get; set;}
    public string? Note {get; set;}
}