# EduVerify – APAAR-Based National Student Data Management & Verification System

EduVerify is an enterprise-grade national digital education infrastructure platform designed for the **All India Council for Technical Education (AICTE)** under the **Ministry of Education, Government of India**.

The platform centralizes student academic identities using **APAAR (Automated Permanent Academic Account Registry)**, automates admission and intake quota compliance, detects cross-institutional duplicate enrolments, and issues tamper-evident QR-verifiable credentials.

---

## 🌟 Key Features

- **APAAR Validation Engine**: Implements the official 12-digit **Verhoeff checksum algorithm** with structured error classification (missing, malformed, invalid checksum, and collision).
- **Intelligent Duplicate Detection**: Real-time cross-college collision scanning utilizing APAAR hash checks and fuzzy matching on normalized student names, dates of birth, and guardian metadata.
- **Intake & Admission Compliance**: Dynamic tracking of approved intake vs. actual enrolment with automated alerts for excess admissions and supernumerary quotas (NRI 5%, OCI 5%, Foreign Nationals 10%, EWS).
- **Role-Based Portals (4 Roles)**:
  - **AICTE Super Admin**: National council monitoring, institutional approvals, duplicate resolution hub, intake violation flagging, immutable audit trails, and CSV reports.
  - **Institution Admin**: College profile, live intake utilization gauge, student roster, single-student registration with live APAAR format inspection, and bulk CSV cohort ingestion.
  - **Student**: Masked APAAR academic profile (`•••• •••• 8451`), tamper-evident QR credential, printable official academic certificate with AICTE/university seals, consent management, and verification access logs.
  - **Authorized Verifier**: Third-party background screening and employer verification tool for instant authenticity validation.
- **Public QR Verification**: Standalone public verification check for any scanned QR credential.
- **Instant Demo Persona Switcher**: Top-bar switcher enabling instant evaluation across all four roles without manual credential friction.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons, Responsive SVG Visualizations.
- **Backend**: Node.js, Express.js REST API with modular services.
- **Data Persistence**: Embedded relational database with ACID transactions and pre-seeded realistic synthetic Indian higher education data.
- **Security & Privacy**: Masked identifier storage, cryptographic HMAC signed QR tokens, and compliance with the **Digital Personal Data Protection (DPDP) Act, 2023**.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/loknarayanpro-coder/eduverify.git
   cd eduverify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🏛️ Seeded Demo Personas

| Role | Persona Name | Organization | Demo Email |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Dr. Anil Sahasrabudhe | AICTE Central Authority | `admin@aicte.gov.in` |
| **Institution Admin** | Prof. R. K. Deshmukh | COEP Technological University | `admin@coep.ac.in` |
| **Student** | Aarav Sharma | COEP Pune (B.Tech CSE) | `aarav.sharma@student.eduverify.gov.in` |
| **Authorized Verifier** | Priya Nair | Tata Consultancy Services | `priya.nair@tcs.com` |

---

## 📜 Regulatory Standards & Architecture

- **Automated Permanent Academic Account Registry (APAAR)**: National 12-digit lifelong student ID under the Ministry of Education.
- **Academic Bank of Credits (ABC)** & National Higher Education Qualification Framework (NHEQF).
- **DPDP Act 2023**: Zero raw personal data (unmasked APAAR, phone numbers, addresses) leaked into 2D barcodes.
