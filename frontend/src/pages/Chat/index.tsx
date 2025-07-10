import React, { useEffect, useState, ChangeEvent, KeyboardEvent, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { usersApi, messagesApi, User, Message } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { UserAvatar } from '../../utils/userAvatar';
import EmojiPicker from '../../components/EmojiPicker';
import './Chat.css';

const Chat = () => {
  const currentUser = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersWithNewMessages, setUsersWithNewMessages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef<User | null>(null);

  // Check if we need to open a specific user's chat from navigation state
  useEffect(() => {
    if (location.state?.userId && users.length > 0) {
      const userToSelect = users.find(user => user._id === location.state.userId);
      if (userToSelect) {
        setSelectedUser(userToSelect);
        setMessages([]);
        setError('');
        
        // Remove user from new messages list
        setUsersWithNewMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(userToSelect._id);
          return newSet;
        });
        
        // Load messages for this user
        loadMessagesForUser(userToSelect);
        
        // Clear the navigation state
        navigate('/messages', { replace: true, state: {} });
      }
    }
  }, [location.state, users, navigate]);

  useEffect(() => {
    if (token && currentUser) {
      const newSocket = io('http://localhost:3000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('user_connected', currentUser._id);
      });

      newSocket.on('chat message', (msg: any) => {
        const currentSelectedUser = selectedUserRef.current;
        
        if (msg.to._id === currentUser._id) {
          setUsersWithNewMessages(prev => new Set(prev).add(msg.from._id));
          
          if (currentSelectedUser && msg.from._id === currentSelectedUser._id) {
            setMessages(prev => {
              const messageExists = prev.some(existingMsg => existingMsg._id === msg._id);
              return messageExists ? prev : [...prev, msg];
            });
          }
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      setSocket(newSocket);
      fetchUsers();
      loadUsersWithNewMessages();

      return () => {
        newSocket.disconnect();
      };
    }
  }, [currentUser, token]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    if (selectedUser && token) {
      fetchMessages();
    }
  }, [selectedUser, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAllUsers();
      setUsers(response.filter((user: User) => user._id !== currentUser?._id));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const response = await messagesApi.getMessages(selectedUser._id);
      setMessages(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const messageText = message.trim();
    
    if (!messageText || !selectedUser || !currentUser || sending) {
      return;
    }
    
    setSending(true);
    setMessage('');
    setError('');
    
    try {
      const newMessage = await messagesApi.sendMessage(selectedUser._id, messageText);
      
      setMessages(prev => [...prev, newMessage]);
      
      if (socket && socket.connected) {
        socket.emit('chat message', newMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleUserClick = (user: User) => {
    if (clickTimeout) {
      // Double click - navigate to profile
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      navigate(`/profile/${user._id}`);
    } else {
      // Single click - select user for chat
      const timeout = setTimeout(() => {
        setSelectedUser(user);
        setMessages([]);
        setError('');
        setClickTimeout(null);
        
        // Remove user from new messages list
        setUsersWithNewMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(user._id);
          return newSet;
        });
        
        // Trigger a custom event to update unread counts in sidebar
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }, 300);
      setClickTimeout(timeout);
    }
  };

  const handleAvatarClick = (user: User, event: React.MouseEvent) => {
    event.stopPropagation();
    if (clickTimeout) {
      // Double click - navigate to profile
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      navigate(`/profile/${user._id}`);
    } else {
      // Single click - select user for chat
      const timeout = setTimeout(() => {
        setSelectedUser(user);
        setMessages([]);
        setError('');
        setClickTimeout(null);
        
        // Remove user from new messages list
        setUsersWithNewMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(user._id);
          return newSet;
        });
        
        // Trigger a custom event to update unread counts in sidebar
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }, 300);
      setClickTimeout(timeout);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const toggleEmojiPicker = () => {
    setEmojiPickerOpen(!emojiPickerOpen);
  };

  const loadUsersWithNewMessages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/messages/users-with-unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const userIds = data.userIds || data;
        setUsersWithNewMessages(new Set(userIds));
      }
    } catch (error) {
      console.error('Error loading users with new messages:', error);
    }
  };

  const loadMessagesForUser = async (user: User) => {
    try {
      setLoading(true);
      const response = await messagesApi.getMessages(user._id);
      setMessages(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="chat-container">Please log in to use chat</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h2>Messages</h2>
        {loading && users.length === 0 && <div className="loading">Loading users...</div>}
        {users.map(user => (
          <div 
            key={user._id}
            className={`chat-user ${selectedUser?._id === user._id ? 'selected' : ''} ${usersWithNewMessages.has(user._id) ? 'has-new-messages' : ''}`}
            onClick={(e) => handleUserClick(user)}
          >
            <div onClick={(e) => handleAvatarClick(user, e)}>
              <UserAvatar
                avatarUrl={user.avatarUrl}
                username={user.username}
                userId={user._id}
                size={48}
                className="chat-user-avatar"
              />
            </div>
            <div className="chat-user-info">
              <div className="chat-user-name" onClick={() => handleUserClick(user)}>
                {user.username}
              </div>
              <div className="chat-user-fullname">{user.fullName}</div>
            </div>
            {usersWithNewMessages.has(user._id) && (
              <div className="new-message-indicator"></div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-main">
        <div className="chat-header">
          {selectedUser ? (
            <div className="chat-header-info">
              <div onClick={(e) => handleAvatarClick(selectedUser, e)}>
                <UserAvatar
                  avatarUrl={selectedUser.avatarUrl}
                  username={selectedUser.username}
                  userId={selectedUser._id}
                  size={40}
                  className="chat-header-avatar"
                />
              </div>
              <div>
                <div className="chat-header-username" onClick={() => handleUserClick(selectedUser)}>
                  <strong>{selectedUser.username}</strong>
                </div>
                <div className="chat-header-fullname">{selectedUser.fullName}</div>
              </div>
            </div>
          ) : (
            'Select a user to start chatting'
          )}
        </div>

        <div className="chat-messages">
          {loading && messages.length === 0 && selectedUser && (
            <div className="loading">Loading messages...</div>
          )}
          {messages.map((msg, index) => {
            const isFromMe = msg.from._id === currentUser._id;
            
            return (
              <div key={index} className={`chat-message ${isFromMe ? 'own-message' : 'other-message'}`}>
                <div className="chat-message-content">
                  <span className="chat-message-text">{msg.text}</span>
                  <span className="chat-message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="chat-error">{error}</div>}

        <div className="chat-input">
          <input
            value={message}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && !e.shiftKey && !sending) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={selectedUser ? "Write a message..." : "Select a user to start chatting"}
            disabled={!selectedUser}
            maxLength={500}
          />
          <button 
            type="button"
            className="emoji-button"
            onClick={toggleEmojiPicker}
            disabled={!selectedUser}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          <button 
            onClick={sendMessage} 
            disabled={!selectedUser || !message.trim() || sending}
            className="send-button"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {emojiPickerOpen && (
          <EmojiPicker
            isOpen={true}
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setEmojiPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;