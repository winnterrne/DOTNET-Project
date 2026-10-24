# 📁 Cấu Trúc Thư Mục — DFGymCenter

> **Stack:** .NET 10 Web API (Clean Architecture) + React 18 + TypeScript + Vite  
> **Git branch đang làm:** `nhan` | **Thư mục gốc:** `c:\CODE\DOTNET\DOTNET-Project`

---

```
DOTNET-Project/                             ← 🏠 Root của toàn bộ project
├── .gitignore                              ← Bỏ qua bin/, obj/, node_modules/, dist/, .env
│
├── backend/                               ← 🔧 .NET 10 Web API — Clean Architecture
│   ├── DFGymCenter.slnx                   ← Solution file (VS 2022 / Rider — liên kết 4 project)
│   └── src/
│       │
│       ├── DFGymCenter.Domain/            ← 🟣 TẦNG DOMAIN — Tim hệ thống, không phụ thuộc gì
│       │   ├── DFGymCenter.Domain.csproj
│       │   ├── Common/
│       │   │   ├── BaseEntity.cs          ← Lớp gốc: Id (Guid), CreatedAt, UpdatedAt
│       │   │   └── IAuditableEntity.cs    ← Interface audit: CreatedBy, UpdatedBy
│       │   ├── Entities/                  ← 📦 Các Entity theo ERD
│       │   │   ├── User.cs                ← Người dùng hệ thống (Admin, Staff, Member, Trainer)
│       │   │   ├── Staff.cs               ← Nhân viên lễ tân — liên kết User + Branch
│       │   │   ├── Trainer.cs             ← Huấn luyện viên — chuyên môn, kinh nghiệm, chi nhánh
│       │   │   ├── TrainerAvailability.cs ← Khung giờ rảnh HLV mở cho PT 1-kèm-1
│       │   │   ├── Member.cs              ← Hội viên — địa chỉ, giới tính, ghi chú
│       │   │   ├── MemberCard.cs          ← Thẻ thành viên — mã thẻ, ngày cấp, trạng thái
│       │   │   ├── Branch.cs              ← Chi nhánh — giờ mở cửa, địa chỉ, danh sách phòng
│       │   │   ├── MembershipPlan.cs      ← Gói hội viên — giá, thời hạn, ưu đãi freeze, lớp nhóm
│       │   │   ├── PlanBranch.cs          ← Bảng nối: MembershipPlan ↔ Branch (many-to-many)
│       │   │   ├── Membership.cs          ← Đăng ký gói của hội viên — ngày bắt đầu/kết thúc
│       │   │   ├── Booking.cs             ← Đặt lịch lớp nhóm của hội viên
│       │   │   ├── WaitlistEntry.cs       ← Danh sách chờ lớp học — độ ưu tiên theo gói
│       │   │   ├── GymClass.cs            ← Lớp học nhóm — HLV, phòng, lịch lặp lại
│       │   │   ├── ClassSession.cs        ← Buổi học cụ thể — ngày giờ, trạng thái, điểm danh
│       │   │   ├── Checkin.cs             ← Lịch sử check-in/check-out tại chi nhánh
│       │   │   ├── Equipment.cs           ← Thiết bị tập — mã, tên, loại, chi nhánh, tình trạng
│       │   │   ├── EquipmentIssue.cs      ← Sự cố thiết bị được báo cáo
│       │   │   ├── EquipmentIssueLog.cs   ← Nhật ký xử lý sự cố thiết bị
│       │   │   ├── FreezeRequest.cs       ← Yêu cầu tạm ngưng gói hội viên (freeze)
│       │   │   ├── Payment.cs             ← Thanh toán gói — phương thức, trạng thái, gateway
│       │   │   ├── Notification.cs        ← Thông báo hệ thống gửi đến người dùng
│       │   │   ├── Review.cs              ← Đánh giá của hội viên sau buổi PT / lớp nhóm
│       │   │   ├── BodyMetric.cs          ← Chỉ số cơ thể (BMI, cân nặng, chiều cao...)
│       │   │   ├── BodyMeasurement.cs     ← Phiên đo cơ thể (ngày đo, ghi chú)
│       │   │   ├── MeasurementValue.cs    ← Giá trị đo cụ thể theo MetricType
│       │   │   ├── MetricType.cs          ← Loại chỉ số đo: Cân nặng, BMI, Mỡ cơ thể...
│       │   │   ├── NutritionPlan.cs       ← Kế hoạch dinh dưỡng do HLV lập cho hội viên
│       │   │   ├── GymNews.cs             ← Tin tức / thông báo nội bộ phòng gym
│       │   │   ├── SystemSetting.cs       ← Cấu hình hệ thống dạng key-value
│       │   │   ├── MealForm.cs            ← Thực đơn dinh dưỡng (Guide, Cal, IsActive)
│       │   │   ├── AssessmentNote.cs      ← Ghi chú đánh giá chỉ số cơ thể
│       │   │   └── WorkoutMeasurement.cs  ← Đo lường thông số buổi tập theo hội viên
│       │   ├── Enums/
│       │   │   ├── GymEnums.cs            ← Enum: BookingStatus, PaymentStatus, EquipmentStatus...
│       │   │   └── UserRole.cs            ← Enum: Admin, Receptionist, Trainer, Member
│       │   ├── Exceptions/
│       │   │   ├── DomainException.cs     ← Exception nghiệp vụ gốc của Domain
│       │   │   ├── NotFoundException.cs   ← Entity không tìm thấy → HTTP 404
│       │   │   └── ValidationException.cs ← Dữ liệu không hợp lệ → HTTP 422
│       │   └── Interfaces/                ← 📜 Repository Interfaces định nghĩa tại Domain
│       │       ├── IGenericRepository.cs  ← CRUD generics: GetById, GetAll, Add, Update, Delete
│       │       ├── IUnitOfWork.cs         ← Gom tất cả repo, commit một lần SaveChangesAsync()
│       │       ├── IUserRepository.cs     ← Tìm user theo email, role...
│       │       ├── IMemberRepository.cs   ← Tra cứu hội viên theo mã thẻ
│       │       ├── IStaffRepository.cs    ← Lấy staff theo chi nhánh
│       │       ├── ITrainerRepository.cs  ← Lấy HLV theo chi nhánh, chuyên môn
│       │       ├── IBranchRepository.cs   ← Danh sách chi nhánh đang hoạt động
│       │       ├── IMembershipPlanRepository.cs ← Gói hội viên đang active
│       │       ├── IMembershipRepository.cs     ← Gói đang hiệu lực của hội viên
│       │       ├── IBookingRepository.cs        ← Đặt lịch theo session/hội viên
│       │       ├── IGymClassRepository.cs       ← Lớp theo chi nhánh/HLV
│       │       ├── ICheckinRepository.cs        ← Lịch sử check-in theo ngày/chi nhánh
│       │       ├── IEquipmentRepository.cs      ← Thiết bị theo chi nhánh, tình trạng
│       │       ├── IPaymentRepository.cs        ← Thanh toán theo hội viên/gói
│       │       ├── INotificationRepository.cs   ← Thông báo chưa đọc của user
│       │       ├── IReviewRepository.cs         ← Đánh giá theo HLV/lớp
│       │       ├── IBodyMeasurementRepository.cs   ← Phiên đo cơ thể của hội viên
│       │       ├── IMeasurementValueRepository.cs  ← Giá trị đo theo phiên/metric
│       │       ├── IMetricTypeRepository.cs        ← Loại chỉ số đo đang active
│       │       ├── INutritionPlanRepository.cs     ← Kế hoạch dinh dưỡng theo hội viên
│       │       ├── IGymNewsRepository.cs           ← Tin tức theo chi nhánh/loại
│       │       ├── ISystemSettingRepository.cs     ← Đọc/ghi cấu hình theo key
│       │       ├── IMealFormRepository.cs          ← Tra cứu thực đơn
│       │       ├── IAssessmentNoteRepository.cs    ← Ghi chú đánh giá
│       │       └── IWorkoutMeasurementRepository.cs ← Đo lường thông số buổi tập
│       │
│       ├── DFGymCenter.Application/      ← 🟡 TẦNG APPLICATION — Logic nghiệp vụ, Interfaces ngoài
│       │   ├── DFGymCenter.Application.csproj   ← Tham chiếu Domain
│       │   ├── DependencyInjection.cs     ← AddApplicationServices() — đăng ký Services vào DI
│       │   ├── Common/
│       │   │   └── Interfaces/            ← 📡 Interface dịch vụ hạ tầng (được Application định nghĩa)
│       │   │       ├── IApplicationDbContext.cs   ← Abstraction DbContext để tránh kết hợp chặt
│       │   │       ├── ICurrentUserService.cs     ← Lấy UserId đang đăng nhập từ JWT claim
│       │   │       ├── IDateTimeService.cs        ← Cung cấp Now() — dễ mock khi test
│       │   │       ├── IEmailService.cs           ← Gửi email (SendGrid, SMTP...)
│       │   │       ├── IPaymentGatewayService.cs  ← Kết nối cổng thanh toán (VNPay, Momo...)
│       │   │       └── ITokenService.cs           ← Tạo & validate JWT token
│       │   ├── DTOs/                      ← 📋 Data Transfer Objects — request/response qua API
│       │   │   ├── Branch/
│       │   │   │   └── BranchDto.cs       ← DTO chi nhánh: Id, Name, Address, Phone, OpenTime...
│       │   │   ├── UserDto.cs             ← Thông tin user cơ bản
│       │   │   ├── MemberDto.cs           ← Thông tin hội viên + gói hiện tại
│       │   │   ├── StaffDto.cs            ← Thông tin nhân viên + chi nhánh
│       │   │   ├── TrainerDto.cs          ← HLV + chuyên môn + đánh giá
│       │   │   ├── TrainerAvailabilityDto.cs ← Khung giờ rảnh HLV
│       │   │   ├── MembershipPlanDto.cs   ← Gói tập: giá, thời hạn, quyền lợi
│       │   │   ├── MembershipDto.cs       ← Gói đăng ký của hội viên
│       │   │   ├── MemberCardDto.cs       ← Thẻ thành viên
│       │   │   ├── GymClassDto.cs         ← Lớp học nhóm
│       │   │   ├── ClassSessionDto.cs     ← Buổi học cụ thể
│       │   │   ├── BookingDto.cs          ← Đặt lịch lớp
│       │   │   ├── WaitlistEntryDto.cs    ← Danh sách chờ
│       │   │   ├── CheckinDto.cs          ← Lượt check-in/out
│       │   │   ├── EquipmentDto.cs        ← Thiết bị
│       │   │   ├── EquipmentIssueDto.cs   ← Sự cố thiết bị
│       │   │   ├── EquipmentIssueLogDto.cs ← Nhật ký xử lý sự cố
│       │   │   ├── FreezeRequestDto.cs    ← Yêu cầu freeze gói
│       │   │   ├── PaymentDto.cs          ← Thanh toán
│       │   │   ├── NotificationDto.cs     ← Thông báo
│       │   │   ├── ReviewDto.cs           ← Đánh giá
│       │   │   ├── BodyMetricDto.cs       ← Chỉ số cơ thể
│       │   │   ├── BodyMeasurementDto.cs  ← Phiên đo cơ thể
│       │   │   ├── MeasurementValueDto.cs ← Giá trị đo cụ thể
│       │   │   ├── MetricTypeDto.cs       ← Loại chỉ số đo
│       │   │   ├── NutritionPlanDto.cs    ← Kế hoạch dinh dưỡng
│       │   │   ├── GymNewsDto.cs          ← Tin tức phòng gym
│       │   │   ├── SystemSettingDto.cs    ← Cấu hình hệ thống
│       │   │   ├── MealFormDto.cs         ← DTO thực đơn dinh dưỡng
│       │   │   ├── AssessmentNoteDto.cs   ← DTO ghi chú đánh giá
│       │   │   └── WorkoutMeasurementDto.cs ← DTO thông số buổi tập
│       │   └── Services/
│       │       ├── Interfaces/
│       │       │   └── IBranchService.cs  ← Interface service chi nhánh (GetAll, Create, Update...)
│       │       └── Implementations/
│       │           └── BranchService.cs   ← Logic nghiệp vụ chi nhánh — dùng IBranchRepository
│       │
│       ├── DFGymCenter.Infrastructure/   ← 🟠 TẦNG INFRASTRUCTURE — EF Core, Repo, DB, Seed
│       │   ├── DFGymCenter.Infrastructure.csproj  ← Tham chiếu Domain + Application
│       │   ├── DependencyInjection.cs     ← AddInfrastructureServices() — đăng ký DbContext, Repos
│       │   └── Persistence/
│       │       ├── Context/
│       │       │   └── ApplicationDbContext.cs    ← EF Core DbContext — DbSet<> tất cả entity
│       │       ├── Configurations/        ← ⚙️ Fluent API — cấu hình bảng/cột/quan hệ DB
│       │       │   ├── UserConfiguration.cs        ← Table Users: PK, index email, max-length
│       │       │   ├── MemberConfiguration.cs      ← Table Members: FK UserId, index CardCode
│       │       │   ├── StaffConfiguration.cs       ← Table Staff: FK UserId, FK BranchId
│       │       │   ├── TrainerConfiguration.cs     ← Table Trainers: FK UserId, owned collection
│       │       │   ├── TrainerAvailabilityConfiguration.cs ← Table TrainerAvailabilities
│       │       │   ├── BranchConfiguration.cs      ← Table Branches: unique name
│       │       │   ├── MembershipPlanConfiguration.cs    ← Table MembershipPlans
│       │       │   ├── PlanBranchConfiguration.cs        ← Table PlanBranches (junction table)
│       │       │   ├── MembershipConfiguration.cs        ← Table Memberships
│       │       │   ├── MemberCardConfiguration.cs        ← Table MemberCards
│       │       │   ├── GymClassConfiguration.cs          ← Table GymClasses
│       │       │   ├── ClassSessionConfiguration.cs      ← Table ClassSessions
│       │       │   ├── BookingConfiguration.cs           ← Table Bookings
│       │       │   ├── WaitlistEntryConfiguration.cs     ← Table WaitlistEntries
│       │       │   ├── CheckinConfiguration.cs           ← Table Checkins
│       │       │   ├── EquipmentConfiguration.cs         ← Table Equipments
│       │       │   ├── EquipmentIssueConfiguration.cs    ← Table EquipmentIssues
│       │       │   ├── EquipmentIssueLogConfiguration.cs ← Table EquipmentIssueLogs
│       │       │   ├── FreezeRequestConfiguration.cs     ← Table FreezeRequests
│       │       │   ├── PaymentConfiguration.cs           ← Table Payments
│       │       │   ├── NotificationConfiguration.cs      ← Table Notifications
│       │       │   ├── ReviewConfiguration.cs            ← Table Reviews
│       │       │   ├── BodyMetricConfiguration.cs        ← Table BodyMetrics
│       │       │   ├── BodyMeasurementConfiguration.cs   ← Table BodyMeasurements
│       │       │   ├── MeasurementValueConfiguration.cs  ← Table MeasurementValues
│       │       │   ├── MetricTypeConfiguration.cs        ← Table MetricTypes
│       │       │   ├── NutritionPlanConfiguration.cs     ← Table NutritionPlans
│       │       │   ├── GymNewsConfiguration.cs           ← Table GymNews
│       │       │   ├── SystemSettingConfiguration.cs     ← Table SystemSettings (key-value)
│       │       │   ├── MealFormConfiguration.cs          ← Table MealForms
│       │       │   ├── AssessmentNoteConfiguration.cs    ← Table AssessmentNotes
│       │       │   └── WorkoutMeasurementConfiguration.cs ← Table WorkoutMeasurements
│       │       ├── Seed/
│       │       │   └── ApplicationDbContextInitialiser.cs ← Seed dữ liệu mẫu khi khởi động dev
│       │       └── (Migrations/)          ← [Chưa tạo] — chạy: dotnet ef migrations add Init
│       └── Repositories/                  ← 🗃️ Implements Repository Interfaces từ Domain
│           ├── GenericRepository.cs       ← Triển khai IGenericRepository<T> — EF CRUD cơ bản
│           ├── UnitOfWork.cs              ← Triển khai IUnitOfWork — wrap tất cả repo + SaveChanges
│           ├── UserRepository.cs          ← Triển khai IUserRepository
│           ├── MemberRepository.cs        ← Triển khai IMemberRepository
│           ├── StaffRepository.cs         ← Triển khai IStaffRepository
│           ├── TrainerRepository.cs       ← Triển khai ITrainerRepository
│           ├── BranchRepository.cs        ← Triển khai IBranchRepository
│           ├── MembershipPlanRepository.cs ← Triển khai IMembershipPlanRepository
│           ├── MembershipRepository.cs    ← Triển khai IMembershipRepository
│           ├── BookingRepository.cs       ← Triển khai IBookingRepository
│           ├── GymClassRepository.cs      ← Triển khai IGymClassRepository
│           ├── CheckinRepository.cs       ← Triển khai ICheckinRepository
│           ├── EquipmentRepository.cs     ← Triển khai IEquipmentRepository
│           ├── PaymentRepository.cs       ← Triển khai IPaymentRepository
│           ├── NotificationRepository.cs  ← Triển khai INotificationRepository
│           ├── ReviewRepository.cs        ← Triển khai IReviewRepository
│           ├── BodyMeasurementRepository.cs   ← Triển khai IBodyMeasurementRepository
│           ├── MeasurementValueRepository.cs  ← Triển khai IMeasurementValueRepository
│           ├── MetricTypeRepository.cs        ← Triển khai IMetricTypeRepository
│           ├── NutritionPlanRepository.cs     ← Triển khai INutritionPlanRepository
│           ├── GymNewsRepository.cs           ← Triển khai IGymNewsRepository
│           ├── SystemSettingRepository.cs     ← Triển khai ISystemSettingRepository
│           ├── MealFormRepository.cs          ← Triển khai IMealFormRepository
│           ├── AssessmentNoteRepository.cs    ← Triển khai IAssessmentNoteRepository
│           └── WorkoutMeasurementRepository.cs ← Triển khai IWorkoutMeasurementRepository
│
└── DFGymCenter.API/                      ← 🔵 TẦNG API — HTTP endpoint, middleware, DI entry point
    ├── DFGymCenter.API.csproj             ← Tham chiếu Application + Infrastructure
    ├── DFGymCenter.API.http               ← HTTP test file cho VS/Rider (thay Postman)
    ├── Program.cs                         ← Entry point: builder.Services.Add*(), app.Use*(), Swagger
    ├── appsettings.json                   ← ConnectionString, JWT config, Logging
    ├── appsettings.Development.json       ← Override cho môi trường DEV
    ├── Properties/
    │   └── launchSettings.json            ← Cấu hình debug: port, HTTPS, browser launch
    ├── Extensions/
    │   └── DatabaseExtensions.cs          ← Extension method chạy migration + seed khi startup
    ├── Middlewares/
    │   └── ExceptionHandlingMiddleware.cs ← Bắt exception, trả về ProblemDetails chuẩn RFC
    └── Controllers/                       ← 🌐 REST API Endpoints theo từng nghiệp vụ
        ├── ApiControllerBase.cs           ← Base: [ApiController], [Route("api/[controller]")]
        ├── UsersController.cs             ← GET/POST /api/users — quản lý tài khoản
        ├── MembersController.cs           ← /api/members — hội viên
        ├── StaffController.cs             ← /api/staff — nhân viên lễ tân
        ├── TrainersController.cs          ← /api/trainers — huấn luyện viên
        ├── BranchesController.cs          ← /api/branches — chi nhánh
        ├── MembershipPlansController.cs   ← /api/membership-plans — gói hội viên
        ├── MembershipsController.cs       ← /api/memberships — đăng ký gói
        ├── ClassesController.cs           ← /api/classes — lớp học nhóm
        ├── BookingsController.cs          ← /api/bookings — đặt/hủy lịch
        ├── CheckinsController.cs          ← /api/checkins — check-in/out
        ├── EquipmentsController.cs        ← /api/equipments — thiết bị
        ├── FreezeRequestsController.cs    ← /api/freeze-requests — tạm ngưng gói
        ├── PaymentsController.cs          ← /api/payments — lịch sử thanh toán
        ├── NotificationsController.cs     ← /api/notifications — thông báo
        ├── ReviewsController.cs           ← /api/reviews — đánh giá HLV
        ├── BodyMetricsController.cs       ← /api/body-metrics — chỉ số cơ thể
        ├── BodyMeasurementsController.cs  ← /api/body-measurements — phiên đo
        ├── MeasurementValuesController.cs ← /api/measurement-values — giá trị đo
        ├── MetricTypesController.cs       ← /api/metric-types — loại chỉ số đo
        ├── NutritionPlansController.cs    ← /api/nutrition-plans — kế hoạch dinh dưỡng
        ├── GymNewsController.cs           ← /api/gym-news — tin tức phòng gym
        └── SystemSettingsController.cs    ← /api/system-settings — cấu hình hệ thống

════════════════════════════════════════════════════════════════

frontend/                                  ← ⚛️ React 18 + TypeScript + Vite — UI SPA
├── index.html                             ← HTML shell: mount <div id="root"> — entry của Vite
├── package.json                           ← Dependencies: react, react-router-dom, lucide-react...
├── package-lock.json                      ← Lockfile npm — đảm bảo version nhất quán
├── vite.config.ts                         ← Vite config: proxy /api → backend, alias paths
├── tsconfig.json                          ← TS config gốc (references app + node)
├── tsconfig.app.json                      ← TS config source: strict mode, JSX react-jsx
├── tsconfig.node.json                     ← TS config cho vite.config.ts (Node environment)
├── .oxlintrc.json                         ← Cấu hình Oxlint (linter nhanh thay ESLint)
├── public/
│   ├── favicon.svg                        ← Icon tab trình duyệt (logo DFGym)
│   └── icons.svg                          ← Bộ SVG icon sprite dùng chung
└── src/
    ├── main.tsx                           ← Entry point: ReactDOM.createRoot(), bọc <App>
    ├── App.tsx                            ← Router chính: tất cả route phân theo role
    ├── index.css                          ← CSS toàn cục: design tokens, utilities, styles
    ├── utils.ts                           ← Hàm tiện ích: fmtDate, fmtMoney, uid, todayStr...
    │
    ├── assets/
    │   └── gym-hero.jpg                   ← Ảnh nền trang đăng nhập
    │
    ├── types.ts                           ← [GỐC — GIỮ NGUYÊN] Toàn bộ TypeScript interfaces
    ├── types/                             ← [MỚI] Types tách theo miền nghiệp vụ
    │   ├── index.ts                       ← Barrel re-export tất cả domain types
    │   ├── user.types.ts                  ← User, Role, TrainerProfile, TrainerSlot
    │   ├── branch.types.ts                ← Branch
    │   ├── equipment.types.ts             ← Equipment, EquipmentReport, EquipmentStatus
    │   ├── membership.types.ts            ← MembershipPlan, PTPlan, UserMembership, PTBooking
    │   ├── booking.types.ts               ← GroupClass, ClassSession, ClassBooking, WaitlistEntry
    │   └── misc.types.ts                  ← Payment, CheckIn, FreezeRequest, Notification...
    │
    ├── api/                               ← [MỚI] API client — gọi REST API backend .NET
    │   ├── index.ts                       ← Barrel re-export tất cả api modules
    │   ├── apiClient.ts                   ← Typed fetch wrapper: baseURL, Bearer token, errors
    │   ├── branchesApi.ts                 ← CRUD /api/branches → BranchesController
    │   ├── equipmentsApi.ts               ← CRUD /api/equipments → EquipmentsController
    │   ├── bookingsApi.ts                 ← CRUD /api/bookings → BookingsController
    │   ├── classesApi.ts                  ← CRUD /api/classes → ClassesController
    │   ├── membershipPlansApi.ts          ← CRUD /api/membership-plans
    │   └── checkinsApi.ts                 ← POST /api/checkins → CheckinsController
    │
    ├── components/
    │   ├── ui.tsx                         ← [GỐC] Modal, Badge, Avatar, StatCard, Tabs, PageHead...
    │   ├── labels.ts                      ← [GỐC] Label/color mapping theo status/role
    │   ├── Layout.tsx                     ← [GỐC] Sidebar nav + topbar layout theo role
    │   └── common/                        ← [MỚI] UI components được trích xuất dùng lại
    │       ├── index.ts                   ← Barrel re-export common components
    │       ├── DataTable.tsx              ← Table linh hoạt: column config, align, empty state
    │       ├── ConfirmDialog.tsx          ← Modal xác nhận thao tác (Xóa, Từ chối, Hủy...)
    │       ├── FormField.tsx              ← Wrapper field: label, required (*), error, helperText
    │       ├── StatusBadge.tsx            ← Huy hiệu trạng thái: green/red/amber/blue/gray
    │       └── StatCard.tsx               ← Thẻ KPI dashboard: icon, label, value, trend, sub
    │
    ├── store/                             ← 🗄️ State management (mock — sẽ thay bằng API calls)
    │   ├── AppContext.tsx                 ← React Context + useReducer: DB mock, user, toast
    │   ├── logic.ts                       ← Business logic frontend: checkIn, freeze, booking...
    │   ├── seed.ts                        ← [GỐC] Dữ liệu mẫu khởi tạo (mock database)
    │   └── mock/                          ← [MỚI] Mock data tách theo domain
    │       ├── index.ts                   ← Barrel re-export mock data
    │       ├── mockBranches.ts            ← Dữ liệu mẫu chi nhánh
    │       └── mockPlans.ts               ← Dữ liệu mẫu gói hội viên
    │
    └── pages/                             ← 📄 Màn hình theo role người dùng
        ├── Auth.tsx                       ← Trang đăng nhập + demo accounts
        ├── AccountPage.tsx                ← Hồ sơ cá nhân + đổi mật khẩu
        ├── NotificationsPage.tsx          ← Thông báo + đánh dấu đã đọc
        │
        ├── admin/                         ← 🔴 Trang Admin (role: admin)
        │   ├── AdminPages.tsx             ← [GỐC] AdminUsers + Branches + Plans + Classes + Settings
        │   ├── AdminReports.tsx           ← Báo cáo thống kê toàn hệ thống
        │   └── screens/                   ← [MỚI] Screens tách riêng — có thể lazy-load
        │       ├── index.ts               ← Barrel re-export tất cả admin screens
        │       ├── AdminUsersScreen.tsx   ← Quản lý tài khoản & phân quyền (tạo, khóa/mở)
        │       ├── AdminBranchesScreen.tsx ← Quản lý chi nhánh (thêm/sửa, phòng tập)
        │       ├── AdminPlansScreen.tsx   ← Quản lý gói hội viên + gói PT
        │       ├── AdminClassesScreen.tsx ← Lớp học nhóm + đổi/hủy buổi học cụ thể
        │       └── AdminSettingsScreen.tsx ← Cấu hình hệ thống (nhắc, freeze, waitlist)
        │
        ├── staff/                         ← 🟢 Trang Lễ tân (role: receptionist)
        │   ├── StaffPages.tsx             ← [GỐC] StaffHome + Checkin + Kiosk + CheckinHistory
        │   │                              ←        + StaffFreeze + EquipmentManage + StaffMembers
        │   └── screens/                   ← [MỚI] Screens tách riêng
        │       ├── index.ts               ← Barrel re-export tất cả staff screens
        │       ├── StaffHomeScreen.tsx    ← Dashboard lễ tân: đang có mặt, lớp hôm nay
        │       ├── StaffCheckinScreen.tsx ← Check-in/out: Scanner + Kiosk + CheckinHistory
        │       ├── StaffFreezeScreen.tsx  ← Duyệt/từ chối yêu cầu tạm ngưng gói
        │       ├── StaffEquipmentScreen.tsx ← Thiết bị + sự cố + tổng quan admin
        │       └── StaffMembersScreen.tsx ← Tra cứu hội viên: gói, trạng thái, buổi PT
        │
        ├── trainer/                       ← 🟠 Trang Huấn luyện viên (role: trainer)
        │   ├── TrainerPages.tsx           ← [GỐC] TrainerHome + Requests + Availability
        │   │                              ←        + Classes + Reviews + Profile
        │   └── screens/                   ← [MỚI] Screens tách riêng
        │       ├── index.ts               ← Barrel re-export tất cả trainer screens
        │       ├── useTrainerStats.ts     ← Custom hook: review, pending PT, sessions stats
        │       ├── TrainerHomeScreen.tsx  ← Dashboard HLV: lịch sắp tới, điểm danh, review
        │       ├── TrainerRequestsScreen.tsx    ← PT 1-kèm-1: xác nhận/từ chối/hoàn thành
        │       ├── TrainerAvailabilityScreen.tsx ← Khung giờ rảnh + timetable tuần 5-quy-tắc
        │       ├── TrainerClassesScreen.tsx     ← Lớp dạy + điểm danh buổi học (AttendanceModal)
        │       ├── TrainerReviewsScreen.tsx     ← Đánh giá từ hội viên + biểu đồ phân phối sao
        │       └── TrainerProfileScreen.tsx     ← Cập nhật hồ sơ chuyên môn + chi nhánh
        │
        └── member/                        ← 🔵 Trang Hội viên (role: member)
            ├── MemberHome.tsx             ← Dashboard: gói hiện tại, lịch sắp tới, thông báo
            ├── MemberBooking.tsx          ← Đặt lịch lớp nhóm + PT 1-kèm-1 theo timetable
            ├── MemberMemberships.tsx      ← Gói, lịch sử thanh toán, yêu cầu freeze
            ├── MemberMisc.tsx             ← Dinh dưỡng, chỉ số cơ thể, tin tức gym
            └── GymRules.tsx               ← Nội quy & quy định phòng gym
```

