# SaaS Billing Data Models

Version: 1.0
Status: frozen

---

# 1. Purpose

This document defines table ownership, schemas, relationships, index strategy, and retention policy.
PostgreSQL is the single source of persistence. Cross-service database access is forbidden.

---

# 2. Entity Relationship

```
plans ──< subscriptions ──< usage_events
                       ├──< invoices ──< invoice_line_items
                       │            └──< payment_attempts
                       └──< audit_logs
```

---

# 3. Table Ownership

billing-api: plans, subscriptions, usage_events, invoices, invoice_line_items, payment_attempts, audit_logs

---

# 4. plans

Owner: billing-api

Schema:
```
field_name          Type          Required    Description
---                 ---           ---         ---
id                  UUID          Yes         Primary key
plan_code           VARCHAR(64)   Yes         Unique plan identifier code
display_name        VARCHAR(255)  Yes         Human-readable plan name
billing_interval    VARCHAR(16)   Yes         Billing period: monthly, yearly
base_recurring_price DECIMAL(10,2) Yes        Base price per billing interval
included_usage_qty  INTEGER       Yes         Included usage quantity before overage
overage_unit_price  DECIMAL(10,4) Yes         Price per unit of usage beyond included
is_active           BOOLEAN       Yes         Whether plan is available for new subscriptions
created_at          TIMESTAMP     Yes         Creation timestamp
updated_at          TIMESTAMP     Yes         Last update timestamp
```

Indexes:
- `plan_code` — unique: ensures no duplicate plan codes
- `is_active` — for filtering active plans

Retention: permanent

---

# 5. subscriptions

Owner: billing-api

Schema:
```
field_name              Type          Required    Description
---                     ---           ---         ---
id                      UUID          Yes         Primary key
customer_account_id     VARCHAR(128)  Yes         External customer account identifier
plan_id                 UUID          Yes         FK to plans.id
status                  VARCHAR(32)   Yes         Status: active, cancelled, past_due, reactivated
billing_cycle_anchor    DATE          Yes         Day of month billing cycle runs
payment_method_token    TEXT          No          Encrypted payment method token reference (AES-256-GCM)
created_at              TIMESTAMP     Yes         Creation timestamp
updated_at              TIMESTAMP     Yes         Last update timestamp
```

Indexes:
- `customer_account_id` — for account-level lookups
- `plan_id` — for plan-to-subscription joins
- `status` — for filtering active/past-due subscriptions
- `billing_cycle_anchor` — for billing cycle run queries

Retention: permanent

---

# 6. usage_events

Owner: billing-api

Schema:
```
field_name            Type          Required    Description
---                   ---           ---         ---
id                    UUID          Yes         Primary key
subscription_id       UUID          Yes         FK to subscriptions.id
usage_quantity        INTEGER       Yes         Recorded usage amount
period_start          DATE          Yes         Usage period start date
period_end            DATE          Yes         Usage period end date
source_reference      VARCHAR(255)  Yes         External reference for the usage event
created_at            TIMESTAMP     Yes         Creation timestamp
```

Indexes:
- `subscription_id` — for subscription-level aggregation
- `period_start, period_end` — compound: for period-based queries

Retention: permanent

---

# 7. invoices

Owner: billing-api

Schema:
```
field_name            Type          Required    Description
---                   ---           ---         ---
id                    UUID          Yes         Primary key
subscription_id       UUID          Yes         FK to subscriptions.id
status                VARCHAR(32)   Yes         Status: open, paid, past_due, uncollectible
recurring_amount      DECIMAL(10,2) Yes         Base recurring plan charge
overage_amount        DECIMAL(10,2) Yes         Overage charge (0 if no overage)
subtotal              DECIMAL(10,2) Yes         recurring_amount + overage_amount
tax_amount            DECIMAL(10,2) Yes         Tax amount (fixed percentage)
total_due             DECIMAL(10,2) Yes         subtotal + tax_amount
due_date              DATE          Yes         Date payment is due
billing_period_start  DATE          Yes         Invoice covers this period start
billing_period_end    DATE          Yes         Invoice covers this period end
payment_attempt_count INTEGER       Yes         Number of payment attempts made (default 0)
next_retry_date       DATE          No          Next scheduled dunning retry date
created_at            TIMESTAMP     Yes         Creation timestamp
updated_at            TIMESTAMP     Yes         Last update timestamp
```

Indexes:
- `subscription_id` — for subscription-level invoice lookups
- `status` — for filtering open/past-due invoices
- `due_date` — for billing cycle run queries
- `next_retry_date` — for dunning retry run queries
- `subscription_id, billing_period_start` — compound unique: prevents duplicate invoices per period

Retention: permanent

---

# 8. invoice_line_items

Owner: billing-api

Schema:
```
field_name            Type          Required    Description
---                   ---           ---         ---
id                    UUID          Yes         Primary key
invoice_id            UUID          Yes         FK to invoices.id
line_type             VARCHAR(32)   Yes         Type: recurring, overage, tax
description           VARCHAR(255)  Yes         Line item description
amount                DECIMAL(10,2) Yes         Line item amount
created_at            TIMESTAMP     Yes         Creation timestamp
```

Indexes:
- `invoice_id` — for invoice detail retrieval

Retention: permanent

---

# 9. payment_attempts

Owner: billing-api

Schema:
```
field_name              Type          Required    Description
---                     ---           ---         ---
id                      UUID          Yes         Primary key
invoice_id              UUID          Yes         FK to invoices.id
status                  VARCHAR(32)   Yes         Status: success, failed
amount                  DECIMAL(10,2) Yes         Amount attempted
currency                VARCHAR(3)    Yes         Currency code (single currency)
provider_reference      VARCHAR(255)  No          Northstar Pay reference ID
provider_response_code  VARCHAR(32)   No          Northstar Pay response code
is_manual_retry         BOOLEAN       Yes         Whether this was a manual retry by Account Admin
created_at              TIMESTAMP     Yes         Attempt timestamp
```

Indexes:
- `invoice_id` — for payment history per invoice
- `status` — for filtering failed attempts

Retention: permanent

---

# 10. audit_logs

Owner: billing-api

Schema:
```
field_name            Type          Required    Description
---                   ---           ---         ---
id                    UUID          Yes         Primary key
action                VARCHAR(64)   Yes         Action: plan.created, subscription.created, invoice.generated, payment.attempted, etc.
entity_type           VARCHAR(32)   Yes         Entity type: plan, subscription, usage_event, invoice, payment_attempt
entity_id             UUID          Yes         ID of the affected entity
actor_type            VARCHAR(32)   Yes         Actor: account_admin, billing_operator, system
actor_id              VARCHAR(128)  No          Actor identifier (if applicable)
details               JSONB         No          Additional context about the action
created_at            TIMESTAMP     Yes         Audit timestamp
```

Indexes:
- `entity_type, entity_id` — compound: for audit queries by entity
- `created_at` — for chronological queries

Retention: permanent
