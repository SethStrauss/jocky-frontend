import React, { useState, useEffect, useRef } from 'react';
import { upsertChatDB } from '../services/db';
import './MessagesView.css';

interface ChatMessage {
  id: string;
  sender: 'venue' | 'dj' | 'system';
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  eventId: string;
  eventName: string;
  venueName: string;
  artistName: string;
  acceptedAt: string;
  messages: ChatMessage[];
  venueUnread: number;  // unread for venue (messages sent by DJ)
  djUnread: number;     // unread for DJ (messages sent by venue)
}

export function loadChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem('jocky_chats') || '[]');
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]) {
  localStorage.setItem('jocky_chats', JSON.stringify(chats));
}

export function saveChatAndSync(chat: Chat) {
  const all = loadChats();
  const updated = all.find(c => c.id === chat.id)
    ? all.map(c => c.id === chat.id ? chat : c)
    : [...all, chat];
  saveChats(updated);
  upsertChatDB(chat);
}

export function getUnreadCount(perspective: 'venue' | 'dj'): number {
  const chats = loadChats();
  return chats.reduce((sum, c) =>
    sum + (perspective === 'venue' ? (c.venueUnread || 0) : (c.djUnread || 0)), 0
  );
}

export function markAllRead(perspective: 'venue' | 'dj') {
  const chats = loadChats();
  const key = perspective === 'venue' ? 'venueUnread' : 'djUnread';
  saveChats(chats.map(c => ({ ...c, [key]: 0 })));
}

// Creates a chat between a venue and an artist if one doesn't exist yet.
export function ensureChat(artistId: string, artistName: string, venueName: string, venueId?: string): string {
  const effectiveVenueId = venueId || venueName.replace(/\s+/g, '_');
  const chatId = `conv_${effectiveVenueId}_${artistId}`;
  const chats = loadChats();
  if (!chats.find(c => c.id === chatId)) {
    const newChat: Chat = {
      id: chatId,
      eventId: artistId,
      eventName: '',
      venueName,
      artistName,
      acceptedAt: new Date().toISOString(),
      messages: [],
      venueUnread: 0,
      djUnread: 0,
    };
    const updated = [...chats, newChat];
    saveChats(updated);
    // Sync to Supabase with real IDs
    upsertChatDB({ ...newChat, venueId: venueId || '', artistId });
  }
  return chatId;
}

interface MessagesViewProps {
  perspective?: 'venue' | 'dj';
  userId?: string;
  profiles?: any[]; // DJ profiles (venue side) or venue profiles (DJ side)
  openChatId?: string;
  onChatOpened?: () => void;
}

