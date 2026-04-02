# Finance Management Platform: Backend Architecture
**Version**: 1.0.0
**Target Frameworks**: Next.js App Router, Supabase (Postgres)

---

## 1. System Philosophy
The bedrock of this system is an aggressive separation of concerns. The application explicitly divides "Guardrails" (Database limitations) from "Control Logic" (Server-side procedures). 

- **UI / Next.js Server Actions**: Validates explicit user intent (Zod Schema), intercepts malicious payloads early, and routes explicit execution commands to the Database.
- **Postgres Engine (Triggers & RPCs)**: Exclusively handles mathematical computation (i.e., atomic finance balancing) and global aggregations.
- **Row Level Security (RLS)**: Executes zero-trust isolation. A user inherently cannot read or modify data that does not belong strictly to them, mitigating API leaks.

---

## 2. Database Schema & Data Models
The system operates on four unified primary tables linked relationally to Supabase's absolute authentication table (`auth.users`).

### 2.1 Schema Breakdown
1. **Profiles (`profiles`)**: 
   - Bound 1:1 to `auth.users`. 
   - Defines display data (`full_name`) and explicit RBAC status (`role`: *'user', 'analyst', 'admin'*).
   - Utilizes an `is_active` boolean to instantly block malicious or deactivated users from executing downstream logic.
2. **Accounts (`accounts`)**: 
   - Constrained strictly by `user_id`. Controls financial aggregates (`balance`, `currency`) categorized by check types (*'cash', 'bank', 'wallet'*).
3. **Categories (`categories`)**: 
   - User-defined taxonomy nodes separating types (*'income', 'expense'*).
4. **Transactions (`transactions`)**: 
   - Inherently links the `user_id`, `account_id`, and `category_id`. 
   - Uses strict absolute amounts (`amount > 0`) determined purely by the direction tag (`type` = *'credit'* or *'debit'*).

---

## 3. Financial Atomicity & Database Triggers
We do not rely on NodeJS memory or external API latency to manage financial numbers. 

### 3.1 Balance Integrity (`handle_transaction_balance`)
Because standard server transactions (e.g., executing `.insert()` and subsequently `.update()`) are susceptible to network drops resulting in ghost transactions, we unified them directly at the database tier.
When a transaction is inserted, the `on_transaction_created` POSTGRES trigger activates independently. If the transaction registers as a `debit`, the `accounts` table balance decrements precisely. The transaction insertion and balance update are physically incapable of occurring separately.

### 3.2 Automated Profile Provisioning (`handle_new_user`)
When a user signs up successfully interacting with the internal Supabase API, an `after insert on auth.users` trigger automatically provisions their default `user` profile within the public schema, rendering ghost/orphaned user accounts impossible.

---

## 4. Security & RBAC (Role-Based Access Control)
Role-Level Access control merges robust DB protections with extensive Service-Layer routing.

### 4.1 RLS Configurations
- **Users**: Fully isolated mapping strictly where `user_id = auth.uid()`.
- **Analysts**: Given read visibility across the database via a Security Definer function (`get_auth_role()`). This intercepts infinite recursion errors naturally found in self-referencing SQL policy checks, while explicitly blocking arbitrary mutation requests.

### 4.2 Utility Guarding (`requireRole` & `requireActive`)
All primary server methods explicitly utilize backend profile verification prior to executing logic. Regardless of UI states, if a user profile is disabled (`is_active = false`), they instantly receive `Forbidden` exceptions rejecting any API routing or money movement attempts. 

---

## 5. Next.js Service Layer Architecture
The core backend layer is split into distinct functional Service pipelines. Each maps flawlessly to a predictable Zod interface and uniformly returns a standardized `{ data: Type | null, error: string | null }` payload. No unmapped exceptions are thrown to the UI.

### 5.1 Transfer Service (Double-Entry Atomicity)
Transfers operate by creating two independent records synchronously.
1. The backend forces explicit source/destination parity checks, verifying both accounts strictly belong to the authorizing `user_id`, and matching identical currency environments.
2. We map an array insertion: `[{ debit_source }, { credit_dest }]`.
3. PostgREST processes array payloads within a highly-secured database locking state. If the target credit fails (due to an invalid UUID or logic failure), the source debit automatically rejects, preventing lost capital.

### 5.2 Analyst Service Layer
Instead of fetching thousands of raw transaction objects to aggregate in client memory, the Analyst service utilizes `.rpc()` to call purely optimized Postgres Functions.
- `get_monthly_stats`: Instantly returns pre-quantified summations stripped down and explicitly ordered by `date_trunc` buckets.

### 5.3 Administration Service Layer
Pushing root permissions strictly into Database RLS dramatically impacts debugging clarity. Therefore, Administrative powers operate strictly at the *Backend Network Layer*.
- Admins verify their identity via `verifyRootAdminSecurity()`. Once validated, the Server spins up an overriding `Service_Role` authenticated client enabling massive scope modifications (e.g. `toggleUserActive`, `updateUserRole`) while keeping generic RLS tables unpolluted from complex hierarchical clauses.
