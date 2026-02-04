import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, Award, Trophy, ChevronLeft, Calendar, Sparkles } from 'lucide-react';

export default function TrainingLog() {
    // Helper to get ISO week ID (e.g., 2024-W06)
    const getWeekId = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const year = d.getFullYear();
        const week = Math.ceil((((d - new Date(year, 0, 1)) / 86400000) + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    };

    const [currentWeekId, setCurrentWeekId] = useState(getWeekId(new Date()));
    const [progress, setProgress] = useState(() => {
        const saved = localStorage.getItem(`training_agenda_${getWeekId(new Date())}`);
        return saved ? JSON.parse(saved) : getDefaultProgress();
    });

    function getDefaultProgress() {
        return {
            monday: { calib54: false, puttCircuit: false, puttScore: '' },
            tuesday: { proClass: false, towelDrill: '' },
            wednesday: { rule60m: '' },
            thursday: { freePlay: false, approachRodado: false, puttEscalera: false }
        };
    }

    // Effect to load data when week changes
    useEffect(() => {
        const saved = localStorage.getItem(`training_agenda_${currentWeekId}`);
        if (saved) {
            setProgress(JSON.parse(saved));
        } else {
            setProgress(getDefaultProgress());
        }
    }, [currentWeekId]);

    // Effect to persist data locally
    useEffect(() => {
        localStorage.setItem(`training_agenda_${currentWeekId}`, JSON.stringify(progress));
    }, [progress, currentWeekId]);

    // Helper to get week date range (e.g., "3 Feb - 9 Feb")
    const getWeekRange = (weekId) => {
        const [year, weekStr] = weekId.split('-W');
        const week = parseInt(weekStr);
        let d = new Date(parseInt(year), 0, 1);
        const dayOffset = (d.getDay() || 7) - 1;
        d.setDate(d.getDate() - dayOffset + (week - 1) * 7);

        const start = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const endDate = new Date(d);
        endDate.setDate(d.getDate() + 6);
        const end = endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        return `${start} - ${end}`;
    };

    const changeWeek = (offset) => {
        const [year, weekStr] = currentWeekId.split('-W');
        const week = parseInt(weekStr);
        let d = new Date(parseInt(year), 0, 1);
        const dayOffset = (d.getDay() || 7) - 1;
        d.setDate(d.getDate() - dayOffset + (week - 1) * 7 + (offset * 7) + 3);
        setCurrentWeekId(getWeekId(d));
    };

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
        borderRadius: '20px',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        borderLeft: '5px solid var(--primary)',
        position: 'relative'
    };

    const agendaLine = {
        display: 'grid',
        gridTemplateColumns: '30px 1fr auto',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 0',
        borderBottom: '1px solid #f5f5f5'
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Agenda Semanal</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Tu hoja de ruta para bajar el hándicap.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.6rem 1.25rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <button onClick={() => changeWeek(-1)} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}><ChevronLeft size={18} /></button>
                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semana {currentWeekId.split('-W')[1]}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-dark)' }}>{getWeekRange(currentWeekId)}</span>
                    </div>
                    <button onClick={() => changeWeek(1)} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}><ChevronRight size={18} /></button>
                </div>
            </div>

            {/* MONDAY */}
            <div style={dayStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>Lunes - Calibración & Putt</h3>
                    {isDayComplete('monday') && <span style={{ color: '#386641', fontSize: '0.7rem', fontWeight: 800, background: '#e8f5e9', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>LOGRADO</span>}
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.monday.calib54} onChange={() => handleToggle('monday', 'calib54')} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>Calibración 54º</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: 1m</span>
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.monday.puttCircuit} onChange={() => handleToggle('monday', 'puttCircuit')} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>Circuito Putt</span>
                    <input
                        type="text"
                        placeholder="Pts..."
                        value={progress.monday.puttScore}
                        onChange={(e) => handleInputChange('monday', 'puttScore', e.target.value)}
                        style={{ width: '70px', padding: '0.35rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}
                    />
                </div>
            </div>

            {/* TUESDAY */}
            <div style={{ ...dayStyle, borderLeftColor: '#6a994e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#6a994e', fontSize: '1.1rem' }}>Martes - Técnica & Clase</h3>
                    {isDayComplete('tuesday') && <span style={{ color: '#386641', fontSize: '0.7rem', fontWeight: 800, background: '#e8f5e9', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>LOGRADO</span>}
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.tuesday.proClass} onChange={() => handleToggle('tuesday', 'proClass')} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>Clase con Ruben</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantenimiento</span>
                </div>
                <div style={agendaLine}>
                    <div></div>
                    <span style={{ fontWeight: 500 }}>Ejercicio Toalla</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input
                            type="number"
                            placeholder="%"
                            value={progress.tuesday.towelDrill}
                            onChange={(e) => handleInputChange('tuesday', 'towelDrill', e.target.value)}
                            style={{ width: '55px', padding: '0.35rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>%</span>
                    </div>
                </div>
            </div>

            {/* WEDNESDAY */}
            <div style={{ ...dayStyle, borderLeftColor: '#a7c957' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#a7c957', fontSize: '1.1rem' }}>Miércoles - Campo & Regla</h3>
                    {isDayComplete('wednesday') && <span style={{ color: '#386641', fontSize: '0.7rem', fontWeight: 800, background: '#e8f5e9', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>LOGRADO</span>}
                </div>
                <div style={agendaLine}>
                    <div></div>
                    <span style={{ fontWeight: 500 }}>9 Hoyos - Regla 60m</span>
                    <input
                        type="number"
                        placeholder="Veces"
                        value={progress.wednesday.rule60m}
                        onChange={(e) => handleInputChange('wednesday', 'rule60m', e.target.value)}
                        style={{ width: '75px', padding: '0.35rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}
                    />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={12} /> Veces respetada la regla de no atacar a menos de 60m.
                </p>
            </div>

            {/* THURSDAY */}
            <div style={{ ...dayStyle, borderLeftColor: '#f2e8cf' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#8b8b8b', fontSize: '1.1rem' }}>Jueves - Juego Corto</h3>
                    {isDayComplete('thursday') && <span style={{ color: '#386641', fontSize: '0.7rem', fontWeight: 800, background: '#e8f5e9', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>LOGRADO</span>}
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.thursday.freePlay} onChange={() => handleToggle('thursday', 'freePlay')} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>Juego Libre</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ritmo</span>
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.thursday.approachRodado} onChange={() => handleToggle('thursday', 'approachRodado')} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>Approach Rodado</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: 2m</span>
                </div>
                <div style={agendaLine}>
                    <input type="checkbox" checked={progress.thursday.puttEscalera} onChange={() => handleToggle('thursday', 'puttEscalera')} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>Putt Escalera</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Control</span>
                </div>
            </div>
        </div>
    );
}
