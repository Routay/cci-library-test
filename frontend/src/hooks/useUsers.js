import { useState, useEffect, useCallback } from 'react';
import { usersAPI, statsAPI } from '../services/api';

export function useUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const { data } = await usersAPI.getAll();
      setUsers(data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur chargement membres');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createUser   = async d  => { const { data } = await usersAPI.create(d);          setUsers(p => [data,...p]); return data; };
  const updateUser   = async (id,d) => { const { data } = await usersAPI.update(id,d);   setUsers(p => p.map(u => u._id===id?data:u)); return data; };
  const toggleActive = async id => { const { data } = await usersAPI.toggleActive(id);   setUsers(p => p.map(u => u._id===id?data:u)); return data; };

  return { users, loading, error, refetch: fetch, createUser, updateUser, toggleActive };
}

export function useDashStats() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await statsAPI.dashboard();
      setStats(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur stats');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, loading, error, refetch: fetch };
}