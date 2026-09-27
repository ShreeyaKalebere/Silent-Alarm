# Silent Alarm - Privacy-Preserving Keystroke Telemetry & Distress Detection

A full-stack mental health wellness monitoring platform built with **React (Vite) + TailwindCSS**, **Node.js + Express**, **Socket.io**, **MongoDB + Mongoose**, and an ensemble **Python FastAPI ML Microservice (Isolation Forest + PyTorch LSTM Autoencoder)**.

Silent Alarm monitors subtle shifts in student typing cadence (dwell time, flight time, pauses, backspace rate) during everyday chat to identify sustained emotional distress, delivering private self-nudges and aggregate counselor visibility without ever capturing keystroke identities or message content.

---

## Architecture Overview

```
Silent-Alarm/
├── ml-service/                   # Python FastAPI ML Microservice (Port 8001)
│   ├── models/
│   │   ├── isolation_forest.py   # Per-user point-anomaly detector
│   │   └── lstm_autoencoder.py   # PyTorch sequence reconstruction autoencoder
│   ├── services/
│   │   ├── baseline_store.py     # SQLite historical telemetry store & stats
│   │   └── explainer.py          # Plain-English contributing factor generator
│   ├── main.py                   # FastAPI prediction & calibration endpoints
│   ├── test_ml_service.py        # Microservice test suite
│   └── requirements.txt
├── server/                       # Node.js Express + Socket.io Server (Port 5000)
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js           # Accounts, roles, consent flags, baseline stats
│   │   │   ├── TypingEvent.js    # Telemetry storage (30-Day TTL auto-expiry index)
│   │   │   ├── WellnessAlert.js  # Nudge & escalation alerts
│   │   │   └── Message.js        # Chat persistence
│   │   ├── middleware/auth.js    # JWT authentication & counselor role check
│   │   ├── routes/
│   │   │   ├── auth.js           # Login, register, consent toggle
│   │   │   ├── typingEvents.js   # Privacy-guarded telemetry ingestion & ML pipeline
│   │   │   ├── wellness.js       # Student 30-day telemetry history & GDPR purge
│   │   │   └── admin.js          # Cohort aggregate trends & dual-threshold escalations
│   │   ├── services/
│   │   │   ├── mlClient.js       # HTTP client connecting Node to FastAPI
│   │   │   └── alertService.js   # 3-consecutive-event distress evaluation & socket triggers
│   │   ├── sockets/chatHandler.js# Real-time channels & private DMs
│   │   └── scripts/seedDemoData.js# Full realistic dataset generator
│   └── test_*.js                 # Automated test suites
├── client/                       # React 19 + Vite + TailwindCSS Frontend (Port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/             # Login & Registration forms with quick-fill test accounts
│   │   │   ├── Chat/             # Real-time chat area, channels, DMs, & cadence hook
│   │   │   └── Wellness/
│   │   │       ├── WellnessConsentModal.jsx # Granular opt-in onboarding
│   │   │       └── WellnessNudgeToast.jsx   # Client toast with breathing & support links
│   │   ├── pages/
│   │   │   ├── MyWellnessPage.jsx           # Student self-reflection charts & data purge
│   │   │   └── CounselorDashboardPage.jsx   # Cohort aggregates & safe escalation review
│   │   ├── hooks/useKeystrokeCapture.js     # Privacy-first anonymous cadence calculator
│   │   ├── context/                         # AuthContext & SocketContext
│   │   └── App.jsx
│   └── package.json
└── package.json
```

---

## Core Privacy Principles

1. **Zero Keystroke / Text Logging**:
   - The client-side hook (`useKeystrokeCapture.js`) measures only timing deltas (key hold durations, pauses between strokes, WPM estimate, backspace frequency).
   - Character identities, key codes, and message text are stripped before payload assembly.
   - The backend (`typingEvents.js`) performs strict schema validation, rejecting any payload containing `text`, `content`, `key`, `code`, or `char`.

2. **30-Day Automatic Data Expiry**:
   - All `TypingEvent` documents in MongoDB feature a native TTL index: `expireAfterSeconds: 2592000` (30 days).

3. **GDPR / Right to Erasure**:
   - Students can disable monitoring and permanently delete all their historical typing telemetry at any time via the "Purge My Telemetry" feature in `MyWellnessPage.jsx`.

4. **Dual-Threshold Escalation Safeguard**:
   - The counselor dashboard surfaces aggregate, anonymized cohort wellness trends by default.
   - An individual student's identity is surfaced to counselors **only** when both safeguards are met:
     - The student has **3+ unresolved high-severity distress alerts**, AND
     - The student has **dismissed 2+ prior self-nudges** without improvement.

---

## Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB** running on `127.0.0.1:27017`

### 2. Start Services

Open three separate terminals in the project root:

#### Terminal 1: Python ML Microservice (Port 8001)
```bash
npm run ml
# Or: cd ml-service && python main.py
```

#### Terminal 2: Node.js Backend Server (Port 5000)
```bash
npm run server
# Or: cd server && npm run dev
```

#### Terminal 3: React Frontend Client (Port 5173)
```bash
npm run client
# Or: cd client && npm run dev
```

---

## Seed Demo Data

To populate the database with realistic student typing baselines, 30-day cohort trends, and an escalation candidate:

```bash
npm run seed
```

This creates:
- **Counselor**: `dr_smith` (password: `password123`)
- **Admin**: `admin_clara` (password: `password123`)
- **Student**: `alice` (password: `password123`)
- **Escalation Candidate**: `student_distressed` (password: `password123`)

---

## Automated Verification Tests

Run any of the automated test suites from the root directory:

| Command | Description |
| :--- | :--- |
| `npm run test:verify` | Verifies MongoDB connection, schemas, bcrypt hashing, and the 30-day TTL index |
| `npm run test:ml` | Tests Python ML Isolation Forest, LSTM autoencoder, and anomaly scoring |
| `npm run test:privacy` | Tests typing event ingestion and confirms privacy rejection of illicit text |
| `npm run test:e2e` | Multi-client Socket.io real-time chat & DM simulator |
