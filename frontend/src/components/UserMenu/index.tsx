import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import styles from './UserMenu.module.css';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={user.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'} 
          alt="Profile" 
          className={styles.avatar}
        />
        <span className={styles.username}>{user.username}</span>
        <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`} />
      </button>

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
            <Settings size={18} />
            <span>Настройки</span>
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