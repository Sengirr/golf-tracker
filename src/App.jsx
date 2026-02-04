import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Games from './components/Games';
import Tournaments from './components/Tournaments';
import TrainingLog from './components/TrainingLog';
import BottomNav from './components/BottomNav';
import { supabase } from './lib/supabase';
import { LayoutDashboard, Trophy, Dumbbell, Calendar as CalendarIcon, Flag, BookOpen } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'games', label: 'Partidas', icon: Trophy },
    { id: 'agenda', label: 'Agenda', icon: BookOpen },
    { id: 'tournaments', label: 'Torneos', icon: CalendarIcon }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'games': return <Games />;
      case 'agenda': return <TrainingLog />;
      case 'tournaments': return <Tournaments />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      <nav style={{ justifyContent: 'center', position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <Flag size={20} fill="white" />
          </div>
          GOLFTRACKER
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '1.5rem', marginBottom: '4rem' }}>
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <footer style={{ marginTop: '2rem', padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
        <p>© 2026 GolfTracker Premium. Juega con confianza.</p>
        <div style={{ height: '100px' }}></div> {/* Spacer for floating nav */}
      </footer>
    </div>
  );
}

export default App;
