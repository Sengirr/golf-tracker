
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../context/SubscriptionContext';
import Paywall from './Paywall';
import { CheckCircle2, ChevronRight, Award, Trophy, ChevronLeft, Calendar, Sparkles, Loader2, Target, Plus, Minus } from 'lucide-react';
import { DRILL_CATEGORIES, getAllDrills, getDefaultWeeklyRoutine, getDrillById } from '../lib/drills';

export default function TrainingLog() {
    const getWeekId = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const year = d.getFullYear();
        const week = Math.ceil((((d - new Date(year, 0, 1)) / 86400000) + 1) / 7);
        return `${year} -W${week.toString().padStart(2, '0')} `;
    };

    const { isPro } = useSubscription();
    const [currentWeekId, setCurrentWeekId] = useState(getWeekId(new Date()));
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('week');
    const [history, setHistory] = useState([]);

    const [settings, setSettings] = useState({
        coachName: 'Ruben',
        hcpGoal: '40',
        trainingDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: false, saturday: false, sunday: false },
        weeklyRoutine: getDefaultWeeklyRoutine(),
        customDrills: []
    });

    const saveTimeout = useRef(null);

    function getDefaultProgress() {
        const prog = {};
        getAllDrills([]).forEach(drill => {
            drill.inputs.forEach(input => {
                if (input.type === 'checkbox') prog[input.key] = false;
                else prog[input.key] = '';
            });
        });
        return prog;
    }

    // Load data
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Load Settings First to get Custom Drills
                const savedSettings = localStorage.getItem('golf_user_settings');
                let currentSettings = settings;

                if (savedSettings) {
                    try {
                        const parsed = JSON.parse(savedSettings);
                        // Safe merge with validation
                        currentSettings = {
                            ...settings,
                            ...parsed,
                            trainingDays: (parsed.trainingDays && typeof parsed.trainingDays === 'object') ? parsed.trainingDays : settings.trainingDays,
                            weeklyRoutine: (parsed.weeklyRoutine && typeof parsed.weeklyRoutine === 'object') ? parsed.weeklyRoutine : getDefaultWeeklyRoutine(),
                            customDrills: Array.isArray(parsed.customDrills) ? parsed.customDrills : []
                        };
                        setSettings(currentSettings);
                    } catch (e) {
                        console.error("Error parsing settings in Log:", e);
                    }
                }

                // Load Agenda
                const { data } = await supabase
                    .from('agenda_logs')
                    .select('progress')
                    .eq('week_id', currentWeekId)
                    .single();

                if (data) {
                    setProgress({ ...getDefaultProgress(), ...data.progress });
                } else {
                    const local = localStorage.getItem(`training_agenda_${currentWeekId} `);
                    setProgress(local ? { ...getDefaultProgress(), ...JSON.parse(local) } : getDefaultProgress());
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setProgress(getDefaultProgress());
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [currentWeekId]);

    // Load History
    useEffect(() => {
        if (activeTab === 'evolution' && isPro) {
            async function fetchHistory() {
                const { data } = await supabase.from('agenda_logs').select('week_id, progress').order('week_id', { ascending: true }).limit(8);
                if (data) setHistory(data);
            }
            fetchHistory();
        }
    }, [activeTab]);

    // Save
    useEffect(() => {
        if (!progress || loading) return;
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            setSaving(true);
            try {
                await supabase.from('agenda_logs').upsert({
                    week_id: currentWeekId, progress: progress, updated_at: new Date().toISOString()
                }, { onConflict: 'week_id' });
                localStorage.setItem(`training_agenda_${currentWeekId} `, JSON.stringify(progress));
            } catch (err) { console.error(err); }
            finally { setSaving(false); }
        }, 1000);

        return () => clearTimeout(saveTimeout.current);
    }, [progress, currentWeekId]);

    const getWeekRange = (weekId) => {
        if (!weekId) return "";
        const [year, weekStr] = weekId.split('-W');
        const week = parseInt(weekStr);
        let d = new Date(parseInt(year), 0, 1);
        const dayOffset = (d.getDay() || 7) - 1;
        d.setDate(d.getDate() - dayOffset + (week - 1) * 7);
        const start = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        d.setDate(d.getDate() + 6);
        return `${start} - ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} `;
    };

    const changeWeek = (offset) => {
        const [year, weekStr] = currentWeekId.split('-W');
        const week = parseInt(weekStr);
        let d = new Date(parseInt(year), 0, 1);
        d.setDate(d.getDate() - (d.getDay() || 7) + 1 + (week - 1) * 7 + (offset * 7) + 3);
        setCurrentWeekId(getWeekId(d));
    };

    // Calculate daily completion based on ACTIVE drills for that day
    const isDayComplete = (dayKey) => {
        if (!progress || !settings.weeklyRoutine) return false;

        const dayDrillIds = settings.weeklyRoutine[dayKey] || [];
        if (dayDrillIds.length === 0) return false;

        const dayDrills = dayDrillIds.map(id => getDrillById(id, settings.customDrills)).filter(Boolean);

        // Simple check: All checkboxes checked, all numeric inputs > 0 (or filled)
        return dayDrills.every(drill => {
            return drill.inputs.every(input => {
                const val = progress[input.key];
                if (input.type === 'checkbox') return val === true;
                return val !== '' && val !== null && val !== undefined; // Loose check for filled
            });
        });
    };

    const handleInput = (key, value) => {
        setProgress(prev => ({ ...prev, [key]: value }));
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
        background: 'white', borderRadius: '20px', padding: '1.25rem', marginBottom: '1.25rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: '5px solid var(--primary)', position: 'relative'
    };

    const DAYS_MAP = {
        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
        friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
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

    return (
        <div className="fade-in" style={{ paddingBottom: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Entrenamiento Semanal</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Tu hoja de ruta para bajar el hándicap.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f5f5f5', padding: '0.3rem', borderRadius: '12px' }}>
                    <button onClick={() => setActiveTab('week')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700, background: activeTab === 'week' ? 'white' : 'transparent', color: activeTab === 'week' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'week' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>Semana</button>
                    <button onClick={() => setActiveTab('evolution')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700, background: activeTab === 'evolution' ? 'white' : 'transparent', color: activeTab === 'evolution' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'evolution' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>Evolución {!isPro && '🔒'}</button>
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
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 size={40} className="spin" color="var(--primary)" /></div>
            ) : activeTab === 'evolution' ? (
                <EvolutionView />
            ) : progress ? (
                <>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(dayKey => {
                        if (settings.trainingDays?.[dayKey] === false) return null;

                        const dayDrillIds = settings.weeklyRoutine?.[dayKey] || [];
                        const activeDrills = dayDrillIds.map(id => getDrillById(id, settings.customDrills)).filter(Boolean);

                        // Group by category for display
                        const drillsByCategory = {};
                        activeDrills.forEach(d => {
                            if (!drillsByCategory[d.categoryId]) drillsByCategory[d.categoryId] = [];
                            drillsByCategory[d.categoryId].push(d);
                        });

                        return (
                            <div key={dayKey} style={dayStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.2rem', textTransform: 'capitalize' }}>{DAYS_MAP[dayKey]}</h3>
                                    {isDayComplete(dayKey) && <span style={{ color: '#386641', fontSize: '0.7rem', fontWeight: 800, background: '#e8f5e9', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>LOGRADO</span>}
                                </div>

                                {activeDrills.length === 0 ? (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Día de descanso activo o sin ejercicios asignados.</p>
                                ) : (
                                    Object.keys(drillsByCategory).map(catId => {
                                        const cat = DRILL_CATEGORIES.find(c => c.id === catId) || { label: 'Otros', color: '#555' };
                                        return (
                                            <div key={catId} style={{ marginBottom: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.85rem', color: cat.color, textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: `2px solid ${cat.color} 20` }}>{cat.label}</h4>
                                                {drillsByCategory[catId].map(drill => (
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
                                                                        <input type="checkbox" checked={progress[input.key] || false} onChange={(e) => handleInput(input.key, e.target.checked)} style={{ width: '24px', height: '24px', accentColor: cat.color }} />
                                                                    ) : (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                            <button onClick={() => handleInput(input.key, Math.max(0, parseInt(progress[input.key] || 0) - 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                                                                            <input type="number" value={progress[input.key]} onChange={(e) => handleInput(input.key, e.target.value)} style={{ width: '50px', padding: '0.4rem', borderRadius: '8px', border: '2px solid', borderColor: getScoreColor(progress[input.key], input.max || 10), textAlign: 'center', fontWeight: 'bold' }} />
                                                                            <button onClick={() => handleInput(input.key, Math.min(input.max || 100, parseInt(progress[input.key] || 0) + 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}
                </>
            ) : null}
        </div>
    );
}

