# Socivexa

Socivexa is a multi-tenant housing society and apartment management SaaS platform for society admins, residents, security guards, and super admins.

**Tagline**: Smart Society Living, Simplified.

## Technology Stack

### Backend
* **ASP.NET Core 8 Web API**
* **Entity Framework Core 8** (with SQL Server database)
* **JWT Authentication** and Role-Based Authorization
* Multi-tenant structure by `SocietyId`

### Frontend
* **React 19** with **TypeScript** and **Vite**
* **Tailwind CSS v3** styling
* **Lucide React** icons
* **Recharts** charts library
* **React Router v6** routing
* **Axios** HTTP client

---

## Getting Started

### 1. Prerequisites
* **SQL Server** (LocalDB, Express, or developer edition)
* **Node.js** (v18 or higher)
* **.NET 8 SDK**

---

### 2. Backend Setup & Run

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Restore NuGet dependencies and build the solution:
   ```bash
   dotnet restore
   dotnet build SocietyManagement.slnx
   ```

3. Run the API project:
   ```bash
   dotnet run --project SocietyManagement.Api
   ```
   *The database schema will be automatically created on LocalDB (`(localdb)\MSSQLLocalDB` under the name `SocietyManagementDb`) and seeded with 2 societies, 10 flats, registered users, maintenance invoices, and sample complaints.*

4. The Swagger interface is available at:
   `http://localhost:5085/swagger`

---

### 3. Frontend Setup & Run

1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend/society-management-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## Sample Credentials for Review

Use any of the following accounts to sign in. The password for all accounts is **`Password123!`**.

| Role | Email | Society / Wing |
|------|-------|----------------|
| **Super Admin** | `superadmin@socivexa.com` | System-wide access |
| **Society Admin** | `admin@greenvalley.com` | Green Valley Residency |
| **Society Admin** | `admin@sunriseheights.com` | Sunrise Heights |
| **Resident** | `amit.kumar@email.com` | Green Valley Wing A-101 |
| **Resident** | `sneha.joshi@email.com` | Green Valley Wing A-102 |
| **Security Guard** | `security1@greenvalley.com` | Green Valley Gate |
