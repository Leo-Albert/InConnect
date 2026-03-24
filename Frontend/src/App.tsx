import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Feed from './pages/Feed/Feed';
import CreateTopic from './pages/CreateTopic/CreateTopic';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/Auth/AuthPage';
import Profile from './pages/Profile/Profile';
import EditTopic from './pages/EditTopic/EditTopic';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  console.log('[RequireAuth] user:', !!user, 'loading:', loading);
  if (loading) return null;
  if (!user) {
    console.warn('[RequireAuth] NO USER. Redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Feed />} />
          <Route path="create" element={<CreateTopic />} />
          <Route path="edit/:id" element={<EditTopic />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="/auth" element={<RedirectIfAuth><AuthPage /></RedirectIfAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
