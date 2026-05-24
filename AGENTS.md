<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Wifme — Platform Rules for AI Agents

> **IMPORTANT**: Read this file completely before writing any code. Violations of these rules will result in rejected code.

---

## 1 · Brand & Vision

| Key | Value |
|---|---|
| **Brand Name** | **Wifme** (portmanteau of "Muthawi**f**" + "**Me**") |
| **Tagline** | Pendamping Ibadah Umroh Eksklusif - Wujudkan Perjalanan Suci yang Tenang, Aman, dan Penuh Berkah Bersama Muthawif Pilihan. |
| **Core Vision** | The most trusted and seamless companion platform connecting Indonesian Umrah pilgrims (**Jamaah**) with professional, verified Umrah guides (**Muthawif**) in the holy cities of Makkah and Madinah. |
| **Base Currency** | **IDR** (Indonesian Rupiah) — all monetary values are in IDR |
| **Primary Locale** | `id` (Bahasa Indonesia) |
| **Target Device** | Mobile-first web app, PWA-ready |

---

## 2 · Domain Glossary

Use these terms consistently across code, comments, and UI copy. Never invent synonyms.

| Term | Definition |
|---|---|
| **Jamaah** | An Umrah pilgrim who searches, books, and pays for Muthawif services. |
| **Muthawif** | A professional, verified Umrah guide (Pendamping Ibadah Umroh) who offers trip packages. |
| **Amir** | Platform administrator/moderator who oversees verification, settings, and disputes. |
| **Booking** | A confirmed engagement between a Jamaah and a Muthawif for a date range. |
| **TripPackage** | A date-bound collection of itineraries created by a Muthawif. |
| **Itinerary** | A single activity within a TripPackage (e.g., "Tawaf Ifadah" at a specific time/place). |
| **ServiceLog** | A check-in record (photo + notes) logged against an Itinerary item. |
| **Escrow** | Wallet balance held by the platform until booking completion; then settled to Muthawif. |
| **Available Balance** | Muthawif wallet funds cleared for withdrawal (Payout). |
| **Payout** | A fund withdrawal request from Muthawif's Available Balance to their bank account. |
| **Promotion** | A discount code — either `FIXED_AMOUNT` (IDR) or `PERCENTAGE`, with `discountTarget` of `PLATFORM` or `MUTHAWIF`. |
| **GlobalSetting** | Singleton row (`id = "singleton"`) in DB storing platform-wide fee config, supported locations, languages, and services. |

---

## 3 · Tech Stack (Exact Versions)

| Layer | Technology | Version |
|---|---|---|
| Framework | **Next.js** (App Router) | `16.2.2` |
| Runtime | **React** | `19.2.4` |
| Language | **TypeScript** (strict mode) | `^5` |
| ORM | **Prisma Client** | `^6.19.3` |
| Database | **PostgreSQL** via Supabase | — |
| Auth | **jose** (JWT HS256) — custom, cookie-based (`wifme_token`) | `^6.2.2` |
| Real-time | **Firebase** (Admin + Client) — RTDB for chat | `^12.11.0` / `^13.7.0` |
| Styling | **Tailwind CSS v4** + custom CSS variables in `globals.css` | `^4` |
| Animations | **Framer Motion** | `^12.38.0` |
| Icons | **Lucide React** | `^1.7.0` |
| Charts | **Recharts** | `^3.8.1` |
| Validation | **Zod** | `^4.3.6` |
| Encryption | **bcryptjs** (passwords), custom AES-256-GCM (`lib/crypto.ts`) for bank account numbers | — |
| Date | **date-fns** | `^4.1.0` |
| Deployment | **Vercel** | — |

---

## 4 · Project Structure

