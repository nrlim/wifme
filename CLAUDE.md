# CLAUDE.md — Wifme Platform

> This file provides context for Claude Code, Cursor, and other AI coding assistants working on the **Wifme** project.

---

## Quick Reference

```
Brand:       Wifme (Muthawif + Me)
Tagline:     Pendamping Ibadah Umroh Eksklusif - Wujudkan Perjalanan Suci yang Tenang, Aman, dan Penuh Berkah Bersama Muthawif Pilihan.
Type:        Mobile-first web platform (PWA-ready)
Stack:       Next.js 16 (App Router) · React 19 · TypeScript 5
Database:    PostgreSQL (Supabase) via Prisma 6
Real-time:   Firebase RTDB (chat)
Styling:     Tailwind CSS v4 + CSS custom properties
Auth:        Custom JWT (jose, HS256) — cookie: wifme_token
Deploy:      Vercel
Currency:    IDR (Indonesian Rupiah)
Locale:      id (Bahasa Indonesia)
```

---

## What Is Wifme?

Wifme is a marketplace platform connecting Indonesian **Jamaah** (Umrah pilgrims) with professional, verified **Muthawif** (Umrah guides / Pendamping Ibadah Umroh) in Makkah and Madinah. Think of it as "Grab/Gojek for Umrah guides."

### Core User Roles

| Role | Description | Dashboard |
|---|---|---|
| **Jamaah** | Searches, books, pays, and reviews Muthawif services | `/dashboard` |
| **Muthawif** | Creates trip packages, manages availability, earns money | `/dashboard/muthawif` |
| **Amir** | Platform admin — manages verification, fees, promos, payouts | `/dashboard` (admin view) |

---

## Key Business Domains

### 1. Booking & Itinerary
- Jamaah searches Muthawif → books for a date range → Muthawif confirms.
- Muthawif creates `TripPackage` (collection of `Itinerary` items).
- During the trip, Muthawif logs `ServiceLog` entries (photo + notes check-ins).
- Status flow: `PENDING → CONFIRMED → COMPLETED | CANCELLED`.

### 2. Escrow Wallet System
```
Jamaah Pays → PAYMENT_ESCROW (escrowBalance ↑)
                    ↓
         Booking Completes
                    ↓
         ESCROW_SETTLEMENT (escrowBalance ↓, availableBalance ↑)
                    ↓
         WITHDRAWAL → Payout to Muthawif bank account
```
- Platform fee calculated from `GlobalSetting` (singleton, `id = "singleton"`).
- Bank account numbers are AES-256-GCM encrypted (`lib/crypto.ts`).

### 3. Real-time Chat
- Firebase RTDB = real-time delivery (source of truth during session).
- PostgreSQL `ChatMessage` = permanent audit archive.
- Chat tied to Booking — `chatClosedAt` + `chatClosedByMuthawif` flags signal read-only mode.
- Daily sync via Vercel Cron (`/api/chat/sync`).

### 4. Promotion Engine
- Types: `FIXED_AMOUNT` (flat IDR) or `PERCENTAGE`.
- `discountTarget`: `"PLATFORM"` (platform pays) or `"MUTHAWIF"` (muthawif pays).
- Validation: `maxUsage`, `expiryDate`, `minBookingAmount`.

---

## Project Layout