---

## 📊 Tóm tắt số lượng file

| Phần | Tầng / Nhóm | Số file |
|------|-------------|---------|
| **Backend** | Domain — Entities | 33 |
| | Domain — Enums | 2 |
| | Domain — Exceptions | 3 |
| | Domain — Interfaces (Repository) | 25 |
| | Application — DTOs | 32 |
| | Application — Services | 3 |
| | Application — Common Interfaces | 6 |
| | Infrastructure — Configurations (Fluent API) | 30 |
| | Infrastructure — Repositories | 25 |
| | Infrastructure — Context + Seed | 2 |
| | API — Controllers | 23 |
| | API — Middlewares + Extensions | 2 |
| | API — Config Files | 4 |
| **Frontend** | Types (gốc + domain modules) | 8 |
| | API Client | 8 |
| | Components (gốc + common mới) | 9 |
| | Store (AppContext + logic + mock) | 6 |
| | Pages — Auth / Account / Notif | 3 |
| | Pages — Admin (gốc + screens mới) | 8 |
| | Pages — Staff (gốc + screens mới) | 7 |
| | Pages — Trainer (gốc + screens mới) | 9 |
| | Pages — Member | 5 |
| | Config files | 6 |
| **Tổng** | | **~260 file** |

---

## 🔗 Luồng phụ thuộc Clean Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   API Layer │────▶│ Application Layer│────▶│    Domain Layer      │
│  (HTTP/REST)│     │ (Use Cases/DTOs) │     │ (Entities/Interfaces)│
└─────────────┘     └─────────────────┘     └──────────────────────┘
       │                    │                          ▲
       │                    │                          │
       ▼                    ▼                          │
┌──────────────────────────────────────────────────────┘
│              Infrastructure Layer                     │
│    (EF Core DbContext, Repositories, Seed)            │
└───────────────────────────────────────────────────────┘
```

**Quy tắc phụ thuộc:**
- **Domain** — không import gì ngoài .NET BCL
- **Application** — chỉ import Domain
- **Infrastructure** — import Domain + Application (thực thi các interface)
- **API** — import tất cả, wire DI, expose HTTP

---

## 📝 Bảng ký hiệu

| Ký hiệu | Ý nghĩa |
|---------|---------|
| `[GỐC — GIỮ NGUYÊN]` | File cũ, **không thay đổi code** — routing App.tsx vẫn import |
| `[MỚI]` | File tạo mới trong quá trình refactoring 4-step |
| `← Barrel re-export` | File `index.ts` chỉ re-export, không chứa logic |
| `[Chưa tạo]` | Thư mục/file cần tạo thêm (migrations EF Core) |
| `→ Controller` | File API client frontend gọi đến controller backend tương ứng |