```
wifme/
├── prisma/
│   └── schema.prisma          # Single source of truth for DB models
├── src/
│   ├── actions/               # Server Actions (finance.ts, promotions.ts)
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # Route Handlers (REST endpoints)
│   │   │   ├── analytics/
│   │   │   ├── auth/          # login, register, me, logout
│   │   │   ├── bookings/
│   │   │   ├── chat/          # Firebase RTDB ↔ PostgreSQL sync
│   │   │   ├── cron/          # Vercel Cron Jobs (auto-status)
│   │   │   ├── itineraries/
│   │   │   ├── muthawif/
│   │   │   ├── promotions/
│   │   │   ├── reviews/
│   │   │   ├── trip-packages/
│   │   │   └── webhook/       # Payment webhook (Midtrans simulation)
│   │   ├── auth/              # Login & Register pages
│   │   ├── booking/[id]/      # Booking detail page
│   │   ├── chat/[id]/         # Chat room page
│   │   ├── dashboard/         # Jamaah + Amir dashboard
│   │   │   └── muthawif/      # Muthawif-specific dashboard
│   │   │       └── bookings/  # Muthawif booking management
│   │   ├── itinerary/[bookingId]/  # Trip itinerary view
│   │   ├── agenda/            # Jamaah agenda view
│   │   ├── muthawif/[id]/     # Public Muthawif profile page
│   │   │   └── wallet/        # Muthawif wallet page
│   │   ├── search/            # Muthawif search & filter
│   │   ├── simulator/         # (Dev) Payment simulator
│   │   ├── globals.css        # Design system — CSS custom properties
│   │   ├── layout.tsx         # Root layout (UIProvider, fonts)
│   │   └── page.tsx           # Landing page / homepage
│   ├── components/            # Reusable UI components
│   │   ├── earnings/          # Earnings dashboard components
│   │   ├── wallet/            # Wallet, Fee, Payout, Promo components
│   │   ├── ChatRoom.tsx
│   │   ├── ChatWidget.tsx
│   │   ├── Navbar.tsx
│   │   ├── MuthawifCard.tsx
│   │   ├── SearchFilterBar.tsx
│   │   ├── UIProvider.tsx     # Client-side providers (Framer Motion)
│   │   └── ...
│   ├── generated/prisma/      # Auto-generated Prisma client
│   ├── lib/                   # Shared utilities
│   │   ├── auth.ts            # JWT sign/verify/getSession
│   │   ├── chat-service.ts    # Firebase ↔ PostgreSQL bridge
│   │   ├── crypto.ts          # AES-256-GCM encryption
│   │   ├── fee.ts             # Fee calculation (calcTotalWithFee, calcServiceFee)
│   │   ├── firebase-admin.ts  # Firebase Admin SDK init
│   │   ├── firebase-client.ts # Firebase Client SDK init
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── supabase.ts        # Supabase server client
│   │   └── supabase-client.ts # Supabase browser client
│   └── middleware.ts          # Auth middleware (route protection)
├── vercel.json                # Cron jobs config
├── next.config.ts
├── tsconfig.json
├── prisma.config.ts
└── package.json
```

---

## 5 · Architecture Patterns

### 5.1 Authentication & Authorization
- **JWT-based auth** via `jose` (HS256) — stored in `wifme_token` HTTP-only cookie.
- `getSession()` in `lib/auth.ts` extracts the user from the cookie in Server Components and Route Handlers.
- `verifyJWT()` is used in `middleware.ts` for route protection.
- Three roles: `JAMAAH`, `MUTHAWIF`, `AMIR` — defined in Prisma `enum Role`.
- Muthawif verification status: `PENDING → REVIEW → VERIFIED | REJECTED`.
- **Never use NextAuth** — the project uses a custom auth system.

### 5.2 Data Access
- **Always import `prisma` from `@/lib/prisma`** — it's a singleton.
- Server Components can call Prisma directly (no API call needed).
- Client Components must call Route Handlers (`/api/...`) or Server Actions (`src/actions/...`).
- Use `serverExternalPackages` in `next.config.ts` for server-only dependencies.

