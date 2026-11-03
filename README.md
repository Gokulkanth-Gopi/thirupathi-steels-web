# Thirupathi Steels — Web Platform & Live Yard Stock System

Production-grade web platform and real-time yard stock management system for **Thirupathi Steels**, authorized TMT steel stockist and distributor in **Salem, Tamil Nadu** (Established 2011).

---

## 🏗️ Architecture & Technology Stack

- **Framework:** Next.js 15 (App Router with TypeScript strict mode)
- **Styling:** Tailwind CSS with custom industrial steel and teal brand tokens
- **Database:** **PostgreSQL is the sole authoritative database** (`pg` connection pooling with row-level locking)
- **Inventory Units:** Storage strictly in **Kilograms (`kg`)** with `NUMERIC(14, 3)` precision
- **Authentication:** Server-side HMAC-SHA256 stateless session cookies (`ts_admin_session`) with native PBKDF2 password hashing
- **Security:** CSRF origin verification, parameterized queries, and strict public privacy serializers (no raw supplier invoices or commercial purchase pricing leaked)
- **Testing:** Unit boundary tests, Playwright browser automation, and integration QA suites

---

## ⚖️ Stock Status Thresholds & Business Rules

All stock balances and statuses are computed server-side in **Kilograms (kg)**:

| Status | Inventory Range | Visual Indicator | Yard Meaning |
| :--- | :--- | :---: | :--- |
| **`IN STOCK`** | `> 1,500 kg` | Emerald Badge | Ample yard tonnage; immediate trailer loading |
| **`LOW STOCK`** | `0 < qty <= 1,500 kg` | Amber Badge | Under reserve threshold; booking priority required |
| **`OUT OF STOCK`** | `<= 0 kg` | Rose Badge | Zero physical balance; pre-order required |

### Approved Brands (Strictly 5)
1. **TATA TISCON** (Primary Steel, Fe 550D Super Ductile)
2. **SURYADEV** (Secondary Steel, Fe 550D Thermex Quenched)
3. **AGNI** (Secondary Steel, Fe 550D High Tensile)
4. **SSI TMT** (Secondary Steel, Fe 500D / 550D)
5. **CHAKRAA TMT** (Secondary Steel, Fe 550D)

### Supported Diameters (Strictly 6)
- **8 mm:** Ties, stirrups, slab reinforcement (0.395 kg/m)
- **10 mm:** Slabs, staircases, residential lintels (0.617 kg/m)
- **12 mm:** Primary columns, beams, footings (0.888 kg/m)
- **16 mm:** Multi-storey load columns & transfer girders (1.580 kg/m)
- **20 mm:** Heavy foundation rafts & bridge culverts (2.470 kg/m)
- **25 mm:** Infrastructure, shear walls, pile caps (3.850 kg/m)

---

## 🔒 Confidentiality & Public Privacy

To safeguard commercial relationships and trade terms:
- Public endpoints (`GET /api/stock`) strictly project public lot details.
- Supplier names (`bill_supplier`) and invoice image URLs (`bill_image_url`) are redacted (`NULL`).
- Commercial purchase prices (`total_amount`), supplier bill images, and internal yard weighment slips cannot be accessed by public visitors.
- The public Live Stock terminal renders a sanitized **Yard Verification Certificate** verifying batch quality (IS 1786) without exposing trade secrets.

---

## 🚀 Environment Configuration

Create `.env.local` using `.env.example`:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# PostgreSQL Connection URI (PostgreSQL is the sole authoritative database)
DATABASE_URL=postgresql://postgres:password@localhost:5432/thirupathi_steels

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="Thirupathi Steels"
NEXT_PUBLIC_SITE_LOCATION="Salem, Tamil Nadu, India"
NEXT_PUBLIC_CONTACT_PHONE="+91 90034 61089"
NEXT_PUBLIC_CONTACT_EMAIL="contact@thirupathisteels.com"

