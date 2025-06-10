import React, { useEffect, useState, ChangeEvent, KeyboardEvent, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { usersApi, messagesApi, User, Message } from '../../services/api';
import useAuthStore from '../../store/authStore';
import './Chat.css';

const Chat = () => {
  const currentUser = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token && currentUser) {
      // Initialize socket connection
      const newSocket = io('http://localhost:3000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
      });

      newSocket.on('chat message', (msg: any) => {
        if (selectedUser && (msg.from._id === selectedUser._id || msg.to._id === selectedUser._id)) {
          setMessages(prev => [...prev, msg]);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      setSocket(newSocket);
      fetchUsers();

      return () => {
        newSocket.disconnect();
      };
    }
  }, [currentUser, token]);

  useEffect(() => {
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
    if (!message.trim() || !selectedUser || !currentUser || !socket) return;
    
    try {
      const newMessage = await messagesApi.sendMessage(selectedUser._id, message.trim());
      
      // Emit to socket for real-time updates
      socket.emit('chat message', newMessage);
      
      // Add to local state
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setMessages([]);
    setError('');
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
            className={`chat-user ${selectedUser?._id === user._id ? 'selected' : ''}`}
            onClick={() => handleUserSelect(user)}
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'}
              alt="avatar"
              className="chat-user-avatar"
            />
            <div className="chat-user-info">
              <div className="chat-user-name">{user.username}</div>
              <div className="chat-user-fullname">{user.fullName}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-main">
        <div className="chat-header">
          {selectedUser ? (
            <div className="chat-header-info">
              <img
                src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'}
                alt="avatar"
                className="chat-header-avatar"
              />
              <div>
                <strong>{selectedUser.username}</strong>
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
            const senderAvatar = isFromMe 
              ? (currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face')
              : (selectedUser?.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face');
            
            return (
              <div
                key={index}
                className={`chat-bubble ${isFromMe ? 'me' : 'them'}`}
              >
                <img
                  src={senderAvatar}
                  alt="avatar"
                  className="chat-message-avatar"
                />
                <div className="chat-bubble-wrapper">
                  <div className="chat-bubble-content">{msg.text}</div>
                  <div className="chat-bubble-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
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
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={selectedUser ? "Write a message..." : "Select a user to start chatting"}
            disabled={!selectedUser}
            maxLength={500}
          />
          <button 
            onClick={sendMessage} 
            disabled={!selectedUser || !message.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;