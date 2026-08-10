
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { sounds } from './lib/SoundEngine';
import { LoginPage } from './pages/LoginPage';
import { Clawbot } from './components/Clawbot';
import { AbyssBackground } from './components/AbyssBackground';
import { Toaster } from 'sonner';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { StreakAnimation } from './components/StreakAnimation';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ExercisePage = lazy(() => import('./pages/ExercisePage').then(module => ({ default: module.ExercisePage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const StreakPage = lazy(() => import('./pages/StreakPage').then(module => ({ default: module.StreakPage })));
const GraduationPage = lazy(() => import('./pages/GraduationPage').then(module => ({ default: module.GraduationPage })));
const CreditsPage = lazy(() => import('./pages/CreditsPage').then(module => ({ default: module.CreditsPage })));
const PostgresAcademyPage = lazy(() => import('./pages/PostgresAcademyPage').then(module => ({ default: module.PostgresAcademyPage })));
const DocentePage = lazy(() => import('./pages/DocentePage').then(module => ({ default: module.DocentePage })));

const MOTION_STORAGE_KEY = 'dagon_motion_mode';

const getViewportWidth = () => {
  if (typeof window === 'undefined') return 1440;
  return Math.round(window.visualViewport?.width || window.innerWidth || 1440);
};

const resolveAdaptiveVisualProfile = () => {
  if (typeof window === 'undefined') {
    return {
      reduceMotion: false,
      visualFidelity: 'desktop-full',
      backgroundIntensity: 0.85,
      targetFps: 30,
      canUseHover: true,
    };
  }

  const storedMode = window.localStorage.getItem(MOTION_STORAGE_KEY);
  const forcedReduced = storedMode === 'reducido' || storedMode === 'reduced';
  const forcedNormal = storedMode === 'normal';
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const coarsePointer = window.matchMedia?.('(hover: none), (pointer: coarse)').matches ?? false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const memory = Number(navigator.deviceMemory || 0);
  const modestCpu = cores > 0 && cores <= 4;
  const modestMemory = memory > 0 && memory <= 4;
  const viewportWidth = getViewportWidth();
  const mobileViewport = viewportWidth <= 640 || (coarsePointer && viewportWidth <= 767);
  const tabletViewport = viewportWidth <= 1024;
  const modestDevice = saveData || modestCpu || modestMemory;
  const reduceMotion = forcedReduced || (!forcedNormal && prefersReducedMotion);
  const visualFidelity = mobileViewport
    ? 'mobile-premium'
    : (tabletViewport || modestDevice ? 'tablet-balanced' : 'desktop-full');

  return {
    reduceMotion,
    visualFidelity,
    backgroundIntensity: reduceMotion
      ? 0.28
      : visualFidelity === 'mobile-premium'
        ? 0.55
        : visualFidelity === 'tablet-balanced'
          ? 0.7
          : 0.85,
    targetFps: visualFidelity === 'mobile-premium' ? 24 : visualFidelity === 'tablet-balanced' ? 28 : 30,
    canUseHover: !coarsePointer && visualFidelity === 'desktop-full',
  };
};

const useAdaptiveVisualProfile = () => {
  const [settings, setSettings] = useState(resolveAdaptiveVisualProfile);

  useEffect(() => {
    const syncSettings = () => setSettings(resolveAdaptiveVisualProfile());
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia?.('(hover: none), (pointer: coarse)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const viewport = window.visualViewport;

    syncSettings();
    motionQuery?.addEventListener?.('change', syncSettings);
    motionQuery?.addListener?.(syncSettings);
    pointerQuery?.addEventListener?.('change', syncSettings);
    pointerQuery?.addListener?.(syncSettings);
    connection?.addEventListener?.('change', syncSettings);
    viewport?.addEventListener?.('resize', syncSettings);
    window.addEventListener('resize', syncSettings);
    window.addEventListener('storage', syncSettings);

    return () => {
      motionQuery?.removeEventListener?.('change', syncSettings);
      motionQuery?.removeListener?.(syncSettings);
      pointerQuery?.removeEventListener?.('change', syncSettings);
      pointerQuery?.removeListener?.(syncSettings);
      connection?.removeEventListener?.('change', syncSettings);
      viewport?.removeEventListener?.('resize', syncSettings);
      window.removeEventListener('resize', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motionSafety = settings.reduceMotion ? 'reduced' : 'normal';
    document.documentElement.dataset.visualFidelity = settings.visualFidelity;
  }, [settings.reduceMotion, settings.visualFidelity]);

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
  const visualProfile = useAdaptiveVisualProfile();
  const [globalStreak, setGlobalStreak] = useState(null);
  const isLightTheme = colors?.mode === 'light';
  const routeFallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="h-11 w-11 rounded-full border-4 border-transparent animate-spin"
        style={{
          borderTopColor: colors?.primary || '#22d3ee',
          borderRightColor: colors?.secondary || '#3b82f6',
        }}
      />
    </div>
  );
  
  useEffect(() => {
    const handleStreak = (e) => {
      setGlobalStreak(e.detail);
    };
    window.addEventListener('dagon_streak_activated', handleStreak);
    return () => window.removeEventListener('dagon_streak_activated', handleStreak);
  }, []);
  
  const bgTint = colors ? `rgba(${parseInt(colors.primary.slice(1,3), 16)}, ${parseInt(colors.primary.slice(3,5), 16)}, ${parseInt(colors.primary.slice(5,7), 16)}, 0.85)` : 'rgba(99,102,241,0.85)';
  
  return (
    <MotionConfig reducedMotion={visualProfile.reduceMotion ? "always" : "user"}>
      <AbyssBackground
        intensity={visualProfile.backgroundIntensity}
        tint={bgTint}
        mode={isLightTheme ? 'light' : 'dark'}
        colors={colors}
        reduceMotion={visualProfile.reduceMotion}
        visualFidelity={visualProfile.visualFidelity}
        targetFps={visualProfile.targetFps}
      />
      <Suspense fallback={routeFallback}>
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
      </Suspense>
      <Clawbot />
      {globalStreak !== null && (
        <StreakAnimation 
          streakCount={globalStreak} 
          onComplete={() => setGlobalStreak(null)} 
        />
      )}
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
