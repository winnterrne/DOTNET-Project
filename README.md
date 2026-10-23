# DFGymCenter - Gym Management System

Hệ thống quản lý phòng gym DFGymCenter gồm 2 phần: Frontend và Backend.

## Cấu trúc thư mục (Project Structure)

```text
DOTNET-Project/
├── backend/                  # .NET 10 Web API Clean Architecture
│   ├── DFGymCenter.slnx      # Solution file
│   └── src/
│       ├── DFGymCenter.Domain/           # Entities, Enums, Exceptions
│       ├── DFGymCenter.Application/      # DTOs, Services Interfaces & Logic
│       ├── DFGymCenter.Infrastructure/   # EF Core DbContext, Configurations, 
│       └── DFGymCenter.API/              # Controllers, Middlewares, Program.cs
│
├── frontend/                 # React 19 + TypeScript + Vite UI
│   ├── src/                  # Components, Pages, Stores, Types
│   ├── public/               # Static assets & icons
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.ts        # Vite configuration
│
└── README.md
```

## Hướng dẫn chạy dự án (Getting Started)

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại: `http://localhost:5173`

### 2. Backend
Yêu cầu: [.NET 10 SDK](https://dotnet.microsoft.com/)
```bash
cd backend
dotnet restore DFGymCenter.slnx
dotnet run --project src/DFGymCenter.API
```
API & Swagger/OpenAPI sẽ khởi chạy tại cổng được cấu hình trong `launchSettings.json`.
