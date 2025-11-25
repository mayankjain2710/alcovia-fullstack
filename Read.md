# 📘 Focus Mode – Full Stack Internship Assignment (Alcovia)

This repository contains the frontend (React Vite), backend (Node.js + Express), and n8n workflow for the Focus Mode Productivity & Mentorship System.

It implements the complete cycle:
- Daily check-in
- Automatic lockout
- Mentor intervention
- Custom remedial task
- Unlocking after task completion
- Cheating detection
- Fail-Safe auto-unlock logic

---

## 📁 Project Structure
```
/
├── client/               # React (Vite) frontend
├── server/               # Node.js + Express backend
├── n8n_workflow/         # Exported n8n workflows (JSON)
└── README.md
```

---

## 🚀 Features Implemented

### ✅ 1. Normal State

Student sees:
- "Enter Focus Time"
- "Enter Quiz Score"
- Submit button

If:
- `focus_minutes > 60`
- `quiz_score > 7`

Status remains: **On Track**

---

### ❌ 2. Locked State

If:
- `focus_minutes < 60` OR
- `quiz_score < 7`

Then the app shows:
```
Analysis in progress… Waiting for Mentor…
```

Additional actions:
- All inputs disabled
- Status updated to **Needs Intervention**
- n8n webhook automatically triggered

---

### 🤖 3. n8n Workflow

The workflow handles:
- Receiving bad score alerts
- Sending mentor an email with approval link
- Opening mentor task form
- Mentor assigns custom remedial task
- Backend receives and stores the task
- Student transitions into Remedial State

---

### 🧑‍🏫 4. Remedial State

The student sees only:
```
Remedial Task:
<mentor_assigned_task>
```

Available action:
- **Mark Complete**

After clicking:
- Backend sets status → **On Track**
- App returns to Normal State
- Inputs become available again

---

### 🛡 5. Cheating Detection

Students cannot switch tabs or minimize the browser.

Implemented using:
```javascript
document.addEventListener("visibilitychange", ...)
```

If cheating occurs:
- POST `/cheating-detected` is triggered
- Status → **Needs Intervention**
- n8n receives cheating alert (score=0, focus=0)
- App immediately locks

---

### 🔄 6. Automatic Student ID Creation

If no student record exists at startup:
- Backend auto-creates a student
- Default status = `"On Track"`
- Returned student_id stored in frontend localStorage

---

## ⚙️ Fail-Safe Mechanism (Required for Assignment)

Real-world systems sometimes face delays:
- Mentor may not check emails in time
- n8n may process late
- Student may remain locked too long

### ⏱ Fail-Safe Auto-Unlock Logic

When entering `"Needs Intervention"`, backend stores:
```javascript
locked_at = timestamp
```

Every time the student app polls `/student-status/:id`, backend checks:
```javascript
if (current_time - locked_at) > AUTO_UNLOCK_INTERVAL:
    status = "On Track"
```

**Example:**
- If mentor does not reply within 2 hours, student automatically unlocks back to normal mode.

### ⭐ Benefits
- Prevents unnecessary "stuck" states
- Works even if n8n fails
- Helps maintain student flow and experience
- Safe fallback for production environments

---

## 🛠️ Local Setup Instructions

### 1️⃣ Backend Setup
```bash
cd server
npm install
npm start
```

Create `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345
DB_NAME=alcovia
DB_PORT=3306
PORT=5000
```

---

### 2️⃣ Frontend Setup
```bash
cd client
npm install
npm run dev
```

If required, add:
```env
VITE_BACKEND_URL=http://localhost:5000
```

---

### 3️⃣ n8n Workflow

Exported JSON files are in:
```
n8n_workflow/
```

Run n8n:
```bash
n8n start
```

Import workflows manually.

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/daily-checkin` | Submit quiz + focus time |
| GET | `/api/student-status/:id` | Get student status |
| GET | `/api/student-latest-task/:id` | Get latest assigned remedial task |
| POST | `/api/student/:id/complete-remedial` | Mark remedial task completed |
| POST | `/api/cheating-detected` | Mark cheating + lock |

---

## 🎥 Demo Video (Loom)

Your 5-minute walkthrough must show:
1. Submitting a bad score
2. Entering locked state
3. n8n execution
4. Mentor assigning a custom task
5. App unlocking + showing remedial task
6. Mark Complete → back to normal
7. Cheating detection lock

*(Insert Loom link here)*

---

## 📦 Submission Deliverables

- ✔ Public GitHub Repository
- ✔ Frontend live demo (Vercel or Netlify)
- ✔ Backend live demo (Render/Railway) *(optional)*
- ✔ n8n Workflows JSON
- ✔ Loom Demo Video

---

**Made with ❤️ for Alcovia Full Stack Internship**