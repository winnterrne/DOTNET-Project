using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class NutritionPlanConfiguration : IEntityTypeConfiguration<NutritionPlan>
{
    public void Configure(EntityTypeBuilder<NutritionPlan> builder)
    {
        builder.ToTable("Nutrition_Plans");
        builder.HasKey(np => np.Id);

        builder.Property(np => np.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(np => np.MeasurementId)
            .HasColumnName("Measurement_Id");

        builder.Property(np => np.Goal)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(np => np.ActivityLevel)
            .HasColumnName("Activity_Level")
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(np => np.DietaryNotes)
            .HasColumnName("Dietary_Notes")
            .HasMaxLength(1000);

        builder.Property(np => np.DailyCalories)
            .HasColumnName("Daily_Calories");

        builder.Property(np => np.ProteinG)
            .HasColumnName("Protein_G");

        builder.Property(np => np.CarbG)
            .HasColumnName("Carb_G");

        builder.Property(np => np.FatG)
            .HasColumnName("Fat_G");

        builder.Property(np => np.MealSuggestion)
            .HasColumnName("Meal_Suggestion")
            .HasMaxLength(2000);

        builder.Property(np => np.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.HasOne(np => np.Member)
            .WithMany(m => m.NutritionPlans)
            .HasForeignKey(np => np.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(np => np.Measurement)
            .WithMany(bm => bm.NutritionPlans)
            .HasForeignKey(np => np.MeasurementId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
