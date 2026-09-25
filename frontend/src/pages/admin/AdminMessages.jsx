import React, { useState, useEffect, useRef } from 'react';
import { Send, User, CheckCircle, Search, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import './AdminMessages.css';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeContactId, setActiveContactId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/api/messages/admin/conversations');
      setMessages(res.data);
      // Auto-select first contact if none selected
      if (!activeContactId && res.data.length > 0) {
        const firstMsg = res.data[0];
        const otherUser = firstMsg.isAdminSender ? firstMsg.receiverId : firstMsg.senderId;
        if (otherUser) setActiveContactId(otherUser._id);
      }
    } catch (err) {
      setError('Erreur lors de la récupération des messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContactId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeContactId || sending) return;
    setSending(true);
    try {
      const res = await api.post('/api/messages', {
        content: replyContent,
        receiverId: activeContactId
      });
      // Mettre à jour l'état localement en attendant le refetch
      setMessages([res.data, ...messages]);
      setReplyContent('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (msgId) => {
    try {
      await api.patch(`/api/messages/${msgId}/read`);
      setMessages(messages.map(m => m._id === msgId ? { ...m, isRead: true } : m));
    } catch (err) {
      console.error("Impossible de marquer comme lu", err);
    }
  };

  // Grouper les messages par contact
  const contactsMap = {};
  messages.forEach(msg => {
    const otherUser = msg.isAdminSender ? msg.receiverId : msg.senderId;
    if (!otherUser || !otherUser._id) return;
    const id = otherUser._id;
    
    if (!contactsMap[id]) {
      contactsMap[id] = {
        user: otherUser,
        messages: [],
        lastMessage: msg, // puisque trié par date decroissante
        unread: 0
      };
    }
    contactsMap[id].messages.push(msg);
    if (!msg.isRead && !msg.isAdminSender) {
      contactsMap[id].unread += 1;
    }
  });

  // Convertir en tableau et filtrer
  const contactsList = Object.values(contactsMap).filter(c => {
    const fullName = `${c.user.prenom} ${c.user.nom}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const activeContactData = activeContactId ? contactsMap[activeContactId] : null;
  const activeMessages = activeContactData ? [...activeContactData.messages].reverse() : [];

  // Marquer les messages actifs comme lus lorsqu'on ouvre la discussion
  useEffect(() => {
    if (activeContactId) {
      activeMessages.forEach(msg => {
        if (!msg.isRead && !msg.isAdminSender) {
          markAsRead(msg._id);
        }
      });
    }
  }, [activeContactId, messages]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-chat-layout">
      {/* ── Liste des contacts (Sidebar) ── */}
      <div className="admin-chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Discussions</h2>
          <div className="chat-search-bar">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Rechercher un bénévole..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-contacts-list">
          {contactsList.length === 0 && (
            <div className="chat-empty-state">
              <MessageSquare size={32} />
              <p>Aucune discussion trouvée.</p>
            </div>
          )}
          {contactsList.map(contact => (
            <div 
              key={contact.user._id} 
              className={`chat-contact-item ${activeContactId === contact.user._id ? 'active' : ''}`}
              onClick={() => setActiveContactId(contact.user._id)}
            >
              <div className="chat-contact-avatar">
                {contact.user.prenom?.charAt(0)}{contact.user.nom?.charAt(0)}
              </div>
              <div className="chat-contact-info">
                <div className="chat-contact-top">
                  <span className="chat-contact-name">{contact.user.prenom} {contact.user.nom}</span>
                  <span className="chat-contact-date">
                    {new Date(contact.lastMessage.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="chat-contact-bottom">
                  <span className="chat-contact-lastmsg">
                    {contact.lastMessage.isAdminSender ? 'Vous: ' : ''}{contact.lastMessage.content}
                  </span>
                  {contact.unread > 0 && (
                    <span className="chat-unread-badge">{contact.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fenêtre de chat principale ── */}
      <div className="admin-chat-main">
        {activeContactData ? (
          <>
            <div className="chat-main-header">
              <div className="chat-contact-avatar">
                {activeContactData.user.prenom?.charAt(0)}{activeContactData.user.nom?.charAt(0)}
              </div>
              <div className="chat-header-info">
                <h3>
                  {activeContactData.user.prenom} {activeContactData.user.nom}
                </h3>
                <span>
                  <span className="chat-header-status"></span>
                  {activeContactData.user.partnerStatus === 'approved' ? '⭐ Partenaire Officiel' : 'Bénévole'}
                </span>
              </div>
            </div>

            <div className="chat-messages-area">
              {activeMessages.map(msg => (
                <div key={msg._id} className={`admin-msg-wrap ${msg.isAdminSender ? 'mine' : 'theirs'}`}>
                  <div className={`admin-msg-bubble ${msg.isAdminSender ? 'mine' : 'theirs'}`}>
                    {msg.content}
                  </div>
                  <span className="admin-msg-time">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {msg.isAdminSender && msg.isRead && <CheckCircle size={12} style={{ marginLeft: 4 }} />}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleReply}>
              <input 
                type="text" 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Répondre à ${activeContactData.user.prenom}...`}
                className="chat-input-field"
              />
              <button type="submit" className="chat-send-btn" disabled={!replyContent.trim() || sending}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-no-selection">
            <div className="chat-no-selection-icon">
              <MessageSquare size={40} />
            </div>
            <h3>Sélectionnez une discussion</h3>
            <p>Cliquez sur un contact à gauche pour afficher l'historique des messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
