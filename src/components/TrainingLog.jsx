import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, ChevronRight, Award, Trophy, ChevronLeft, Calendar, Sparkles, Loader2, Target, Plus, Minus } from 'lucide-react';

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
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const saveTimeout = useRef(null);

    function getDefaultProgress() {
        return {
            monday: { calibShort: '', calibMid: '', calibLong: '', puttCircuit: false, puttScore: '' },
            tuesday: { proClass: false, towelMisses: '', towelTotal: '10' },
            wednesday: { fieldDay: false },
            thursday: { freePlay: false, approachSuccess: 0, approachTotal: 30, stairsSuccess: 0, stairsTotal: 27 }
        };
    }

    // Load data from Supabase
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('agenda_logs')
                    .select('progress')
                    .eq('week_id', currentWeekId)
                    .single();

                if (data) {
                    setProgress(data.progress);
                } else {
                    // Try to migrate from localStorage if it exists
                    const local = localStorage.getItem(`training_agenda_${currentWeekId}`);
                    setProgress(local ? JSON.parse(local) : getDefaultProgress());
                }
            } catch (err) {
                console.error("Error loading agenda:", err);
                setProgress(getDefaultProgress());
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [currentWeekId]);

    // Save to Supabase with debounce
    useEffect(() => {
        if (!progress || loading) return;

        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            setSaving(true);
            try {
                await supabase
                    .from('agenda_logs')
                    .upsert({
                        week_id: currentWeekId,
                        progress: progress,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'week_id' });

                // Also keep local as backup
                localStorage.setItem(`training_agenda_${currentWeekId}`, JSON.stringify(progress));
            } catch (err) {
                console.error("Error saving agenda:", err);
            } finally {
                setSaving(false);
            }
        }, 1000);

        return () => clearTimeout(saveTimeout.current);
    }, [progress, currentWeekId]);

    // Helper to get week date range (e.g., "3 Feb - 9 Feb")
    const getWeekRange = (weekId) => {
        if (!weekId) return "";
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
            case 'monday': return progress.monday.calibShort !== '' && progress.monday.calibMid !== '' && progress.monday.calibLong !== '' && progress.monday.puttCircuit;
            case 'tuesday': return progress.tuesday.proClass && progress.tuesday.towelMisses !== '';
            case 'wednesday': return progress.wednesday.fieldDay;
            case 'thursday': return progress.thursday.freePlay && progress.thursday.approachSuccess > 0 && progress.thursday.stairsSuccess > 0;
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

    const getScoreColor = (score) => {
        const val = parseInt(score);
        if (isNaN(val)) return 'var(--text-muted)';
        if (val <= 4) return '#bc4749'; // Rojo (0-4)
        if (val <= 7) return '#f4a261'; // Amarillo (5-7)
        return '#386641'; // Verde (8-10)
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <h1>Agenda Semanal</h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Tu hoja de ruta para bajar el hándicap.</p>
                    </div>
                    {saving && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.8rem', background: 'rgba(56, 102, 65, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', animation: 'pulse 1.5s infinite' }}>
                        <Loader2 size={14} className="spin" /> Guardando...
                    </div>}
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

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={40} className="spin" color="var(--primary)" />
                    <p>Cargando tu agenda...</p>
                </div>
            ) : progress ? (
                <>
                    {/* MONDAY */}
                    <div style={dayStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>Lunes - Calibración & Putt</h3>
                            {isDayComplete('monday') && <span style={{ color: '#386641', fontSize: '0.7rem', fontWeight: 800, background: '#e8f5e9', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>LOGRADO</span>}
                        </div>
                        <div style={{ marginBottom: '1rem', background: '#fcfcfc', padding: '1rem', borderRadius: '12px', border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Target size={18} color="var(--primary)" />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Test de Precisión 54º</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {[
                                    { label: 'Corta Distancia (54º)', key: 'calibShort' },
                                    { label: 'Media Distancia (54º)', key: 'calibMid' },
                                    { label: 'Larga Distancia (P)', key: 'calibLong' }
                                ].map((item) => (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#555' }}>{item.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                value={progress.monday[item.key]}
                                                onChange={(e) => handleInputChange('monday', item.key, e.target.value)}
                                                style={{
                                                    width: '50px',
                                                    padding: '0.35rem',
                                                    fontSize: '0.9rem',
                                                    borderRadius: '8px',
                                                    border: '2px solid',
                                                    borderColor: getScoreColor(progress.monday[item.key]),
                                                    textAlign: 'center',
                                                    fontWeight: 700
                                                }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 10</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    placeholder="Fallos"
                                    value={progress.tuesday.towelMisses}
                                    onChange={(e) => handleInputChange('tuesday', 'towelMisses', e.target.value)}
                                    style={{ width: '45px', padding: '0.35rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}
                                />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/</span>
                                <input
                                    type="number"
                                    placeholder="Total"
                                    value={progress.tuesday.towelTotal}
                                    onChange={(e) => handleInputChange('tuesday', 'towelTotal', e.target.value)}
                                    style={{ width: '45px', padding: '0.35rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}
                                />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>fallos</span>
                            </div>
                        </div>
                    </div>
                    {/* WEDNESDAY */}
                    <div style={{ ...dayStyle, borderLeftColor: '#a7c957' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: '#a7c957', fontSize: '1.1rem' }}>Miércoles - Campo</h3>
                            {isDayComplete('wednesday') && <span style={{ color: '#386641', fontSize: '0.7rem', fontWeight: 800, background: '#e8f5e9', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>LOGRADO</span>}
                        </div>
                        <div style={agendaLine}>
                            <input type="checkbox" checked={progress.wednesday.fieldDay} onChange={() => handleToggle('wednesday', 'fieldDay')} style={{ width: '20px', height: '20px' }} />
                            <span style={{ fontWeight: 500 }}>Solo campo</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantenimiento</span>
                        </div>
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

                        {/* APPROACH COUNTER */}
                        <div style={{ ...agendaLine, gridTemplateColumns: '1fr auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 500 }}>Approach Rodado</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bolas en Radio 2m (Total 30 bolas)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8f9fa', padding: '0.3rem', borderRadius: '12px' }}>
                                <button
                                    onClick={() => handleInputChange('thursday', 'approachSuccess', Math.max(0, parseInt(progress.thursday.approachSuccess || 0) - 1))}
                                    disabled={parseInt(progress.thursday.approachSuccess || 0) <= 0}
                                    style={{
                                        background: 'white', border: '1px solid #eee', borderRadius: '8px', width: '30px', height: '30px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (parseInt(progress.thursday.approachSuccess || 0) <= 0) ? 'not-allowed' : 'pointer',
                                        opacity: (parseInt(progress.thursday.approachSuccess || 0) <= 0) ? 0.5 : 1
                                    }}
                                >
                                    <Minus size={14} />
                                </button>
                                <div style={{ minWidth: '85px', textAlign: 'center' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-dark)' }}>{progress.thursday.approachSuccess}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / 30</span>
                                </div>
                                <button
                                    onClick={() => handleInputChange('thursday', 'approachSuccess', Math.min(30, parseInt(progress.thursday.approachSuccess || 0) + 1))}
                                    disabled={parseInt(progress.thursday.approachSuccess || 0) >= 30}
                                    style={{
                                        background: 'white', border: '1px solid #eee', borderRadius: '8px', width: '30px', height: '30px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (parseInt(progress.thursday.approachSuccess || 0) >= 30) ? 'not-allowed' : 'pointer',
                                        opacity: (parseInt(progress.thursday.approachSuccess || 0) >= 30) ? 0.5 : 1
                                    }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* STAIRS COUNTER */}
                        <div style={{ ...agendaLine, gridTemplateColumns: '1fr auto', borderBottom: 'none', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 500 }}>Putt Escalera</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aciertos Totales</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8f9fa', padding: '0.3rem', borderRadius: '12px' }}>
                                <button
                                    onClick={() => handleInputChange('thursday', 'stairsSuccess', Math.max(0, parseInt(progress.thursday.stairsSuccess || 0) - 1))}
                                    disabled={parseInt(progress.thursday.stairsSuccess || 0) <= 0}
                                    style={{
                                        background: 'white', border: '1px solid #eee', borderRadius: '8px', width: '30px', height: '30px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (parseInt(progress.thursday.stairsSuccess || 0) <= 0) ? 'not-allowed' : 'pointer',
                                        opacity: (parseInt(progress.thursday.stairsSuccess || 0) <= 0) ? 0.5 : 1
                                    }}
                                >
                                    <Minus size={14} />
                                </button>
                                <div style={{ minWidth: '85px', textAlign: 'center' }}>
                                    <span style={{
                                        fontWeight: 800,
                                        fontSize: '1.05rem',
                                        color: parseInt(progress.thursday.stairsSuccess) > 20 ? '#D4AF37' : 'var(--primary-dark)',
                                        textShadow: parseInt(progress.thursday.stairsSuccess) > 20 ? '0 0 10px rgba(212, 175, 55, 0.3)' : 'none'
                                    }}>
                                        {progress.thursday.stairsSuccess}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / 27</span>
                                </div>
                                <button
                                    onClick={() => handleInputChange('thursday', 'stairsSuccess', Math.min(27, parseInt(progress.thursday.stairsSuccess || 0) + 1))}
                                    disabled={parseInt(progress.thursday.stairsSuccess || 0) >= 27}
                                    style={{
                                        background: 'white', border: '1px solid #eee', borderRadius: '8px', width: '30px', height: '30px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (parseInt(progress.thursday.stairsSuccess || 0) >= 27) ? 'not-allowed' : 'pointer',
                                        opacity: (parseInt(progress.thursday.stairsSuccess || 0) >= 27) ? 0.5 : 1
                                    }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                        <div style={{ paddingLeft: '38px', marginTop: '-0.2rem' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Sparkles size={12} color="#D4AF37" />
                                <span>Llano, Subida, Bajada (27 bolas). **Meta Hcp 40: > 15 aciertos.**</span>
                            </p>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
