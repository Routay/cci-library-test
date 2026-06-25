import { useState, useEffect, useCallback } from 'react';
import { loansAPI } from '../services/api';

export function useLoans(params = {}) {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const { data } = await loansAPI.getAll({ limit: 200, ...params });
      setLoans(data.loans || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur chargement emprunts');
    } finally { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  const createLoan    = async d  => { const { data } = await loansAPI.create(d);          setLoans(p => [data,...p]); return data; };
  const markReturned  = async id => { const { data } = await loansAPI.markReturned(id);   setLoans(p => p.map(l => l._id===id?data:l)); return data; };
  const updateLoan    = async (id,d) => { const { data } = await loansAPI.update(id,d);   setLoans(p => p.map(l => l._id===id?data:l)); return data; };
  const extendLoan    = async (id,d) => { const { data } = await loansAPI.extend(id,d);   setLoans(p => p.map(l => l._id===id?data:l)); return data; };
  const deleteLoan    = async id => { await loansAPI.delete(id);                           setLoans(p => p.filter(l => l._id!==id)); };

  return { loans, loading, error, refetch: fetch, createLoan, markReturned, updateLoan, extendLoan, deleteLoan };
}