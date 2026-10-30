# EduVerify – APAAR-Based National Student Data Management & Verification System

EduVerify is an enterprise-grade national digital education infrastructure platform designed for AICTE to centralize student academic identities using APAAR (Automated Permanent Academic Account Registry), automate intake compliance, detect cross-institutional duplicate enrolments, and provide cryptographic QR verification.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key architectural choices were confirmed during Phase 1 clarification:
> - **Backend Database Architecture**: Embedded relational database integrated with Express and typed ORM schema to provide zero-config, ACID-compliant persistence without requiring external cloud database provisioning.
> - **Role Switching & Demo Accounts**: Instant top-tier demo persona switcher bar coupled with complete email/password authentication forms to allow friction-free evaluation across all four stakeholder roles (Super Admin, Institution Admin, Student, Verifier).
> - **Credential Format & Verification**: Tamper-evident cryptographic signed QR tokens linking to public web verification endpoints with printable official verification certificates.

***

## 1. Overview & Core Concept

### What It Does
EduVerify establishes a unified, verifiable student registry for India's higher education system. It eliminates fragmented admissions data across AICTE institutions, prevents unauthorized seat over-allocation (approved intake vs. actual enrolment), identifies ghost or duplicate student admissions across colleges, and equips every student with an APAAR-backed verifiable digital credential.

### Target Personas
1. **AICTE Super Admin**: National council administrators auditing institutional compliance, viewing aggregate state/programme analytics, resolving cross-institutional duplicate alerts, and issuing regulatory approvals.
2. **Institution Admin (Dean / Registrar / Admissions Officer)**: Institutional authorities managing intake caps, supernumerary categories (NRI/OCI/Foreign Nationals), bulk uploading student cohorts via CSV/Excel, and auditing APAAR status.
3. **Student**: Individual learners viewing their masked APAAR profile, tracking admission validity, downloading tamper-evident verification credentials, and inspecting audit logs of who verified their records.
4. **Authorized Verifier (Employer / Background Screening / University)**: Third-party organizations validating credentials via QR scans or student ID lookups with authorized consent checks.

### Key Value
- **Zero-Ghost Admissions**: Cross-institution duplicate detection catches simultaneous enrolments and fraudulent seat allocations.
- **Automated Regulatory Intake Auditing**: Real-time tracking of regular vs. supernumerary quotas with instant excess-admission alerts.
- **Privacy-by-Design APAAR Management**: Masked display (`••••-••••-1234`), encrypted internal indexing, and zero raw sensitive data leaked into QR codes.

***

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PUBLIC PORTAL & REGISTRATION                          │
│  Landing Page  ──>  How It Works  ──>  Institution Registration / Auth Login    │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Role-Based Routing
         ┌─────────────────────────────┼──────────────────────────────┐
         ▼                             ▼                              ▼
┌──────────────────┐         ┌──────────────────┐          ┌─────────────────────┐
│ AICTE SUPER ADMIN│         │INSTITUTION ADMIN │          │   STUDENT PORTAL    │
│ • National Stats │         │ • Intake Caps    │          │ • Masked APAAR ID   │
│ • State Analytics│         │ • Student Roster │          │ • Verification QR   │
│ • Intake Alerts  │         │ • Bulk Upload    │          │ • PDF Certificate   │
│ • Duplicates Hub │         │ • Error Triage   │          │ • Consent & History │
└──────────────────┘         └──────────────────┘          └─────────────────────┘
                                       │
                                       ▼
                             ┌──────────────────┐
                             │AUTHORIZED VERIFY │
                             │ • QR Code Scanner│
                             │ • Token Check    │
                             │ • Audit Log Entry│
                             └──────────────────┘
