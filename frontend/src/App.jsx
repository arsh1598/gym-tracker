import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/ToastProvider'
import WorkoutsPage from './pages/WorkoutsPage'
import ProgressPage from './pages/ProgressPage'
import PRsPage from './pages/PRsPage'
import ExercisesPage from './pages/ExercisesPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/workouts" replace />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/prs" element={<PRsPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