### 5.3 Real-time Chat
- **Firebase RTDB** is the source-of-truth for real-time message delivery.
- **PostgreSQL (`ChatMessage`)** is the permanent archive for audit trail.
- Sync mechanism: `/api/chat/sync` (Vercel Cron, daily) + real-time writes via `chat-service.ts`.
- Chat sessions are tied to a Booking — `chatClosedAt` signals read-only mode.

### 5.4 Financial System (Escrow Wallet)
- Payment flow: `Jamaah pays → PAYMENT_ESCROW (escrowBalance++) → Booking completes → ESCROW_SETTLEMENT (escrowBalance--, availableBalance++) → WITHDRAWAL (Payout)`.
- Fee calculation via `lib/fee.ts` — reads from `GlobalSetting` singleton.
- Bank account numbers are encrypted via AES-256-GCM (`lib/crypto.ts`).
- All amounts are in **IDR** — use integer-safe rounding (`Math.round`).

### 5.5 Promotion Engine
- Supports `FIXED_AMOUNT` (flat IDR discount) and `PERCENTAGE` discount types.
- `discountTarget`: `"PLATFORM"` (platform absorbs cost) or `"MUTHAWIF"` (muthawif absorbs cost).
- Promotions have optional `maxUsage`, `expiryDate`, and `minBookingAmount`.
- Validation logic lives in `src/actions/promotions.ts`.

---

## 6 · Coding Conventions

### 6.1 TypeScript
- **Strict mode is ON** — never use `any`. Use `unknown` + type guards instead.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Always validate external inputs with **Zod v4** schemas.
- Use path alias `@/*` → `./src/*` for all imports.

### 6.2 File Naming
- React Components: `PascalCase.tsx` (e.g., `ChatRoom.tsx`).
- Server Actions: `camelCase.ts` (e.g., `finance.ts`).
- Utilities/Libraries: `kebab-case.ts` (e.g., `chat-service.ts`).
- Pages follow Next.js conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.

### 6.3 Components
- Prefer **Server Components** by default — only add `"use client"` when interactivity is needed.
- Client Components must have `"use client"` directive at the very top.
- Use **shadcn/ui** for building UI components.
- Components live in `src/components/` — group related components in subdirectories.
- All interactive elements **must** have a unique, descriptive `id` attribute.

### 6.4 Styling
- **Tailwind CSS v4** is the primary styling tool — use utility classes in JSX.
- Custom design tokens are defined as CSS variables in `src/app/globals.css`.
- Use Framer Motion for animations — prefer `motion.div` over CSS animations for complex motion.
- **Color palette**: Emerald (`#1B6B4A`) as primary, Gold (`#C4973B`) as accent, Ivory (`#FAF7F2`) as background.
- **Typography**: Primary font is `Plus Jakarta Sans`, Arabic text uses `Amiri` serif.
- Mobile-first: always design for mobile viewport first, then layer on desktop styles.

### 6.5 API Routes (Route Handlers)
- Located in `src/app/api/[resource]/route.ts`.
- Always validate auth via `getSession()` before processing requests.
- Return standardized JSON: `{ data?: T, error?: string, message?: string }`.
- Use proper HTTP status codes: `200`, `201`, `400`, `401`, `403`, `404`, `500`.
- Handle Prisma errors gracefully — never expose raw database errors to client.

### 6.6 Server Actions
- Located in `src/actions/`.
- Must have `"use server"` directive.
- Validate all inputs with Zod before executing database operations.
- Return `{ success: boolean, data?: T, error?: string }`.

### 6.7 Error Handling
- Use try/catch blocks around all async operations.
- Log errors with context (operation name, relevant IDs).
- Never throw unhandled errors in Server Components — use `error.tsx` boundaries.
- Prisma errors: check for `P2002` (unique constraint), `P2025` (not found), etc.

---

## 7 · Mobile-First & PWA

- All UI must be designed **mobile-native-first**. Desktop is an enhanced experience.
- Touch targets minimum **44×44px**.
- Use `100dvh` instead of `100vh` for mobile viewport height.
- Responsive breakpoints:
  - Mobile: `≤ 640px`
  - Tablet: `641px – 900px`
  - Desktop: `> 900px`
