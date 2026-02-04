import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Games from './components/Games';
import Training from './components/Training';
import Tournaments from './components/Tournaments';
import { supabase } from './lib/supabase';
import { LayoutDashboard, Trophy, Dumbbell, Calendar as CalendarIcon, Flag } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'games', label: 'Partidas', icon: Trophy },
    { id: 'training', label: 'Entrenos', icon: Dumbbell },
    { id: 'tournaments', label: 'Torneos', icon: CalendarIcon }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'games': return <Games />;
      case 'training': return <Training />;
      case 'tournaments': return <Tournaments />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="fade-in">
      <header className="mobile-only-header" style={{ padding: '1rem 1.5rem', background: 'white', display: 'none', justifyContent: 'center', borderBottom: '1px solid #eee' }}>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem' }}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <Flag size={20} fill="white" />
          </div>
          GOLFTRACKER
        </div>
      </header>

      <nav>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem' }}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <Flag size={20} fill="white" />
          </div>
          GOLFTRACKER
        </div>
        <div className="nav-links">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href="#"
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </a>
          ))}
        </div>
      </nav>

      <main className="container">
        {renderContent()}
      </main>

      <footer style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', borderTop: '1px solid #e0e0e0', color: 'var(--text-muted)' }}>
        <p>© 2026 GolfTracker Premium. Juega con confianza.</p>
      </footer>
    </div>
  );
}

export default App;
