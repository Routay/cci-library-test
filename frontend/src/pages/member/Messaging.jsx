import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Messaging() {
  const { admin: user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef(null);
  const { t } = useTranslation();

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`${API}/api/messages/my-conversation`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages(data);
    } catch (err) {
      console.error("Erreur de récupération des messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchMessages();
  }, [user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data } = await axios.post(`${API}/api/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages([...messages, { ...data, senderId: { _id: user.id, nom: user.nom, prenom: user.prenom } }]);
      setNewMessage('');
    } catch (err) {
      console.error("Erreur lors de l'envoi", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="md-page" style={{ paddingBottom: '40px' }}>
      <div className="md-page-header">
        <div>
          <h2 className="md-page-title">{t('messaging.title')}</h2>
          <p className="md-page-subtitle">{t('messaging.subtitle')}</p>
        </div>
      </div>

      <div className="md-chat-container">
        {/* Messages */}
        <div className="md-chat-messages" ref={chatContainerRef}>
          {loading ? (
            <div className="md-loading">
              <div className="md-spinner" />
              <p>{t('messaging.loading')}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="md-chat-empty">
              <MessageCircle size={48} />
              <h3>{t('messaging.empty_title')}</h3>
              <p>{t('messaging.empty_desc')}</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const senderIdStr = typeof msg.senderId === 'object' ? (msg.senderId?._id || msg.senderId?.id) : msg.senderId;
              const isMine = senderIdStr === user.id;
              return (
                <div key={msg._id || index} className={`md-chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                  <span className="md-chat-sender">{isMine ? t('messaging.sender_you') : t('messaging.sender_admin')}</span>
                  <div className={`md-chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    {msg.content}
                  </div>
                  <span className="md-chat-time">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form className="md-chat-input-bar" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('messaging.placeholder')}
            className="md-chat-input"
          />
          <button type="submit" className="md-chat-send-btn" disabled={!newMessage.trim() || sending}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
