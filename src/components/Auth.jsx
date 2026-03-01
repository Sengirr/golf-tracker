import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Flag, Loader2 } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('¡Revisa tu email para confirmar el registro!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f4f0 0%, #d8e6d8 100%)',
            padding: '1.5rem'
        }}>
            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                background: 'white'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--primary)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 8px 16px rgba(56, 102, 65, 0.2)'
                    }}>
                        <Flag size={32} fill="white" color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', margin: 0 }}>GOLFTRACKER</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {isSignUp ? 'Crea tu cuenta de golfista' : 'Bienvenido de nuevo, jugador'}
                    </p>
                </div>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '3rem', width: '100%' }}
                                placeholder="tu@email.com"
                            />
                        </div>
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '3rem', width: '100%' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: message.includes('Revisa') ? '#e8f5e9' : '#ffebee',
                            color: message.includes('Revisa') ? '#2e7d32' : '#c62828',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem'
                        }}
                    >
                        {loading ? <Loader2 size={20} className="spin" /> : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontWeight: 700,
                                marginLeft: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            {isSignUp ? 'Inicia sesión' : 'Regístrate aquí'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
