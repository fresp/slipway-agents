# SaaS Billing Product Requirement Document (PRD)

Version: 1.0

Status: Draft

---

# Product Overview

SaaS Billing is a minimal billing backend for a single software product.

It lets an internal billing operator and authenticated account admins manage subscription plans, meter usage, generate invoices, collect payment through a single external payment provider, and retry failed payment collection through a simple dunning flow.

The system is intentionally small.

It runs as one service only: `billing-api`.

It integrates with exactly one external system only: `Northstar Pay`, a fictional synchronous payment provider used for payment authorization and capture.

The product does not include a separate worker, queue, broker, cache, analytics service, notification service, customer portal frontend, or any second internal service.

---

# Goals

1. Provide a simple subscription billing backend for one SaaS product.
2. Keep all billing logic inside a single service with a single relational data store.
3. Support recurring subscription plans and usage-based overage charges.
4. Generate invoices from subscriptions and recorded usage.
5. Collect payment through one synchronous payment provider integration.
6. Retry failed payment collection using a documented dunning flow without introducing extra infrastructure.

---

# Actors

1. **Account Admin**
   - Creates or updates the customer subscription.
   - Views the active plan, current usage, invoices, and payment status.
   - Updates the stored payment method token reference.
   - Triggers an immediate payment retry when an invoice is past due.

2. **Billing Operator**
   - Creates subscription plans.
   - Reviews usage records, invoices, payment attempts, and dunning state.
   - Starts the billing cycle run for due subscriptions.
   - Starts the dunning retry run for invoices eligible for another payment attempt.

3. **Northstar Pay**
   - Receives synchronous payment authorization and capture requests from `billing-api`.
   - Returns immediate success or failure responses for payment attempts.

---

# Functional Requirements

## FR-001 Plan catalog management

`billing-api` must let the Billing Operator create, activate, deactivate, and view subscription plans.

Each plan must define:
- plan code
- display name
- billing interval
- base recurring price
- included usage quantity
- overage unit price
- active status

## FR-002 Subscription lifecycle management

`billing-api` must let an Account Admin create, view, update, cancel, and reactivate a subscription for one customer account.

Each subscription must reference exactly one active plan and must store:
- customer account identifier
- plan code
- subscription status
- billing cycle anchor date
- stored payment method token reference

## FR-003 Usage metering

`billing-api` must let the Billing Operator record metered usage events for a subscription.

Each usage event must include:
- subscription identifier
- usage quantity
- usage period start
- usage period end
- source reference

`billing-api` must aggregate recorded usage for invoice calculation and expose current-period usage totals for an Account Admin and Billing Operator.

## FR-004 Invoice generation

`billing-api` must let the Billing Operator start an invoice generation run for subscriptions whose billing cycle date is due.

For each due subscription, `billing-api` must create one invoice containing:
- the recurring plan charge
- any overage charge derived from recorded usage beyond the included quantity
- subtotal
- tax amount when configured as a fixed percentage for the tenant
- total due
- invoice status
- due date

`billing-api` must prevent duplicate invoices for the same subscription and billing period.

## FR-005 Invoice retrieval

`billing-api` must let an Account Admin and Billing Operator view:
- invoice list
- invoice detail
- invoice line items
- invoice status
- payment attempt history

## FR-006 Payment provider charge attempt

When an invoice is open and due for collection, `billing-api` must synchronously call Northstar Pay to authorize and capture the invoice amount.

The payment request must include:
- invoice identifier
- customer account identifier
- stored payment method token reference
- amount
- currency

The payment response must immediately mark the invoice as either:
- `paid` when Northstar Pay returns success
- `past_due` when Northstar Pay returns failure

`billing-api` must store the payment attempt result and provider reference for every charge attempt.

## FR-007 Billing cycle collection run

After invoice generation in the same operator-initiated billing cycle run, `billing-api` must attempt payment collection synchronously for each newly generated invoice that has a stored payment method token reference.

The Billing Operator must be able to view the result of the billing cycle run, including:
- invoices created
- invoices paid
- invoices marked past due

## FR-008 Dunning and retry

`billing-api` must track a dunning state for every unpaid invoice.

When an invoice payment attempt fails, `billing-api` must:
- increment the payment attempt count
- mark the invoice `past_due`
- assign the next retry date based on a fixed retry schedule

The retry schedule is:
- retry 1: 3 days after the failed attempt
- retry 2: 7 days after the failed attempt
- retry 3: 14 days after the failed attempt

`billing-api` must let the Billing Operator start a dunning retry run that finds invoices whose next retry date is due and attempts payment again synchronously through Northstar Pay.

If the final retry fails, `billing-api` must mark the invoice `uncollectible`.

`billing-api` must also let an Account Admin trigger an immediate manual retry for one specific past-due invoice.

## FR-009 Payment method token update

`billing-api` must let an Account Admin replace the stored payment method token reference for an active subscription.

The system stores only the provider token reference and never raw card data.

## FR-010 Billing audit trail

`billing-api` must record an audit trail for these actions:
- plan created or updated
- subscription created, updated, cancelled, or reactivated
- usage event recorded
- invoice generated
- payment attempted
- payment retried
- payment method token reference updated

---

# Non-Functional Requirements

1. The system must remain a single deployable backend service.
2. All externally visible billing operations must use REST endpoints.
3. Payment collection must use synchronous request/response calls only.
4. The system must persist billing state durably in one primary relational database.
5. The system must never require a queue, broker, cache, or background worker for the initial release.
6. Sensitive payment references must be encrypted at rest.
7. Raw card numbers, CVV values, and bank account credentials must never be stored.
8. Audit records must be queryable by invoice ID and subscription ID.
9. Operator-triggered billing and dunning runs must be idempotent for the same target period or invoice eligibility set.
10. Logs must use structured fields and must exclude sensitive payment token values.

---

# Constraints

1. The service name is `billing-api`.
2. There is exactly one internal service in scope.
3. There is exactly one external dependency in scope: `Northstar Pay`.
4. `Northstar Pay` is called synchronously only.
5. No queue, broker, cache, worker, event bus, or cron-specific sidecar may be introduced.
6. No customer-facing frontend, dashboard, portal, or design deliverable is part of this example.
7. No email sending, notification delivery, tax engine integration, ERP sync, or accounting export is part of this example.
8. The first release supports one currency only.
9. The first release supports one SaaS product only.

---

# Out of Scope

1. Multi-product billing.
2. Multi-currency pricing.
3. Proration for mid-cycle plan changes.
4. Coupons, credits, and promotional discounts.
5. Refund processing.
6. Chargebacks and dispute workflows.
7. Revenue recognition.
8. Email delivery, SMS delivery, or customer notifications.
9. Customer self-service UI or admin dashboard UI.
10. Separate metering pipeline, analytics pipeline, or data warehouse export.
11. Multiple payment providers.
12. Any queue, broker, cache, worker, or second internal service.

---

# Success Criteria

1. A Billing Operator can create subscription plans and manage customer subscriptions.
2. Usage can be recorded and is reflected in invoice totals.
3. A Billing Operator can start a billing cycle run that generates invoices for due subscriptions.
4. `billing-api` can synchronously charge an invoice through Northstar Pay and persist the payment result.
5. Failed payment attempts create a past-due invoice state with the correct next retry date.
6. A Billing Operator can start a dunning retry run and collect or close eligible invoices without duplicate charges.
7. An Account Admin can review invoices and trigger a manual retry for one past-due invoice.
8. The generated engineering docs describe a single-service system and naturally omit topology doc `09` because no extra topology is required.
