import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EnhancedDashboard from './pages/EnhancedDashboard';
import './App.css';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to sync authentication with Chrome extension
  const syncWithExtension = (action: 'LOGIN' | 'LOGOUT', userId?: string) => {
    if (window.postMessage) {
      window.postMessage({
        type: 'WIKIQUEST_AUTH',
        action,
        userId
      }, '*');
    }
  };

  // Function to sync user with backend
  const syncUserWithBackend = async (userId: string) => {
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        console.log('User synced with backend');
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  };

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        // Sync with backend
        await syncUserWithBackend(session.user.id);
        // Sync with extension on initial load
        syncWithExtension('LOGIN', session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUserId(session.user.id);
        // Sync with backend
        await syncUserWithBackend(session.user.id);
        // Sync login with extension
        syncWithExtension('LOGIN', session.user.id);
      } else {
        setUserId(null);
        // Sync logout with extension
        syncWithExtension('LOGOUT');
      }
    });

    // Listen for extension confirmation messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'WIKIQUEST_AUTH_CONFIRMED') {
        console.log('Extension sync confirmed:', event.data.success);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleLogin = (id: string) => {
    setUserId(id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading WikiQuest...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={userId ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/dashboard"
          element={userId ? <EnhancedDashboard userId={userId} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
