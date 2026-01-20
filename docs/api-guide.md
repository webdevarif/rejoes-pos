# ReJoEs Backend API Guide

This document summarizes all available backend endpoints and provides guidance on how to integrate with them. The backend is designed for Shopify POS staff workflows—there is no public client.

## Table of Contents
1. [Member APIs](#member-apis)
2. [Loan APIs](#loan-apis)
3. [Upload API](#upload-api)
4. [Shopify Webhook](#shopify-webhook)
5. [Implementation & Integration Notes](#implementation--integration-notes)

---

## Member APIs
### `GET /api/members/by-card/:cardToken`
Looks up a member by barcode (card token).

**Response:**
```json
{
  "member": {
    "id": "string",
    "shopifyCustomerId": "string",
    "cardToken": "string",
    "tier": "basic | plus | premium",
    "status": "active | paused | cancelled",
    "cycleStart": "ISO date",
    "cycleEnd": "ISO date",
    "itemsUsed": 0,
    "swapsUsed": 0,
    "itemsOut": 0,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  },
  "allowances": {
    "itemsPerMonth": number,
    "swaps": number,
    "maxItemsOut": number
  },
  "activeLoans": [
    {
      "id": "string",
      "thumbnailUrl": "string"
    }
  ]
}
```

**Usage guidance:**
- Always call this endpoint before checkout/return/swap to display current allowances and ensure counters are in sync.
- If you cache the response, invalidate it after any loan mutation to avoid stale allowance data.

---

## Loan APIs
All POST loan endpoints require the `x-idempotency-key` header. Generate a unique key per POS action to prevent duplicate charges.

### `POST /api/loans/checkout`
Creates a new loan (checkout). The photo must already be uploaded and referenced via `uploadId`.

**Body:**
```json
{
  "memberId": "string",
  "storeLocation": "string",
  "uploadId": "uuid"
}
```

**Response:** Newly created loan record.

**Rules enforced:**
- Subscription must be active.
- Monthly allowance and max items out must not be exceeded.
- Counters auto-reset when a billing cycle boundary is detected.

### `POST /api/loans/return`
Marks an existing loan as returned.

**Body:**
```json
{   
  "memberId": "string",
  "loanId": "string"
}
```

**Response:** Updated loan.

**Notes:**
- Fails if the loan does not belong to the member or is already returned.
- Decrements `itemsOut` counter.

### `POST /api/loans/swap`
Performs a swap (return + new checkout counted as a swap).

**Body:**
```json
{
  "memberId": "string",
  "loanId": "string",
  "storeLocation": "string",
  "uploadId": "uuid"
}
```

**Response:**
```json
{
  "returnedLoan": { ... },
  "newLoan": { ... }
}
```

**Rules enforced:**
- Swap allowance must be available.
- Member must have at least one item out (at least one active loan).
- Items/month cap still applies (swap increments both `swapsUsed` and `itemsUsed`, while keeping `itemsOut` net-neutral).

### `GET /api/loans/active/:memberId`
Returns all active (not returned) loans for a member with most recent checkout first.

**Response:** Array of loan objects.

---

## Upload API
### `POST /api/uploads/loan-photo`
Accepts a multipart form upload with field `photo`. Stores original + thumbnail images locally using Sharp.

**Response:**
```json
{
  "uploadId": "uuid",
  "photoUrl": "/uploads/originals/...jpg",
  "thumbnailUrl": "/uploads/thumbnails/...jpg"
}
```

**Usage guidance:**
1. Staff captures garment photo on POS device.
2. Upload photo via this endpoint.
3. Pass the returned `uploadId` when calling loan checkout or swap; the backend dereferences it to persist the URLs.

---

## Shopify Webhook
### `POST /api/webhooks/subscription`
Consumes Shopify subscription webhook events. The middleware verifies the `x-shopify-hmac-sha256` header with `SHOPIFY_WEBHOOK_SECRET`.

**Payload format:**
- The endpoint expects the native Shopify subscription payload (no custom `type` wrapper). The handler maps Shopify’s fields (plan handle, contract status, etc.) into `tier`, `status`, `cycleStart`, and `cycleEnd`.

**Effect:**
- Upserts the member record (creating it if new).
- Updates tier, status, cycle dates, and card token.
- Logs an audit event per webhook.

**Implementation tips:**
- Expose this endpoint publicly only to Shopify’s IP space.
- Ensure the raw request body is preserved (already handled in `app.ts`).
- Rotate the webhook secret via environment config when necessary.

---

## Implementation & Integration Notes
1. **Idempotency:**
   - Loan mutations (checkout, return, swap) are idempotent via the `x-idempotency-key` header. Clients must provide a UUID per POS action.
   - Uploads and webhooks intentionally skip idempotency enforcement (uploads can legitimately repeat; webhooks rely on Shopify replay logic).

2. **Transactions:**
   - Loan mutations run in Prisma transactions to guarantee counters and audit events stay consistent.

3. **Audit Logging:**
   - Every loan/subscription action writes an `AuditEvent` with serialized metadata (stored as text for SQLite compatibility). Metadata captures identifiers such as loan IDs and Shopify contract IDs.

4. **Counters & Cycles:**
   - `resetCountersIfNewCycle` runs on every mutation to avoid stale counters.
   - Tiers and statuses are normalized to uppercase for consistency.

5. **Image Storage:**
   - Files are saved locally under `/uploads/originals` and `/uploads/thumbnails`.
   - In production, mount persistent storage or replace with cloud storage before scaling.

6. **Database:**
   - The system uses SQLite exclusively (`DATABASE_URL="file:./dev.db"`). All environments—local, Docker, and tests—point to SQLite files for predictable behavior.

7. **Environment Variables:**
   - `PORT`, `NODE_ENV`, `DATABASE_URL`, `SHOPIFY_WEBHOOK_SECRET`.
   - Docker compose mounts the SQLite database file for persistence.

8. **Running Locally:**
   ```bash
   npm install
   npx prisma migrate dev
   npm run dev
   ```

9. **Testing Workflow:**
   - Run `npm test` to execute the Vitest-powered API suite (uses `file:./test/test.db`).
   - Use Postman/curl for manual smoke tests and Prisma Studio (`npx prisma studio`) for spot-checking data.

---

## Security & Access
- The API surface is intended solely for Shopify POS devices (staff network) and Shopify webhooks. Do not expose it publicly without an authenticated gateway.

---

Feel free to extend this guide with additional operational procedures or troubleshooting notes as the system evolves.
