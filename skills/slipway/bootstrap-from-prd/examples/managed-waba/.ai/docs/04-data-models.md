# Managed WABA Platform Data Models

Version: 1.3

Status: Frozen

---

# 1. Purpose

This document defines MongoDB collection ownership, schemas, relationships, index strategy, and retention policy.
MongoDB is the single source of persistence. Cross-service database access is forbidden.

---

# 2. Entity Relationship

User → WABA → Phone Number
Phone Number ├── Credential, Access Token, Webhook Config, Audit Log
Runtime Phone Number ├── Messages, Message Status Logs, Webhook Events, Webhook Deliveries

---

# 3. Collection Ownership

platform-api: users, sessions, wabas, phone_numbers, credentials, access_tokens, webhook_configs, audit_logs
meta-api: messages, message_status_logs, webhook_events, webhook_deliveries

---

# 4. users
Purpose: Portal authentication.
Schema: `_id, email, password_hash, mfa_enabled, created_at, updated_at`
Indexes: `email (unique)`
Retention: Permanent

---

# 5. sessions
Purpose: Portal sessions.
Schema: `_id, user_id, refresh_token_hash, ip_address, user_agent, expired_at, created_at`
Indexes: `user_id, expired_at (ttl)`
Retention: Auto delete

---

# 6. wabas
Purpose: Connected WABAs.
Schema: `_id, user_id, waba_id, business_id, name, status (connected/disconnected), synced_at, created_at, updated_at`
Indexes: `waba_id (unique), business_id`
Retention: Permanent

---

# 7. phone_numbers
Purpose: WABA phone numbers.
Schema: `_id, waba_id, phone_number_id, display_phone_number, verified_name, quality_rating, messaging_limit, status, synced_at, created_at, updated_at`
Indexes: `phone_number_id (unique), waba_id`
Retention: Permanent

---

# 8. credentials
Purpose: Store encrypted Meta credentials.
Schema: `_id, phone_number_id, cipher_text, iv, auth_tag, kms_key_id, token_expired_at, created_at, updated_at`
Indexes: `phone_number_id (unique)`
Retention: Permanent

---

# 9. access_tokens
Purpose: Authenticate clients accessing meta-api.
Schema: `_id, phone_number_id, token_prefix, token_hash, enabled, created_at, updated_at`
Rules: No automatic expiration, Manual regeneration/disable only, Never store raw token.
Indexes: `phone_number_id (unique), token_hash (unique)`
Retention: Permanent

---

# 10. webhook_configs
Purpose: Webhook configuration.
Schema: `_id, phone_number_id, url, secret, enabled, created_at, updated_at`
Indexes: `phone_number_id (unique)`
Retention: Permanent

---

# 11. messages
Purpose: Store outbound metadata only.
Schema: `_id, phone_number_id, wamid, category, created_at`
Indexes: `wamid (unique), phone_number_id, created_at`
Retention: 180 days

---

# 12. message_status_logs
Purpose: Store message lifecycle events.
Schema: `_id, message_id, status, error_code, error_message, timestamp`
Indexes: `message_id, timestamp`
Retention: 180 days

---

# 13. webhook_events
Purpose: Store raw Meta webhook payloads.
Schema: `_id, phone_number_id, payload, received_at`
Indexes: `phone_number_id, received_at`
Retention: 30 days

---

# 14. webhook_deliveries
Purpose: Track webhook forwarding.
Schema: `_id, webhook_event_id, attempt, status, response_code, response_time, delivered_at`
Indexes: `webhook_event_id, status`
Retention: 90 days

---

# 15. audit_logs
Purpose: Track operational activities.
Schema: `_id, actor, action, resource, metadata, created_at`
Indexes: `actor, resource, created_at`
Retention: 365 days

---

# 16. Persistence Rules
Never persist: Message body, Contacts, Media binaries, Interactive payloads, Attachments, Locations.
Persist metadata only.