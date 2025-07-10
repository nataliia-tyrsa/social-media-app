import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { notificationsApi } from '../../services/api';
import styles from './UserMenu.module.css';
import { UserAvatar } from '../../utils/userAvatar';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNotificationsClick = () => {
    setUnreadCount(0); 
    navigate('/notifications');
    setIsOpen(false);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('Вы уверены, что хотите выйти?');
    if (confirmLogout) {
      logout();
      navigate('/');
    }
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className={styles.userMenu}>
      <div className={styles.actions}>
        <button 
          className={styles.notificationButton}
          onClick={handleNotificationsClick}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={styles.notificationBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button 
          className={styles.trigger}
          onClick={() => setIsOpen(!isOpen)}
        >
          <UserAvatar
            avatarUrl={user.avatarUrl}
            username={user.username}
            userId={user._id}
            size={32}
            className={styles.avatar}
          />
          <span className={styles.username}>{user.username}</span>
          <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <Link 
            to="/profile" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            <User size={18} />
            <span>Профиль</span>
          </Link>
          
          <Link 
            to="/edit-profile" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            <User size={18} />
            <span>Редактировать профиль</span>
          </Link>
          
          <div className={styles.divider} />
          
          <button 
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
        </div>
      )}
      
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default UserMenu; 
