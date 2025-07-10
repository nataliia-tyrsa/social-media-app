import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersApi, User } from '../../services/api';
import { UserAvatar } from '../../utils/userAvatar';
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
  const navigate = useNavigate();

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

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setUsers(allUsers.slice(0, 10)); // Show first 10 users when no query
        return;
      }

      setLoading(true);
      try {
        const results = await usersApi.searchUsers(query.trim());
        setUsers(results);
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [query, allUsers]);

  const handleUserClick = (userId: string) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

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
                  onClick={(e) => {
                    e.preventDefault();
                    handleUserClick(user._id);
                  }}
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    username={user.username}
                    userId={user._id}
                    size={48}
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