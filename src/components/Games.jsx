import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Calendar, MapPin, Hash, Camera, Sparkles } from 'lucide-react';

const BENALMADENA_SCORECARD = {
    name: 'Benalmádena Golf',
    holes: 9,
    pars: [3, 3, 3, 3, 3, 3, 3, 3, 3],
    si: [13, 17, 11, 15, 3, 5, 9, 1, 7]
};

export default function Games() {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        course_name: 'Benalmádena Golf',
        score: '',
        holes_played: 9,
        triputts: 0,
        player_hcp: parseFloat(localStorage.getItem('current_hcp')) || 40.9,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        hole_data: Array(9).fill({ strokes: 3, putts: 2, fir: true, gir: false })
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

        let finalData = { ...formData };

        const totalStrokes = formData.hole_data.reduce((acc, h) => acc + (parseInt(h.strokes) || 0), 0);
        const totalTriputts = formData.hole_data.reduce((acc, h) => acc + (parseInt(h.putts) >= 3 ? 1 : 0), 0);

        // Stableford Calculation
        const hcp = parseFloat(formData.player_hcp) || 40.9;
        const points = formData.hole_data.reduce((acc, hole, idx) => {
            const par = BENALMADENA_SCORECARD.pars[idx];
            const si = BENALMADENA_SCORECARD.si[idx];

            // Distribution of strokes (Simplified for 18 SI)
            let strokesAllowed = Math.floor(hcp / 9); // Benalmadena is 9 holes
            if (hcp % 9 >= si) strokesAllowed += 1;

            const netScore = (parseInt(hole.strokes) || 0) - strokesAllowed;
            const holePoints = Math.max(0, 2 + par - netScore);
            return acc + holePoints;
        }, 0);

        finalData = {
            ...formData,
            score: totalStrokes,
            triputts: totalTriputts,
            stableford_points: points
        };

        const { error } = await supabase.from('rounds').insert([{
            course_name: finalData.course_name,
            score: parseInt(finalData.score),
            holes_played: parseInt(finalData.holes_played),
            triputts: parseInt(finalData.triputts),
            player_hcp: parseFloat(finalData.player_hcp),
            stableford_points: finalData.stableford_points || 0,
            hole_data: finalData.hole_data,
            date: finalData.date,
            notes: finalData.notes
        }]);

        if (error) alert('Error al guardar la partida');
        else {
            setShowForm(false);
            setFormData({
                course_name: 'Benalmádena Golf',
                score: '',
                holes_played: 9,
                triputts: 0,
                player_hcp: parseFloat(localStorage.getItem('current_hcp')) || 40.9,
                date: new Date().toISOString().split('T')[0],
                notes: '',
                hole_data: Array(9).fill({ strokes: 3, putts: 2, fir: true, gir: false })
            });
            fetchRounds();
        }
    }

    async function handleSimulateScan() {
        const simulatedHoles = BENALMADENA_SCORECARD.pars.map((par, i) => ({
            strokes: par + (Math.random() > 0.7 ? 1 : 0),
            putts: Math.floor(Math.random() * 3) + 1,
            fir: Math.random() > 0.4,
            gir: Math.random() > 0.5
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
                                <input
                                    type="text"
                                    required
                                    value={formData.course_name}
                                    onChange={e => setFormData({ ...formData, course_name: e.target.value })}
                                    placeholder="ej. Benalmádena Golf"
                                />
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

                            <div style={{ gridColumn: 'span 2' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Registro por Hoyo (S.I. y Par de Benalmádena)</h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f5f5f5' }}>
                                                <th style={{ padding: '0.5rem' }}>H</th>
                                                <th style={{ padding: '0.5rem' }}>Golpes</th>
                                                <th style={{ padding: '0.5rem' }}>Putts</th>
                                                <th style={{ padding: '0.5rem' }}>GIR</th>
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
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Guardar Partida</button>
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
                                <div style={{ background: 'var(--primary)', color: 'white', width: '80px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>
                                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', width: '100%', padding: '0.4rem 0.25rem' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 600, display: 'block', opacity: 0.8 }}>BRUTOS</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{round.score}</span>
                                    </div>
                                    <div style={{ width: '100%', padding: '0.4rem 0.25rem', background: 'rgba(255,255,255,0.1)' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 600, display: 'block', opacity: 0.8 }}>NETOS</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                            {Math.round(round.score - (round.player_hcp * (round.holes_played / 18)))}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{round.course_name}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {formatDate(round.date)}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Hash size={14} /> {round.holes_played} hoyos</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: round.triputts > 2 ? '#bc4749' : 'inherit' }}>
                                            <strong>Triputts:</strong> {round.triputts || 0}
                                        </span>
                                        {round.stableford_points > 0 && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#386641' }}>
                                                <strong>Stableford:</strong> {round.stableford_points} pts
                                            </span>
                                        )}
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
