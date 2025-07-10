import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login/index';
import Register from './pages/Register/index';
import ResetPassword from './pages/ResetPassword/index';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm/index';
import Feed from './pages/Feed/index';
import Profile from './pages/Profile/index';
import Messages from './pages/Chat/index'; 
import Create from './pages/Create/index';
import Notifications from './pages/Notifications/index';
import NotFound from './pages/NotFound/index';
import EditProfile from './pages/EditProfile/index';
import Search from './pages/Search/index';
import Explore from './pages/Explore/index';
import Layout from './Layout';
import useAuthStore from './store/authStore';
import { getCurrentUser } from './services/auth';
import './index.css';

function App() {
  const { token, isAuthChecked, initializeAuth, setAuthChecked, user, isLoggedIn } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        initializeAuth();
        
        const state = useAuthStore.getState();

        if (state.token) {
          try {
            const result = await getCurrentUser(state.token);
            
            if (!result.success) {
              useAuthStore.getState().logout();
            }
          } catch (error) {
            useAuthStore.getState().logout();
          }
        }
        
      } catch (error) {
        useAuthStore.getState().logout();
      } finally {
        setAuthChecked(true);
      }
    };

    if (!isAuthChecked) {
      initAuth();
    }
  }, [isAuthChecked]);

  useEffect(() => {
    localStorage.removeItem('theme-bg-color');
    localStorage.removeItem('theme-bg-image');
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
  }, []);

  if (!isAuthChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isLoggedIn ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Layout />}>
              <Route index element={<Feed />} />
              <Route path="feed" element={<Feed />} />
              <Route path="search" element={<Search />} />
              <Route path="explore" element={<Explore />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="messages" element={<Messages />} />
              <Route path="create" element={<Create />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<Profile />} />
            </Route>
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;