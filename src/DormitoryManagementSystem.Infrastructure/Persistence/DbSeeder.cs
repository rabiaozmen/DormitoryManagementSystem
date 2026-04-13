using DormitoryManagementSystem.Application.Security.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(DmsDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.MigrateAsync(cancellationToken);
        await EnsurePostgresIdentityColumnsAsync(dbContext, cancellationToken);
        await EnsureDepartmentsAsync(dbContext, cancellationToken);
        await EnsureStaffAsync(dbContext, passwordHasher, cancellationToken);
        await EnsureBuildingsAndRoomsAsync(dbContext, cancellationToken);
        await EnsureDemoDataAsync(dbContext, passwordHasher, cancellationToken);
        await EnsureMonthlyDiningMenusAsync(dbContext, cancellationToken);
    }

    private static async Task EnsureDepartmentsAsync(DmsDbContext dbContext, CancellationToken cancellationToken)
    {
        var departmentSeed = new[]
        {
            ("Computer Engineering", "CENG"),
            ("Electrical Engineering", "EE"),
            ("Mechanical Engineering", "ME"),
            ("Civil Engineering", "CE"),
            ("Architecture", "ARCH"),
            ("Business Administration", "BUS"),
            ("Psychology", "PSY"),
            ("Nursing", "NUR")
        };

        var existingCodes = await dbContext.Departments.Select(x => x.Code).ToListAsync(cancellationToken);
        var departmentsToAdd = departmentSeed
            .Where(seed => !existingCodes.Contains(seed.Item2))
            .Select(seed => new Department { Name = seed.Item1, Code = seed.Item2 })
            .ToList();

        if (departmentsToAdd.Count > 0)
        {
            dbContext.Departments.AddRange(departmentsToAdd);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task EnsureStaffAsync(DmsDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken)
    {
        var staffSeeds = new[]
        {
            new Staff
            {
                FirstName = "Aylin",
                LastName = "Yilmaz",
                Email = "staff@dms.local",
                Phone = "5551000001",
                PasswordHash = passwordHasher.Hash("P@ssw0rd!"),
                StaffNumber = "STF-1001",
                IsAdmin = false,
                MonthlySalary = 40000
            },
            new Staff
            {
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@dms.local",
                Phone = "5551000000",
                PasswordHash = passwordHasher.Hash("P@ssw0rd!"),
                StaffNumber = "ADM-0001",
                IsAdmin = true,
                MonthlySalary = 55000
            }
        };

        foreach (var staff in staffSeeds)
        {
            var exists = await dbContext.Staff.AnyAsync(x => x.Email == staff.Email, cancellationToken);
            if (!exists)
            {
                dbContext.Staff.Add(staff);
            }
            else
            {
                var existing = await dbContext.Staff.FirstAsync(x => x.Email == staff.Email, cancellationToken);
                if (existing.MonthlySalary <= 0)
                {
                    existing.MonthlySalary = staff.MonthlySalary;
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureBuildingsAndRoomsAsync(DmsDbContext dbContext, CancellationToken cancellationToken)
    {
        var staff = await dbContext.Staff.OrderBy(x => x.IsAdmin).ThenBy(x => x.Email).FirstOrDefaultAsync(cancellationToken);
        if (staff is null)
        {
            return;
        }

        var buildingSpecs = new[]
        {
            ("Block A", "Campus Floor A", "A"),
            ("Block B", "Campus Floor B", "B"),
            ("Block C", "Campus Floor C", "C"),
            ("Block D", "Campus Floor D", "D")
        };

        foreach (var (name, address, _) in buildingSpecs)
        {
            var exists = await dbContext.Buildings.AnyAsync(x => x.Name == name, cancellationToken);
            if (!exists)
            {
                dbContext.Buildings.Add(new Building
                {
                    Name = name,
                    Address = address,
                    StaffId = staff.Id
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var buildingLookup = await dbContext.Buildings.ToDictionaryAsync(x => x.Name, cancellationToken);
        var existingRoomNumbers = (await dbContext.Rooms.Select(x => x.RoomNumber).ToListAsync(cancellationToken)).ToHashSet();
        var currentCapacity = await dbContext.Rooms.SumAsync(x => (int?)x.Capacity ?? 0, cancellationToken);
        var targetCapacity = 300;

        foreach (var (buildingName, _, blockCode) in buildingSpecs)
        {
            if (currentCapacity >= targetCapacity)
            {
                break;
            }

            var building = buildingLookup[buildingName];
            var capacities = new[] { 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 1, 4 };

            for (var index = 0; index < capacities.Length && currentCapacity < targetCapacity; index++)
            {
                var roomNumber = $"{blockCode}-{101 + index}";
                if (existingRoomNumbers.Contains(roomNumber))
                {
                    continue;
                }

                var capacity = capacities[index];
                dbContext.Rooms.Add(new Room
                {
                    BuildingId = building.Id,
                    RoomNumber = roomNumber,
                    Capacity = capacity,
                    Occupancy = 0,
                    MonthlyRate = capacity switch
                    {
                        1 => 6500,
                        2 => 5000,
                        3 => 4000,
                        _ => 3500
                    },
                    GenderPolicy = "Mixed"
                });

                existingRoomNumbers.Add(roomNumber);
                currentCapacity += capacity;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureDemoDataAsync(DmsDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken)
    {
        if (await dbContext.Students.AnyAsync(cancellationToken))
        {
            return;
        }

        var department = await dbContext.Departments.OrderBy(x => x.Id).FirstAsync(cancellationToken);
        var room = await dbContext.Rooms.OrderBy(x => x.RoomNumber).FirstAsync(cancellationToken);

        var student = new Student
        {
            FirstName = "Ali",
            LastName = "Kaya",
            Email = "student@dms.local",
            Phone = "5552000000",
            PasswordHash = passwordHasher.Hash("P@ssw0rd!"),
            StudentNumber = "220208013",
            TrIdentityNumberEncrypted = "ENCRYPTED_TR_ID_PLACEHOLDER",
            BirthDate = new DateOnly(2004, 5, 20),
            OutstandingDues = 1000,
            CheckInDateUtc = DateTime.UtcNow.AddMonths(-2),
            RoomId = room.Id,
            DepartmentId = department.Id
        };

        dbContext.Students.Add(student);
        room.Occupancy += 1;

        dbContext.Guardians.Add(new Guardian
        {
            Student = student,
            FullName = "Fatma Kaya",
            Phone = "5553000000",
            Relationship = "Mother"
        });

        dbContext.Payments.AddRange(
            new Payment
            {
                Student = student,
                Amount = 3500,
                DueDateUtc = DateTime.UtcNow.AddDays(-20),
                PaidAtUtc = DateTime.UtcNow.AddDays(-18),
                Status = PaymentStatus.Paid,
                ExternalTransactionId = "TXN-10001"
            },
            new Payment
            {
                Student = student,
                Amount = 3500,
                DueDateUtc = DateTime.UtcNow.AddDays(10),
                Status = PaymentStatus.Pending
            });

        dbContext.MaintenanceRequests.Add(new MaintenanceRequest
        {
            Room = room,
            Student = student,
            TicketCode = $"TKT-{DateTime.UtcNow:yyMMdd}-1001",
            Description = "Water leakage in bathroom sink.",
            Priority = MaintenancePriority.High,
            Status = MaintenanceStatus.Open
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureMonthlyDiningMenusAsync(DmsDbContext dbContext, CancellationToken cancellationToken)
    {
        var existingDates = (await dbContext.DiningMenus
                .Select(x => x.Date)
                .ToListAsync(cancellationToken))
            .Select(x => x.Date)
            .ToHashSet();

        var templates = new[]
        {
            ("Egg, Cheese, Olives, Tea", "Lentil Soup, Chicken, Rice, Salad", "Vegetable Stew, Yogurt, Bread"),
            ("Menemen, Bread, Honey, Tea", "Meatball, Pasta, Ayran", "Baked Potato, Cacik, Fruit"),
            ("Pancake, Jam, Cheese, Tea", "Bean Stew, Pilaf, Salad", "Chicken Wrap, Soup, Dessert"),
            ("Boiled Egg, Tomato, Cucumber, Tea", "Fish, Mashed Potatoes, Salad", "Rice Pudding, Toast, Soup"),
            ("Simit, Cheese, Butter, Tea", "Kofta, Rice, Salad", "Manti, Yogurt, Soup"),
            ("Omlet, Olives, Jam, Tea", "Pasta Bolognese, Salad, Juice", "Chicken Sote, Bulgur, Ayran"),
            ("Cereal, Milk, Fruit, Tea", "Turkish Bean Salad, Rice, Soup", "Vegetable Omelet, Bread, Yogurt")
        };

        var startMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        for (var monthOffset = 0; monthOffset < 3; monthOffset++)
        {
            var monthStart = startMonth.AddMonths(monthOffset);
            var monthEnd = monthStart.AddMonths(1);

            for (var day = monthStart; day < monthEnd; day = day.AddDays(1))
            {
                if (existingDates.Contains(day.Date))
                {
                    continue;
                }

                var template = templates[(day.Day - 1) % templates.Length];
                dbContext.DiningMenus.Add(new DiningMenu
                {
                    Date = day,
                    Breakfast = template.Item1,
                    Lunch = template.Item2,
                    Dinner = template.Item3,
                    ImageUrl = null
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsurePostgresIdentityColumnsAsync(DmsDbContext dbContext, CancellationToken cancellationToken)
    {
        if (!dbContext.Database.IsNpgsql())
        {
            return;
        }

        var statements = new[]
        {
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'departments' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"departments\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'buildings' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"buildings\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'rooms' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"rooms\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'guardians' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"guardians\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'announcements' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"announcements\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Expenses' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"Expenses\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'DiningMenus' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"DiningMenus\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'maintenance_requests' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"maintenance_requests\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'refresh_tokens' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'Id' AND is_identity = 'NO') THEN ALTER TABLE \"payments\" ALTER COLUMN \"Id\" ADD GENERATED BY DEFAULT AS IDENTITY; END IF; END $$;",
            "ALTER TABLE \"buildings\" DROP CONSTRAINT IF EXISTS \"FK_buildings_staff_StaffId\";",
            "ALTER TABLE \"guardians\" DROP CONSTRAINT IF EXISTS \"FK_guardians_students_StudentId\";",
            "ALTER TABLE \"maintenance_requests\" DROP CONSTRAINT IF EXISTS \"FK_maintenance_requests_students_StudentId\";",
            "ALTER TABLE \"payments\" DROP CONSTRAINT IF EXISTS \"FK_payments_students_StudentId\";",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'staff' AND column_name = 'Id' AND udt_name <> 'uuid') THEN ALTER TABLE \"staff\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'Id' AND udt_name <> 'uuid') THEN ALTER TABLE \"students\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'buildings' AND column_name = 'StaffId' AND udt_name <> 'uuid') THEN ALTER TABLE \"buildings\" ALTER COLUMN \"StaffId\" TYPE uuid USING \"StaffId\"::uuid; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'guardians' AND column_name = 'StudentId' AND udt_name <> 'uuid') THEN ALTER TABLE \"guardians\" ALTER COLUMN \"StudentId\" TYPE uuid USING \"StudentId\"::uuid; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'maintenance_requests' AND column_name = 'StudentId' AND udt_name <> 'uuid') THEN ALTER TABLE \"maintenance_requests\" ALTER COLUMN \"StudentId\" TYPE uuid USING \"StudentId\"::uuid; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'StudentId' AND udt_name <> 'uuid') THEN ALTER TABLE \"payments\" ALTER COLUMN \"StudentId\" TYPE uuid USING \"StudentId\"::uuid; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'refresh_tokens' AND column_name = 'UserId' AND udt_name <> 'uuid') THEN ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"UserId\" TYPE uuid USING \"UserId\"::uuid; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_buildings_staff_StaffId') THEN ALTER TABLE \"buildings\" ADD CONSTRAINT \"FK_buildings_staff_StaffId\" FOREIGN KEY (\"StaffId\") REFERENCES \"staff\" (\"Id\") ON DELETE RESTRICT; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_guardians_students_StudentId') THEN ALTER TABLE \"guardians\" ADD CONSTRAINT \"FK_guardians_students_StudentId\" FOREIGN KEY (\"StudentId\") REFERENCES \"students\" (\"Id\") ON DELETE CASCADE; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_maintenance_requests_students_StudentId') THEN ALTER TABLE \"maintenance_requests\" ADD CONSTRAINT \"FK_maintenance_requests_students_StudentId\" FOREIGN KEY (\"StudentId\") REFERENCES \"students\" (\"Id\") ON DELETE RESTRICT; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_payments_students_StudentId') THEN ALTER TABLE \"payments\" ADD CONSTRAINT \"FK_payments_students_StudentId\" FOREIGN KEY (\"StudentId\") REFERENCES \"students\" (\"Id\") ON DELETE CASCADE; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'staff' AND column_name = 'CreatedAtUtc' AND data_type = 'text') THEN ALTER TABLE \"staff\" ALTER COLUMN \"CreatedAtUtc\" TYPE timestamp with time zone USING \"CreatedAtUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'CreatedAtUtc' AND data_type = 'text') THEN ALTER TABLE \"students\" ALTER COLUMN \"CreatedAtUtc\" TYPE timestamp with time zone USING \"CreatedAtUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'CheckInDateUtc' AND data_type = 'text') THEN ALTER TABLE \"students\" ALTER COLUMN \"CheckInDateUtc\" TYPE timestamp with time zone USING \"CheckInDateUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'BirthDate' AND data_type = 'text') THEN ALTER TABLE \"students\" ALTER COLUMN \"BirthDate\" TYPE date USING \"BirthDate\"::date; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'DueDateUtc' AND data_type = 'text') THEN ALTER TABLE \"payments\" ALTER COLUMN \"DueDateUtc\" TYPE timestamp with time zone USING \"DueDateUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'PaidAtUtc' AND data_type = 'text') THEN ALTER TABLE \"payments\" ALTER COLUMN \"PaidAtUtc\" TYPE timestamp with time zone USING NULLIF(\"PaidAtUtc\", '')::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'Amount' AND data_type = 'text') THEN ALTER TABLE \"payments\" ALTER COLUMN \"Amount\" TYPE numeric(18,2) USING NULLIF(TRIM(\"Amount\"), '')::numeric; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'OutstandingDues' AND data_type = 'text') THEN ALTER TABLE \"students\" ALTER COLUMN \"OutstandingDues\" TYPE numeric(18,2) USING NULLIF(TRIM(\"OutstandingDues\"), '')::numeric; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'BloodType') THEN ALTER TABLE \"students\" ADD COLUMN \"BloodType\" character varying(8) NOT NULL DEFAULT ''; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'HealthStatus') THEN ALTER TABLE \"students\" ADD COLUMN \"HealthStatus\" character varying(2000) NOT NULL DEFAULT ''; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'AllergenFoodInfo') THEN ALTER TABLE \"students\" ADD COLUMN \"AllergenFoodInfo\" character varying(2000) NOT NULL DEFAULT ''; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'rooms' AND column_name = 'MonthlyRate' AND data_type = 'text') THEN ALTER TABLE \"rooms\" ALTER COLUMN \"MonthlyRate\" TYPE numeric(18,2) USING NULLIF(TRIM(\"MonthlyRate\"), '')::numeric; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Expenses' AND column_name = 'Amount' AND data_type = 'text') THEN ALTER TABLE \"Expenses\" ALTER COLUMN \"Amount\" TYPE numeric(18,2) USING NULLIF(TRIM(\"Amount\"), '')::numeric; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'refresh_tokens' AND column_name = 'ExpiresAtUtc' AND data_type = 'text') THEN ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"ExpiresAtUtc\" TYPE timestamp with time zone USING \"ExpiresAtUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'refresh_tokens' AND column_name = 'CreatedAtUtc' AND data_type = 'text') THEN ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"CreatedAtUtc\" TYPE timestamp with time zone USING \"CreatedAtUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'refresh_tokens' AND column_name = 'RevokedAtUtc' AND data_type = 'text') THEN ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"RevokedAtUtc\" TYPE timestamp with time zone USING NULLIF(\"RevokedAtUtc\", '')::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'maintenance_requests' AND column_name = 'CreatedAtUtc' AND data_type = 'text') THEN ALTER TABLE \"maintenance_requests\" ALTER COLUMN \"CreatedAtUtc\" TYPE timestamp with time zone USING \"CreatedAtUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'maintenance_requests' AND column_name = 'ResolvedAtUtc' AND data_type = 'text') THEN ALTER TABLE \"maintenance_requests\" ALTER COLUMN \"ResolvedAtUtc\" TYPE timestamp with time zone USING NULLIF(\"ResolvedAtUtc\", '')::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'announcements' AND column_name = 'CreatedAtUtc' AND data_type = 'text') THEN ALTER TABLE \"announcements\" ALTER COLUMN \"CreatedAtUtc\" TYPE timestamp with time zone USING \"CreatedAtUtc\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Expenses' AND column_name = 'Date' AND data_type = 'text') THEN ALTER TABLE \"Expenses\" ALTER COLUMN \"Date\" TYPE timestamp with time zone USING \"Date\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'DiningMenus' AND column_name = 'Date' AND data_type = 'text') THEN ALTER TABLE \"DiningMenus\" ALTER COLUMN \"Date\" TYPE timestamp with time zone USING \"Date\"::timestamptz; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'staff' AND column_name = 'IsActive' AND data_type <> 'boolean') THEN ALTER TABLE \"staff\" ALTER COLUMN \"IsActive\" DROP DEFAULT; ALTER TABLE \"staff\" ALTER COLUMN \"IsActive\" TYPE boolean USING CASE WHEN \"IsActive\" = 0 THEN false ELSE true END; ALTER TABLE \"staff\" ALTER COLUMN \"IsActive\" SET DEFAULT true; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'staff' AND column_name = 'IsAdmin' AND data_type <> 'boolean') THEN ALTER TABLE \"staff\" ALTER COLUMN \"IsAdmin\" DROP DEFAULT; ALTER TABLE \"staff\" ALTER COLUMN \"IsAdmin\" TYPE boolean USING CASE WHEN \"IsAdmin\" = 0 THEN false ELSE true END; ALTER TABLE \"staff\" ALTER COLUMN \"IsAdmin\" SET DEFAULT false; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'staff' AND column_name = 'MonthlySalary') THEN ALTER TABLE \"staff\" ADD COLUMN \"MonthlySalary\" numeric(18,2) NOT NULL DEFAULT 0; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'staff' AND column_name = 'MonthlySalary' AND data_type = 'text') THEN ALTER TABLE \"staff\" ALTER COLUMN \"MonthlySalary\" TYPE numeric(18,2) USING NULLIF(TRIM(\"MonthlySalary\"), '')::numeric; END IF; END $$;",
            "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Expenses' AND column_name = 'StaffId') THEN ALTER TABLE \"Expenses\" ADD COLUMN \"StaffId\" uuid NULL; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'students' AND column_name = 'IsActive' AND data_type <> 'boolean') THEN ALTER TABLE \"students\" ALTER COLUMN \"IsActive\" DROP DEFAULT; ALTER TABLE \"students\" ALTER COLUMN \"IsActive\" TYPE boolean USING CASE WHEN \"IsActive\" = 0 THEN false ELSE true END; ALTER TABLE \"students\" ALTER COLUMN \"IsActive\" SET DEFAULT true; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'announcements' AND column_name = 'IsActive' AND data_type <> 'boolean') THEN ALTER TABLE \"announcements\" ALTER COLUMN \"IsActive\" DROP DEFAULT; ALTER TABLE \"announcements\" ALTER COLUMN \"IsActive\" TYPE boolean USING CASE WHEN \"IsActive\" = 0 THEN false ELSE true END; ALTER TABLE \"announcements\" ALTER COLUMN \"IsActive\" SET DEFAULT true; END IF; END $$;",
            "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'refresh_tokens' AND column_name = 'IsRevoked' AND data_type <> 'boolean') THEN ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"IsRevoked\" DROP DEFAULT; ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"IsRevoked\" TYPE boolean USING CASE WHEN \"IsRevoked\" = 0 THEN false ELSE true END; ALTER TABLE \"refresh_tokens\" ALTER COLUMN \"IsRevoked\" SET DEFAULT false; END IF; END $$;"
        };

        foreach (var statement in statements)
        {
            await dbContext.Database.ExecuteSqlRawAsync(statement, cancellationToken);
        }

        await dbContext.Database.ExecuteSqlRawAsync(
            "CREATE TABLE IF NOT EXISTS \"leave_requests\" (\"Id\" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, \"StudentId\" uuid NOT NULL, \"Type\" integer NOT NULL, \"StartAtUtc\" timestamptz NOT NULL, \"EndAtUtc\" timestamptz NOT NULL, \"Reason\" character varying(1000) NOT NULL, \"Status\" integer NOT NULL, \"StaffNote\" character varying(1000), \"ReviewedByStaffId\" uuid, \"ReviewedAtUtc\" timestamptz, \"CreatedAtUtc\" timestamptz NOT NULL, CONSTRAINT \"FK_leave_requests_students_StudentId\" FOREIGN KEY (\"StudentId\") REFERENCES \"students\" (\"Id\") ON DELETE CASCADE);",
            cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(
            "CREATE TABLE IF NOT EXISTS \"entry_exit_logs\" (\"Id\" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, \"StudentId\" uuid NOT NULL, \"EventType\" integer NOT NULL, \"EventAtUtc\" timestamptz NOT NULL, \"Source\" character varying(60) NOT NULL, CONSTRAINT \"FK_entry_exit_logs_students_StudentId\" FOREIGN KEY (\"StudentId\") REFERENCES \"students\" (\"Id\") ON DELETE CASCADE);",
            cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_entry_exit_logs_EventAtUtc\" ON \"entry_exit_logs\" (\"EventAtUtc\");",
            cancellationToken);

        // Keep only the latest invoice for each student-month and enforce uniqueness at DB level.
        await dbContext.Database.ExecuteSqlRawAsync(
            "WITH ranked AS (SELECT \"Id\", ROW_NUMBER() OVER (PARTITION BY \"StudentId\", date_trunc('month', \"DueDateUtc\") ORDER BY \"DueDateUtc\" DESC, \"Id\" DESC) AS rn FROM \"payments\") DELETE FROM \"payments\" p USING ranked r WHERE p.\"Id\" = r.\"Id\" AND r.rn > 1;",
            cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(
            "DO $$ BEGIN CREATE UNIQUE INDEX IF NOT EXISTS \"UX_payments_student_month\" ON \"payments\" (\"StudentId\", date_trunc('month', \"DueDateUtc\" AT TIME ZONE 'UTC')); EXCEPTION WHEN OTHERS THEN NULL; END $$;",
            cancellationToken);
    }
}
