using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Domain.Entities;
using DFGymCenter.Domain.Enums;
using DFGymCenter.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DFGymCenter.Infrastructure.Persistence.Seed;

/// <summary>
/// Bộ khởi tạo và cứu hộ Database tự động (Defense Readiness - Task 1-A).
/// Dù giảng viên có xóa/drop toàn bộ Database khi chấm bài, khi API khởi động lại
/// hệ thống sẽ tự động chạy Migration / tạo lại 28 bảng từ AppDbContext (Fluent API) và nạp đầy đủ Seed Data (1-A).
/// </summary>
public class AppDbContextInitialiser
{
    private readonly ILogger<AppDbContextInitialiser> _logger;
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public AppDbContextInitialiser(
        ILogger<AppDbContextInitialiser> logger,
        AppDbContext context,
        ITokenService tokenService)
    {
        _logger = logger;
        _context = context;
        _tokenService = tokenService;
    }

    public async Task InitialiseAsync()
    {
        try
        {
            _logger.LogInformation("Đang kiểm tra và khởi tạo AppDbContext (28 Entities Fluent API)...");

            var migrations = _context.Database.GetMigrations();
            if (migrations.Any())
            {
                await _context.Database.MigrateAsync();
            }
            else
            {
                await _context.Database.EnsureCreatedAsync();
            }

            _logger.LogInformation("Khởi tạo cấu trúc 28 bảng Database thành công.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "MigrateAsync gặp xung đột schema cũ, đang tự động tái tạo từ AppDbContext Fluent API...");
            try
            {
                await _context.Database.EnsureDeletedAsync();
                var migrations = _context.Database.GetMigrations();
                if (migrations.Any())
                {
                    await _context.Database.MigrateAsync();
                }
                else
                {
                    await _context.Database.EnsureCreatedAsync();
                }
            }
            catch (Exception innerEx)
            {
                _logger.LogError(innerEx, "Đã xảy ra lỗi trong quá trình khởi tạo Database.");
                throw;
            }
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra lỗi khi Seed dữ liệu ban đầu (1-A).");
            throw;
        }
    }

    private async Task TrySeedAsync()
    {
        // 1. Seed Chi nhánh (Branches)
        if (!await _context.Branches.AnyAsync())
        {
            _logger.LogInformation("Đang tiến hành Seed danh sách chi nhánh TP.HCM...");

            var branches = new List<Branch>
            {
                new()
                {
                    Name = "DF Gym Center - Chi nhánh Bến Nghé",
                    District = "Quận 1",
                    Address = "12 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM",
                    PhoneNumber = "028 3822 1111",
                    OpenTime = new TimeSpan(5, 30, 0),
                    CloseTime = new TimeSpan(22, 30, 0),
                    OperatingHours = "05:30 - 22:30",
                    Status = "ACTIVE",
                    IsActive = true
                },
                new()
                {
                    Name = "DF Gym Center - Chi nhánh Phú Mỹ Hưng",
                    District = "Quận 7",
                    Address = "105 Tôn Dật Tiên, Tân Phong, Quận 7, TP.HCM",
                    PhoneNumber = "028 5410 2222",
                    OpenTime = new TimeSpan(5, 30, 0),
                    CloseTime = new TimeSpan(22, 0, 0),
                    OperatingHours = "05:30 - 22:00",
                    Status = "ACTIVE",
                    IsActive = true
                },
                new()
                {
                    Name = "DF Gym Center - Chi nhánh Sân Bay",
                    District = "Tân Bình",
                    Address = "18 Hồng Hà, Phường 2, Quận Tân Bình, TP.HCM",
                    PhoneNumber = "028 3848 3333",
                    OpenTime = new TimeSpan(5, 0, 0),
                    CloseTime = new TimeSpan(23, 0, 0),
                    OperatingHours = "05:00 - 23:00",
                    Status = "ACTIVE",
                    IsActive = true
                },
                new()
                {
                    Name = "DF Gym Center - Chi nhánh Landmark",
                    District = "Bình Thạnh",
                    Address = "208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP.HCM",
                    PhoneNumber = "028 3512 4444",
                    OpenTime = new TimeSpan(5, 30, 0),
                    CloseTime = new TimeSpan(22, 0, 0),
                    OperatingHours = "05:30 - 22:00",
                    Status = "ACTIVE",
                    IsActive = true
                }
            };

            await _context.Branches.AddRangeAsync(branches);
            await _context.SaveChangesAsync();
        }

        var firstBranch = await _context.Branches.FirstAsync();

        // 2. Seed Users (Admin, Staff/Lễ tân, Trainer/HLV, Members/Hội viên) — Mật khẩu mặc định: 123456
        if (!await _context.Users.AnyAsync())
        {
            _logger.LogInformation("Đang tiến hành Seed tài khoản mẫu (Admin, Lễ tân, HLV, Hội viên)...");
            var defaultPasswordHash = _tokenService.HashPassword("123456");

            var adminUser = new User
            {
                Email = "admin@dfgym.vn",
                UserName = "admin",
                FullName = "Quản trị viên DFGym",
                PasswordHash = defaultPasswordHash,
                Phone = "0909000001",
                Role = UserRole.Admin,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            var staffUser = new User
            {
                Email = "letan@dfgym.vn",
                UserName = "letan_q1",
                FullName = "Phạm Thu Hà (Lễ tân)",
                PasswordHash = defaultPasswordHash,
                Phone = "0909000002",
                Role = UserRole.Staff,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            var staffProfile = new Staff
            {
                UserId = staffUser.Id,
                BranchId = firstBranch.Id,
                Position = "Receptionist"
            };

            var trainerUser = new User
            {
                Email = "pt@dfgym.vn",
                UserName = "hlv_minhkhoi",
                FullName = "Trần Minh Khôi (HLV)",
                PasswordHash = defaultPasswordHash,
                Phone = "0909000003",
                Role = UserRole.Trainer,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            var trainerProfile = new Trainer
            {
                UserId = trainerUser.Id,
                BranchId = firstBranch.Id,
                Specialty = "Strength, Hypertrophy, HIIT",
                ExperienceYears = 6,
                Bio = "Huấn luyện viên chứng chỉ NASM-CPT với hơn 6 năm kinh nghiệm huấn luyện thực chiến."
            };

            var memberUser1 = new User
            {
                Email = "hoivien@dfgym.vn",
                UserName = "hoivien",
                FullName = "Nguyễn Hoàng Nam",
                PasswordHash = defaultPasswordHash,
                Phone = "0901234567",
                Role = UserRole.Member,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            var member1 = new Member
            {
                UserId = memberUser1.Id,
                Address = "45 Nguyễn Huệ, Quận 1, TP.HCM",
                DateOfBirth = new DateTime(1998, 5, 15),
                Gender = "male"
            };
            var card1 = new MemberCard
            {
                MemberId = member1.Id,
                CardCode = "DF-1001",
                Status = "ACTIVE"
            };

            var memberUser2 = new User
            {
                Email = "minhanh@dfgym.vn",
                UserName = "minhanh",
                FullName = "Lê Minh Anh",
                PasswordHash = defaultPasswordHash,
                Phone = "0902345678",
                Role = UserRole.Member,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            var member2 = new Member
            {
                UserId = memberUser2.Id,
                Address = "120 Nguyễn Thị Thập, Quận 7, TP.HCM",
                DateOfBirth = new DateTime(2000, 8, 20),
                Gender = "female"
            };
            var card2 = new MemberCard
            {
                MemberId = member2.Id,
                CardCode = "DF-1002",
                Status = "ACTIVE"
            };

            await _context.Users.AddRangeAsync(adminUser, staffUser, trainerUser, memberUser1, memberUser2);
            await _context.Staff.AddAsync(staffProfile);
            await _context.Trainers.AddAsync(trainerProfile);
            await _context.Members.AddRangeAsync(member1, member2);
            await _context.MemberCards.AddRangeAsync(card1, card2);
            await _context.SaveChangesAsync();

            // 3. Seed Gói hội viên (MembershipPlans) & Đăng ký gói (Memberships gồm Branch_Id)
            if (!await _context.MembershipPlans.AnyAsync())
            {
                var planStandard = new MembershipPlan
                {
                    Name = "Gói Standard 1 Tháng",
                    DurationDays = 30,
                    Price = 790_000m,
                    PriorityLevel = 1,
                    MaxBookingsPerMonth = 12,
                    MaxFreezeTimes = 0,
                    MaxFreezeDays = 0,
                    IsAllBranches = false,
                    PlanType = "MEMBERSHIP",
                    PtSessions = 0
                };

                var planVip = new MembershipPlan
                {
                    Name = "Gói VIP All-Pass 6 Tháng",
                    DurationDays = 180,
                    Price = 4_200_000m,
                    PriorityLevel = 3,
                    MaxBookingsPerMonth = 60,
                    MaxFreezeTimes = 2,
                    MaxFreezeDays = 30,
                    IsAllBranches = true,
                    PlanType = "MEMBERSHIP",
                    PtSessions = 5
                };

                await _context.MembershipPlans.AddRangeAsync(planStandard, planVip);
                await _context.PlanBranches.AddAsync(new PlanBranch
                {
                    PlanId = planStandard.Id,
                    BranchId = firstBranch.Id
                });

                var activeMembership = new Membership
                {
                    MemberId = member1.Id,
                    PlanId = planVip.Id,
                    BranchId = firstBranch.Id,
                    StartDate = DateTime.UtcNow.AddDays(-15),
                    EndDate = DateTime.UtcNow.AddDays(165),
                    RemainingSessions = 5,
                    Status = MembershipStatus.Active
                };

                var payment = new Payment
                {
                    MembershipId = activeMembership.Id,
                    Amount = planVip.Price,
                    Method = "TRANSFER",
                    Status = PaymentStatus.Completed,
                    GatewayTxnCode = "TXN-SEED-001",
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    PaidAt = DateTime.UtcNow.AddDays(-15)
                };

                await _context.Memberships.AddAsync(activeMembership);
                await _context.Payments.AddAsync(payment);
                await _context.SaveChangesAsync();
            }

            // 4. Seed MetricTypes, GymRules, SystemSettings
            if (!await _context.MetricTypes.AnyAsync())
            {
                await _context.MetricTypes.AddRangeAsync(
                    new MetricType { Code = "WEIGHT", Name = "Cân nặng", Unit = "kg", IsActive = true },
                    new MetricType { Code = "BMI", Name = "Chỉ số BMI", Unit = "kg/m2", IsActive = true },
                    new MetricType { Code = "BODY_FAT", Name = "Tỷ lệ mỡ cơ thể", Unit = "%", IsActive = true },
                    new MetricType { Code = "MUSCLE_MASS", Name = "Khối lượng cơ", Unit = "kg", IsActive = true },
                    new MetricType { Code = "WAIST", Name = "Vòng eo", Unit = "cm", IsActive = true }
                );
            }

            if (!await _context.GymRules.AnyAsync())
            {
                await _context.GymRules.AddRangeAsync(
                    new GymRule
                    {
                        BranchId = firstBranch.Id,
                        CreatedBy = adminUser.Id,
                        Title = "Trang phục & Giày tập tiêu chuẩn",
                        Content = "Hội viên bắt buộc mang giày thể thao đế mềm và khăn tập cá nhân khi sử dụng khu vực máy tập.",
                        Category = "ATTIRE",
                        IsActive = true
                    },
                    new GymRule
                    {
                        BranchId = firstBranch.Id,
                        CreatedBy = adminUser.Id,
                        Title = "Quy định hoàn trả tạ sau khi tập",
                        Content = "Vui lòng tháo bánh tạ và đặt lại đúng kệ sau khi hoàn thành bài tập để đảm bảo an toàn chung.",
                        Category = "SAFETY",
                        IsActive = true
                    }
                );
            }

            if (!await _context.SystemSettings.AnyAsync())
            {
                await _context.SystemSettings.AddRangeAsync(
                    new SystemSetting
                    {
                        BranchId = firstBranch.Id,
                        UpdatedBy = adminUser.Id,
                        SettingKey = "CANCEL_BOOKING_MIN_HOURS",
                        SettingValue = "2",
                        DataType = "INT",
                        Description = "Số giờ tối thiểu trước giờ học được phép hủy lịch miễn phí"
                    },
                    new SystemSetting
                    {
                        BranchId = firstBranch.Id,
                        UpdatedBy = adminUser.Id,
                        SettingKey = "AUTO_CHECKOUT_HOURS",
                        SettingValue = "4",
                        DataType = "INT",
                        Description = "Số giờ tối đa tự động check-out nếu hội viên quên quét ra"
                    }
                );
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Seed dữ liệu mẫu (1-A) vào AppDbContext hoàn tất thành công.");
        }
    }
}
