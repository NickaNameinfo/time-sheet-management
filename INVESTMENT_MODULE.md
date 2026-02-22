# Investment Module

Secure investment flow with KYC, predefined plans, checkout, and withdrawals—integrated with the existing My Self (challenge) user.

## Setup

### 1. Database

Run the migration on the **same database** as `challenge_users` (e.g. `signup`):

```bash
mysql -u YOUR_USER -p YOUR_DB < back-end/database/create_investment_tables.sql
```

Or execute the SQL file in your MySQL client. This creates:

- `investment_kyc` – KYC/profile verification (encrypted Aadhaar, PAN, bank account)
- `investment_plans` – Predefined plans (seeded: Below ₹5K, Plan A 15d, Plan B 30d)
- `investments` – User investments (ACTIVE → MATURED → WITHDRAWN)
- `withdrawals` – Withdrawal records
- `investment_notifications` – In-app notifications
- `investment_audit_log` – Audit trail for compliance

### 2. Backend

- **Routes:** All under `verifyChallengeUser` (challenge token).
- **Endpoints:** See `back-end/routes/investmentRoutes.js`.
- **Encryption:** Set `INV_ENCRYPTION_KEY` in `.env` (32-byte recommended) for Aadhaar/PAN/account encryption; otherwise a default key is used (not for production).
- **Jobs:** KYC auto-verification (24h) and daily maturity check run every hour via `back-end/jobs/investmentJobs.js`.

### 3. Mobile

- **Entry:** My Self dashboard → **Investment** card → Investment home.
- **Flow:** KYC gate → (if verified) Plans → Checkout → Payment success (stub) → Dashboard / Reports / Withdraw.
- **Screens:** `mobile-app/lib/screens/investment/` (home, KYC form, plans, checkout, dashboard, reports, withdraw, notifications).

## Flows

| Step | Behavior |
|------|----------|
| **Investment access** | If KYC not verified: show KYC form, “Verification Pending”. If verified: show plans and dashboard. |
| **KYC submit** | Saves PENDING_VERIFICATION; notification “verified within 24 hours”. After 24h job: status → VERIFIED, notification “You can now start investing.” |
| **Plans** | Category 1: ₹1,000–₹4,999, 0.5%, 30 days. Category 2: Plan A ₹5,000+, 1%, 15 days; Plan B ₹5,000+, 2%, 30 days. |
| **Checkout** | Validate amount → summary (interest %, lock-in, maturity, estimated return) → Proceed to Payment. |
| **Payment** | Stub: `POST /investment/payment/success` with `plan_id`, `amount`, `transaction_id`. Replace with real gateway callback when integrating. |
| **Interest** | If held ≥ lock-in days: return = principal + (principal × interest%). Else: principal only. |
| **Withdraw** | Preview: invested amount, days completed, eligible interest, total withdrawable. Confirm → status WITHDRAWN, payout workflow can be hooked here. |

## Status lifecycle

`PENDING_VERIFICATION` → `VERIFIED` → `ACTIVE` → `MATURED` or `WITHDRAWN`; plus `CANCELLED` if needed.

## Security & compliance

- Aadhaar, PAN, and account number stored encrypted; masked in API responses.
- Audit log: KYC submit/verify, investment created, withdrawal.
- Idempotent payment: same `transaction_id` returns existing investment.
- Rate limiting and withdrawal rules can be added via middleware.

## Combined dashboard

The **My Self** dashboard now includes:

- **Investment** card with quick summary (total invested, earnings, upcoming maturity) when present.
- Tapping the card opens the full Investment home (KYC gate, plans, dashboard, reports, withdraw, notifications).

## Payment gateway

Current implementation uses a **stub**: the app calls `POST /investment/payment/success` with a generated `transaction_id` after a simulated success. To go live:

1. Add an “initiate payment” endpoint that returns gateway URL/client token.
2. On gateway callback (success), call the same logic as `createInvestmentAfterPayment` with the gateway’s `transaction_id`.
3. Ensure idempotency and reconciliation for “payment success but DB failure” (retries, idempotency key, or background reconciliation).

## Edge cases covered

- Invest before verification → blocked (403).
- Early withdrawal → principal only; message “Interest not applicable. Withdraw principal only.”
- Duplicate payment → idempotent by `transaction_id`.
- Maturity → daily job sets ACTIVE → MATURED when `maturity_date <= today`.
