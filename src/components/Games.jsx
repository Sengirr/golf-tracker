import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Calendar, MapPin, Hash, Camera, Sparkles } from 'lucide-react';
import { SCORECARDS, getPHCP, calculateStableford } from '../lib/golfUtils';

export default function Games() {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRound, setSelectedRound] = useState(null);
    const [formData, setFormData] = useState({
        course_name: 'Benalmádena Golf',
        score: '',
        holes_played: 9,
        triputts: 0,
        player_hcp: parseFloat(localStorage.getItem('current_hcp')) || 40.9,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        hole_data: Array(9).fill({ strokes: 3, putts: 2, fir: true, gir: false, lost_balls: 0 }),
        participants: []
    });
    const [friends, setFriends] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [openSessions, setOpenSessions] = useState([]); // Sessions to join

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    useEffect(() => {
        fetchRounds();
        fetchFriends();
        fetchOpenSessions();
    }, []);

    async function fetchOpenSessions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch active sessions from friends
        const friendIds = friends.map(f => f.id);
        const { data } = await supabase
            .from('game_sessions')
            .select(`
                id, 
                course_name, 
                host:host_id(username)
            `)
            .eq('status', 'active')
            .neq('host_id', user.id);
        // In a real app we would filter by friends, for simplicity we show all active for now

        if (data) setOpenSessions(data);
    }

    async function fetchFriends() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('friendships')
            .select(`
                friend:friend_id(id, username),
                user:user_id(id, username)
            `)
            .eq('status', 'accepted')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (data) {
            const friendList = data.map(f => f.user.id === user.id ? f.friend : f.user);
            setFriends(friendList);
        }
    }

    async function fetchRounds() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('rounds')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) console.error('Error:', error);
        else setRounds(data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let sessionId = null;

        // If friends are selected, create a shared session
        if (formData.participants.length > 0) {
            const { data: sessionData, error: sessionError } = await supabase
                .from('game_sessions')
                .insert([{
                    host_id: user.id,
                    course_name: formData.course_name,
                    status: 'active'
                }])
                .select()
                .single();

            if (sessionError) {
                console.error('Error creating session:', sessionError);
            } else {
                sessionId = sessionData.id;
            }
        }

        const totalStrokes = formData.hole_data.reduce((acc, h) => acc + (parseInt(h.strokes) || 0), 0);
        const totalTriputts = formData.hole_data.reduce((acc, h) => acc + (parseInt(h.putts) >= 3 ? 1 : 0), 0);
        const hcp = parseFloat(formData.player_hcp) || 40.9;
        const points = calculateStableford(formData.hole_data, hcp, formData.course_name);
        const totalLostBalls = formData.hole_data.reduce((acc, h) => acc + (parseInt(h.lost_balls) || 0), 0);
        const totalPutts = formData.hole_data.reduce((acc, h) => acc + (parseInt(h.putts) || 0), 0);

        const { error } = await supabase.from('rounds').insert([{
            user_id: user.id,
            course_name: formData.course_name || 'Benalmádena Golf',
            score: totalStrokes,
            holes_played: parseInt(formData.holes_played) || 9,
            triputts: totalTriputts,
            player_hcp: hcp,
            stableford_points: points,
            total_putts: totalPutts,
            total_lost_balls: totalLostBalls,
            hole_data: formData.hole_data,
            date: formData.date,
            notes: formData.notes || '',
            shared_session_id: sessionId
        }]);

        if (error) {
            alert(`Error al guardar la partida: ${error.message}`);
        } else {
            setShowForm(false);
            setFormData({
                course_name: 'Benalmádena Golf',
                score: '',
                holes_played: 9,
                triputts: 0,
                player_hcp: parseFloat(localStorage.getItem('current_hcp')) || 40.9,
                date: new Date().toISOString().split('T')[0],
                notes: '',
                hole_data: Array(9).fill({ strokes: 3, putts: 2, fir: true, gir: false, lost_balls: 0 }),
                participants: []
            });
            fetchRounds();
        }
    }

    async function handleSimulateScan() {
        const scorecard = SCORECARDS[formData.course_name] || SCORECARDS['Benalmádena Golf'];
        const simulatedHoles = scorecard.pars.map((par, i) => ({
            strokes: par + (Math.random() > 0.7 ? 1 : 0),
            putts: Math.floor(Math.random() * 3) + 1,
            fir: Math.random() > 0.4,
            gir: Math.random() > 0.5,
            lost_balls: Math.random() > 0.8 ? 1 : 0
        }));
        setFormData({ ...formData, hole_data: simulatedHoles });
        alert('IA Vision: Se han extraído los datos de la tarjeta con éxito.');
    }

    async function deleteRound(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta partida?')) {
            const { error } = await supabase.from('rounds').delete().eq('id', id);
            if (error) alert('Error al eliminar la partida');
            else fetchRounds();
        }
    }

    const LiveLeaderboard = ({ sessionId, onClose }) => {
        const [sessionRounds, setSessionRounds] = useState([]);

        useEffect(() => {
            if (!sessionId) return;
            fetchSessionRounds();

            const channel = supabase
                .channel(`session-${sessionId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'rounds',
                    filter: `shared_session_id=eq.${sessionId}`
                }, () => {
                    fetchSessionRounds();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }, [sessionId]);

        async function fetchSessionRounds() {
            const { data } = await supabase
                .from('rounds')
                .select(`
                    id, 
                    score, 
                    player_hcp, 
                    stableford_points,
                    profiles:user_id(username)
                `)
                .eq('shared_session_id', sessionId);

            if (data) setSessionRounds(data);
        }

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.85)', zIndex: 10000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={24} color="var(--primary)" /> Marcador Vivo
                        </h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {sessionRounds.sort((a, b) => b.stableford_points - a.stableford_points).map((r, idx) => (
                            <div key={r.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1rem', borderRadius: '12px',
                                background: idx === 0 ? '#fffef2' : '#f9f9f9',
                                border: idx === 0 ? '2px solid #ffd700' : '1px solid #eee'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: idx === 0 ? '#daa520' : '#888' }}>#{idx + 1}</span>
                                    <span style={{ fontWeight: 700 }}>{r.profiles?.username || 'Invitado'}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>STABLEFORD</span>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{r.stableford_points} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn-primary" onClick={onClose} style={{ width: '100%', marginTop: '1.5rem' }}>Volver al Juego</button>
                </div>
            </div>
        );
    };

    const RoundDetailModal = ({ round, onClose }) => {
        if (!round) return null;
        const playingHCP = getPHCP(round.player_hcp || 40.9, round.course_name);
        const scorecard = SCORECARDS[round.course_name] || SCORECARDS['Benalmádena Golf'];

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'flex-start', // Changed from center to flex-start
                justifyContent: 'center',
                padding: '1rem',
                paddingTop: '2rem', // Ensure it's not hidden behind the notch/header
                backdropFilter: 'blur(4px)',
                overflowY: 'auto' // Ensure the overlay itself can scroll if needed
            }}>
                <div className="card fade-in" style={{
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '1rem', // Reduced padding
                    background: 'white',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0 }}>Detalle Hoyo a Hoyo</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                    </div>

                    <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>CAMPO</span>
                            <strong>{round.course_name}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>HCP JUEGO</span>
                            <strong>{playingHCP} golpes</strong>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem' }}>H</th>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem' }}>PAR(SI)</th>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem' }}>BRU</th>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem' }}>NET</th>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem' }}>P</th>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem' }} className="mobile-hide">GIR</th>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem' }} className="mobile-hide">B</th>
                                    <th style={{ padding: '0.4rem', fontSize: '0.7rem', textAlign: 'right' }}>PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {round.hole_data.map((hole, idx) => {
                                    const par = scorecard.pars[idx] || 3;
                                    const si = scorecard.si[idx] || 1;

                                    let strokesAllowed = Math.floor(playingHCP / 9);
                                    const extraStrokes = playingHCP % 9;
                                    // Hole 8 (SI 1) is Rank 1, Hole 2 (SI 17) is Rank 9
                                    const siList = [1, 3, 5, 7, 9, 11, 13, 15, 17];
                                    const difficultyRank = siList.indexOf(si) + 1;
                                    if (difficultyRank <= extraStrokes) strokesAllowed += 1;

                                    const netScore = (parseInt(hole.strokes) || 0) - strokesAllowed;
                                    const holePoints = Math.max(0, 2 + par - netScore);

                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{idx + 1}</td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                {par} <small style={{ color: 'var(--text-muted)' }}>({si})</small>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>{hole.strokes}</td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                {netScore}
                                                {strokesAllowed > 0 && Array(strokesAllowed).fill('•').map((dot, i) => (
                                                    <span key={i} style={{ color: 'var(--primary)', marginLeft: '2px', verticalAlign: 'top', fontSize: '1.2rem', lineHeight: '0' }}>.</span>
                                                ))}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>{hole.putts}</td>
                                            <td className="mobile-hide" style={{ padding: '0.75rem 0.5rem' }}>{hole.gir ? '✓' : ''}</td>
                                            <td className="mobile-hide" style={{ padding: '0.75rem 0.5rem' }}>{hole.lost_balls || 0}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                                                {holePoints}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: '2px solid #eee', fontWeight: 800, fontSize: '0.8rem' }}>
                                    <td colSpan="2" style={{ padding: '1rem 0.5rem' }}>TOTAL</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{round.score}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{round.score - playingHCP}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{round.total_putts || round.hole_data.reduce((acc, h) => acc + (parseInt(h.putts) || 0), 0)}</td>
                                    <td className="mobile-hide" style={{ padding: '1rem 0.5rem' }}>{round.hole_data.filter(h => h.gir).length}</td>
                                    <td className="mobile-hide" style={{ padding: '1rem 0.5rem' }}>{round.total_lost_balls || round.hole_data.reduce((acc, h) => acc + (parseInt(h.lost_balls) || 0), 0)}</td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                        {calculateStableford(round.hole_data, round.player_hcp, round.course_name)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <button className="btn-primary" onClick={onClose} style={{ width: '100%', marginTop: '1.5rem' }}>Cerrar</button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1>Historial de Juego</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Registra cada golpe y cada campo.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                    <Plus size={20} /> {showForm ? 'Cancelar' : 'Registrar Partida'}
                </button>
            </div>

            {openSessions.length > 0 && !showForm && (
                <div className="card" style={{ marginBottom: '2rem', background: '#fffef2', border: '2px solid #ffd700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Sparkles size={24} color="#daa520" />
                        <h3 style={{ margin: 0 }}>¡Hay una partida en vivo!</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {openSessions.map(session => (
                            <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong>{session.host?.username}</strong> jugando en <strong>{session.course_name}</strong>
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                    onClick={() => {
                                        setFormData({ ...formData, shared_session_id: session.id, course_name: session.course_name });
                                        setShowForm(true);
                                        setActiveSession(session.id);
                                    }}
                                >
                                    Unirse
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                        <button
                            type="button"
                            onClick={handleSimulateScan}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #c8e6c9', fontWeight: 600, fontSize: '0.875rem' }}
                        >
                            <Camera size={18} /> Simular Escaneo IA
                        </button>
                    </div>

                    <h3>Registrar Nueva Partida (Hoyo a Hoyo)</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2">
                            <div className="input-group">
                                <label>Campo de Golf</label>
                                <select
                                    required
                                    value={formData.course_name}
                                    onChange={e => setFormData({ ...formData, course_name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                >
                                    {Object.keys(SCORECARDS).map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Tu HCP (Hándicap)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.player_hcp}
                                    onChange={e => setFormData({ ...formData, player_hcp: e.target.value })}
                                    placeholder="ej. 24.5"
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2', marginBottom: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                                    <Sparkles size={18} color="var(--primary)" /> Jugar con Amigos (Partida Compartida)
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {friends.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Añade amigos en la pestaña "Amigos" para jugar juntos.</p>
                                    ) : (
                                        friends.map(friend => (
                                            <button
                                                key={friend.id}
                                                type="button"
                                                onClick={() => {
                                                    const isSelected = formData.participants.includes(friend.id);
                                                    const newParticipants = isSelected
                                                        ? formData.participants.filter(id => id !== friend.id)
                                                        : [...formData.participants, friend.id];
                                                    setFormData({ ...formData, participants: newParticipants });
                                                }}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '20px',
                                                    border: '1px solid',
                                                    borderColor: formData.participants.includes(friend.id) ? 'var(--primary)' : '#eee',
                                                    background: formData.participants.includes(friend.id) ? 'var(--primary)' : 'white',
                                                    color: formData.participants.includes(friend.id) ? 'white' : 'var(--text-muted)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {friend.username}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Registro por Hoyo ({formData.course_name})</h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f5f5f5' }}>
                                                <th style={{ padding: '0.5rem' }}>H</th>
                                                <th style={{ padding: '0.5rem' }}>Golpes</th>
                                                <th style={{ padding: '0.5rem' }}>Putts</th>
                                                <th style={{ padding: '0.5rem' }}>GIR</th>
                                                <th style={{ padding: '0.5rem' }}>Bolas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.hole_data.map((hole, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={hole.strokes}
                                                            onChange={e => {
                                                                const newData = [...formData.hole_data];
                                                                newData[idx] = { ...hole, strokes: e.target.value };
                                                                setFormData({ ...formData, hole_data: newData });
                                                            }}
                                                            style={{ width: '60px', padding: '0.25rem' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={hole.putts}
                                                            onChange={e => {
                                                                const newData = [...formData.hole_data];
                                                                newData[idx] = { ...hole, putts: e.target.value };
                                                                setFormData({ ...formData, hole_data: newData });
                                                            }}
                                                            style={{ width: '60px', padding: '0.25rem' }}
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={hole.gir}
                                                            onChange={e => {
                                                                const newData = [...formData.hole_data];
                                                                newData[idx] = { ...hole, gir: e.target.checked };
                                                                setFormData({ ...formData, hole_data: newData });
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={hole.lost_balls}
                                                            onChange={e => {
                                                                const newData = [...formData.hole_data];
                                                                newData[idx] = { ...hole, lost_balls: e.target.value };
                                                                setFormData({ ...formData, hole_data: newData });
                                                            }}
                                                            style={{ width: '60px', padding: '0.25rem' }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Notas / Sensaciones</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="ej. Muy bien con el driver, pero fallando putts cortos"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 2 }}>Guardar Partida</button>
                            {(activeSession || formData.participants.length > 0) && (
                                <button
                                    type="button"
                                    onClick={() => setActiveSession(activeSession || 'pending')}
                                    className="btn-primary"
                                    style={{ flex: 1, background: 'var(--accent)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Sparkles size={18} /> Ver Líderes
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="grid">
                {loading ? (
                    <p>Cargando historial...</p>
                ) : rounds.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Aún no hay partidas registradas. ¡Es hora de salir al campo!</p>
                    </div>
                ) : (
                    rounds.map(round => (
                        <div key={round.id} className="card flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, width: '100%' }}>
                                <div style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    width: '70px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }} onClick={() => setSelectedRound(round)}>
                                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', width: '100%', padding: '0.3rem 0.2rem' }}>
                                        <span style={{ fontSize: '0.55rem', fontWeight: 600, display: 'block', opacity: 0.8 }}>BRUTOS</span>
                                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>{round.score}</span>
                                    </div>
                                    <div style={{ width: '100%', padding: '0.3rem 0.2rem', background: 'rgba(255,255,255,0.1)' }}>
                                        <span style={{ fontSize: '0.55rem', fontWeight: 600, display: 'block', opacity: 0.8 }}>NETOS</span>
                                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                                            {round.score - getPHCP(round.player_hcp || 40.9)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{round.course_name}</h3>
                                        <button
                                            onClick={() => setSelectedRound(round)}
                                            style={{ background: 'var(--accent)', color: 'var(--primary-dark)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: 'none', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            DETALLE
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Calendar size={12} /> {formatDate(round.date)}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }} className="mobile-hide"><Hash size={12} /> {round.holes_played} hoyos</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: round.triputts > 2 ? '#bc4749' : 'inherit' }}>
                                            <strong>P:</strong> {round.total_putts || 0}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <strong>GIR:</strong> {round.hole_data?.filter(h => h.gir).length || 0}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#386641' }}>
                                            <strong>{round.stableford_points}</strong> pts
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => deleteRound(round.id)}
                                    style={{ background: 'none', color: '#ff4d4d', padding: '0.5rem', border: 'none', cursor: 'pointer' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedRound && <RoundDetailModal round={selectedRound} onClose={() => setSelectedRound(null)} />}
            {activeSession && <LiveLeaderboard sessionId={activeSession} onClose={() => setActiveSession(null)} />}
        </div>
    );
}
