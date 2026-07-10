# 🏋️ GymTracker

A production-ready gym tracking application with a Spring Boot backend and React + Vite frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5, React Router, Recharts, Axios, Lucide Icons |
| Backend | Spring Boot 3.2, Spring Data JPA, Spring Web |
| Database | PostgreSQL 16 (Docker) |

---

## 🚀 Quick Start

### 1. Start the Database
```bash
docker compose up -d
```
- PostgreSQL runs on `localhost:5432`
- pgAdmin (optional) at `http://localhost:5050` (admin@gymtracker.local / admin)

### 2. Start the Backend
```bash
cd backend
./mvnw spring-boot:run
```
- API available at `http://localhost:8080/api`
- Exercises are seeded automatically on first boot (~58 exercises)

### 3. Start the Frontend
```bash
cd frontend
npm run dev
```
- App available at `http://localhost:5173`
- API calls are proxied to `http://localhost:8080` automatically

---

## 📁 Project Structure

```
gym-tracker/
├── docker-compose.yml          # PostgreSQL + pgAdmin
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/gymtracker/
│       ├── entity/             # JPA Entities
│       │   ├── Exercise.java
│       │   ├── Workout.java
│       │   ├── WorkoutExercise.java
│       │   └── ExerciseSet.java
│       ├── repository/         # Spring Data Repos
│       ├── service/            # Business Logic
│       ├── controller/         # REST Controllers
│       ├── dto/                # Data Transfer Objects
│       └── config/             # CORS + DataSeeder
└── frontend/
    └── src/
        ├── api/client.js       # All Axios calls
        ├── components/         # Reusable UI
        │   ├── Navbar.jsx
        │   ├── CalendarPanel.jsx
        │   ├── ExerciseCard.jsx
        │   ├── ExerciseSelector.jsx
        │   └── ToastProvider.jsx
        └── pages/
            ├── WorkoutsPage.jsx
            ├── ProgressPage.jsx
            ├── PRsPage.jsx
            └── ExercisesPage.jsx
```

---

## 🔑 Key Features

- **📅 Calendar Navigation** — Click any day to view/edit that day's workout
- **🧠 Smart Pre-fill** — When adding an exercise, sets are pre-filled from the last session
- **⬇️ Drop Sets** — Toggle `DS` badge on any set to mark it as a drop set
- **📋 Duplicate Set** — One-click duplicate of the last set
- **📜 Load Previous** — Clone any previous workout to the current day
- **📈 Progress Charts** — Line charts with 4 metrics (Max Weight, Total Volume, Best Set, Est. 1RM)
- **🏆 Personal Records** — Auto-calculated PRs with Epley 1RM estimation
- **💪 Exercise Library** — 58 pre-seeded exercises, filterable by muscle group

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts/date/{date}` | Get workout for a date |
| POST | `/api/workouts` | Save/update workout |
| GET | `/api/workouts/calendar?year&month` | Dates with workouts |
| GET | `/api/workouts/recent` | Last 5 workouts |
| GET | `/api/workouts/exercises/{id}/last-sets` | Smart pre-fill |
| GET | `/api/workouts/summary?year&month` | Monthly stats |
| GET | `/api/exercises` | All exercises (supports `?search=` and `?muscle=`) |
| POST | `/api/exercises` | Create exercise |
| PUT | `/api/exercises/{id}` | Update exercise (e.g. target muscle) |
| GET | `/api/progress/prs` | All personal records |
| GET | `/api/progress/prs/{exerciseId}` | PR for one exercise |
| GET | `/api/progress/exercise/{id}?startDate&endDate` | Progress chart data |

---

## 🗄️ Database Schema

```
exercises
  id, name, target_muscle

workouts
  id, date (unique), title, notes

workout_exercises
  id, workout_id, exercise_id, order_index

exercise_sets
  id, workout_exercise_id, set_number, weight, reps, rpe, is_drop_set
```
