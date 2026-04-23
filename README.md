# 🚀 Segment Drift Detection System

A full-stack event-driven system that detects customer segment drift, computes delta changes, and delivers real-time updates to the UI.

---

## 🎯 Problem

Dynamic customer segments change over time due to:

- New transactions
- Inactivity
- Profile updates
- Time progression

This project solves that by computing and broadcasting:

- Who entered a segment
- Who left a segment
- When and why it happened

---

## 🧱 Tech Stack

| Layer    | Technology                                                       |
| -------- | ---------------------------------------------------------------- |
| Backend  | NestJS, Prisma ORM, PostgreSQL, RabbitMQ, WebSockets (Socket.io) |
| Frontend | Angular (standalone components), RxJS, Socket.io Client          |

---

## ✨ Features

### ✅ Segment Engine

- Dynamic segments (rule-based)
- Static segments (frozen)
- Nested segments (segment_ref)
- Dependency graph + cascade recompute

### ✅ Delta Calculation

- **Tracks:** added, removed
- **Stores:** version history, snapshot evolution
- **Outputs:** change events

### ✅ Event-Driven Architecture

**RabbitMQ Queues:**

- `segment.recompute`
- `ui.notification`
- `campaign.trigger`

**Consumers:**

- Recompute worker
- UI notifier
- Campaign processor

### ✅ Debounce / Batching

- Prevents recompute storms
- Groups rapid events into a single recompute

### ✅ Simulation Engine

- Add transaction
- Update profile
- Advance time

### ✅ Real-Time UI

- Live activity feed
- WebSocket updates
- Expandable delta details
- Color-coded changes

### ✅ Control Panel

- Add transactions
- Trigger recompute
- Advance time
- Update profile

_(No console needed)_

---

## 🧪 Example Segment Rules

**Simple Rule:**

```json
{
  "op": "and",
  "conditions": [
    {
      "field": "spend_sum_60d",
      "operator": ">",
      "value": 5000
    }
  ]
}
```

**Nested Segment:**

```json
{
  "op": "and",
  "conditions": [
    { "type": "segment_ref", "segmentName": "VIP Customers" },
    { "type": "segment_ref", "segmentName": "Risk Group" }
  ]
}
```

---

## 🔁 Drift Happens (Core Concept)

Segments are not static — they evolve continuously. This system:

1. Detects drift
2. Computes deltas
3. Propagates changes via events
4. Updates UI in real time

---

## ▶️ Running the Project

### 1. Start PostgreSQL & RabbitMQ

RabbitMQ Management UI: http://localhost:15672  
**Credentials:** `guest` / `guest`

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Open: http://localhost:4200

---

## 🔄 How It Works

```
User triggers action (UI)
        ↓
Backend queues recompute
        ↓
Worker processes segment
        ↓
Delta is computed
        ↓
Event sent via RabbitMQ
        ↓
WebSocket emits update
        ↓
UI updates instantly
```

---

## 📸 UI

### Control Panel

Simulate events without console

### Live Feed

- Segment name
- Version changes
- Added / removed counts
- Detailed customer IDs

---

## 🧠 Design Highlights

- Event-driven architecture
- Decoupled services via queues
- Scalable recompute logic
- Real-time streaming updates
- Debounced change aggregation

---

## 🚀 Future Improvements

- UI dashboard with charts
- Campaign execution logic
- Segment builder UI
- Pagination / history view
- Kafka instead of RabbitMQ (for scale)

---

## 🏁 Summary

This project demonstrates how to build a production-style system that:

- Tracks segment drift
- Computes meaningful changes
- Distributes them via events
- Visualizes them in real time
