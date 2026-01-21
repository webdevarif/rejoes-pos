# ReJoEs System – Requirements vs Implementation Report

**Last updated:** 2026-01-20  
**Scope:** Backend API and Shopify POS extension vs specification

---

## 1. Core Design Principles

| Requirement | Status | Notes |
|-------------|--------|-------|
| Shopify as system of record for customers and billing | ✅ Implemented | Webhook listener in `server/src/routes/webhooks.routes.ts` |
| Custom backend for circulation, timers, swaps, photos | ✅ Implemented | Full backend with Prisma, services, and routes |
| No SKUs, no cart line items, no stock separation | ✅ Implemented | Photo-based loans, no SKU model |
| One national inventory pool with universal access | ✅ Implemented | Single `Loan` model, no store-level stock |
| Speed, simplicity, staff ergonomics prioritized | ✅ Implemented | Minimal API surface, photo-based checkout |

---

## 2. Subscription Tiers and Rules

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Basic: 1 item/month, 0 swaps, max 1 item out | ✅ Implemented | `getTierConfig` in `server/src/utils/tiers.ts` |
| Plus: 5 items/month, 2 swaps/month, max 2 items out | ✅ Implemented | Same utility |
| Premium: 10 items/month, 5 swaps/month, max 4 items out | ✅ Implemented | Same utility |
| Monthly counters reset on billing cycle | ✅ Implemented | `resetCountersIfNewCycle` in `member.service.ts` |

---

## 3. High-Level System Architecture

| Component | Status | Path |
|-----------|--------|------|
| Shopify Storefront (subscriptions) | ✅ Out of scope | Handled by Shopify |
| Custom Backend Application | ✅ Implemented | `server/` |
| Shopify POS UI Extension | ❌ Not implemented | `rejoes-pos/extensions/` lacks POS extension |
| External Object Storage | ✅ Implemented | `uploads/` directory, image service |

---

## 4. Data Model Overview

| Table | Requirement | Status | Implementation |
|-------|-------------|--------|----------------|
| Members | card token, Shopify customer ID, tier, status, cycle dates, counters | ✅ Implemented | `prisma/schema.prisma` |
| Loans | member ID, store location, checkout time, due date, return time, photo URL | ✅ Implemented | `prisma/schema.prisma` |
| Audit events | records all actions for traceability | ✅ Implemented | `prisma/schema.prisma` |

---

## 5. In-Store Checkout Flow

| Step | Requirement | Status | Implementation |
|------|-------------|--------|----------------|
| 1. Staff opens ReJoEs Library tile in POS | ❌ Not implemented | No POS extension yet |
| 2. Staff scans barcode on membership card | ❌ Not implemented | No POS extension yet |
| 3. POS retrieves member status, allowances, items out | ✅ Backend ready | `GET /api/members/by-card/:cardToken` |
| 4. Staff taps Checkout Item and captures photo | ❌ Not implemented | No POS extension yet |
| 5. Backend creates loan record linking photo to member | ✅ Backend ready | `POST /api/loans/checkout` + `POST /api/uploads/loan-photo` |

---

## 6. Returns Flow

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Staff scans card, visually matches returned item to photo thumbnail, confirms return | ❌ Not implemented | No POS extension yet |
| Backend closes loan and frees capacity | ✅ Backend ready | `POST /api/loans/return` |

---

## 7. Swap Flow

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Combined operation: return + capture photo + create loan, consuming swap allowance | ✅ Backend ready | `POST /api/loans/swap` |
| UI for staff to initiate swap | ❌ Not implemented | No POS extension yet |

---

## 8. Subscription Lifecycle Sync

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Backend listens to Shopify subscription webhooks | ✅ Implemented | `webhooks.routes.ts` + `subscription.service.ts` |
| Keeps member status, tier, billing cycles in sync | ✅ Implemented | `handleSubscriptionEvent` |
| Monthly counters reset automatically | ✅ Implemented | `resetCountersIfNewCycle` |

---

## 9. Safeguards

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Block checkout when subscriptions inactive | ✅ Implemented | `validateMemberCanCheckout` |
| Block when allowances exceeded | ✅ Implemented | Same validator |
| Block when max items out reached | ✅ Implemented | Same validator |
| All actions logged for auditing | ✅ Implemented | `audit.service.ts` |

---

## 10. Design Intent

| Goal | Status | Evidence |
|------|--------|----------|
| Scale nationally without increasing in-store complexity | ✅ Implemented | Single national pool, no per-store logic |
| Photos replace SKUs | ✅ Implemented | `LoanPhoto` model and image service |
| Time replaces tracking | ✅ Implemented | Timers via checkout/return timestamps |
| Subscriptions fund processing velocity | ✅ Implemented | Tier-based limits and counters |

---

## 11. Missing Items & Next Steps

| Area | Missing | Impact | Effort |
|------|---------|--------|--------|
| POS UI Extension | Entire POS extension not created | Cannot use system in-store | High |
| POS Extension Scaffold | `extensions/rejoes-pos/` folder and `shopify.extension.toml` | Cannot start UI work | Medium |
| POS Screens | MemberLookup, Dashboard, Checkout, Return, Swap | No staff interface | High |
| POS Components | MemberInfoCard, LoanList, ActionButtons, PhotoCapture | No UI building blocks | High |
| POS Utilities | fetchUtils, idempotency helpers | No API helpers | Low |
| Dependencies & Build | Extension-level packages and build verification | Cannot run/test | Medium |
| End-to-End Test | `shopify app dev` preview and POS tile/modal verification | Cannot validate flow | Medium |

---

## 12. Summary

- **Backend**: Fully compliant with specification (data model, APIs, safeguards, webhooks, image handling)
- **POS Extension**: Not started; needs full implementation from scaffold to UI
- **Immediate Blocker**: Without the POS extension, the system cannot be used in-store
- **Estimated Work**: 8–12 days to scaffold and implement POS extension per original plan

---

**Recommendation:** Prioritize POS extension creation (Step 2 in STATUS.md) to unblock in-store operations. Backend is production-ready.
