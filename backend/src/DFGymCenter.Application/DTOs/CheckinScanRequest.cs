namespace DFGymCenter.Application.DTOs;
public class CheckinScanRequest
{
    public string CardCode {get; set;} = string.Empty;
    public Guid BranchId {get; set;}
}