
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { StreakPage } from './pages/StreakPage';
import { GraduationPage } from './pages/GraduationPage';
import { CreditsPage } from './pages/CreditsPage';
import { PostgresAcademyPage } from './pages/PostgresAcademyPage';
import { DocentePage } from './pages/DocentePage';

const MOTION_STORAGE_KEY = 'dagon_motion_mode';

const resolveMotionSafety = () => {
  if (typeof window === 'undefined') {
    return { reduceVisuals: false, backgroundIntensity: 0.85 };
  }

  const storedMode = window.localStorage.getItem(MOTION_STORAGE_KEY);
  const forcedReduced = storedMode === 'reducido' || storedMode === 'reduced';
  const forcedNormal = storedMode === 'normal';
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const memory = Number(navigator.deviceMemory || 0);
  const modestCpu = cores > 0 && cores <= 4;
  const modestMemory = memory > 0 && memory <= 4;
  const reduceVisuals = forcedReduced || (!forcedNormal && (
    prefersReducedMotion ||
    saveData ||
    modestCpu ||
    modestMemory
  ));

  return {
    reduceVisuals,
    backgroundIntensity: reduceVisuals ? 0.35 : 0.85,
  };
};

const useMotionSafety = () => {
  const [settings, setSettings] = useState(resolveMotionSafety);

  useEffect(() => {
    const syncSettings = () => setSettings(resolveMotionSafety());
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    syncSettings();
    motionQuery?.addEventListener?.('change', syncSettings);
    motionQuery?.addListener?.(syncSettings);
    connection?.addEventListener?.('change', syncSettings);
    window.addEventListener('storage', syncSettings);

    return () => {
      motionQuery?.removeEventListener?.('change', syncSettings);
      motionQuery?.removeListener?.(syncSettings);
      connection?.removeEventListener?.('change', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motionSafety = settings.reduceVisuals ? 'low' : 'normal';
  }, [settings.reduceVisuals]);

  return settings;
};

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
    className="page-transition-surface"
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
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const location = useLocation();
  const motionSafety = useMotionSafety();
  const isLightTheme = colors?.mode === 'light';
  
  const bgTint = colors ? `rgba(${parseInt(colors.primary.slice(1,3), 16)}, ${parseInt(colors.primary.slice(3,5), 16)}, ${parseInt(colors.primary.slice(5,7), 16)}, 0.85)` : 'rgba(99,102,241,0.85)';
  
  return (
    <MotionConfig reducedMotion={motionSafety.reduceVisuals ? "always" : "user"}>
      <AbyssBackground
        intensity={motionSafety.backgroundIntensity}
        tint={bgTint}
        mode={isLightTheme ? 'light' : 'dark'}
        colors={colors}
        reduceMotion={motionSafety.reduceVisuals}
      />
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
          <Route
            path="/docente"
            element={
              <ProtectedRoute>
                <AnimatedPage><DocentePage /></AnimatedPage>
              </ProtectedRoute>
            }
          />
         </Routes>
      </AnimatePresence>
      <Clawbot />
      <Toaster position="top-right" theme={isLightTheme ? 'light' : 'dark'} richColors />
    </MotionConfig>
  );
};

function App() {
  const soundStartedRef = useRef(false);
  const initSounds = useCallback(() => {
    if (soundStartedRef.current) {
      sounds.resume();
      return;
    }

    soundStartedRef.current = true;
    sounds.init().then(() => {
      if (window.location.pathname !== '/') {
        sounds.startBackgroundMusic();
      }
    });
  }, []);
  
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
