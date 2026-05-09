
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { sounds } from './lib/SoundEngine';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExercisePage } from './pages/ExercisePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { Clawbot } from './components/Clawbot';
import { AbyssBackground } from './components/AbyssBackground';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { StreakPage } from './pages/StreakPage';
import { GraduationPage } from './pages/GraduationPage';
import { CreditsPage } from './pages/CreditsPage';
import { PostgresAcademyPage } from './pages/PostgresAcademyPage';

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
  const { colors } = useTheme();
  const location = useLocation();
  const isLightTheme = colors?.mode === 'light';
  
  const bgTint = colors ? `rgba(${parseInt(colors.primary.slice(1,3), 16)}, ${parseInt(colors.primary.slice(3,5), 16)}, ${parseInt(colors.primary.slice(5,7), 16)}, 0.85)` : 'rgba(99,102,241,0.85)';
  
  return (
    <>
      <AbyssBackground intensity={1.1} tint={bgTint} mode={isLightTheme ? 'light' : 'dark'} colors={colors} />
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
          <Route
            path="/streak"
            element={
              <ProtectedRoute>
                <AnimatedPage><StreakPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/graduation/:levelId"
            element={
              <ProtectedRoute>
                <AnimatedPage><GraduationPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/postgres"
            element={
              <ProtectedRoute>
                <AnimatedPage><PostgresAcademyPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
             path="/credits"
             element={
               <ProtectedRoute>
                 <AnimatedPage><CreditsPage /></AnimatedPage>
               </ProtectedRoute>
             }
           />
         </Routes>
      </AnimatePresence>
      <Clawbot />
      <Toaster position="top-right" theme={isLightTheme ? 'light' : 'dark'} richColors />
    </>
  );
};

function App() {
  const initSounds = () => {
    sounds.init().then(() => {
      if (window.location.pathname !== '/') {
        sounds.startBackgroundMusic();
      }
    });
  };
  
  return (
    <div 
      className="App" 
      onClick={initSounds} 
      onKeyDown={initSounds}
    >
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
