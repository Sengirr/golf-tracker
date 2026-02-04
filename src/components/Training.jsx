import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Clock, Target, Dumbbell } from 'lucide-react';

export default function Training() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        training_type: 'Driving Range',
        duration_mins: '',
        focus: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    async function fetchSessions() {
        setLoading(true);
        const { data, error } = await supabase
            .from('trainings')
            .select('*')
            .order('date', { ascending: false });

        if (error) console.error('Error:', error);
        else setSessions(data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const { error } = await supabase.from('trainings').insert([formData]);
        if (error) alert('Error saving session');
        else {
            setShowForm(false);
            setFormData({ training_type: 'Driving Range', duration_mins: '', focus: '', date: new Date().toISOString().split('T')[0] });
            fetchSessions();
        }
    }

    async function deleteSession(id) {
        if (confirm('Are you sure you want to delete this session?')) {
            const { error } = await supabase.from('trainings').delete().eq('id', id);
            if (error) alert('Error deleting session');
            else fetchSessions();
        }
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Training Logs</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Master the game through consistent practice.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> {showForm ? 'Cancel' : 'Record Session'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>Log New Session</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2">
                        <div className="input-group">
                            <label>Activity Type</label>
                            <select
                                value={formData.training_type}
                                onChange={e => setFormData({ ...formData, training_type: e.target.value })}
                            >
                                <option value="Driving Range">Driving Range</option>
                                <option value="Putting Green">Putting Green</option>
                                <option value="Chipping Arena">Chipping Arena</option>
                                <option value="Bunker Practice">Bunker Practice</option>
                                <option value="Full Round Practice">Full Round Practice</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Duration (Minutes)</label>
                            <input
                                type="number"
                                required
                                value={formData.duration_mins}
                                onChange={e => setFormData({ ...formData, duration_mins: e.target.value })}
                                placeholder="60"
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
                            <label>Focus / Goals</label>
                            <input
                                type="text"
                                value={formData.focus}
                                onChange={e => setFormData({ ...formData, focus: e.target.value })}
                                placeholder="e.g. Iron consistency, Short game"
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Save Session</button>
                    </form>
                </div>
            )}

            <div className="grid">
                {loading ? (
                    <p>Loading your sessions...</p>
                ) : sessions.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No training sessions recorded. Practice brings results!</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ background: 'var(--accent)', color: 'var(--primary-dark)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <Dumbbell size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{session.training_type}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {session.duration_mins} mins</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Target size={14} /> {session.focus || 'General practice'}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteSession(session.id)}
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