const MessagesView: React.FC<MessagesViewProps> = ({ perspective = 'venue', userId, profiles = [], openChatId, onChatOpened }) => {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pick up new chats / messages from other side in real time (cross-tab)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== 'jocky_chats') return;
      const updated: Chat[] = JSON.parse(e.newValue || '[]');
      setChats(updated);
      setSelectedChat(prev => prev ? (updated.find(c => c.id === prev.id) ?? prev) : null);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Also re-load on mount so switching tabs picks up latest
  useEffect(() => {
    const latest = loadChats();
    setChats(latest);
  }, []);

  // Auto-open a specific chat (e.g. when navigating from artist pool)
  useEffect(() => {
    if (!openChatId) return;
    const latest = loadChats();
    const chat = latest.find(c => c.id === openChatId);
    if (chat) {
      handleSelectChat(chat);
      onChatOpened?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: perspective,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    const otherUnreadKey = perspective === 'venue' ? 'djUnread' : 'venueUnread';
    const updatedChats = chats.map(c =>
      c.id === selectedChat.id
        ? { ...c, messages: [...c.messages, msg], [otherUnreadKey]: (c[otherUnreadKey] || 0) + 1 }
        : c
    );
    saveChats(updatedChats);
    setChats(updatedChats);
    const updatedChat = updatedChats.find(c => c.id === selectedChat.id)!;
    setSelectedChat(updatedChat);
    setNewMessage('');
    upsertChatDB(updatedChat);
  };

  const handleSelectChat = (chat: Chat) => {
    const myUnreadKey = perspective === 'venue' ? 'venueUnread' : 'djUnread';
    const updatedChats = chats.map(c =>
      c.id === chat.id ? { ...c, [myUnreadKey]: 0 } : c
    );
    saveChats(updatedChats);
    setChats(updatedChats);
    setSelectedChat(updatedChats.find(c => c.id === chat.id)!);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const getOtherParty = (chat: Chat) =>
    perspective === 'venue' ? chat.artistName : chat.venueName;

  const getPhoto = (chat: Chat): string => {
    if (perspective === 'venue') {
      return profiles.find(p => p.id === chat.eventId)?.photo || '';
    } else {
      const venueId = (chat as any).venueId || chat.id.split('_')[1] || '';
      return profiles.find(p => p.id === venueId)?.photo || '';
    }
  };

  const lastMsg = (chat: Chat) => chat.messages[chat.messages.length - 1];

  const filtered = chats.filter(c =>
    getOtherParty(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDark = perspective === 'dj';

  return (
    <div className={`messages-view${isDark ? ' messages-view--dark' : ''}`}>
      <h1 className="messages-title">Messages</h1>

      <div className="messages-content">
        {/* Sidebar */}
        <div className="conversations-panel">
          <input
            type="text"
            placeholder="Search…"
            className="message-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="conversations-list">
            {filtered.length === 0 && (
              <p className="conv-empty">
                {chats.length === 0
                  ? 'No conversations yet. Chats appear automatically when a booking is confirmed.'
                  : 'No results.'}
              </p>
            )}
            {filtered.map(chat => {
              const myUnread = perspective === 'venue' ? (chat.venueUnread || 0) : (chat.djUnread || 0);
              return (
              <div
                key={chat.id}
                className={`conversation-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className="conversation-avatar" style={getPhoto(chat) ? { padding: 0, overflow: 'hidden' } : undefined}>
                  {getPhoto(chat)
                    ? <img src={getPhoto(chat)} alt={getOtherParty(chat)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : getOtherParty(chat).charAt(0).toUpperCase()
                  }
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="conversation-name">{getOtherParty(chat)}</span>
                    <span className="conversation-time">{formatTime(lastMsg(chat)?.timestamp)}</span>
                  </div>
                  <div className="conversation-event">{chat.eventName}</div>
                  <div className="conversation-preview">{lastMsg(chat)?.text}</div>
                </div>
                {myUnread > 0 && (
                  <div className="conv-unread-badge">{myUnread}</div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Chat panel */}
        <div className="message-panel">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-avatar" style={getPhoto(selectedChat) ? { padding: 0, overflow: 'hidden' } : undefined}>
                  {getPhoto(selectedChat)
                    ? <img src={getPhoto(selectedChat)} alt={getOtherParty(selectedChat)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : getOtherParty(selectedChat).charAt(0)
                  }
                </div>
                <div className="chat-info">
                  <div className="chat-name">{getOtherParty(selectedChat)}</div>
                  <div className="chat-event">{selectedChat.eventName}</div>
                </div>
              </div>

              <div className="chat-messages">
                {selectedChat.messages.map(msg => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="message-system">
                        <span>{msg.text}</span>
                      </div>
                    );
                  }
                  const isMine = msg.sender === perspective;
                  return (
                    <div key={msg.id} className={`message ${isMine ? 'message-sent' : 'message-received'}`}>
                      <div className="message-bubble">
                        <div className="message-text">{msg.text}</div>
                        <div className="message-time">{formatMessageTime(msg.timestamp)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="empty-messages">
              <svg viewBox="0 0 24 24" fill="currentColor" className="empty-icon">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesView;
