---
trigger: manual
---

# ReJoEs Backend – Rules & Constraints

This file defines **non-negotiable rules** for the ReJoEs Clothing Library backend.
Any AI agent or developer working on this project MUST follow these rules exactly.

---

## 1. Scope Boundaries

- This project covers **backend/server only**.
- DO NOT implement Shopify POS UI, storefront UI, or frontend logic here.
- DO NOT invent features, APIs, or workflows not explicitly described.
- DO NOT add carts, SKUs, products, variants, inventory counts, or line items.

---

## 2. System of Record Rules

- Shopify is the **system of record** for:
  - Customers
  - Subscription billing
  - Subscription status
  - Billing cycle dates

- The ReJoEs backend is the **system of record** for:
  - Members
  - Loans (checkouts, returns, swaps)
  - Photos
  - Allowances and counters
  - Audit logs

- The backend MUST NEVER:
  - Charge customers
  - Modify subscriptions
  - Create orders
  - Add cart items

---

## 3. Inventory & Item Identity Rules

- There are **NO SKUs**.
- There is **NO inventory quantity tracking**.
- Each physical item is identified ONLY by:
  - A photo taken at checkout time
  - The loan record referencing that photo

- Photos are immutable identifiers for loans.
- A loan cannot exist without a photo.

---

## 4. Subscription Tier Rules (Hard-Coded)

The backend MUST enforce these exact rules:

### Basic
- 1 item/month
- 0 swaps/month
- Max 1 item out at a time

### Plus
- 5 items/month
- 2 swaps/month
- Max 2 items out at a time

### Premium
- 10 items/month
- 5 swaps/month
- Max 4 items out at a time

- Monthly counters reset strictly on the Shopify billing cycle.
- Tier rules must be centralized and not duplicated across files.

---

## 5. Loan Rules

- A loan represents **one physical garment**.
- A loan has exactly one:
  - Member
  - Checkout timestamp
  - Photo
- A loan may have one return timestamp.

- A loan cannot be returned twice.
- A loan must belong to the member performing the action.
- Active loans = loans with `returnedAt = null`.

---

## 6. Swap Rules

- A swap is a **single atomic operation**:
  1. Return an existing active loan
  2. Create a new loan with a new photo

- Swap rules:
  - Consumes one swap allowance
  - Consumes one monthly item allowance
  - Net items-out count remains unchanged

- Swap must fail entirely if any step fails.

---

## 7. Counters & Cycles

- Counters include:
  - `itemsUsed`
  - `swapsUsed`
  - `itemsOut`

- Counters must be recalculated safely:
  - Reset automatically when a new billing cycle is detected
  - Never rely on POS-side state

- Counter updates MUST happen inside database transactions.

---

## 8. Idempotency Rules

- All loan mutations MUST require an `x-idempotency-key` header:
  - Checkout
  - Return
  - Swap

- Idempotency keys:
  - Prevent duplicate loans
  - Prevent double returns
  - Are required per POS action

- Uploads and webhooks are exempt.

---

## 9. Webhook Rules

- Subscription updates come ONLY from Shopify webhooks.
- Webhook payloads must be verified using HMAC.
- Raw request body MUST be preserved.
- Webhooks may be retried and must be safely idempotent.

---

## 10. Database Rules

- SQLite is allowed for development and testing.
- PostgreSQL will be used in production.
- Prisma must be used as the ORM.
- No database logic inside controllers.

---

## 11. Audit Logging

- Every mutation must write an audit event:
  - Checkout
  - Return
  - Swap
  - Subscription update

- Audit logs must be append-only.
- Audit metadata is stored as serialized JSON text.

---

## 12. Performance & Safety4

- Backend must assume:
  - POS devices can retry requests
  - Staff may double-tap buttons
  - Network may drop temporarily

- Backend must:
  - Be defensive
  - Fail safely
  - Never create duplicate loans

---

## 13. Forbidden Behavior

The backend MUST NOT:
- Track per-store inventory
- Track garment types or categories
- Store sensitive payment data
- Expose public unauthenticated endpoints
- Guess subscription status without Shopify confirmation

---

## 14. Design Intent

This system is intentionally:
- Simple
- Photo-based
- Time-based
- National (not store-specific)

Any change that increases staff friction, store complexity,
or SKU-like behavior is considered invalid.

