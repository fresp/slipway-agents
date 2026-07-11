# SaaS Billing Operational Flows

Version: 1.0
Status: frozen

---

# 1. Purpose

This document defines operational contracts.

It describes:
- Triggers
- Ownership
- Outcomes
- Runtime constraints

No standalone topology diagram is generated for this project because the manifest omits `09-topology-and-architecture-diagrams.md` for this single-service scope.

---

# 2. Billing Cycle Run

Purpose: Generate invoices for due subscriptions and attempt payment collection in a single operator-initiated run.
Owner: billing-api
Trigger: Billing Operator calls POST /api/v1/billing-cycle/run with a run_date.
Outcome:
- One invoice generated per due subscription for the specified billing period.
- Payment attempted synchronously for each invoice with a stored payment method token.
- Run summary returned: invoices created, paid, and marked past_due.

Steps:
1. Billing Operator submits billing cycle run request with run_date.
2. billing-api queries subscriptions whose billing_cycle_anchor matches run_date and status is active.
3. billing-api checks idempotency — if invoices already exist for these subscriptions and billing period, skip them.
4. For each due subscription, billing-api generates one invoice: calculates recurring charge, aggregates usage for the period, computes overage, applies fixed-percentage tax, creates invoice and line items.
5. For each newly generated invoice with a stored payment method token, billing-api calls Northstar Pay synchronously to authorize and capture the total_due amount.
6. On Northstar Pay success: billing-api marks invoice `paid`, records payment_attempt with status `success`.
7. On Northstar Pay failure: billing-api marks invoice `past_due`, increments payment_attempt_count, calculates next_retry_date per dunning schedule, records payment_attempt with status `failed`.
8. billing-api records audit trail entries for: each invoice generated, each payment attempted.
9. billing-api returns run summary to Billing Operator.

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | Billing Operator | billing-api | sync-http | POST /api/v1/billing-cycle/run | Return 4xx/5xx with error details |
| 5 | billing-api | Northstar Pay | external-api | POST /charge (Northstar Pay API) | On timeout or error: mark invoice past_due, schedule retry, record failed attempt — no automatic retry within this run |

Constraints:
- Idempotent per run_date — no duplicate invoices for same subscription and billing period.
- Only active subscriptions with a billing_cycle_anchor matching run_date are processed.
- Invoices without a stored payment method token are generated but not submitted for payment.
- No background processing — entire run executes within the HTTP request lifecycle.

---

# 3. Dunning Retry Run

Purpose: Attempt payment collection for past-due invoices whose next retry date has arrived.
Owner: billing-api
Trigger: Billing Operator calls POST /api/v1/dunning/run.
Outcome:
- Eligible past-due invoices are retried through Northstar Pay.
- Successful retries mark invoice `paid`.
- Failed retries update next_retry_date or mark invoice `uncollectible` if final retry exhausted.

Steps:
1. Billing Operator submits dunning retry run request.
2. billing-api queries invoices where status = `past_due` AND next_retry_date <= today AND payment_attempt_count < 3.
3. For each eligible invoice, billing-api calls Northstar Pay synchronously with the stored payment method token and invoice total_due.
4. On success: billing-api marks invoice `paid`, records payment_attempt with status `success`.
5. On failure: billing-api increments payment_attempt_count, calculates new next_retry_date per schedule (3 days, 7 days, 14 days), records payment_attempt with status `failed`. If payment_attempt_count reaches 3, marks invoice `uncollectible`.
6. billing-api records audit trail entries for each payment retry.
7. billing-api returns run summary: retried, paid, uncollectible counts.

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | Billing Operator | billing-api | sync-http | POST /api/v1/dunning/run | Return 4xx/5xx with error details |
| 3 | billing-api | Northstar Pay | external-api | POST /charge (Northstar Pay API) | On timeout or error: record failed attempt, update next_retry_date or mark uncollectible |

