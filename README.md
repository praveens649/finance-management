# 💰 Role-Based Financial Management System

## 📌 Overview

This project is a **role-based financial management system** that enables users to manage personal finances, analysts to derive insights, and admins to oversee and control the system.

It is designed with **data integrity, role-based access control (RBAC), and scalable architecture** in mind.

---

## 🧠 Architecture

### 🏗️ Tech Stack

* **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
* **Backend**: Next.js API Routes (Service Layer)
* **Database**: PostgreSQL via Supabase
* **Auth**: Supabase Auth
* **Validation**: Zod
* **Data Fetching**: TanStack Query

---

### ⚙️ System Design

```plaintext
Frontend (Next.js)
        ↓
API Layer (Route Handlers)
        ↓
Service Layer (Business Logic)
        ↓
Supabase Client
        ↓
PostgreSQL (RLS + Triggers + RPC)
```

---

## 👥 Role Design (RBAC)

### 👤 User

* Create and manage accounts
* Create categories (income/expense)
* Add transactions (credit/debit)
* Transfer funds between accounts
* View personal dashboard and history

---

### 📊 Analyst

* Read-only access
* View system-wide analytics:

  * Income vs Expense trends
  * Monthly breakdown
  * Category-based spending
* Cannot modify any data

---

### 🛠️ Admin

* Full system oversight
* Manage users:

  * Update roles
  * Activate / deactivate users
  * Delete users
* View all transactions
* Access analytics per user and system-wide

---

## 🗄️ Database Design

### Core Tables

#### profiles

* id (UUID, FK → auth.users)
* full_name
* role (`user | analyst | admin`)
* is_active (boolean)

---

#### accounts

* id
* user_id
* name
* type (`cash | bank | wallet`)
* balance (numeric)
* currency
* created_at

---

#### categories

* id
* user_id
* name
* type (`income | expense`)
* created_at

---

#### transactions

* id
* user_id
* account_id
* category_id
* type (`credit | debit`)
* amount
* description
* created_at

---

### ⚠️ Key Design Decisions

#### 1. Balance Handling

* Balance is **not updated directly**
* All changes happen via **transactions**
* Database trigger ensures consistency

---

#### 2. Atomicity via Triggers

* Transaction creation and balance update occur in the same DB transaction
* Prevents partial updates and race conditions

---

#### 3. Row Level Security (RLS)

* Users can only access their own data
* Analyst has global read-only access
* Admin actions handled via service layer

---

#### 4. Analytics via RPC

* Complex aggregations handled using SQL functions
* Improves performance and avoids client-side computation

---

## 🔌 API Structure

### User APIs

```plaintext
POST   /api/user/accounts
POST   /api/user/accounts/onboard
POST   /api/user/transactions
POST   /api/user/transfer
GET    /api/user/transactions
GET    /api/user/accounts
```

---

### Analyst APIs

```plaintext
GET /api/analyst/dashboard
GET /api/analyst/monthly
GET /api/analyst/categories
```

---

### Admin APIs

```plaintext
GET    /api/admin/users
PATCH  /api/admin/users/:id
PATCH  /api/admin/users/:id/toggle
DELETE /api/admin/users/:id

GET    /api/admin/transactions
GET    /api/admin/users/:id/details
GET    /api/admin/users/:id/analytics
```

---

## 🔐 Security

* Role-based access enforced in service layer
* RLS ensures user-level isolation
* Admin operations are server-side only
* Inactive users are blocked from all actions

---

## 🔁 Key Workflows

### 🏦 Account Onboarding

1. User creates account (balance = 0)
2. Optional initial balance added via transaction
3. Trigger updates balance

---

### 💸 Transaction Flow

1. Validate input
2. Check ownership and balance
3. Insert transaction
4. Trigger updates account balance

---

### 🔁 Transfer Flow

1. Validate accounts and ownership
2. Check sufficient balance
3. Create debit + credit transactions
4. Linked via transfer_id

---

### 📊 Analytics Flow

1. API calls RPC functions
2. DB aggregates data
3. Results returned to frontend charts

---

## 🧪 Testing Strategy

* Role-based access validation
* Transaction consistency checks
* Transfer integrity tests
* RLS enforcement testing
* Edge case handling (inactive users, invalid inputs)

---
## Use demo credentials for admin access : admin@test.com | password123
## 🚀 Conclusion

This system demonstrates:

* Strong backend architecture
* Data integrity using database-level logic
* Proper RBAC implementation
* Scalable analytics design

It goes beyond basic CRUD by enforcing **real-world financial constraints and role-based system behavior**.
