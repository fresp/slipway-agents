# SaaS Billing API Specifications

Version: 1.0
Status: frozen

---

# 1. Purpose

This document defines API ownership and contracts.

This document is not an OpenAPI specification.

---

# 2. API Domains

Billing:
- `billing-api`

---

# 3. Authentication

## Token-Based Authentication

Used by: Account Admin, Billing Operator
Header: `Authorization: Bearer <token>`
Issued by: `billing-api`
Validated by: `billing-api` on every request

---

# 4. billing-api API

Base path: `/api/v1`
Owner: billing-api

## Plans

### POST /api/v1/plans

Purpose: Create a new subscription plan (Billing Operator only)
Auth required: Yes (Billing Operator)
Request body:
```
field              Type          Required    Description
---                ---           ---         ---
plan_code          string        Yes         Unique plan identifier
display_name       string        Yes         Human-readable name
billing_interval   string        Yes         "monthly" or "yearly"
base_recurring_price number      Yes         Base price per interval
included_usage_qty number        Yes         Included usage before overage
overage_unit_price number        Yes         Per-unit overage price
```
Response:
```
field              Type          Description
---                ---           ---
id                 string        Plan UUID
plan_code          string        Plan code
display_name       string        Display name
billing_interval   string        Billing interval
base_recurring_price number      Base price
included_usage_qty number        Included usage
overage_unit_price number        Overage price
is_active          boolean       Active status
created_at         string        ISO 8601 timestamp
```
Errors: 400 — invalid input; 409 — duplicate plan_code; 401 — unauthorized

### GET /api/v1/plans

Purpose: List all active plans
Auth required: Yes (Account Admin, Billing Operator)
Response:
```
field    Type    Description
---      ---     ---
plans    array   List of plan objects
```
Errors: 401 — unauthorized

### GET /api/v1/plans/:planId

Purpose: Get plan details
Auth required: Yes (Account Admin, Billing Operator)
Response: plan object
Errors: 401 — unauthorized; 404 — plan not found

### PATCH /api/v1/plans/:planId

Purpose: Update plan details or activate/deactivate (Billing Operator only)
Auth required: Yes (Billing Operator)
Request body:
```
field              Type          Required    Description
---                ---           ---         ---
display_name       string        No          Updated name
is_active          boolean       No          Active status
```
Response: updated plan object
Errors: 400 — invalid input; 401 — unauthorized; 404 — plan not found

## Subscriptions

### POST /api/v1/subscriptions

Purpose: Create a subscription for a customer account (Account Admin)
Auth required: Yes (Account Admin)
Request body:
```
field                  Type      Required    Description
---                    ---       ---         ---
customer_account_id    string    Yes         Customer account identifier
plan_id                string    Yes         Active plan UUID
billing_cycle_anchor   string    Yes         ISO 8601 date (day of month)
payment_method_token   string    Yes         Payment method token reference
```
Response:
```
field                  Type      Description
---                    ---       ---
id                     string    Subscription UUID
customer_account_id    string    Customer account
plan_id                string    Plan UUID
status                 string    "active"
billing_cycle_anchor   string    Anchor date
payment_method_token   string    Encrypted reference (not plaintext)
created_at             string    ISO 8601 timestamp
```
Errors: 400 — invalid input; 401 — unauthorized; 404 — plan not found or inactive

### GET /api/v1/subscriptions/:subscriptionId

Purpose: Get subscription details
Auth required: Yes (Account Admin — own account; Billing Operator — any)
Response: subscription object
Errors: 401 — unauthorized; 403 — forbidden; 404 — not found

### PATCH /api/v1/subscriptions/:subscriptionId

Purpose: Update subscription (e.g., change plan, update anchor)
Auth required: Yes (Account Admin — own account)
Request body:
```
field              Type      Required    Description
---                ---       ---         ---
plan_id            string    No          New active plan UUID
```
Response: updated subscription object
Errors: 400 — invalid input; 401 — unauthorized; 403 — forbidden; 404 — not found

### POST /api/v1/subscriptions/:subscriptionId/cancel

Purpose: Cancel a subscription
Auth required: Yes (Account Admin — own account)
Response: subscription object with status "cancelled"
Errors: 401 — unauthorized; 403 — forbidden; 404 — not found; 409 — already cancelled

### POST /api/v1/subscriptions/:subscriptionId/reactivate

Purpose: Reactivate a cancelled subscription
Auth required: Yes (Account Admin — own account)
Response: subscription object with status "active"
Errors: 401 — unauthorized; 403 — forbidden; 404 — not found; 409 — not cancelled

### PUT /api/v1/subscriptions/:subscriptionId/payment-method

Purpose: Replace the stored payment method token reference
Auth required: Yes (Account Admin — own account)
Request body:
```
field                  Type      Required    Description
---                    ---       ---         ---
payment_method_token   string    Yes         New payment method token reference
```
Response: subscription object with updated token
Errors: 400 — invalid input; 401 — unauthorized; 403 — forbidden; 404 — not found

