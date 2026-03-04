
using Microsoft.EntityFrameworkCore;
using ProcessMap.Api.Domain.Entities;

namespace ProcessMap.Api.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<Area> Areas => Set<Area>();
    public DbSet<ProcessNode> ProcessNodes => Set<ProcessNode>();
    public DbSet<ProcessSystemTool> ProcessSystemTools => Set<ProcessSystemTool>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProcessNode>()
            .HasOne(p => p.Parent)
            .WithMany(p => p.Children)
            .HasForeignKey(p => p.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProcessNode>()
            .HasOne(p => p.Area)
            .WithMany(a => a.Processos)
            .HasForeignKey(p => p.AreaId);
    }
}