# Session Security Secret
ADMIN_SESSION_SECRET="your_secure_random_hmac_secret_here"
```

---

## 🗄️ Database Migrations & Seeding

Migrations are versioned in `db/migrations/` and tracked in `schema_migrations`:

```bash
# Run PostgreSQL migrations
npm run db:migrate

# Seed approved catalog & baseline inventory
npm run db:seed
```

### PostgreSQL Backup & Recovery Procedures
```bash
# Backup production database
pg_dump -U postgres -d thirupathi_steels -F c -b -v -f ./backup_thirupathi_steels.dump

# Restore database from backup
pg_restore -U postgres -d thirupathi_steels -v ./backup_thirupathi_steels.dump
```

---

## 🧪 Testing & Reproducible Quality Assurance

```bash
# 1. Typecheck & Lint
npx tsc --noEmit
npm run lint

# 2. Unit boundary tests (Thresholds & Validations)
npx tsx tests/unit/stock-status.test.ts

# 3. Security & Session token tests
npx tsx tests/unit/auth.test.ts

# 4. Automated Live Stock & Admin API QA Suite
npx tsx scripts/qa-live-stock.ts

# 5. Playwright Browser E2E Automation
node scripts/e2e-playwright-qa.mjs

# 6. Production Build
npm run build
```

---

## 📱 Routes Sitemap

### Public Pages
- `/` — Homepage
- `/about` — About Salem Yard & Company History
- `/products` & `/tmt-products` — TMT Reinforcement Steel Catalogue
- `/live-stock` — Real-Time Yard Inventory Terminal
- `/brands` — 5 Approved Brand Profiles
- `/gallery` — Yard & Consignment Photo Gallery
- `/contact` — Office, Weighbridge & Dispatch Contacts

### Yard Admin Portal
- `/admin/login` — Staff Authentication Portal
- `/admin/live-stock` — Physical Yard Stock Lot Management & Adjustments
- `/admin/bills` — Inward Consignment Bills & Document Register
- `/admin/bills/[id]` — Bill Details, Physical Lot Linkage & Private Document Management

---

## 📄 TS-04: Bill & Document Management System

### 1. Inward Consignment Traceability
- Every inward consignment bill links transactionally to its physical stock lot (`stock_lots`) and stock movement audit (`stock_movements`).
- Financial amounts use exact decimal arithmetic (`NUMERIC(14, 2)`):
  - `Subtotal = Quantity (kg) × Rate per kg`
  - `GST = Subtotal × (Tax % / 100)` (standard 18% on steel)
  - `Grand Total = Subtotal + GST`
- Duplicate submissions are blocked by PostgreSQL UNIQUE constraints on `bill_number`.

### 2. Private Document Storage & Sharp Processing
- **Storage Directory:** Stored strictly **outside the public web root** in `./private_uploads/documents/` (configurable via `DOCUMENT_STORAGE_DIR`).
- **Allowed Formats:** PDF, JPEG, PNG, WebP (strictly limited to 10 MB per file).
- **Magic Bytes Validation:** Header signatures are inspected to prevent disguised executable uploads.
- **Image Sanitization:** Image files are processed through **Sharp** to strip private EXIF/GPS camera metadata, auto-rotate, cap dimensions to 2400×2400, and re-encode safely.
- **PDF Safe Pass-Through:** PDF documents bypass Sharp and are validated directly for the `%PDF-` signature before being stored.
- **Access Control:** Every document delivery endpoint (`/api/admin/bills/[id]/documents/[docId]`) requires valid admin session authentication and sets `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-store`.

---

## 🧪 Testing & Reproducible Quality Assurance

```bash
# 1. Typecheck & Lint
npx tsc --noEmit
npm run lint

# 2. Unit boundary tests (Thresholds, Auth, Document Storage & Sharp)
npm run test:unit

# 3. PostgreSQL Integration Suites (Core Stock + Bills & Documents)
npm run test:integration

# 4. Automated Live Stock & Bill Management QA Suites
npm run test:qa

# 5. Playwright Browser E2E Automation (Desktop & Mobile)
npm run test:e2e

# 6. Production Build
npm run build
```
