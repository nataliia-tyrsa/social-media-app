import { ReactNode } from 'react';
import styles from './SlidePanel.module.css';

interface SlidePanelProps {
  title: string;
  isOpen: boolean;
  children: ReactNode;
  onClose: () => void;
}

export default function SlidePanel({ title, isOpen, children, onClose }: SlidePanelProps) {
  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.header}>
        <h2>{title}</h2>
      </div>
      <div className={styles.content}>
        <div className={styles.searchBox}>
          <input type="text" className={styles.searchInput} placeholder="Search" />
        </div>
        <div className={styles.section}>
          <h3>Recent</h3>
          <div className={styles.userItem}>
            <img src="/path-to-avatar.jpg" alt="avatar" className={styles.avatar} />
            <span className={styles.username}>sashaa</span>
          </div>
        </div>
      </div>
    </div>
  );
}