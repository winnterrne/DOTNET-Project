using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DFGymCenter.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_28Entities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BranchName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    District = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Open_Time = table.Column<TimeSpan>(type: "time", nullable: false),
                    Close_Time = table.Column<TimeSpan>(type: "time", nullable: false),
                    OperatingHours = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "ACTIVE"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Membership_Plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Duration_Days = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Priority_Level = table.Column<int>(type: "int", nullable: false),
                    Max_Bookings_Per_Month = table.Column<int>(type: "int", nullable: false),
                    Max_Freeze_Times = table.Column<int>(type: "int", nullable: false),
                    Max_Freeze_Days = table.Column<int>(type: "int", nullable: false),
                    Is_All_Branches = table.Column<bool>(type: "bit", nullable: false),
                    Plan_Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Pt_Sessions = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Membership_Plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Metric_Types",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Metric_Types", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Password_Hash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Role = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Equipment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Equipment_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Plan_Branches",
                columns: table => new
                {
                    Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plan_Branches", x => new { x.Plan_Id, x.Branch_Id });
                    table.ForeignKey(
                        name: "FK_Plan_Branches_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Plan_Branches_Membership_Plans_Plan_Id",
                        column: x => x.Plan_Id,
                        principalTable: "Membership_Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Gym_Rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Updated_At = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gym_Rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Gym_Rules_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Gym_Rules_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    User_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Members_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    User_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Is_Read = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Ref_Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Ref_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Staff",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    User_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Position = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Staff", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Staff_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Staff_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "System_Settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Updated_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Setting_Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Setting_Value = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Data_Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Updated_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_System_Settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_System_Settings_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_System_Settings_Users_Updated_By",
                        column: x => x.Updated_By,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Trainers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    User_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Specialty = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Experience_Years = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Bio = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trainers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trainers_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Trainers_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Body_Measurements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Measured_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Initial = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Body_Measurements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Body_Measurements_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Member_Cards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Card_Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "ACTIVE")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Member_Cards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Member_Cards_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Memberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Renewed_From_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Start_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    End_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remaining_Sessions = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Memberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Memberships_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Memberships_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Memberships_Membership_Plans_Plan_Id",
                        column: x => x.Plan_Id,
                        principalTable: "Membership_Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Memberships_Memberships_Renewed_From_Id",
                        column: x => x.Renewed_From_Id,
                        principalTable: "Memberships",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Equipment_Issues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Equipment_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reported_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Handled_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipment_Issues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Equipment_Issues_Equipment_Equipment_Id",
                        column: x => x.Equipment_Id,
                        principalTable: "Equipment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Equipment_Issues_Members_Reported_By",
                        column: x => x.Reported_By,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Equipment_Issues_Staff_Handled_By",
                        column: x => x.Handled_By,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Trainer_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Room = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Day_Of_Week = table.Column<int>(type: "int", nullable: false),
                    Start_Time = table.Column<TimeSpan>(type: "time", nullable: false),
                    End_Time = table.Column<TimeSpan>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Classes_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Classes_Trainers_Trainer_Id",
                        column: x => x.Trainer_Id,
                        principalTable: "Trainers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Trainer_Availabilities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Trainer_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Start_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    End_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Booked = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trainer_Availabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trainer_Availabilities_Trainers_Trainer_Id",
                        column: x => x.Trainer_Id,
                        principalTable: "Trainers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Measurement_Values",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Measurement_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Metric_Type_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Value = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Measurement_Values", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Measurement_Values_Body_Measurements_Measurement_Id",
                        column: x => x.Measurement_Id,
                        principalTable: "Body_Measurements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Measurement_Values_Metric_Types_Metric_Type_Id",
                        column: x => x.Metric_Type_Id,
                        principalTable: "Metric_Types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Nutrition_Plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Measurement_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Goal = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Activity_Level = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Dietary_Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Daily_Calories = table.Column<int>(type: "int", nullable: false),
                    Protein_G = table.Column<int>(type: "int", nullable: false),
                    Carb_G = table.Column<int>(type: "int", nullable: false),
                    Fat_G = table.Column<int>(type: "int", nullable: false),
                    Meal_Suggestion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Nutrition_Plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Nutrition_Plans_Body_Measurements_Measurement_Id",
                        column: x => x.Measurement_Id,
                        principalTable: "Body_Measurements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Nutrition_Plans_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Freeze_Requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Membership_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Handled_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    From_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    To_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Days = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Freeze_Requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Freeze_Requests_Memberships_Membership_Id",
                        column: x => x.Membership_Id,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Freeze_Requests_Staff_Handled_By",
                        column: x => x.Handled_By,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Membership_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Gateway_Txn_Code = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Paid_At = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Memberships_Membership_Id",
                        column: x => x.Membership_Id,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Equipment_Issues_Logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Issue_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Staff_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status_After = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipment_Issues_Logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Equipment_Issues_Logs_Equipment_Issues_Issue_Id",
                        column: x => x.Issue_Id,
                        principalTable: "Equipment_Issues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Equipment_Issues_Logs_Staff_Staff_Id",
                        column: x => x.Staff_Id,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Class_Sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Class_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Trainer_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Session_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Start_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    End_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Class_Sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Class_Sessions_Classes_Class_Id",
                        column: x => x.Class_Id,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Class_Sessions_Trainers_Trainer_Id",
                        column: x => x.Trainer_Id,
                        principalTable: "Trainers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Membership_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Class_Session_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Availability_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Cancelled_At = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_Class_Sessions_Class_Session_Id",
                        column: x => x.Class_Session_Id,
                        principalTable: "Class_Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Memberships_Membership_Id",
                        column: x => x.Membership_Id,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Trainer_Availabilities_Availability_Id",
                        column: x => x.Availability_Id,
                        principalTable: "Trainer_Availabilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Waitlist_Entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Class_Session_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Priority_Level = table.Column<int>(type: "int", nullable: false),
                    Registered_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Waitlist_Entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Waitlist_Entries_Class_Sessions_Class_Session_Id",
                        column: x => x.Class_Session_Id,
                        principalTable: "Class_Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Waitlist_Entries_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Checkins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Branch_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Card_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Booking_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Recorded_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Method = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Check_In_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Check_Out_At = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Is_Auto_Checkout = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Checkins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Checkins_Bookings_Booking_Id",
                        column: x => x.Booking_Id,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Checkins_Branches_Branch_Id",
                        column: x => x.Branch_Id,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Checkins_Member_Cards_Card_Id",
                        column: x => x.Card_Id,
                        principalTable: "Member_Cards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Checkins_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Checkins_Staff_Recorded_By",
                        column: x => x.Recorded_By,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Booking_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Trainer_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Class_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Bookings_Booking_Id",
                        column: x => x.Booking_Id,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Reviews_Classes_Class_Id",
                        column: x => x.Class_Id,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Reviews_Members_Member_Id",
                        column: x => x.Member_Id,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Trainers_Trainer_Id",
                        column: x => x.Trainer_Id,
                        principalTable: "Trainers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Body_Measurements_Member_Id",
                table: "Body_Measurements",
                column: "Member_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Availability_Id",
                table: "Bookings",
                column: "Availability_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Class_Session_Id",
                table: "Bookings",
                column: "Class_Session_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Member_Id",
                table: "Bookings",
                column: "Member_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Membership_Id",
                table: "Bookings",
                column: "Membership_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_District",
                table: "Branches",
                column: "District");

            migrationBuilder.CreateIndex(
                name: "IX_Checkins_Booking_Id",
                table: "Checkins",
                column: "Booking_Id",
                unique: true,
                filter: "[Booking_Id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Checkins_Branch_Id",
                table: "Checkins",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Checkins_Card_Id",
                table: "Checkins",
                column: "Card_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Checkins_Member_Id",
                table: "Checkins",
                column: "Member_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Checkins_Recorded_By",
                table: "Checkins",
                column: "Recorded_By");

            migrationBuilder.CreateIndex(
                name: "IX_Class_Sessions_Class_Id",
                table: "Class_Sessions",
                column: "Class_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Class_Sessions_Trainer_Id",
                table: "Class_Sessions",
                column: "Trainer_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Branch_Id",
                table: "Classes",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Trainer_Id",
                table: "Classes",
                column: "Trainer_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_Branch_Id",
                table: "Equipment",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_Issues_Equipment_Id",
                table: "Equipment_Issues",
                column: "Equipment_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_Issues_Handled_By",
                table: "Equipment_Issues",
                column: "Handled_By");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_Issues_Reported_By",
                table: "Equipment_Issues",
                column: "Reported_By");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_Issues_Logs_Issue_Id",
                table: "Equipment_Issues_Logs",
                column: "Issue_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_Issues_Logs_Staff_Id",
                table: "Equipment_Issues_Logs",
                column: "Staff_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Freeze_Requests_Handled_By",
                table: "Freeze_Requests",
                column: "Handled_By");

            migrationBuilder.CreateIndex(
                name: "IX_Freeze_Requests_Membership_Id",
                table: "Freeze_Requests",
                column: "Membership_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Gym_Rules_Branch_Id",
                table: "Gym_Rules",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Gym_Rules_Created_By",
                table: "Gym_Rules",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_Measurement_Values_Measurement_Id",
                table: "Measurement_Values",
                column: "Measurement_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Measurement_Values_Metric_Type_Id",
                table: "Measurement_Values",
                column: "Metric_Type_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Member_Cards_Card_Code",
                table: "Member_Cards",
                column: "Card_Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Member_Cards_Member_Id",
                table: "Member_Cards",
                column: "Member_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Members_User_Id",
                table: "Members",
                column: "User_Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_Branch_Id",
                table: "Memberships",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_Member_Id",
                table: "Memberships",
                column: "Member_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_Plan_Id",
                table: "Memberships",
                column: "Plan_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_Renewed_From_Id",
                table: "Memberships",
                column: "Renewed_From_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Metric_Types_Code",
                table: "Metric_Types",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_User_Id",
                table: "Notifications",
                column: "User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Nutrition_Plans_Measurement_Id",
                table: "Nutrition_Plans",
                column: "Measurement_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Nutrition_Plans_Member_Id",
                table: "Nutrition_Plans",
                column: "Member_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Membership_Id",
                table: "Payments",
                column: "Membership_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Plan_Branches_Branch_Id",
                table: "Plan_Branches",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Booking_Id",
                table: "Reviews",
                column: "Booking_Id",
                unique: true,
                filter: "[Booking_Id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Class_Id",
                table: "Reviews",
                column: "Class_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Member_Id",
                table: "Reviews",
                column: "Member_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Trainer_Id",
                table: "Reviews",
                column: "Trainer_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_Branch_Id",
                table: "Staff",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_User_Id",
                table: "Staff",
                column: "User_Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_System_Settings_Branch_Id",
                table: "System_Settings",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_System_Settings_Updated_By",
                table: "System_Settings",
                column: "Updated_By");

            migrationBuilder.CreateIndex(
                name: "IX_Trainer_Availabilities_Trainer_Id",
                table: "Trainer_Availabilities",
                column: "Trainer_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainers_Branch_Id",
                table: "Trainers",
                column: "Branch_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainers_User_Id",
                table: "Trainers",
                column: "User_Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_UserName",
                table: "Users",
                column: "UserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Waitlist_Entries_Class_Session_Id",
                table: "Waitlist_Entries",
                column: "Class_Session_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Waitlist_Entries_Member_Id",
                table: "Waitlist_Entries",
                column: "Member_Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Checkins");

            migrationBuilder.DropTable(
                name: "Equipment_Issues_Logs");

            migrationBuilder.DropTable(
                name: "Freeze_Requests");

            migrationBuilder.DropTable(
                name: "Gym_Rules");

            migrationBuilder.DropTable(
                name: "Measurement_Values");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Nutrition_Plans");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Plan_Branches");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "System_Settings");

            migrationBuilder.DropTable(
                name: "Waitlist_Entries");

            migrationBuilder.DropTable(
                name: "Member_Cards");

            migrationBuilder.DropTable(
                name: "Equipment_Issues");

            migrationBuilder.DropTable(
                name: "Metric_Types");

            migrationBuilder.DropTable(
                name: "Body_Measurements");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "Equipment");

            migrationBuilder.DropTable(
                name: "Staff");

            migrationBuilder.DropTable(
                name: "Class_Sessions");

            migrationBuilder.DropTable(
                name: "Memberships");

            migrationBuilder.DropTable(
                name: "Trainer_Availabilities");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropTable(
                name: "Members");

            migrationBuilder.DropTable(
                name: "Membership_Plans");

            migrationBuilder.DropTable(
                name: "Trainers");

            migrationBuilder.DropTable(
                name: "Branches");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