## Usage

### POST /api/v1/subscriptions/:subscriptionId/usage

Purpose: Record a metered usage event (Billing Operator only)
Auth required: Yes (Billing Operator)
Request body:
```
field            Type      Required    Description
---              ---       ---         ---
usage_quantity   number    Yes         Usage amount
period_start     string    Yes         ISO 8601 date
period_end       string    Yes         ISO 8601 date
source_reference string    Yes         External reference
```
Response:
```
field            Type      Description
---              ---       ---
id               string    Usage event UUID
subscription_id  string    Subscription UUID
usage_quantity   number    Recorded quantity
period_start     string    Period start
period_end       string    Period end
source_reference string    Source reference
created_at       string    ISO 8601 timestamp
```
Errors: 400 — invalid input; 401 — unauthorized; 404 — subscription not found

### GET /api/v1/subscriptions/:subscriptionId/usage

Purpose: View current-period usage totals
Auth required: Yes (Account Admin — own account; Billing Operator)
Response:
```
field              Type      Description
---                ---       ---
subscription_id    string    Subscription UUID
period_start       string    Current period start
period_end         string    Current period end
total_usage        number    Aggregated usage quantity
events             array     List of usage event objects
```
Errors: 401 — unauthorized; 403 — forbidden; 404 — not found

## Invoices

### POST /api/v1/billing-cycle/run

Purpose: Start billing cycle run — generate invoices for due subscriptions and attempt payment (Billing Operator only)
Auth required: Yes (Billing Operator)
Request body:
```
field         Type      Required    Description
---           ---       ---         ---
run_date      string    Yes         ISO 8601 date — billing cycle date to process
```
Response:
```
field               Type      Description
---                 ---       ---
invoices_created    number    Count of invoices generated
invoices_paid       number    Count of invoices paid on first attempt
invoices_past_due   number    Count of invoices that failed payment
details             array     Per-invoice result summary
```
Errors: 400 — invalid input; 401 — unauthorized; 409 — duplicate run for date

### GET /api/v1/invoices

Purpose: List invoices (filtered by subscription or account)
Auth required: Yes (Account Admin — own account; Billing Operator — all)
Query params: `subscription_id`, `status`, `limit`, `offset`
Response:
```
field    Type    Description
---      ---     ---
invoices array   List of invoice summary objects
total    number  Total count
```
Errors: 401 — unauthorized; 403 — forbidden

### GET /api/v1/invoices/:invoiceId

Purpose: Get invoice detail with line items and payment attempts
Auth required: Yes (Account Admin — own account; Billing Operator)
Response:
```
field             Type      Description
---               ---       ---
id                string    Invoice UUID
subscription_id   string    Subscription UUID
status            string    Invoice status
recurring_amount  number    Recurring charge
overage_amount    number    Overage charge
subtotal          number    Subtotal
tax_amount        number    Tax
total_due         number    Total due
due_date          string    Due date
line_items        array     Invoice line items
payment_attempts  array     Payment attempt history
created_at        string    ISO 8601 timestamp
```
Errors: 401 — unauthorized; 403 — forbidden; 404 — not found

## Dunning

### POST /api/v1/dunning/run

Purpose: Start dunning retry run — attempt payment for invoices whose next retry date is due (Billing Operator only)
Auth required: Yes (Billing Operator)
Response:
```
field               Type      Description
---                 ---       ---
invoices_retried    number    Count of invoices retried
invoices_paid       number    Count of invoices that succeeded
invoices_uncollectible number Count of invoices marked uncollectible after final retry
details             array     Per-invoice retry result
```
Errors: 401 — unauthorized

### POST /api/v1/invoices/:invoiceId/retry

Purpose: Trigger immediate manual payment retry for a past-due invoice (Account Admin)
Auth required: Yes (Account Admin — own account)
Response: payment attempt result object
Errors: 401 — unauthorized; 403 — forbidden; 404 — not found; 409 — invoice not past due

---

# 5. Northstar Pay Integration

Northstar Pay is an external synchronous payment provider. `billing-api` calls it for payment authorization and capture.

Request (outbound from billing-api):
```
field                  Type      Description
---                    ---       ---
invoice_id             string    Invoice identifier
customer_account_id    string    Customer account identifier
payment_method_token   string    Stored token reference (decrypted at call time)
amount                 number    Invoice total due
currency               string    Currency code
```

Response (from Northstar Pay):
```
field              Type      Description
---                ---       ---
status             string    "success" or "failure"
provider_reference string    Northstar Pay transaction reference
response_code      string    Response or error code
```

Error handling: On failure, `billing-api` marks the invoice `past_due`, increments the payment attempt count, and schedules the next retry per the dunning schedule.