Constraints:
- Only invoices with payment_attempt_count < 3 are eligible for automatic retry.
- The dunning schedule is fixed: 3 days, 7 days, 14 days after the last failed attempt.
- Manual retries by Account Admin (POST /api/v1/invoices/:id/retry) bypass the schedule but still count toward the attempt limit.
- Idempotent — running dunning twice on the same day does not create duplicate attempts for the same invoice.

---

# 4. Subscription Lifecycle

Purpose: Create, update, cancel, and reactivate subscriptions for customer accounts.
Owner: billing-api
Trigger: Account Admin calls subscription endpoints.
Outcome:
- Subscription created with active status, or status transitioned (cancelled, reactivated).
- Audit trail entries recorded for every state change.

Steps:
1. Account Admin submits subscription create/update/cancel/reactivate request.
2. billing-api validates the request: plan exists and is active (for create/update), subscription exists and status permits the operation.
3. billing-api executes the state change: creates subscription record, updates plan reference, or transitions status.
4. billing-api records audit trail entry.
5. billing-api returns the subscription object with updated status.

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | Account Admin | billing-api | sync-http | POST/PATCH/POST /api/v1/subscriptions/* | Return 4xx with validation error |

Constraints:
- Only one active subscription per customer account at a time.
- Cancel is idempotent — cancelling an already-cancelled subscription returns 409.
- Reactivate only applies to cancelled subscriptions — reactivating an active subscription returns 409.
- Plan change (update) is effective from the next billing cycle — no proration.

---

# 5. Usage Metering

Purpose: Record and aggregate metered usage events for subscription overage calculation.
Owner: billing-api
Trigger: Billing Operator calls POST /api/v1/subscriptions/:id/usage.
Outcome:
- Usage event persisted.
- Current-period usage totals available for Account Admin and Billing Operator.

Steps:
1. Billing Operator submits usage event with subscription_id, quantity, period, source_reference.
2. billing-api validates subscription exists and is active.
3. billing-api persists the usage event.
4. billing-api records audit trail entry.
5. billing-api returns the created usage event.

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | Billing Operator | billing-api | sync-http | POST /api/v1/subscriptions/:id/usage | Return 4xx with validation error |

Constraints:
- Usage events are immutable once recorded — no updates or deletions.
- Usage aggregation for invoice calculation happens at invoice generation time, not at recording time.

---

# 6. Invoice Retrieval

Purpose: Allow Account Admin and Billing Operator to view invoices, line items, and payment attempt history.
Owner: billing-api
Trigger: Account Admin or Billing Operator calls invoice GET endpoints.
Outcome:
- Invoice list or detail returned with associated data.

Steps:
1. Actor submits invoice list or detail request.
2. billing-api validates authorization: Account Admin can view own account's invoices; Billing Operator can view all.
3. billing-api queries invoices with optional filters (subscription_id, status).
4. For detail requests, billing-api includes line items and payment attempts.
5. billing-api returns the response.

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | Account Admin / Billing Operator | billing-api | sync-http | GET /api/v1/invoices, GET /api/v1/invoices/:id | Return 4xx/5xx with error details |

Constraints:
- Account Admin sees only invoices for their own customer_account_id.
- Billing Operator sees all invoices.
- No caching — all reads hit the database directly.

---

# 7. Payment Method Token Update

Purpose: Allow Account Admin to replace the stored payment method token reference for an active subscription.
Owner: billing-api
Trigger: Account Admin calls PUT /api/v1/subscriptions/:id/payment-method.
Outcome:
- Old token reference replaced with new one (encrypted at rest).
- Audit trail entry recorded.

Steps:
1. Account Admin submits new payment_method_token for a subscription.
2. billing-api validates subscription exists and Account Admin owns it.
3. billing-api encrypts the new token reference using AES-256-GCM and updates the subscription record.
4. billing-api records audit trail entry.
5. billing-api returns the updated subscription (token reference is not returned in plaintext).

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | Account Admin | billing-api | sync-http | PUT /api/v1/subscriptions/:id/payment-method | Return 4xx with validation error |

Constraints:
- Only the owning Account Admin can update the payment method.
- The old token is overwritten — no history of previous tokens is maintained.
- The raw token value is never logged or stored in plaintext.
