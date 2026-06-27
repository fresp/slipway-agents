# 11-portal-dashboard-prd.md

# Managed WABA Platform - Portal Dashboard PRD

Version: 1.0
Status: Frozen

---

# 1. Overview

Portal Dashboard adalah *Client-Facing Application* (Frontend) yang bertindak sebagai antarmuka operasional bagi pengguna (client) untuk mengelola integrasi WhatsApp Business API (WABA) mereka. 

Aplikasi ini dibangun murni sebagai lapisan UI yang tidak menyimpan *business state*. Seluruh operasi data dan autentikasi berkomunikasi langsung melalui `platform-api`.

---

# 2. UI/UX Principles

## Principle 1: Operational Layer
Portal ini dirancang untuk fungsi operasional, bukan analitik mendalam atau CRM. Desain harus utilitarian, bersih, dan meminimalkan jumlah klik untuk mencapai tujuan (mengambil API key, mengatur webhook).

## Principle 2: Client POV Limitation
Client hanya melihat data yang menjadi hak milik (WABA dan Phone Numbers yang terkoneksi). Klien **tidak** memiliki akses ke tagihan (billing) atau modul top-up melalui portal ini. Seluruh manajemen finansial terisolasi di Meta (FBM).

## Principle 3: Stateless Frontend
Portal tidak melakukan proses komputasi bisnis. Validasi format diperbolehkan, namun validasi *logic* bergantung penuh pada respons `platform-api`.

---

# 3. Frontend Architecture Constraint

Tech Stack: `React` + `Vite`
Styling: TailwindCSS
State Management: Context API / Zustand (hindari Redux yang *over-engineered* untuk kebutuhan sederhana ini).

Communication:
Portal -> HTTPS (REST) -> `platform-api`

---

# 4. Portal Modules & Pages Spec

Sistem navigasi utama terdiri dari 4 modul mandiri:

1. Overview
2. WABA Management
3. Security
4. Settings

---

## 4.1 Overview Module (Dashboard)

Halaman pertama setelah user berhasil login. Memberikan visibilitas metrik operasional tingkat tinggi.

**Metrik Utama yang Ditampilkan:**
* **Total WABA & Phone Numbers:** Agregasi jumlah entitas yang terkoneksi dan aktif.
* **Message Count (Outbound):** Akumulasi pesan keluar yang dikirim via `meta-api` (diambil secara agregat dari `platform-api`).
* **Webhook Delivery Success Rate:** Persentase keberhasilan pengiriman event dari `webhook-worker` ke endpoint klien (contoh: 99.8% Success).
* **Recent Audit Activity:** Tabel mini (5 baris terakhir) dari `audit_logs` untuk memberikan *sense of security* atas aktivitas terbaru di akun klien.

---

## 4.2 WABA Management Module

Pusat kendali untuk integrasi Meta. Terdiri dari beberapa *sub-view*:

### A. WABA List
* Tombol **"Connect Meta Business"** untuk men-trigger Meta Embedded Signup (membuka Meta SDK Popup).
* Tabel daftar WABA yang berhasil disinkronisasi.
* Tombol aksi: "Disconnect" (Soft delete).

### B. Phone Numbers & API Keys View
Ketika WABA diklik, portal menampilkan daftar nomor telepon di dalamnya.
* Menampilkan: `verified_name`, `quality_rating`, dan `messaging_limit`.
* **API Key Management:**
  * Tombol "Generate API Key" (Hanya muncul jika belum ada).
  * Modal pop-up menampilkan API Key *plain-text* **hanya 1 kali**. UI wajib menampilkan peringatan untuk menyalin token.
  * Tombol "Regenerate" (Membatalkan token lama).
  * Tombol "Disable".

### C. Webhook Configuration View
Modal/Form per nomor telepon untuk routing event.
* Input: Webhook URL.
* Input: Webhook Secret (untuk HMAC signing).
* Toggle: Enable / Disable Webhook.

---

## 4.3 Security Module

Pusat visibilitas dan kendali akses pengguna klien. Dirancang untuk standar *engineering* keamanan tinggi.

**Halaman Security memuat:**
* **Audit Logs:** Tabel lengkap yang menampilkan `actor`, `action` (misal: *API Key Regenerated, Webhook Updated*), `resource`, dan `timestamp`. Dilengkapi paginasi dasar.
* **Active Sessions:** Daftar sesi login aktif berbasis tabel `sessions`. Menampilkan `ip_address`, `user_agent`, dan `created_at`. Dilengkapi tombol "Revoke" untuk menendang sesi lain.
* **Change Password:** Form standar (Old Password, New Password, Confirm).
* **MFA / 2FA Configuration:** Form untuk setup Time-based One-Time Password (TOTP). Menampilkan QR Code saat setup, dan input token untuk verifikasi.

---

## 4.4 Settings Module

Konfigurasi statis level *account*.
* Read-only profil pengguna (Email).
* Konfigurasi UI dasar (contoh: preferensi Timezone untuk log).

---

## 4.5 Auth Module (Public Pages)

Halaman publik tanpa sesi.
* **Login:** Email, Password, dan input Token MFA (jika aktif).
* **Forgot Password:** Form standar reset password.
* JWT di-handle secara *secure* di frontend (menggunakan in-memory state dengan refresh token via secure HTTP-Only Cookie).

---

# 5. Out of Scope (Explicit Constraint)

* **NO Billing UI:** Tidak ada halaman tagihan, *invoice*, riwayat saldo, atau integrasi *payment gateway*. Topup dan pembayaran WABA dilakukan secara *direct* di luar sistem (FBM).
* **NO Inbox/Chat UI:** Portal bukan alat untuk membalas pesan.
* **NO Multi-User/Role:** Satu portal = satu pemilik WABA. Tidak ada sistem *invite member*.

---

# 6. Status

Portal Requirements: Frozen