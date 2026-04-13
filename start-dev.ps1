Write-Host "Starting PostgreSQL container..."
docker compose up -d postgres

Write-Host "Waiting for database health..."
Start-Sleep -Seconds 8

Write-Host "Applying EF Core migrations..."
dotnet ef database update --project src/DormitoryManagementSystem.Infrastructure --startup-project src/DormitoryManagementSystem.WebUI

Write-Host "Starting ASP.NET Core WebUI..."
dotnet run --project src/DormitoryManagementSystem.WebUI
