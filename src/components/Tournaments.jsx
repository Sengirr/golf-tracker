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
        if (error) alert('Error saving tournament');
        else {
            setShowForm(false);
            setFormData({ name: '', course: '', date: new Date().toISOString().split('T')[0], status: 'Interested' });
            fetchTournaments();
        }
    }

    async function deleteTournament(id) {
        if (confirm('Are you sure you want to delete this tournament?')) {
            const { error } = await supabase.from('tournaments').delete().eq('id', id);
            if (error) alert('Error deleting tournament');
            else fetchTournaments();
        }
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Registered': return { background: '#d8f3dc', color: '#1b4332' };
            case 'Completed': return { background: '#e9ecef', color: '#6c757d' };
            default: return { background: '#fff3b0', color: '#856404' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Tournament Schedule</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Plan your competitive season.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> {showForm ? 'Cancel' : 'Add Tournament'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>Add New Tournament</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2">
                        <div className="input-group">
                            <label>Tournament Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Amateur Open"
                            />
                        </div>
                        <div className="input-group">
                            <label>Course</label>
                            <input
                                type="text"
                                required
                                value={formData.course}
                                onChange={e => setFormData({ ...formData, course: e.target.value })}
                                placeholder="e.g. St Andrews"
                            />
                        </div>
                        <div className="input-group">
                            <label>Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Interested">Interested</option>
                                <option value="Registered">Registered</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Save Tournament</button>
                    </form>
                </div>
            )}

            <div className="grid">
                {loading ? (
                    <p>Loading schedule...</p>
                ) : tournaments.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No tournaments scheduled. Dream big, play bigger!</p>
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
