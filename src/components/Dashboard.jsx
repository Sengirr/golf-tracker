import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Target, Calendar, Clock, Plus, BarChart3, MapPin, Sparkles, TrendingDown, MessageSquare, Camera } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
    const [stats, setStats] = useState({
        avgScore: 0,
        totalRounds: 0,
        trainingHours: 0,
        avgTriputts: 0,
        avgStableford: 0,
        aiRecommendation: '',
        hcpPrediction: '',
        nextTournament: null
    });
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [hcpSettings, setHcpSettings] = useState({
        current: parseFloat(localStorage.getItem('current_hcp')) || 40.9,
        target: parseFloat(localStorage.getItem('target_hcp')) || 36.0
    });
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'caddie', text: '¡Hola! Soy tu Caddie IA. ¿En qué puedo ayudarte hoy? Pulsa uno de los temas o escribe tu duda.' }
    ]);

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
            const { data: rounds } = await supabase.from('rounds').select('score, triputts, stableford_points');
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

            const avgStable = rounds?.length > 0
                ? Math.round(rounds.reduce((acc, r) => acc + (r.stableford_points || 0), 0) / rounds.length)
                : 0;

            const hours = training?.length > 0
                ? Math.round(training.reduce((acc, t) => acc + t.duration_mins, 0) / 60)
                : 0;

            // AI Logic - Analyzing trends
            let recommendation = "¡Sigue así! Estás cogiendo ritmo.";
            const avgScoreNum = rounds?.length > 0 ? (rounds.reduce((acc, r) => acc + r.score, 0) / rounds.length) : 0;

            if (avgTri > 2.5) {
                recommendation = "La IA detecta fatiga en el green. Dedica los próximos 3 entrenos exclusivamente a putts de 2 metros.";
            } else if (avgScoreNum > 90) {
                recommendation = "Tu puntuación es estable, pero podrías bajar 5 golpes si mejoras la precisión desde el tee en el hoyo 5.";
            } else if (rounds?.length < 3) {
                recommendation = "Necesito 3 partidas más para darte consejos técnicos precisos. ¡Sal al campo!";
            }

            // HCP Prediction logic
            const currentHCP = hcpSettings.current;
            const hcpGoal = (avgStable > 18) ? (currentHCP - (avgStable - 18) * 0.5).toFixed(1) : currentHCP;
            const predictionText = avgStable > 18
                ? `Si mantienes este nivel, tu HCP bajará a ${hcpGoal} en tu próxima competición.`
                : "Mantén la constancia en el campo para empezar a bajar tu handicap.";

            setStats({
                avgScore: avg,
                totalRounds: rounds?.length || 0,
                trainingHours: hours,
                avgTriputts: avgTri,
                avgStableford: avgStable,
                aiRecommendation: recommendation,
                hcpPrediction: predictionText,
                nextTournament: tourns?.[0] || null
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleSendMessage = (e, presetText = null) => {
        if (e) e.preventDefault();
        const text = presetText || chatInput;
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setChatInput('');

        // Simple AI logic
        setTimeout(() => {
            let response = "Interesante pregunta. Como tu caddie, te recomiendo enfocarte en mantener un ritmo suave y confiar en tu swing.";
            const lowerText = text.toLowerCase();
            if (lowerText.includes('benalmadena') || lowerText.includes('campo')) {
                response = "Benalmádena Pitch & Putt es muy técnico. La clave está en no pasarse de los greens, que son pequeños y rápidos. ¡Mejor corto que largo!";
            } else if (lowerText.includes('putt') || lowerText.includes('green')) {
                response = "Para evitar los triputts, visualiza una zona de 1 metro alrededor del hoyo. Tu objetivo en el primer putt es simplemente dejarla en esa zona.";
            } else if (lowerText.includes('hcp') || lowerText.includes('hándicap')) {
                response = "Con tu HCP de 40.9, tienes 2 golpes extra por hoyo. No arriesgues; el bogey es tu amigo para bajar el handicap.";
            }
            setMessages([...newMessages, { role: 'caddie', text: response }]);
        }, 600);
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        localStorage.setItem('current_hcp', hcpSettings.current);
        localStorage.setItem('target_hcp', hcpSettings.target);
        setShowSettings(false);
        fetchStats(); // Refresh prediction
    };

    const statCards = [
        { label: 'Puntuación Media', value: stats.avgScore || 'N/A', icon: Target, color: '#386641' },
        { label: 'Total Partidas', value: stats.totalRounds, icon: Trophy, color: '#6a994e' },
        { label: 'Horas de Entreno', value: stats.trainingHours, icon: Clock, color: '#a7c957' },
        { label: 'Media Stableford', value: `${stats.avgStableford} pts`, icon: BarChart3, color: '#1b4332' }
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
                    <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: stat.label === 'Media Stableford' ? 'var(--primary)' : 'var(--glass)', color: stat.label === 'Media Stableford' ? 'white' : 'inherit' }}>
                        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: stat.label === 'Media Stableford' ? 'rgba(255,255,255,0.2)' : `${stat.color}15`, color: stat.label === 'Media Stableford' ? 'white' : stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: stat.label === 'Media Stableford' ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>{stat.label}</p>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{stat.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {/* AI Caddie Card */}
                <div className="card" style={{ border: '2px solid var(--accent)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <Sparkles size={100} color="var(--accent)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'var(--accent)', color: 'var(--primary-dark)', padding: '0.5rem', borderRadius: '8px' }}>
                            <Sparkles size={20} />
                        </div>
                        <h3 style={{ margin: 0 }}>AI Caddie - Consejos</h3>
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.5, color: 'var(--primary-dark)' }}>
                        "{stats.aiRecommendation}"
                    </p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button className="btn-link" onClick={() => setActiveTab('games')} style={{ fontSize: '0.8rem', padding: '0.5rem', background: '#e8f5e9' }}>
                            <Camera size={14} style={{ marginRight: '4px' }} /> Escanear Tarjeta
                        </button>
                        <button className="btn-link" onClick={() => setShowChat(true)} style={{ fontSize: '0.8rem', padding: '0.5rem', background: '#e3f2fd' }}>
                            <MessageSquare size={14} style={{ marginRight: '4px' }} /> Hablar con Caddie
                        </button>
                    </div>
                </div>

                {/* HCP Predictor Card */}
                <div className="card" style={{ background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: '#e3f2fd', color: '#1976d2', padding: '0.5rem', borderRadius: '8px' }}>
                                <TrendingDown size={20} />
                            </div>
                            <h3 style={{ margin: 0 }}>Predictor de HCP</h3>
                        </div>
                        <button
                            onClick={() => setShowSettings(true)}
                            style={{ background: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            Editar Objetivos
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ACTUAL</p>
                            <h2 style={{ margin: 0, color: 'var(--primary)' }}>{hcpSettings.current}</h2>
                        </div>
                        <div style={{ flex: 1, height: '4px', background: '#eee', borderRadius: '2px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, Math.max(0, (45 - hcpSettings.current) * 4))}%`, background: 'var(--accent)', borderRadius: '2px' }}></div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>OBJETIVO</p>
                            <h2 style={{ margin: 0, color: 'var(--accent)' }}>{hcpSettings.target}</h2>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {stats.hcpPrediction}
                    </p>
                </div>

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
            {/* Settings Modal */}
            {showSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Configuración de Objetivos</h3>
                            <button onClick={() => setShowSettings(false)} style={{ background: 'none', color: 'var(--text)', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveSettings}>
                            <div className="input-group">
                                <label>Hándicap Actual</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={hcpSettings.current}
                                    onChange={(e) => setHcpSettings({ ...hcpSettings, current: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Hándicap Objetivo</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={hcpSettings.target}
                                    onChange={(e) => setHcpSettings({ ...hcpSettings, target: parseFloat(e.target.value) })}
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }}>
                                Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Strategy Chat Modal */}
            {showChat && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', z- index: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Sparkles size={18} />
                        <h3 style={{ margin: 0, color: 'white' }}>Caddie IA Estratega</h3>
                    </div>
                    <button onClick={() => setShowChat(false)} style={{ background: 'none', color: 'white', fontSize: '1.5rem' }}>&times;</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            background: m.role === 'user' ? 'var(--primary)' : '#f0f0f0',
                            color: m.role === 'user' ? 'white' : 'var(--text)',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            maxWidth: '85%',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            {m.text}
                        </div>
                    ))}
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        <button className="btn-link" onClick={() => handleSendMessage(null, "¿Cómo juego en Benalmádena?")} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Estrategia Campo</button>
                        <button className="btn-link" onClick={() => handleSendMessage(null, "¿Cómo bajo mi hándicap?")} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Bajar HCP</button>
                        <button className="btn-link" onClick={() => handleSendMessage(null, "Tengo problemas con el putt")} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Consejo Putt</button>
                    </div>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Escribe tu duda al caddie..."
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>Enviar</button>
                    </form>
                </div>
            </div>
        </div>
        </div >
    );
}
