import React from 'react';
import { LayoutDashboard, Trophy, BookOpen, Calendar as CalendarIcon } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
        { id: 'games', label: 'Partidas', icon: Trophy },
        { id: 'agenda', label: 'Agenda', icon: BookOpen },
        { id: 'tournaments', label: 'Torneos', icon: CalendarIcon }
    ];

    return (
        <div className="bottom-nav-container" style={{
            position: 'fixed',
            bottom: '2.5rem',
            left: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)',
            borderRadius: '24px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0.5rem',
            zIndex: 2000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.2)'
        }}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '0.75rem 0.5rem',
                        flex: 1,
                        cursor: 'pointer',
                        borderRadius: '16px'
                    }}
                >
                    <div style={{
                        padding: '0.4rem',
                        borderRadius: '12px',
                        background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                        color: activeTab === tab.id ? 'white' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    </div>
                    <span style={{
                        fontSize: '0.6rem',
                        fontWeight: activeTab === tab.id ? 800 : 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        opacity: activeTab === tab.id ? 1 : 0.7
                    }}>
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
