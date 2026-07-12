import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = (e) => {
    if (!touchStart || !touchEnd) return;
    
    // Ignore swipes if target is inside a horizontally scrollable area (like a chart or table)
    if (e.target.closest('.recharts-wrapper') || e.target.closest('.sets-table') || e.target.closest('.workout-editor-scrollable')) {
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const routes = ['/workouts', '/progress', '/prs', '/exercises'];
    // Exact match for the route or startswith
    const currentIndex = routes.findIndex(route => location.pathname.startsWith(route));
    if (currentIndex === -1) return;

    if (isLeftSwipe && currentIndex < routes.length - 1) {
      navigate(routes[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      navigate(routes[currentIndex - 1]);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndEvent} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
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
