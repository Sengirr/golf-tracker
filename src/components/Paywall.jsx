import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck, Crown, Check, X } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function Paywall({ onClose }) {
    const { upgradeToPro } = useSubscription();

    const handleSubscribe = () => {
        // Simulate a successful checkout process
        // In a real app, this would trigger Stripe/Apple Pay
        const confirm = window.confirm("¿Simular pago exitoso y activar PRO?");
        if (confirm) {
            upgradeToPro();
            if (onClose) onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
        }}>
            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '400px',
                background: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)',
                color: 'white',
                border: '1px solid #444',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '300px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                }}></div>

                {onClose && (
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                )}

                <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
                    <div style={{
                        background: 'linear-gradient(45deg, #D4AF37, #F7EF8A, #D4AF37)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto',
                        boxShadow: '0 0 20px rgba(212,175,55,0.4)'
                    }}>
                        <Crown size={32} color="#1a1a1a" fill="#1a1a1a" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', background: 'linear-gradient(to right, #fff, #bbb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        GolfTracker PRO
                    </h2>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                        Lleva tu entrenamiento al siguiente nivel.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <FeatureRow icon={TrendingUp} text="Gráficas de Evolución Avanzadas" subtitle="Visualiza tu progreso semana a semana." />
                    <FeatureRow icon={Sparkles} text="Caddie IA Ilimitado" subtitle="Estrategias personalizadas para cada situación." />
                    <FeatureRow icon={ShieldCheck} text="Backup en la Nube" subtitle="Tus datos seguros y sincronizados siempre." />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={handleSubscribe}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(45deg, #D4AF37, #C5A028)',
                            color: '#1a1a1a',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                            transform: 'scale(1)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        Empezar Prueba Gratis
                    </button>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>
                        7 días gratis, después 4.99€/mes. Cancela cuando quieras.
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureRow({ icon: Icon, text, subtitle }) {
    return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '12px' }}>
            <div style={{ color: '#D4AF37' }}>
                <Icon size={24} />
            </div>
            <div>
                <p style={{ margin: '0 0 0.2rem 0', fontWeight: 600, fontSize: '0.95rem' }}>{text}</p>
                <p style={{ margin: 0, color: '#888', fontSize: '0.75rem' }}>{subtitle}</p>
            </div>
        </div>
    );
}
