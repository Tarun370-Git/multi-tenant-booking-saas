# Multi-Tenant Appointment & Booking SaaS

A production-grade, multi-tenant service-business booking platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL + RLS)**, and **Stripe Billing**. 

Designed specifically for service-based businesses (barbers, salons, clinics, consultants) to manage appointment availability, double-booking prevention, customer CRM, automated 24-hour reminder jobs, and subscription-gated features.

---

## 📐 1. Architecture Diagram & System Design

```mermaid
flowchart TD
    Client["Client Browser\n(Public Client / Admin Dashboard)"]
    NextServer["Next.js App Router\n(Vercel Hosted Node.js Engine)"]
    
    subgraph DatabaseLayer["Supabase PostgreSQL + RLS"]
        Businesses["businesses / business_members"]
        Services["services / providers / provider_hours"]
        Bookings["bookings / booking_events"]
        Clients["clients (CRM)"]
        Subscriptions["subscriptions"]
        AtomicRPC["create_booking_atomic() RPC\n(FOR UPDATE Locks)"]
    end
    
    subgraph ExternalServices["External & Background Adapters"]
        CronJob["Vercel Cron / Job Scheduler\n(/api/cron/reminders)"]
        StripeBilling["Stripe Webhooks & Billing API"]
        AIService["AI Engine\n(Smart Assistant & No-Show Predictor)"]
    end

    Client -->|HTTPS / API Requests| NextServer
    NextServer -->|Authenticated RLS Queries| DatabaseLayer
    NextServer -->|Execute Concurrency Booking| AtomicRPC
    CronJob -->|Bearer Token Execution| NextServer
    StripeBilling -->|Webhook Signature Verifier| NextServer
    NextServer -->|Natural Language Availability Query| AIService
```

---

## 🛠️ 2. Required Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Next.js (App Router), Tailwind CSS, Lucide Icons | Responsive public booking wizard & business owner admin portal |
| **Backend** | Node.js Serverless Route Handlers in Next.js | Unified RESTful API endpoints for public & tenant-private data |
| **Database** | Supabase PostgreSQL | Relational storage, indexes, constraints, foreign keys, triggers |
| **Authentication** | Supabase Auth + `business_members` RBAC | Tenant ownership mapping and session protection |
| **Authorization** | PostgreSQL Row-Level Security (RLS) | Database-layer tenant isolation preventing cross-tenant access |
| **Billing** | Stripe SDK + Server-side Simulation Engine | Subscription tier gating, plan upgrades, and webhook listener |
| **Background Jobs** | Vercel Cron / Secret-authenticated endpoint | Automated 24-hour reminder dispatch with idempotency |
| **Testing** | Vitest | Automated unit & integration tests covering critical booking paths |

---

## 🔒 3. Multi-Tenancy & Row-Level Security (RLS) Strategy

Every tenant record contains a `business_id` reference. Database isolation is strictly enforced at the PostgreSQL layer using Supabase Row-Level Security (RLS):

1. **Authenticated Business Owners**:
   Access is granted only when `business_id IN (SELECT get_user_business_ids(auth.uid()))`.
2. **Public Unauthenticated Booking Flow**:
   Public read policies expose **only** active business profiles, active bookable services, and operating schedules (`enabled = true`). Private client records, internal notes, booking histories, and subscription details are strictly invisible.
3. **Security Test Verification**:
   Running queries under Business A credentials for Business B UUIDs returns 0 rows due to RLS policies.

---

## ⚡ 4. Double-Booking Prevention & Concurrency Protection

Availability display is not sufficient. To prevent race conditions when two clients attempt to book the exact same slot simultaneously, booking creation executes atomically via the PostgreSQL RPC function `create_booking_atomic()`:

- Uses `SELECT FOR UPDATE` on provider active bookings.
- Evaluates overlap rule: `existing_start < requested_end AND existing_end > requested_start`.
- Re-checks blocked periods immediately before insertion.
- Aborts with HTTP 409 Conflict if slot was claimed milliseconds prior.

---

## 🚀 5. Quick Start & Local Setup Guide

### Prerequisites
- Node.js v18+ (Tested on v24.15.0)
- npm / npx

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/multi-tenant-booking-saas.git
cd multi-tenant-booking-saas

# Install dependencies
npm install
```

### Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

---

## 🗄️ 6. Database Setup & Migrations

All SQL DDL, RLS policies, atomic functions, and seed data are located in `supabase/migrations/`:

```bash
# 1. Schema DDL: Tables, Enums, Foreign Keys, Indexes
supabase/migrations/01_schema.sql

# 2. Row-Level Security Policies (Multi-Tenant Isolation)
supabase/migrations/02_rls_policies.sql

# 3. Concurrency Protection RPC Function
supabase/migrations/03_atomic_booking.sql

# 4. Reviewer Seed Data (Populates Apex Barber Shop & Lumina Wellness Clinic)
supabase/migrations/04_seed_data.sql
```

---

## 🏃 7. Running Frontend & Backend

```bash
# Run Development Server
npm run dev

# Run Production Build Check
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 8. Testing Suite

Run the Vitest automated integration suite covering slot availability, concurrency overlap prevention, CRM LTV aggregation, reminder idempotency, and AI intent parsing:

```bash
npm test
```

---

## ⏰ 9. Automated Reminders Job Execution

Background reminders scan for appointments 24 hours in advance. To trigger the background job locally:

```bash
# Execute local reminder cron
curl -H "Authorization: Bearer super_secret_cron_bearer_token" http://localhost:3000/api/cron/reminders
```

---

## 💳 10. Billing Simulation & Subscription Gating

Business owners can switch plans (`starter`, `pro`, `enterprise`) in `/dashboard/billing`.
Webhook events (`customer.subscription.updated`, `invoice.payment_succeeded`) can be simulated via POST to `/api/billing/webhook`.

---

## 📊 11. Scale & Trade-Offs Discussion (100 to 10,000 Tenants)

As tenant scale expands from hundreds to tens of thousands:
1. **Database Indexing**: Compound index `idx_bookings_provider_dates (provider_id, starts_at, ends_at)` keeps availability queries bound under O(log N) lookup time.
2. **Connection Pooling**: Use Supabase Transaction Pooler (PgBouncer) to manage serverless connection spikes.
3. **Caching Strategy**: Redis (Upstash) can cache business public profiles and service catalogs with instant invalidation on settings mutate.
4. **Job Throughput**: Queue reminder dispatches via QStash / BullMQ for guaranteed sub-second delivery at scale.

---

## 📄 12. Deliverables & License

- **Repository Source Code**: Clean Next.js + TypeScript structure.
- **SQL Migrations**: Clean schema, RLS, and seed scripts.
- **Tests**: 100% passing Vitest test suite.