```
src/
├── actions/         → Server Actions (finance.ts, promotions.ts)
├── app/
│   ├── api/         → REST Route Handlers
│   ├── auth/        → Login & Register pages
│   ├── booking/     → Booking detail (dynamic: [id])
│   ├── chat/        → Chat room (dynamic: [id])
│   ├── dashboard/   → Jamaah/Amir dashboard
│   │   └── muthawif/→ Muthawif dashboard
│   ├── itinerary/   → Trip itinerary view
│   ├── agenda/      → Jamaah agenda
│   ├── muthawif/    → Public profile + wallet
│   ├── search/      → Search & filter Muthawif
│   ├── globals.css  → Design system (CSS variables)
│   └── page.tsx     → Landing page
├── components/      → Reusable React components
│   ├── earnings/    → Earnings dashboard
│   ├── wallet/      → Wallet, fee, payout, promo management
│   └── ...
├── lib/             → Shared utilities
│   ├── auth.ts      → JWT: signJWT, verifyJWT, getSession
│   ├── chat-service.ts → Firebase ↔ PostgreSQL bridge
│   ├── crypto.ts    → AES-256-GCM encryption
│   ├── fee.ts       → calcTotalWithFee, calcServiceFee, getFeeConfig
│   ├── firebase-admin.ts
│   ├── firebase-client.ts
│   ├── prisma.ts    → Prisma singleton
│   ├── supabase.ts  → Server Supabase client
│   └── supabase-client.ts → Browser Supabase client
├── generated/       → Auto-generated Prisma client
└── middleware.ts    → Route protection (JWT verification)
```

