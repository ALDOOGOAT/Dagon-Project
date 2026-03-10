
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExercisePage } from './pages/ExercisePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { Clawbot } from './components/Clawbot';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

const AnimatedPage = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen abyss-bg flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  return token ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const { token } = useAuth();
  const location = useLocation();
  
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            token ? <Navigate to="/dashboard" replace /> : 
            <AnimatedPage><LoginPage /></AnimatedPage>
          } />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AnimatedPage><DashboardPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercise/:levelId"
            element={
              <ProtectedRoute>
                <AnimatedPage><ExercisePage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <AnimatedPage><LeaderboardPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AnimatedPage><ProfilePage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
      <Clawbot />
      <Toaster position="top-right" theme="dark" richColors />
    </>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
