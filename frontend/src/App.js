import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExercisePage } from './pages/ExercisePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { Clawbot } from './components/Clawbot';
import { Toaster } from 'sonner';

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
  
  return (
    <>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercise/:levelId"
          element={
            <ProtectedRoute>
              <ExercisePage />
            </ProtectedRoute>
          }
        />
      </Routes>
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
