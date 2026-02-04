import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, Award, Trophy } from 'lucide-react';

export default function TrainingLog() {
    const [progress, setProgress] = useState(() => {
        const saved = localStorage.getItem('training_agenda');
        return saved ? JSON.parse(saved) : {
            monday: { calib54: false, puttCircuit: false, puttScore: '' },
            tuesday: { proClass: false, towelDrill: '' },
            wednesday: { rule60m: '' },
            thursday: { freePlay: false, approachRodado: false, puttEscalera: false }
        };
    });

    useEffect(() => {
        localStorage.setItem('training_agenda', JSON.stringify(progress));
    }, [progress]);

    const isDayComplete = (day) => {
        switch (day) {
            case 'monday': return progress.monday.calib54 && progress.monday.puttCircuit;
            case 'tuesday': return progress.tuesday.proClass && progress.tuesday.towelDrill !== '';
            case 'wednesday': return progress.wednesday.rule60m !== '';
            case 'thursday': return progress.thursday.freePlay && progress.thursday.approachRodado && progress.thursday.puttEscalera;
            default: return false;
        }
    };

    const handleToggle = (day, field) => {
        setProgress(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: !prev[day][field] }
        }));
    };

    const handleInputChange = (day, field, value) => {
        setProgress(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const dayStyle = {
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        borderLeft: '4px solid var(--primary)',
        position: 'relative',
        overflow: 'hidden'
    };

    const agendaLine = {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid #f0f0f0'
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1>Agenda Semanal</h1>
                <p style={{ color: 'var(--text-muted)' }}>Tu hoja de ruta para bajar el hándicap.</p>
            </div>

            {/* MONDAY */}
            <div style={dayStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>Lunes - Calibración & Putt</h3>
                    {isDayComplete('monday') && <span style={{ color: '#386641', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Award size={16} /> ¡LOGRADO!</span>}
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.monday.calib54} onChange={() => handleToggle('monday', 'calib54')} />
                    <span>Calibración 54º</span>
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.monday.puttCircuit} onChange={() => handleToggle('monday', 'puttCircuit')} />
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Circuito Putt</span>
                        <input
                            type="text"
                            placeholder="Puntos..."
                            value={progress.monday.puttScore}
                            onChange={(e) => handleInputChange('monday', 'puttScore', e.target.value)}
                            style={{ width: '80px', padding: '0.25rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                    </div>
                </div>
                {isDayComplete('monday') && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#2e7d32' }}>
                        🎉 ¡Gran comienzo de semana! La precisión se construye hoy.
                    </div>
                )}
            </div>

            {/* TUESDAY */}
            <div style={{ ...dayStyle, borderLeftColor: '#6a994e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#6a994e' }}>Martes - Técnica & Clase</h3>
                    {isDayComplete('tuesday') && <span style={{ color: '#386641', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Award size={16} /> ¡LOGRADO!</span>}
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.tuesday.proClass} onChange={() => handleToggle('tuesday', 'proClass')} />
                    <span>Clase con el Pro</span>
                </div>
                <div style={agendaLine}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Ejercicio Toalla</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="number"
                                placeholder="%"
                                value={progress.tuesday.towelDrill}
                                onChange={(e) => handleInputChange('tuesday', 'towelDrill', e.target.value)}
                                style={{ width: '60px', padding: '0.25rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                            <span style={{ fontSize: '0.8rem' }}>% acierto</span>
                        </div>
                    </div>
                </div>
                {isDayComplete('tuesday') && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#2e7d32' }}>
                        ⭐️ Escuchando al Pro y afinando el impacto. ¡Sigue así!
                    </div>
                )}
            </div>

            {/* WEDNESDAY */}
            <div style={{ ...dayStyle, borderLeftColor: '#a7c957' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#a7c957' }}>Miércoles - Campo & Regla</h3>
                    {isDayComplete('wednesday') && <span style={{ color: '#386641', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Award size={16} /> ¡LOGRADO!</span>}
                </div>
                <div style={agendaLine}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>9 Hoyos - Regla 60m</span>
                        <input
                            type="number"
                            placeholder="Veces..."
                            value={progress.wednesday.rule60m}
                            onChange={(e) => handleInputChange('wednesday', 'rule60m', e.target.value)}
                            style={{ width: '80px', padding: '0.25rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                    </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>💡 Indica cuántas veces respetaste la regla de no atacar a menos de 60m.</p>
                {isDayComplete('wednesday') && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#2e7d32' }}>
                        ⛳️ La estrategia en el campo es lo que realmente baja el hándicap.
                    </div>
                )}
            </div>

            {/* THURSDAY */}
            <div style={{ ...dayStyle, borderLeftColor: '#f2e8cf' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#8b8b8b' }}>Jueves - Juego Corto</h3>
                    {isDayComplete('thursday') && <span style={{ color: '#386641', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Award size={16} /> ¡LOGRADO!</span>}
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.thursday.freePlay} onChange={() => handleToggle('thursday', 'freePlay')} />
                    <span>Juego Libre</span>
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.thursday.approachRodado} onChange={() => handleToggle('thursday', 'approachRodado')} />
                    <span>Approach Rodado</span>
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.thursday.puttEscalera} onChange={() => handleToggle('thursday', 'puttEscalera')} />
                    <span>Putt Escalera</span>
                </div>
                {isDayComplete('thursday') && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#2e7d32' }}>
                        🏆 ¡Semana de entrenos completada! Estás un paso más cerca de tu objetivo.
                    </div>
                )}
            </div>
        </div>
    );
}
