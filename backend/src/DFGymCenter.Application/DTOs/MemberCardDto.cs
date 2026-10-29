using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DFGymCenter.Application.DTOs;

public class MemberCardDto
{
    public Guid Id { get; set; }

    [JsonPropertyName("memberId")]
    public Guid MemberId { get; set; }

    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("cardCode")]
    public string CardCode { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "ACTIVE";

    // Thông tin Hội viên sở hữu thẻ (phục vụ màn hình Lễ tân & Profile)
    public string MemberName { get; set; } = string.Empty;
    public string MemberEmail { get; set; } = string.Empty;
    public string? MemberPhone { get; set; }
    public string UserStatus { get; set; } = "ACTIVE";
    public DateTime MemberCreatedAt { get; set; }

    // Thông tin gói tập hiện tại
    public string? CurrentPlanName { get; set; }
    public string? MembershipStatus { get; set; }
    public DateTime? PlanStartDate { get; set; }
    public DateTime? PlanEndDate { get; set; }

    // Danh sách toàn bộ thẻ của hội viên (gồm thẻ hiện tại và các thẻ cũ đã LOCKED / LOST)
    public IReadOnlyList<MemberCardSummaryDto>? AllCards { get; set; }
}

public class MemberCardSummaryDto
{
    public Guid Id { get; set; }
    public Guid MemberId { get; set; }
    public string CardCode { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE";
}

public class IssueCardRequest
{
    [Required(ErrorMessage = "Member_Id là bắt buộc khi cấp thẻ.")]
    [JsonPropertyName("memberId")]
    public Guid MemberId { get; set; }

    [JsonPropertyName("member_Id")]
    public Guid? Member_Id
    {
        get => MemberId;
        set
        {
            if (value.HasValue && value.Value != Guid.Empty)
            {
                MemberId = value.Value;
            }
        }
    }

    /// <summary>
    /// Trạng thái muốn áp dụng cho thẻ cũ đang ACTIVE: "LOCKED" hoặc "LOST".
    /// Mặc định: nếu Reason là báo mất thì chuyển sang "LOST", ngược lại chuyển sang "LOCKED".
    /// </summary>
    [MaxLength(30)]
    public string? PreviousCardStatus { get; set; }

    [MaxLength(255)]
    public string? Reason { get; set; }
}

public class UpdateCardStatusRequest
{
    [Required(ErrorMessage = "Trạng thái thẻ (Status) là bắt buộc (ACTIVE, LOCKED hoặc LOST).")]
    [MaxLength(30)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Reason { get; set; }
}
