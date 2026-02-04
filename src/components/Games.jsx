import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Calendar, MapPin, Hash } from 'lucide-react';

export default function Games() {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        course_name: '',
        score: '',
        holes_played: 18,
        triputts: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    useEffect(() => {
        fetchRounds();
    }, []);

    async function fetchRounds() {
        setLoading(true);
        const { data, error } = await supabase
            .from('rounds')
            .select('*')
            .order('date', { ascending: false });

        if (error) console.error('Error:', error);
        else setRounds(data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const { error } = await supabase.from('rounds').insert([formData]);
        if (error) alert('Error al guardar la partida');
        else {
            setShowForm(false);
            setFormData({ course_name: '', score: '', holes_played: 18, triputts: 0, date: new Date().toISOString().split('T')[0], notes: '' });
            fetchRounds();
        }
    }

    async function deleteRound(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta partida?')) {
            const { error } = await supabase.from('rounds').delete().eq('id', id);
            if (error) alert('Error al eliminar la partida');
            else fetchRounds();
        }
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1>Historial de Juego</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Registra cada golpe y cada campo.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                    <Plus size={20} /> {showForm ? 'Cancelar' : 'Registrar Partida'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>Nueva Partida</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2">
                        <div className="input-group">
                            <label>Nombre del Campo</label>
                            <input
                                type="text"
                                required
                                value={formData.course_name}
                                onChange={e => setFormData({ ...formData, course_name: e.target.value })}
                                placeholder="ej. Pebble Beach"
                            />
                        </div>
                        <div className="input-group">
                            <label>Puntuación (Golpes)</label>
                            <input
                                type="number"
                                required
                                value={formData.score}
                                onChange={e => setFormData({ ...formData, score: e.target.value })}
                                placeholder="72"
                            />
                        </div>
                        <div className="input-group">
                            <label>Hoyos Jugados</label>
                            <select
                                value={formData.holes_played}
                                onChange={e => setFormData({ ...formData, holes_played: e.target.value })}
                            >
                                <option value={18}>18 Hoyos</option>
                                <option value={9}>9 Hoyos</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Triputts (3-putts)</label>
                            <input
                                type="number"
                                required
                                value={formData.triputts}
                                onChange={e => setFormData({ ...formData, triputts: e.target.value })}
                                placeholder="0"
                            />
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
                            <label>Notas</label>
                            <textarea
                                rows="3"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="¿Cómo fue el juego?"
                            ></textarea>
                        </div>
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Guardar Partida</button>
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
                        <div key={round.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>GOLPES</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{round.score}</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{round.course_name}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {formatDate(round.date)}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Hash size={14} /> {round.holes_played} hoyos</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: round.triputts > 2 ? '#bc4749' : 'inherit' }}>
                                            <strong>Triputts:</strong> {round.triputts || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteRound(round.id)}
                                style={{ background: 'none', color: '#ff4d4d', padding: '0.5rem' }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