- Off-canvas navigation pattern for mobile dashboards (see `MobileSidebarDrawer.tsx`).
- PWA support is planned — use `<meta name="viewport">` and semantic HTML.

---

## 8 · Security Rules

- **NEVER** expose secrets in client-side code (env vars must use `NEXT_PUBLIC_` prefix for client access only when safe).
- Sensitive env vars (`JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `ENCRYPTION_KEY`) are server-only.
- Always hash passwords with `bcryptjs` before storing.
- Always encrypt bank account numbers with AES-256-GCM before storing.
- Validate and sanitize all user inputs — both in API routes and Server Actions.
- Use CSRF protection for state-changing operations.
- Never trust client-side role claims — always verify from the JWT/session on the server.

---

## 9 · Database Rules

- **Schema is in `prisma/schema.prisma`** — this is the single source of truth.
- After modifying the schema, run `npx prisma generate` then `npx prisma db push` (for dev) or `npx prisma migrate dev` (for production migrations).
- `GlobalSetting` is a **singleton** — always query with `where: { id: "singleton" }`.
- Use `@@index` for frequently queried columns.
- Use `@unique` for natural business keys.
- Monetary fields use `Float` (Prisma) — always round with `Math.round()` before storing.
- Use `onDelete: Cascade` for dependent records (e.g., MuthawifProfile → User).

---

## 10 · Vercel Deployment

- Cron jobs are defined in `vercel.json`:
  - `/api/cron/auto-status` — daily at midnight (auto-complete/cancel old bookings).
  - `/api/chat/sync` — daily at midnight (sync Firebase RTDB → PostgreSQL).
- `serverExternalPackages` in `next.config.ts`: `@prisma/client`, `bcryptjs`, `firebase-admin`.
- Build command: `next build` (includes `postinstall: prisma generate`).

---

## 11 · AI Agent Skills Directory

Before making **any** architectural decision, implementing new features, or making assumptions about business logic, you **MUST** consult the skills in:

```
C:\Users\nural\.agents\skills
```

Available skills:
| Skill | Purpose |
|---|---|
| `api-design-principles` | REST API design patterns and best practices |
| `api-designer` | API endpoint design guidelines |
| `find-skills` | How to discover and use available skills |
| `next-best-practices` | Next.js App Router patterns (RSC, data fetching, error handling, etc.) |
| `postgres-pro` | PostgreSQL query optimization and schema design |
| `prompt-engineer` | Prompt engineering best practices |
| `shadcn` | shadcn/ui component usage |
| `supabase-postgres-best-practices` | Supabase + PostgreSQL patterns |
| `token-efficiency` | Token-efficient coding practices |
| `typescript-pro` | TypeScript strict-mode patterns and best practices |
| `ui-ux-pro-max` | Premium UI/UX design patterns |
| `vercel-react-best-practices` | Vercel + React deployment and performance patterns |

---

## 12 · What NOT to Do

> **STRICTLY FORBIDDEN:**

1. Do **NOT** install or use `NextAuth`, `Auth.js`, `Clerk`, or any third-party auth library.
2. Do **NOT** use emoticons or emojis anywhere in the code, UI copy, or documentation.
3. Do **NOT** change the font from `Plus Jakarta Sans` / `Amiri` without explicit approval.
4. Do **NOT** use `any` type — ever.
5. Do **NOT** put server-side logic in Client Components.
6. Do **NOT** call Prisma from Client Components (use API routes or Server Actions).
7. Do **NOT** expose `DATABASE_URL`, `JWT_SECRET`, or `ENCRYPTION_KEY` to the client.
8. Do **NOT** hardcode monetary values — always read fee config from `GlobalSetting`.
9. Do **NOT** create new CSS custom properties without adding them to `globals.css`.
10. Do **NOT** invent domain terms outside the glossary (Section 2) without explicit approval.
11. Do **NOT** hallucinate brand features, services, or business logic not documented here.
12. Do **NOT** skip input validation — always validate with Zod.
