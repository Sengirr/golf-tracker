import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Calendar, MapPin, CheckCircle, Clock, Trophy } from 'lucide-react';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        course: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Interesado',
        result: ''
    });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    async function fetchTournaments() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('golf_tournaments')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        if (error) console.error('Error:', error);
        else setTournaments(data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('golf_tournaments').insert([{
            ...formData,
            user_id: user.id
        }]);

        if (error) alert('Error al guardar el torneo');
        else {
            setShowForm(false);
            setFormData({ name: '', course: '', date: new Date().toISOString().split('T')[0], status: 'Interesado', result: '' });
            fetchTournaments();
        }
    }

    async function updateTournamentResult(id, result) {
        const { error } = await supabase
            .from('golf_tournaments')
            .update({
                result,
                status: 'Completado'
            })
            .eq('id', id);

        if (error) alert('Error al actualizar el resultado');
        else fetchTournaments();
    }

    async function updateTournamentStatus(id, status) {
        const { error } = await supabase
            .from('golf_tournaments')
            .update({ status })
            .eq('id', id);

        if (error) alert('Error al actualizar el estado');
        else fetchTournaments();
    }

    async function deleteTournament(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este torneo?')) {
            const { error } = await supabase.from('golf_tournaments').delete().eq('id', id);
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1>Calendario de Torneos</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Planifica tu temporada competitiva y registra tus éxitos.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
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
                        {formData.status === 'Completado' && (
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Resultado / Posición</label>
                                <input
                                    type="text"
                                    value={formData.result}
                                    onChange={e => setFormData({ ...formData, result: e.target.value })}
                                    placeholder="ej. +2 (Puesto 5º) o 38 puntos"
                                />
                            </div>
                        )}
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
                        <div key={tourney.id} className="card flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, width: '100%' }}>
                                <div style={{
                                    background: tourney.status === 'Completado' ? 'var(--primary)' : '#bc4749',
                                    color: 'white',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}>
                                    <Calendar size={20} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tourney.name}</h3>
                                        {tourney.result && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff3b0', color: '#856404', padding: '2px 6px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
                                                <Trophy size={10} /> {tourney.result}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {tourney.course}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {formatDate(tourney.date)}</span>

                                        <select
                                            value={tourney.status}
                                            onChange={(e) => updateTournamentStatus(tourney.id, e.target.value)}
                                            style={{
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                                ...getStatusStyle(tourney.status)
                                            }}
                                        >
                                            <option value="Interesado">INTERESADO</option>
                                            <option value="Inscrito">INSCRITO</option>
                                            <option value="Completado">COMPLETADO</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', width: '100%', borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.25rem' }} className="mobile-only-header">
                                {tourney.status === 'Completado' && (
                                    <button
                                        onClick={() => {
                                            const res = prompt('Añadir resultado (ej. Top 10, 36pts...):', tourney.result || '');
                                            if (res !== null) updateTournamentResult(tourney.id, res);
                                        }}
                                        style={{ background: 'none', color: 'var(--primary)', padding: '0.4rem', fontWeight: 700, fontSize: '0.7rem' }}
                                    >
                                        {tourney.result ? 'EDITAR' : 'RESULTADO'}
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteTournament(tourney.id)}
                                    style={{ background: 'none', color: '#ff4d4d', padding: '0.4rem' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Desktop only buttons layout */}
                            <div style={{ display: 'flex', gap: '0.5rem' }} className="mobile-hide">
                                {tourney.status === 'Completado' && (
                                    <button
                                        onClick={() => {
                                            const res = prompt('Añadir resultado (ej. Top 10, 36pts...):', tourney.result || '');
                                            if (res !== null) updateTournamentResult(tourney.id, res);
                                        }}
                                        style={{ background: 'none', color: 'var(--primary)', padding: '0.5rem', fontWeight: 700, fontSize: '0.75rem' }}
                                    >
                                        {tourney.result ? 'EDITAR RESULTADO' : 'AÑADIR RESULTADO'}
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteTournament(tourney.id)}
                                    style={{ background: 'none', color: '#ff4d4d', padding: '0.5rem' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
