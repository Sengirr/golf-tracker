import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Target, Calendar, Clock, Plus, BarChart3 } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
    const [stats, setStats] = useState({
        avgScore: 0,
        totalRounds: 0,
        trainingHours: 0,
        upcomingTournaments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        setLoading(true);
        try {
            const { data: rounds } = await supabase.from('rounds').select('score');
            const { data: training } = await supabase.from('trainings').select('duration_mins');
            const { count: tournCount } = await supabase.from('tournaments')
                .select('*', { count: 'exact', head: true })
                .gte('date', new Date().toISOString().split('T')[0]);

            const avg = rounds?.length > 0
                ? Math.round(rounds.reduce((acc, r) => acc + r.score, 0) / rounds.length)
                : 0;

            const hours = training?.length > 0
                ? Math.round(training.reduce((acc, t) => acc + t.duration_mins, 0) / 60)
                : 0;

            setStats({
                avgScore: avg,
                totalRounds: rounds?.length || 0,
                trainingHours: hours,
                upcomingTournaments: tournCount || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }

    const statCards = [
        { label: 'Average Score', value: stats.avgScore || 'N/A', icon: Target, color: '#386641' },
        { label: 'Total Rounds', value: stats.totalRounds, icon: Trophy, color: '#6a994e' },
        { label: 'Training Hours', value: stats.trainingHours, icon: Clock, color: '#a7c957' },
        { label: 'Upcoming', value: stats.upcomingTournaments, icon: Calendar, color: '#bc4749' }
    ];

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Welcome back, Golfer</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Here's your performance overview.</p>
                </div>
                <button className="btn-primary" onClick={() => setActiveTab('games')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> New Round
                </button>
            </div>

            <div className="grid grid-cols-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '3rem' }}>
                {statCards.map((stat, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: `${stat.color}15`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</p>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{stat.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <BarChart3 size={20} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>Recent Activity</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            Logged rounds and training sessions will appear here.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white' }}>
                    <h3 style={{ color: 'white' }}>Golf Mastery Tip</h3>
                    <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
                        "Focus on your short game. 60% of your shots are made within 100 yards of the green."
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Next Tournament</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{stats.upcomingTournaments > 0 ? 'View Schedule' : 'No tournaments scheduled'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
