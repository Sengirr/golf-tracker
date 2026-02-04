import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        course: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Interested'
    });

    useEffect(() => {
        fetchTournaments();
    }, []);

    async function fetchTournaments() {
        setLoading(true);
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('date', { ascending: true });

        if (error) console.error('Error:', error);
        else setTournaments(data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const { error } = await supabase.from('tournaments').insert([formData]);
        if (error) alert('Error al guardar el torneo');
        else {
            setShowForm(false);
            setFormData({ name: '', course: '', date: new Date().toISOString().split('T')[0], status: 'Interesado' });
            fetchTournaments();
        }
    }

    async function deleteTournament(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este torneo?')) {
            const { error } = await supabase.from('tournaments').delete().eq('id', id);
            if (error) alert('Error al eliminar el torneo');
            else fetchTournaments();
        }
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Inscrito': return { background: '#d8f3dc', color: '#1b4332' };
            case 'Completado': return { background: '#e9ecef', color: '#6c757d' };
            default: return { background: '#fff3b0', color: '#856404' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Calendario de Torneos</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Planifica tu temporada competitiva.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> {showForm ? 'Cancelar' : 'Añadir Torneo'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>Añadir Nuevo Torneo</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2">
                        <div className="input-group">
                            <label>Nombre del Torneo</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="ej. Campeonato Amateur"
                            />
                        </div>
                        <div className="input-group">
                            <label>Campo</label>
                            <input
                                type="text"
                                required
                                value={formData.course}
                                onChange={e => setFormData({ ...formData, course: e.target.value })}
                                placeholder="ej. Valderrama"
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
                        <div className="input-group">
                            <label>Estado</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Interesado">Interesado</option>
                                <option value="Inscrito">Inscrito</option>
                                <option value="Completado">Completado</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Guardar Torneo</button>
                    </form>
                </div>
            )}

            <div className="grid">
                {loading ? (
                    <p>Cargando calendario...</p>
                ) : tournaments.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No hay torneos programados. ¡Sueña en grande!</p>
                    </div>
                ) : (
                    tournaments.map(tourney => (
                        <div key={tourney.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ background: '#bc4749', color: 'white', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{tourney.name}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {tourney.course}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {tourney.date}</span>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            ...getStatusStyle(tourney.status)
                                        }}>
                                            {tourney.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteTournament(tourney.id)}
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
