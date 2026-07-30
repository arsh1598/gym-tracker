import React, { useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/ToastProvider'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'
import WorkoutsPage from './pages/WorkoutsPage'
import ProgressPage from './pages/ProgressPage'
import PRsPage from './pages/PRsPage'
import ExercisesPage from './pages/ExercisesPage'

const SwipeableRoutes = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartRef = useRef(null);

  const minSwipeDistance = 60;

  const onTouchStart = (e) => {
    const touch = e.targetTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e) => {
    if (!touchStartRef.current) return;

    // Ignore swipes if target is inside a horizontally scrollable area (like a chart or table)
    if (e.target.closest('.recharts-wrapper') || e.target.closest('.sets-table') || e.target.closest('.workout-editor-scrollable')) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Only count as a horizontal swipe if X movement dominates and exceeds threshold
    if (Math.abs(deltaX) < minSwipeDistance) return;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 0.6) return;

    const routes = ['/workouts', '/progress', '/prs', '/exercises'];
    const currentIndex = routes.findIndex(route => location.pathname.startsWith(route));
    if (currentIndex === -1) return;

    if (deltaX < 0 && currentIndex < routes.length - 1) {
      navigate(routes[currentIndex + 1]);
    } else if (deltaX > 0 && currentIndex > 0) {
      navigate(routes[currentIndex - 1]);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {children}
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
      {!user ? (
        <AuthModal />
      ) : (
        <>
          <Navbar />
          <SwipeableRoutes>
            <Routes>
              <Route path="/" element={<Navigate to="/workouts" replace />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/prs" element={<PRsPage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
            </Routes>
          </SwipeableRoutes>
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
