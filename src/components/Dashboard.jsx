import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Target, Calendar, Clock, Plus, BarChart3, MapPin } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
    const [stats, setStats] = useState({
        avgScore: 0,
        totalRounds: 0,
        trainingHours: 0,
        avgTriputts: 0,
        nextTournament: null
    });
    const [loading, setLoading] = useState(true);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        setLoading(true);
        try {
            const { data: rounds } = await supabase.from('rounds').select('score, triputts');
            const { data: training } = await supabase.from('trainings').select('duration_mins');
            const { data: tourns, count: tournCount } = await supabase.from('tournaments')
                .select('*', { count: 'exact' })
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date', { ascending: true })
                .limit(1);

            const avg = rounds?.length > 0
                ? Math.round(rounds.reduce((acc, r) => acc + r.score, 0) / rounds.length)
                : 'N/A';

            const avgTri = rounds?.length > 0
                ? (rounds.reduce((acc, r) => acc + (r.triputts || 0), 0) / rounds.length).toFixed(1)
                : '0';

            const hours = training?.length > 0
                ? Math.round(training.reduce((acc, t) => acc + t.duration_mins, 0) / 60)
                : 0;

            setStats({
                avgScore: avg,
                totalRounds: rounds?.length || 0,
                trainingHours: hours,
                avgTriputts: avgTri,
                nextTournament: tourns?.[0] || null
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }

    const statCards = [
        { label: 'Puntuación Media', value: stats.avgScore || 'N/A', icon: Target, color: '#386641' },
        { label: 'Total Partidas', value: stats.totalRounds, icon: Trophy, color: '#6a994e' },
        { label: 'Horas de Entreno', value: stats.trainingHours, icon: Clock, color: '#a7c957' },
    ];

    return (
        <div className="fade-in">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <h1>Bienvenido de nuevo</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Aquí tienes un resumen de tu rendimiento.</p>
                </div>
                <button className="btn-primary" onClick={() => setActiveTab('games')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                    <Plus size={20} /> Nueva Partida
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
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: `#bc474915`, color: '#bc4749' }}>
                        <Target size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Triputts Medios</p>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: stats.avgTriputts > 2 ? '#bc4749' : 'inherit' }}>{stats.avgTriputts}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <BarChart3 size={20} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>Actividad Reciente</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            Tus partidas y entrenamientos aparecerán aquí.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white' }}>
                    <h3 style={{ color: 'white' }}>Próximo Torneo</h3>
                    {stats.nextTournament ? (
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.25rem', borderRadius: '12px', marginTop: '1rem' }}>
                            <p style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{stats.nextTournament.name}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> {stats.nextTournament.course}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> {formatDate(stats.nextTournament.date)}</span>
                            </div>
                            <button
                                className="btn-primary"
                                onClick={() => setActiveTab('tournaments')}
                                style={{ marginTop: '1.5rem', background: 'white', color: 'var(--primary)', width: '100%' }}
                            >
                                Ver todos
                            </button>
                        </div>
                    ) : (
                        <>
                            <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
                                No tienes torneos programados próximamente. ¡Es hora de apuntarse a uno!
                            </p>
                            <button
                                className="btn-primary"
                                onClick={() => setActiveTab('tournaments')}
                                style={{ background: 'white', color: 'var(--primary)', width: '100%' }}
                            >
                                Buscar Torneos
                            </button>
                        </>
                    )}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', opacity: 0.8 }}><strong>Consejo:</strong> El 60% de los golpes se realizan a menos de 100 yardas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
