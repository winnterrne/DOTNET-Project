using System.Reflection;
using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Infrastructure.Persistence.Context;

/// <summary>
/// DbContext chính của hệ thống.
/// Triển khai IApplicationDbContext từ tầng Application.
/// </summary>
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Branch> Branches => Set<Branch>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tự động quét và nạp toàn bộ cấu hình Fluent API (IEntityTypeConfiguration) trong assembly này
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Tự động cập nhật các trường Audit Trail (CreatedAt, UpdatedAt)
        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