---

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (runs prisma generate via postinstall)
npm run lint         # ESLint
npx prisma generate  # Regenerate Prisma client
npx prisma db push   # Push schema changes (dev)
npx prisma migrate dev # Create migration (production)
npx prisma studio    # Visual DB browser
```

---

## Coding Standards

### TypeScript
- **Strict mode ON** — no `any`, use `unknown` + type guards.
- Validate inputs with **Zod v4**.
- Path alias: `@/*` → `./src/*`.

### React / Next.js
- **Server Components by default** — add `"use client"` only when needed.
- Data fetching: Server Components use Prisma directly; Client Components use Route Handlers or Server Actions.
- Auth in middleware: `verifyJWT()` from `@/lib/auth`.
- Auth in pages/API: `getSession()` from `@/lib/auth`.

### Styling
- Tailwind CSS v4 utilities in JSX.
- **STATIC INLINE STYLE BAN**: Do **NOT** use inline `style={{ ... }}` blocks for static properties.
- Custom tokens in `globals.css` (CSS variables: `--emerald`, `--gold`, `--ivory`, etc.) accessed via arbitrary Tailwind brackets (`bg-[var(--emerald)]`).
- Framer Motion for complex animations (`motion.div`).
- Primary font: `Plus Jakarta Sans` · Arabic: `Amiri`.
- Color scheme: Emerald primary, Gold accent, Ivory background.
- **Portal Mandate**: Use `createPortal` to `document.body` for all viewport-wide drawers (e.g. user profile drawer) or modals inside containing-block containers (e.g. backdrop-filter elements) to prevent mobile isolation bugs.
- **Skill Reference**: Refer to `wifme-styling/instructions.md` before coding layouts.

### API Routes
- Pattern: `src/app/api/[resource]/route.ts`
- Always check auth: `const session = await getSession()`
- Response shape: `{ data?, error?, message? }`
- Proper HTTP status codes.

### Server Actions
- Pattern: `src/actions/[domain].ts`
- Directive: `"use server"` at top.
- Validate with Zod, return `{ success, data?, error? }`.

---

## Database Schema Highlights

The full schema is in `prisma/schema.prisma`. Key models:

| Model | Purpose |
|---|---|
| `User` | All users (Jamaah, Muthawif, Amir) — role-based |
| `MuthawifProfile` | Extended profile for Muthawif (bio, rating, verification status) |
| `Availability` | Muthawif calendar availability per date |
| `Booking` | Core transaction — links Jamaah ↔ Muthawif |
| `TripPackage` | Date-bound itinerary package by Muthawif |
| `Itinerary` | Single activity within a TripPackage |
| `ServiceLog` | Photo + notes check-in per Itinerary |
| `Review` | 1–5 star rating + comment (one per Booking) |
| `Wallet` | `availableBalance` + `escrowBalance` per User |
| `Transaction` | Ledger entries (PAYMENT_ESCROW, ESCROW_SETTLEMENT, WITHDRAWAL) |
| `Payout` | Withdrawal request to bank account |
| `Promotion` | Discount codes with usage tracking |
| `GlobalSetting` | Singleton platform config (fees, locations, services, languages) |
| `ChatMessage` | PostgreSQL archive of Firebase chat messages |

### Key Enums
```
Role: JAMAAH | MUTHAWIF | AMIR
BookingStatus: PENDING | CONFIRMED | CANCELLED | COMPLETED
VerificationStatus: PENDING | REVIEW | VERIFIED | REJECTED
TransactionType: PAYMENT_ESCROW | ESCROW_SETTLEMENT | WITHDRAWAL
PromotionType: FIXED_AMOUNT | PERCENTAGE
Location: MAKKAH | MADINAH | BOTH
```

---

## Auth System

```typescript
// lib/auth.ts — Custom JWT auth (DO NOT use NextAuth/Auth.js)
signJWT(payload)      // Create token (7d expiry)
verifyJWT(token)      // Verify token → JWTPayload | null
getSession()          // Read wifme_token cookie → JWTPayload | null

// JWTPayload shape:
interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;         // "JAMAAH" | "MUTHAWIF" | "AMIR"
  isVerified?: boolean; // Muthawif verification status
}
```

### Protected Routes (middleware.ts)
- `/dashboard` — any authenticated user (MUTHAWIF auto-redirects to `/dashboard/muthawif`)
- `/dashboard/muthawif/*` — MUTHAWIF role only
- `/itinerary/*`, `/agenda` — any authenticated user
- `/chat/*` — any authenticated user

---

## Environment Variables

```env
# Server-only (NEVER expose to client)
DATABASE_URL=          # Supabase connection pooler
DIRECT_URL=            # Supabase direct connection
JWT_SECRET=            # HMAC key for JWT signing
ENCRYPTION_KEY=        # AES-256-GCM key for bank accounts

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_URL=

# Client-safe (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Critical Rules

### DO
- Read `@AGENTS.md` fully before starting any task.
- Consult skills in `C:\Users\nural\.agents\skills` and `.agents\skills` before architectural decisions.
- Read and follow `wifme-styling/instructions.md` guidelines.
- Use Prisma singleton from `@/lib/prisma`.
- Use `getSession()` for auth checks.
- Validate all inputs with Zod.
- Use shadcn/ui for building UI components.
- Design mobile-first (touch targets ≥ 44px, `100dvh`), separating mobile vs web styling cleanly.
- Use existing CSS variables from `globals.css`.
- Keep all monetary values in IDR with `Math.round()`.

### DON'T
- Don't use `NextAuth`, `Auth.js`, `Clerk` — custom JWT auth only.
- Don't use emoticons or emojis anywhere in the code, UI copy, or documentation.
- Don't use `any` type.
- Don't use inline `style={{ ... }}` for static formatting properties.
- Don't call Prisma from Client Components.
- Don't expose server-only env vars to the client.
- Don't hardcode fee values — read from `GlobalSetting`.
- Don't invent domain terms not in the glossary.
- Don't skip input validation.
- Don't change fonts without approval.

---

## Skills Directory

```
Global Skills: C:\Users\nural\.agents\skills\
├── api-design-principles/    → REST API patterns
├── api-designer/             → Endpoint design
├── next-best-practices/      → Next.js App Router patterns
├── postgres-pro/             → PostgreSQL optimization
├── shadcn/                   → shadcn/ui (use for component building)
├── supabase-postgres-best-practices/
├── token-efficiency/         → Token-efficient coding
├── typescript-pro/           → TypeScript strict patterns
├── ui-ux-pro-max/            → Premium UI/UX design
└── vercel-react-best-practices/

Local Skills: .agents\skills\
└── wifme-styling/            → Wifme responsive mapping, portal rules, & inline style cleanup instructions
```

**Always check relevant skills before implementing new features.**

---

*This file is the canonical reference for all AI coding assistants working on the Wifme codebase. See `AGENTS.md` for the full, detailed specification.*
