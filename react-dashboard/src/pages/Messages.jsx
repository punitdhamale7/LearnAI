import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Send, Plus, X, MessageSquare, User,
  Check, CheckCheck, Clock, Users
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

/* ─── helpers ─────────────────────────────────────────────── */
function getSession() {
  try { return JSON.parse(localStorage.getItem('learnai_session')); } catch { return null; }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=6B7280&color=fff&size=80`;
}

/* ─── Avatar component ─────────────────────────────────────── */
const Avatar = ({ src, name, size = 40 }) => (
  <img
    src={src || avatarUrl(name)}
    alt={name}
    onError={e => { e.target.src = avatarUrl(name); }}
    style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
  />
);

/* ═══════════════════════════════════════════════════════════ */
const Messages = () => {
  const session = getSession();
  const myId = session?.id;
  const myName = session?.name || session?.full_name || 'Me';

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);   // full conv object
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // New chat modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  /* ── load conversations ── */
  const loadConversations = useCallback(async () => {
    if (!myId) return;
    try {
      const res = await fetch(`${API_BASE}/messages/conversations/${myId}`);
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch (e) { /* silent */ }
    setLoadingConvs(false);
  }, [myId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  /* ── load messages for active conversation ── */
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${API_BASE}/messages/conversation/${convId}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (e) { /* silent */ }
    setLoadingMsgs(false);
    // mark read
    if (myId) fetch(`${API_BASE}/messages/mark-read/${convId}/${myId}`, { method: 'PUT' }).catch(() => {});
  }, [myId]);

  /* ── open conversation ── */
  const openConversation = (conv) => {
    setActiveConv(conv);
    setMessages([]);
    loadMessages(conv.conversation_id);
    // update unread badge locally
    setConversations(prev => prev.map(c =>
      c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
    ));
  };

  /* ── scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── polling: refresh messages every 3s when a conv is open ── */
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!activeConv) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/messages/conversation/${activeConv.conversation_id}`);
        const data = await res.json();
        if (data.success) setMessages(data.messages || []);
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  /* ── polling: refresh conversation list every 5s ── */
  useEffect(() => {
    const t = setInterval(loadConversations, 5000);
    return () => clearInterval(t);
  }, [loadConversations]);

  /* ── send message ── */
  const sendMessage = async () => {
    if (!text.trim() || !activeConv || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    // optimistic
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: myId,
      receiver_id: activeConv.other_user_id,
      message_text: msgText,
      created_at: new Date().toISOString(),
      is_read: false,
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`${API_BASE}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: myId, receiver_id: activeConv.other_user_id, message_text: msgText }),
      });
      const data = await res.json();
      if (data.success) {
        await loadMessages(activeConv.conversation_id);
        await loadConversations();
      }
    } catch { /* silent */ }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── load all users for new chat ── */
  const openNewChat = async () => {
    setShowNewChat(true);
    setUserSearch('');
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/users/all/${myId}`);
      const data = await res.json();
      if (data.success) setAllUsers(data.users || []);
    } catch { /* silent */ }
    setLoadingUsers(false);
  };

  /* ── start chat with a user ── */
  const startChat = async (user) => {
    setShowNewChat(false);
    // send a blank "hello" to create conversation, or just open if exists
    try {
      const res = await fetch(`${API_BASE}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: myId, receiver_id: user.id, message_text: '👋 Hey there!' }),
      });
      const data = await res.json();
      if (data.success) {
        await loadConversations();
        // find or create conv object
        const conv = {
          conversation_id: data.conversation_id,
          other_user_id: user.id,
          other_user_name: user.full_name,
          other_user_avatar: user.avatar_url,
          unread_count: 0,
        };
        openConversation(conv);
      }
    } catch { /* silent */ }
  };

  /* ── filtered lists ── */
  const filteredConvs = conversations.filter(c =>
    (c.other_user_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = allUsers.filter(u =>
    (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  /* ── group messages by date ── */
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  /* mobile: track which panel is visible */
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const isMobileWidth = window.innerWidth <= 640;

  const openConversationMobile = (conv) => {
    openConversation(conv);
    if (isMobileWidth) setMobileView('chat');
  };

  /* ════════════════════════════════════════════════════════ */
  return (
    <div style={styles.root}>

      {/* ── LEFT PANEL ── */}
      <div style={{ ...styles.leftPanel, display: isMobileWidth && mobileView === 'chat' ? 'none' : 'flex' }}>
        {/* Header */}
        <div style={styles.leftHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={20} color="#6B7280" />
            <span style={styles.leftTitle}>Messages</span>
          </div>
          <button style={styles.newChatBtn} onClick={openNewChat} title="New Chat">
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <Search size={15} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Conversation list */}
        <div style={styles.convList}>
          {loadingConvs ? (
            <div style={styles.emptyState}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading...</p>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={styles.emptyState}>
              <Users size={36} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
                {search ? 'No results found' : 'No conversations yet.\nClick + to start chatting!'}
              </p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <div
                key={conv.conversation_id}
                style={{
                  ...styles.convItem,
                  background: activeConv?.conversation_id === conv.conversation_id ? '#F3F4F6' : 'transparent',
                  borderLeft: activeConv?.conversation_id === conv.conversation_id ? '3px solid #6B7280' : '3px solid transparent',
                }}
                onClick={() => openConversationMobile(conv)}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar src={conv.other_user_avatar} name={conv.other_user_name} size={44} />
                  {conv.unread_count > 0 && (
                    <span style={styles.unreadDot}>{conv.unread_count}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontWeight: conv.unread_count > 0 ? 700 : 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.other_user_name || 'Unknown'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginLeft: 6 }}>
                      {timeAgo(conv.last_message_time)}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: conv.unread_count > 0 ? '#374151' : '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                    {conv.last_message || 'Start a conversation'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ ...styles.rightPanel, display: isMobileWidth && mobileView === 'list' ? 'none' : 'flex' }}>
        {!activeConv ? (
          /* Empty state */
          <div style={styles.noConvState}>
            <MessageSquare size={56} color="#D1D5DB" style={{ marginBottom: 20 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Your Messages</h3>
            <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24, textAlign: 'center', maxWidth: 300 }}>
              Select a conversation or start a new one to begin chatting
            </p>
            <button style={styles.startChatBtn} onClick={openNewChat}>
              <Plus size={16} /> New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Back button — mobile only */}
                {isMobileWidth && (
                  <button
                    onClick={() => setMobileView('list')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#6B7280', display: 'flex', alignItems: 'center' }}
                  >
                    ← Back
                  </button>
                )}
                <Avatar src={activeConv.other_user_avatar} name={activeConv.other_user_name} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{activeConv.other_user_name}</div>
                  <div style={{ fontSize: 12, color: '#10b981' }}>● Online</div>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div style={styles.messagesArea}>
              {loadingMsgs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="spinner" />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                  <MessageSquare size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14 }}>No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div style={styles.dateSep}>
                      <span style={styles.dateSepText}>{date}</span>
                    </div>
                    {msgs.map((msg, i) => {
                      const isMine = msg.sender_id === myId;
                      const showAvatar = !isMine && (i === 0 || msgs[i - 1]?.sender_id !== msg.sender_id);
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 6, alignItems: 'flex-end', gap: 8 }}>
                          {!isMine && (
                            <div style={{ width: 32, flexShrink: 0 }}>
                              {showAvatar && <Avatar src={activeConv.other_user_avatar} name={activeConv.other_user_name} size={32} />}
                            </div>
                          )}
                          <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              ...styles.bubble,
                              background: isMine ? '#4B5563' : '#FFFFFF',
                              color: isMine ? '#FFFFFF' : '#111827',
                              boxShadow: isMine ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                              opacity: msg.optimistic ? 0.7 : 1,
                            }}>
                              {msg.message_text}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatTime(msg.created_at)}</span>
                              {isMine && (
                                msg.is_read
                                  ? <CheckCheck size={12} color="#6B7280" />
                                  : <Check size={12} color="#9CA3AF" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={styles.inputArea}>
              <div style={styles.inputWrap}>
                <textarea
                  ref={inputRef}
                  style={styles.textarea}
                  placeholder="Type a message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button
                  style={{ ...styles.sendBtn, opacity: text.trim() && !sending ? 1 : 0.4 }}
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                >
                  <Send size={18} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── NEW CHAT MODAL ── */}
      {showNewChat && (
        <div style={styles.modalOverlay} onClick={() => setShowNewChat(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>New Conversation</span>
              <button style={styles.closeBtn} onClick={() => setShowNewChat(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={styles.searchWrap}>
                <Search size={15} color="#9CA3AF" />
                <input
                  style={styles.searchInput}
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {loadingUsers ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  <User size={32} color="#D1D5DB" style={{ marginBottom: 8 }} />
                  <p>No users found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    style={styles.userItem}
                    onClick={() => startChat(user)}
                  >
                    <Avatar src={user.avatar_url} name={user.full_name} size={44} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{user.full_name}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>@{user.username || 'user'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Styles ───────────────────────────────────────────────── */
const isMobile = () => window.innerWidth <= 640;

const styles = {
  root: {
    display: 'flex',
    height: 'calc(100vh - 70px)',
    background: '#F9FAFB',
    overflow: 'hidden',
  },
  /* Left panel */
  leftPanel: {
    width: window.innerWidth <= 640 ? '100%' : 320,
    maxWidth: window.innerWidth <= 640 ? '100%' : 320,
    flexShrink: 0,
    background: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  leftHeader: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftTitle: {
    fontWeight: 800,
    fontSize: 18,
    color: '#111827',
  },
  newChatBtn: {
    width: 34,
    height: 34,
    background: '#4B5563',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#F3F4F6',
    padding: '8px 12px',
    margin: '10px 12px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: 13,
    width: '100%',
    color: '#374151',
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
  },
  convItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderBottom: '1px solid #F9FAFB',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    background: '#EF4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  /* Right panel */
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#F9FAFB',
  },
  noConvState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  startChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    background: '#4B5563',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    transition: 'background 0.2s',
  },
  chatHeader: {
    padding: '12px 20px',
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  dateSep: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16px 0 12px',
  },
  dateSepText: {
    background: '#E5E7EB',
    color: '#6B7280',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 12px',
    letterSpacing: '0.3px',
  },
  bubble: {
    padding: '10px 14px',
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: 'break-word',
    maxWidth: '100%',
  },
  inputArea: {
    padding: '12px 20px 16px',
    background: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    flexShrink: 0,
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    background: '#F3F4F6',
    padding: '8px 12px',
  },
  textarea: {
    flex: 1,
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: 14,
    resize: 'none',
    fontFamily: 'inherit',
    color: '#111827',
    lineHeight: 1.5,
    maxHeight: 120,
    overflowY: 'auto',
  },
  sendBtn: {
    width: 36,
    height: 36,
    background: '#4B5563',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  /* Modal */
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    background: '#fff',
    width: 420,
    maxWidth: '95vw',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderBottom: '1px solid #F9FAFB',
  },
};

export default Messages;
