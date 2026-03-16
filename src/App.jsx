import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Games from './components/Games';
import Tournaments from './components/Tournaments';
import TrainingLog from './components/TrainingLog';
import Friends from './components/Friends';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import Auth from './components/Auth';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { supabase } from './lib/supabase';
import { LayoutDashboard, Trophy, Calendar as CalendarIcon, Flag, BookOpen, Settings as SettingsIcon, Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'games': return <Games />;
      case 'agenda': return <TrainingLog />;
      case 'friends': return <Friends />;
      case 'tournaments': return <Tournaments />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} className="spin" color="var(--primary)" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ justifyContent: 'center', position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <Flag size={20} fill="white" />
          </div>
          GOLF
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: activeTab === 'settings' ? 'var(--primary)' : '#888', cursor: 'pointer' }}
        >
          <SettingsIcon size={24} />
        </button>
      </nav>

      <main className="container" style={{ paddingTop: '1.5rem', marginBottom: '8rem', flex: 1 }}>
        <SubscriptionProvider>
          <div className="fade-in" key={activeTab}>
            {renderContent()}
          </div>
        </SubscriptionProvider>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <footer style={{ marginBottom: '6rem', padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
        <p>© 2026 Golf Premium. Juega con confianza.</p>
      </footer>
    </div>
  );
}

export default App;
