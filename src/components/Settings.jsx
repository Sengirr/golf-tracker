import React, { useState, useEffect } from 'react';
import { Save, User, RotateCcw, CheckCircle2, Plus, X, Trash2, Target, Layers, Timer, Box, Flag, MousePointer2 } from 'lucide-react';
import { DRILL_CATEGORIES, getAllDrills, getDefaultWeeklyRoutine, getDrillById } from '../lib/drills';

export default function Settings() {
    const [settings, setSettings] = useState({
        userName: 'Ignacio',
        coachName: 'Ruben',
        hcpGoal: '40',
        trainingDays: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: false,
            saturday: false,
            sunday: false
        },
        weeklyRoutine: getDefaultWeeklyRoutine(),
        customDrills: []
    });

    const [selectedDay, setSelectedDay] = useState('monday');
    const [showDrillModal, setShowDrillModal] = useState(false);
    const [modalTab, setModalTab] = useState('library'); // 'library' or 'create'
    const [saving, setSaving] = useState(false);

    // New Drill State
    const [newDrill, setNewDrill] = useState({
        label: '',
        categoryId: 'putt',
        description: '',
        goalType: 'count', // count, score, check
        targetValue: 10
    });

    useEffect(() => {
        const saved = localStorage.getItem('golf_user_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration: Ensure weeklyRoutine exists
            if (!parsed.weeklyRoutine) {
                parsed.weeklyRoutine = getDefaultWeeklyRoutine();
            }
            if (!parsed.customDrills) {
                parsed.customDrills = [];
            }
            setSettings(parsed);
        }
    }, []);

    const handleChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            localStorage.setItem('golf_user_settings', JSON.stringify(settings));
            setSaving(false);
        }, 500);
    };

    const handleAddDrill = (drillId) => {
        const currentDrills = settings.weeklyRoutine[selectedDay] || [];
        if (!currentDrills.includes(drillId)) {
            setSettings(prev => ({
                ...prev,
                weeklyRoutine: {
                    ...prev.weeklyRoutine,
                    [selectedDay]: [...currentDrills, drillId]
                }
            }));
        }
        setShowDrillModal(false);
    };

    const handleRemoveDrill = (drillId) => {
        setSettings(prev => ({
            ...prev,
            weeklyRoutine: {
                ...prev.weeklyRoutine,
                [selectedDay]: prev.weeklyRoutine[selectedDay].filter(id => id !== drillId)
            }
        }));
    };

    const handleCreateDrill = () => {
        if (!newDrill.label) return;

        const drillId = `custom_${Date.now()}`;
        const createdDrill = {
            id: drillId,
            categoryId: newDrill.categoryId,
            label: newDrill.label,
            description: newDrill.description || 'Ejercicio personalizado',
            icon: Target, // Default icon
            inputs: []
        };

        // Configure input based on type
        if (newDrill.goalType === 'check') {
            createdDrill.inputs.push({ key: `${drillId}_check`, label: 'Completado', type: 'checkbox' });
        } else if (newDrill.goalType === 'score') {
            createdDrill.inputs.push({ key: `${drillId}_score`, label: 'Resultado', max: newDrill.targetValue });
        } else {
            createdDrill.inputs.push({ key: `${drillId}_count`, label: `Aciertos / ${newDrill.targetValue}`, max: newDrill.targetValue });
        }

        setSettings(prev => ({
            ...prev,
            customDrills: [...prev.customDrills, createdDrill],
            weeklyRoutine: {
                ...prev.weeklyRoutine,
                [selectedDay]: [...(prev.weeklyRoutine[selectedDay] || []), drillId]
            }
        }));

        // Reset and close
        setNewDrill({ label: '', categoryId: 'putt', description: '', goalType: 'count', targetValue: 10 });
        setShowDrillModal(false);
    };

    // Derived logic
    const allDrills = getAllDrills(settings.customDrills);
    const dayDrills = (settings.weeklyRoutine[selectedDay] || []).map(id => getDrillById(id, settings.customDrills)).filter(Boolean);

    const sectionStyle = {
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    };

    const inputStyle = {
        width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #eee', marginTop: '0.5rem', fontSize: '1rem'
    };

    const labelStyle = { fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', display: 'block' };

    const DAYS_MAP = {
        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
        friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <User size={28} className="text-primary" />
                    Ajustes de Perfil
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Personaliza tu experiencia de entrenamiento.</p>
            </div>

            <div style={sectionStyle}>
                {/* Basic Info */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Tu Nombre</label>
                    <input type="text" value={settings.userName} onChange={(e) => handleChange('userName', e.target.value)} style={inputStyle} placeholder="Ej. Tiger Woods" />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Nombre del Profesor</label>
                    <input type="text" value={settings.coachName} onChange={(e) => handleChange('coachName', e.target.value)} style={inputStyle} placeholder="Ej. Butch Harmon" />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Meta de Hándicap</label>
                    <input type="number" value={settings.hcpGoal} onChange={(e) => handleChange('hcpGoal', e.target.value)} style={inputStyle} placeholder="Ej. 18" />
                </div>

                {/* Training Days Toggle */}
                <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    <label style={{ ...labelStyle, marginBottom: '1rem' }}>Días Activos (Agenda)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {Object.entries(DAYS_MAP).map(([key, label]) => (
                            <label key={key} style={{
                                padding: '0.5rem 0.8rem', borderRadius: '12px',
                                background: settings.trainingDays?.[key] ? 'var(--primary)' : '#f5f5f5',
                                color: settings.trainingDays?.[key] ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                            }}>
                                <input
                                    type="checkbox"
                                    checked={settings.trainingDays?.[key] || false}
                                    onChange={(e) => setSettings(prev => ({ ...prev, trainingDays: { ...prev.trainingDays, [key]: e.target.checked } }))}
                                    style={{ display: 'none' }}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* WEEKLY PLANNER */}
                <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    <label style={{ ...labelStyle, marginBottom: '1rem' }}>Planificador Semanal</label>

                    {/* Day Selector */}
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        {Object.entries(DAYS_MAP).map(([key, label]) => (
                            <button key={key} onClick={() => setSelectedDay(key)} style={{
                                flex: '0 0 auto', padding: '0.6rem 1rem', borderRadius: '10px', border: 'none',
                                background: selectedDay === key ? 'var(--primary)' : 'white',
                                color: selectedDay === key ? 'white' : 'var(--text-muted)',
                                border: selectedDay === key ? 'none' : '1px solid #eee',
                                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                            }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Drills List for Selected Day */}
                    <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '16px', minHeight: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>Rutina para el {DAYS_MAP[selectedDay]}</span>
                            <button onClick={() => setShowDrillModal(true)} style={{
                                background: 'white', border: '1px solid var(--primary)', color: 'var(--primary)',
                                padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                            }}>
                                <Plus size={14} /> Añadir Ejercicio
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {dayDrills.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>
                                    No hay ejercicios asignados.
                                </p>
                            ) : (
                                dayDrills.map((drill, idx) => (
                                    <div key={`${drill.id}-${idx}`} style={{
                                        background: 'white', padding: '0.8rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{ padding: '6px', borderRadius: '8px', background: `${DRILL_CATEGORIES.find(c => c.id === drill.categoryId)?.color}20` }}>
                                                <drill.icon size={16} color={DRILL_CATEGORIES.find(c => c.id === drill.categoryId)?.color || '#555'} />
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{drill.label}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{drill.description}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveDrill(drill.id)} style={{ color: '#ef233c', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SAVE BUTTON */}
            <button onClick={handleSave} disabled={saving} style={{
                background: 'var(--primary)', color: 'white', width: '100%', padding: '1rem', borderRadius: '16px', border: 'none',
                fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.8 : 1, boxShadow: '0 8px 20px rgba(56, 102, 65, 0.3)'
            }}>
                {saving ? 'Guardando...' : <> <Save size={20} /> Guardar Cambios </>}
            </button>

            {/* DRILL SELECTION MODAL */}
            {showDrillModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '500px', height: '85vh',
                        borderRadius: '24px 24px 0 0', padding: '1.5rem', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Añadir a {DAYS_MAP[selectedDay]}</h3>
                            <button onClick={() => setShowDrillModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {/* Modal Tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f5f5f5', padding: '4px', borderRadius: '12px' }}>
                            <button onClick={() => setModalTab('library')} style={{
                                flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', fontWeight: 600,
                                background: modalTab === 'library' ? 'white' : 'transparent', boxShadow: modalTab === 'library' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                            }}>Biblioteca</button>
                            <button onClick={() => setModalTab('create')} style={{
                                flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', fontWeight: 600,
                                background: modalTab === 'create' ? 'white' : 'transparent', boxShadow: modalTab === 'create' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                            }}>Crear Propio</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {modalTab === 'library' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {DRILL_CATEGORIES.map(cat => (
                                        <div key={cat.id}>
                                            <h4 style={{ color: cat.color, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{cat.label}</h4>
                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                {allDrills.filter(d => d.categoryId === cat.id).map(drill => {
                                                    const isSelected = settings.weeklyRoutine[selectedDay]?.includes(drill.id);
                                                    return (
                                                        <button key={drill.id} onClick={() => handleAddDrill(drill.id)} disabled={isSelected} style={{
                                                            padding: '0.8rem', borderRadius: '12px', border: '1px solid #eee', background: isSelected ? '#f9f9f9' : 'white',
                                                            textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            opacity: isSelected ? 0.6 : 1
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                <div style={{ background: `${cat.color}15`, padding: '6px', borderRadius: '8px' }}>
                                                                    <drill.icon size={18} color={cat.color} />
                                                                </div>
                                                                <div>
                                                                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{drill.label}</span>
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{drill.description}</span>
                                                                </div>
                                                            </div>
                                                            {isSelected ? <CheckCircle2 size={18} color="green" /> : <Plus size={18} color="var(--primary)" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Nombre del Ejercicio</label>
                                        <input type="text" value={newDrill.label} onChange={e => setNewDrill({ ...newDrill, label: e.target.value })} style={inputStyle} placeholder="Ej. Putt Corto Presión" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Categoría</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {DRILL_CATEGORIES.map(cat => (
                                                <button key={cat.id} onClick={() => setNewDrill({ ...newDrill, categoryId: cat.id })} style={{
                                                    padding: '0.5rem 0.8rem', borderRadius: '8px', border: newDrill.categoryId === cat.id ? `2px solid ${cat.color}` : '1px solid #eee',
                                                    background: newDrill.categoryId === cat.id ? `${cat.color}10` : 'white', fontWeight: 600, fontSize: '0.85rem'
                                                }}>{cat.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Descripción</label>
                                        <input type="text" value={newDrill.description} onChange={e => setNewDrill({ ...newDrill, description: e.target.value })} style={inputStyle} placeholder="Breve descripción..." />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Tipo de Objetivo</label>
                                        <select value={newDrill.goalType} onChange={e => setNewDrill({ ...newDrill, goalType: e.target.value })} style={inputStyle}>
                                            <option value="count">Contador (Aciertos/Total)</option>
                                            <option value="score">Resultado (Número simple)</option>
                                            <option value="check">Checkbox (Sí/No)</option>
                                        </select>
                                    </div>
                                    {newDrill.goalType !== 'check' && (
                                        <div>
                                            <label style={labelStyle}>Objetivo Numérico</label>
                                            <input type="number" value={newDrill.targetValue} onChange={e => setNewDrill({ ...newDrill, targetValue: parseInt(e.target.value) })} style={inputStyle} />
                                        </div>
                                    )}

                                    <button onClick={handleCreateDrill} disabled={!newDrill.label} style={{
                                        marginTop: '1rem', background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px',
                                        border: 'none', fontWeight: 700, fontSize: '1rem', opacity: !newDrill.label ? 0.5 : 1
                                    }}>
                                        Crear y Añadir
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
