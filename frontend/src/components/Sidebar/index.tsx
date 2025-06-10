import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  PlusSquare, 
  LogOut,
  Compass
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { usersApi, notificationsApi, messagesApi } from '../../services/api';
import logo from '../../assets/logo.svg';
import styles from './Sidebar.module.css';

interface SearchUser {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow';
  from: {
    _id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  read: boolean;
  createdAt: string;
  post?: {
    _id: string;
    imageUrl?: string;
  };
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuthStore();
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'search' | 'notifications' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState({
    notifications: 0,
    messages: 0
  });

  // Real data fetching for notifications and messages
  useEffect(() => {
    const fetchNotificationsAndMessages = async () => {
      if (!currentUser) return;
      
      try {
        const [realNotifications, unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
          notificationsApi.getNotifications().catch(() => []),
          notificationsApi.getUnreadCount().catch(() => 0),
          messagesApi.getUnreadCount().catch(() => 0)
        ]);
        
        setNotifications(realNotifications);
        setUnreadCounts({
          notifications: unreadNotificationsCount,
          messages: unreadMessagesCount
        });
      } catch (error) {
        console.error('Error fetching notifications/messages:', error);
        setNotifications([]);
        setUnreadCounts({
          notifications: 0,
          messages: 0
        });
      }
    };

    fetchNotificationsAndMessages();
    
    const interval = setInterval(fetchNotificationsAndMessages, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Search functionality
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim()) {
        try {
          const results = await usersApi.searchUsers(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside sidebar and dropdowns
      if (activeDropdown && 
          !target.closest(`.${styles.sidebar}`) && 
          !target.closest(`.${styles.dropdownSidebar}`)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeDropdown]);

  const handleDropdownToggle = (dropdown: 'search' | 'notifications') => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleNavClick = () => {
    // Close any open dropdowns when navigating
    setActiveDropdown(null);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    setActiveDropdown(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await notificationsApi.markAsRead(notification._id);
        
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        
        setUnreadCounts(prev => ({
          ...prev,
          notifications: Math.max(0, prev.notifications - 1)
        }));
      }
      
      if (notification.post) {
        navigate('/');
      } else if (notification.type === 'follow') {
        navigate(`/profile/${notification.from._id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
    
    setActiveDropdown(null);
  };

  const handleLogout = () => {
    setActiveDropdown(null); // Close any open dropdowns
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.from.username} liked your photo`;
      case 'comment':
        return `${notification.from.username} commented on your photo`;
      case 'follow':
        return `${notification.from.username} started following you`;
      default:
        return 'New notification';
    }
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return `${Math.floor(diffInHours / 24)}d`;
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/notifications', icon: Heart, label: 'Notifications' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
  ];

  return (
    <>
      <nav className={styles.sidebar}>
        <Link to="/" className={styles.logo} onClick={handleNavClick}>
          <img src={logo} alt="ICHGRAM" />
        </Link>
        
        <div className={styles.nav}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <div key={path} className={styles.navItemWrapper}>
              {path === '/search' ? (
                <button
                  onClick={() => handleDropdownToggle('search')}
                  className={`${styles.navItem} ${activeDropdown === 'search' ? styles.active : ''}`}
                >
                  <Icon className={styles.icon} />
                  <span className={styles.navText}>{label}</span>
                </button>
              ) : path === '/notifications' ? (
                <button
                  onClick={() => handleDropdownToggle('notifications')}
                  className={`${styles.navItem} ${activeDropdown === 'notifications' ? styles.active : ''}`}
                >
                  <Icon className={styles.icon} />
                  <span className={styles.navText}>{label}</span>
                  {unreadCounts.notifications > 0 && (
                    <span className={styles.badge}>{unreadCounts.notifications}</span>
                  )}
                </button>
              ) : path === '/messages' ? (
                <Link
                  to={path}
                  className={`${styles.navItem} ${location.pathname === path ? styles.active : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon className={styles.icon} />
                  <span className={styles.navText}>{label}</span>
                  {unreadCounts.messages > 0 && (
                    <span className={styles.badge}>{unreadCounts.messages}</span>
                  )}
                </Link>
              ) : (
                <Link
                  to={path}
                  className={`${styles.navItem} ${location.pathname === path ? styles.active : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon className={styles.icon} />
                  <span className={styles.navText}>{label}</span>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className={styles.profileSection}>
          <Link
            to="/profile"
            className={`${styles.profileItem} ${location.pathname === '/profile' ? styles.active : ''}`}
            onClick={handleNavClick}
          >
            <img 
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'} 
              alt="profile" 
              className={styles.profileAvatar}
            />
            <span className={styles.navText}>Profile</span>
          </Link>
        </div>

        <div className={styles.logoutSection}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut className={styles.icon} />
            <span className={styles.navText}>Logout</span>
          </button>
        </div>
      </nav>

      {/* Search Dropdown */}
      <div className={`${styles.dropdownSidebar} ${activeDropdown === 'search' ? styles.open : ''}`}>
        <div className={styles.dropdownHeader}>
          <h3>Search</h3>
        </div>
        <div className={styles.dropdownContent}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.searchResults}>
            {searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                className={styles.userItem}
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'}
                  alt={user.username}
                  className={styles.userAvatar}
                />
                <div className={styles.userInfo}>
                  <h4>{user.username}</h4>
                  <p>{user.fullName}</p>
                </div>
              </div>
            ))}
            {searchQuery && searchResults.length === 0 && (
              <p style={{ padding: '20px', color: '#8e8e8e', textAlign: 'center' }}>
                No users found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      <div className={`${styles.dropdownSidebar} ${activeDropdown === 'notifications' ? styles.open : ''}`}>
        <div className={styles.dropdownHeader}>
          <h3>Notifications</h3>
        </div>
        <div className={styles.dropdownContent}>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
            >
              <img
                src={notification.from.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'}
                alt={notification.from.username}
                className={styles.userAvatar}
              />
              <div className={styles.notificationContent}>
                <p className={styles.notificationText}>
                  {getNotificationText(notification)}
                </p>
                <p className={styles.notificationTime}>
                  {formatTime(notification.createdAt)}
                </p>
              </div>
              {notification.post?.imageUrl && (
                <img
                  src={notification.post.imageUrl}
                  alt="post"
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                />
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <p style={{ padding: '40px 20px', color: '#8e8e8e', textAlign: 'center' }}>
              No notifications yet
            </p>
          )}
        </div>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h3>Logout Confirmation</h3>
            <p>Are you sure you want to logout?</p>
            <div className={styles.confirmButtons}>
              <button onClick={confirmLogout} className={styles.confirmButton}>
                Yes, Logout
              </button>
              <button onClick={cancelLogout} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;