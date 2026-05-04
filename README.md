# AdaptiveFit 🏋️

**AI-powered adaptive fitness companion** — tracks meals, generates personalized workout plans, measures engagement score, and provides a smart chat assistant.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite, React Router v6, Recharts, Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (7-day expiry) |
| Nutrition API | Open Food Facts (with local fallback) |

---

## Features

- **Auth** — Register, login, JWT session with auto-refresh on load
- **Profile Setup** — Multi-step wizard (basics → body measurements → goals)
- **Dashboard** — Daily calorie progress, today's workout, engagement score, weekly chart
- **Meals** — Food search (Open Food Facts API + offline fallback), log meals, view today's intake, delete logs
- **Workouts** — AI-generated weekly plan based on fitness goal + activity level, mark complete, skip, weekly schedule view
- **Progress** — Engagement score, weight history chart, weekly calorie chart, 14-day meal history
- **AI Chat** — Intent-based assistant (calories, workouts, motivation, tips, streak, progress)
- **Engagement Score** — Composite metric: login frequency, workout completion rate, meal logging, streak, inactivity gap

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas (free tier works)

### 1. Clone & setup env

```bash
# Backend
cd backend
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET in .env

# Frontend  
cd ../frontend
cp .env.example .env
# VITE_API_URL=http://localhost:4000/api (already set)
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Run

```bash
# Terminal 1 — Backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
adaptivefit/
├── backend/
│   └── src/
│       ├── app.js              # Express server entry
│       ├── config/database.js  # MongoDB connection
│       ├── controllers/        # Business logic
│       │   ├── authController.js
│       │   ├── mealController.js
│       │   ├── workoutController.js
│       │   ├── chatController.js
│       │   ├── behaviorController.js
│       │   └── dashboardController.js
│       ├── middleware/
│       │   └── authMiddleware.js   # JWT protect
│       ├── models/             # Mongoose schemas
│       │   ├── User.js
│       │   ├── MealLog.js
│       │   ├── WorkoutPlan.js
│       │   ├── ChatLog.js
│       │   └── ActivityLog.js
│       ├── routes/             # Express routers
│       └── utils/
│           ├── calculations.js     # BMI, TDEE, JWT
│           └── exerciseDatabase.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             # Routes + guards
        ├── index.css           # Design system
        ├── context/AuthContext.jsx
        ├── services/api.jsx    # Axios + interceptors
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── ProfileSetupPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── MealsPage.jsx
        │   ├── WorkoutsPage.jsx
        │   ├── ChatPage.jsx
        │   ├── ProgressPage.jsx
        │   └── ProfilePage.jsx
        └── components/
            └── Layout/Layout.jsx
```

---

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (protected) |
| POST | `/api/auth/profile/setup` | Setup profile (protected) |
| PUT | `/api/auth/profile/update` | Update profile (protected) |

### Meals
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/meals/search?query=` | Search food |
| POST | `/api/meals/log` | Log a meal |
| GET | `/api/meals/today` | Today's meals + summary |
| GET | `/api/meals/history?days=7` | Meal history |
| DELETE | `/api/meals/:mealId` | Delete a meal |

### Workouts
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/workouts/plan/generate` | Generate personalized plan |
| GET | `/api/workouts/plan` | Get active plan |
| GET | `/api/workouts/today` | Today's workout |
| POST | `/api/workouts/complete` | Mark workout complete |
| POST | `/api/workouts/skip` | Skip workout |

### Other
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Dashboard data aggregate |
| POST | `/api/chat/message` | Send message to AI assistant |
| GET | `/api/behavior/score` | Engagement score |

---

## Deployment

### Backend — Render / Railway
```yaml
# render.yaml already included in backend/
Build: npm install
Start: npm start
Env vars: PORT, MONGODB_URI, JWT_SECRET, FRONTEND_URL
```

### Frontend — Vercel / Netlify
```bash
Build command: npm run build
Output dir: dist
Env: VITE_API_URL=https://your-backend.onrender.com/api
```
