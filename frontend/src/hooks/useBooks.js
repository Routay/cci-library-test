import { useState, useEffect, useCallback } from 'react';
import { booksAPI } from '../services/api';

export function useBooks(params = {}) {
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const { data } = await booksAPI.getAll({ limit: 200, ...params });
      setBooks(data.books || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur chargement livres');
    } finally { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  const createBook = async d => { const { data } = await booksAPI.create(d); setBooks(p => [data,...p]); return data; };
  const updateBook = async (id,d) => { const { data } = await booksAPI.update(id,d); setBooks(p => p.map(b => b._id===id?data:b)); return data; };
  const deleteBook = async id => { await booksAPI.delete(id); setBooks(p => p.filter(b => b._id!==id)); };

  return { books, loading, error, refetch: fetch, createBook, updateBook, deleteBook };
}

export function useWeeklyBook() {
  const [book, setBook]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    booksAPI.getWeekly()
      .then(({ data }) => setBook(data))
      .catch(e => setError(e.response?.data?.message || 'Aucun livre de la semaine'))
      .finally(() => setLoading(false));
  }, []);

  const setWeeklyBook = async id => { const { data } = await booksAPI.setWeekly(id); setBook(data); return data; };
  return { book, loading, error, setWeeklyBook };
}