/**
 * MessagesPage — TeamAGI
 * Fixed: removed duplicate style={{ }} attribute on conversations sidebar div
 * Fixed: removed broken className="md:flex md:w-80" (Tailwind not configured for this)
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, MessageCircle, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { messageService } from '../services';
import { getSocket, emitTyping } from '../services/socket';
import useAuthStore from '../store/authStore';
import Avatar from '../components/shared/Avatar';

export default function MessagesPage() {
  const { conversationId } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageService.getConversations(),
    select: (r) => r.data.conversations,
  });

  const { data: messages, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageService.getMessages(conversationId),
    enabled: !!conversationId,
    select: (r) => r.data.messages,
  });

  const activeConv = conversations?.find((c) => c._id === conversationId);
  const recipient = activeConv?.participants?.find((p) => p._id !== currentUser?._id);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMsg = ({ conversationId: cId }) => {
      if (cId === conversationId)
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    const onTyping = ({ senderId, isTyping }) => {
      if (senderId === recipient?._id) setRecipientTyping(isTyping);
    };
    const onOnline  = ({ userId }) => setOnlineUsers((s) => new Set([...s, userId]));
    const onOffline = ({ userId }) => setOnlineUsers((s) => { const n = new Set(s); n.delete(userId); return n; });

    socket.on('message:receive', onMsg);
    socket.on('message:typing', onTyping);
    socket.on('user:online',  onOnline);
    socket.on('user:offline', onOffline);
    return () => {
      socket.off('message:receive', onMsg);
      socket.off('message:typing', onTyping);
      socket.off('user:online',  onOnline);
      socket.off('user:offline', onOffline);
    };
  }, [conversationId, recipient?._id, queryClient]);

  const sendMutation = useMutation({
    mutationFn: () =>
      messageService.sendMessage({ recipientId: recipient._id, content: text.trim() }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!isTypingRef.current && recipient) {
      isTypingRef.current = true;
      emitTyping(recipient._id, true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      if (recipient) emitTyping(recipient._id, false);
    }, 1500);
  };

  const handleSend = () => {
    if (!text.trim() || !recipient || sendMutation.isPending) return;
    sendMutation.mutate();
    isTypingRef.current = false;
    if (recipient) emitTyping(recipient._id, false);
  };

  const isOnline = (userId) => onlineUsers.has(userId);

  // ─────────────────────────────────────────────────────────
  // Layout: two-panel on desktop, single panel on mobile
  //
  //  Desktop (≥ 768px): sidebar (320px) | chat area (flex:1)
  //  Mobile            : show sidebar OR chat, not both
  // ─────────────────────────────────────────────────────────
  const showSidebar  = !conversationId;   // mobile: show sidebar when no active chat
  const sidebarStyle = {
    flexDirection: 'column',
    borderRight: '1px solid var(--border)',
    background: 'var(--card-bg)',
    overflow: 'hidden',
    flexShrink: 0,
    // On mobile hide sidebar when a conversation is open
    display: showSidebar ? 'flex' : 'none',
    width: '100%',
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      <style>{`
        @media (min-width: 768px) {
          .msg-sidebar  { display: flex !important; width: 300px !important; }
          .msg-chat-empty { display: flex !important; }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-5px); }
        }
      `}</style>

      {/* ── Conversations sidebar ─────────────────────────── */}
      <div className="msg-sidebar" style={sidebarStyle}>

        {/* Sidebar header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Messages
          </h2>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }}
            />
            <input
              placeholder="Search conversations…"
              className="input"
              style={{ paddingLeft: 36, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Loading skeletons */}
          {convsLoading && [...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: 120, marginBottom: 6, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 11, width: 180, borderRadius: 6 }} />
              </div>
            </div>
          ))}

          {/* Empty state */}
          {!convsLoading && !conversations?.length && (
            <div style={{ padding: '48px 16px', textAlign: 'center' }}>
              <MessageCircle
                size={36}
                style={{ margin: '0 auto 12px', opacity: 0.15, color: 'var(--text-muted)', display: 'block' }}
              />
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No conversations yet</p>
            </div>
          )}

          {/* Conversation items */}
          {conversations?.map((conv) => {
            const other   = conv.participants?.find((p) => p._id !== currentUser?._id);
            const unread  = typeof conv.unreadCounts === 'object'
              ? (conv.unreadCounts?.[currentUser?._id] || 0) : 0;
            const active  = conv._id === conversationId;
            const online  = other && isOnline(other._id);

            return (
              <Link
                key={conv._id}
                to={`/messages/${conv._id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', textDecoration: 'none',
                  background: active ? 'var(--brand-light)' : 'transparent',
                  borderLeft: active ? '3px solid var(--brand)' : '3px solid transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar + online dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar src={other?.avatar?.url} name={other?.displayName || '?'} size={44} />
                  {online && (
                    <span style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 11, height: 11, borderRadius: '50%',
                      background: '#22c55e', border: '2px solid var(--card-bg)',
                    }} />
                  )}
                </div>

                {/* Name + last message */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {other?.displayName}
                    </span>
                    {conv.lastMessageAt && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 6 }}>
                        {formatDistanceToNow(new Date(conv.lastMessageAt))}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: unread > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: unread > 0 ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>

                {unread > 0 && <span className="badge" style={{ flexShrink: 0 }}>{unread}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────── */}
      {conversationId ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--card-bg)', flexShrink: 0,
          }}>
            {/* Back button — mobile only */}
            <Link
              to="/messages"
              style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginRight: 2 }}
              className="md:hidden"
            >
              <ArrowLeft size={20} />
            </Link>

            {recipient && (
              <>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar src={recipient.avatar?.url} name={recipient.displayName || '?'} size={38} />
                  {isOnline(recipient._id) && (
                    <span style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#22c55e', border: '2px solid var(--card-bg)',
                    }} />
                  )}
                </div>
                <div>
                  <Link to={`/profile/${recipient.username}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                    {recipient.displayName}
                  </Link>
                  <p style={{ fontSize: 12, color: isOnline(recipient._id) ? '#22c55e' : 'var(--text-muted)', marginTop: 1 }}>
                    {isOnline(recipient._id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>

            {/* Loading skeletons */}
            {msgsLoading && [...Array(4)].map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
                <div className="skeleton" style={{ height: 40, width: 180, borderRadius: 16 }} />
              </div>
            ))}

            {/* Messages */}
            {messages?.map((msg) => {
              const mine = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id;
              return (
                <div
                  key={msg._id}
                  style={{
                    display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8,
                    flexDirection: mine ? 'row-reverse' : 'row',
                  }}
                >
                  {!mine && (
                    <Avatar
                      src={msg.sender?.avatar?.url}
                      name={msg.sender?.displayName || '?'}
                      size={28}
                    />
                  )}
                  <div style={{
                    maxWidth: '70%', padding: '9px 14px',
                    borderRadius: 18,
                    borderBottomRightRadius: mine ? 4 : 18,
                    borderBottomLeftRadius:  mine ? 18 : 4,
                    background: mine ? 'var(--brand)' : 'var(--bg-tertiary)',
                    color:      mine ? '#fff'         : 'var(--text-primary)',
                    fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
                  }}>
                    <p>{msg.content}</p>
                    <p style={{ fontSize: 10, marginTop: 4, opacity: 0.65, textAlign: mine ? 'right' : 'left' }}>
                      {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {recipientTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                <Avatar src={recipient?.avatar?.url} name={recipient?.displayName || '?'} size={28} />
                <div style={{
                  padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
                  background: 'var(--bg-tertiary)', display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--text-muted)', display: 'block',
                      animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderTop: '1px solid var(--border)',
            background: 'var(--card-bg)', flexShrink: 0,
          }}>
            <input
              type="text"
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message…"
              className="input"
              style={{ flex: 1 }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              style={{
                width: 40, height: 40, borderRadius: 12, border: 'none',
                background: text.trim() ? 'var(--brand)' : 'var(--bg-tertiary)',
                cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: text.trim() ? '#fff' : 'var(--text-muted)',
                transition: 'background 0.15s', flexShrink: 0,
              }}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      ) : (
        /* Empty state — desktop only */
        <div
          className="msg-chat-empty"
          style={{
            flex: 1, display: 'none',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12, color: 'var(--text-muted)',
          }}
        >
          <MessageCircle size={52} style={{ opacity: 0.12 }} />
          <p style={{ fontSize: 15, fontWeight: 500 }}>
            Select a conversation to start messaging
          </p>
        </div>
      )}
    </div>
  );
}