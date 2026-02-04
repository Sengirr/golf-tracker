import React from 'react';
import { LayoutDashboard, Trophy, BookOpen, Dumbbell, Calendar as CalendarIcon } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
        { id: 'games', label: 'Partidas', icon: Trophy },
        { id: 'agenda', label: 'Agenda', icon: BookOpen },
        { id: 'tournaments', label: 'Torneos', icon: CalendarIcon }
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0.75rem 0.5rem 1.5rem 0.5rem', // Extra bottom padding for safe area
            zIndex: 2000,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
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
                        transition: 'all 0.2s ease',
                        padding: '0.5rem',
                        flex: 1,
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        padding: '0.5rem',
                        borderRadius: '12px',
                        background: activeTab === tab.id ? 'rgba(56, 102, 65, 0.1)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}>
                        <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    </div>
                    <span style={{
                        fontSize: '0.65rem',
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                    }}>
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
