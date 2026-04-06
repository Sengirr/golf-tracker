import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, UserCheck, UserMinus, Search, Clock, Check, X, Users } from 'lucide-react';

export default function Friends() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchFriends();
        fetchPendingRequests();
    }, []);

    async function fetchFriends() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('golf_friendships')
            .select(`
                id,
                status,
                friend:friend_id(id, username, email, avatar_url),
                user:user_id(id, username, email, avatar_url)
            `)
            .eq('status', 'accepted')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (error) console.error('Error fetching friends:', error);
        else {
            const friendList = data.map(f => f.user.id === user.id ? f.friend : f.user);
            setFriends(friendList);
        }
        setLoading(false);
    }

    async function fetchPendingRequests() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('golf_friendships')
            .select(`
                id,
                user:user_id(id, username, email, avatar_url)
            `)
            .eq('friend_id', user.id)
            .eq('status', 'pending');

        if (error) console.error('Error fetching pending requests:', error);
        else setPendingRequests(data);
    }

    async function handleSearch(e) {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);

        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('golf_profiles')
            .select('*')
            .or(`email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
            .neq('id', user.id)
            .limit(5);

        if (error) console.error('Error searching:', error);
        else setSearchResults(data || []);
        setSearching(false);
    }

    async function sendRequest(friendId) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('golf_friendships')
            .insert([{ user_id: user.id, friend_id: friendId, status: 'pending' }]);

        if (error) alert('Ya has enviado una solicitud o ya sois amigos.');
        else alert('Solicitud enviada');
    }

    async function acceptRequest(requestId) {
        const { error } = await supabase
            .from('golf_friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) alert('Error al aceptar solicitud');
        else {
            fetchFriends();
            fetchPendingRequests();
        }
    }

    async function deleteFriendship(friendId) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('golf_friendships')
            .delete()
            .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

        if (error) alert('Error al eliminar');
        else fetchFriends();
    }

    return (
        <div style={{ paddingBottom: '120px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={28} className="text-primary" />
                    Amigos
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Busca a tus compañeros de partida y juega partidas compartidas.</p>
            </div>

            {/* BUSCADOR */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar por email o nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid #eee' }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.2rem' }}>
                        <Search size={20} />
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {searchResults.map(profile => (
                            <div key={profile.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9f9f9', borderRadius: '12px' }}>
                                <div>
                                    <span style={{ fontWeight: 700, display: 'block' }}>{profile.username || 'Usuario'}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.email}</span>
                                </div>
                                <button
                                    onClick={() => sendRequest(profile.id)}
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <UserPlus size={16} /> Añadir
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {searching && <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>Buscando...</p>}
            </div>

            {/* SOLICITUDES PENDIENTES */}
            {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} /> Solicitudes Pendientes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pendingRequests.map(req => (
                            <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                <div>
                                    <span style={{ fontWeight: 700, display: 'block' }}>{req.user.username || 'Usuario'}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.user.email}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => acceptRequest(req.id)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                                        <Check size={18} />
                                    </button>
                                    <button onClick={() => deleteFriendship(req.user.id)} style={{ background: '#f5f5f5', color: '#666', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LISTA DE AMIGOS */}
            <div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Mis Amigos ({friends.length})</h3>
                {loading ? (
                    <p>Cargando amigos...</p>
                ) : friends.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p>Aún no tienes amigos en la app. ¡Invítalos!</p>
                    </div>
                ) : (
                    <div className="grid">
                        {friends.map(friend => (
                            <div key={friend.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)', fontWeight: 800 }}>
                                        {friend.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 700, display: 'block' }}>{friend.username || 'Usuario'}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{friend.email}</span>
                                    </div>
                                </div>
                                <button onClick={() => deleteFriendship(friend.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                                    <UserMinus size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
