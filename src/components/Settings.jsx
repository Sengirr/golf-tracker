import React, { useState, useEffect } from 'react';
import { Save, User, RotateCcw } from 'lucide-react';

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
        }
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('golf_user_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
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
        // Simulate network delay and save to localStorage
        setTimeout(() => {
            localStorage.setItem('golf_user_settings', JSON.stringify(settings));
            setSaving(false);
            // Optional: Show toast or feedback
        }, 500);
    };

    const sectionStyle = {
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.8rem',
        borderRadius: '12px',
        border: '1px solid #eee',
        marginTop: '0.5rem',
        fontSize: '1rem'
    };

    const labelStyle = {
        fontWeight: 600,
        color: 'var(--primary)',
        fontSize: '0.9rem',
        display: 'block'
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
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Tu Nombre</label>
                    <input
                        type="text"
                        value={settings.userName}
                        onChange={(e) => handleChange('userName', e.target.value)}
                        style={inputStyle}
                        placeholder="Ej. Tiger Woods"
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Nombre del Profesor</label>
                    <input
                        type="text"
                        value={settings.coachName}
                        onChange={(e) => handleChange('coachName', e.target.value)}
                        style={inputStyle}
                        placeholder="Ej. Butch Harmon"
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Aparecerá en los entrenamientos de técnica de los martes.
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Meta de Hándicap</label>
                    <input
                        type="number"
                        value={settings.hcpGoal}
                        onChange={(e) => handleChange('hcpGoal', e.target.value)}
                        style={inputStyle}
                        placeholder="Ej. 18"
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Se usará pare definir los objetivos de aciertos (ej. >15 para HCP 40).
                    </p>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    background: 'var(--primary)',
                    color: 'white',
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.8 : 1,
                    boxShadow: '0 8px 20px rgba(56, 102, 65, 0.3)'
                }}
            >
                {saving ? 'Guardando...' : <> <Save size={20} /> Guardar Cambios </>}
            </button>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Versión 1.2.0 (Commercial Preview)</p>
            </div>
        </div>
    );
}
