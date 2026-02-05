import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../context/SubscriptionContext';
import Paywall from './Paywall';
import { CheckCircle2, ChevronRight, Award, Trophy, ChevronLeft, Calendar, Sparkles, Loader2, Target, Plus, Minus } from 'lucide-react';
import { DRILLS, DRILL_CATEGORIES, getDefaultActiveDrills } from '../lib/drills';

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

    const { isPro } = useSubscription();
    const [currentWeekId, setCurrentWeekId] = useState(getWeekId(new Date()));
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('week'); // 'week' or 'evolution'
    const [history, setHistory] = useState([]);

    // Default settings with activeDrills initialized
    const [settings, setSettings] = useState({
        coachName: 'Ruben',
        hcpGoal: '40',
        trainingDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: false, saturday: false, sunday: false },
        activeDrills: getDefaultActiveDrills()
    });

    const saveTimeout = useRef(null);

    // Initial state needs to handle all possible inputs from DRILLS to avoid undefined errors
    function getDefaultProgress() {
        const prog = {};
        DRILLS.forEach(drill => {
            drill.inputs.forEach(input => {
                if (input.type === 'checkbox') prog[input.key] = false;
                else prog[input.key] = ''; // Start empty for text/number inputs
            });
        });
        return prog;
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
                    // Merge with default to ensure new drills have keys if old data exists
                    setProgress({ ...getDefaultProgress(), ...data.progress });
                } else {
                    const local = localStorage.getItem(`training_agenda_${currentWeekId}`);
                    setProgress(local ? { ...getDefaultProgress(), ...JSON.parse(local) } : getDefaultProgress());
                }
            } catch (err) {
                console.error("Error loading agenda:", err);
                setProgress(getDefaultProgress());
            } finally {
                setLoading(false);
            }
        }
        loadData();

        // Load user settings
        const savedSettings = localStorage.getItem('golf_user_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, [currentWeekId]);

    // Load historical data for evolution view
    useEffect(() => {
        if (activeTab === 'evolution' && isPro) {
            async function fetchHistory() {
                try {
                    const { data, error } = await supabase
                        .from('agenda_logs')
                        .select('week_id, progress')
                        .order('week_id', { ascending: true })
                        .limit(8); // Show last 8 weeks
                    if (data) setHistory(data);
                } catch (err) {
                    console.error("Error fetching history:", err);
                }
            }
            fetchHistory();
        }
    }, [activeTab]);

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

    // Calculate daily completion based on ACTIVE drills
    const isDayComplete = (dayKey) => {
        if (!progress || !settings.activeDrills) return false;

        // Find all active drills across all categories
        let activeDrillIds = [];
        Object.values(settings.activeDrills).forEach(ids => activeDrillIds.push(...ids));

        // For now, simplicity: if it's an active day, we check if at least ONE drill is done.
        // A robust implementation would map drills to specifc days if the user could schedule them.
        // CURRENT LOGIC: 'Customized Menu' simply shows ALL selected drills for EVERY active day? 
        // OR does it group them? 
        // 
        // REVISION: The User prompt implies "Customize menu" (Agenda).
        // Since we don't have a "Weekly Planner" (assigning Chip to Tuesday), 
        // we will render the SAME selected routine for every active day, 
        // or just group them by category in a single view?
        // 
        // LET'S STICK TO THE ORIGINAL REQUEST: "Custom menu". 
        // We will render the active categories for the enabled days. 
        // For simplicity in this iteration: 
        // The "Training Days" toggle simply SHOWS the day in the list.
        // INSIDE that day, we show the drills the user has selected in Settings.
        // This effectively makes every training day a "Full Practice" of selected items.

        // To check completion, we check if inputs for active drills are filled.
        // This is complex dynamically. Let's return false for now to avoid errors, or basic check.
        return false;
    };

    const handleInput = (key, value) => {
        setProgress(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getScoreColor = (score, max) => {
        const val = parseInt(score);
        if (isNaN(val)) return 'var(--text-muted)';
        const ratio = val / max;
        if (ratio <= 0.4) return '#bc4749';
        if (ratio <= 0.7) return '#f4a261';
        return '#386641';
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
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 0',
        borderBottom: '1px solid #f5f5f5'
    };

    const EvolutionView = () => {
        if (!isPro) return <Paywall onClose={() => setActiveTab('week')} />;
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Target size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <h3>Evolución Dinámica</h3>
                <p>Gráficos de tus nuevos ejercicios personalizados estarán disponibles pronto.</p>
            </div>
        );
    };

    const DAYS_MAP = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo'
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <h1>Entrenamiento Semanal</h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Tu hoja de ruta para bajar el hándicap.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', background: '#f5f5f5', padding: '0.3rem', borderRadius: '12px' }}>
                    <button
                        onClick={() => setActiveTab('week')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700,
                            background: activeTab === 'week' ? 'white' : 'transparent',
                            color: activeTab === 'week' ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: activeTab === 'week' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer'
                        }}
                    >Semana</button>
                    <button
                        onClick={() => setActiveTab('evolution')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700,
                            background: activeTab === 'evolution' ? 'white' : 'transparent',
                            color: activeTab === 'evolution' ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: activeTab === 'evolution' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >Evolución {!isPro && '🔒'}</button>
                </div>

                {activeTab === 'week' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.6rem 1.25rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                        <button onClick={() => changeWeek(-1)} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}><ChevronLeft size={18} /></button>
                        <div style={{ textAlign: 'center', minWidth: '120px' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semana {currentWeekId.split('-W')[1]}</span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-dark)' }}>{getWeekRange(currentWeekId)}</span>
                        </div>
                        <button onClick={() => changeWeek(1)} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}><ChevronRight size={18} /></button>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={40} className="spin" color="var(--primary)" />
                    <p>Cargando tus entrenamientos...</p>
                </div>
            ) : activeTab === 'evolution' ? (
                <EvolutionView />
            ) : progress ? (
                <>
                    {/* Dynamically Render Days */}
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(dayKey => {
                        // Only render if enabled in settings
                        if (settings.trainingDays?.[dayKey] === false) return null;

                        return (
                            <div key={dayKey} style={dayStyle}>
                                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '1.2rem', textTransform: 'capitalize' }}>
                                    {DAYS_MAP[dayKey]}
                                </h3>

                                {/* Render Active Drill Categories */}
                                {DRILL_CATEGORIES.map(cat => {
                                    const activeItems = DRILLS.filter(d =>
                                        d.categoryId === cat.id &&
                                        settings.activeDrills?.[cat.id]?.includes(d.id)
                                    );

                                    if (activeItems.length === 0) return null;

                                    return (
                                        <div key={cat.id} style={{ marginBottom: '1.5rem' }}>
                                            <h4 style={{ fontSize: '0.9rem', color: cat.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', borderBottom: `2px solid ${cat.color}20`, paddingBottom: '0.2rem' }}>
                                                {cat.label}
                                            </h4>
                                            {activeItems.map(drill => (
                                                <div key={drill.id} style={{ marginBottom: '1rem', background: '#f9f9f9', padding: '1rem', borderRadius: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <drill.icon size={18} color={cat.color} />
                                                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{drill.label}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>{drill.description}</p>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                        {drill.inputs.map(input => (
                                                            <div key={input.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.9rem' }}>{input.label}</span>

                                                                {input.type === 'checkbox' ? (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={progress[input.key] || false}
                                                                        onChange={(e) => handleInput(input.key, e.target.checked)}
                                                                        style={{ width: '24px', height: '24px', accentColor: cat.color }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                        <button
                                                                            onClick={() => handleInput(input.key, Math.max(0, parseInt(progress[input.key] || 0) - 1))}
                                                                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        ><Minus size={14} /></button>
                                                                        <input
                                                                            type="number"
                                                                            value={progress[input.key]}
                                                                            onChange={(e) => handleInput(input.key, e.target.value)}
                                                                            style={{
                                                                                width: '50px', padding: '0.4rem', borderRadius: '8px',
                                                                                border: '2px solid #eee', textAlign: 'center', fontWeight: 'bold',
                                                                                color: getScoreColor(progress[input.key], input.max || 10)
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => handleInput(input.key, Math.min(input.max || 100, parseInt(progress[input.key] || 0) + 1))}
                                                                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        ><Plus size={14} /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}

                                {/* Fallback if no drills selected */}
                                {(!settings.activeDrills || Object.values(settings.activeDrills).flat().length === 0) && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        No hay ejercicios activos. Ve a Ajustes para configurar tu rutina.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </>
            ) : null}
        </div>
    );
}
