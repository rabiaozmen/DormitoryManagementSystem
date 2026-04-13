using DormitoryManagementSystem.Application.Auth.Interfaces;
using DormitoryManagementSystem.Application.Dashboard.Interfaces;
using DormitoryManagementSystem.Application.Maintenance.Interfaces;
using DormitoryManagementSystem.Application.Payments.Interfaces;
using DormitoryManagementSystem.Application.Security.Interfaces;
using DormitoryManagementSystem.Infrastructure.Auth;
using DormitoryManagementSystem.Infrastructure.Dashboard;
using DormitoryManagementSystem.Infrastructure.Persistence;
using DormitoryManagementSystem.Infrastructure.Payments;
using DormitoryManagementSystem.Infrastructure.Security;
using DormitoryManagementSystem.Infrastructure.Maintenance;
using DormitoryManagementSystem.Application.Allocations.Interfaces;
using DormitoryManagementSystem.Infrastructure.Allocations;
using DormitoryManagementSystem.Application.Announcements.Interfaces;
using DormitoryManagementSystem.Infrastructure.Announcements;
using DormitoryManagementSystem.Application.Students.Interfaces;
using DormitoryManagementSystem.Infrastructure.Students;
using DormitoryManagementSystem.Application.Departments.Interfaces;
using DormitoryManagementSystem.Infrastructure.Departments;
using DormitoryManagementSystem.Application.Finance.Interfaces;
using DormitoryManagementSystem.Infrastructure.Finance;
using DormitoryManagementSystem.Application.Dining.Interfaces;
using DormitoryManagementSystem.Infrastructure.Dining;
using DormitoryManagementSystem.Application.Operations.Interfaces;
using DormitoryManagementSystem.Infrastructure.Operations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DormitoryManagementSystem.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<EncryptionOptions>(configuration.GetSection(EncryptionOptions.SectionName));
        services.Configure<RefreshTokenOptions>(configuration.GetSection(RefreshTokenOptions.SectionName));

        services.AddDbContext<DmsDbContext>(options =>
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            options.UseNpgsql(connectionString);
        });

        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IEncryptionService, AesEncryptionService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IMaintenanceService, MaintenanceService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAllocationService, AllocationService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<IStudentManagementService, StudentManagementService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IDiningService, DiningService>();
        services.AddScoped<ILeaveAndLogService, LeaveAndLogService>();

        return services;
    }
}