```

1. **National Intake & Compliance Audit (AICTE Admin)**:
   - Super admin logs in, views nationwide KPI cards (Intake vs. Actual, Duplicate Alerts, APAAR Validation Rate).
   - Explores dynamic state-wise and programme-wise enrolment charts.
   - Clicks into the "Intake Exceeded" registry to inspect non-compliant institutions and issue regulatory flags.
   - Audits high-risk duplicate candidates in the Duplicate Detection Engine with side-by-side student attribute comparison.

2. **Cohort Ingestion & Reconciliation (Institution Admin)**:
   - College admin uploads a 500-student batch using the Excel/CSV importer.
   - Real-time client & server validation preview highlights formatting anomalies (invalid APAAR checksums, missing categories).
   - Confirms valid imports; system immediately updates live intake utilization and warns if regular seats exceed approved caps.

3. **Digital Academic Identity & Verifiable Credentials (Student)**:
   - Student authenticates, views their clean academic record with masked APAAR ID (`9812-4019-XXXX`).
   - Generates a QR-based digital verification credential containing an opaque cryptographic verification URL.
   - Generates and downloads an official printable verification certificate with watermarked institutional emblems.

4. **Instant Third-Party Verification (Verifier)**:
   - Employer accesses the public verifier tool or scans the student's QR code.
   - System validates token authenticity, expiry, and revocation state on the server.
   - Displays authorized academic credentials with institution authenticity stamp while withholding unneeded personal contact information.

### Visual Identity & Theme
- **Aesthetic Direction**: Government-tech inspired, authoritative, minimal, and modern. Modeled after Digital India, DigiLocker, and AICTE portals with enterprise clarity.
- **Color Palette & Discipline**:
  - Primary Canvas: `#F8FAFC` (Slate-50) for crisp, clean surfaces.
  - Primary Brand: `#153B63` (Deep Sovereign Navy) for authoritative headers, navigation, and primary CTAs.
  - Secondary Brand: `#246B8F` (Gov-Tech Blue) for secondary actions and active tabs.
  - Semantic Accent: `#16A085` / `#0D9488` (Teal Green) for valid verification states and safe intake limits.
  - Regulatory Warning: `#D97706` (Amber) for pending validation and near-capacity intake.
  - Critical Alert: `#DC2626` (Crimson) for intake violations and duplicate records.
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` / `Manrope` with strict `text-wrap: balance`.
  - Body Prose: `Public Sans` / `Plus Jakarta Sans` (14px–16px, 1.6 line height).
  - Metric & Identifier Figures: Monospace tabular numerals (`font-mono tabular-nums`) for APAAR IDs, enrolment figures, seat percentages, and timestamps.
- **Zero-Pill Discipline & Layout Rules**:
  - All tags, status indicators, and metadata rendered as clean text with typographic separators (`·` or `/`) instead of chunky pill capsules.
  - Top navigation bar follows the strict 1-line 3-zone contract: Brand Title — 4-5 Navigation Links — Single Primary Action / Persona Switcher.
  - Zero decorative pulsing dots; status indicators always pair color with explicit text labels.

***

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Full-Stack Embedded Express REST API with Direct Connect Vite Middleware
- **Chosen Approach**: Build a complete, modular Express API mounted seamlessly within the local application runner, serving full REST routes (`/api/auth/*`, `/api/institutions/*`, `/api/students/*`, `/api/apaar/*`, `/api/intake/*`, `/api/verification/*`, `/api/reports/*`, `/api/analytics/*`).
- **Why**: Guarantees authentic HTTP request/response lifecycles, real JWT headers, server-side data validations, and ACID database operations without brittle mock stubs or external port conflicts.
- **Alternatives Considered**: Client-only in-memory state (rejected: violates non-mock requirement and lacks real API testing capability).

### Decision 2: APAAR Validation Adapter Architecture
- **Chosen Approach**: Modular APAAR Adapter with a 12-digit Luhn/Verhoeff-standard validation algorithm, synthetic sandbox verification service, and structured error classification (Missing, Malformed, Duplicate Within Institution, Cross-Institution Duplicate).
- **Why**: Strictly adheres to the project requirement never to fabricate official government responses while keeping the adapter 100% pluggable for future live DigiLocker/NDEAR sandbox APIs.

### Decision 3: Cryptographic QR Credentials without PII Leakage
- **Chosen Approach**: The QR code encodes only a secure, signed verification URL containing an opaque credential token (`/verify/[credentialId]?sig=...`). Scanning loads the server verification endpoint that evaluates revocation status and outputs permitted academic fields.
- **Why**: Fully compliant with the Digital Personal Data Protection (DPDP) Act 2023. Never encodes raw APAAR ID, birth dates, or mobile numbers inside raw 2D barcodes.

***

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT FRONTEND                                  │
│  React 19 + TypeScript + Tailwind CSS + Lucide Icons + Recharts Analytics       │
│  ┌───────────────────────────┬────────────────────────────┬──────────────────┐  │
│  │    Public / Landing UI    │    Role-Based Dashboards   │ Verifier / QR    │  │
│  └───────────────────────────┴────────────────────────────┴──────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ HTTP / REST APIs (Axios)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXPRESS REST BACKEND                               │
│  ┌───────────────────────┬────────────────────────────┬──────────────────────┐  │
│  │  Auth & RBAC Guards   │  Validation & Duplicate    │  Intake Compliance   │  │
│  │  (JWT + Refresh)      │  Engine (APAAR + DOB match)│  Engine              │  │
│  ├───────────────────────┼────────────────────────────┼──────────────────────┤  │
│  │  Bulk File Ingestion  │  QR Credential Signer      │  Report Generator    │  │
│  │  (CSV / XLSX parsing) │  (Opaque token generator)  │  (CSV / Print-Ready) │  │
│  └───────────────────────┴────────────────────────────┴──────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Type-Safe Query & Storage Engine
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENT RELATIONAL DATABASE                          │
│  • Users & Institutions         • Students & Academic Records                   │
│  • Intake Records & Quotas      • APAAR Verifications & Duplicate Alerts        │
│  • Verification Credentials     • Audit Trails & In-App Notifications           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Relational Data Models
1. **User**: `id`, `email`, `passwordHash`, `fullName`, `role` (`SUPER_ADMIN` | `INSTITUTION_ADMIN` | `STUDENT` | `VERIFIER`), `institutionId`, `status`.
2. **Institution**: `id`, `aisheCode`, `aicteApprovalId`, `name`, `type` (`ENGINEERING` | `MANAGEMENT` | `POLYTECHNIC`), `state`, `district`, `approvalStatus` (`APPROVED` | `PENDING` | `SUSPENDED`), `contactEmail`.
3. **AcademicProgramme & IntakeRecord**: `id`, `institutionId`, `programmeName`, `degreeLevel` (`UG` | `PG` | `DIPLOMA`), `academicYear`, `approvedIntake`, `supernumeraryLimit`, `actualRegularEnrolment`, `supernumeraryEnrolment`, `nriEnrolment`, `foreignEnrolment`.
4. **Student**: `id`, `studentId`, `apaarId` (hashed/encrypted + masked), `fullName`, `dateOfBirth`, `gender`, `email`, `mobile`, `state`, `district`, `category` (`GENERAL` | `OBC` | `SC` | `ST` | `EWS`), `admissionCategory` (`REGULAR` | `NRI` | `OCI` | `FOREIGN_NATIONAL` | `SUPERNUMERARY`), `institutionId`, `programmeId`, `admissionYear`, `status`.
5. **APAARVerification**: `id`, `studentId`, `apaarId`, `status` (`VALID` | `PENDING` | `INVALID` | `DUPLICATE` | `FAILED`), `validationCode`, `checkedAt`, `checksumValid`.
6. **DuplicateAlert**: `id`, `apaarId`, `studentIdA`, `institutionIdA`, `studentIdB`, `institutionIdB`, `similarityScore`, `reason`, `status` (`NEW` | `UNDER_REVIEW` | `CONFIRMED_DUPLICATE` | `RESOLVED`), `createdAt`.
7. **VerificationCredential**: `id`, `token`, `studentId`, `institutionId`, `programme`, `issueDate`, `status` (`ACTIVE` | `REVOKED`), `verificationCount`.
8. **AuditLog**: `id`, `userId`, `action`, `resourceType`, `resourceId`, `ipAddress`, `metadata`, `timestamp`.

### Interactive Component & State Mapping
- **Persona Switcher**: Top header selector allows switching instantly between `Super Admin (Dr. Sharma, AICTE)`, `Institution Admin (IIT Delhi / Anna Univ)`, `Student (Aarav Verma)`, and `Verifier (TCS Background Verification)`, updating active JWT tokens and reloading scoped dashboard views.
- **Student Bulk Ingestion**: File dropzone reads CSV/Excel rows, runs schema validation in memory, streams progress, previews row-level error warnings, and commits records in transactional batches.
- **Live Intake Monitor**: Dynamically calculates `Regular Enrolment / Approved Intake` utilization rates and triggers visual warnings when excess admissions occur.
- **Credential Generator**: Generates SVG QR codes for immediate verification, with single-click PDF/print preview generation with official AICTE & institutional header formats.
