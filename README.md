# DFGymCenter - Gym Management System

Hệ thống quản lý phòng tập thể hình (Gym & Fitness Center Management System) được tổ chức theo kiến trúc Monorepo phân tách rõ ràng giữa Frontend và Backend.

---

## 📁 Cấu trúc Dự án (Project Structure)

```
dfgymcenter/
├── frontend/                          # Ứng dụng Frontend (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── assets/                    # Hình ảnh, tài nguyên tĩnh
│   │   ├── components/                # UI Components tái sử dụng (Layout, UI, Labels)
│   │   ├── pages/                     # Màn hình theo phân quyền (Admin, Staff, Trainer, Member)
│   │   ├── store/                     # Quản lý State & Seed Data (AppContext)
│   │   ├── types.ts                   # Định nghĩa Type hệ thống
│   │   └── utils.ts                   # Hàm tiện ích chung
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                           # Backend .NET Core Web API (Clean Architecture)
    ├── src/
    │   ├── DFGymCenter.Domain/        # Entities, Enums, Value Objects, Domain Exceptions
    │   ├── DFGymCenter.Application/   # Use cases, Interfaces, DTOs, Business Services
    │   ├── DFGymCenter.Infrastructure/# EF Core, Fluent API Configurations, Persistence, Migrations
    │   └── DFGymCenter.API/           # RESTful Controllers, Middlewares, DI Setup
    └── DFGymCenter.slnx               # .NET Solution file
```

---

## 🚀 Hướng Dẫn Khởi Chạy (Getting Started)

### 1. Khởi chạy Frontend
Yêu cầu: Node.js 18+

```bash
cd frontend
npm install   # nếu cần cài đặt lại packages
npm run dev   # khởi chạy local dev server (mặc định tại http://localhost:5173)
```

Build production:
```bash
cd frontend
npm run build
```

---

### 2. Khởi chạy Backend (.NET API)
Yêu cầu: .NET 8 / .NET 9 SDK, SQL Server hoặc LocalDB

```bash
cd backend/src/DFGymCenter.API
dotnet restore
dotnet build
dotnet run    # Swagger UI sẽ khả dụng tại https://localhost:xxxx/swagger
```
