import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, User } from '../../services/api';
import styles from './SearchPanel.module.css';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchPanel = ({ isOpen, onClose }: SearchPanelProps) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all users once when panel opens
  useEffect(() => {
    if (isOpen && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [isOpen]);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const results = await usersApi.getAllUsers();
      setAllUsers(results);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on query with smart matching
  const filteredUsers = useMemo(() => {
    if (!query.trim()) {
      return allUsers.slice(0, 10); // Show first 10 users when no query
    }

    const searchTerm = query.toLowerCase().trim();
    
    return allUsers
      .filter(user => {
        const username = user.username.toLowerCase();
        const fullName = user.fullName.toLowerCase();
        
        // Exact matches first
        if (username.startsWith(searchTerm) || fullName.startsWith(searchTerm)) {
          return true;
        }
        
        // Split name parts for matching
        const nameParts = fullName.split(' ');
        const usernameMatch = username.includes(searchTerm);
        const nameMatch = nameParts.some(part => part.startsWith(searchTerm));
        
        return usernameMatch || nameMatch;
      })
      .sort((a, b) => {
        const aUsername = a.username.toLowerCase();
        const aFullName = a.fullName.toLowerCase();
        const bUsername = b.username.toLowerCase();
        const bFullName = b.fullName.toLowerCase();
        
        // Prioritize exact matches at the beginning
        const aUsernameStarts = aUsername.startsWith(searchTerm);
        const bUsernameStarts = bUsername.startsWith(searchTerm);
        const aNameStarts = aFullName.startsWith(searchTerm);
        const bNameStarts = bFullName.startsWith(searchTerm);
        
        if (aUsernameStarts && !bUsernameStarts) return -1;
        if (!aUsernameStarts && bUsernameStarts) return 1;
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;
        
        // Then alphabetical order
        return aUsername.localeCompare(bUsername);
      })
      .slice(0, 20); // Limit to 20 results
  }, [query, allUsers]);

  // Update users when filtered results change
  useEffect(() => {
    setUsers(filteredUsers);
  }, [filteredUsers]);

  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.header}>
        <h2>Search</h2>
        <button onClick={onClose} className={styles.closeButton}>×</button>
      </div>
      <div className={styles.content}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search users by name or username..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className={styles.clearButton}
            >
              ×
            </button>
          )}
        </div>
        
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>Loading users...</span>
          </div>
        )}
        
        <div className={styles.results}>
          {!loading && (
            <>
              {query && (
                <div className={styles.resultsHeader}>
                  {users.length} user{users.length !== 1 ? 's' : ''} found
                </div>
              )}
              
              {users.map(user => (
                <Link 
                  key={user._id} 
                  to={`/profile/${user._id}`} 
                  className={styles.userItem}
                  onClick={onClose}
                >
                  <img 
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'} 
                    alt="avatar" 
                    className={styles.avatar} 
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.username}>{user.username}</span>
                    <span className={styles.fullName}>{user.fullName}</span>
                    {user.bio && <span className={styles.bio}>{user.bio}</span>}
                  </div>
                  <svg className={styles.arrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </Link>
              ))}
              
              {query && !loading && users.length === 0 && (
                <div className={styles.noResults}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                  </svg>
                  <p>No users found for "{query}"</p>
                  <span>Try a different search term</span>
                </div>
              )}
              
              {!query && users.length > 0 && (
                <div className={styles.suggestedHeader}>
                  Suggested for you
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPanel; 